// 平台类型定义
export type Platform = 'chatgpt' | 'doubao' | 'yuanbao' | 'gemini' | 'grok'

// 消息类型定义
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: {
    model?: string
    tokens?: number
    cost?: number
  }
}

// 对话类型定义
export interface Conversation {
  id: string
  title: string
  platform: Platform
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  folderId?: string
  platformUrl?: string
  metadata?: {
    messageCount: number
    totalTokens?: number
    lastMessagePreview?: string
  }
}

// 文件夹类型定义
export interface Folder {
  id: string
  name: string
  parentId?: string
  children?: Folder[]
  conversationCount?: number
  createdAt: Date
  updatedAt: Date
}

// 搜索和筛选类型定义
export interface SearchFilters {
  query?: string
  platforms?: Platform[]
  dateRange?: {
    start?: Date
    end?: Date
  }
  folderIds?: string[]
}

export interface SearchResult {
  conversation: Conversation
  highlightedContent?: string
  score?: number
}

// 应用状态类型定义
export interface AppState {
  // 对话状态
  conversations: Conversation[]
  currentConversation?: Conversation

  // 文件夹状态
  folders: Folder[]
  currentFolder?: Folder

  // UI状态
  sidebarCollapsed: boolean
  rightPanelCollapsed: boolean
  theme: 'light' | 'dark' | 'system'
  searchQuery: string
  searchFilters: SearchFilters

  // 同步状态
  syncStatus: 'idle' | 'syncing' | 'error' | 'success'
  lastSyncTime?: Date
}

// API响应类型定义
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp: Date
}

// 导出功能类型定义
export type ExportFormat = 'markdown' | 'json' | 'html' | 'csv'

export interface ExportOptions {
  format: ExportFormat
  includeMetadata?: boolean
  includeRawContent?: boolean
  conversationIds?: string[]
}

// 设置类型定义
export interface UserSettings {
  language: 'zh-CN' | 'en-US'
  theme: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'medium' | 'large'
  codeTheme: 'vs' | 'github-dark' | 'monokai'
  syncEnabled: boolean
  syncPlatforms: Platform[]
  syncFrequency: number // 分钟
}

// 事件类型定义
export interface SyncEvent {
  type: 'conversation_added' | 'conversation_updated' | 'conversation_deleted'
  conversationId: string
  platform: Platform
  timestamp: Date
}

export interface AppEvent {
  type: 'sync_status_changed' | 'folder_created' | 'folder_updated' | 'folder_deleted'
  payload: any
  timestamp: Date
}