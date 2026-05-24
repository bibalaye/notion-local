"use server";

import { db } from "@notoflow/database";
import { getOrCreateProfile } from "@/lib/supabase/auth-helper";
import { revalidatePath } from "next/cache";

const textColorMap: Record<string, string> = {
  gray: "#8b949e",
  brown: "#9f6b53",
  orange: "#d97706",
  yellow: "#dfab01",
  green: "#2ea043",
  blue: "#58a6ff",
  purple: "#bc8cff",
  pink: "#ff7b72",
  red: "#f85149",
};

const highlightColorMap: Record<string, string> = {
  gray_background: "#eff1f3",
  brown_background: "#f4eeee",
  orange_background: "#fbecdd",
  yellow_background: "#fbf3db",
  green_background: "#edf7ec",
  blue_background: "#e7f3f8",
  purple_background: "#f6f0fa",
  pink_background: "#faf0f5",
  red_background: "#fdebeb",
};

async function convertImageToDataUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) return url;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = res.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch (error) {
    console.error("Error converting image to data URL:", error);
    return url;
  }
}

function getNotionTitle(item: any): string {
  if (item.object === "database") {
    return item.title?.map((t: any) => t.plain_text).join("") || "Sans titre";
  }
  if (item.object === "page") {
    const properties = item.properties || {};
    for (const key of Object.keys(properties)) {
      if (properties[key]?.type === "title") {
        return properties[key].title?.map((t: any) => t.plain_text).join("") || "Sans titre";
      }
    }
  }
  return "Sans titre";
}

function parseRichText(richTextArray: any[]) {
  if (!richTextArray || richTextArray.length === 0) return [];

  return richTextArray.map((rt: any) => {
    const textNode: any = {
      type: "text",
      text: rt.plain_text || "",
    };

    const marks: any[] = [];
    if (rt.annotations?.bold) marks.push({ type: "bold" });
    if (rt.annotations?.italic) marks.push({ type: "italic" });
    if (rt.annotations?.underline) marks.push({ type: "underline" });
    if (rt.annotations?.strikethrough) marks.push({ type: "strike" });
    if (rt.annotations?.code) marks.push({ type: "code" });

    if (rt.href) {
      marks.push({
        type: "link",
        attrs: { href: rt.href, target: "_blank" },
      });
    }

    if (rt.annotations?.color && rt.annotations.color !== "default") {
      const color = rt.annotations.color;
      if (color.endsWith("_background")) {
        const bgHex = highlightColorMap[color];
        if (bgHex) {
          marks.push({
            type: "highlight",
            attrs: { color: bgHex },
          });
        }
      } else {
        const textHex = textColorMap[color];
        if (textHex) {
          marks.push({
            type: "textStyle",
            attrs: { color: textHex },
          });
        }
      }
    }

    if (marks.length > 0) {
      textNode.marks = marks;
    }

    return textNode;
  });
}

async function getNotionBlockChildren(blockId: string, token: string): Promise<any[]> {
  let results: any[] = [];
  let cursor: string | undefined = undefined;

  try {
    do {
      const url = new URL(`https://api.notion.com/v1/blocks/${blockId}/children`);
      url.searchParams.set("page_size", "100");
      if (cursor) {
        url.searchParams.set("start_cursor", cursor);
      }

      const res = await fetch(url.toString(), {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Notion-Version": "2022-06-28",
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Notion API error children for ${blockId}:`, errorText);
        break;
      }

      const data = await res.json();
      results = [...results, ...data.results];
      cursor = data.has_more ? data.next_cursor : undefined;
    } while (cursor);
  } catch (error) {
    console.error(`Error in getNotionBlockChildren for ${blockId}:`, error);
  }

  return results;
}

async function processBlocks(rawBlocks: any[], token: string): Promise<any[]> {
  const converted: any[] = [];
  for (const block of rawBlocks) {
    try {
      const node = await translateBlock(block, token);
      if (node) {
        converted.push(node);
      }
    } catch (e) {
      console.error(`Error processing block ${block.id} (type ${block.type}):`, e);
    }
  }
  return converted;
}

async function translateBlock(block: any, token: string): Promise<any | null> {
  const type = block.type;

  let childrenNodes: any[] = [];
  if (block.has_children && type !== "child_page") {
    const rawChildren = await getNotionBlockChildren(block.id, token);
    childrenNodes = await processBlocks(rawChildren, token);
  }

  switch (type) {
    case "paragraph":
      return {
        type: "paragraph",
        content: parseRichText(block.paragraph.rich_text),
      };
    case "heading_1":
      return {
        type: "heading",
        attrs: { level: 1 },
        content: parseRichText(block.heading_1.rich_text),
      };
    case "heading_2":
      return {
        type: "heading",
        attrs: { level: 2 },
        content: parseRichText(block.heading_2.rich_text),
      };
    case "heading_3":
      return {
        type: "heading",
        attrs: { level: 3 },
        content: parseRichText(block.heading_3.rich_text),
      };
    case "bulleted_list_item":
      return {
        type: "_bullet_item",
        content: [
          {
            type: "paragraph",
            content: parseRichText(block.bulleted_list_item.rich_text),
          },
          ...childrenNodes,
        ],
      };
    case "numbered_list_item":
      return {
        type: "_ordered_item",
        content: [
          {
            type: "paragraph",
            content: parseRichText(block.numbered_list_item.rich_text),
          },
          ...childrenNodes,
        ],
      };
    case "to_do":
      return {
        type: "_todo_item",
        attrs: { checked: block.to_do.checked },
        content: [
          {
            type: "paragraph",
            content: parseRichText(block.to_do.rich_text),
          },
          ...childrenNodes,
        ],
      };
    case "code":
      return {
        type: "codeBlock",
        attrs: { language: block.code.language || "javascript" },
        content:
          block.code.rich_text?.length > 0
            ? [{ type: "text", text: block.code.rich_text.map((r: any) => r.plain_text).join("") }]
            : [],
      };
    case "quote":
      return {
        type: "blockquote",
        content: [
          {
            type: "paragraph",
            content: parseRichText(block.quote.rich_text),
          },
          ...childrenNodes,
        ],
      };
    case "divider":
      return {
        type: "horizontalRule",
      };
    case "image": {
      let src = block.image.file?.url || block.image.external?.url;
      if (!src) return null;
      if (block.image.file?.url) {
        src = await convertImageToDataUrl(block.image.file.url);
      }
      return {
        type: "image",
        attrs: { src },
      };
    }
    case "video": {
      const src = block.video.external?.url || block.video.file?.url;
      if (src && (src.includes("youtube.com") || src.includes("youtu.be"))) {
        return {
          type: "youtube",
          attrs: { src },
        };
      }
      return null;
    }
    case "table": {
      return {
        type: "table",
        content: childrenNodes,
      };
    }
    case "table_row": {
      const cells = block.table_row.cells || [];
      const rowContent = cells.map((cell: any) => ({
        type: "tableCell",
        content: [{ type: "paragraph", content: parseRichText(cell) }],
      }));
      return {
        type: "tableRow",
        content: rowContent,
      };
    }
    case "synced_block":
    case "column_list":
    case "column":
    case "toggle":
      return {
        type: "_flat_container",
        content: [
          ...(block.toggle ? [{ type: "paragraph", content: parseRichText(block.toggle.rich_text) }] : []),
          ...childrenNodes,
        ],
      };
    case "callout": {
      return {
        type: "blockquote",
        content: [
          {
            type: "paragraph",
            content: parseRichText(block.callout.rich_text),
          },
        ],
      };
    }
    case "bookmark": {
      const url = block.bookmark?.url;
      if (!url) return null;
      return {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: `🔗 Signet : ${url}`,
            marks: [{ type: "link", attrs: { href: url, target: "_blank" } }],
          },
        ],
      };
    }
    case "pdf": {
      const url = block.pdf?.file?.url || block.pdf?.external?.url;
      if (!url) return null;
      return {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: `📎 Document PDF : ${url.split("/").pop()?.split("?")[0] || "PDF"}`,
            marks: [{ type: "link", attrs: { href: url, target: "_blank" } }],
          },
        ],
      };
    }
    case "file": {
      const url = block.file?.file?.url || block.file?.external?.url;
      if (!url) return null;
      return {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: `📎 Fichier joint : ${url.split("/").pop()?.split("?")[0] || "Fichier"}`,
            marks: [{ type: "link", attrs: { href: url, target: "_blank" } }],
          },
        ],
      };
    }
    case "embed": {
      const url = block.embed?.url;
      if (!url) return null;
      return {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: `🌐 Intégration : ${url}`,
            marks: [{ type: "link", attrs: { href: url, target: "_blank" } }],
          },
        ],
      };
    }
    default:
      return null;
  }
}

function groupAndFlattenBlocks(nodes: any[]): any[] {
  const result: any[] = [];
  let currentGroup: { type: string; items: any[] } | null = null;

  const flushGroup = () => {
    if (!currentGroup) return;
    if (currentGroup.type === "bulletList") {
      result.push({
        type: "bulletList",
        content: currentGroup.items.map((item) => ({
          type: "listItem",
          content: groupAndFlattenBlocks(item.content),
        })),
      });
    } else if (currentGroup.type === "orderedList") {
      result.push({
        type: "orderedList",
        content: currentGroup.items.map((item) => ({
          type: "listItem",
          content: groupAndFlattenBlocks(item.content),
        })),
      });
    } else if (currentGroup.type === "taskList") {
      result.push({
        type: "taskList",
        content: currentGroup.items.map((item) => ({
          type: "taskItem",
          attrs: { checked: item.attrs?.checked || false },
          content: groupAndFlattenBlocks(item.content),
        })),
      });
    }
    currentGroup = null;
  };

  for (const node of nodes) {
    if (!node) continue;

    if (node.type === "_flat_container") {
      flushGroup();
      if (node.content) {
        result.push(...groupAndFlattenBlocks(node.content));
      }
      continue;
    }

    if (node.type === "_bullet_item") {
      if (currentGroup && currentGroup.type !== "bulletList") {
        flushGroup();
      }
      if (!currentGroup) {
        currentGroup = { type: "bulletList", items: [] };
      }
      currentGroup.items.push(node);
    } else if (node.type === "_ordered_item") {
      if (currentGroup && currentGroup.type !== "orderedList") {
        flushGroup();
      }
      if (!currentGroup) {
        currentGroup = { type: "orderedList", items: [] };
      }
      currentGroup.items.push(node);
    } else if (node.type === "_todo_item") {
      if (currentGroup && currentGroup.type !== "taskList") {
        flushGroup();
      }
      if (!currentGroup) {
        currentGroup = { type: "taskList", items: [] };
      }
      currentGroup.items.push(node);
    } else {
      flushGroup();
      if (node.content) {
        node.content = groupAndFlattenBlocks(node.content);
      }
      result.push(node);
    }
  }

  flushGroup();
  return result;
}

export async function searchNotionPages(token: string) {
  if (!token) throw new Error("Token Notion manquant.");

  const res = await fetch("https://api.notion.com/v1/search", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filter: {
        value: "page",
        property: "object",
      },
      page_size: 50,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur d'authentification Notion ou de requête : ${text}`);
  }

  const data = await res.json();
  return data.results.map((item: any) => {
    const title = getNotionTitle(item);
    return {
      id: item.id,
      title,
      object: item.object,
      icon: item.icon?.type === "emoji" ? item.icon.emoji : null,
      updatedAt: item.last_edited_time,
    };
  });
}

export async function importNotionPage(
  workspaceId: string,
  pageId: string,
  token: string,
  parentId?: string | null,
) {
  const profile = await getOrCreateProfile();
  if (!profile) throw new Error("Non autorisé.");

  const membership = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: profile.id, workspaceId } },
  });
  if (!membership || !["OWNER", "ADMIN", "EDITOR"].includes(membership.role)) {
    throw new Error("Accès refusé ou insuffisant.");
  }

  const resPage = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
    },
  });

  if (!resPage.ok) {
    const errorText = await resPage.text();
    throw new Error(`Erreur lors de la récupération de la page Notion : ${errorText}`);
  }

  const notionPage = await resPage.json();
  const title = getNotionTitle(notionPage);

  let icon: string | null = null;
  if (notionPage.icon && notionPage.icon.type === "emoji") {
    icon = notionPage.icon.emoji;
  }

  let coverUrl: string | null = null;
  if (notionPage.cover) {
    coverUrl = notionPage.cover.external?.url || notionPage.cover.file?.url || null;
    if (notionPage.cover.file?.url) {
      coverUrl = await convertImageToDataUrl(notionPage.cover.file.url);
    }
  }

  const rawBlocks = await getNotionBlockChildren(pageId, token);
  const convertedBlocks = await processBlocks(rawBlocks, token);
  const finalContentNodes = groupAndFlattenBlocks(convertedBlocks);
  const tiptapJson = {
    type: "doc",
    content: finalContentNodes.length > 0 ? finalContentNodes : [{ type: "paragraph" }],
  };

  const childPageBlocks = rawBlocks.filter((b: any) => b.type === "child_page");

  const page = await db.page.create({
    data: {
      workspaceId,
      authorId: profile.id,
      parentId: parentId || null,
      title,
      icon,
      coverUrl,
      content: tiptapJson as any,
    },
  });

  for (const block of childPageBlocks) {
    try {
      await importNotionPage(workspaceId, block.id, token, page.id);
    } catch (e) {
      console.error(`Erreur lors de l'importation de la sous-page ${block.id}:`, e);
    }
  }

  revalidatePath("/app", "layout");
  return page;
}
