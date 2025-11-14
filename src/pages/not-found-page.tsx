import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
          <h2 className="text-2xl font-semibold">页面未找到</h2>
          <p className="text-muted-foreground">
            抱歉，您访问的页面不存在或已被移动。
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => navigate('/')} className="flex items-center space-x-2">
            <Home className="size-4" />
            <span>返回首页</span>
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center space-x-2">
            <ArrowLeft className="size-4" />
            <span>返回上页</span>
          </Button>
        </div>

        <div className="pt-6 border-t text-sm text-muted-foreground">
          <p>如果这看起来像是我们的错误，请给我们反馈。</p>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage