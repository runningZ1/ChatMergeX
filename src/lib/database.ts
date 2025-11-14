import Dexie, { Table } from 'dexie'
import {
  DBConversation,
  DBMessage,
  DBFolder,
  DBSettings,
  DatabaseSchema,
  DatabaseMigration,
  SearchOptions,
  SearchResult,
  DatabaseResult,
  BulkOperation,
  BulkOperationResult,
  DatabaseStats,
  ExportData,
  ImportOptions,
  ImportResult,
} from '@/types/database'
import { Conversation, Folder, Platform } from '@/types'

// 数据库类定义
class ChatMergeXDatabase extends Dexie {
  conversations!: Table<DBConversation>
  messages!: Table<DBMessage>
  folders!: Table<DBFolder>
  settings!: Table<DBSettings>

  constructor() {
    super('ChatMergeXDatabase')

    // 定义数据库schema版本1
    this.version(1).stores({
      conversations: '++id, title, platform, createdAt, updatedAt, folderId, searchContent',
      messages: '++id, conversationId, role, timestamp',
      folders: '++id, name, parentId, createdAt, updatedAt',
      settings: '++id, key, value, updatedAt'
    })

    // 暂时移除数据验证钩子，后续可以在应用层验证
    // this.conversations.hook('creating', this.validateConversation.bind(this))
    // this.messages.hook('creating', this.validateMessage.bind(this))
    // this.folders.hook('creating', this.validateFolder.bind(this))
  }

  // 数据验证方法
  private validateConversation(primKey: any, obj: DBConversation, trans: any) {
    if (!obj.title || obj.title.trim().length === 0) {
      throw new Error('Conversation title cannot be empty')
    }
    if (!obj.platform || !['chatgpt', 'doubao', 'yuanbao', 'gemini', 'grok'].includes(obj.platform)) {
      throw new Error('Invalid platform')
    }
    if (!obj.messages || !Array.isArray(obj.messages)) {
      throw new Error('Messages must be an array')
    }
  }

  private validateMessage(primKey: any, obj: DBMessage, trans: any) {
    if (!obj.content || obj.content.trim().length === 0) {
      throw new Error('Message content cannot be empty')
    }
    if (!['user', 'assistant'].includes(obj.role)) {
      throw new Error('Invalid message role')
    }
    if (!obj.conversationId) {
      throw new Error('Message must belong to a conversation')
    }
  }

  private validateFolder(primKey: any, obj: DBFolder, trans: any) {
    if (!obj.name || obj.name.trim().length === 0) {
      throw new Error('Folder name cannot be empty')
    }
  }
}

// 数据库管理类
export class DatabaseManager {
  private db: ChatMergeXDatabase
  private static instance: DatabaseManager

  private constructor() {
    this.db = new ChatMergeXDatabase()
  }

  // 单例模式
  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  // 获取数据库实例
  getDB(): ChatMergeXDatabase {
    return this.db
  }

  // ========== 对话相关操作 ==========

  async createConversation(conversation: Omit<DBConversation, 'id'>): Promise<DatabaseResult<string>> {
    try {
      const conversationWithSearch = {
        ...conversation,
        searchContent: this.generateSearchContent(conversation as DBConversation)
      }
      const id = await this.db.conversations.add(conversationWithSearch as DBConversation)

      return {
        success: true,
        data: id.toString(),
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create conversation',
        timestamp: new Date()
      }
    }
  }

  async getConversation(id: string): Promise<DatabaseResult<DBConversation>> {
    try {
      const conversation = await this.db.conversations.get(id)
      if (!conversation) {
        return {
          success: false,
          error: 'Conversation not found',
          timestamp: new Date()
        }
      }

      return {
        success: true,
        data: conversation,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get conversation',
        timestamp: new Date()
      }
    }
  }

  async updateConversation(id: string, updates: Partial<DBConversation>): Promise<DatabaseResult<DBConversation>> {
    try {
      const existing = await this.db.conversations.get(id)
      if (!existing) {
        return {
          success: false,
          error: 'Conversation not found',
          timestamp: new Date()
        }
      }

      const updatedData = {
        ...updates,
        updatedAt: new Date(),
        ...(updates.messages && { searchContent: this.generateSearchContent({ ...existing, ...updates }) })
      }

      await this.db.conversations.update(id, updatedData)

      const updated = await this.db.conversations.get(id)
      return {
        success: true,
        data: updated!,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update conversation',
        timestamp: new Date()
      }
    }
  }

  async deleteConversation(id: string): Promise<DatabaseResult<void>> {
    try {
      await this.db.transaction('rw', this.db.conversations, this.db.messages, async () => {
        await this.db.conversations.delete(id)
        await this.db.messages.where('conversationId').equals(id).delete()
      })

      return {
        success: true,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete conversation',
        timestamp: new Date()
      }
    }
  }

  async getAllConversations(): Promise<DatabaseResult<DBConversation[]>> {
    try {
      const conversations = await this.db.conversations.orderBy('updatedAt').reverse().toArray()
      return {
        success: true,
        data: conversations,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get conversations',
        timestamp: new Date()
      }
    }
  }

  async getConversationsByFolder(folderId?: string): Promise<DatabaseResult<DBConversation[]>> {
    try {
      let query = this.db.conversations.orderBy('updatedAt').reverse()

      if (folderId) {
        query = query.filter(conv => conv.folderId === folderId)
      } else {
        query = query.filter(conv => !conv.folderId)
      }

      const conversations = await query.toArray()

      return {
        success: true,
        data: conversations,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get conversations by folder',
        timestamp: new Date()
      }
    }
  }

  // ========== 文件夹相关操作 ==========

  async createFolder(folder: Omit<DBFolder, 'id'>): Promise<DatabaseResult<string>> {
    try {
      const id = await this.db.folders.add(folder as DBFolder)
      return {
        success: true,
        data: id.toString(),
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create folder',
        timestamp: new Date()
      }
    }
  }

  async getAllFolders(): Promise<DatabaseResult<DBFolder[]>> {
    try {
      const folders = await this.db.folders.orderBy('name').toArray()
      return {
        success: true,
        data: folders,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get folders',
        timestamp: new Date()
      }
    }
  }

  async updateFolder(id: string, updates: Partial<DBFolder>): Promise<DatabaseResult<DBFolder>> {
    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date()
      }

      await this.db.folders.update(id, updatedData)
      const updated = await this.db.folders.get(id)

      if (!updated) {
        return {
          success: false,
          error: 'Folder not found',
          timestamp: new Date()
        }
      }

      return {
        success: true,
        data: updated,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update folder',
        timestamp: new Date()
      }
    }
  }

  async deleteFolder(id: string, moveToRoot = false): Promise<DatabaseResult<void>> {
    try {
      await this.db.transaction('rw', this.db.folders, this.db.conversations, async () => {
        if (moveToRoot) {
          // 将该文件夹下的对话移到根目录
          await this.db.conversations.where('folderId').equals(id).modify({ folderId: undefined })

          // 将子文件夹移到根目录
          const childFolders = await this.db.folders.where('parentId').equals(id).toArray()
          await Promise.all(
            childFolders.map(folder =>
              this.db.folders.update(folder.id, { parentId: undefined })
            )
          )
        }

        await this.db.folders.delete(id)
      })

      return {
        success: true,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete folder',
        timestamp: new Date()
      }
    }
  }

  // ========== 搜索相关操作 ==========

  async searchConversations(options: SearchOptions): Promise<DatabaseResult<SearchResult>> {
    try {
      const { query, platforms, folderIds, dateRange, limit = 50, offset = 0 } = options

      let collection = this.db.conversations.toCollection()

      // 应用筛选条件
      if (platforms && platforms.length > 0) {
        collection = collection.filter(conv => platforms.includes(conv.platform))
      }

      if (folderIds && folderIds.length > 0) {
        collection = collection.filter(conv =>
          conv.folderId !== undefined && folderIds.includes(conv.folderId)
        )
      }

      if (dateRange) {
        collection = collection.filter(conv => {
          const convDate = new Date(conv.updatedAt)
          const start = dateRange.start || new Date(0)
          const end = dateRange.end || new Date()
          return convDate >= start && convDate <= end
        })
      }

      // 全文搜索
      if (query.trim()) {
        const searchTerms = query.toLowerCase().split(/\s+/)
        collection = collection.filter(conv => {
          const searchText = conv.searchContent?.toLowerCase() || ''
          return searchTerms.every(term => searchText.includes(term))
        })
      }

      // 获取总数
      const total = await collection.count()

      // 应用分页和排序
      const conversations = await collection
        .offset(offset)
        .limit(limit)
        .toArray()

      // 手动排序（按更新时间倒序）
      conversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

      return {
        success: true,
        data: {
          conversations,
          total,
          hasMore: offset + conversations.length < total,
          query,
          options
        },
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search conversations',
        timestamp: new Date()
      }
    }
  }

  // ========== 批量操作 ==========

  async bulkConversations(operations: BulkOperation<DBConversation>[]): Promise<DatabaseResult<BulkOperationResult>> {
    try {
      const result: BulkOperationResult = {
        total: operations.length,
        successful: 0,
        failed: 0,
        errors: []
      }

      await this.db.transaction('rw', this.db.conversations, async () => {
        for (let i = 0; i < operations.length; i++) {
          const operation = operations[i]
          try {
            switch (operation.type) {
              case 'add':
                await this.db.conversations.add(operation.data)
                break
              case 'update':
                await this.db.conversations.update(operation.data.id, operation.data)
                break
              case 'delete':
                await this.db.conversations.delete(operation.data.id)
                break
            }
            result.successful++
          } catch (error) {
            result.failed++
            result.errors.push({
              index: i,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }
      })

      return {
        success: true,
        data: result,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to perform bulk operations',
        timestamp: new Date()
      }
    }
  }

  // ========== 数据统计 ==========

  async getDatabaseStats(): Promise<DatabaseResult<DatabaseStats>> {
    try {
      const [conversationCount, messageCount, folderCount, conversations] = await Promise.all([
        this.db.conversations.count(),
        this.db.messages.count(),
        this.db.folders.count(),
        this.db.conversations.toArray()
      ])

      // 按平台统计
      const platformStats: Record<Platform, { conversationCount: number; messageCount: number }> = {
        chatgpt: { conversationCount: 0, messageCount: 0 },
        doubao: { conversationCount: 0, messageCount: 0 },
        yuanbao: { conversationCount: 0, messageCount: 0 },
        gemini: { conversationCount: 0, messageCount: 0 },
        grok: { conversationCount: 0, messageCount: 0 }
      }

      conversations.forEach(conv => {
        if (platformStats[conv.platform]) {
          platformStats[conv.platform].conversationCount++
          platformStats[conv.platform].messageCount += conv.messages?.length || 0
        }
      })

      // 估算存储大小
      const totalSize = this.estimateStorageSize(conversations)

      const stats: DatabaseStats = {
        conversationCount,
        messageCount,
        folderCount,
        totalSize,
        platformStats
      }

      return {
        success: true,
        data: stats,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get database stats',
        timestamp: new Date()
      }
    }
  }

  // ========== 导入导出 ==========

  async exportData(): Promise<DatabaseResult<ExportData>> {
    try {
      const [conversations, folders, settings] = await Promise.all([
        this.db.conversations.toArray(),
        this.db.folders.toArray(),
        this.db.settings.toArray()
      ])

      const settingsRecord = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value
        return acc
      }, {} as Record<string, any>)

      const exportData: ExportData = {
        conversations,
        folders,
        settings: settingsRecord,
        exportDate: new Date(),
        version: '1.0.0'
      }

      return {
        success: true,
        data: exportData,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export data',
        timestamp: new Date()
      }
    }
  }

  // ========== 工具方法 ==========

  private generateSearchContent(conversation: DBConversation): string {
    const parts = [conversation.title]

    if (conversation.messages) {
      conversation.messages.forEach(message => {
        parts.push(message.content)
      })
    }

    return parts.join(' ').toLowerCase()
  }

  private estimateStorageSize(data: any[]): number {
    const jsonString = JSON.stringify(data)
    return new Blob([jsonString]).size
  }

  // ========== 设置相关操作 ==========

  async getSetting(key: string): Promise<DatabaseResult<any>> {
    try {
      const setting = await this.db.settings.where('key').equals(key).first()
      return {
        success: true,
        data: setting?.value,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get setting',
        timestamp: new Date()
      }
    }
  }

  async setSetting(key: string, value: any): Promise<DatabaseResult<void>> {
    try {
      // 先查找是否已存在该设置
      const existing = await this.db.settings.where('key').equals(key).first()

      if (existing) {
        await this.db.settings.update(existing.id, {
          value,
          updatedAt: new Date()
        })
      } else {
        await this.db.settings.add({
          key,
          value,
          updatedAt: new Date()
        } as DBSettings)
      }

      return {
        success: true,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set setting',
        timestamp: new Date()
      }
    }
  }

  // 清空数据库
  async clearDatabase(): Promise<DatabaseResult<void>> {
    try {
      await this.db.transaction('rw', this.db.conversations, this.db.messages, this.db.folders, this.db.settings, async () => {
        await Promise.all([
          this.db.conversations.clear(),
          this.db.messages.clear(),
          this.db.folders.clear(),
          this.db.settings.clear()
        ])
      })

      return {
        success: true,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear database',
        timestamp: new Date()
      }
    }
  }
}

// 导出单例实例
export const database = DatabaseManager.getInstance()