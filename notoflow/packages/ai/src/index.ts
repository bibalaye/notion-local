export async function* streamCompletion(prompt: string, systemPrompt?: string) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("Clé API Mistral manquante (MISTRAL_API_KEY).");
  }
  const base = process.env.MISTRAL_API_BASE || "https://api.mistral.ai";
  const model = process.env.MISTRAL_MODEL || "mistral-large";

  const response = await fetch(`${base}/v1/models/${model}/invoke`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: prompt,
      // parameters can be adjusted via env or extended here
      parameters: { max_new_tokens: 512 },
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mistral API Error: ${errorText}`);
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
          // adapt to possible Mistral streaming shape
          const chunk = json.output || json.delta?.content || json.choices?.[0]?.delta?.content;
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
  const model = process.env.MISTRAL_MODEL || "mistral-large";

  const response = await fetch(`${base}/v1/models/${model}/invoke`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: prompt,
      parameters: { max_new_tokens: 512 },
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Erreur Mistral API: ${response.statusText}`);
  }

  // Try to parse JSON response; fallback to plain text
  try {
    const data = await response.json();
    // common places where text may appear
    if (typeof data.output === "string") return data.output;
    if (Array.isArray(data.outputs) && data.outputs[0]?.content) return data.outputs[0].content;
    if (data.result?.output) return data.result.output;
    // fallback: stringify entire body
    return JSON.stringify(data);
  } catch (e) {
    return await response.text();
  }
}
