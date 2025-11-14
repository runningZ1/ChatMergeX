import React, { useState, useEffect } from 'react'
import { Cloud, CloudOff, RefreshCw, Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Badge } from './ui/badge'

type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error' | 'manual-sync-required'

interface SyncStatusIndicatorProps {
  status?: SyncStatus
  lastSyncTime?: Date
  onManualSync?: () => Promise<void>
  totalConversations?: number
  pendingChanges?: number
}

function SyncStatusIndicator({
  status = 'synced',
  lastSyncTime,
  onManualSync,
  totalConversations = 0,
  pendingChanges = 0
}: SyncStatusIndicatorProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(status)

  useEffect(() => {
    setCurrentStatus(status)
  }, [status])

  const handleManualSync = async () => {
    if (!onManualSync || isSyncing) return

    setIsSyncing(true)
    setCurrentStatus('syncing')

    try {
      await onManualSync()
      setCurrentStatus('synced')
    } catch (error) {
      setCurrentStatus('error')
      console.error('同步失败:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const getStatusIcon = () => {
    switch (currentStatus) {
      case 'syncing':
        return <RefreshCw className="size-3 animate-spin" />
      case 'offline':
        return <WifiOff className="size-3" />
      case 'error':
        return <AlertCircle className="size-3" />
      case 'manual-sync-required':
        return <CloudOff className="size-3" />
      default:
        return <Cloud className="size-3" />
    }
  }

  const getStatusColor = () => {
    switch (currentStatus) {
      case 'syncing':
        return 'bg-blue-500'
      case 'offline':
        return 'bg-gray-500'
      case 'error':
        return 'bg-red-500'
      case 'manual-sync-required':
        return 'bg-orange-500'
      default:
        return 'bg-green-500'
    }
  }

  const getStatusText = () => {
    switch (currentStatus) {
      case 'syncing':
        return '同步中...'
      case 'offline':
        return '离线'
      case 'error':
        return '同步错误'
      case 'manual-sync-required':
        return '需要同步'
      default:
        return '已同步'
    }
  }

  const formatLastSyncTime = () => {
    if (!lastSyncTime) return '从未同步'

    const now = new Date()
    const diffMs = now.getTime() - lastSyncTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`
    return lastSyncTime.toLocaleDateString()
  }

  return (
    <div className="flex items-center space-x-2">
      {/* 状态指示器 */}
      <div className="hidden sm:flex items-center space-x-2">
        <div className={`size-2 rounded-full ${getStatusColor()}`}></div>
        <span className="text-sm text-muted-foreground">
          {getStatusText()}
        </span>
      </div>

      {/* 详细状态下拉菜单 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 relative"
            disabled={isSyncing}
          >
            {getStatusIcon()}
            {pendingChanges > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 w-4 min-w-[16px] p-0 text-xs"
              >
                {pendingChanges}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-72" align="end">
          <DropdownMenuLabel className="flex items-center justify-between">
            同步状态
            <div className="flex items-center space-x-1">
              <div className={`size-2 rounded-full ${getStatusColor()}`}></div>
              <span className="text-sm">{getStatusText()}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* 同步信息 */}
          <div className="px-2 py-1.5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">最后同步时间</span>
              <span>{formatLastSyncTime()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">总对话数</span>
              <span>{totalConversations}</span>
            </div>
            {pendingChanges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">待同步更改</span>
                <Badge variant="destructive" className="text-xs">
                  {pendingChanges}
                </Badge>
              </div>
            )}
          </div>

          <DropdownMenuSeparator />

          {/* 操作按钮 */}
          <div className="space-y-1">
            <DropdownMenuItem onClick={handleManualSync} disabled={isSyncing}>
              <RefreshCw className={`size-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? '正在同步...' : '立即同步'}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Wifi className="size-4 mr-2" />
              检查网络连接
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Cloud className="size-4 mr-2" />
              同步设置
            </DropdownMenuItem>
          </div>

          {currentStatus === 'error' && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-sm text-destructive">
                <div className="flex items-center space-x-1">
                  <AlertCircle className="size-4" />
                  <span>同步失败</span>
                </div>
                <p className="text-xs mt-1 text-muted-foreground">
                  请检查网络连接或稍后重试
                </p>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default SyncStatusIndicator