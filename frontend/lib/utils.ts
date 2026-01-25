import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract base64 data from a data URL
 */
export function getBase64FromDataURL(dataURL: string): string {
  return dataURL.split(',')[1]
}

/**
 * Extract media type from a data URL
 */
export function getMediaTypeFromDataURL(dataURL: string): string {
  const mimeType = dataURL.split(',')[0].split(':')[1].split(';')[0]
  return mimeType
}

/**
 * Sanitize error messages to prevent XSS attacks
 * Removes or escapes potentially dangerous characters
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    return 'An unexpected error occurred'
  }

  // Escape special characters that could be used in XSS so that any HTML or scripts
  // are rendered as plain text rather than executed.
  // Use a single replace call with a function to handle all replacements
  const escaped = message.replace(/[&<>"'/]/g, (char) => {
    switch (char) {
      case '&': return '&amp;'
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '"': return '&quot;'
      case "'": return '&#x27;'
      case '/': return '&#x2F;'
      default: return char
    }
  })

  return escaped.slice(0, 500) // Limit length to prevent extremely long messages
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
  const rawStatus = error?.status || error?.code || 500
  const status =
    typeof rawStatus === 'number' && Number.isFinite(rawStatus)
      ? rawStatus
      : 500

  return new Response(JSON.stringify({ message: errorMessage }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  })
}
