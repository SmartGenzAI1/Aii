// @ts-nocheck
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
  }
}

export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      ...parameters,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      url: window.location.href
    })
  }
}

export const trackPageView = (pagePath: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID || '', {
      page_path: pagePath,
    })
  }
}

export const trackChatMessage = (model: string, messageLength: number) => {
  trackEvent('chat_message_sent', {
    model,
    message_length: messageLength,
    category: 'engagement'
  })
}

export const trackTemplateUsed = (templateName: string) => {
  trackEvent('conversation_template_used', {
    template_name: templateName,
    category: 'engagement'
  })
}

export const trackError = (error: Error, context?: string) => {
  trackEvent('error_occurred', {
    error_message: error.message,
    error_stack: error.stack,
    context,
    category: 'error'
  })
}