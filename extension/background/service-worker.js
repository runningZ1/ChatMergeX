// ChatMergeX Background Service Worker (Manifest V3)

class ChatMergeXBackground {
  constructor() {
    this.init();
  }

  init() {
    // 监听扩展安装事件
    chrome.runtime.onInstalled.addListener(() => {
      console.log('ChatMergeX extension installed');
      this.initializeStorage();
    });

    // 监听来自content script的消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // 保持消息通道开启以支持异步响应
    });

    // 监听标签页更新事件
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.handleTabUpdate(tabId, changeInfo, tab);
      }
    });

    // 监听来自Web应用的外部消息
    chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
      this.handleExternalMessage(message, sender, sendResponse);
      return true;
    });
  }

  async initializeStorage() {
    try {
      // 初始化扩展存储
      await chrome.storage.local.set({
        settings: {
          syncEnabled: true,
          autoSync: false,
          supportedPlatforms: ['chatgpt', 'doubao', 'yuanbao', 'gemini', 'grok'],
          lastSync: null,
          extractionEnabled: true
        },
        conversations: [],
        syncQueue: []
      });
      console.log('Background storage initialized');
    } catch (error) {
      console.error('Failed to initialize storage:', error);
    }
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      const { type, data } = message;

      switch (type) {
        case 'CONVERSATION_DETECTED':
          await this.handleConversationDetected(data, sender.tab);
          sendResponse({ success: true });
          break;

        case 'CONVERSATION_UPDATED':
          await this.handleConversationUpdated(data, sender.tab);
          sendResponse({ success: true });
          break;

        case 'EXTRACT_CONVERSATION':
          const conversation = await this.extractConversation(data, sender.tab);
          sendResponse({ success: true, data: conversation });
          break;

        case 'GET_PLATFORM_INFO':
          const platformInfo = await this.getPlatformInfo(sender.tab);
          sendResponse({ success: true, data: platformInfo });
          break;

        case 'GET_STATS':
          const stats = await this.getStats();
          sendResponse({ success: true, data: stats });
          break;

        case 'SYNC_TO_WEB_APP':
          await this.syncToWebApp(data);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleExternalMessage(message, sender, sendResponse) {
    try {
      // 验证发送者来源
      if (!this.isTrustedOrigin(sender.origin)) {
        sendResponse({ success: false, error: 'Unauthorized origin' });
        return;
      }

      const { type, data } = message;

      switch (type) {
        case 'GET_CONVERSATIONS':
          const conversations = await this.getConversations();
          sendResponse({ success: true, data: conversations });
          break;

        case 'SYNC_STATUS':
          const syncStatus = await this.getSyncStatus();
          sendResponse({ success: true, data: syncStatus });
          break;

        case 'TRIGGER_SYNC':
          await this.triggerSync(data);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown external message type' });
      }
    } catch (error) {
      console.error('Error handling external message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleConversationDetected(data, tab) {
    const platform = this.detectPlatform(tab.url);
    if (!platform) return;

    console.log(`Conversation detected on ${platform}:`, data);

    // 存储检测到的对话信息
    await chrome.storage.local.set({
      [`current_conversation_${platform}`]: {
        ...data,
        platform,
        url: tab.url,
        timestamp: Date.now()
      }
    });

    // 通知Web应用
    this.notifyWebApp({
      type: 'CONVERSATION_DETECTED',
      data: {
        ...data,
        platform,
        url: tab.url,
        timestamp: Date.now()
      }
    });
  }

  async handleConversationUpdated(data, tab) {
    const platform = this.detectPlatform(tab.url);
    if (!platform) return;

    console.log(`Conversation updated on ${platform}:`, data);

    // 更新存储的对话信息
    await chrome.storage.local.set({
      [`current_conversation_${platform}`]: {
        ...data,
        platform,
        url: tab.url,
        timestamp: Date.now()
      }
    });

    // 通知Web应用
    this.notifyWebApp({
      type: 'CONVERSATION_UPDATED',
      data: {
        ...data,
        platform,
        url: tab.url,
        timestamp: Date.now()
      }
    });
  }

  async handleTabUpdate(tabId, changeInfo, tab) {
    const platform = this.detectPlatform(tab.url);
    if (!platform) return;

    // 检查是否需要注入content script
    if (changeInfo.status === 'complete') {
      try {
        // 确保content script已注入
        await chrome.scripting.executeScript({
          target: { tabId },
          files: [`content-scripts/${platform}.js`]
        });
      } catch (error) {
        console.error(`Failed to inject content script for ${platform}:`, error);
      }
    }
  }

  detectPlatform(url) {
    const platforms = {
      chatgpt: ['chat.openai.com', 'chatgpt.com'],
      doubao: ['doubao.com', 'www.doubao.com'],
      yuanbao: ['yuanbao.tencent.com'],
      gemini: ['gemini.google.com'],
      grok: ['grok.x.ai']
    };

    for (const [platform, domains] of Object.entries(platforms)) {
      if (domains.some(domain => url.includes(domain))) {
        return platform;
      }
    }

    return null;
  }

  async getPlatformInfo(tab) {
    const platform = this.detectPlatform(tab.url);
    return {
      platform,
      url: tab.url,
      title: tab.title,
      supported: !!platform
    };
  }

  async notifyWebApp(data) {
    try {
      // 向localhost:3000发送消息
      const tabs = await chrome.tabs.query({
        url: ['http://localhost:3000/*', 'https://localhost:3000/*']
      });

      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, data);
        } catch (error) {
          console.log('Failed to send message to web app:', error);
        }
      }
    } catch (error) {
      console.error('Failed to notify web app:', error);
    }
  }

  isTrustedOrigin(origin) {
    const trustedOrigins = [
      'http://localhost:3000',
      'https://localhost:3000'
    ];
    return trustedOrigins.includes(origin);
  }

  async getConversations() {
    const result = await chrome.storage.local.get(['conversations']);
    return result.conversations || [];
  }

  async getSyncStatus() {
    const result = await chrome.storage.local.get(['settings', 'syncQueue']);
    const { settings, syncQueue } = result;

    return {
      enabled: settings?.syncEnabled || false,
      lastSync: settings?.lastSync || null,
      queueLength: syncQueue?.length || 0,
      platforms: settings?.supportedPlatforms || []
    };
  }

  async getStats() {
    const result = await chrome.storage.local.get(['conversations', 'syncQueue']);
    const { conversations, syncQueue } = result;

    return {
      totalConversations: conversations?.length || 0,
      syncQueue: syncQueue?.length || 0,
      platforms: this.getPlatformStats(conversations || [])
    };
  }

  getPlatformStats(conversations) {
    const platformCounts = {};
    const supportedPlatforms = ['chatgpt', 'doubao', 'yuanbao', 'gemini', 'grok'];

    supportedPlatforms.forEach(platform => {
      platformCounts[platform] = conversations.filter(conv => conv.platform === platform).length;
    });

    return platformCounts;
  }

  async triggerSync(options = {}) {
    // 实现同步触发逻辑
    console.log('Triggering sync with options:', options);

    // 这里可以添加实际的同步逻辑
    await chrome.storage.local.set({
      'settings.lastSync': Date.now()
    });
  }

  async syncToWebApp(data) {
    // 添加到同步队列
    const result = await chrome.storage.local.get(['syncQueue']);
    const queue = result.syncQueue || [];

    queue.push({
      ...data,
      timestamp: Date.now(),
      id: this.generateId()
    });

    await chrome.storage.local.set({ syncQueue: queue });

    // 尝试立即同步
    await this.processSyncQueue();
  }

  async processSyncQueue() {
    const result = await chrome.storage.local.get(['syncQueue', 'settings']);
    const { syncQueue, settings } = result;

    if (!settings?.syncEnabled || syncQueue.length === 0) {
      return;
    }

    try {
      // 处理同步队列中的项目
      const processedItems = [];

      for (const item of syncQueue) {
        try {
          await this.notifyWebApp({
            type: 'SYNC_ITEM',
            data: item
          });
          processedItems.push(item);
        } catch (error) {
          console.error('Failed to sync item:', item, error);
        }
      }

      // 从队列中移除已处理的项目
      const remainingQueue = syncQueue.filter(item => !processedItems.includes(item));
      await chrome.storage.local.set({
        syncQueue: remainingQueue,
        'settings.lastSync': Date.now()
      });

    } catch (error) {
      console.error('Failed to process sync queue:', error);
    }
  }

  generateId() {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 初始化background service worker
new ChatMergeXBackground();