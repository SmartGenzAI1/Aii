// @ts-nocheck
import React from "react"
import { trackEvent } from "./analytics"

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startTiming(label: string): () => void {
    const startTime = performance.now()
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      this.metrics.set(label, duration)
      trackEvent('performance_timing', { label, duration })
    }
  }

  measureRenderTime(componentName: string, startTime: number): void {
    const renderTime = performance.now() - startTime
    if (renderTime > 16.67) { // Slower than 60fps
      trackEvent('slow_render', { component: componentName, renderTime })
    }
  }

  measureInteractionTime(interaction: string, startTime: number): void {
    const interactionTime = performance.now() - startTime
    if (interactionTime > 100) { // Slower than 100ms
      trackEvent('slow_interaction', { interaction, interactionTime })
    }
  }

  trackWebVitals(): void {
    // Track Core Web Vitals
    if ('web-vitals' in window) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS((metric) => trackEvent('web_vitals_cls', { value: metric.value }))
        getFID((metric) => trackEvent('web_vitals_fid', { value: metric.value }))
        getFCP((metric) => trackEvent('web_vitals_fcp', { value: metric.value }))
        getLCP((metric) => trackEvent('web_vitals_lcp', { value: metric.value }))
        getTTFB((metric) => trackEvent('web_vitals_ttfb', { value: metric.value }))
      })
    }
  }

  trackMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      const usagePercent = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100

      if (usagePercent > 80) {
        trackEvent('high_memory_usage', {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          percent: usagePercent
        })
      }
    }
  }
}

// React hooks for performance monitoring
export function usePerformanceMonitor() {
  return PerformanceMonitor.getInstance()
}

// Higher-order component for component performance tracking
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceTrackedComponent(props: P) {
    const monitor = usePerformanceMonitor()
    const endTiming = monitor.startTiming(`render_${componentName}`)

    React.useEffect(() => {
      endTiming()
    })

    return React.createElement(Component, props)
  }
}

// Custom hook for measuring interaction performance
export function useInteractionTiming(interactionName: string) {
  const monitor = usePerformanceMonitor()

  return (startTime: number) => {
    monitor.measureInteractionTime(interactionName, startTime)
  }
}

// Initialize performance monitoring
export function initPerformanceMonitoring() {
  const monitor = PerformanceMonitor.getInstance()

  // Track Web Vitals
  monitor.trackWebVitals()

  // Track memory usage periodically
  setInterval(() => {
    monitor.trackMemoryUsage()
  }, 30000) // Every 30 seconds

  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    trackEvent('page_visibility_change', {
      hidden: document.hidden,
      timestamp: Date.now()
    })
  })

  // Track online/offline status
  window.addEventListener('online', () => {
    trackEvent('network_status_change', { status: 'online' })
  })

  window.addEventListener('offline', () => {
    trackEvent('network_status_change', { status: 'offline' })
  })
}