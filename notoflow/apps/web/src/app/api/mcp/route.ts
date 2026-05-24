import { NextRequest, NextResponse } from "next/server";
import { db } from "@notoflow/database";
import crypto from "crypto";

// Global map of active SSE controllers, persisted across dev-mode reloads
const sseSessions = (global as any).sseSessions || new Map<string, ReadableStreamDefaultController>();
if (process.env.NODE_ENV !== "production") {
  (global as any).sseSessions = sseSessions;
}

// Convert TipTap JSON to plain text for AI clients
function convertTipTapToText(node: any): string {
  if (!node) return "";
  if (typeof node === "string") {
    try {
      return convertTipTapToText(JSON.parse(node));
    } catch {
      return "";
    }
  }

  if (node.type === "text") {
    return node.text || "";
  }

  let text = "";
  if (node.content && Array.isArray(node.content)) {
    text = node.content.map(convertTipTapToText).join("");
  }

  if (node.type === "paragraph" || node.type === "heading") {
    return text + "\n";
  }
  if (node.type === "listItem" || node.type === "taskItem") {
    return "- " + text + "\n";
  }
  if (node.type === "blockquote") {
    return "> " + text + "\n";
  }

  return text;
}

// Convert plain text to TipTap JSON format
function convertTextToTipTap(text: string) {
  if (!text) return { type: "doc", content: [{ type: "paragraph" }] };
  const paragraphs = text.split("\n");
  return {
    type: "doc",
    content: paragraphs.map((p) => ({
      type: "paragraph",
      content: p.trim() !== "" ? [{ type: "text", text: p }] : [],
    })),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return new NextResponse("Token requis.", { status: 401 });
  }

  // Validate API key
  const apiKey = await db.apiKey.findUnique({
    where: { key: token },
  });

  if (!apiKey) {
    return new NextResponse("Token invalide ou non autorisé.", { status: 401 });
  }

  const sessionId = crypto.randomUUID();

  const stream = new ReadableStream({
    start(controller) {
      // Store session
      sseSessions.set(sessionId, controller);

      // Immediately send the endpoint event with the URI to POST client requests to
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const postUrl = `${appUrl}/api/mcp?sessionId=${sessionId}&token=${token}`;

      controller.enqueue(`event: endpoint\ndata: ${postUrl}\n\n`);

      // Heartbeats
      const intervalId = setInterval(() => {
        try {
          controller.enqueue(`:\n\n`);
        } catch {
          clearInterval(intervalId);
          sseSessions.delete(sessionId);
        }
      }, 15000);

      // Cleanup
      request.signal.addEventListener("abort", () => {
        clearInterval(intervalId);
        sseSessions.delete(sessionId);
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const token = searchParams.get("token");

  if (!token || !sessionId) {
    return new NextResponse("Paramètres token ou sessionId manquants.", { status: 400 });
  }

  // Validate API key
  const apiKey = await db.apiKey.findUnique({
    where: { key: token },
  });

  if (!apiKey) {
    return new NextResponse("Token invalide.", { status: 401 });
  }

  // Retrieve the SSE stream controller
  const controller = sseSessions.get(sessionId);
  if (!controller) {
    return new NextResponse("Session expirée ou introuvable.", { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch (err) {
    return new NextResponse("Format JSON invalide.", { status: 400 });
  }

  const { jsonrpc, id, method, params } = body;
  if (jsonrpc !== "2.0") {
    return new NextResponse("Seul le protocole JSON-RPC 2.0 est supporté.", { status: 400 });
  }

  let result: any = null;
  let error: any = null;

  try {
    switch (method) {
      case "initialize":
        result = {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: "notoflow-mcp",
            version: "1.0.0",
          },
        };
        break;

      case "tools/list":
        result = {
          tools: [
            {
              name: "list_pages",
              description: "Lister toutes les pages du workspace NotoFlow.",
              inputSchema: {
                type: "object",
                properties: {},
              },
            },
            {
              name: "get_page",
              description: "Lire le contenu textuel brut et le titre d'une page NotoFlow.",
              inputSchema: {
                type: "object",
                properties: {
                  pageId: {
                    type: "string",
                    description: "L'identifiant unique de la page.",
                  },
                },
                required: ["pageId"],
              },
            },
            {
              name: "create_page",
              description: "Créer une nouvelle page dans le workspace.",
              inputSchema: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "Le titre de la page.",
                  },
                  content: {
                    type: "string",
                    description: "Le contenu initial de la page (texte brut).",
                  },
                  parentId: {
                    type: "string",
                    description: "ID optionnel de la page parente.",
                  },
                },
                required: ["title"],
              },
            },
            {
              name: "update_page",
              description: "Modifier le contenu ou le titre d'une page existante.",
              inputSchema: {
                type: "object",
                properties: {
                  pageId: {
                    type: "string",
                    description: "L'ID de la page à modifier.",
                  },
                  title: {
                    type: "string",
                    description: "Le nouveau titre de la page (optionnel).",
                  },
                  content: {
                    type: "string",
                    description: "Le nouveau contenu textuel (optionnel).",
                  },
                },
                required: ["pageId"],
              },
            },
            {
              name: "delete_page",
              description: "Supprimer (archiver) une page.",
              inputSchema: {
                type: "object",
                properties: {
                  pageId: {
                    type: "string",
                    description: "L'ID de la page à archiver.",
                  },
                },
                required: ["pageId"],
              },
            },
          ],
        };
        break;

      case "tools/call": {
        const toolName = params?.name;
        const args = params?.arguments || {};

        if (toolName === "list_pages") {
          const pages = await db.page.findMany({
            where: { workspaceId: apiKey.workspaceId, isArchived: false },
            select: { id: true, title: true, parentId: true, updatedAt: true },
            orderBy: { position: "asc" },
          });
          result = {
            content: [
              {
                type: "text",
                text: JSON.stringify(pages, null, 2),
              },
            ],
            isError: false,
          };
        } else if (toolName === "get_page") {
          const page = await db.page.findFirst({
            where: { id: args.pageId, workspaceId: apiKey.workspaceId },
          });

          if (!page) {
            result = {
              content: [{ type: "text", text: `Erreur: Page introuvable.` }],
              isError: true,
            };
          } else {
            const plainText = convertTipTapToText(page.content);
            result = {
              content: [
                {
                  type: "text",
                  text: `Titre: ${page.title}\n\nContenu:\n${plainText}`,
                },
              ],
              isError: false,
            };
          }
        } else if (toolName === "create_page") {
          const page = await db.page.create({
            data: {
              workspaceId: apiKey.workspaceId,
              authorId: apiKey.userId,
              title: args.title || "Sans titre",
              content: convertTextToTipTap(args.content || "") as any,
              parentId: args.parentId || null,
            },
          });
          result = {
            content: [
              {
                type: "text",
                text: `Succès: Page créée avec succès (ID: ${page.id})`,
              },
            ],
            isError: false,
          };
        } else if (toolName === "update_page") {
          const page = await db.page.findFirst({
            where: { id: args.pageId, workspaceId: apiKey.workspaceId },
          });

          if (!page) {
            result = {
              content: [{ type: "text", text: `Erreur: Page introuvable.` }],
              isError: true,
            };
          } else {
            const dataToUpdate: any = {};
            if (args.title !== undefined) dataToUpdate.title = args.title;
            if (args.content !== undefined) dataToUpdate.content = convertTextToTipTap(args.content);

            await db.page.update({
              where: { id: args.pageId },
              data: {
                ...dataToUpdate,
                updatedAt: new Date(),
              },
            });

            result = {
              content: [{ type: "text", text: `Succès: Page mise à jour avec succès.` }],
              isError: false,
            };
          }
        } else if (toolName === "delete_page") {
          const page = await db.page.findFirst({
            where: { id: args.pageId, workspaceId: apiKey.workspaceId },
          });

          if (!page) {
            result = {
              content: [{ type: "text", text: `Erreur: Page introuvable.` }],
              isError: true,
            };
          } else {
            await db.page.update({
              where: { id: args.pageId },
              data: { isArchived: true },
            });
            result = {
              content: [{ type: "text", text: `Succès: Page archivée avec succès.` }],
              isError: false,
            };
          }
        } else {
          result = {
            content: [{ type: "text", text: `Erreur: Outil inconnu "${toolName}".` }],
            isError: true,
          };
        }
        break;
      }

      default:
        // Accept and ignore notifications (like initialized)
        if (id !== undefined) {
          error = {
            code: -32601,
            message: `Méthode non supportée : ${method}`,
          };
        }
        break;
    }
  } catch (err: any) {
    error = {
      code: -32603,
      message: err.message || "Erreur interne du serveur.",
    };
  }

  // Construct JSON-RPC response
  if (id !== undefined) {
    const jsonRpcResponse: any = { jsonrpc: "2.0", id };
    if (error) {
      jsonRpcResponse.error = error;
    } else {
      jsonRpcResponse.result = result;
    }

    try {
      controller.enqueue(`event: message\ndata: ${JSON.stringify(jsonRpcResponse)}\n\n`);
    } catch (err) {
      return new NextResponse("Erreur lors de l'envoi de la réponse SSE.", { status: 500 });
    }
  }

  return NextResponse.json({});
}
