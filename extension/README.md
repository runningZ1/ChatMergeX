# ChatMergeX Browser Extension

Chrome扩展程序，用于从多个AI对话平台提取和同步对话数据到ChatMergeX Web应用。

## 支持的平台

- ✅ **ChatGPT** - OpenAI ChatGPT (chat.openai.com, chatgpt.com)
- ✅ **豆包** - 字节跳动豆包 (doubao.com)
- ✅ **元宝** - 腾讯元宝 (yuanbao.tencent.com)
- ✅ **Gemini** - Google Gemini (gemini.google.com)
- ✅ **Grok** - X AI Grok (grok.x.ai)

## 功能特性

### 🔍 智能对话检测
- 自动检测页面上的对话内容
- 实时监控对话更新
- 支持长对话的分段提取

### 📡 实时同步
- 自动同步对话到ChatMergeX Web应用
- 手动触发同步
- 离线队列支持

### 🛡️ 安全性
- 遵循Chrome Manifest V3规范
- 安全的跨域通信
- 用户数据本地存储

### ⚡ 高性能
- 优化的DOM监听
- 防抖机制减少资源消耗
- 智能缓存策略

## 安装方法

### 开发者模式安装

1. 克隆ChatMergeX仓库：
   ```bash
   git clone https://github.com/runningZ1/ChatMergeX.git
   cd ChatMergeX
   ```

2. 打开Chrome浏览器，进入扩展程序页面：
   - 地址栏输入：`chrome://extensions/`
   - 或点击：Chrome菜单 → 更多工具 → 扩展程序

3. 开启开发者模式：
   - 页面右上角切换"开发者模式"

4. 加载扩展：
   - 点击"加载已解压的扩展程序"
   - 选择ChatMergeX项目中的`extension`文件夹

5. 验证安装：
   - 扩展图标出现在浏览器工具栏
   - 点击图标查看扩展状态面板

## 使用方法

### 1. Web应用连接
确保ChatMergeX Web应用在 `http://localhost:3000` 运行，扩展会自动连接。

### 2. 访问AI平台
打开任意支持的AI平台网站，扩展会自动：
- 检测平台类型
- 开始监听对话
- 提取对话内容

### 3. 查看同步状态
- 点击扩展图标查看状态面板
- 实时查看同步进度
- 手动触发同步操作

## 技术架构

### 文件结构
```
extension/
├── manifest.json              # 扩展清单文件
├── background/
│   └── service-worker.js      # 后台服务工作器
├── content-scripts/
│   ├── base-content-script.js # 基础内容脚本
│   ├── chatgpt.js            # ChatGPT平台脚本
│   ├── doubao.js             # 豆包平台脚本
│   ├── yuanbao.js            # 元宝平台脚本
│   ├── gemini.js             # Gemini平台脚本
│   └── grok.js               # Grok平台脚本
├── popup/
│   ├── popup.html            # 弹出窗口HTML
│   └── popup.js              # 弹出窗口逻辑
├── assets/                   # 图标和资源文件
└── README.md                 # 说明文档
```

### 核心组件

#### Background Service Worker
- 处理扩展逻辑和消息路由
- 管理数据存储和同步队列
- 提供API给content scripts和popup

#### Content Scripts
- 基础脚本：通用功能和平台抽象
- 平台脚本：特定平台的DOM解析和内容提取
- 与background script通信

#### Popup UI
- 显示扩展状态和统计信息
- 提供手动同步控制
- 平台检测和状态展示

### 通信流程

```
AI Platform Page ←→ Content Script ←→ Background SW ←→ Web App
                           ↑                ↑
                       Platform Detection  Sync Queue
                           ↑                ↑
                       DOM Monitoring   Message Routing
```

## API接口

### Background Service Worker API

#### 消息类型
- `CONVERSATION_DETECTED` - 检测到新对话
- `CONVERSATION_UPDATED` - 对话内容更新
- `EXTRACT_CONVERSATION` - 提取当前对话
- `GET_PLATFORM_INFO` - 获取平台信息
- `GET_SYNC_STATUS` - 获取同步状态
- `GET_STATS` - 获取统计数据
- `TRIGGER_SYNC` - 触发手动同步

#### Web应用通信
扩展通过以下方式与Web应用通信：
- `chrome.runtime` API (Chrome扩展通信)
- `window.postMessage` (跨域消息)
- LocalStorage Web Bridge (数据同步)

## 开发指南

### 添加新平台支持

1. 创建平台content script：
   ```javascript
   class NewPlatformContentScript extends BaseContentScript {
     constructor() {
       super('newplatform');
     }

     // 重写平台特定的方法
     extractTitle() { /* 实现 */ }
     extractMessages() { /* 实现 */ }
     detectMessageRole(element) { /* 实现 */ }
   }

   new NewPlatformContentScript();
   ```

2. 更新manifest.json：
   ```json
   {
     "matches": ["https://newplatform.com/*"],
     "js": ["content-scripts/base-content-script.js", "content-scripts/newplatform.js"]
   }
   ```

3. 更新background service worker的平台检测逻辑

### 调试方法

#### Content Script调试
1. 打开目标平台网站
2. 打开开发者工具 (F12)
3. 在Console中查看扩展日志
4. 检查Network面板的消息传递

#### Background SW调试
1. 进入`chrome://extensions/`
2. 找到ChatMergeX扩展
3. 点击"服务工作进程"或"background"
4. 打开开发者工具调试

#### Popup调试
1. 右键点击扩展图标
2. 选择"检查弹出内容"

## 故障排除

### 常见问题

**扩展无法加载**
- 检查manifest.json语法
- 确认所有文件路径正确
- 查看扩展页面的错误信息

**无法检测对话**
- 确认访问的是支持的平台URL
- 检查网页是否有动态加载
- 查看content script控制台日志

**同步失败**
- 确认Web应用在localhost:3000运行
- 检查网络连接状态
- 查看background SW的错误日志

**性能问题**
- 调整DOM监听频率
- 优化选择器性能
- 减少不必要的消息传递

### 日志级别
- `console.log` - 基本操作信息
- `console.warn` - 警告和非致命错误
- `console.error` - 严重错误和异常

## 更新日志

### v1.0.0 (2024-01-XX)
- ✅ 初始版本发布
- ✅ 支持5个主要AI平台
- ✅ 基础同步功能
- ✅ Manifest V3兼容

## 贡献指南

1. Fork项目仓库
2. 创建功能分支 (`git checkout -b feature/new-platform`)
3. 提交更改 (`git commit -am 'Add new platform support'`)
4. 推送分支 (`git push origin feature/new-platform`)
5. 创建Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](../LICENSE) 文件了解详情

## 联系方式

- GitHub: [runningZ1/ChatMergeX](https://github.com/runningZ1/ChatMergeX)
- 问题反馈: [Issues页面](https://github.com/runningZ1/ChatMergeX/issues)