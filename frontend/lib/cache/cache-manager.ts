interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum number of entries
}

class CacheManager {
  private static instance: CacheManager
  private cache = new Map<string, CacheEntry<any>>()
  private options: CacheOptions = {
    ttl: 5 * 60 * 1000, // 5 minutes default
    maxSize: 1000
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  set<T>(key: string, data: T, options?: CacheOptions): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: options?.ttl || this.options.ttl!
    }

    // Check size limit
    if (this.cache.size >= (options?.maxSize || this.options.maxSize!)) {
      // Remove oldest entries (simple LRU)
      let oldestKey = ''
      let oldestTimestamp = Date.now()

      for (const [key, entry] of this.cache.entries()) {
        if (entry.timestamp < oldestTimestamp) {
          oldestTimestamp = entry.timestamp
          oldestKey = key
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, entry)
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) return null

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Get cache statistics
  getStats(): {
    size: number
    maxSize: number
    hitRate?: number
  } {
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize!
    }
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // Set global cache options
  configure(options: Partial<CacheOptions>): void {
    this.options = { ...this.options, ...options }
  }
}

export const cacheManager = CacheManager.getInstance()

// React hook for caching
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Check cache first
      const cached = cacheManager.get<T>(key)
      if (cached) {
        setData(cached)
        setLoading(false)
        return
      }

      // Fetch fresh data
      const freshData = await fetcher()
      cacheManager.set(key, freshData, options)
      setData(freshData)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [key, fetcher, options])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const invalidate = useCallback(() => {
    cacheManager.delete(key)
  }, [key])

  return { data, loading, error, refetch: fetchData, invalidate }
}

// Database query result caching
export class QueryCache {
  private static instance: QueryCache
  private queryCache = new Map<string, { result: any; timestamp: number }>()
  private readonly CACHE_TTL = 2 * 60 * 1000 // 2 minutes

  static getInstance(): QueryCache {
    if (!QueryCache.instance) {
      QueryCache.instance = new QueryCache()
    }
    return QueryCache.instance
  }

  // Generate cache key from query parameters
  private generateKey(table: string, filters: Record<string, any>): string {
    return `${table}:${JSON.stringify(filters)}`
  }

  async query<T>(
    table: string,
    filters: Record<string, any>,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const key = this.generateKey(table, filters)
    const cached = this.queryCache.get(key)

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result
    }

    const result = await queryFn()
    this.queryCache.set(key, { result, timestamp: Date.now() })

    return result
  }

  invalidate(table: string, filters?: Record<string, any>): void {
    if (filters) {
      const key = this.generateKey(table, filters)
      this.queryCache.delete(key)
    } else {
      // Invalidate all queries for this table
      for (const [key] of this.queryCache.entries()) {
        if (key.startsWith(`${table}:`)) {
          this.queryCache.delete(key)
        }
      }
    }
  }

  clear(): void {
    this.queryCache.clear()
  }
}

export const queryCache = QueryCache.getInstance()

// API response caching with React Query integration
export class APIResponseCache {
  private static instance: APIResponseCache
  private responseCache = new Map<string, { data: any; timestamp: number; etag?: string }>()
  private readonly CACHE_TTL = 10 * 60 * 1000 // 10 minutes

  static getInstance(): APIResponseCache {
    if (!APIResponseCache.instance) {
      APIResponseCache.instance = new APIResponseCache()
    }
    return APIResponseCache.instance
  }

  private generateKey(url: string, params?: Record<string, any>): string {
    return params ? `${url}:${JSON.stringify(params)}` : url
  }

  async fetch<T>(
    url: string,
    options?: RequestInit & { params?: Record<string, any>; skipCache?: boolean }
  ): Promise<T> {
    const key = this.generateKey(url, options?.params)
    const cached = this.responseCache.get(key)

    // Check cache unless explicitly skipped
    if (!options?.skipCache && cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    const response = await fetch(url, options)
    const data = await response.json()

    // Cache successful responses
    if (response.ok) {
      this.responseCache.set(key, {
        data,
        timestamp: Date.now(),
        etag: response.headers.get('etag') || undefined
      })
    }

    return data
  }

  invalidate(url: string, params?: Record<string, any>): void {
    const key = this.generateKey(url, params)
    this.responseCache.delete(key)
  }

  clear(): void {
    this.responseCache.clear()
  }
}

export const apiResponseCache = APIResponseCache.getInstance()

// Import useState and useEffect for React hooks
import { useState, useEffect, useCallback } from 'react'