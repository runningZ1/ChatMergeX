import React, { useState, useMemo, useCallback } from 'react'
import {
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Checkbox } from './ui/checkbox'

interface Conversation {
  id: string
  title: string
  lastMessage: string
  messageCount: number
  platform: 'chatgpt' | 'doubao' | 'yuanbao' | 'gemini' | 'grok'
  lastModified: Date
  isRead: boolean
  hasAttachments: boolean
  isStarred: boolean
}

interface ColumnConfig {
  key: keyof Conversation | 'actions'
  label: string
  sortable: boolean
  width: string
  responsive?: 'hidden' | 'sm' | 'md' | 'lg' | 'xl'
}

interface ConversationListProps {
  conversations?: Conversation[]
  selectedIds?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  onConversationClick?: (conversation: Conversation) => void
}

const platformConfig = {
  chatgpt: { name: 'ChatGPT', icon: '🤖', color: 'bg-green-500' },
  doubao: { name: '豆包', icon: '🎯', color: 'bg-blue-500' },
  yuanbao: { name: '元宝', icon: '💎', color: 'bg-purple-500' },
  gemini: { name: 'Gemini', icon: '💎', color: 'bg-red-500' },
  grok: { name: 'Grok', icon: '🚀', color: 'bg-orange-500' },
}

const mockConversations: Conversation[] = Array.from({ length: 50 }, (_, i) => ({
  id: `conv-${i + 1}`,
  title: `对话主题 ${i + 1}`,
  lastMessage: `这是最后一条消息的内容，可能包含各种信息...`,
  messageCount: Math.floor(Math.random() * 100) + 1,
  platform: Object.keys(platformConfig)[Math.floor(Math.random() * 5)] as Conversation['platform'],
  lastModified: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  isRead: Math.random() > 0.3,
  hasAttachments: Math.random() > 0.7,
  isStarred: Math.random() > 0.8,
}))

function ConversationList({
  conversations = mockConversations,
  selectedIds = [],
  onSelectionChange,
  onConversationClick,
}: ConversationListProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Conversation
    direction: 'asc' | 'desc'
  } | null>(null)

  const [filters, setFilters] = useState({
    platform: 'all' as string,
    isRead: 'all' as 'all' | 'read' | 'unread',
    hasAttachments: 'all' as 'all' | 'with' | 'without',
    isStarred: 'all' as 'all' | 'starred' | 'unstarred',
  })

  const columns: ColumnConfig[] = [
    { key: 'title', label: '标题', sortable: true, width: 'flex-1' },
    { key: 'platform', label: '平台', sortable: true, width: 'w-24', responsive: 'sm' },
    { key: 'messageCount', label: '消息数', sortable: true, width: 'w-20', responsive: 'md' },
    { key: 'lastModified', label: '最后更新', sortable: true, width: 'w-32', responsive: 'lg' },
    { key: 'actions', label: '', sortable: false, width: 'w-16' },
  ]

  // 过滤对话
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      if (filters.platform !== 'all' && conv.platform !== filters.platform) return false
      if (filters.isRead !== 'all' && conv.isRead !== (filters.isRead === 'read')) return false
      if (filters.hasAttachments !== 'all' && conv.hasAttachments !== (filters.hasAttachments === 'with')) return false
      if (filters.isStarred !== 'all' && conv.isStarred !== (filters.isStarred === 'starred')) return false
      return true
    })
  }, [conversations, filters])

  // 排序对话
  const sortedConversations = useMemo(() => {
    if (!sortConfig) return filteredConversations

    return [...filteredConversations].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredConversations, sortConfig])

  const handleSort = (key: keyof Conversation) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' }
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' }
      }
      return null
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = sortedConversations.map(conv => conv.id)
      onSelectionChange?.(allIds)
    } else {
      onSelectionChange?.([])
    }
  }

  const handleSelectConversation = (id: string, checked: boolean) => {
    const newSelection = checked
      ? [...selectedIds, id]
      : selectedIds.filter(selectedId => selectedId !== id)
    onSelectionChange?.(newSelection)
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) return '刚刚'
    if (hours < 24) return `${hours}小时前`
    if (hours < 48) return '昨天'
    return date.toLocaleDateString()
  }

  const isAllSelected = sortedConversations.length > 0 && selectedIds.length === sortedConversations.length
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < sortedConversations.length

  return (
    <div className="flex flex-col h-full">
      {/* 过滤器栏 */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
              ref={(ref) => {
                if (ref) ref.indeterminate = isIndeterminate
              }}
            />
            <span className="text-sm text-muted-foreground">
              {selectedIds.length > 0 ? `已选择 ${selectedIds.length}` : `${sortedConversations.length} 条对话`}
            </span>
          </div>
        </div>

        {/* 快速过滤器 */}
        <div className="flex items-center space-x-2">
          <select
            value={filters.platform}
            onChange={(e) => setFilters(prev => ({ ...prev, platform: e.target.value }))}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="all">所有平台</option>
            {Object.entries(platformConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.icon} {config.name}</option>
            ))}
          </select>

          <select
            value={filters.isRead}
            onChange={(e) => setFilters(prev => ({ ...prev, isRead: e.target.value as any }))}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="all">全部状态</option>
            <option value="unread">未读</option>
            <option value="read">已读</option>
          </select>
        </div>
      </div>

      {/* 表格头部 */}
      <div className="flex items-center border-b bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground">
        <div className="w-10 flex items-center justify-center">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={handleSelectAll}
            ref={(ref) => {
              if (ref) ref.indeterminate = isIndeterminate
            }}
          />
        </div>
        {columns.map((column) => (
          <div
            key={column.key}
            className={`${column.width} ${column.responsive ? `hidden ${column.responsive}:block` : ''} flex items-center space-x-1`}
          >
            {column.sortable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort(column.key as keyof Conversation)}
                className="h-auto p-0 font-medium"
              >
                {column.label}
                {sortConfig?.key === column.key && (
                  sortConfig.direction === 'asc' ? (
                    <ChevronUp className="size-3" />
                  ) : (
                    <ChevronDown className="size-3" />
                  )
                )}
              </Button>
            )}
            {!column.sortable && column.label}
          </div>
        ))}
      </div>

      {/* 对话列表 */}
      <div className="flex-1 overflow-y-auto">
        {sortedConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <MessageSquare className="size-12 mb-2" />
            <p>没有找到符合条件的对话</p>
          </div>
        ) : (
          <div className="divide-y">
            {sortedConversations.map((conversation) => {
              const isSelected = selectedIds.includes(conversation.id)
              const platformInfo = platformConfig[conversation.platform]

              return (
                <div
                  key={conversation.id}
                  className={`
                    flex items-center px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors
                    ${isSelected ? 'bg-muted' : ''}
                    ${!conversation.isRead ? 'font-medium' : ''}
                  `}
                  onClick={() => onConversationClick?.(conversation)}
                >
                  {/* 选择框 */}
                  <div className="w-10 flex items-center justify-center">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectConversation(conversation.id, !!checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* 标题 */}
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center space-x-2">
                      <h3 className="truncate text-sm">{conversation.title}</h3>
                      {conversation.isStarred && <Badge variant="secondary" className="text-xs">⭐</Badge>}
                      {conversation.hasAttachments && <Badge variant="outline" className="text-xs">📎</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {conversation.lastMessage}
                    </p>
                  </div>

                  {/* 平台 */}
                  <div className="w-24 hidden sm:flex items-center justify-center">
                    <Badge variant="outline" className="text-xs">
                      <span className="mr-1">{platformInfo.icon}</span>
                      {platformInfo.name}
                    </Badge>
                  </div>

                  {/* 消息数 */}
                  <div className="w-20 hidden md:flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">{conversation.messageCount}</span>
                  </div>

                  {/* 最后更新时间 */}
                  <div className="w-32 hidden lg:flex items-center justify-center">
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      <span>{formatDate(conversation.lastModified)}</span>
                    </div>
                  </div>

                  {/* 状态图标 */}
                  <div className="w-16 hidden xl:flex items-center justify-center">
                    {conversation.isRead ? (
                      <CheckCircle className="size-4 text-green-500" />
                    ) : (
                      <AlertCircle className="size-4 text-blue-500" />
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="w-16 flex items-center justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 opacity-0 hover:opacity-100 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>查看详情</DropdownMenuItem>
                        <DropdownMenuItem>编辑标题</DropdownMenuItem>
                        <DropdownMenuItem>收藏</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">删除</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ConversationList