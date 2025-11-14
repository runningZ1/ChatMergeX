import React from 'react'
import { MessageSquare, MoreHorizontal } from 'lucide-react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from './ui/dropdown-menu'
import { Badge } from './ui/badge'

interface Platform {
  id: string
  name: string
  icon: string
  color: string
  enabled: boolean
  count?: number
}

interface PlatformSelectorProps {
  platforms: Platform[]
  onPlatformsChange: (platforms: Platform[]) => void
}

const defaultPlatforms: Platform[] = [
  { id: 'chatgpt', name: 'ChatGPT', icon: '🤖', color: 'bg-green-500', enabled: true, count: 0 },
  { id: 'doubao', name: '豆包', icon: '🎯', color: 'bg-blue-500', enabled: true, count: 0 },
  { id: 'yuanbao', name: '元宝', icon: '💎', color: 'bg-purple-500', enabled: false, count: 0 },
  { id: 'gemini', name: 'Gemini', icon: '💎', color: 'bg-red-500', enabled: false, count: 0 },
  { id: 'grok', name: 'Grok', icon: '🚀', color: 'bg-orange-500', enabled: false, count: 0 },
]

function PlatformSelector({
  platforms = defaultPlatforms,
  onPlatformsChange
}: PlatformSelectorProps) {
  const handlePlatformToggle = (platformId: string) => {
    const updatedPlatforms = platforms.map(platform =>
      platform.id === platformId
        ? { ...platform, enabled: !platform.enabled }
        : platform
    )
    onPlatformsChange(updatedPlatforms)
  }

  const enabledCount = platforms.filter(p => p.enabled).length
  const totalCount = platforms.reduce((sum, p) => sum + (p.count || 0), 0)

  return (
    <div className="flex items-center space-x-2">
      {/* 主要平台快捷按钮 */}
      <div className="hidden md:flex items-center space-x-1 border rounded-md p-1">
        {platforms.slice(0, 3).map((platform) => (
          <Button
            key={platform.id}
            variant={platform.enabled ? "default" : "ghost"}
            size="sm"
            onClick={() => handlePlatformToggle(platform.id)}
            className="h-7 px-2 text-xs"
            title={`${platform.name} (${platform.count || 0} 条对话)`}
          >
            <span className="mr-1">{platform.icon}</span>
            {platform.name}
          </Button>
        ))}
      </div>

      {/* 更多平台下拉菜单 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <MessageSquare className="size-4" />
            <span className="hidden sm:inline ml-2">
              平台 ({enabledCount}/{platforms.length})
            </span>
            <MoreHorizontal className="size-4 sm:ml-1" />
            {totalCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1 text-xs">
                {totalCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>选择要显示的平台</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {platforms.map((platform) => (
            <DropdownMenuCheckboxItem
              key={platform.id}
              checked={platform.enabled}
              onCheckedChange={() => handlePlatformToggle(platform.id)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <span>{platform.icon}</span>
                  <span>{platform.name}</span>
                </div>
                {platform.count !== undefined && platform.count > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {platform.count}
                  </Badge>
                )}
              </div>
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => {
            const allEnabled = platforms.map(p => ({ ...p, enabled: true }))
            onPlatformsChange(allEnabled)
          }}>
            全选平台
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
            const allDisabled = platforms.map(p => ({ ...p, enabled: false }))
            onPlatformsChange(allDisabled)
          }}>
            取消全选
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default PlatformSelector