import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Download, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

function ConversationPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate('/')
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* 返回按钮和对话信息 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">React Hooks 的最佳实践和使用场景</h1>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
              <div className="flex items-center space-x-1">
                <span className="text-green-600">🤖</span>
                <span>ChatGPT</span>
              </div>
              <span>•</span>
              <span>5 条消息</span>
              <span>•</span>
              <span>2小时前更新</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Edit className="size-4 mr-1" />
            编辑标题
          </Button>
          <Button variant="outline" size="sm">
            <Download className="size-4 mr-1" />
            导出
          </Button>
          <Button variant="outline" size="sm">
            <ExternalLink className="size-4 mr-1" />
            在平台打开
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="size-4 mr-1" />
            删除
          </Button>
        </div>
      </div>

      {/* 对话内容 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 用户消息 */}
          <div className="flex justify-end">
            <div className="max-w-[80%]">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium">用户</span>
                <span className="text-xs text-muted-foreground">14:30</span>
              </div>
              <div className="bg-primary text-primary-foreground rounded-lg p-4">
                <p>请介绍一下 React Hooks 的最佳实践，特别是 useState 和 useEffect 的使用场景。</p>
              </div>
            </div>
          </div>

          {/* AI 回复 */}
          <div className="flex justify-start">
            <div className="max-w-[80%]">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium">ChatGPT</span>
                <span className="text-xs text-muted-foreground">14:31</span>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <div className="prose prose-sm max-w-none">
                  <p>React Hooks 是 React 16.8 引入的新特性，让我们能在函数组件中使用状态和其他 React 特性。</p>

                  <h3 className="text-lg font-semibold mt-4 mb-2">useState 最佳实践</h3>
                  <ul>
                    <li>保持状态结构简单</li>
                    <li>使用多个 useState 而不是复杂对象</li>
                    <li>避免在状态中存储派生数据</li>
                    <li>合理使用函数式更新</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-4 mb-2">useEffect 使用场景</h3>
                  <ul>
                    <li>数据获取和订阅</li>
                    <li>DOM 操作和事件监听</li>
                    <li>定时器和清理工作</li>
                    <li>跨组件状态同步</li>
                  </ul>

                  <div className="bg-background rounded p-3 mt-4">
                    <pre className="text-sm overflow-x-auto">
                      <code>{`// useEffect 清理模式示例
useEffect(() => {
  const timer = setInterval(() => {
    console.log('定时执行');
  }, 1000);

  // 清理函数
  return () => {
    clearInterval(timer);
  };
}, []);`}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 更多消息... */}
          <div className="flex justify-center text-sm text-muted-foreground py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-px bg-muted-foreground"></div>
              <span>还有 3 条消息</span>
              <div className="w-8 h-px bg-muted-foreground"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConversationPage