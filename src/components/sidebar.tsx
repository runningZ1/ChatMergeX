import React, { useState } from 'react'
import {
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Folder,
  FolderOpen,
  Plus,
  MoreHorizontal,
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

  const renderFolder = (folder: FolderItem, level = 0) => {
    const isSelected = selectedFolder === folder.id
    const hasChildren = folder.children && folder.children.length > 0
    const isExpanded = folder.isExpanded

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
    <aside className="w-64 border-r bg-background flex flex-col">
      {/* 文件夹标题和新建按钮 */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-sm font-semibold">文件夹</h2>
        <Button variant="ghost" size="icon" className="size-6">
          <Plus className="size-4" />
        </Button>
      </div>

      {/* 文件夹列表 */}
      <div className="flex-1 overflow-y-auto p-2">
        {folders.map(folder => renderFolder(folder))}
      </div>

      {/* 底部统计信息 */}
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
    </aside>
  )
}

export default Sidebar