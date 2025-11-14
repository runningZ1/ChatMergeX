import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider'
import { Toaster } from './components/ui/toaster'
import { useDatabaseInit } from './hooks/use-database-init'
import Layout from './components/layout'
import HomePage from './pages/home-page'
import ConversationPage from './pages/conversation-page'
import SettingsPage from './pages/settings-page'
import NotFoundPage from './pages/not-found-page'

function DatabaseInitializer({ children }: { children: React.ReactNode }) {
  const { isInitialized, isInitializing, error } = useDatabaseInit()

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">正在初始化数据库...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-destructive text-6xl">⚠️</div>
          <h2 className="text-xl font-semibold">数据库初始化失败</h2>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="chatmergex-theme">
      <DatabaseInitializer>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/conversation/:id" element={<ConversationPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
          <Toaster />
        </Router>
      </DatabaseInitializer>
    </ThemeProvider>
  )
}

export default App