import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { ChatSettings } from "@/types"
import { OpenAIStream, StreamingTextResponse } from "ai"
import OpenAI from "openai"

export const runtime = "edge"

export async function POST(request: Request) {
  let payload: { chatSettings: ChatSettings; messages: any[] }
  try {
    payload = (await request.json()) as { chatSettings: ChatSettings; messages: any[] }
  } catch {
    return new Response(JSON.stringify({ message: "Invalid JSON payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    })
  }

  const { chatSettings, messages } = payload

  if (!chatSettings || !messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ message: "Invalid request format: chatSettings and non-empty messages array are required" }),
      { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
    )
  }

  try {
    const profile = await getServerProfile()

    checkApiKey(profile.perplexity_api_key || null, "Perplexity")

    // Perplexity is compatible the OpenAI SDK
    const perplexity = new OpenAI({
      apiKey: profile.perplexity_api_key || "",
      baseURL: "https://api.perplexity.ai/"
    })

    const response = await perplexity.chat.completions.create({
      model: chatSettings.model,
      messages,
      stream: true
    })

    const stream = OpenAIStream(response as any)

    return new StreamingTextResponse(stream)
  } catch (error: any) {
    let errorMessage = error.message || "An unexpected error occurred"
    const errorCode = error.status || 500

    if (errorMessage.toLowerCase().includes("api key not found")) {
      errorMessage =
        "Perplexity API Key not found. Please set it in your profile settings."
    } else if (errorCode === 401) {
      errorMessage =
        "Perplexity API Key is incorrect. Please fix it in your profile settings."
    }

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    })
  }
}
