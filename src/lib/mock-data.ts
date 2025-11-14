import { DBConversation, DBFolder, DBMessage } from '@/types/database'
import { Platform } from '@/types'

// 生成示例文件夹
export function generateMockFolders(): Omit<DBFolder, 'id'>[] {
  return [
    {
      name: '工作项目',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
      conversationCount: 5,
      color: '#3b82f6',
      icon: 'briefcase'
    },
    {
      name: '学习笔记',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-25'),
      conversationCount: 8,
      color: '#10b981',
      icon: 'book'
    },
    {
      name: '技术问题',
      parentId: 'learning-notes',
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-18'),
      conversationCount: 3,
      color: '#f59e0b',
      icon: 'code'
    },
    {
      name: '个人思考',
      createdAt: new Date('2024-01-08'),
      updatedAt: new Date('2024-01-22'),
      conversationCount: 4,
      color: '#8b5cf6',
      icon: 'brain'
    }
  ]
}

// 生成示例消息
function generateMockMessages(conversationId: string): DBMessage[] {
  const messageTemplates = [
    {
      role: 'user' as const,
      content: '请帮我解释一下React中的useEffect钩子是如何工作的？',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2小时前
    },
    {
      role: 'assistant' as const,
      content: `useEffect是React中的一个核心Hook，用于处理组件的副作用操作。

## 基本用法
\`\`\`javascript
useEffect(() => {
  // 副作用逻辑
  return () => {
    // 清理函数
  }
}, [dependencies])
\`\`\`

## 主要用途：
1. **数据获取** - 从API获取数据
2. **DOM操作** - 直接操作DOM元素
3. **事件监听** - 添加和移除事件监听器
4. **定时器** - 设置和清理定时器
5. **订阅** - 管理外部数据源

## 依赖数组说明：
- **空数组 []** - 只在组件挂载时执行一次
- **包含依赖项** - 依赖项变化时重新执行
- **省略依赖数组** - 每次渲染后都执行（通常避免使用）`,
      timestamp: new Date(Date.now() - 1.9 * 60 * 60 * 1000)
    },
    {
      role: 'user' as const,
      content: '那清理函数是什么时候执行的？',
      timestamp: new Date(Date.now() - 1.8 * 60 * 60 * 1000)
    },
    {
      role: 'assistant' as const,
      content: `清理函数的执行时机有几个关键点：

## 执行时机
1. **组件卸载时** - 组件从DOM中移除前
2. **依赖项变化时** - 下一个effect执行前
3. **严格模式下的双重执行** - 开发环境下的特殊行为

## 示例：
\`\`\`javascript
useEffect(() => {
  const timer = setInterval(() => {
    console.log('定时执行');
  }, 1000);

  // 清理函数
  return () => {
    clearInterval(timer);
    console.log('清理定时器');
  };
}, []);
\`\`\`

## 注意事项
- 清理函数应该与设置函数相反操作
- 避免在清理函数中产生副作用
- 异步清理函数需要正确处理`,
      timestamp: new Date(Date.now() - 1.7 * 60 * 60 * 1000),
      metadata: {
        model: 'gpt-4',
        tokens: 450
      }
    }
  ]

  return messageTemplates.map((msg, index) => ({
    id: `msg-${conversationId}-${index}`,
    conversationId,
    ...msg
  }))
}

// 生成示例对话
export function generateMockConversations(): Omit<DBConversation, 'id'>[] {
  const conversations: Omit<DBConversation, 'id'>[] = [
    {
      title: 'React Hooks 最佳实践指南',
      platform: 'chatgpt' as Platform,
      messages: [],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3天前
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
      folderId: 'work-project',
      platformUrl: 'https://chat.openai.com/c/example-123',
      metadata: {
        messageCount: 8,
        totalTokens: 2340,
        lastMessagePreview: 'useEffect清理函数的执行时机...',
        model: 'gpt-4',
        cost: 0.058
      }
    },
    {
      title: 'TypeScript 类型系统深入理解',
      platform: 'chatgpt' as Platform,
      messages: [],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2天前
      updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5小时前
      folderId: 'learning-notes',
      metadata: {
        messageCount: 12,
        totalTokens: 3450,
        lastMessagePreview: '泛型和条件类型的高级用法...',
        model: 'gpt-4',
        cost: 0.086
      }
    },
    {
      title: '前端性能优化策略讨论',
      platform: 'doubao' as Platform,
      messages: [],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1天前
      updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8小时前
      folderId: 'work-project',
      platformUrl: 'https://www.doubao.com/chat/example-456',
      metadata: {
        messageCount: 6,
        totalTokens: 1890,
        lastMessagePreview: '代码分割和懒加载的最佳实践...',
        model: 'doubao-pro',
        cost: 0.047
      }
    },
    {
      title: 'CSS Grid 布局完全指南',
      platform: 'gemini' as Platform,
      messages: [],
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4天前
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1天前
      folderId: 'learning-notes',
      metadata: {
        messageCount: 10,
        totalTokens: 2780,
        lastMessagePreview: '响应式网格布局的实现方法...',
        model: 'gemini-pro',
        cost: 0.069
      }
    },
    {
      title: 'JavaScript 异步编程总结',
      platform: 'chatgpt' as Platform,
      messages: [],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5天前
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3天前
      folderId: 'learning-notes',
      metadata: {
        messageCount: 15,
        totalTokens: 4120,
        lastMessagePreview: 'Promise、async/await和错误处理...',
        model: 'gpt-4',
        cost: 0.103
      }
    }
  ]

  // 为每个对话生成消息
  return conversations.map((conv, index) => ({
    ...conv,
    messages: generateMockMessages(`conv-${index}`)
  }))
}

// 初始化示例数据
export async function initializeMockData() {
  const { database } = await import('./database')

  try {
    // 清空现有数据
    await database.clearDatabase()

    // 添加文件夹
    const folders = generateMockFolders()
    for (const folder of folders) {
      await database.createFolder(folder)
    }

    // 添加对话
    const conversations = generateMockConversations()
    for (const conversation of conversations) {
      await database.createConversation(conversation)
    }

    console.log('Mock data initialized successfully')
    return true
  } catch (error) {
    console.error('Failed to initialize mock data:', error)
    return false
  }
}

// 导出示例数据供开发使用
export const mockData = {
  folders: generateMockFolders(),
  conversations: generateMockConversations()
}