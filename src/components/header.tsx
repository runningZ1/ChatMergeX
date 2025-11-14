import React, { useState } from 'react'
import { Search, Settings, Moon, Sun, Monitor, Menu, X } from 'lucide-react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { useTheme } from './theme-provider'
import FilterDropdown from './filter-dropdown'
import PlatformSelector from './platform-selector'
import SyncStatusIndicator from './sync-status'
import { ExtensionStatus } from './extension-status'

interface FilterState {
  dateRange: 'all' | 'today' | 'week' | 'month' | 'custom'
  platforms: string[]
  hasAttachments: boolean
  isStarred: boolean
}

interface Platform {
  id: string
  name: string
  icon: string
  color: string
  enabled: boolean
  count?: number
}

function Header() {
  const { theme, setTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'all',
    platforms: [],
    hasAttachments: false,
    isStarred: false,
  })
  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: 'chatgpt', name: 'ChatGPT', icon: '🤖', color: 'bg-green-500', enabled: true, count: 0 },
    { id: 'doubao', name: '豆包', icon: '🎯', color: 'bg-blue-500', enabled: true, count: 0 },
    { id: 'yuanbao', name: '元宝', icon: '💎', color: 'bg-purple-500', enabled: false, count: 0 },
    { id: 'gemini', name: 'Gemini', icon: '💎', color: 'bg-red-500', enabled: false, count: 0 },
    { id: 'grok', name: 'Grok', icon: '🚀', color: 'bg-orange-500', enabled: false, count: 0 },
  ])

  const handleManualSync = async () => {
    // TODO: 实现实际的同步逻辑
    console.log('执行手动同步...')
    // 模拟同步延迟
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 gap-4">
      {/* 左侧 - Logo和应用名称 */}
      <div className="flex items-center space-x-4">
        {/* 移动端菜单按钮 */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>

        <div className="flex items-center space-x-2">
          <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
            CX
          </div>
          <h1 className="text-xl font-semibold hidden sm:block">ChatMergeX</h1>
        </div>
      </div>

      {/* 中间 - 搜索框和过滤器 */}
      <div className="flex-1 flex items-center space-x-2 min-w-0">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索对话内容..."
            className="pl-10 pr-4"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* 过滤器 - 桌面端显示 */}
        <div className="hidden sm:flex items-center space-x-2">
          <FilterDropdown
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>
      </div>

      {/* 右侧 - 控制按钮 */}
      <div className="flex items-center space-x-2">
        {/* 同步状态指示器 */}
        <SyncStatusIndicator
          status="synced"
          lastSyncTime={new Date()}
          onManualSync={handleManualSync}
          totalConversations={0}
        />

        {/* 平台选择器 - 桌面端显示 */}
        <div className="hidden lg:block">
          <PlatformSelector
            platforms={platforms}
            onPlatformsChange={setPlatforms}
          />
        </div>

        {/* 主题切换按钮 */}
        <div className="hidden sm:flex items-center space-x-1 border rounded-md p-1">
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

      {/* 扩展状态指示器 - 下方显示 */}
      <div className="hidden md:block">
        <ExtensionStatus />
      </div>

      {/* 移动端扩展菜单 */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-16 bg-background z-50 md:hidden">
          <div className="p-4 space-y-4">
            {/* 移动端过滤器 */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">过滤器</h3>
              <FilterDropdown
                filters={filters}
                onFiltersChange={setFilters}
              />
            </div>

            {/* 移动端平台选择 */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">平台</h3>
              <PlatformSelector
                platforms={platforms}
                onPlatformsChange={setPlatforms}
              />
            </div>

            {/* 移动端主题切换 */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">主题</h3>
              <div className="flex space-x-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                >
                  <Sun className="size-4 mr-1" />
                  浅色
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                >
                  <Moon className="size-4 mr-1" />
                  深色
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('system')}
                >
                  <Monitor className="size-4 mr-1" />
                  系统
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full"
            >
              关闭菜单
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header