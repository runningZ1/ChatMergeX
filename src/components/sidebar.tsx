import React, { useState, useEffect } from 'react'
import {
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Folder,
  FolderOpen,
  Plus,
  MoreHorizontal,
  PanelLeft,
  PanelLeftClose,
} from 'lucide-react'
import { Button } from './ui/button'

interface FolderItem {
  id: string
  name: string
  count?: number
  children?: FolderItem[]
  isExpanded?: boolean
}

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // 从localStorage恢复折叠状态，默认为展开
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed')
      return saved !== null ? JSON.parse(saved) : false
    }
    return false
  })

  const [folders, setFolders] = useState<FolderItem[]>([
    {
      id: 'all',
      name: '全部对话',
      count: 0,
      isExpanded: true,
      children: [],
    },
    {
      id: 'today',
      name: '今天',
      count: 0,
      isExpanded: false,
      children: [],
    },
    {
      id: 'work',
      name: '工作',
      count: 5,
      isExpanded: true,
      children: [
        { id: 'work-project1', name: '项目A', count: 3 },
        { id: 'work-project2', name: '项目B', count: 2 },
      ],
    },
    {
      id: 'learning',
      name: '学习',
      count: 8,
      isExpanded: false,
      children: [
        { id: 'learning-react', name: 'React', count: 4 },
        { id: 'learning-ts', name: 'TypeScript', count: 4 },
      ],
    },
  ])

  const [selectedFolder, setSelectedFolder] = useState('all')

  // 响应式断点处理
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 768 && !isCollapsed) {
        // 移动端自动折叠
        setIsCollapsed(true)
      }
    }

    handleResize() // 初始检查
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isCollapsed])

  // 保存折叠状态到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed))
    }
  }, [isCollapsed])

  const toggleFolder = (folderId: string) => {
    setFolders(prev =>
      prev.map(folder => {
        if (folder.id === folderId) {
          return { ...folder, isExpanded: !folder.isExpanded }
        }
        return folder
      })
    )
  }

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const renderFolder = (folder: FolderItem, level = 0) => {
    const isSelected = selectedFolder === folder.id
    const hasChildren = folder.children && folder.children.length > 0
    const isExpanded = folder.isExpanded

    if (isCollapsed) {
      // 折叠状态下只显示图标和计数
      return (
        <div key={folder.id} className="px-2 py-1.5">
          <div
            className={`
              flex flex-col items-center justify-center p-2 rounded-sm cursor-pointer
              transition-colors hover:bg-muted group relative
              ${isSelected ? 'bg-muted' : ''}
            `}
            onClick={() => setSelectedFolder(folder.id)}
          >
            {folder.id === 'all' || folder.id === 'today' ? (
              <MessageSquare className="size-4" />
            ) : (
              <Folder className="size-4" />
            )}
            {folder.count !== undefined && folder.count > 0 && (
              <span className="text-xs text-muted-foreground mt-1">
                {folder.count}
              </span>
            )}
            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap text-sm z-50">
              {folder.name}
              {folder.count !== undefined && folder.count > 0 && ` (${folder.count})`}
            </div>
          </div>
        </div>
      )
    }

    // 展开状态的完整显示
    return (
      <div key={folder.id}>
        <div
          className={`
            flex items-center justify-between px-2 py-1.5 rounded-sm cursor-pointer
            transition-colors hover:bg-muted
            ${isSelected ? 'bg-muted font-medium' : ''}
          `}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => setSelectedFolder(folder.id)}
        >
          <div className="flex items-center space-x-2">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="icon"
                className="size-4 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFolder(folder.id)
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="size-3" />
                ) : (
                  <ChevronRight className="size-3" />
                )}
              </Button>
            ) : (
              <div className="size-4" />
            )}

            {folder.id === 'all' || folder.id === 'today' ? (
              <MessageSquare className="size-4" />
            ) : isExpanded ? (
              <FolderOpen className="size-4" />
            ) : (
              <Folder className="size-4" />
            )}

            <span className="text-sm">{folder.name}</span>
          </div>

          <div className="flex items-center space-x-1">
            {folder.count !== undefined && folder.count > 0 && (
              <span className="text-xs text-muted-foreground">{folder.count}</span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-4 p-0 opacity-0 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation()
                // TODO: 打开上下文菜单
              }}
            >
              <MoreHorizontal className="size-3" />
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {folder.children!.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside
      className={`
        border-r bg-background flex flex-col transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* 折叠按钮 */}
      <div className="flex items-center justify-between p-2 border-b">
        {!isCollapsed && <h2 className="text-sm font-semibold px-2">文件夹</h2>}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={isCollapsed ? 'mx-auto' : ''}
          title={isCollapsed ? '展开侧边栏' : '折叠侧边栏'}
        >
          {isCollapsed ? (
            <PanelLeft className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
        {!isCollapsed && (
          <Button variant="ghost" size="icon" className="size-6">
            <Plus className="size-4" />
          </Button>
        )}
      </div>

      {/* 文件夹列表 */}
      <div className="flex-1 overflow-y-auto">
        {isCollapsed ? (
          // 折叠状态的垂直布局
          <div className="flex flex-col items-center py-2 space-y-1">
            {folders.map(folder => renderFolder(folder))}
          </div>
        ) : (
          // 展开状态的正常布局
          <div className="p-2">
            {folders.map(folder => renderFolder(folder))}
          </div>
        )}
      </div>

      {/* 底部统计信息 - 只在展开时显示 */}
      {!isCollapsed && (
        <div className="p-4 border-t text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>总对话数</span>
            <span>13</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>存储空间</span>
            <span>2.3 MB</span>
          </div>
        </div>
      )}
    </aside>
  )
}

export default Sidebar