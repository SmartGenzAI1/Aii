import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitize error messages to prevent XSS attacks
 * Removes or escapes potentially dangerous characters
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    return 'An unexpected error occurred'
  }

  // Remove HTML tags
  const withoutHtml = message.replace(/<[^>]*>/g, '')

  // Escape special characters that could be used in XSS
  return withoutHtml
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .slice(0, 500) // Limit length to prevent extremely long messages
}

/**
 * Safe error response helper for API routes
 */
export function createErrorResponse(error: any, defaultMessage = 'An unexpected error occurred') {
  const errorMessage = sanitizeErrorMessage(
    error?.error?.message ||
    error?.message ||
    defaultMessage
  )
  const errorCode = error?.status || error?.code || 500

  return new Response(JSON.stringify({ message: errorMessage }), {
    status: errorCode
  })
}
