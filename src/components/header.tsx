import React from 'react'
import { Search, Settings, Moon, Sun, Monitor } from 'lucide-react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { useTheme } from './theme-provider'

function Header() {
  const { theme, setTheme } = useTheme()

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4">
      {/* 左侧 - Logo和应用名称 */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
            CX
          </div>
          <h1 className="text-xl font-semibold">ChatMergeX</h1>
        </div>
      </div>

      {/* 中间 - 搜索框 */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索对话内容..."
            className="pl-10"
          />
        </div>
      </div>

      {/* 右侧 - 控制按钮 */}
      <div className="flex items-center space-x-2">
        {/* 同步状态指示器 */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <div className="size-2 rounded-full bg-green-500"></div>
          <span className="hidden sm:inline">已同步</span>
        </div>

        {/* 主题切换按钮 */}
        <div className="flex items-center space-x-1 border rounded-md p-1">
          <Button
            variant={theme === 'light' ? 'default' : 'ghost'}
            size="icon"
            className="size-7"
            onClick={() => setTheme('light')}
          >
            <Sun className="size-4" />
          </Button>
          <Button
            variant={theme === 'dark' ? 'default' : 'ghost'}
            size="icon"
            className="size-7"
            onClick={() => setTheme('dark')}
          >
            <Moon className="size-4" />
          </Button>
          <Button
            variant={theme === 'system' ? 'default' : 'ghost'}
            size="icon"
            className="size-7"
            onClick={() => setTheme('system')}
          >
            <Monitor className="size-4" />
          </Button>
        </div>

        {/* 设置按钮 */}
        <Button variant="ghost" size="icon">
          <Settings className="size-5" />
        </Button>
      </div>
    </header>
  )
}

export default Header