// frontend/lib/byoClient.ts

import { getApiKey } from "./localKeys";

export async function streamBYOChat(
  prompt: string,
  model: string,
  onChunk: (text: string) => void
) {
  const key = getApiKey("openrouter");
  if (!key) throw new Error("No API key found");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      stream: true,
    }),
  });

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value));
  }
}
