# ChatMergeX - 数据模型设计文档

**版本**: v1.0
**日期**: 2025-01-06
**状态**: 设计阶段

---

## 目录

1. [概述](#1-概述)
2. [核心实体](#2-核心实体)
3. [数据库设计](#3-数据库设计)
4. [数据关系](#4-数据关系)
5. [数据验证](#5-数据验证)
6. [数据迁移](#6-数据迁移)
7. [示例数据](#7-示例数据)

---

## 1. 概述

ChatMergeX 使用 **IndexedDB** 作为本地数据存储方案，通过 **Dexie.js** 进行封装。所有数据完全存储在用户浏览器本地，不上传到服务器。

### 1.1 设计原则

- **结构化存储**：使用类 SQL 的表结构
- **类型安全**：完整的 TypeScript 类型定义
- **索引优化**：为常用查询字段建立索引
- **向后兼容**：支持数据库版本迁移
- **数据完整性**：外键约束和数据验证

### 1.2 数据库信息

- **数据库名称**：`chatmergex_db`
- **当前版本**：1
- **存储位置**：浏览器 IndexedDB
- **预期容量**：支持 10,000+ 对话记录（约 100-500 MB）

---

## 2. 核心实体

### 2.1 Conversation（对话记录）

**描述**：存储完整的 AI 对话记录

```typescript
interface Conversation {
  // 基础信息
  id: string;                    // UUID，主键
  platform: Platform;            // 平台标识
  title: string;                 // 对话标题（可编辑）
  url: string;                   // 原平台链接

  // 分类信息
  folderId?: string;             // 所属文件夹 ID（外键）

  // 时间信息
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 最后更新时间

  // 统计信息
  messageCount: number;          // 消息数量

  // 对话内容
  messages: Message[];           // 完整对话历史

  // 元数据（可选）
  metadata?: ConversationMetadata;
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 索引 | 说明 |
|------|------|------|------|------|
| `id` | string | ✅ | 主键 | UUID 格式，唯一标识 |
| `platform` | Platform | ✅ | ✅ | 平台枚举值 |
| `title` | string | ✅ | ✅ | 对话标题，用于搜索 |
| `url` | string | ✅ | ❌ | 原平台对话链接 |
| `folderId` | string | ❌ | ✅ | 关联文件夹 |
| `createdAt` | Date | ✅ | ✅ | 创建时间，用于排序 |
| `updatedAt` | Date | ✅ | ✅ | 更新时间，用于排序 |
| `messageCount` | number | ✅ | ❌ | 消息数量统计 |
| `messages` | Message[] | ✅ | ❌ | 完整对话内容 |
| `metadata` | Object | ❌ | ❌ | 额外元信息 |

### 2.2 Message（消息）

**描述**：对话中的单条消息

```typescript
interface Message {
  id: string;                    // 消息 ID
  role: MessageRole;             // 消息角色
  content: RichContent;          // 消息内容
  timestamp: Date;               // 消息时间戳
}

enum MessageRole {
  USER = 'user',                 // 用户消息
  ASSISTANT = 'assistant'        // AI 回复
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 消息唯一标识 |
| `role` | MessageRole | ✅ | 用户或 AI |
| `content` | RichContent | ✅ | 富文本内容 |
| `timestamp` | Date | ✅ | 消息发送时间 |

### 2.3 RichContent（富文本内容）

**描述**：支持多种格式的消息内容

```typescript
interface RichContent {
  type: ContentType;             // 内容类型
  data: RichContentData;         // 内容数据
}

enum ContentType {
  TEXT = 'text',                 // 纯文本
  CODE = 'code',                 // 代码块
  IMAGE = 'image',               // 图片
  MIXED = 'mixed'                // 混合内容
}

// 内容数据（根据类型不同）
type RichContentData =
  | TextContent                  // 纯文本
  | CodeContent                  // 代码
  | ImageContent                 // 图片
  | MixedContent;                // 混合

// 纯文本
interface TextContent {
  text: string;                  // 文本内容
}

// 代码块
interface CodeContent {
  code: string;                  // 代码内容
  language: string;              // 语言标识（如 'typescript'）
}

// 图片
interface ImageContent {
  url: string;                   // 图片 URL 或 Data URL
  alt?: string;                  // 替代文本
  width?: number;                // 宽度（可选）
  height?: number;               // 高度（可选）
}

// 混合内容
interface MixedContent {
  blocks: ContentBlock[];        // 内容块数组
}

interface ContentBlock {
  type: 'text' | 'code' | 'image';
  data: TextContent | CodeContent | ImageContent;
}
```

**示例数据**：

```typescript
// 纯文本消息
{
  type: 'text',
  data: {
    text: 'Hello, how can I help you?'
  }
}

// 代码块消息
{
  type: 'code',
  data: {
    code: 'const sum = (a, b) => a + b;',
    language: 'javascript'
  }
}

// 混合内容消息
{
  type: 'mixed',
  data: {
    blocks: [
      {
        type: 'text',
        data: { text: 'Here is an example:' }
      },
      {
        type: 'code',
        data: {
          code: 'console.log("Hello");',
          language: 'javascript'
        }
      },
      {
        type: 'text',
        data: { text: 'This will print Hello to the console.' }
      }
    ]
  }
}
```

### 2.4 Folder（文件夹）

**描述**：用于组织和分类对话记录

```typescript
interface Folder {
  id: string;                    // UUID，主键
  name: string;                  // 文件夹名称
  parentId?: string;             // 父文件夹 ID（外键）
  createdAt: Date;               // 创建时间
  order: number;                 // 排序顺序
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 索引 | 说明 |
|------|------|------|------|------|
| `id` | string | ✅ | 主键 | UUID 格式 |
| `name` | string | ✅ | ✅ | 文件夹名称，用于搜索 |
| `parentId` | string | ❌ | ✅ | 父文件夹 ID，为空表示根级 |
| `createdAt` | Date | ✅ | ❌ | 创建时间 |
| `order` | number | ✅ | ✅ | 排序顺序（0-999） |

**特点**：
- 支持多级文件夹（树形结构）
- `parentId` 为空表示根级文件夹
- `order` 用于控制同级文件夹的显示顺序

### 2.5 UserSettings（用户设置）

**描述**：存储用户偏好设置

```typescript
interface UserSettings {
  id: string;                    // 固定为 'user_settings'
  theme: Theme;                  // 主题设置
  language: Language;            // 语言设置
  syncEnabled: boolean;          // 是否启用同步
  syncPlatforms: Platform[];     // 启用同步的平台
  autoSync: boolean;             // 是否自动同步
  syncInterval?: number;         // 同步间隔（秒）
}

enum Theme {
  LIGHT = 'light',               // 浅色主题
  DARK = 'dark',                 // 深色主题
  AUTO = 'auto'                  // 跟随系统
}

enum Language {
  ZH_CN = 'zh-CN',               // 简体中文
  EN_US = 'en-US'                // 英文
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | string | ✅ | 'user_settings' | 固定 ID |
| `theme` | Theme | ✅ | 'auto' | 主题 |
| `language` | Language | ✅ | 'zh-CN' | 语言 |
| `syncEnabled` | boolean | ✅ | true | 同步开关 |
| `syncPlatforms` | Platform[] | ✅ | [] | 同步平台 |
| `autoSync` | boolean | ✅ | true | 自动同步 |
| `syncInterval` | number | ❌ | 300 | 同步间隔 |

### 2.6 ConversationMetadata（对话元数据）

**描述**：存储对话的额外信息

```typescript
interface ConversationMetadata {
  model?: string;                // AI 模型名称（如 'gpt-4'）
  tokens?: number;               // Token 使用量
  tags?: string[];               // 标签（后续版本）
  starred?: boolean;             // 是否收藏（后续版本）
  archived?: boolean;            // 是否归档（后续版本）
}
```

### 2.7 Platform（平台枚举）

**描述**：支持的 AI 平台标识

```typescript
enum Platform {
  CHATGPT = 'chatgpt',           // ChatGPT
  DOUBAO = 'doubao',             // 豆包
  YUANBAO = 'yuanbao',           // 元宝
  GEMINI = 'gemini',             // Gemini
  GROK = 'grok'                  // Grok
}
```

**平台配置**：

```typescript
interface PlatformConfig {
  id: Platform;
  name: string;
  color: string;
  icon: string;
  url: string;
}

const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT',
    color: '#10a37f',
    icon: '🤖',
    url: 'https://chat.openai.com'
  },
  doubao: {
    id: 'doubao',
    name: '豆包',
    color: '#ff6b6b',
    icon: '🍪',
    url: 'https://www.doubao.com'
  },
  yuanbao: {
    id: 'yuanbao',
    name: '元宝',
    color: '#ffd93d',
    icon: '💰',
    url: 'https://yuanbao.tencent.com'
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    color: '#4285f4',
    icon: '✨',
    url: 'https://gemini.google.com'
  },
  grok: {
    id: 'grok',
    name: 'Grok',
    color: '#8b5cf6',
    icon: '🚀',
    url: 'https://x.com/i/grok'
  }
};
```

---

## 3. 数据库设计

### 3.1 Dexie.js 数据库定义

```typescript
// src/db/database.ts
import Dexie, { Table } from 'dexie';
import { Conversation, Folder, UserSettings } from './schema';

export class ChatMergeXDatabase extends Dexie {
  // 表定义
  conversations!: Table<Conversation>;
  folders!: Table<Folder>;
  settings!: Table<UserSettings>;

  constructor() {
    super('chatmergex_db');

    // 版本 1：初始数据库结构
    this.version(1).stores({
      conversations: 'id, platform, folderId, createdAt, updatedAt, title',
      folders: 'id, parentId, name, order',
      settings: 'id'
    });
  }
}

// 导出数据库实例
export const db = new ChatMergeXDatabase();
```

### 3.2 索引说明

#### conversations 表

| 索引 | 类型 | 用途 |
|------|------|------|
| `id` | 主键 | 唯一标识对话 |
| `platform` | 单列 | 按平台筛选 |
| `folderId` | 单列 | 按文件夹查询 |
| `createdAt` | 单列 | 按创建时间排序 |
| `updatedAt` | 单列 | 按更新时间排序 |
| `title` | 单列 | 全文搜索 |

**复合索引**（可选优化）：
```typescript
'[platform+folderId]'  // 同时按平台和文件夹筛选
'[folderId+createdAt]' // 文件夹内按时间排序
```

#### folders 表

| 索引 | 类型 | 用途 |
|------|------|------|
| `id` | 主键 | 唯一标识文件夹 |
| `parentId` | 单列 | 查询子文件夹 |
| `name` | 单列 | 搜索文件夹 |
| `order` | 单列 | 排序 |

#### settings 表

| 索引 | 类型 | 用途 |
|------|------|------|
| `id` | 主键 | 固定为 'user_settings' |

### 3.3 数据库操作示例

#### 插入对话

```typescript
import { db } from '@/db/database';
import { v4 as uuidv4 } from 'uuid';

async function addConversation(conversation: Omit<Conversation, 'id'>) {
  const newConversation: Conversation = {
    ...conversation,
    id: uuidv4()
  };

  await db.conversations.add(newConversation);
  return newConversation;
}
```

#### 查询对话

```typescript
// 查询所有对话
const allConversations = await db.conversations.toArray();

// 按平台查询
const chatgptConversations = await db.conversations
  .where('platform')
  .equals('chatgpt')
  .toArray();

// 按文件夹查询
const folderConversations = await db.conversations
  .where('folderId')
  .equals(folderId)
  .toArray();

// 按时间范围查询
const recentConversations = await db.conversations
  .where('createdAt')
  .between(startDate, endDate)
  .toArray();

// 组合查询
const conversations = await db.conversations
  .where('platform')
  .equals('chatgpt')
  .and(c => c.folderId === folderId)
  .and(c => c.createdAt > startDate)
  .reverse()
  .sortBy('createdAt');
```

#### 更新对话

```typescript
// 更新单个字段
await db.conversations.update(id, {
  title: 'New Title'
});

// 更新多个字段
await db.conversations.update(id, {
  title: 'New Title',
  folderId: newFolderId,
  updatedAt: new Date()
});

// 完全替换
await db.conversations.put(updatedConversation);
```

#### 删除对话

```typescript
// 删除单个
await db.conversations.delete(id);

// 批量删除
await db.conversations.bulkDelete([id1, id2, id3]);

// 条件删除
await db.conversations
  .where('folderId')
  .equals(folderId)
  .delete();
```

---

## 4. 数据关系

### 4.1 ER 图

```
┌─────────────────┐
│   Conversation  │
│─────────────────│
│ id (PK)         │
│ platform        │
│ title           │
│ url             │
│ folderId (FK)   │───┐
│ createdAt       │   │
│ updatedAt       │   │
│ messageCount    │   │
│ messages        │   │
│ metadata        │   │
└─────────────────┘   │
                      │
                      │ 1:N
                      │
                      ▼
               ┌─────────────┐
               │   Folder    │
               │─────────────│
               │ id (PK)     │
               │ name        │
               │ parentId(FK)│──┐
               │ createdAt   │  │
               │ order       │  │
               └─────────────┘  │
                      ▲         │
                      │         │
                      └─────────┘
                      Self-Reference
                      (树形结构)

┌─────────────────┐
│  UserSettings   │
│─────────────────│
│ id (PK)         │
│ theme           │
│ language        │
│ syncEnabled     │
│ syncPlatforms   │
│ autoSync        │
│ syncInterval    │
└─────────────────┘
```

### 4.2 关系说明

#### Conversation - Folder（多对一）

- 一个对话只能属于一个文件夹（或不属于任何文件夹）
- 一个文件夹可以包含多个对话
- `folderId` 为空表示对话在根目录

**约束**：
- 删除文件夹时，需要处理其中的对话（移到根目录或一并删除）

```typescript
// 删除文件夹时的处理
async function deleteFolder(folderId: string, moveToRoot: boolean = true) {
  if (moveToRoot) {
    // 将对话移到根目录
    await db.conversations
      .where('folderId')
      .equals(folderId)
      .modify({ folderId: undefined });
  } else {
    // 一并删除对话
    await db.conversations
      .where('folderId')
      .equals(folderId)
      .delete();
  }

  // 删除文件夹
  await db.folders.delete(folderId);
}
```

#### Folder - Folder（自引用，一对多）

- 一个文件夹可以有一个父文件夹
- 一个文件夹可以有多个子文件夹
- `parentId` 为空表示根级文件夹

**约束**：
- 不能形成循环引用
- 删除父文件夹时，需要处理子文件夹

```typescript
// 递归删除文件夹及其子文件夹
async function deleteFolderRecursive(folderId: string) {
  // 查找所有子文件夹
  const children = await db.folders
    .where('parentId')
    .equals(folderId)
    .toArray();

  // 递归删除子文件夹
  for (const child of children) {
    await deleteFolderRecursive(child.id);
  }

  // 删除当前文件夹中的对话
  await db.conversations
    .where('folderId')
    .equals(folderId)
    .delete();

  // 删除当前文件夹
  await db.folders.delete(folderId);
}
```

---

## 5. 数据验证

### 5.1 验证函数

```typescript
// src/db/validation.ts

// 验证对话数据
export function validateConversation(data: any): data is Conversation {
  return (
    typeof data.id === 'string' &&
    typeof data.platform === 'string' &&
    Object.values(Platform).includes(data.platform) &&
    typeof data.title === 'string' &&
    data.title.length > 0 &&
    typeof data.url === 'string' &&
    data.url.startsWith('http') &&
    data.createdAt instanceof Date &&
    data.updatedAt instanceof Date &&
    typeof data.messageCount === 'number' &&
    Array.isArray(data.messages) &&
    data.messages.every(validateMessage)
  );
}

// 验证消息数据
export function validateMessage(data: any): data is Message {
  return (
    typeof data.id === 'string' &&
    ['user', 'assistant'].includes(data.role) &&
    validateRichContent(data.content) &&
    data.timestamp instanceof Date
  );
}

// 验证富文本内容
export function validateRichContent(data: any): data is RichContent {
  if (!data || typeof data !== 'object') return false;
  if (!['text', 'code', 'image', 'mixed'].includes(data.type)) return false;

  switch (data.type) {
    case 'text':
      return typeof data.data.text === 'string';
    case 'code':
      return (
        typeof data.data.code === 'string' &&
        typeof data.data.language === 'string'
      );
    case 'image':
      return typeof data.data.url === 'string';
    case 'mixed':
      return (
        Array.isArray(data.data.blocks) &&
        data.data.blocks.every(validateContentBlock)
      );
    default:
      return false;
  }
}

// 验证文件夹数据
export function validateFolder(data: any): data is Folder {
  return (
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    data.name.length > 0 &&
    (!data.parentId || typeof data.parentId === 'string') &&
    data.createdAt instanceof Date &&
    typeof data.order === 'number'
  );
}
```

### 5.2 使用示例

```typescript
// 在存储前验证数据
async function safeAddConversation(data: any) {
  if (!validateConversation(data)) {
    throw new Error('Invalid conversation data');
  }

  await db.conversations.add(data);
}

// 在接收同步数据时验证
window.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  if (type === 'CHATMERGEX_NEW_CONVERSATION') {
    if (validateConversation(payload)) {
      db.conversations.add(payload);
    } else {
      console.error('Invalid conversation data from sync:', payload);
    }
  }
});
```

---

## 6. 数据迁移

### 6.1 版本升级策略

```typescript
// src/db/database.ts
export class ChatMergeXDatabase extends Dexie {
  constructor() {
    super('chatmergex_db');

    // 版本 1：初始结构
    this.version(1).stores({
      conversations: 'id, platform, folderId, createdAt, updatedAt, title',
      folders: 'id, parentId, name, order',
      settings: 'id'
    });

    // 版本 2：添加标签功能（未来版本）
    this.version(2)
      .stores({
        conversations: 'id, platform, folderId, createdAt, updatedAt, title',
        folders: 'id, parentId, name, order',
        settings: 'id',
        tags: 'id, name, color' // 新增标签表
      })
      .upgrade(async (tx) => {
        // 数据迁移逻辑
        console.log('Upgrading to version 2...');
      });

    // 版本 3：添加标签关联（未来版本）
    this.version(3)
      .stores({
        conversations: 'id, platform, folderId, createdAt, updatedAt, title',
        folders: 'id, parentId, name, order',
        settings: 'id',
        tags: 'id, name, color',
        conversationTags: '[conversationId+tagId]' // 关联表
      })
      .upgrade(async (tx) => {
        console.log('Upgrading to version 3...');
      });
  }
}
```

### 6.2 数据导出和导入

#### 导出所有数据

```typescript
async function exportAllData(): Promise<string> {
  const conversations = await db.conversations.toArray();
  const folders = await db.folders.toArray();
  const settings = await db.settings.get('user_settings');

  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      conversations,
      folders,
      settings
    }
  };

  return JSON.stringify(exportData, null, 2);
}
```

#### 导入数据

```typescript
async function importData(jsonString: string) {
  const importData = JSON.parse(jsonString);

  // 验证数据格式
  if (!importData.version || !importData.data) {
    throw new Error('Invalid import data format');
  }

  // 清空现有数据（可选）
  await db.conversations.clear();
  await db.folders.clear();

  // 导入数据
  if (importData.data.conversations) {
    await db.conversations.bulkAdd(importData.data.conversations);
  }

  if (importData.data.folders) {
    await db.folders.bulkAdd(importData.data.folders);
  }

  if (importData.data.settings) {
    await db.settings.put(importData.data.settings);
  }
}
```

---

## 7. 示例数据

### 7.1 完整对话记录示例

```typescript
const exampleConversation: Conversation = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  platform: 'chatgpt',
  title: 'React Hooks 最佳实践',
  url: 'https://chat.openai.com/c/abc123',
  folderId: '660e8400-e29b-41d4-a716-446655440001',
  createdAt: new Date('2025-01-06T10:30:00Z'),
  updatedAt: new Date('2025-01-06T10:45:00Z'),
  messageCount: 4,
  messages: [
    {
      id: 'msg-1',
      role: 'user',
      content: {
        type: 'text',
        data: {
          text: '请介绍一下 React Hooks 的最佳实践'
        }
      },
      timestamp: new Date('2025-01-06T10:30:00Z')
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: {
        type: 'mixed',
        data: {
          blocks: [
            {
              type: 'text',
              data: {
                text: 'React Hooks 的最佳实践包括以下几点：\n\n1. 只在顶层调用 Hooks\n2. 只在 React 函数中调用 Hooks\n3. 使用自定义 Hook 提取复用逻辑\n\n示例代码：'
              }
            },
            {
              type: 'code',
              data: {
                code: `function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  const decrement = useCallback(() => {
    setCount(c => c - 1);
  }, []);

  return { count, increment, decrement };
}`,
                language: 'typescript'
              }
            },
            {
              type: 'text',
              data: {
                text: '\n这个自定义 Hook 封装了计数器的状态和操作。'
              }
            }
          ]
        }
      },
      timestamp: new Date('2025-01-06T10:32:00Z')
    },
    {
      id: 'msg-3',
      role: 'user',
      content: {
        type: 'text',
        data: {
          text: 'useCallback 和 useMemo 有什么区别?'
        }
      },
      timestamp: new Date('2025-01-06T10:40:00Z')
    },
    {
      id: 'msg-4',
      role: 'assistant',
      content: {
        type: 'text',
        data: {
          text: 'useCallback 和 useMemo 的主要区别：\n\n- useCallback 返回一个记忆化的回调函数\n- useMemo 返回一个记忆化的值\n\nuseCallback(fn, deps) 等价于 useMemo(() => fn, deps)'
        }
      },
      timestamp: new Date('2025-01-06T10:42:00Z')
    }
  ],
  metadata: {
    model: 'gpt-4',
    tokens: 1250
  }
};
```

### 7.2 文件夹树示例

```typescript
const exampleFolders: Folder[] = [
  {
    id: 'folder-root-1',
    name: '工作',
    parentId: undefined, // 根级
    createdAt: new Date('2025-01-01'),
    order: 0
  },
  {
    id: 'folder-root-2',
    name: '学习',
    parentId: undefined, // 根级
    createdAt: new Date('2025-01-01'),
    order: 1
  },
  {
    id: 'folder-child-1-1',
    name: '项目 A',
    parentId: 'folder-root-1', // 工作的子文件夹
    createdAt: new Date('2025-01-02'),
    order: 0
  },
  {
    id: 'folder-child-1-2',
    name: '项目 B',
    parentId: 'folder-root-1', // 工作的子文件夹
    createdAt: new Date('2025-01-02'),
    order: 1
  },
  {
    id: 'folder-child-2-1',
    name: 'React',
    parentId: 'folder-root-2', // 学习的子文件夹
    createdAt: new Date('2025-01-03'),
    order: 0
  },
  {
    id: 'folder-child-2-2',
    name: 'TypeScript',
    parentId: 'folder-root-2', // 学习的子文件夹
    createdAt: new Date('2025-01-03'),
    order: 1
  }
];

// 树形结构：
// 📁 工作
//   └ 📁 项目 A
//   └ 📁 项目 B
// 📁 学习
//   └ 📁 React
//   └ 📁 TypeScript
```

### 7.3 用户设置示例

```typescript
const exampleSettings: UserSettings = {
  id: 'user_settings',
  theme: 'auto',
  language: 'zh-CN',
  syncEnabled: true,
  syncPlatforms: ['chatgpt', 'doubao'],
  autoSync: true,
  syncInterval: 300 // 5 分钟
};
```

---

## 附录

### A. TypeScript 类型定义汇总

完整的类型定义文件：

```typescript
// src/types/index.ts

// 平台枚举
export enum Platform {
  CHATGPT = 'chatgpt',
  DOUBAO = 'doubao',
  YUANBAO = 'yuanbao',
  GEMINI = 'gemini',
  GROK = 'grok'
}

// 消息角色
export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant'
}

// 内容类型
export enum ContentType {
  TEXT = 'text',
  CODE = 'code',
  IMAGE = 'image',
  MIXED = 'mixed'
}

// 主题
export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto'
}

// 语言
export enum Language {
  ZH_CN = 'zh-CN',
  EN_US = 'en-US'
}

// 富文本内容
export interface TextContent {
  text: string;
}

export interface CodeContent {
  code: string;
  language: string;
}

export interface ImageContent {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface ContentBlock {
  type: 'text' | 'code' | 'image';
  data: TextContent | CodeContent | ImageContent;
}

export interface MixedContent {
  blocks: ContentBlock[];
}

export type RichContentData =
  | TextContent
  | CodeContent
  | ImageContent
  | MixedContent;

export interface RichContent {
  type: ContentType;
  data: RichContentData;
}

// 消息
export interface Message {
  id: string;
  role: MessageRole;
  content: RichContent;
  timestamp: Date;
}

// 对话元数据
export interface ConversationMetadata {
  model?: string;
  tokens?: number;
  tags?: string[];
  starred?: boolean;
  archived?: boolean;
}

// 对话记录
export interface Conversation {
  id: string;
  platform: Platform;
  title: string;
  url: string;
  folderId?: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  messages: Message[];
  metadata?: ConversationMetadata;
}

// 文件夹
export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: Date;
  order: number;
}

// 用户设置
export interface UserSettings {
  id: string;
  theme: Theme;
  language: Language;
  syncEnabled: boolean;
  syncPlatforms: Platform[];
  autoSync: boolean;
  syncInterval?: number;
}

// 平台配置
export interface PlatformConfig {
  id: Platform;
  name: string;
  color: string;
  icon: string;
  url: string;
}
```

### B. 数据库查询示例

```typescript
// 常用查询函数

// 获取某个文件夹下的所有对话（包括子文件夹）
async function getConversationsInFolderRecursive(
  folderId: string
): Promise<Conversation[]> {
  const folderIds = await getFolderIdsRecursive(folderId);
  return await db.conversations
    .where('folderId')
    .anyOf(folderIds)
    .toArray();
}

// 递归获取所有子文件夹 ID
async function getFolderIdsRecursive(folderId: string): Promise<string[]> {
  const ids = [folderId];
  const children = await db.folders
    .where('parentId')
    .equals(folderId)
    .toArray();

  for (const child of children) {
    const childIds = await getFolderIdsRecursive(child.id);
    ids.push(...childIds);
  }

  return ids;
}

// 获取最近 N 天的对话
async function getRecentConversations(days: number): Promise<Conversation[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await db.conversations
    .where('createdAt')
    .above(startDate)
    .reverse()
    .sortBy('createdAt');
}

// 统计各平台对话数量
async function getConversationCountByPlatform(): Promise<
  Record<Platform, number>
> {
  const conversations = await db.conversations.toArray();
  const counts: Record<string, number> = {};

  conversations.forEach(c => {
    counts[c.platform] = (counts[c.platform] || 0) + 1;
  });

  return counts as Record<Platform, number>;
}
```

---

**文档结束**

如有数据模型问题，请联系开发团队。
