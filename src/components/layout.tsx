import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './header'
import Sidebar from './sidebar'
import RightPanel from './right-panel'

interface LayoutProps {
  children?: React.ReactNode
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* 左侧边栏 */}
      <Sidebar />

      {/* 主要内容区域 */}
      <div className="flex flex-1 flex-col">
        {/* 顶部导航栏 */}
        <Header />

        {/* 主要内容 */}
        <main className="flex flex-1 overflow-hidden">
          {children || <Outlet />}
        </main>
      </div>

      {/* 右侧面板 */}
      <RightPanel />
    </div>
  )
}

export default Layout