import { logger } from '../monitoring/logger'

interface ArchivedChat {
  chatId: string
  userId: string
  archivedAt: string
  data: {
    chat: any
    messages: any[]
    exportedAt: string
    retentionPolicy: any
  }
  checksum: string
  compressed?: boolean
}

interface LocalStorageStats {
  totalChats: number
  totalSize: number
  oldestChat: Date | null
  newestChat: Date | null
}

class LocalChatStorage {
  private static instance: LocalChatStorage
  private readonly STORAGE_PREFIX = 'genzai_archived_chat_'
  private readonly MAX_STORAGE_SIZE = 500 * 1024 * 1024 // 500MB limit
  private readonly COMPRESSION_THRESHOLD = 50 * 1024 // 50KB

  static getInstance(): LocalChatStorage {
    if (!LocalChatStorage.instance) {
      LocalChatStorage.instance = new LocalChatStorage()
    }
    return LocalChatStorage.instance
  }

  // Store archived chat in local storage
  async storeArchivedChat(archivedChat: ArchivedChat): Promise<boolean> {
    try {
      // Check storage quota
      if (!await this.checkStorageQuota(archivedChat)) {
        logger.warn('Local storage quota exceeded, cannot store archived chat', {
          chatId: archivedChat.chatId,
          requiredSpace: this.estimateSize(archivedChat)
        })
        return false
      }

      // Compress if data is large
      const shouldCompress = this.estimateSize(archivedChat) > this.COMPRESSION_THRESHOLD
      const finalData = shouldCompress
        ? await this.compressData(archivedChat)
        : archivedChat

      const storageKey = `${this.STORAGE_PREFIX}${archivedChat.chatId}`

      // Store in localStorage (in browser) or cache (in server)
      if (typeof window !== 'undefined' && window.localStorage) {
        const serializedData = JSON.stringify(finalData)
        localStorage.setItem(storageKey, serializedData)

        // Also store in index for easy retrieval
        this.updateChatIndex(archivedChat.chatId, archivedChat.archivedAt)
      }

      logger.info('Archived chat stored locally', {
        chatId: archivedChat.chatId,
        userId: archivedChat.userId,
        size: this.estimateSize(finalData),
        compressed: shouldCompress
      })

      return true
    } catch (error) {
      logger.error('Failed to store archived chat locally', {
        chatId: archivedChat.chatId,
        error
      })
      return false
    }
  }

  // Retrieve archived chat from local storage
  async getArchivedChat(chatId: string): Promise<ArchivedChat | null> {
    try {
      const storageKey = `${this.STORAGE_PREFIX}${chatId}`

      let storedData: string | null = null

      if (typeof window !== 'undefined' && window.localStorage) {
        storedData = localStorage.getItem(storageKey)
      }

      if (!storedData) return null

      const archivedChat: ArchivedChat = JSON.parse(storedData)

      // Verify checksum for data integrity
      const calculatedChecksum = this.generateChecksum(archivedChat.data)
      if (calculatedChecksum !== archivedChat.checksum) {
        logger.warn('Archived chat checksum mismatch, data may be corrupted', {
          chatId,
          storedChecksum: archivedChat.checksum,
          calculatedChecksum
        })
        return null
      }

      // Decompress if needed
      if (archivedChat.compressed) {
        archivedChat.data = await this.decompressData(archivedChat.data)
      }

      logger.debug('Archived chat retrieved from local storage', {
        chatId,
        userId: archivedChat.userId,
        archivedAt: archivedChat.archivedAt
      })

      return archivedChat
    } catch (error) {
      logger.error('Failed to retrieve archived chat', { chatId, error })
      return null
    }
  }

  // Delete archived chat from local storage
  async deleteArchivedChat(chatId: string): Promise<boolean> {
    try {
      const storageKey = `${this.STORAGE_PREFIX}${chatId}`

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(storageKey)
        this.removeFromChatIndex(chatId)
      }

      logger.info('Archived chat deleted from local storage', { chatId })
      return true
    } catch (error) {
      logger.error('Failed to delete archived chat', { chatId, error })
      return false
    }
  }

  // Get all archived chats for a user
  async getArchivedChatsForUser(userId: string): Promise<ArchivedChat[]> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return []
      }

      const archivedChats: ArchivedChat[] = []
      const chatIndex = this.getChatIndex()

      for (const chatId of chatIndex.chatIds) {
        try {
          const chat = await this.getArchivedChat(chatId)
          if (chat && chat.userId === userId) {
            archivedChats.push(chat)
          }
        } catch (error) {
          logger.warn('Failed to load archived chat during index scan', {
            chatId,
            userId,
            error
          })
        }
      }

      // Sort by archived date (newest first)
      archivedChats.sort((a, b) =>
        new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime()
      )

      return archivedChats
    } catch (error) {
      logger.error('Failed to get archived chats for user', { userId, error })
      return []
    }
  }

  // Clean up old archived chats based on local storage limits
  async cleanupOldChats(maxAgeDays: number = 365): Promise<number> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return 0
      }

      const chatIndex = this.getChatIndex()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays)

      let deletedCount = 0
      const remainingChatIds: string[] = []

      for (const chatId of chatIndex.chatIds) {
        try {
          const chat = await this.getArchivedChat(chatId)
          if (chat) {
            const archivedDate = new Date(chat.archivedAt)
            if (archivedDate < cutoffDate) {
              await this.deleteArchivedChat(chatId)
              deletedCount++
            } else {
              remainingChatIds.push(chatId)
            }
          }
        } catch (error) {
          // If we can't read the chat, remove it from index
          logger.warn('Removing corrupted chat from index', { chatId })
        }
      }

      // Update index with remaining chats
      this.saveChatIndex(remainingChatIds)

      logger.info('Local storage cleanup completed', {
        deletedCount,
        remainingChats: remainingChatIds.length
      })

      return deletedCount
    } catch (error) {
      logger.error('Failed to cleanup old archived chats', { error })
      return 0
    }
  }

  // Get local storage statistics
  getStorageStats(): LocalStorageStats {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return {
          totalChats: 0,
          totalSize: 0,
          oldestChat: null,
          newestChat: null
        }
      }

      const chatIndex = this.getChatIndex()
      let totalSize = 0
      let oldestChat: Date | null = null
      let newestChat: Date | null = null

      for (const chatId of chatIndex.chatIds) {
        try {
          const chat = localStorage.getItem(`${this.STORAGE_PREFIX}${chatId}`)
          if (chat) {
            totalSize += chat.length
          }

          const archivedChat = JSON.parse(chat!)
          const archivedDate = new Date(archivedChat.archivedAt)

          if (!oldestChat || archivedDate < oldestChat) {
            oldestChat = archivedDate
          }
          if (!newestChat || archivedDate > newestChat) {
            newestChat = archivedDate
          }
        } catch (error) {
          // Skip corrupted entries
        }
      }

      return {
        totalChats: chatIndex.chatIds.length,
        totalSize,
        oldestChat,
        newestChat
      }
    } catch (error) {
      logger.error('Failed to get storage stats', { error })
      return {
        totalChats: 0,
        totalSize: 0,
        oldestChat: null,
        newestChat: null
      }
    }
  }

  // Export all archived chats (for backup)
  async exportAllChats(): Promise<string> {
    try {
      const stats = this.getStorageStats()
      const allChats: ArchivedChat[] = []

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.STORAGE_PREFIX)) {
          const chatId = key.replace(this.STORAGE_PREFIX, '')
          const chat = await this.getArchivedChat(chatId)
          if (chat) {
            allChats.push(chat)
          }
        }
      }

      const exportData = {
        exportedAt: new Date().toISOString(),
        totalChats: allChats.length,
        totalSize: stats.totalSize,
        chats: allChats
      }

      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      logger.error('Failed to export archived chats', { error })
      throw error
    }
  }

  // Import archived chats (for restore)
  async importChats(importData: string): Promise<number> {
    try {
      const data = JSON.parse(importData)
      let importedCount = 0

      for (const chat of data.chats) {
        if (await this.storeArchivedChat(chat)) {
          importedCount++
        }
      }

      logger.info('Archived chats imported successfully', { importedCount })
      return importedCount
    } catch (error) {
      logger.error('Failed to import archived chats', { error })
      throw error
    }
  }

  // Private helper methods
  private async checkStorageQuota(newChat: ArchivedChat): Promise<boolean> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return true // No storage limits on server
    }

    const currentStats = this.getStorageStats()
    const newChatSize = this.estimateSize(newChat)

    // Check if adding this chat would exceed the limit
    if (currentStats.totalSize + newChatSize > this.MAX_STORAGE_SIZE) {
      // Try to free up space by cleaning old chats
      const freedSpace = await this.cleanupOldChats(180) // Keep only 6 months

      if (currentStats.totalSize - freedSpace + newChatSize > this.MAX_STORAGE_SIZE) {
        return false // Still not enough space
      }
    }

    return true
  }

  private estimateSize(data: any): number {
    return JSON.stringify(data).length
  }

  private async compressData(data: any): Promise<any> {
    // In a real implementation, use a compression library like pako
    // For now, return as-is
    return {
      ...data,
      compressed: true
    }
  }

  private async decompressData(data: any): Promise<any> {
    // In a real implementation, decompress the data
    // For now, return as-is
    const { compressed, ...originalData } = data
    return originalData
  }

  private generateChecksum(data: any): string {
    // Simple checksum - in production use crypto
    let checksum = 0
    const str = JSON.stringify(data)
    for (let i = 0; i < str.length; i++) {
      checksum = ((checksum << 5) - checksum + str.charCodeAt(i)) & 0xffffffff
    }
    return checksum.toString(16)
  }

  private getChatIndex(): { chatIds: string[]; lastUpdated: string } {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return { chatIds: [], lastUpdated: new Date().toISOString() }
      }

      const indexData = localStorage.getItem('genzai_chat_index')
      return indexData
        ? JSON.parse(indexData)
        : { chatIds: [], lastUpdated: new Date().toISOString() }
    } catch (error) {
      logger.error('Failed to get chat index', { error })
      return { chatIds: [], lastUpdated: new Date().toISOString() }
    }
  }

  private saveChatIndex(chatIds: string[]): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return

      const indexData = {
        chatIds,
        lastUpdated: new Date().toISOString()
      }

      localStorage.setItem('genzai_chat_index', JSON.stringify(indexData))
    } catch (error) {
      logger.error('Failed to save chat index', { error })
    }
  }

  private updateChatIndex(chatId: string, archivedAt: string): void {
    const index = this.getChatIndex()
    if (!index.chatIds.includes(chatId)) {
      index.chatIds.push(chatId)
      this.saveChatIndex(index.chatIds)
    }
  }

  private removeFromChatIndex(chatId: string): void {
    const index = this.getChatIndex()
    const filteredIds = index.chatIds.filter(id => id !== chatId)
    if (filteredIds.length !== index.chatIds.length) {
      this.saveChatIndex(filteredIds)
    }
  }
}

export const localChatStorage = LocalChatStorage.getInstance()