import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Plus, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// 模拟数据
const mockConversations = [
  {
    id: '1',
    title: 'React Hooks 的最佳实践和使用场景',
    platform: 'chatgpt' as const,
    messageCount: 5,
    lastMessage: '2小时前',
    folder: '工作',
    preview: 'useState 和 useEffect 的使用技巧...',
  },
  {
    id: '2',
    title: 'TypeScript 高级类型系统详解',
    platform: 'chatgpt' as const,
    messageCount: 8,
    lastMessage: '1天前',
    folder: '学习',
    preview: '泛型、条件类型和映射类型的应用...',
  },
  {
    id: '3',
    title: '前端性能优化策略',
    platform: 'doubao' as const,
    messageCount: 6,
    lastMessage: '3天前',
    folder: '工作',
    preview: '代码分割、懒加载和缓存策略...',
  },
]

function HomePage() {
  const navigate = useNavigate()
  const [selectedConversations, setSelectedConversations] = React.useState<string[]>([])

  const handleConversationClick = (id: string) => {
    navigate(`/conversation/${id}`)
  }

  const handleSelectConversation = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedConversations(prev => [...prev, id])
    } else {
      setSelectedConversations(prev => prev.filter(convId => convId !== id))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedConversations(mockConversations.map(conv => conv.id))
    } else {
      setSelectedConversations([])
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'chatgpt':
        return '🤖'
      case 'doubao':
        return '🔥'
      case 'gemini':
        return '💎'
      default:
        return '💬'
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'chatgpt':
        return 'text-green-600'
      case 'doubao':
        return 'text-red-600'
      case 'gemini':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              className="selection-checkbox"
              checked={selectedConversations.length === mockConversations.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            <span className="text-sm text-muted-foreground">
              已选择 {selectedConversations.length} 项
            </span>
          </div>

          {selectedConversations.length > 0 && (
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
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="size-4 mr-1" />
            筛选
          </Button>
          <Button variant="outline" size="sm">
            <Search className="size-4 mr-1" />
            搜索
          </Button>
        </div>
      </div>

      {/* 对话列表 */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <table className="w-full">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="w-12 p-4 text-left">
                  <input
                    type="checkbox"
                    className="selection-checkbox"
                    checked={selectedConversations.length === mockConversations.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="w-8 p-4 text-left"></th>
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                  标题
                </th>
                <th className="w-24 p-4 text-left text-sm font-medium text-muted-foreground">
                  消息数
                </th>
                <th className="w-32 p-4 text-left text-sm font-medium text-muted-foreground">
                  最后更新
                </th>
                <th className="w-32 p-4 text-left text-sm font-medium text-muted-foreground">
                  文件夹
                </th>
                <th className="w-24 p-4 text-left text-sm font-medium text-muted-foreground">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {mockConversations.map((conversation) => (
                <tr
                  key={conversation.id}
                  className={`border-b hover:bg-muted/30 cursor-pointer transition-colors ${
                    selectedConversations.includes(conversation.id) ? 'bg-muted/50' : ''
                  }`}
                  onClick={() => handleConversationClick(conversation.id)}
                >
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="selection-checkbox"
                      checked={selectedConversations.includes(conversation.id)}
                      onChange={(e) => handleSelectConversation(conversation.id, e.target.checked)}
                    />
                  </td>
                  <td className="p-4">
                    <span className={`text-lg ${getPlatformColor(conversation.platform)}`}>
                      {getPlatformIcon(conversation.platform)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-sm mb-1">
                        {conversation.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {conversation.preview}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {conversation.messageCount}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {conversation.lastMessage}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted">
                      {conversation.folder}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          // TODO: 打开操作菜单
                        }}
                      >
                        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="flex items-center justify-between p-4 border-t bg-muted/30">
        <div className="text-sm text-muted-foreground">
          共 {mockConversations.length} 条对话
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            第 1 页，共 1 页
          </span>
          <Button variant="outline" size="sm" disabled>
            下一页
          </Button>
        </div>
      </div>
    </div>
  )
}

export default HomePage