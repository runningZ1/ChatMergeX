import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import ConversationList from '@/components/conversation-list'
import { useConversation } from '@/contexts/conversation-context'

// 模拟数据
const mockConversations = Array.from({ length: 50 }, (_, i) => ({
  id: `conv-${i + 1}`,
  title: `对话主题 ${i + 1}`,
  lastMessage: `这是最后一条消息的内容，可能包含各种信息...`,
  messageCount: Math.floor(Math.random() * 100) + 1,
  platform: ['chatgpt', 'doubao', 'yuanbao', 'gemini', 'grok'][Math.floor(Math.random() * 5)] as any,
  lastModified: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  isRead: Math.random() > 0.3,
  hasAttachments: Math.random() > 0.7,
  isStarred: Math.random() > 0.8,
  wordCount: Math.floor(Math.random() * 2000) + 500,
  messages: Array.from({ length: Math.floor(Math.random() * 5) + 2 }, (_, j) => ({
    id: `msg-${i}-${j}`,
    role: j % 2 === 0 ? 'user' as const : 'assistant' as const,
    content: j % 2 === 0
      ? `这是用户的第${j + 1}条消息内容...`
      : `这是AI助手的第${j + 1}条回复内容，包含了详细的解释和示例代码...`,
    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  })),
  metadata: {
    model: 'gpt-4',
    temperature: 0.7,
    tokens: Math.floor(Math.random() * 1000) + 500,
  }
}))

function HomePage() {
  const navigate = useNavigate()
  const {
    selectedIds,
    setSelectedIds,
    handleConversationSelect,
  } = useConversation()

  const handleConversationClick = (conversation: any) => {
    handleConversationSelect(conversation)
    navigate(`/conversation/${conversation.id}`)
  }

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedIds(selectedIds)
  }

  return (
    <div className="flex-1 flex flex-col bg-background h-full">
      {/* 工具栏 - 批量操作 */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-4 border-b bg-muted/50">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              已选择 {selectedIds.length} 项
            </span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                移动到文件夹
              </Button>
              <Button variant="outline" size="sm">
                导出
              </Button>
              <Button variant="destructive" size="sm">
                删除
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 对话列表 */}
      <div className="flex-1 overflow-hidden">
        <ConversationList
          conversations={mockConversations}
          selectedIds={selectedIds}
          onSelectionChange={handleSelectionChange}
          onConversationClick={handleConversationClick}
        />
      </div>
    </div>
  )
}

export default HomePage