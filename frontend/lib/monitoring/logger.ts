type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  userId?: string
  sessionId?: string
  requestId?: string
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
}

class Logger {
  private static instance: Logger
  private logs: LogEntry[] = []
  private maxLogs: number = 1000
  private isProduction: boolean = process.env.NODE_ENV === 'production'

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      } : undefined
    }

    // Add to internal log buffer
    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift() // Remove oldest log
    }

    // Console output based on environment
    const logMethod = level === 'error' ? console.error :
                     level === 'warn' ? console.warn :
                     level === 'info' ? console.info : console.debug

    const prefix = `[${level.toUpperCase()}]`
    logMethod(`${prefix} ${message}`, context || '', error || '')

    // In production, send to external logging service
    if (this.isProduction && (level === 'error' || level === 'warn')) {
      this.sendToExternalService(entry)
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context)
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, any>, error?: Error) {
    this.log('warn', message, context, error)
  }

  error(message: string, context?: Record<string, any>, error?: Error) {
    this.log('error', message, context, error)
  }

  // Performance logging
  time(label: string) {
    console.time(label)
  }

  timeEnd(label: string) {
    console.timeEnd(label)
  }

  // API request logging
  logAPIRequest(endpoint: string, method: string, duration: number, statusCode: number, userId?: string) {
    this.info(`API Request: ${method} ${endpoint}`, {
      method,
      endpoint,
      duration,
      statusCode,
      userId
    })
  }

  // Chat operation logging
  logChatOperation(operation: string, model: string, tokensUsed?: number, duration?: number, userId?: string) {
    this.info(`Chat ${operation}`, {
      operation,
      model,
      tokensUsed,
      duration,
      userId
    })
  }

  // Error logging with additional context
  logApplicationError(error: Error, context: Record<string, any> = {}) {
    this.error(`Application Error: ${error.message}`, {
      ...context,
      componentStack: (error as any).componentStack
    }, error)
  }

  // Get recent logs for debugging
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count)
  }

  // Clear logs
  clearLogs() {
    this.logs = []
  }

  private async sendToExternalService(entry: LogEntry) {
    // Placeholder for external logging service integration
    // Examples: Sentry, LogRocket, DataDog, etc.

    try {
      // In a real implementation, you would send to your logging service
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   body: JSON.stringify(entry)
      // })
    } catch (error) {
      // Don't recursively log logging errors
      console.error('Failed to send log to external service:', error)
    }
  }
}

export const logger = Logger.getInstance()

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics = new Map<string, number[]>()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startTimer(label: string): () => void {
    const startTime = performance.now()
    logger.debug(`Started timer: ${label}`)

    return () => {
      const duration = performance.now() - startTime
      this.recordMetric(label, duration)
      logger.debug(`Timer ${label} completed in ${duration.toFixed(2)}ms`)
    }
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    const values = this.metrics.get(name)!
    values.push(value)

    // Keep only last 1000 measurements
    if (values.length > 1000) {
      values.shift()
    }
  }

  getMetrics(name: string): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics.get(name)
    if (!values || values.length === 0) return null

    const sum = values.reduce((a, b) => a + b, 0)
    return {
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    }
  }

  getAllMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, any> = {}
    for (const [name, values] of this.metrics.entries()) {
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0)
        result[name] = {
          avg: sum / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length
        }
      }
    }
    return result
  }

  clearMetrics() {
    this.metrics.clear()
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance()

// React hook for performance monitoring
export function usePerformanceMonitoring(componentName: string) {
  const startTimer = (operation: string) => {
    return performanceMonitor.startTimer(`${componentName}.${operation}`)
  }

  return { startTimer, logger }
}