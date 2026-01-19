import { NextRequest, NextResponse } from 'next/server'

export interface AppError extends Error {
  code?: string
  statusCode?: number
  isOperational?: boolean
  details?: any
}

export class ApplicationError extends Error implements AppError {
  public readonly code: string
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly details?: any

  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message)
    this.name = 'ApplicationError'
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.details = details

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, true, details)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401, true)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403, true)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404, true)
    this.name = 'NotFoundError'
  }
}

export class RateLimitError extends ApplicationError {
  constructor(message: string = 'Rate limit exceeded', retryAfter: number = 60) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, true, { retryAfter })
    this.name = 'RateLimitError'
  }
}

export class ExternalAPIError extends ApplicationError {
  constructor(provider: string, originalError: any) {
    super(
      `${provider} API error: ${originalError.message || 'Unknown error'}`,
      'EXTERNAL_API_ERROR',
      originalError.status || 502,
      true,
      {
        provider,
        originalError: {
          message: originalError.message,
          code: originalError.code,
          status: originalError.status
        }
      }
    )
    this.name = 'ExternalAPIError'
  }
}

// Error response formatter
export function formatErrorResponse(error: AppError | Error): {
  message: string
  code: string
  details?: any
  timestamp: string
} {
  const appError = error as AppError

  return {
    message: error.message,
    code: appError.code || 'INTERNAL_ERROR',
    details: appError.details,
    timestamp: new Date().toISOString()
  }
}

// Global error handler for API routes
export function handleAPIError(error: any, request?: NextRequest): NextResponse {
  console.error('API Error:', {
    error: error.message,
    stack: error.stack,
    url: request?.url,
    method: request?.method,
    timestamp: new Date().toISOString()
  })

  // Handle known application errors
  if (error instanceof ApplicationError) {
    return NextResponse.json(formatErrorResponse(error), {
      status: error.statusCode,
      headers: error instanceof RateLimitError ? {
        'Retry-After': error.details.retryAfter.toString()
      } : undefined
    })
  }

  // Handle Zod validation errors
  if (error.name === 'ZodError') {
    const validationError = new ValidationError('Validation failed', error.errors)
    return NextResponse.json(formatErrorResponse(validationError), {
      status: 400
    })
  }

  // Handle database errors
  if (error.code?.startsWith('PGRST')) {
    const dbError = new ApplicationError(
      'Database operation failed',
      'DATABASE_ERROR',
      500,
      false,
      { originalCode: error.code }
    )
    return NextResponse.json(formatErrorResponse(dbError), { status: 500 })
  }

  // Generic error handling
  const genericError = new ApplicationError(
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : error.message,
    'INTERNAL_ERROR',
    500,
    false
  )

  return NextResponse.json(formatErrorResponse(genericError), { status: 500 })
}

// Error boundary for client components
export class ErrorBoundary extends Error {
  constructor(message: string, public readonly componentStack?: string) {
    super(message)
    this.name = 'ErrorBoundary'
  }
}

// Utility to check if error is operational (expected)
export function isOperationalError(error: any): boolean {
  return error instanceof ApplicationError && error.isOperational !== false
}

// Error logging utility
export function logError(error: any, context?: Record<string, any>) {
  const logData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    statusCode: error.statusCode,
    isOperational: error.isOperational,
    details: error.details,
    context,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  }

  // In production, you might want to send this to a logging service
  if (process.env.NODE_ENV === 'production') {
    // Send to logging service (e.g., Sentry, LogRocket, etc.)
    console.error('[PRODUCTION ERROR]', JSON.stringify(logData))
  } else {
    console.error('[ERROR]', logData)
  }
}

// Async error wrapper for API routes
export function withErrorHandler<T extends any[]>(
  fn: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await fn(...args)
    } catch (error) {
      return handleAPIError(error, args[0] as NextRequest)
    }
  }
}