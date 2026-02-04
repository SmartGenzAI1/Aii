import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { ChatSettings } from "@/types"
import { createErrorResponse } from "@/lib/utils"
import { GoogleGenerativeAI } from "@google/generative-ai"

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

    checkApiKey(profile.google_gemini_api_key, "Google")

    const genAI = new GoogleGenerativeAI(profile.google_gemini_api_key || "")
    const googleModel = genAI.getGenerativeModel({ model: chatSettings.model })

    const lastMessage = messages[messages.length - 1]
    const history = messages.slice(0, -1)

    const chat = googleModel.startChat({
      history,
      generationConfig: {
        temperature: chatSettings.temperature
      }
    })

    if (!lastMessage?.parts) {
      return createErrorResponse(new Error("Invalid messages format for Google Gemini"))
    }

    const response = await chat.sendMessageStream(lastMessage.parts)

    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response.stream) {
          const chunkText = chunk.text()
          controller.enqueue(encoder.encode(chunkText))
        }
        controller.close()
      }
    })

    return new Response(readableStream, {
      headers: { "Content-Type": "text/plain" }
    })

  } catch (error: any) {
    let sanitizedError = error

    // Sanitize specific error messages
    if (error?.message) {
      let errorMessage = error.message
      if (errorMessage.toLowerCase().includes("api key not found")) {
        sanitizedError = { ...error, message: "Google Gemini API Key not found. Please set it in your profile settings." }
      } else if (errorMessage.toLowerCase().includes("api key not valid")) {
        sanitizedError = { ...error, message: "Google Gemini API Key is incorrect. Please fix it in your profile settings." }
      }
    }

    return createErrorResponse(sanitizedError)
  }
}
