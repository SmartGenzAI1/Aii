// @ts-nocheck
"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { useAppStore } from "@/lib/store"
import { trackEvent } from "@/lib/analytics"

export function NotificationManager() {
  const { notifications } = useAppStore()

  useEffect(() => {
    // Listen for custom events
    const handleCustomNotification = (event: CustomEvent) => {
      const { type, title, message, duration = 4000 } = event.detail

      switch (type) {
        case 'success':
          toast.success(title, { description: message, duration })
          break
        case 'error':
          toast.error(title, { description: message, duration })
          trackEvent('error_displayed', { error_type: 'user_facing', message })
          break
        case 'warning':
          toast.warning(title, { description: message, duration })
          break
        case 'info':
          toast.info(title, { description: message, duration })
          break
        default:
          toast(title, { description: message, duration })
      }
    }

    window.addEventListener('genzai-notification', handleCustomNotification as EventListener)

    return () => {
      window.removeEventListener('genzai-notification', handleCustomNotification as EventListener)
    }
  }, [])

  // Show welcome notification on first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem('genzai-visited')
    if (!hasVisited && notifications) {
      setTimeout(() => {
        toast("Welcome to GenZ AI! 🔥", {
          description: "Start chatting with the coolest AI around",
          duration: 5000,
        })
        localStorage.setItem('genzai-visited', 'true')
        trackEvent('first_visit')
      }, 2000)
    }
  }, [notifications])

  return null
}

// Utility functions for triggering notifications
export const notify = {
  success: (title: string, message?: string) => {
    window.dispatchEvent(new CustomEvent('genzai-notification', {
      detail: { type: 'success', title, message }
    }))
  },

  error: (title: string, message?: string) => {
    window.dispatchEvent(new CustomEvent('genzai-notification', {
      detail: { type: 'error', title, message }
    }))
  },

  warning: (title: string, message?: string) => {
    window.dispatchEvent(new CustomEvent('genzai-notification', {
      detail: { type: 'warning', title, message }
    }))
  },

  info: (title: string, message?: string) => {
    window.dispatchEvent(new CustomEvent('genzai-notification', {
      detail: { type: 'info', title, message }
    }))
  },

  chat: (message: string) => {
    window.dispatchEvent(new CustomEvent('genzai-notification', {
      detail: { type: 'info', title: 'New Message', message }
    }))
  },

  offline: () => {
    toast("You're offline", {
      description: "Some features may not be available",
      duration: 3000,
    })
  },

  online: () => {
    toast.success("Back online!", {
      description: "All features are now available",
      duration: 3000,
    })
  }
}