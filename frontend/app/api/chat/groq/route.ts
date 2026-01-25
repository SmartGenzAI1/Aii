import { CHAT_SETTING_LIMITS } from "@/lib/chat-setting-limits"
import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { createErrorResponse } from "@/lib/utils"
import { ChatSettings } from "@/types"
import { OpenAIStream, StreamingTextResponse } from "ai"
import OpenAI from "openai"

export const runtime = "edge"

interface ChatRequest {
  chatSettings: ChatSettings
  messages: any[]
}

export async function POST(request: Request) {
  try {
    if (!request.body) {
      return createErrorResponse(
        new Error('Request body is required')
      )
    }

    const json = await request.json()
    const { chatSettings, messages } = json as ChatRequest

    if (!chatSettings || !messages || !Array.isArray(messages)) {
      return createErrorResponse(
        new Error('Invalid request format: chatSettings and messages array are required')
      )
    }
  } catch (parseError: any) {
    return createErrorResponse(
      new Error(`Failed to parse request: ${parseError.message}`)
    )
  }

  const json = await request.json()
  const { chatSettings, messages } = json as ChatRequest

  try {
    const profile = await getServerProfile()

    checkApiKey(profile.groq_api_key || null, "Groq")

    // Groq is compatible with the OpenAI SDK
    const groq = new OpenAI({
      apiKey: profile.groq_api_key || "",
      baseURL: "https://api.groq.com/openai/v1"
    })

    const response = await groq.chat.completions.create({
      model: chatSettings.model,
      messages,
      max_tokens:
        CHAT_SETTING_LIMITS[chatSettings.model].MAX_TOKEN_OUTPUT_LENGTH,
      stream: true
    })

    // Convert the response into a friendly text-stream.
    const stream = OpenAIStream(response as any)

    // Respond with the stream
    return new StreamingTextResponse(stream)
  } catch (error: any) {
    console.error("Error in Groq chat route:", error)
    
    let userMessage = "An unexpected error occurred"
    let errorCode = "UNKNOWN_ERROR"
    let statusCode = 500

    if (error?.message) {
      const msg = error.message.toLowerCase()
      if (msg.includes("api key") || msg.includes("unauthorized")) {
        userMessage = "Groq API Key not found or invalid. Please set it in your profile settings."
        errorCode = "AUTH_ERROR"
        statusCode = 401
      } else if (msg.includes("rate limit")) {
        userMessage = "Rate limit exceeded. Please try again later."
        errorCode = "RATE_LIMIT"
        statusCode = 429
      } else if (msg.includes("timeout")) {
        userMessage = "Request timeout. Please try again."
        errorCode = "TIMEOUT"
        statusCode = 504
      }
    }

    return new Response(
      JSON.stringify({
        error: userMessage,
        code: errorCode,
        timestamp: new Date().toISOString()
      }),
      {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
