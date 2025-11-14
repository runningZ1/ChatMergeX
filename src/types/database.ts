import { Conversation, Folder, Platform, Message } from './index'
import Dexie from 'dexie'

// 数据库表接口定义
export interface DBConversation {
  id: string
  title: string
  platform: Platform
  messages: DBMessage[]
  createdAt: Date
  updatedAt: Date
  folderId?: string
  platformUrl?: string
  searchContent?: string // 用于全文搜索的字段
  metadata?: {
    messageCount: number
    totalTokens?: number
    lastMessagePreview?: string
    model?: string
    cost?: number
  }
}

export interface DBMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: {
    model?: string
    tokens?: number
    cost?: number
    thinkingTime?: number
  }
}

export interface DBFolder {
  id: string
  name: string
  parentId?: string
  createdAt: Date
  updatedAt: Date
  conversationCount?: number
  color?: string // 文件夹颜色标识
  icon?: string // 文件夹图标
}

export interface DBSettings {
  id: string
  key: string
  value: any
  updatedAt: Date
}

// 数据库版本和迁移相关
export interface DatabaseSchema {
  version: number
  stores: {
    conversations: string
    messages: string
    folders: string
    settings: string
  }
}

export type DatabaseMigration = {
  version: number
  migrate: (db: Dexie) => void | Promise<void>
}

// 搜索相关类型
export interface SearchIndex {
  id: string
  type: 'conversation' | 'message'
  content: string
  title?: string
  platform?: Platform
  conversationId?: string
  timestamp: Date
  relevanceScore?: number
}

export interface SearchOptions {
  query: string
  platforms?: Platform[]
  folderIds?: string[]
  dateRange?: {
    start?: Date
    end?: Date
  }
  limit?: number
  offset?: number
  sortBy?: 'relevance' | 'date' | 'title'
  sortOrder?: 'asc' | 'desc'
}

export interface SearchResult {
  conversations: DBConversation[]
  total: number
  hasMore: boolean
  query: string
  options: SearchOptions
}

// 数据库操作结果类型
export interface DatabaseResult<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp: Date
}

// 批量操作类型
export interface BulkOperation<T> {
  type: 'add' | 'update' | 'delete'
  data: T
}

export interface BulkOperationResult {
  total: number
  successful: number
  failed: number
  errors: Array<{ index: number; error: string }>
}

// 数据库统计信息
export interface DatabaseStats {
  conversationCount: number
  messageCount: number
  folderCount: number
  totalSize: number // 估算的存储大小（字节）
  lastSyncTime?: Date
  platformStats: Record<Platform, {
    conversationCount: number
    messageCount: number
  }>
}

// 导出/导入相关类型
export interface ExportData {
  conversations: DBConversation[]
  folders: DBFolder[]
  settings: Record<string, any>
  exportDate: Date
  version: string
}

export interface ImportOptions {
  mergeStrategy: 'replace' | 'merge' | 'skip-existing'
  validateData?: boolean
  preserveIds?: boolean
}

export interface ImportResult {
  totalConversations: number
  importedConversations: number
  totalFolders: number
  importedFolders: number
  skipped: number
  errors: string[]
}