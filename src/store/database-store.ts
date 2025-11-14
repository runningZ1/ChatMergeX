import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { database } from '@/lib/database'
import {
  DBConversation,
  DBFolder,
  SearchOptions,
  SearchResult,
  DatabaseStats,
  DatabaseResult,
} from '@/types/database'
import { Conversation, Folder, Platform } from '@/types'

// 数据库状态接口
interface DatabaseState {
  // 数据状态
  conversations: Conversation[]
  folders: Folder[]
  currentConversation?: Conversation
  currentFolder?: string
  searchResult?: SearchResult
  databaseStats?: DatabaseStats

  // UI状态
  isLoading: boolean
  isSearching: boolean
  error?: string
  lastSyncTime?: Date

  // 操作方法
  loadConversations: () => Promise<void>
  loadConversation: (id: string) => Promise<Conversation | undefined>
  createConversation: (conversation: Omit<Conversation, 'id'>) => Promise<boolean>
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<boolean>
  deleteConversation: (id: string) => Promise<boolean>

  loadFolders: () => Promise<void>
  createFolder: (folder: Omit<Folder, 'id'>) => Promise<boolean>
  updateFolder: (id: string, updates: Partial<Folder>) => Promise<boolean>
  deleteFolder: (id: string, moveToRoot?: boolean) => Promise<boolean>

  searchConversations: (options: SearchOptions) => Promise<void>
  clearSearch: () => void
  loadDatabaseStats: () => Promise<void>

  refreshData: () => Promise<void>
  clearError: () => void
}

// 转换数据库格式到应用格式
function transformDBConversation(dbConv: DBConversation): Conversation {
  return {
    id: dbConv.id,
    title: dbConv.title,
    platform: dbConv.platform,
    messages: dbConv.messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      metadata: msg.metadata
    })),
    createdAt: new Date(dbConv.createdAt),
    updatedAt: new Date(dbConv.updatedAt),
    folderId: dbConv.folderId,
    platformUrl: dbConv.platformUrl,
    metadata: dbConv.metadata
  }
}

function transformDBFolder(dbFolder: DBFolder): Folder {
  return {
    id: dbFolder.id,
    name: dbFolder.name,
    parentId: dbFolder.parentId,
    children: [],
    conversationCount: dbFolder.conversationCount,
    createdAt: new Date(dbFolder.createdAt),
    updatedAt: new Date(dbFolder.updatedAt)
  }
}

// 构建文件夹树结构
function buildFolderTree(folders: DBFolder[]): Folder[] {
  const folderMap = new Map<string, Folder>()
  const rootFolders: Folder[] = []

  // 转换为Map
  folders.forEach(folder => {
    folderMap.set(folder.id, {
      ...transformDBFolder(folder),
      children: []
    })
  })

  // 构建树结构
  folders.forEach(folder => {
    const transformedFolder = folderMap.get(folder.id)!
    if (folder.parentId && folderMap.has(folder.parentId)) {
      const parent = folderMap.get(folder.parentId)!
      parent.children!.push(transformedFolder)
    } else {
      rootFolders.push(transformedFolder)
    }
  })

  return rootFolders
}

// 创建简化的数据库store
export const useDatabaseStore = create<DatabaseState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        conversations: [],
        folders: [],
        isLoading: false,
        isSearching: false,

        // 加载对话列表
        loadConversations: async () => {
          set({ isLoading: true, error: undefined })

          try {
            const result = await database.getAllConversations()
            if (result.success && result.data) {
              const conversations = result.data.map(transformDBConversation)
              set({ conversations, isLoading: false })
            } else {
              set({ error: result.error || 'Failed to load conversations', isLoading: false })
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Unknown error',
              isLoading: false
            })
          }
        },

        // 加载单个对话
        loadConversation: async (id: string) => {
          try {
            const result = await database.getConversation(id)
            if (result.success && result.data) {
              const conversation = transformDBConversation(result.data)
              set({ currentConversation: conversation })
              return conversation
            } else {
              set({ error: result.error || 'Conversation not found' })
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Unknown error' })
          }
          return undefined
        },

        // 创建对话
        createConversation: async (conversation) => {
          try {
            const dbConv = {
              title: conversation.title,
              platform: conversation.platform,
              messages: conversation.messages.map(msg => ({
                id: msg.id,
                conversationId: 'temp-id', // 会被数据库替换
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp,
                metadata: msg.metadata
              })),
              createdAt: conversation.createdAt,
              updatedAt: conversation.updatedAt,
              folderId: conversation.folderId,
              platformUrl: conversation.platformUrl,
              metadata: conversation.metadata
            }

            const result = await database.createConversation(dbConv)
            if (result.success) {
              await get().loadConversations()
              return true
            } else {
              set({ error: result.error || 'Failed to create conversation' })
              return false
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Unknown error' })
            return false
          }
        },

        // 更新对话
        updateConversation: async (id: string, updates) => {
          try {
            const current = get().conversations.find(c => c.id === id)
            if (!current) {
              set({ error: 'Conversation not found' })
              return false
            }

            const updatedConv = { ...current, ...updates, updatedAt: new Date() }
            const dbUpdates = {
              title: updatedConv.title,
              platform: updatedConv.platform,
              messages: updatedConv.messages.map(msg => ({
                id: msg.id,
                conversationId: updatedConv.id,
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp,
                metadata: msg.metadata
              })),
              createdAt: updatedConv.createdAt,
              updatedAt: updatedConv.updatedAt,
              folderId: updatedConv.folderId,
              platformUrl: updatedConv.platformUrl,
              metadata: updatedConv.metadata
            }

            const result = await database.updateConversation(id, dbUpdates)
            if (result.success) {
              set(state => ({
                conversations: state.conversations.map(c => c.id === id ? updatedConv : c),
                currentConversation: state.currentConversation?.id === id ? updatedConv : state.currentConversation
              }))
              return true
            } else {
              set({ error: result.error || 'Failed to update conversation' })
              return false
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Unknown error' })
            return false
          }
        },

        // 删除对话
        deleteConversation: async (id: string) => {
          try {
            const result = await database.deleteConversation(id)
            if (result.success) {
              set(state => ({
                conversations: state.conversations.filter(c => c.id !== id),
                currentConversation: state.currentConversation?.id === id ? undefined : state.currentConversation
              }))
              return true
            } else {
              set({ error: result.error || 'Failed to delete conversation' })
              return false
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Unknown error' })
            return false
          }
        },

        // 加载文件夹
        loadFolders: async () => {
          try {
            const result = await database.getAllFolders()
            if (result.success && result.data) {
              const folders = buildFolderTree(result.data)
              set({ folders })
            } else {
              set({ error: result.error || 'Failed to load folders' })
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Unknown error' })
          }
        },

        // 创建文件夹
        createFolder: async (folder) => {
          try {
            const dbFolder = {
              ...folder,
              createdAt: new Date(),
              updatedAt: new Date()
            }

            const result = await database.createFolder(dbFolder)
            if (result.success) {
              await get().loadFolders()
              return true
            } else {
              set({ error: result.error || 'Failed to create folder' })
              return false
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Unknown error' })
            return false
          }
        },

        // 更新文件夹
        updateFolder: async (id: string, updates) => {
          try {
            const result = await database.updateFolder(id, {
              ...updates,
              updatedAt: new Date()
            })

            if (result.success) {
              await get().loadFolders()
              return true
            } else {
              set({ error: result.error || 'Failed to update folder' })
              return false
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Unknown error' })
            return false
          }
        },

        // 删除文件夹
        deleteFolder: async (id: string, moveToRoot = false) => {
          try {
            const result = await database.deleteFolder(id, moveToRoot)
            if (result.success) {
              await Promise.all([get().loadFolders(), get().loadConversations()])
              return true
            } else {
              set({ error: result.error || 'Failed to delete folder' })
              return false
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Unknown error' })
            return false
          }
        },

        // 搜索对话
        searchConversations: async (options) => {
          set({ isSearching: true, error: undefined })

          try {
            const result = await database.searchConversations(options)
            if (result.success && result.data) {
              const conversations = result.data.conversations.map(transformDBConversation)
              set({
                searchResult: {
                  ...result.data,
                  conversations
                } as any,
                isSearching: false
              })
            } else {
              set({ error: result.error || 'Search failed', isSearching: false })
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Unknown error', isSearching: false })
          }
        },

        // 清除搜索结果
        clearSearch: () => {
          set({ searchResult: undefined })
        },

        // 加载数据库统计
        loadDatabaseStats: async () => {
          try {
            const result = await database.getDatabaseStats()
            if (result.success && result.data) {
              set({ databaseStats: result.data })
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to load stats' })
          }
        },

        // 刷新数据
        refreshData: async () => {
          await Promise.all([
            get().loadConversations(),
            get().loadFolders(),
            get().loadDatabaseStats()
          ])
          set({ lastSyncTime: new Date() })
        },

        // 清除错误
        clearError: () => {
          set({ error: undefined })
        }
      }),
      {
        name: 'chatmergex-database-store',
        partialize: (state) => ({
          currentFolder: state.currentFolder,
          lastSyncTime: state.lastSyncTime
        })
      }
    ),
    { name: 'database-store' }
  )
)