# ChatMergeX - 技术架构文档

**版本**: v1.0
**日期**: 2025-01-06
**状态**: 架构设计阶段

---

## 目录

1. [架构概述](#1-架构概述)
2. [技术栈](#2-技术栈)
3. [系统架构](#3-系统架构)
4. [项目结构](#4-项目结构)
5. [核心模块设计](#5-核心模块设计)
6. [数据流设计](#6-数据流设计)
7. [通信机制](#7-通信机制)
8. [性能优化策略](#8-性能优化策略)
9. [安全设计](#9-安全设计)

---

## 1. 架构概述

### 1.1 整体架构

ChatMergeX 采用**前端为主的架构**，由两个核心部分组成：

1. **Web 应用**：基于 React 的单页应用，负责 UI 展示和用户交互
2. **浏览器插件**：Chrome Extension，负责数据同步和内容抓取

```
┌─────────────────────────────────────────────────────────┐
│                    用户浏览器                              │
│                                                           │
│  ┌─────────────────┐         ┌─────────────────┐        │
│  │  AI 平台页面     │         │  ChatMergeX      │        │
│  │  (ChatGPT/豆包)  │         │  Web 应用        │        │
│  │                 │         │                 │        │
│  │  ┌───────────┐  │         │  ┌───────────┐  │        │
│  │  │ Content   │  │         │  │  React    │  │        │
│  │  │ Script    │◄─┼─────────┼─►│  App      │  │        │
│  │  └───────────┘  │         │  └───────────┘  │        │
│  └─────────────────┘         │        │        │        │
│           │                  │        ▼        │        │
│           │                  │  ┌───────────┐  │        │
│           │                  │  │ IndexedDB │  │        │
│           │                  │  │ (Dexie.js)│  │        │
│           │                  │  └───────────┘  │        │
│           │                  └─────────────────┘        │
│           ▼                                              │
│  ┌─────────────────┐                                    │
│  │  Background     │                                    │
│  │  Service Worker │                                    │
│  └─────────────────┘                                    │
└─────────────────────────────────────────────────────────┘
```

### 1.2 架构特点

- **本地优先**：所有数据存储在浏览器本地，无需服务器
- **实时同步**：插件实时监听页面变化，自动同步
- **松耦合**：Web 应用和插件通过消息通信，可独立开发
- **离线可用**：Web 应用支持 PWA，离线也能查看历史数据

### 1.3 技术选型原则

- **成熟稳定**：优先选择经过验证的主流技术
- **轻量高效**：避免过度工程化，保持简洁
- **易于维护**：代码可读性好，文档完善
- **用户体验**：性能优先，快速响应

---

## 2. 技术栈

### 2.1 Web 应用技术栈

#### 核心框架
- **Next.js 15**: React 全栈框架 (基于 React 18)
- **TypeScript 5**: 类型安全和代码提示

#### UI 相关
- **shadcn/ui**: 基于 Radix UI 的组件库
- **Tailwind CSS 3**: 原子化 CSS 框架
- **Radix UI**: 无样式的可访问组件
- **Lucide Icons**: 图标库

#### 状态管理
- **Zustand**: 轻量级状态管理
  - 简单直观的 API
  - 无样板代码
  - 支持 TypeScript

#### 路由
- **Next.js App Router**: 基于文件系统的路由
  - 支持嵌套路由和布局
  - 支持服务端组件 (Server Components)
  - 自动代码分割

#### 数据存储
- **Dexie.js**: IndexedDB 封装库
  - 类 SQL 的查询 API
  - 支持复杂索引
  - TypeScript 友好

#### 产品分析
- **PostHog**: 产品分析和用户行为追踪
  - 数据驱动决策
  - 用户行为洞察

#### 内容渲染
- **react-markdown**: Markdown 渲染
- **prism-react-renderer**: 代码高亮
- **rehype-raw**: 支持 HTML 标签
- **remark-gfm**: GitHub Flavored Markdown

#### 工具库
- **date-fns**: 日期处理
- **react-window**: 虚拟滚动
- **react-dnd**: 拖拽功能
- **fuse.js**: 模糊搜索
- **zustand**: 状态持久化

### 2.2 浏览器插件技术栈

#### 核心技术
- **Manifest V3**: Chrome Extension 最新标准
- **TypeScript 5**: 类型安全
- **Webpack 5**: 打包构建

#### 插件 API
- **chrome.storage**: 存储插件配置
- **chrome.runtime**: 消息通信
- **chrome.tabs**: 标签页管理
- **chrome.scripting**: 动态注入脚本

#### DOM 解析
- **DOMParser**: 原生 DOM 解析
- **MutationObserver**: 监听页面变化

### 2.3 开发工具

#### 代码质量
- **ESLint**: 代码检查
- **Prettier**: 代码格式化
- **TypeScript**: 类型检查
- **husky**: Git Hooks

#### 测试
- **Vitest**: 单元测试框架
- **Testing Library**: React 组件测试
- **Playwright**: E2E 测试（可选）

#### 部署
- **Vercel**: Web 应用部署
- **Chrome Web Store**: 插件发布

---

## 3. 系统架构

### 3.1 分层架构

Web 应用采用经典的分层架构：

```
┌─────────────────────────────────────────┐
│          Presentation Layer             │  展示层
│         (React Components)              │
├─────────────────────────────────────────┤
│           Business Layer                │  业务层
│      (Stores + Custom Hooks)            │
├─────────────────────────────────────────┤
│            Data Layer                   │  数据层
│         (Dexie.js + IndexedDB)          │
├─────────────────────────────────────────┤
│         Communication Layer             │  通信层
│        (Message Bridge)                 │
└─────────────────────────────────────────┘
```

**展示层**：
- React 组件
- shadcn/ui 组件
- 页面路由

**业务层**：
- Zustand Stores（状态管理）
- Custom Hooks（业务逻辑封装）
- 工具函数

**数据层**：
- Dexie.js 数据库操作
- 数据模型定义
- 索引和查询

**通信层**：
- 插件消息接收
- 数据同步处理
- 错误处理

### 3.2 浏览器插件架构

```
┌─────────────────────────────────────────┐
│         Content Scripts                 │
│    (注入到 AI 平台页面)                   │
│                                         │
│  ┌──────────┐      ┌──────────┐        │
│  │ ChatGPT  │      │  豆包     │        │
│  │ Parser   │      │  Parser   │        │
│  └──────────┘      └──────────┘        │
└──────────┬──────────────────────────────┘
           │ chrome.runtime.sendMessage
           ▼
┌─────────────────────────────────────────┐
│      Background Service Worker          │
│                                         │
│  ┌─────────────┐   ┌─────────────┐     │
│  │  Message    │   │  Storage    │     │
│  │  Router     │   │  Manager    │     │
│  └─────────────┘   └─────────────┘     │
└──────────┬──────────────────────────────┘
           │ window.postMessage
           ▼
┌─────────────────────────────────────────┐
│          Web Application                │
└─────────────────────────────────────────┘
```

**Content Scripts**：
- 监听页面 DOM 变化
- 解析对话内容
- 提取富文本格式
- 发送到 Background

**Background Service Worker**：
- 接收 Content Scripts 消息
- 数据处理和转换
- 转发到 Web 应用
- 管理插件配置

---

## 4. 项目结构

### 4.1 Web 应用目录结构

```
web-app/
├── public/                     # 静态资源
│   ├── favicon.ico
│   └── manifest.json          # PWA 配置
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (main)/             # 主布局路由组
│   │   │   ├── layout.tsx      # 主布局 (包含 Sidebar)
│   │   │   ├── page.tsx        # 主页 (/)
│   │   │   ├── conversation/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx # 对话详情页
│   │   │   └── settings/
│   │   │       └── page.tsx    # 设置页
│   │   ├── welcome/            # 欢迎页 (无 Sidebar 的独立布局)
│   │   │   └── page.tsx
│   │   └── layout.tsx          # 根布局 (<html> 和 <body>)
│   │
│   ├── components/             # React 组件 (与之前类似)
│   │   ├── ui/               # shadcn/ui 组件
│   │   ├── layout/           # 布局组件
│   │   ├── conversation/     # 对话相关组件
│   │   ├── folder/           # 文件夹相关组件
│   │   ├── search/           # 搜索相关组件
│   │   └── common/           # 通用组件
│   │
│   ├── stores/               # Zustand 状态管理 (不变)
│   ├── db/                   # 数据库 (不变)
│   ├── hooks/                # 自定义 Hooks (不变)
│   ├── utils/                # 工具函数 (不变)
│   ├── types/                # TypeScript 类型 (不变)
│   ├── constants/            # 常量定义 (不变)
│   └── lib/                  # 第三方库配置
│       └── utils.ts          # shadcn/ui 工具函数
│
├── .eslintrc.json            # ESLint 配置 (Next.js 推荐 .json)
├── .prettierrc               # Prettier 配置
├── tsconfig.json             # TypeScript 配置
├── next.config.mjs           # Next.js 配置文件
├── tailwind.config.ts        # Tailwind CSS 配置
├── postcss.config.js         # PostCSS 配置
├── components.json           # shadcn/ui 配置
└── package.json              # 依赖和脚本
```

### 4.2 浏览器插件目录结构

```
browser-extension/
├── public/
│   ├── icons/                # 插件图标
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   └── manifest.json         # Manifest V3 配置
│
├── src/
│   ├── background/           # Background Service Worker
│   │   ├── index.ts          # 主入口
│   │   ├── messageHandler.ts # 消息处理
│   │   ├── storageManager.ts # 存储管理
│   │   └── syncManager.ts    # 同步管理
│   │
│   ├── content/              # Content Scripts
│   │   ├── common/           # 通用逻辑
│   │   │   ├── BaseParser.ts # 解析器基类
│   │   │   ├── DOMWatcher.ts # DOM 监听
│   │   │   └── bridge.ts     # 通信桥接
│   │   │
│   │   ├── chatgpt/          # ChatGPT 同步
│   │   │   ├── index.ts
│   │   │   ├── parser.ts     # 内容解析
│   │   │   └── selectors.ts  # CSS 选择器
│   │   │
│   │   ├── doubao/           # 豆包同步
│   │   │   ├── index.ts
│   │   │   ├── parser.ts
│   │   │   └── selectors.ts
│   │   │
│   │   └── inject.ts         # 注入脚本
│   │
│   ├── popup/                # 插件弹窗
│   │   ├── Popup.tsx         # React 组件
│   │   ├── popup.html        # HTML 模板
│   │   └── popup.css         # 样式
│   │
│   ├── utils/                # 工具函数
│   │   ├── parser.ts         # 通用解析
│   │   ├── storage.ts        # 存储工具
│   │   ├── logger.ts         # 日志工具
│   │   └── validator.ts      # 数据验证
│   │
│   └── types/                # TypeScript 类型
│       ├── message.ts        # 消息类型
│       ├── storage.ts        # 存储类型
│       └── index.ts
│
├── webpack.config.js         # Webpack 配置
├── tsconfig.json             # TypeScript 配置
└── package.json              # 依赖和脚本
```

---

## 5. 核心模块设计

### 5.1 数据存储模块（Dexie.js）

```typescript
// src/db/database.ts
import Dexie, { Table } from 'dexie';
import { Conversation, Folder, UserSettings } from './schema';

export class ChatMergeXDatabase extends Dexie {
  conversations!: Table<Conversation>;
  folders!: Table<Folder>;
  settings!: Table<UserSettings>;

  constructor() {
    super('chatmergex_db');

    this.version(1).stores({
      conversations: 'id, platform, folderId, createdAt, updatedAt, title',
      folders: 'id, parentId, name, order',
      settings: 'id'
    });
  }
}

export const db = new ChatMergeXDatabase();
```

**核心功能**：
- 对话记录 CRUD
- 文件夹管理
- 全文搜索
- 批量操作
- 数据导出

### 5.2 状态管理模块（Zustand）

```typescript
// src/stores/conversationStore.ts
import { create } from 'zustand';
import { Conversation } from '@/types';
import { db } from '@/db/database';

interface ConversationStore {
  conversations: Conversation[];
  selectedId: string | null;
  loading: boolean;

  // Actions
  fetchConversations: () => Promise<void>;
  selectConversation: (id: string) => void;
  addConversation: (conv: Conversation) => Promise<void>;
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  batchDelete: (ids: string[]) => Promise<void>;
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  conversations: [],
  selectedId: null,
  loading: false,

  fetchConversations: async () => {
    set({ loading: true });
    const conversations = await db.conversations.toArray();
    set({ conversations, loading: false });
  },

  // ... 其他 actions
}));
```

**Store 列表**：
- `conversationStore`: 对话管理
- `folderStore`: 文件夹管理
- `settingsStore`: 用户设置
- `searchStore`: 搜索状态
- `syncStore`: 同步状态

### 5.3 同步模块

#### 插件端（Content Script）

```typescript
// browser-extension/src/content/chatgpt/parser.ts
export class ChatGPTParser {
  // 解析对话列表
  parseConversationList(): Conversation[] {
    const elements = document.querySelectorAll('[data-testid^="conversation-"]');
    return Array.from(elements).map(el => this.parseConversation(el));
  }

  // 解析单个对话
  parseConversation(element: Element): Conversation {
    const title = element.querySelector('.conversation-title')?.textContent || '';
    const url = element.querySelector('a')?.href || '';
    // ... 更多解析逻辑

    return {
      id: generateId(),
      platform: 'chatgpt',
      title,
      url,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: this.parseMessages()
    };
  }

  // 解析消息内容
  parseMessages(): Message[] {
    const messageElements = document.querySelectorAll('.message');
    return Array.from(messageElements).map(el => ({
      id: generateId(),
      role: el.classList.contains('user') ? 'user' : 'assistant',
      content: this.parseRichContent(el),
      timestamp: new Date()
    }));
  }

  // 解析富文本内容
  parseRichContent(element: Element): RichContent {
    const codeBlocks = element.querySelectorAll('pre code');
    const images = element.querySelectorAll('img');

    if (codeBlocks.length > 0 || images.length > 0) {
      // 混合内容
      return {
        type: 'mixed',
        data: { blocks: this.parseBlocks(element) }
      };
    }

    // 纯文本
    return {
      type: 'text',
      data: { text: element.textContent || '' }
    };
  }
}
```

#### Web 应用端（接收同步）

```typescript
// src/utils/sync.ts
export class SyncManager {
  private messageHandler: (event: MessageEvent) => void;

  constructor() {
    this.messageHandler = this.handleMessage.bind(this);
  }

  // 启动监听
  start() {
    window.addEventListener('message', this.messageHandler);
  }

  // 停止监听
  stop() {
    window.removeEventListener('message', this.messageHandler);
  }

  // 处理消息
  private async handleMessage(event: MessageEvent) {
    // 验证消息来源
    if (event.source !== window) return;
    if (!event.data.type?.startsWith('CHATMERGEX_')) return;

    const { type, payload } = event.data;

    switch (type) {
      case 'CHATMERGEX_NEW_CONVERSATION':
        await this.handleNewConversation(payload);
        break;
      case 'CHATMERGEX_UPDATE_CONVERSATION':
        await this.handleUpdateConversation(payload);
        break;
      // ... 更多消息类型
    }
  }

  // 处理新对话
  private async handleNewConversation(conversation: Conversation) {
    // 检查是否已存在
    const existing = await db.conversations.get(conversation.id);
    if (existing) {
      await db.conversations.update(conversation.id, conversation);
    } else {
      await db.conversations.add(conversation);
    }

    // 通知 UI 更新
    useConversationStore.getState().fetchConversations();
  }
}
```

### 5.4 搜索模块

```typescript
// src/utils/search.ts
import Fuse from 'fuse.js';
import { db } from '@/db/database';
import { Conversation } from '@/types';

export class SearchEngine {
  private fuse: Fuse<Conversation> | null = null;

  // 初始化搜索引擎
  async initialize() {
    const conversations = await db.conversations.toArray();

    this.fuse = new Fuse(conversations, {
      keys: ['title', 'messages.content.data.text'],
      threshold: 0.3,
      includeScore: true
    });
  }

  // 搜索
  search(query: string): Conversation[] {
    if (!this.fuse) return [];

    const results = this.fuse.search(query);
    return results.map(result => result.item);
  }

  // 高级搜索（带筛选）
  async advancedSearch(options: {
    query: string;
    platform?: string[];
    folderId?: string;
    dateRange?: { start: Date; end: Date };
  }): Promise<Conversation[]> {
    let results = await db.conversations.toArray();

    // 平台筛选
    if (options.platform && options.platform.length > 0) {
      results = results.filter(c => options.platform!.includes(c.platform));
    }

    // 文件夹筛选
    if (options.folderId) {
      results = results.filter(c => c.folderId === options.folderId);
    }

    // 时间筛选
    if (options.dateRange) {
      results = results.filter(c =>
        c.createdAt >= options.dateRange!.start &&
        c.createdAt <= options.dateRange!.end
      );
    }

    // 关键词搜索
    if (options.query) {
      const fuse = new Fuse(results, {
        keys: ['title', 'messages.content.data.text'],
        threshold: 0.3
      });
      results = fuse.search(options.query).map(r => r.item);
    }

    return results;
  }
}
```

### 5.5 导出模块

```typescript
// src/utils/export.ts
import { Conversation } from '@/types';

export class ExportManager {
  // 导出为 Markdown
  exportToMarkdown(conversation: Conversation): string {
    let markdown = `# ${conversation.title}\n\n`;
    markdown += `**Platform**: ${conversation.platform}\n`;
    markdown += `**Created**: ${conversation.createdAt.toLocaleString()}\n`;
    markdown += `**URL**: ${conversation.url}\n\n`;
    markdown += `---\n\n`;

    conversation.messages.forEach(message => {
      const role = message.role === 'user' ? '👤 User' : '🤖 AI';
      markdown += `## ${role}\n\n`;
      markdown += this.renderContent(message.content);
      markdown += `\n\n`;
    });

    return markdown;
  }

  // 导出为 JSON
  exportToJSON(conversations: Conversation[]): string {
    return JSON.stringify(conversations, null, 2);
  }

  // 导出为 HTML
  exportToHTML(conversation: Conversation): string {
    // ... HTML 模板
  }

  // 下载文件
  download(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

---

## 6. 数据流设计

### 6.1 同步数据流

```
AI 平台页面 DOM 变化
        ↓
MutationObserver 监听
        ↓
Content Script 解析内容
        ↓
提取对话数据（标题、消息、时间等）
        ↓
chrome.runtime.sendMessage → Background Service Worker
        ↓
数据验证和转换
        ↓
window.postMessage → Web 应用
        ↓
SyncManager 接收消息
        ↓
存储到 IndexedDB (Dexie.js)
        ↓
触发 Store 更新
        ↓
React 组件重新渲染
```

### 6.2 用户操作数据流

#### 创建文件夹

```
用户点击"新建文件夹"
        ↓
打开输入对话框
        ↓
用户输入文件夹名称
        ↓
调用 folderStore.createFolder()
        ↓
写入 IndexedDB
        ↓
更新 Store 状态
        ↓
UI 显示新文件夹
```

#### 搜索对话

```
用户输入搜索关键词
        ↓
触发 searchStore.search()
        ↓
调用 SearchEngine.advancedSearch()
        ↓
查询 IndexedDB
        ↓
模糊匹配（Fuse.js）
        ↓
返回结果列表
        ↓
更新 searchStore.results
        ↓
UI 显示搜索结果
```

#### 导出对话

```
用户选择对话并点击"导出"
        ↓
选择导出格式（Markdown/JSON/HTML）
        ↓
调用 ExportManager.exportToXXX()
        ↓
从 IndexedDB 读取完整数据
        ↓
格式转换
        ↓
生成文件内容
        ↓
触发浏览器下载
```

---

## 7. 通信机制

### 7.1 插件内部通信

#### Content Script ↔ Background Service Worker

```typescript
// Content Script 发送消息
chrome.runtime.sendMessage({
  type: 'NEW_CONVERSATION',
  payload: conversationData
});

// Background 接收消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'NEW_CONVERSATION') {
    // 处理逻辑
    sendResponse({ success: true });
  }
});
```

### 7.2 插件与 Web 应用通信

#### 插件 → Web 应用

```typescript
// Background Service Worker
window.postMessage({
  type: 'CHATMERGEX_NEW_CONVERSATION',
  payload: conversationData
}, '*');

// Web 应用接收
window.addEventListener('message', (event) => {
  if (event.data.type === 'CHATMERGEX_NEW_CONVERSATION') {
    // 处理数据
  }
});
```

#### Web 应用 → 插件

```typescript
// Web 应用发送
window.postMessage({
  type: 'CHATMERGEX_REQUEST_SYNC',
  payload: { platform: 'chatgpt' }
}, '*');

// 插件接收（通过 Content Script）
window.addEventListener('message', (event) => {
  if (event.data.type === 'CHATMERGEX_REQUEST_SYNC') {
    // 触发同步
  }
});
```

### 7.3 消息协议

```typescript
// 消息类型定义
interface Message<T = any> {
  type: MessageType;
  payload: T;
  timestamp: number;
  id: string;
}

enum MessageType {
  // 同步相关
  NEW_CONVERSATION = 'CHATMERGEX_NEW_CONVERSATION',
  UPDATE_CONVERSATION = 'CHATMERGEX_UPDATE_CONVERSATION',
  DELETE_CONVERSATION = 'CHATMERGEX_DELETE_CONVERSATION',

  // 控制相关
  REQUEST_SYNC = 'CHATMERGEX_REQUEST_SYNC',
  SYNC_STATUS = 'CHATMERGEX_SYNC_STATUS',

  // 错误相关
  ERROR = 'CHATMERGEX_ERROR'
}
```

---

## 8. 性能优化策略

### 8.1 前端性能优化

#### 虚拟滚动
```typescript
// 使用 react-window 优化长列表
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={conversations.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <ConversationItem
      style={style}
      conversation={conversations[index]}
    />
  )}
</FixedSizeList>
```

#### 懒加载
```typescript
// 路由懒加载
const Settings = lazy(() => import('@/pages/Settings'));

<Suspense fallback={<LoadingSpinner />}>
  <Settings />
</Suspense>
```

#### 防抖和节流
```typescript
// 搜索防抖
import { debounce } from 'lodash-es';

const handleSearch = debounce((query: string) => {
  searchStore.search(query);
}, 300);
```

### 8.2 数据库性能优化

#### 索引优化
```typescript
// 创建复合索引
this.version(1).stores({
  conversations: 'id, [platform+folderId], createdAt, updatedAt, title'
});
```

#### 批量操作
```typescript
// 批量插入
await db.conversations.bulkAdd(conversations);

// 批量删除
await db.conversations.bulkDelete(ids);
```

#### 查询优化
```typescript
// 使用索引查询
await db.conversations
  .where('platform')
  .equals('chatgpt')
  .and(c => c.createdAt > startDate)
  .toArray();
```

### 8.3 插件性能优化

#### 减少 DOM 查询
```typescript
// 缓存选择器
class ChatGPTParser {
  private selectors = {
    conversation: '[data-testid^="conversation-"]',
    message: '.message',
    title: '.conversation-title'
  };

  // 使用缓存的选择器
  parseConversation(element: Element) {
    const title = element.querySelector(this.selectors.title);
    // ...
  }
}
```

#### 节流监听
```typescript
// 节流 MutationObserver 回调
const throttledCallback = throttle((mutations) => {
  this.handleMutations(mutations);
}, 1000);

const observer = new MutationObserver(throttledCallback);
```

---

## 9. 安全设计

### 9.1 数据安全

#### 本地存储加密（可选）
```typescript
// 使用 Web Crypto API 加密敏感数据
async function encrypt(data: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(12)) },
    key,
    dataBuffer
  );
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}
```

#### 数据验证
```typescript
// 验证同步数据的完整性
function validateConversation(data: any): data is Conversation {
  return (
    typeof data.id === 'string' &&
    typeof data.title === 'string' &&
    Array.isArray(data.messages) &&
    data.messages.every(validateMessage)
  );
}
```

### 9.2 XSS 防护

#### 内容转义
```typescript
// 渲染用户内容时转义
import DOMPurify from 'dompurify';

function renderHTML(html: string) {
  const clean = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

#### CSP 策略
```html
<!-- public/index.html -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' 'unsafe-inline';
               style-src 'self' 'unsafe-inline';">
```

### 9.3 插件安全

#### 权限最小化
```json
// manifest.json
{
  "permissions": [
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "https://chat.openai.com/*",
    "https://www.doubao.com/*"
  ]
}
```

#### 消息验证
```typescript
// 验证消息来源
window.addEventListener('message', (event) => {
  // 只接受来自同域的消息
  if (event.origin !== window.location.origin) return;

  // 验证消息格式
  if (!isValidMessage(event.data)) return;

  // 处理消息
  handleMessage(event.data);
});
```

---

## 10. 部署和发布

### 10.1 Web 应用部署

#### Vercel 部署
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel deploy --prod
```

#### 配置文件
```json
// vercel.json
{
  "framework": "nextjs"
}
```

### 10.2 浏览器插件发布

#### 打包插件
```bash
npm run build
# 生成 extension.zip
```

#### Chrome Web Store 发布流程
1. 创建开发者账号
2. 上传 ZIP 文件
3. 填写商店信息
4. 提交审核
5. 等待批准（通常 1-3 天）

---

## 附录

### A. 技术选型对比

| 技术 | 选择 | 备选方案 | 选择理由 |
|------|------|----------|----------|
| 前端框架 | Next.js | Vite, SvelteKit | 全栈能力，生态成熟，与竞品对齐 |
| UI 库 | shadcn/ui | Ant Design, Material-UI | 轻量、可定制、无运行时依赖 |
| 状态管理 | Zustand | Redux, Jotai | 简单、轻量、无样板代码 |
| 数据存储 | IndexedDB | LocalStorage, SQLite WASM | 容量大、支持索引 |
| IndexedDB 封装 | Dexie.js | idb, localForage | API 友好、TypeScript 支持 |
| 构建工具 | Next.js (内置) | Vite, Webpack | 框架集成，无需额外配置 |

### B. 性能指标

| 指标 | 目标值 | 测量方法 |
|------|--------|----------|
| 首屏加载时间 | < 2s | Lighthouse |
| 列表渲染性能 | 60 FPS | Chrome DevTools |
| 搜索响应时间 | < 500ms | Performance API |
| 插件内存占用 | < 50MB | Task Manager |
| IndexedDB 查询 | < 100ms | Performance.now() |

### C. 开发规范

#### 命名规范
- 组件：PascalCase（如 `ConversationList`）
- 函数：camelCase（如 `fetchConversations`）
- 常量：UPPER_SNAKE_CASE（如 `API_BASE_URL`）
- 类型：PascalCase + 描述性后缀（如 `ConversationStore`）

#### Git 提交规范
```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具相关
```

---

**文档结束**

如有技术问题，请联系开发团队。
