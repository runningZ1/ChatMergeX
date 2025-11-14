import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './header'
import Sidebar from './sidebar'
import RightPanel from './right-panel'
import { ConversationProvider, useConversation } from '../contexts/conversation-context'

interface LayoutProps {
  children?: React.ReactNode
}

function LayoutContent({ children }: LayoutProps) {
  const {
    selectedConversation,
    isRightPanelOpen,
    toggleRightPanel,
    handleConversationAction,
  } = useConversation()

  return (
    <div className="h-screen bg-background grid grid-areas-layout grid-cols-layout">
      {/* 移动端侧边栏覆盖 */}
      <div className="fixed inset-0 bg-black/50 z-50 md:hidden hidden" id="mobile-sidebar-overlay" />

      {/* 左侧边栏 */}
      <div className="grid-in-sidebar">
        <Sidebar />
      </div>

      {/* 顶部导航栏 */}
      <div className="grid-in-header border-b">
        <Header />
      </div>

      {/* 主要内容区域 */}
      <div className="grid-in-main flex flex-col min-w-0">
        {/* 主要内容 */}
        <main className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* 右侧面板 */}
      <div className={`
        grid-in-right-panel transition-all duration-300 ease-in-out
        ${isRightPanelOpen ? 'block' : 'hidden lg:block'}
      `}>
        <RightPanel
          conversation={selectedConversation}
          isOpen={isRightPanelOpen}
          onToggle={toggleRightPanel}
          onConversationAction={handleConversationAction}
        />
      </div>

      {/* 移动端右侧面板覆盖层 */}
      {isRightPanelOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleRightPanel}
        />
      )}
    </div>
  )
}

function Layout({ children }: LayoutProps) {
  return (
    <ConversationProvider>
      <LayoutContent>
        {children}
      </LayoutContent>
    </ConversationProvider>
  )
}

export default Layout