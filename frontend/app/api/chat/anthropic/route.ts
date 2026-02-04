import { CHAT_SETTING_LIMITS } from "@/lib/chat-setting-limits"
import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { getBase64FromDataURL, getMediaTypeFromDataURL, createErrorResponse } from "@/lib/utils"
import { ChatSettings } from "@/types"
import Anthropic from "@anthropic-ai/sdk"
import { AnthropicStream, StreamingTextResponse } from "ai"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

interface ChatRequest {
  chatSettings: ChatSettings
  messages: any[]
}

export async function POST(request: NextRequest) {
  try {
    // Validate request body exists
    if (!request.body) {
      return createErrorResponse(
        new Error('Request body is required')
      )
    }

    const json = await request.json()
    const { chatSettings, messages } = json as ChatRequest

    // Validate required fields
    if (!chatSettings || !messages || !Array.isArray(messages)) {
      return createErrorResponse(
        new Error('Invalid request format: chatSettings and messages array are required')
      )
    }

    if (messages.length === 0) {
      return createErrorResponse(
        new Error('Messages array cannot be empty')
      )
    }

    const profile = await getServerProfile()

    // Validate API key
    checkApiKey(profile.anthropic_api_key || null, "Anthropic")

    let ANTHROPIC_FORMATTED_MESSAGES: any = messages.slice(1)

    ANTHROPIC_FORMATTED_MESSAGES = ANTHROPIC_FORMATTED_MESSAGES?.map(
      (message: any) => {
        const messageContent =
          typeof message?.content === "string"
            ? [message.content]
            : message?.content

        return {
          ...message,
          content: messageContent.map((content: any) => {
            if (typeof content === "string") {
              // Handle the case where content is a string
              return { type: "text", text: content }
            } else if (
              content?.type === "image_url" &&
              content?.image_url?.url?.length
            ) {
              return {
                type: "image",
                source: {
                  type: "base64",
                  media_type: getMediaTypeFromDataURL(content.image_url.url),
                  data: getBase64FromDataURL(content.image_url.url)
                }
              }
            } else {
              return content
            }
          })
        }
      }
    )

    const anthropic = new Anthropic({
      apiKey: profile.anthropic_api_key || ""
    })

    try {
      const response = await anthropic.messages.create({
        model: chatSettings.model,
        messages: ANTHROPIC_FORMATTED_MESSAGES,
        temperature: chatSettings.temperature,
        system: messages[0].content,
        max_tokens:
          CHAT_SETTING_LIMITS[chatSettings.model].MAX_TOKEN_OUTPUT_LENGTH,
        stream: true
      })

      try {
        const stream = AnthropicStream(response)
        return new StreamingTextResponse(stream)
      } catch (streamError: any) {
        console.error("Error parsing Anthropic API response:", streamError)
        return createErrorResponse(
          new Error("Failed to parse Anthropic API response")
        )
      }
    } catch (apiError: any) {
      console.error("Error calling Anthropic API:", apiError)
      const errorMessage = apiError?.error?.message || apiError.message || "Unknown API error"
      const statusCode = apiError?.status || 500
      return new NextResponse(
        JSON.stringify({
          error: errorMessage,
          code: 'ANTHROPIC_API_ERROR',
          timestamp: new Date().toISOString()
        }),
        { status: statusCode, headers: { 'Content-Type': 'application/json' } }
      )
    }
  } catch (error: any) {
    console.error("Unexpected error in Anthropic chat route:", error)
    
    // Map specific error messages to user-friendly ones
    let userMessage = "An unexpected error occurred"
    let errorCode = "UNKNOWN_ERROR"
    let statusCode = 500

    if (error?.message) {
      const msg = error.message.toLowerCase()
      if (msg.includes("api key") || msg.includes("unauthorized")) {
        userMessage = "Anthropic API Key not found or invalid. Please set it in your profile settings."
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

    return new NextResponse(
      JSON.stringify({
        error: userMessage,
        code: errorCode,
        timestamp: new Date().toISOString()
      }),
      { status: statusCode, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
