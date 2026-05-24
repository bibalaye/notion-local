import { NextRequest, NextResponse } from "next/server";
import { db } from "@notoflow/database";
import crypto from "crypto";

// ============================================================================
// AUTH — Validation par hash SHA-256
// ============================================================================

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function authenticateToken(token: string) {
  const keyHash = hashToken(token);
  const apiKey = await db.apiKey.findUnique({ where: { keyHash } });

  if (!apiKey) return null;

  // Vérifier l'expiration
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

  // Mettre à jour lastUsedAt en arrière-plan
  db.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return apiKey;
}

// ============================================================================
// HELPERS — Conversion TipTap ↔ Texte brut
// ============================================================================

function convertTipTapToText(node: any): string {
  if (!node) return "";
  if (typeof node === "string") {
    try {
      return convertTipTapToText(JSON.parse(node));
    } catch {
      return "";
    }
  }
  if (node.type === "text") return node.text || "";

  let text = "";
  if (node.content && Array.isArray(node.content)) {
    text = node.content.map(convertTipTapToText).join("");
  }

  if (node.type === "paragraph" || node.type === "heading") return text + "\n";
  if (node.type === "listItem" || node.type === "taskItem") return "- " + text + "\n";
  if (node.type === "blockquote") return "> " + text + "\n";
  return text;
}

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

// ============================================================================
// MCP TOOLS — Les 5 outils exposés aux clients IA
// ============================================================================

const MCP_TOOLS = [
  {
    name: "list_pages",
    description: "Lister toutes les pages du workspace NotoFlow.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_page",
    description: "Lire le contenu textuel brut et le titre d'une page NotoFlow.",
    inputSchema: {
      type: "object" as const,
      properties: { pageId: { type: "string", description: "L'identifiant unique de la page." } },
      required: ["pageId"],
    },
  },
  {
    name: "create_page",
    description: "Créer une nouvelle page dans le workspace.",
    inputSchema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Le titre de la page." },
        content: { type: "string", description: "Le contenu initial de la page (texte brut)." },
        parentId: { type: "string", description: "ID optionnel de la page parente." },
      },
      required: ["title"],
    },
  },
  {
    name: "update_page",
    description: "Modifier le contenu ou le titre d'une page existante.",
    inputSchema: {
      type: "object" as const,
      properties: {
        pageId: { type: "string", description: "L'ID de la page à modifier." },
        title: { type: "string", description: "Le nouveau titre de la page (optionnel)." },
        content: { type: "string", description: "Le nouveau contenu textuel (optionnel)." },
      },
      required: ["pageId"],
    },
  },
  {
    name: "delete_page",
    description: "Supprimer (archiver) une page.",
    inputSchema: {
      type: "object" as const,
      properties: { pageId: { type: "string", description: "L'ID de la page à archiver." } },
      required: ["pageId"],
    },
  },
];

async function executeToolCall(
  toolName: string,
  args: Record<string, any>,
  workspaceId: string,
  userId: string,
) {
  switch (toolName) {
    case "list_pages": {
      const pages = await db.page.findMany({
        where: { workspaceId, isArchived: false },
        select: { id: true, title: true, parentId: true, updatedAt: true, icon: true },
        orderBy: { position: "asc" },
      });
      return { content: [{ type: "text", text: JSON.stringify(pages, null, 2) }], isError: false };
    }

    case "get_page": {
      const page = await db.page.findFirst({
        where: { id: args.pageId, workspaceId },
      });
      if (!page) {
        return { content: [{ type: "text", text: "Erreur: Page introuvable." }], isError: true };
      }
      const plainText = convertTipTapToText(page.content);
      return {
        content: [{ type: "text", text: `Titre: ${page.title}\n\nContenu:\n${plainText}` }],
        isError: false,
      };
    }

    case "create_page": {
      const page = await db.page.create({
        data: {
          workspaceId,
          authorId: userId,
          title: args.title || "Sans titre",
          content: convertTextToTipTap(args.content || "") as any,
          parentId: args.parentId || null,
        },
      });
      return {
        content: [{ type: "text", text: `Succès: Page créée avec succès (ID: ${page.id})` }],
        isError: false,
      };
    }

    case "update_page": {
      const page = await db.page.findFirst({
        where: { id: args.pageId, workspaceId },
      });
      if (!page) {
        return { content: [{ type: "text", text: "Erreur: Page introuvable." }], isError: true };
      }
      const dataToUpdate: any = {};
      if (args.title !== undefined) dataToUpdate.title = args.title;
      if (args.content !== undefined) dataToUpdate.content = convertTextToTipTap(args.content);

      await db.page.update({
        where: { id: args.pageId },
        data: { ...dataToUpdate, updatedAt: new Date() },
      });
      return {
        content: [{ type: "text", text: "Succès: Page mise à jour avec succès." }],
        isError: false,
      };
    }

    case "delete_page": {
      const page = await db.page.findFirst({
        where: { id: args.pageId, workspaceId },
      });
      if (!page) {
        return { content: [{ type: "text", text: "Erreur: Page introuvable." }], isError: true };
      }
      await db.page.update({
        where: { id: args.pageId },
        data: { isArchived: true },
      });
      return {
        content: [{ type: "text", text: "Succès: Page archivée avec succès." }],
        isError: false,
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Erreur: Outil inconnu "${toolName}".` }],
        isError: true,
      };
  }
}

// ============================================================================
// JSON-RPC — Traitement des requêtes du protocole MCP
// ============================================================================

async function processJsonRpc(
  method: string,
  params: any,
  workspaceId: string,
  userId: string,
): Promise<{ result?: any; error?: any }> {
  switch (method) {
    case "initialize":
      return {
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "notoflow-mcp", version: "1.0.0" },
        },
      };

    case "tools/list":
      return { result: { tools: MCP_TOOLS } };

    case "tools/call": {
      const toolName = params?.name;
      const args = params?.arguments || {};
      const toolResult = await executeToolCall(toolName, args, workspaceId, userId);
      return { result: toolResult };
    }

    default:
      return {
        error: { code: -32601, message: `Méthode non supportée : ${method}` },
      };
  }
}

// ============================================================================
// LEGACY SSE TRANSPORT — Pour Cursor / Windsurf (GET ouvre le stream, POST envoie)
// ============================================================================

const sseSessions = (global as any).__mcpSseSessions || new Map<string, ReadableStreamDefaultController>();
if (process.env.NODE_ENV !== "production") {
  (global as any).__mcpSseSessions = sseSessions;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return new NextResponse("Token requis.", { status: 401 });
  }

  const apiKey = await authenticateToken(token);
  if (!apiKey) {
    return new NextResponse("Token invalide ou expiré.", { status: 401 });
  }

  const sessionId = crypto.randomUUID();

  const stream = new ReadableStream({
    start(controller) {
      sseSessions.set(sessionId, controller);

      // Envoyer l'endpoint POST pour les clients SSE legacy
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const postUrl = `${appUrl}/api/mcp?sessionId=${sessionId}&token=${token}`;
      controller.enqueue(`event: endpoint\ndata: ${postUrl}\n\n`);

      // Heartbeat toutes les 15s
      const intervalId = setInterval(() => {
        try {
          controller.enqueue(`:\n\n`);
        } catch {
          clearInterval(intervalId);
          sseSessions.delete(sessionId);
        }
      }, 15000);

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
      Connection: "keep-alive",
    },
  });
}

// ============================================================================
// POST — Supporte DEUX transports :
//   1. Streamable HTTP (mcp-remote, Claude Desktop) : POST direct → réponse JSON
//   2. Legacy SSE : POST avec sessionId → pousse la réponse dans le stream SSE
// ============================================================================

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const sessionId = searchParams.get("sessionId");

  if (!token) {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32600, message: "Token requis." } },
      { status: 401 },
    );
  }

  const apiKey = await authenticateToken(token);
  if (!apiKey) {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32600, message: "Token invalide ou expiré." } },
      { status: 401 },
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32700, message: "JSON invalide." } },
      { status: 400 },
    );
  }

  const { id, method, params } = body;

  // ── Notifications (pas d'id) → accepter silencieusement ──
  if (id === undefined || id === null) {
    return new NextResponse(null, { status: 202 });
  }

  // ── Traitement JSON-RPC ──
  const { result, error } = await processJsonRpc(method, params, apiKey.workspaceId, apiKey.userId);

  const jsonRpcResponse: any = { jsonrpc: "2.0", id };
  if (error) {
    jsonRpcResponse.error = error;
  } else {
    jsonRpcResponse.result = result;
  }

  // ── Mode 1 : Streamable HTTP (pas de sessionId) → réponse JSON directe ──
  if (!sessionId) {
    return NextResponse.json(jsonRpcResponse);
  }

  // ── Mode 2 : Legacy SSE → pousser dans le stream ──
  const controller = sseSessions.get(sessionId);
  if (!controller) {
    return NextResponse.json(
      { jsonrpc: "2.0", id, error: { code: -32600, message: "Session SSE expirée." } },
      { status: 400 },
    );
  }

  try {
    controller.enqueue(`event: message\ndata: ${JSON.stringify(jsonRpcResponse)}\n\n`);
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", id, error: { code: -32603, message: "Erreur envoi SSE." } },
      { status: 500 },
    );
  }

  return NextResponse.json({});
}

// ============================================================================
// DELETE — Fermeture de session (Streamable HTTP spec)
// ============================================================================

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (sessionId && sseSessions.has(sessionId)) {
    sseSessions.delete(sessionId);
  }

  return new NextResponse(null, { status: 204 });
}
