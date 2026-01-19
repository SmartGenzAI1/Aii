import { logger } from '../monitoring/logger'
import { shardingManager } from '../database/sharding-manager'
import { cacheManager } from '../cache/cache-manager'

interface RetentionPolicy {
  chatRetentionDays: number
  messageRetentionDays: number
  autoDeleteEnabled: boolean
  localStorageFallback: boolean
  compressionEnabled: boolean
}

interface ChatMetadata {
  chatId: string
  userId: string
  lastActivity: Date
  messageCount: number
  totalSize: number
  shardId: number
}

class ChatRetentionManager {
  private static instance: ChatRetentionManager
  private policy: RetentionPolicy
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    this.policy = {
      chatRetentionDays: 14, // 14 days as requested
      messageRetentionDays: 14,
      autoDeleteEnabled: true,
      localStorageFallback: true,
      compressionEnabled: true
    }

    // Start automated cleanup
    this.startAutomatedCleanup()
  }

  static getInstance(): ChatRetentionManager {
    if (!ChatRetentionManager.instance) {
      ChatRetentionManager.instance = new ChatRetentionManager()
    }
    return ChatRetentionManager.instance
  }

  // Configure retention policy
  updatePolicy(newPolicy: Partial<RetentionPolicy>): void {
    this.policy = { ...this.policy, ...newPolicy }
    logger.info('Chat retention policy updated', { policy: this.policy })
  }

  // Check if chat should be retained in database
  shouldRetainInDatabase(chatId: string, lastActivity: Date): boolean {
    const daysSinceActivity = this.getDaysSinceActivity(lastActivity)
    return daysSinceActivity <= this.policy.chatRetentionDays
  }

  // Move chat to local storage when retention period expires
  async archiveChatToLocalStorage(chatId: string, userId: string): Promise<boolean> {
    try {
      // Get chat data before archiving
      const chatData = await this.getChatData(chatId, userId)
      if (!chatData) {
        logger.warn('Chat data not found for archiving', { chatId, userId })
        return false
      }

      // Compress chat data if enabled
      const compressedData = this.policy.compressionEnabled
        ? await this.compressChatData(chatData)
        : chatData

      // Store in user's local storage (client-side)
      const localStorageKey = `archived_chat_${chatId}`
      const storageData = {
        chatId,
        userId,
        archivedAt: new Date().toISOString(),
        data: compressedData,
        checksum: this.generateChecksum(compressedData)
      }

      // In a real implementation, this would be sent to the client
      // For now, we'll store in cache as a placeholder
      await cacheManager.set(`local_storage_${userId}_${chatId}`, storageData, {
        ttl: 365 * 24 * 60 * 60 * 1000 // 1 year in cache
      })

      // Remove from database
      await this.deleteChatFromDatabase(chatId, userId)

      logger.info('Chat archived to local storage', {
        chatId,
        userId,
        originalSize: JSON.stringify(chatData).length,
        archivedSize: JSON.stringify(compressedData).length
      })

      return true
    } catch (error) {
      logger.error('Failed to archive chat to local storage', { chatId, userId, error })
      return false
    }
  }

  // Automated cleanup process
  private startAutomatedCleanup(): void {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.performCleanup()
      } catch (error) {
        logger.error('Automated cleanup failed', { error })
      }
    }, 60 * 60 * 1000) // 1 hour

    // Also run cleanup on startup
    setTimeout(() => this.performCleanup(), 10000)
  }

  private async performCleanup(): Promise<void> {
    if (!this.policy.autoDeleteEnabled) return

    logger.info('Starting automated chat cleanup')

    const retentionDate = new Date()
    retentionDate.setDate(retentionDate.getDate() - this.policy.chatRetentionDays)

    try {
      // Find chats older than retention period
      const expiredChats = await this.findExpiredChats(retentionDate)

      logger.info(`Found ${expiredChats.length} expired chats for cleanup`)

      let archivedCount = 0
      let deletedCount = 0

      for (const chat of expiredChats) {
        try {
          if (this.policy.localStorageFallback) {
            const archived = await this.archiveChatToLocalStorage(chat.chatId, chat.userId)
            if (archived) {
              archivedCount++
            } else {
              // If archiving fails, delete from database
              await this.deleteChatFromDatabase(chat.chatId, chat.userId)
              deletedCount++
            }
          } else {
            await this.deleteChatFromDatabase(chat.chatId, chat.userId)
            deletedCount++
          }
        } catch (error) {
          logger.error('Failed to cleanup chat', { chatId: chat.chatId, userId: chat.userId, error })
        }
      }

      logger.info('Chat cleanup completed', {
        totalProcessed: expiredChats.length,
        archivedToLocal: archivedCount,
        deletedFromDB: deletedCount
      })

    } catch (error) {
      logger.error('Chat cleanup process failed', { error })
    }
  }

  // Find chats that have expired retention period
  private async findExpiredChats(retentionDate: Date): Promise<ChatMetadata[]> {
    const expiredChats: ChatMetadata[] = []

    try {
      // Get all shards
      const shards = shardingManager.getAllShards()

      // Query each shard for expired chats
      for (const shard of shards) {
        try {
          const connection = await shardingManager.getConnection(shard.shardId)

          const result = await connection.query(`
            SELECT
              c.id as chat_id,
              c.user_id,
              c.updated_at as last_activity,
              COUNT(m.id) as message_count,
              COALESCE(SUM(LENGTH(m.content)), 0) as total_size
            FROM chats c
            LEFT JOIN messages m ON c.id = m.chat_id
            WHERE c.updated_at < $1
            GROUP BY c.id, c.user_id, c.updated_at
            LIMIT 1000
          `, [retentionDate])

          for (const row of result.rows) {
            expiredChats.push({
              chatId: row.chat_id,
              userId: row.user_id,
              lastActivity: new Date(row.last_activity),
              messageCount: parseInt(row.message_count),
              totalSize: parseInt(row.total_size),
              shardId: shard.shardId
            })
          }
        } catch (error) {
          logger.error('Failed to query shard for expired chats', {
            shardId: shard.shardId,
            error
          })
        }
      }
    } catch (error) {
      logger.error('Failed to find expired chats', { error })
    }

    return expiredChats
  }

  // Get chat data for archiving
  private async getChatData(chatId: string, userId: string): Promise<any | null> {
    try {
      const shard = shardingManager.getShardForKey(chatId)
      if (!shard) return null

      const connection = await shardingManager.getConnection(shard.shardId)

      // Get chat metadata
      const chatResult = await connection.query(
        'SELECT * FROM chats WHERE id = $1 AND user_id = $2',
        [chatId, userId]
      )

      if (chatResult.rows.length === 0) return null

      // Get all messages
      const messagesResult = await connection.query(
        'SELECT * FROM messages WHERE chat_id = $1 ORDER BY sequence_number',
        [chatId]
      )

      return {
        chat: chatResult.rows[0],
        messages: messagesResult.rows,
        exportedAt: new Date().toISOString(),
        retentionPolicy: this.policy
      }
    } catch (error) {
      logger.error('Failed to get chat data', { chatId, userId, error })
      return null
    }
  }

  // Delete chat from database
  private async deleteChatFromDatabase(chatId: string, userId: string): Promise<void> {
    try {
      const shard = shardingManager.getShardForKey(chatId)
      if (!shard) return

      const connection = await shardingManager.getConnection(shard.shardId)

      // Delete messages first (foreign key constraint)
      await connection.query('DELETE FROM messages WHERE chat_id = $1', [chatId])

      // Delete chat
      await connection.query('DELETE FROM chats WHERE id = $1 AND user_id = $2', [chatId, userId])

      // Invalidate cache
      cacheManager.delete(`chat_${chatId}`)
      cacheManager.delete(`user_chats_${userId}`)

      logger.info('Chat deleted from database', { chatId, userId })
    } catch (error) {
      logger.error('Failed to delete chat from database', { chatId, userId, error })
      throw error
    }
  }

  // Compress chat data for storage
  private async compressChatData(data: any): Promise<any> {
    // In a real implementation, use compression like gzip
    // For now, return as-is
    return data
  }

  // Generate checksum for data integrity
  private generateChecksum(data: any): string {
    const crypto = require('crypto')
    const hash = crypto.createHash('sha256')
    hash.update(JSON.stringify(data))
    return hash.digest('hex')
  }

  // Utility methods
  private getDaysSinceActivity(lastActivity: Date): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - lastActivity.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Manual cleanup trigger
  async triggerCleanup(): Promise<void> {
    await this.performCleanup()
  }

  // Get retention statistics
  async getRetentionStats(): Promise<{
    totalChats: number
    expiredChats: number
    archivedChats: number
    avgChatAge: number
    storageSaved: number
  }> {
    // Implementation would query database for statistics
    // Placeholder return
    return {
      totalChats: 0,
      expiredChats: 0,
      archivedChats: 0,
      avgChatAge: 0,
      storageSaved: 0
    }
  }

  // Graceful shutdown
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

export const chatRetentionManager = ChatRetentionManager.getInstance()