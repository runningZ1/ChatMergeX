// ChatMergeX Extension Communication
// Web应用端与浏览器扩展通信的核心模块

interface ConversationData {
  id: string;
  title: string;
  platform: string;
  url: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: string;
    metadata?: Record<string, any>;
  }>;
  metadata: {
    extractedAt: string;
    messageCount: number;
    platform: string;
    model?: string;
    conversationId?: string;
    [key: string]: any;
  };
  timestamp: number;
}

interface SyncStatus {
  enabled: boolean;
  lastSync?: number;
  queueLength: number;
  platforms: string[];
}

interface ExtensionMessage {
  type: string;
  data?: any;
  platform?: string;
  timestamp: number;
  source?: 'extension';
}

class ExtensionCommunication {
  private isExtensionAvailable: boolean = false;
  private messageHandlers: Map<string, Function[]> = new Map();
  private extensionId: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor() {
    this.init();
  }

  private init() {
    console.log('Initializing extension communication...');

    // 设置消息监听器
    this.setupMessageListeners();

    // 检测扩展是否可用
    this.checkExtensionAvailability();

    // 定期检查连接状态
    this.startConnectionMonitoring();
  }

  private setupMessageListeners() {
    // 监听来自扩展的消息
    window.addEventListener('message', (event) => {
      this.handleExtensionMessage(event);
    });

    // 监听来自Chrome扩展的消息（通过runtime）
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage?.addListener((message, sender, sendResponse) => {
        this.handleChromeMessage(message, sender, sendResponse);
        return true; // 保持消息通道开启
      });
    }
  }

  private handleExtensionMessage(event: MessageEvent) {
    // 验证消息来源
    if (!this.isValidExtensionMessage(event)) {
      return;
    }

    const message: ExtensionMessage = event.data;
    console.log('Received extension message:', message);

    // 触发对应的消息处理器
    this.triggerMessageHandlers(message.type, message);
  }

  private handleChromeMessage(message: any, sender: chrome.runtime.MessageSender, sendResponse: Function) {
    console.log('Received Chrome message:', message);

    // 处理来自Chrome扩展的消息
    switch (message.type) {
      case 'CONVERSATION_DETECTED':
        this.onConversationDetected(message.data);
        sendResponse({ success: true });
        break;

      case 'CONVERSATION_UPDATED':
        this.onConversationUpdated(message.data);
        sendResponse({ success: true });
        break;

      case 'SYNC_STATUS_UPDATE':
        this.onSyncStatusUpdate(message.data);
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  }

  private isValidExtensionMessage(event: MessageEvent): boolean {
    // 验证消息来源
    if (event.source !== window) {
      return false;
    }

    const message = event.data;
    if (!message || typeof message !== 'object') {
      return false;
    }

    // 验证消息结构
    if (!message.type || typeof message.type !== 'string') {
      return false;
    }

    // 验证是否来自扩展
    return message.source === 'extension' ||
           event.origin === 'chrome-extension://*';
  }

  private async checkExtensionAvailability() {
    try {
      // 尝试与扩展通信
      const response = await this.sendMessage('PING', { timestamp: Date.now() });

      if (response && response.success) {
        this.isExtensionAvailable = true;
        this.reconnectAttempts = 0;
        console.log('Extension connection established');

        this.triggerMessageHandlers('EXTENSION_CONNECTED', {
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.log('Extension not available:', error);
      this.isExtensionAvailable = false;
      this.handleExtensionDisconnected();
    }
  }

  private handleExtensionDisconnected() {
    this.isExtensionAvailable = false;
    this.reconnectAttempts++;

    console.log(`Extension disconnected, attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    this.triggerMessageHandlers('EXTENSION_DISCONNECTED', {
      attempt: this.reconnectAttempts,
      timestamp: Date.now()
    });

    // 尝试重连
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.checkExtensionAvailability();
      }, 2000 * this.reconnectAttempts); // 指数退避
    }
  }

  private startConnectionMonitoring() {
    // 每30秒检查一次扩展连接状态
    setInterval(() => {
      if (this.isExtensionAvailable) {
        this.sendMessage('PING', { timestamp: Date.now() })
          .catch(() => {
            this.handleExtensionDisconnected();
          });
      } else {
        this.checkExtensionAvailability();
      }
    }, 30000);
  }

  // 公共API方法

  /**
   * 发送消息到扩展
   */
  async sendMessage(type: string, data: any = {}): Promise<any> {
    const message: ExtensionMessage = {
      type,
      data,
      timestamp: Date.now()
    };

    try {
      // 通过Chrome runtime发送
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
      }

      // 通过window.postMessage发送（回退方案）
      window.postMessage(message, 'http://localhost:3000');
      return { success: true };

    } catch (error) {
      console.error('Failed to send extension message:', error);
      throw error;
    }
  }

  /**
   * 注册消息处理器
   */
  onMessage(type: string, handler: Function) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  /**
   * 移除消息处理器
   */
  offMessage(type: string, handler: Function) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * 触发消息处理器
   */
  private triggerMessageHandlers(type: string, message: ExtensionMessage) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      });
    }
  }

  /**
   * 检查扩展是否可用
   */
  isConnected(): boolean {
    return this.isExtensionAvailable;
  }

  /**
   * 获取同步状态
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const response = await this.sendMessage('GET_SYNC_STATUS');
    return response.data || {
      enabled: false,
      queueLength: 0,
      platforms: []
    };
  }

  /**
   * 获取所有对话
   */
  async getConversations(): Promise<ConversationData[]> {
    const response = await this.sendMessage('GET_CONVERSATIONS');
    return response.data || [];
  }

  /**
   * 触发手动同步
   */
  async triggerSync(options: any = {}): Promise<boolean> {
    const response = await this.sendMessage('TRIGGER_SYNC', options);
    return response.success || false;
  }

  /**
   * 请求当前对话数据
   */
  async requestCurrentConversation(): Promise<ConversationData | null> {
    const response = await this.sendMessage('REQUEST_CURRENT_CONVERSATION');
    return response.data || null;
  }

  // 事件处理器

  private onConversationDetected(conversation: ConversationData) {
    console.log('New conversation detected:', conversation);

    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('conversationDetected', {
      detail: conversation
    }));
  }

  private onConversationUpdated(conversation: ConversationData) {
    console.log('Conversation updated:', conversation);

    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('conversationUpdated', {
      detail: conversation
    }));
  }

  private onSyncStatusUpdate(status: SyncStatus) {
    console.log('Sync status updated:', status);

    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('syncStatusUpdate', {
      detail: status
    }));
  }
}

// 创建单例实例
export const extensionCommunication = new ExtensionCommunication();

// 导出类型
export type { ConversationData, SyncStatus, ExtensionMessage };

// 导出React Hook
export const useExtensionCommunication = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  useEffect(() => {
    // 监听连接状态变化
    const handleConnectionChange = (message: ExtensionMessage) => {
      setIsConnected(message.type === 'EXTENSION_CONNECTED');
    };

    const handleSyncStatusUpdate = (message: ExtensionMessage) => {
      setSyncStatus(message.data);
    };

    extensionCommunication.onMessage('EXTENSION_CONNECTED', handleConnectionChange);
    extensionCommunication.onMessage('EXTENSION_DISCONNECTED', handleConnectionChange);
    extensionCommunication.onMessage('SYNC_STATUS_UPDATE', handleSyncStatusUpdate);

    // 初始状态检查
    setIsConnected(extensionCommunication.isConnected());

    return () => {
      extensionCommunication.offMessage('EXTENSION_CONNECTED', handleConnectionChange);
      extensionCommunication.offMessage('EXTENSION_DISCONNECTED', handleConnectionChange);
      extensionCommunication.offMessage('SYNC_STATUS_UPDATE', handleSyncStatusUpdate);
    };
  }, []);

  return {
    isConnected,
    syncStatus,
    sendMessage: extensionCommunication.sendMessage.bind(extensionCommunication),
    getConversations: extensionCommunication.getConversations.bind(extensionCommunication),
    triggerSync: extensionCommunication.triggerSync.bind(extensionCommunication),
    requestCurrentConversation: extensionCommunication.requestCurrentConversation.bind(extensionCommunication)
  };
};

// 导入React相关类型（仅在使用Hook时需要）
import { useState, useEffect } from 'react';