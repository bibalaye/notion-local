# Skill: Ajouter une API Route Next.js

## Quand utiliser
Quand l'utilisateur veut ajouter un endpoint API (streaming, webhook, endpoint public, health check).

## Emplacement
`apps/web/src/app/api/<route>/route.ts`

## Différence Server Action vs API Route

| | Server Action | API Route |
|---|---|---|
| **Utilisation** | Depuis composants React (formulaires, mutations) | Appels HTTP externes, SSE, webhooks |
| **Format** | Fonctions `async` exportées | Handlers `GET`, `POST`, `PUT`, `DELETE` |
| **Streaming** | Non | Oui (SSE, ReadableStream) |
| **Auth** | Via Supabase server | Via headers/tokens |

## Templates

### API Route simple (JSON)

```ts
// apps/web/src/app/api/example/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@notoflow/database";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const data = await db.page.findMany({
    where: { authorId: user.id },
  });

  return NextResponse.json(data);
}
```

### API Route streaming (SSE) — Pattern IA

```ts
// apps/web/src/app/api/ai/route.ts
import { NextRequest } from "next/server";
import { streamCompletion } from "@notoflow/ai";

export async function POST(req: NextRequest) {
  const { prompt, systemPrompt } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamCompletion(prompt, systemPrompt)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (error) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "Erreur IA" })}\n\n`)
        );
      } finally {
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
}
```

### Webhook (Stripe)

```ts
// apps/web/src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  
  // Vérifier la signature du webhook
  // ...
  
  return NextResponse.json({ received: true });
}
```

### Health Check

```ts
// apps/web/src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { db } from "@notoflow/database";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "connected" });
  } catch {
    return NextResponse.json({ status: "error", db: "disconnected" }, { status: 503 });
  }
}
```

## API Routes existantes

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/ai` | POST | Streaming IA Mistral (SSE) |
| `/api/health` | GET | Health check (DB connectivity) |
| `/api/webhooks/stripe` | POST | Webhook Stripe |

## Consommation côté client

### Fetch standard
```ts
const res = await fetch("/api/example");
const data = await res.json();
```

### Streaming SSE (utilisé pour l'IA)
```ts
const res = await fetch("/api/ai", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt: "..." }),
});

const reader = res.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader!.read();
  if (done) break;
  const text = decoder.decode(value);
  // Parser les chunks SSE
}
```

### Via lib/api/client.ts
Le fichier `apps/web/src/lib/api/client.ts` contient des helpers API réutilisables.
