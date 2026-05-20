export async function* streamCompletion(prompt: string, systemPrompt?: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Clé API OpenAI manquante (OPENAI_API_KEY).");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        ...(systemPrompt
          ? [{ role: "system", content: systemPrompt }]
          : [
              {
                role: "system",
                content:
                  "Tu es un assistant de rédaction IA intégré à NotoFlow, un clone moderne de Notion. Aide l'utilisateur à structurer, reformuler ou enrichir ses documents.",
              },
            ]),
        { role: "user", content: prompt },
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API Error: ${errorText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder("utf-8");
  if (!reader) return;

  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine) continue;
      if (cleanLine === "data: [DONE]") return;

      if (cleanLine.startsWith("data: ")) {
        try {
          const json = JSON.parse(cleanLine.slice(6));
          const chunk = json.choices?.[0]?.delta?.content;
          if (chunk) {
            yield chunk;
          }
        } catch (e) {
          // ignore parsing error
        }
      }
    }
  }
}

export async function generateText(prompt: string, systemPrompt?: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Clé API OpenAI manquante (OPENAI_API_KEY).");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Erreur OpenAI API: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}
