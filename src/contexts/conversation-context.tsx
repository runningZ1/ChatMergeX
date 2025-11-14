import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface Conversation {
  id: string
  title: string
  platform: 'chatgpt' | 'doubao' | 'yuanbao' | 'gemini' | 'grok'
  messageCount: number
  wordCount: number
  lastModified: Date
  messages: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  }>
  metadata?: {
    model?: string
    temperature?: number
    tokens?: number
  }
  lastMessage: string
  isRead: boolean
  hasAttachments: boolean
  isStarred: boolean
}

interface ConversationContextType {
  selectedConversation: Conversation | null
  selectedIds: string[]
  isRightPanelOpen: boolean
  setSelectedConversation: (conversation: Conversation | null) => void
  setSelectedIds: (ids: string[]) => void
  toggleRightPanel: () => void
  handleConversationSelect: (conversation: Conversation) => void
  handleConversationAction: (action: 'edit' | 'delete' | 'export' | 'open', conversationId: string) => void
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined)

interface ConversationProviderProps {
  children: ReactNode
}

function ConversationProvider({ children }: ConversationProviderProps) {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true)

  const toggleRightPanel = useCallback(() => {
    setIsRightPanelOpen(prev => !prev)
  }, [])

  const handleConversationSelect = useCallback((conversation: Conversation) => {
    setSelectedConversation(conversation)
    // 如果右面板关闭，则打开它
    if (!isRightPanelOpen) {
      setIsRightPanelOpen(true)
    }
  }, [isRightPanelOpen])

  const handleConversationAction = useCallback((action: 'edit' | 'delete' | 'export' | 'open', conversationId: string) => {
    console.log(`Action ${action} on conversation ${conversationId}`)
    // TODO: 实现具体的对话操作逻辑
  }, [])

  const value = {
    selectedConversation,
    selectedIds,
    isRightPanelOpen,
    setSelectedConversation,
    setSelectedIds,
    toggleRightPanel,
    handleConversationSelect,
    handleConversationAction,
  }

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  )
}

function useConversation() {
  const context = useContext(ConversationContext)
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider')
  }
  return context
}

export { ConversationProvider, useConversation }
export type { Conversation }