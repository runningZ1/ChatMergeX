import React from 'react'
import { X, Maximize2, Minimize2, ExternalLink, Edit, Trash2, Download } from 'lucide-react'
import { Button } from './ui/button'

interface RightPanelProps {
  className?: string
}

function RightPanel({ className }: RightPanelProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [isMaximized, setIsMaximized] = React.useState(false)

  const panelClasses = `
    border-l bg-background flex flex-col transition-all duration-300
    ${isCollapsed ? 'w-0' : 'w-80'}
    ${isMaximized ? 'absolute inset-0 z-50 w-full border-l-0' : ''}
    ${className || ''}
  `

  return (
    <aside className={panelClasses}>
      {/* 面板标题栏 */}
      {!isCollapsed && (
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-sm font-semibold">对话预览</h3>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-5"
              onClick={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? (
                <Minimize2 className="size-4" />
              ) : (
                <Maximize2 className="size-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-5"
              onClick={() => setIsCollapsed(true)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 面板内容 */}
      {!isCollapsed && (
        <div className="flex-1 flex flex-col">
          {/* 对话信息 */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-2 mb-2">
              <div className="size-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-muted-foreground">ChatGPT</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">2小时前</span>
            </div>
            <h4 className="font-medium text-sm mb-2 line-clamp-2">
              React Hooks 的最佳实践和使用场景
            </h4>
            <div className="text-xs text-muted-foreground">
              5 条消息 • 约 1200 字
            </div>
          </div>

          {/* 预览内容 */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex justify-end">
                <div className="max-w-[80%] bg-primary text-primary-foreground rounded-lg p-3">
                  <p className="text-sm">
                    请介绍一下 React Hooks 的最佳实践，特别是 useState 和 useEffect 的使用场景。
                  </p>
                  <span className="text-xs opacity-70 mt-1 block">
                    用户 • 14:30
                  </span>
                </div>
              </div>

              <div className="flex justify-start">
                <div className="max-w-[80%] bg-muted rounded-lg p-3">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-sm">
                      React Hooks 是 React 16.8 引入的新特性，让我们能在函数组件中使用状态和其他 React 特性。
                    </p>
                    <h5 className="font-medium mt-3 mb-2">useState 最佳实践：</h5>
                    <ul className="text-sm space-y-1">
                      <li>保持状态结构简单</li>
                      <li>使用多个 useState 而不是复杂对象</li>
                      <li>避免在状态中存储派生数据</li>
                    </ul>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    ChatGPT • 14:31
                  </span>
                </div>
              </div>

              <div className="flex justify-start">
                <div className="max-w-[80%] bg-muted rounded-lg p-3">
                  <p className="text-sm mb-3">
                    useEffect 的使用场景和注意事项：
                  </p>
                  <div className="bg-background rounded p-2 text-xs font-mono">
                    <div>{'// 清理副作用'}</div>
                    <div>{'useEffect(() => {'}</div>
                    <div>{'  const timer = setInterval(() => {'}</div>
                    <div>{'    // 定时任务'}</div>
                    <div>{'  }, 1000)'}</div>
                    <div>{'  '}</div>
                    <div>{'  return () => clearInterval(timer)'}</div>
                    <div>{'}, [])'}</div>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    ChatGPT • 14:32
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="p-4 border-t">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Button variant="outline" size="sm" className="text-xs">
                <Edit className="size-3 mr-1" />
                编辑
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                <Download className="size-3 mr-1" />
                导出
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="text-xs">
                <ExternalLink className="size-3 mr-1" />
                在平台打开
              </Button>
              <Button variant="destructive" size="sm" className="text-xs">
                <Trash2 className="size-3 mr-1" />
                删除
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 展开按钮（折叠状态下） */}
      {isCollapsed && (
        <div className="w-4 py-4 flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 h-full rounded-none"
            onClick={() => setIsCollapsed(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}
    </aside>
  )
}

export default RightPanel