import React, { useState, useEffect, useCallback } from 'react'
import {
  X, Maximize2, Minimize2, ExternalLink, Edit, Trash2, Download,
  MessageSquare, Clock, User, Bot, Loader2, AlertCircle,
  Eye, EyeOff
} from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

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
}

interface RightPanelProps {
  conversation?: Conversation | null
  isOpen: boolean
  onToggle?: () => void
  onConversationAction?: (action: 'edit' | 'delete' | 'export' | 'open', conversationId: string) => void
  className?: string
}

const platformConfig = {
  chatgpt: { name: 'ChatGPT', icon: '🤖', color: 'text-green-600', bgColor: 'bg-green-100' },
  doubao: { name: '豆包', icon: '🎯', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  yuanbao: { name: '元宝', icon: '💎', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  gemini: { name: 'Gemini', icon: '💎', color: 'text-red-600', bgColor: 'bg-red-100' },
  grok: { name: 'Grok', icon: '🚀', color: 'text-orange-600', bgColor: 'bg-orange-100' },
}

// 模拟数据
const mockConversation: Conversation = {
  id: 'conv-1',
  title: 'React Hooks 的最佳实践和使用场景',
  platform: 'chatgpt',
  messageCount: 5,
  wordCount: 1200,
  lastModified: new Date(Date.now() - 2 * 60 * 60 * 1000),
  messages: [
    {
      id: 'msg-1',
      role: 'user',
      content: '请介绍一下 React Hooks 的最佳实践，特别是 useState 和 useEffect 的使用场景。',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: 'React Hooks 是 React 16.8 引入的新特性，让我们能在函数组件中使用状态和其他 React 特性。\n\n**useState 最佳实践：**\n- 保持状态结构简单\n- 使用多个 useState 而不是复杂对象\n- 避免在状态中存储派生数据\n\n**useEffect 的使用场景：**\n- 数据获取和订阅\n- DOM 操作\n- 定时器和间隔',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 60000),
    },
  ],
  metadata: {
    model: 'gpt-4',
    temperature: 0.7,
    tokens: 850,
  }
}

function RightPanel({
  conversation = mockConversation,
  isOpen = true,
  onToggle,
  onConversationAction,
  className
}: RightPanelProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  // 响应式断点检测
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      if (width < 768) setScreenSize('mobile')
      else if (width < 1024) setScreenSize('tablet')
      else setScreenSize('desktop')
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        onToggle?.()
      }
      if (e.key === 'Escape' && isMaximized) {
        setIsMaximized(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMaximized, onToggle])

  const handleAction = useCallback((action: 'edit' | 'delete' | 'export' | 'open') => {
    if (!conversation) return

    setIsLoading(true)
    setError(null)

    // 模拟异步操作
    setTimeout(() => {
      setIsLoading(false)
      onConversationAction?.(action, conversation.id)
    }, 500)
  }, [conversation, onConversationAction])

  const platformInfo = platformConfig[conversation?.platform || 'chatgpt']
  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) return '刚刚'
    if (hours < 24) return `${hours}小时前`
    return date.toLocaleDateString()
  }

  // 响应式样式计算
  const getPanelStyles = () => {
    const baseClasses = 'bg-background border-l flex flex-col transition-all duration-300 ease-in-out'

    if (!isOpen || screenSize === 'mobile') {
      // 移动端隐藏或覆盖显示
      return `${baseClasses} ${isMaximized ? 'fixed inset-0 z-50 w-full border-l-0' : 'hidden'}`
    } else if (screenSize === 'tablet') {
      // 平板端覆盖显示
      return `${baseClasses} ${isMaximized ? 'fixed inset-0 z-50 w-full border-l-0' : 'fixed right-0 top-16 bottom-0 w-80 shadow-xl'}`
    } else {
      // 桌面端固定侧边栏
      return `${baseClasses} ${isMaximized ? 'fixed inset-0 z-50 w-full border-l-0' : 'w-80'}`
    }
  }

  // 空状态
  if (!conversation) {
    return (
      <aside className={`${getPanelStyles()} ${className || ''}`}>
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <MessageSquare className="size-12 text-muted-foreground mb-4 mx-auto" />
          <h3 className="text-lg font-medium mb-2">选择对话查看详情</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            点击左侧列表中的对话来查看完整内容和详细信息
          </p>
        </div>
      </aside>
    )
  }

  return (
    <aside className={`${getPanelStyles()} ${className || ''}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="size-6 animate-spin" />
            <span className="text-sm text-muted-foreground">处理中...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-background flex items-center justify-center z-10">
          <div className="flex flex-col items-center space-y-4 max-w-sm text-center p-4">
            <AlertCircle className="size-12 text-destructive" />
            <div>
              <h3 className="font-medium">加载失败</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <Button onClick={() => setError(null)} size="sm">
              重试
            </Button>
          </div>
        </div>
      )}

      {/* 面板标题栏 */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <h3 className="text-sm font-semibold">对话详情</h3>
        <div className="flex items-center space-x-1">
          {screenSize !== 'mobile' && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? '退出全屏' : '全屏查看'}
            >
              {isMaximized ? (
                <Minimize2 className="size-4" />
              ) : (
                <Maximize2 className="size-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onToggle}
            title="关闭面板"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* 面板内容 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 对话信息 */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{platformInfo.icon}</span>
            <Badge variant="outline" className={`${platformInfo.bgColor} ${platformInfo.color} border-current`}>
              {platformInfo.name}
            </Badge>
            <span className="text-xs text-muted-foreground">•</span>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              <span>{formatTime(conversation.lastModified)}</span>
            </div>
          </div>

          <h2 className="font-medium text-base leading-tight">{conversation.title}</h2>

          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <span>{conversation.messageCount} 条消息</span>
            <span>{conversation.wordCount} 字</span>
            {conversation.metadata?.tokens && (
              <span>{conversation.metadata.tokens} tokens</span>
            )}
          </div>

          {conversation.metadata && (
            <div className="flex items-center space-x-2 text-xs text-muted-foreground pt-2">
              <span>模型: {conversation.metadata.model}</span>
              {conversation.metadata.temperature && (
                <span>温度: {conversation.metadata.temperature}</span>
              )}
            </div>
          )}
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {conversation.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`
                  max-w-[85%] lg:max-w-[75%] rounded-lg p-3
                  ${message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                  }
                `}>
                  <div className="flex items-center space-x-1 mb-2">
                    {message.role === 'user' ? (
                      <User className="size-3" />
                    ) : (
                      <Bot className="size-3" />
                    )}
                    <span className="text-xs opacity-70">
                      {message.role === 'user' ? '用户' : platformInfo.name}
                    </span>
                  </div>

                  <div className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </div>

                  <span className="text-xs opacity-70 mt-2 block">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleAction('edit')}
              disabled={isLoading}
            >
              <Edit className="size-3 mr-1" />
              编辑
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleAction('export')}
              disabled={isLoading}
            >
              <Download className="size-3 mr-1" />
              导出
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleAction('open')}
              disabled={isLoading}
            >
              <ExternalLink className="size-3 mr-1" />
              在平台打开
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="text-xs"
              onClick={() => handleAction('delete')}
              disabled={isLoading}
            >
              <Trash2 className="size-3 mr-1" />
              删除
            </Button>
          </div>

          {/* 快捷键提示 */}
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground text-center">
            按 Ctrl+P 切换面板 • ESC 退出全屏
          </div>
        </div>
      </div>
    </aside>
  )
}

export default RightPanel