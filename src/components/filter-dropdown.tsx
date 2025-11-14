import React, { useState } from 'react'
import { Filter, Calendar, Tag, MessageSquare } from 'lucide-react'
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

interface FilterState {
  dateRange: 'all' | 'today' | 'week' | 'month' | 'custom'
  platforms: string[]
  hasAttachments: boolean
  isStarred: boolean
}

interface FilterDropdownProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
}

const platforms = [
  { id: 'chatgpt', name: 'ChatGPT', icon: '🤖' },
  { id: 'doubao', name: '豆包', icon: '🎯' },
  { id: 'yuanbao', name: '元宝', icon: '💎' },
  { id: 'gemini', name: 'Gemini', icon: '💎' },
  { id: 'grok', name: 'Grok', icon: '🚀' },
]

const dateRanges = [
  { id: 'all', name: '全部时间', icon: Calendar },
  { id: 'today', name: '今天', icon: Calendar },
  { id: 'week', name: '本周', icon: Calendar },
  { id: 'month', name: '本月', icon: Calendar },
]

function FilterDropdown({ filters, onFiltersChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleDateRangeChange = (dateRange: FilterState['dateRange']) => {
    onFiltersChange({ ...filters, dateRange })
  }

  const handlePlatformToggle = (platformId: string) => {
    const newPlatforms = filters.platforms.includes(platformId)
      ? filters.platforms.filter(p => p !== platformId)
      : [...filters.platforms, platformId]
    onFiltersChange({ ...filters, platforms: newPlatforms })
  }

  const handleHasAttachmentsChange = (hasAttachments: boolean) => {
    onFiltersChange({ ...filters, hasAttachments })
  }

  const handleIsStarredChange = (isStarred: boolean) => {
    onFiltersChange({ ...filters, isStarred })
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.dateRange !== 'all') count++
    if (filters.platforms.length > 0) count++
    if (filters.hasAttachments) count++
    if (filters.isStarred) count++
    return count
  }

  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: 'all',
      platforms: [],
      hasAttachments: false,
      isStarred: false,
    })
    setIsOpen(false)
  }

  const activeFilterCount = getActiveFilterCount()

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Filter className="size-4" />
          <span className="hidden sm:inline ml-2">过滤器</span>
          {activeFilterCount > 0 && (
            <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] px-1 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          筛选对话
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs text-destructive hover:text-destructive"
            >
              清除全部
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* 时间范围 */}
        <div className="px-2 py-1.5">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <Calendar className="size-4" />
            时间范围
          </div>
          <div className="space-y-1">
            {dateRanges.map((range) => {
              const Icon = range.icon
              return (
                <DropdownMenuCheckboxItem
                  key={range.id}
                  checked={filters.dateRange === range.id}
                  onCheckedChange={() => handleDateRangeChange(range.id)}
                >
                  <Icon className="size-4 mr-2" />
                  {range.name}
                </DropdownMenuCheckboxItem>
              )
            })}
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* 平台选择 */}
        <div className="px-2 py-1.5">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <MessageSquare className="size-4" />
            平台
          </div>
          <div className="space-y-1">
            {platforms.map((platform) => (
              <DropdownMenuCheckboxItem
                key={platform.id}
                checked={filters.platforms.includes(platform.id)}
                onCheckedChange={() => handlePlatformToggle(platform.id)}
              >
                <span className="mr-2">{platform.icon}</span>
                {platform.name}
              </DropdownMenuCheckboxItem>
            ))}
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* 其他选项 */}
        <div className="space-y-1">
          <DropdownMenuCheckboxItem
            checked={filters.hasAttachments}
            onCheckedChange={handleHasAttachmentsChange}
          >
            <Tag className="size-4 mr-2" />
            包含附件
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.isStarred}
            onCheckedChange={handleIsStarredChange}
          >
            <MessageSquare className="size-4 mr-2" />
            已收藏
          </DropdownMenuCheckboxItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default FilterDropdown