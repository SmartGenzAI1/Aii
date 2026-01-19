import { z } from 'zod'
import { ChatSettings, LLMID } from '@/types'

// Chat settings validation schema
export const chatSettingsSchema = z.object({
  model: z.string().min(1, 'Model is required'),
  prompt: z.string().max(10000, 'Prompt too long'),
  temperature: z.number().min(0).max(2, 'Temperature must be between 0 and 2'),
  contextLength: z.number().int().min(1).max(128000, 'Context length out of range'),
  includeProfileContext: z.boolean(),
  includeWorkspaceInstructions: z.boolean(),
  embeddingsProvider: z.enum(['openai', 'local'])
})

// Message validation schema
export const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1, 'Message content cannot be empty').max(100000, 'Message too long')
})

// Chat payload validation schema
export const chatPayloadSchema = z.object({
  chatSettings: chatSettingsSchema,
  workspaceInstructions: z.string().max(50000, 'Workspace instructions too long'),
  chatMessages: z.array(z.object({
    message: messageSchema,
    fileItems: z.array(z.any()).optional()
  })).min(1, 'At least one message required'),
  assistant: z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    model: z.string(),
    prompt: z.string(),
    temperature: z.number(),
    context_length: z.number(),
    include_profile_context: z.boolean(),
    include_workspace_instructions: z.boolean(),
    embeddings_provider: z.string()
  }).nullable(),
  messageFileItems: z.array(z.any()),
  chatFileItems: z.array(z.any())
})

// API key validation functions
export const validateApiKey = (apiKey: string | null, provider: string): boolean => {
  if (!apiKey || apiKey.trim() === '') return false

  // Provider-specific validation
  switch (provider.toLowerCase()) {
    case 'openai':
      return /^sk-[a-zA-Z0-9]{48,}$/.test(apiKey)
    case 'anthropic':
      return /^sk-ant-[a-zA-Z0-9_-]{95,}$/.test(apiKey)
    case 'google':
      return apiKey.length >= 20 && /^[A-Za-z0-9_-]+$/.test(apiKey)
    case 'azure':
      return apiKey.length >= 32
    default:
      return apiKey.length >= 10
  }
}

// Rate limiting helper
export class RateLimiter {
  private static instance: RateLimiter
  private requests = new Map<string, { count: number; resetTime: number }>()

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter()
    }
    return RateLimiter.instance
  }

  checkLimit(key: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now()
    const request = this.requests.get(key)

    if (!request || now > request.resetTime) {
      this.requests.set(key, { count: 1, resetTime: now + windowMs })
      return true
    }

    if (request.count >= maxRequests) {
      return false
    }

    request.count++
    return true
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, request] of this.requests.entries()) {
      if (now > request.resetTime) {
        this.requests.delete(key)
      }
    }
  }
}

// Sanitization functions
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return ''

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 100000) // Limit length
}

export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized = { ...obj }

  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value)
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value)
    }
  }

  return sanitized
}

// Validation utilities
export const validateChatPayload = (payload: any) => {
  try {
    return {
      success: true,
      data: chatPayloadSchema.parse(payload)
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof z.ZodError ? error.errors : [{ message: 'Invalid payload' }]
    }
  }
}

export const validateMessageContent = (content: string): { valid: boolean; error?: string } => {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Message content cannot be empty' }
  }

  if (content.length > 100000) {
    return { valid: false, error: 'Message content too long (max 100,000 characters)' }
  }

  return { valid: true }
}