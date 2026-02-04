import { performanceMonitor } from '../monitoring/logger'

interface ShardConfig {
  shardId: number
  host: string
  port: number
  database: string
  user: string
  password: string
  maxConnections: number
  region: string
  readOnly: boolean
}

interface ShardingStrategy {
  type: 'hash' | 'range' | 'list'
  key: string
  shards: number
}

class ShardingManager {
  private static instance: ShardingManager
  private shards: Map<number, ShardConfig> = new Map()
  private strategy: ShardingStrategy
  private connections: Map<number, any> = new Map() // Pool connections

  constructor(strategy: ShardingStrategy) {
    this.strategy = strategy
  }

  static getInstance(strategy?: ShardingStrategy): ShardingManager {
    if (!ShardingManager.instance) {
      ShardingManager.instance = new ShardingManager(strategy || {
        type: 'hash',
        key: 'user_id',
        shards: 64
      })
    }
    return ShardingManager.instance
  }

  registerShard(config: ShardConfig): void {
    this.shards.set(config.shardId, config)
    performanceMonitor.recordMetric(`shard.${config.shardId}.registered`, 1)
  }

  getShardForKey(key: string | number): ShardConfig | null {
    const shardId = this.calculateShardId(key)
    return this.shards.get(shardId) || null
  }

  getShardForUserId(userId: string): ShardConfig | null {
    return this.getShardForKey(userId)
  }

  getShardForChatId(chatId: string): ShardConfig | null {
    // Extract user ID from chat ID or use chat ID directly
    return this.getShardForKey(chatId)
  }

  getAllShards(): ShardConfig[] {
    return Array.from(this.shards.values())
  }

  getReadReplicas(): ShardConfig[] {
    return this.getAllShards().filter(shard => shard.readOnly)
  }

  getPrimaryShards(): ShardConfig[] {
    return this.getAllShards().filter(shard => !shard.readOnly)
  }

  private calculateShardId(key: string | number): number {
    switch (this.strategy.type) {
      case 'hash':
        return this.hashFunction(key) % this.strategy.shards

      case 'range':
        // Implement range-based sharding
        return this.rangeFunction(key)

      case 'list':
        // Implement list-based sharding
        return this.listFunction(key)

      default:
        return this.hashFunction(key) % this.strategy.shards
    }
  }

  private hashFunction(key: string | number): number {
    const str = key.toString()
    let hash = 0

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }

    return Math.abs(hash)
  }

  private rangeFunction(key: string | number): number {
    // Simple range-based sharding (customize based on your data distribution)
    const numKey = typeof key === 'number' ? key : parseInt(key.toString(), 10) || 0

    if (numKey < 100000) return 0
    if (numKey < 200000) return 1
    if (numKey < 300000) return 2
    if (numKey < 400000) return 3
    if (numKey < 500000) return 4
    if (numKey < 600000) return 5
    if (numKey < 700000) return 6
    return 7
  }

  private listFunction(key: string | number): number {
    // List-based sharding (useful for geographical or categorical data)
    const strKey = key.toString()

    // Example: Shard by first character
    const firstChar = strKey.charAt(0).toLowerCase()
    const charCode = firstChar.charCodeAt(0)

    // Distribute across shards based on character ranges
    if (charCode >= 97 && charCode <= 103) return 0 // a-g
    if (charCode >= 104 && charCode <= 109) return 1 // h-m
    if (charCode >= 110 && charCode <= 115) return 2 // n-s
    return 3 // t-z and others
  }

  async getConnection(shardId: number): Promise<any> {
    if (this.connections.has(shardId)) {
      return this.connections.get(shardId)
    }

    const shard = this.shards.get(shardId)
    if (!shard) {
      throw new Error(`Shard ${shardId} not found`)
    }

    // Create new connection pool
    const pool = await this.createConnectionPool(shard)
    this.connections.set(shardId, pool)

    return pool
  }

  async getConnectionForKey(key: string | number): Promise<any> {
    const shard = this.getShardForKey(key)
    if (!shard) {
      throw new Error(`No shard found for key: ${key}`)
    }

    return this.getConnection(shard.shardId)
  }

  private async createConnectionPool(shard: ShardConfig): Promise<any> {
    // This would be implemented with your database client (pg, mysql2, etc.)
    // Example with PostgreSQL:
    /*
    const { Pool } = require('pg')

    return new Pool({
      host: shard.host,
      port: shard.port,
      database: shard.database,
      user: shard.user,
      password: shard.password,
      max: shard.maxConnections,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
    */

    // Placeholder implementation
    return {
      connect: async () => ({
        query: async (sql: string, params: any[]) => {
          // Simulate database query
          performanceMonitor.recordMetric(`shard.${shard.shardId}.query`, 1)
          return { rows: [], rowCount: 0 }
        },
        release: () => {}
      }),
      query: async (sql: string, params: any[]) => {
        performanceMonitor.recordMetric(`shard.${shard.shardId}.query`, 1)
        return { rows: [], rowCount: 0 }
      }
    }
  }

  // Shard rebalancing utilities
  async rebalanceShard(fromShardId: number, toShardId: number, keyRange: any): Promise<void> {
    // Implement shard rebalancing logic
    performanceMonitor.recordMetric('shard.rebalance.started', 1)

    try {
      // 1. Create read-only copy of source shard data
      // 2. Validate data integrity
      // 3. Switch read traffic to new shard
      // 4. Switch write traffic to new shard
      // 5. Clean up old shard data

      performanceMonitor.recordMetric('shard.rebalance.completed', 1)
    } catch (error) {
      performanceMonitor.recordMetric('shard.rebalance.failed', 1)
      throw error
    }
  }

  // Health monitoring
  async checkShardHealth(shardId: number): Promise<boolean> {
    try {
      const connection = await this.getConnection(shardId)
      await connection.query('SELECT 1')
      return true
    } catch (error) {
      performanceMonitor.recordMetric(`shard.${shardId}.health_check_failed`, 1)
      return false
    }
  }

  // Statistics and monitoring
  getShardStats(): Record<string, any> {
    const stats: Record<string, any> = {}

    for (const [shardId, shard] of this.shards.entries()) {
      stats[`shard_${shardId}`] = {
        region: shard.region,
        readOnly: shard.readOnly,
        maxConnections: shard.maxConnections,
        healthy: true // In real implementation, check actual health
      }
    }

    return stats
  }

  // Cleanup method
  async close(): Promise<void> {
    for (const [shardId, connection] of this.connections.entries()) {
      try {
        await connection.end()
      } catch (error) {
        console.error(`Error closing connection for shard ${shardId}:`, error)
      }
    }

    this.connections.clear()
  }
}

export const shardingManager = ShardingManager.getInstance()

// Configuration for 1M users across 64 shards
export function configureShardingForScale(): void {
  // Primary shards (write operations)
  for (let i = 0; i < 32; i++) {
    shardingManager.registerShard({
      shardId: i,
      host: `db-primary-${i % 4}.genzai.internal`, // 4 primary clusters
      port: 5432,
      database: 'genzai',
      user: 'genzai_app',
      password: process.env.DB_PASSWORD || '',
      maxConnections: 100,
      region: ['us-east-1', 'us-west-2', 'eu-central-1', 'ap-southeast-1'][i % 4],
      readOnly: false
    })
  }

  // Read replica shards (read operations)
  for (let i = 32; i < 64; i++) {
    shardingManager.registerShard({
      shardId: i,
      host: `db-replica-${i % 8}.genzai.internal`, // 8 replica clusters
      port: 5432,
      database: 'genzai',
      user: 'genzai_readonly',
      password: process.env.DB_READONLY_PASSWORD || '',
      maxConnections: 200,
      region: ['us-east-1', 'us-west-2', 'eu-central-1', 'ap-southeast-1', 'sa-east-1', 'ap-northeast-1', 'ca-central-1', 'eu-west-1'][(i - 32) % 8],
      readOnly: true
    })
  }

  console.log('✅ Sharding configured for 1M users across 64 shards')
}

// Database query wrapper with automatic sharding
export class ShardedDatabase {
  private shardingManager: ShardingManager

  constructor() {
    this.shardingManager = ShardingManager.getInstance()
  }

  async query(sql: string, params: any[], key?: string | number): Promise<any> {
    const startTime = performance.now()

    try {
      let connection: any

      if (key) {
        // Use specific shard for the key
        connection = await this.shardingManager.getConnectionForKey(key)
      } else {
        // Use read replica for non-keyed queries
        const replicas = this.shardingManager.getReadReplicas()
        if (replicas.length > 0) {
          const replica = replicas[Math.floor(Math.random() * replicas.length)]
          connection = await this.shardingManager.getConnection(replica.shardId)
        } else {
          throw new Error('No read replicas available')
        }
      }

      const result = await connection.query(sql, params)
      const duration = performance.now() - startTime

      performanceMonitor.recordMetric('db.query.duration', duration)
      performanceMonitor.recordMetric('db.query.success', 1)

      return result
    } catch (error) {
      const duration = performance.now() - startTime
      performanceMonitor.recordMetric('db.query.duration', duration)
      performanceMonitor.recordMetric('db.query.error', 1)

      throw error
    }
  }

  async getUser(userId: string): Promise<any> {
    return this.query(
      'SELECT * FROM users WHERE id = $1',
      [userId],
      userId
    )
  }

  async getUserChats(userId: string, limit: number = 50): Promise<any> {
    return this.query(
      'SELECT * FROM chats WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit],
      userId
    )
  }

  async getChatMessages(chatId: string, limit: number = 100): Promise<any> {
    return this.query(
      'SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at DESC LIMIT $2',
      [chatId, limit],
      chatId
    )
  }

  async createMessage(chatId: string, userId: string, content: string): Promise<any> {
    return this.query(
      'INSERT INTO messages (chat_id, user_id, content, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [chatId, userId, content],
      chatId
    )
  }
}

export const shardedDatabase = new ShardedDatabase()