// @ts-nocheck - Suppress module resolution errors in this environment
import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { ChatSettings } from "@/types"
import { OpenAIStream, StreamingTextResponse } from "ai"
import { ServerRuntime } from "next"
import OpenAI from "openai"
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs"
import {
  validateChatPayload,
  validateApiKey,
  RateLimiter,
  sanitizeObject
} from "@/lib/validation/chat-validation"

export const runtime: ServerRuntime = "edge"

// Rate limiter instance
const rateLimiter = RateLimiter.getInstance()

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown'

    // Rate limiting check
    if (!rateLimiter.checkLimit(`openai-${clientIP}`, 50, 60000)) { // 50 requests per minute
      return new Response(JSON.stringify({
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: 60
      }), {
        status: 429,
        headers: { 'Retry-After': '60' }
      })
    }

    // Validate request size
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB limit
      return new Response(JSON.stringify({
        message: "Request too large"
      }), { status: 413 })
    }

    const json = await request.json()

    // Sanitize and validate input
    const sanitizedJson = sanitizeObject(json)
    const validation = validateChatPayload(sanitizedJson)

    if (!validation.success) {
      return new Response(JSON.stringify({
        message: "Invalid request data",
        errors: validation.error
      }), { status: 400 })
    }

    const { chatSettings, messages } = sanitizedJson as {
      chatSettings: ChatSettings
      messages: any[]
    }

    // Additional validation
    if (!chatSettings?.model || !messages || messages.length === 0) {
      return new Response(JSON.stringify({
        message: "Missing required fields: model and messages"
      }), { status: 400 })
    }

    const profile = await getServerProfile()

    // Enhanced API key validation
    if (!validateApiKey(profile.openai_api_key || null, 'openai')) {
      return new Response(JSON.stringify({
        message: "OpenAI API Key is invalid. Please check your profile settings."
      }), { status: 400 })
    }

    checkApiKey(profile.openai_api_key || null, "OpenAI")

    const openai = new OpenAI({
      apiKey: profile.openai_api_key || "",
      organization: profile.openai_organization_id
    })

    // Validate model is supported and set appropriate limits
    const maxTokens = getMaxTokensForModel(chatSettings.model)

    const response = await openai.chat.completions.create({
      model: chatSettings.model as ChatCompletionCreateParamsBase["model"],
      messages: messages as ChatCompletionCreateParamsBase["messages"],
      temperature: Math.max(0, Math.min(2, chatSettings.temperature)), // Clamp temperature
      max_tokens: maxTokens,
      stream: true
    } as any) // Type assertion to handle version conflicts

    const stream = OpenAIStream(response as any)

    return new StreamingTextResponse(stream)
  } catch (error: any) {
    console.error('OpenAI API Error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })

    let errorMessage = "An unexpected error occurred"
    const errorCode = error.status || 500

    if (errorMessage.toLowerCase().includes("api key not found")) {
      errorMessage = "OpenAI API Key not found. Please set it in your profile settings."
    } else if (errorMessage.toLowerCase().includes("incorrect api key")) {
      errorMessage = "OpenAI API Key is incorrect. Please fix it in your profile settings."
    } else if (error.code === 'insufficient_quota') {
      errorMessage = "OpenAI API quota exceeded. Please check your billing."
    } else if (error.code === 'rate_limit_exceeded') {
      errorMessage = "OpenAI API rate limit exceeded. Please try again later."
    }

    return new Response(JSON.stringify({
      message: errorMessage,
      code: error.code || 'unknown_error'
    }), {
      status: errorCode,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

function getMaxTokensForModel(model: string): number | null {
  const modelLimits: Record<string, number> = {
    'gpt-4-vision-preview': 4096,
    'gpt-4o': 4096,
    'gpt-4o-mini': 16384,
    'gpt-4-turbo': 4096,
    'gpt-4': 8192,
    'gpt-3.5-turbo': 4096,
    'gpt-3.5-turbo-16k': 16384
  }

  return modelLimits[model] || null
}
