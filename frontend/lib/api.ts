// frontend/lib/api.ts

export async function streamChat(
  prompt: string,
  model: "fast" | "balanced" | "smart",
  token: string,
  onChunk: (text: string) => void
) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt, model }),
    }
  );

  if (!res.ok || !res.body) {
    throw new Error("AI service unavailable");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value));
  }
}
