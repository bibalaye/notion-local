import { NextResponse } from "next/server";
import { streamCompletion } from "@notoflow/ai";

export async function POST(req: Request) {
  try {
    const { prompt, type, context, targetLang } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt requis" }, { status: 400 });
    }

    let systemPrompt = "Tu es un assistant de rédaction IA intégré à NotoFlow. Réponds directement en Markdown fluide et moderne, sans bavardage superflu.";

    switch (type) {
      case "improve":
        systemPrompt = "Améliore le style, le ton et la clarté du texte fourni. Reste professionnel.";
        break;
      case "summarize":
        systemPrompt = "Résume le texte fourni de manière très concise, sous forme de liste à puces claires.";
        break;
      case "expand":
        systemPrompt = "Développe le texte fourni en y ajoutant des détails pertinents et de la structure.";
        break;
      case "translate":
        systemPrompt = `Traduis le texte fourni en ${targetLang || "anglais"} de manière naturelle et précise.`;
        break;
      case "fix":
        systemPrompt = "Corrige uniquement les fautes d'orthographe, de syntaxe et de grammaire du texte fourni, sans en modifier le sens.";
        break;
      case "brainstorm":
        systemPrompt = "Génère une liste d'idées créatives et structurées basées sur le sujet fourni.";
        break;
      default:
        if (context) {
          systemPrompt += ` Contexte du document actuel: "${context}"`;
        }
        break;
    }

    const encoder = new TextEncoder();
    const generator = streamCompletion(prompt, systemPrompt);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of generator) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (e: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: e.message })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
