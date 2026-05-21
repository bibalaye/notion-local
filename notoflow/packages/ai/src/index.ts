type MistralChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

export async function* streamCompletion(prompt: string, systemPrompt?: string) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("Clé API Mistral manquante (MISTRAL_API_KEY).");
  }
  const base = process.env.MISTRAL_API_BASE || "https://api.mistral.ai";
  const model = process.env.MISTRAL_MODEL || "mistral-large-latest";

  const messages: any[] = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const response = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 1024,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mistral API Error (${response.status}): ${errorText}`);
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
          // Mistral streaming format
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
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("Clé API Mistral manquante (MISTRAL_API_KEY).");
  }
  const base = process.env.MISTRAL_API_BASE || "https://api.mistral.ai";
  const model = process.env.MISTRAL_MODEL || "mistral-large-latest";

  const messages: any[] = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const response = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 1024,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Erreur Mistral API (${response.status}): ${response.statusText}`);
  }

  try {
    const data = (await response.json()) as MistralChatResponse;
    return data.choices?.[0]?.message?.content || JSON.stringify(data);
  } catch (e) {
    return await response.text();
  }
}
