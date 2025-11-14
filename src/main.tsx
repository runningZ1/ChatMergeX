import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'

// 确保根元素存在
const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

// 渲染应用
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)