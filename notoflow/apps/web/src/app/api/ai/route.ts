import { NextResponse } from "next/server";
import { streamCompletion } from "@notoflow/ai";

export async function POST(req: Request) {
  try {
    const { prompt, type, context, targetLang } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt requis" }, { status: 400 });
    }

    let systemPrompt = "Tu es un assistant de rédaction IA intégré à NotoFlow. Réponds directement en HTML fluide et moderne (n'inclus pas les balises html, body, head, juste le contenu), sans bavardage superflu.";

    switch (type) {
      case "improve":
        systemPrompt = "Tu es un assistant d'édition. Améliore le style, le ton et la clarté du texte fourni tout en conservant son sens original. Reste professionnel et réponds uniquement en HTML fluide.";
        break;
      case "summarize":
        systemPrompt = "Résume le texte fourni de manière très concise et structurée, sous forme de liste à puces HTML claires et élégantes.";
        break;
      case "expand":
        systemPrompt = "Développe le texte fourni en y ajoutant des détails pertinents, de la structure et des explications approfondies. Réponds uniquement en HTML structuré.";
        break;
      case "translate":
        systemPrompt = `Traduis le texte fourni en ${targetLang || "anglais"} de manière naturelle et précise, en conservant le formatage HTML s'il y en a. Réponds uniquement en HTML.`;
        break;
      case "fix":
        systemPrompt = "Corrige uniquement les fautes d'orthographe, de syntaxe et de grammaire du texte fourni, sans en modifier le sens. Conserve les balises HTML s'il y en a et renvoie le texte corrigé en HTML.";
        break;
      case "brainstorm":
        systemPrompt = "Génère une liste d'idées créatives, originales et structurées basées sur le sujet fourni. Formate le résultat en HTML avec des puces élégantes.";
        break;
      case "generate-page":
        systemPrompt = "Tu es un générateur de pages d'élite pour NotoFlow. Crée une page web magnifiquement mise en forme en HTML standard (n'utilise que les balises structurelles comme h1, h2, h3, p, ul, ol, li, blockquote, pre, code, table, tr, td, th). Ne mets aucun en-tête HTML, html, body ou head. Crée un document riche, structuré, professionnel et complet correspondant parfaitement au sujet demandé.";
        break;
      case "meeting":
        systemPrompt = "Tu es un assistant de réunion IA de premier ordre. Analyse les notes ou la transcription de réunion fournie. Rédige un compte-rendu professionnel structuré en HTML avec : 1) Un résumé exécutif clair en italique, 2) Une liste à puces des décisions clés prises, 3) Un grand tableau HTML récapitulatif des plans d'action (avec colonnes Tâche, Responsable, Priorité, Échéance).";
        break;
      case "tasks":
        systemPrompt = "Tu es un extracteur de tâches IA de précision. Analyse le texte fourni et extrait toutes les tâches, livrables ou actions requises. Formate le résultat en HTML sous forme d'une checklist de tâches élégante (utilisant des balises ul et li avec [ ] au début pour symboliser les cases à cocher, ou des listes à puces soignées). Ajoute pour chaque tâche sa priorité estimée.";
        break;
      case "roadmap":
        systemPrompt = "Tu es un directeur de produit visionnaire. Transforme les notes, idées ou objectifs fournis en une feuille de route (Roadmap) produit structurée en HTML. Utilise des titres h2, des listes d'objectifs, et des tableaux HTML élégants pour modéliser les livrables par trimestre (Q1, Q2, etc.) avec leurs statuts (Non commencé, En cours, Terminé).";
        break;
      case "crm":
        systemPrompt = "Tu es un ingénieur système CRM expérimenté. Génère une structure de base de données CRM moderne en HTML. Crée une page explicative comprenant des conseils d'utilisation, suivie d'un grand tableau HTML modélisant les données clients (avec des colonnes comme Nom du Contact, Entreprise, Phase du Pipe, Valeur estimée, E-mail, Téléphone, Dernière interaction, Prochaine action).";
        break;
      case "docs":
        systemPrompt = "Tu es un rédacteur technique chevronné. Génère une documentation technique exhaustive et de qualité professionnelle en HTML pour le code ou la description fournie. Utilise des structures claires avec des titres h2/h3, des exemples de code sous balises `<pre><code>`, et des tableaux pour expliquer les configurations ou les paramètres.";
        break;
      case "dev":
        systemPrompt = "Tu es un assistant de programmation IA senior. Analyse le code ou la question technique fournie. Fournis des explications limpides et des exemples de code optimisés. Formate l'ensemble en HTML propre, avec le code enveloppé de manière systématique dans des balises `<pre><code>` pour qu'il soit bien lisible.";
        break;
      case "suggest":
        systemPrompt = "Tu es un consultant en organisation d'espace de travail. En fonction du contexte ou de la page fournie, propose une structure d'organisation optimale en HTML. Suggère des sous-pages clés à créer, des conventions de nommage, des catégories de tags utiles, et des conseils pratiques de gestion documentaire.";
        break;
      case "dashboard":
        systemPrompt = "Tu es un concepteur de tableaux de bord de gestion. Génère une structure de dashboard analytique complète en HTML. Utilise des titres élégants, des cartes de statistiques de synthèse simulées sous forme de petites boîtes ou tableaux, suivis de grands tableaux de données clairs contenant des KPI clés de performance et des indicateurs de progression.";
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
