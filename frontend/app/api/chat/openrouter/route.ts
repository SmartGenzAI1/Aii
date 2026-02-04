import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { ChatSettings } from "@/types"
import { OpenAIStream, StreamingTextResponse } from "ai"
import { ServerRuntime } from "next"
import OpenAI from "openai"
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs"

export const runtime: ServerRuntime = "edge"

export async function POST(request: Request) {
  let payload: { chatSettings: ChatSettings; messages: any[] }
  try {
    payload = (await request.json()) as { chatSettings: ChatSettings; messages: any[] }
  } catch (parseError: any) {
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

    checkApiKey(profile.openrouter_api_key || null, "OpenRouter")

    const openai = new OpenAI({
      apiKey: profile.openrouter_api_key || "",
      baseURL: "https://openrouter.ai/api/v1"
    })

    const response = await openai.chat.completions.create({
      model: chatSettings.model as ChatCompletionCreateParamsBase["model"],
      messages: messages as ChatCompletionCreateParamsBase["messages"],
      temperature: chatSettings.temperature,
      max_tokens: undefined,
      stream: true
    })

    const stream = OpenAIStream(response as any)

    return new StreamingTextResponse(stream)
  } catch (error: any) {
    let errorMessage = error?.message || "An unexpected error occurred"
    const errorCode = typeof error?.status === "number" ? error.status : 500

    if (errorMessage.toLowerCase().includes("api key not found")) {
      errorMessage =
        "OpenRouter API Key not found. Please set it in your profile settings."
    }

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    })
  }
}
