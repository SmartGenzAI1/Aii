import OpenAI from "openai"

export async function createChatTitle(message: string): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Generate a short, catchy title for a chat conversation based on the user's first message. Keep it under 50 characters. Make it fun, modern, and Gen Z style with emojis if appropriate."
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 20
    })

    const title = response.choices[0]?.message?.content?.trim() || "New Chat"

    return title.length > 50 ? title.substring(0, 47) + "..." : title
  } catch (error) {
    console.error("Error generating chat title:", error)
    // Fallback to simple title
    return "Chat: " + message.substring(0, 40) + (message.length > 40 ? "..." : "")
  }
}
