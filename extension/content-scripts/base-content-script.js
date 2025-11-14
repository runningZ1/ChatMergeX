// ChatMergeX Base Content Script
// 为所有平台提供通用功能的基类

class BaseContentScript {
  constructor(platform) {
    this.platform = platform;
    this.isExtracting = false;
    this.observer = null;
    this.currentConversation = null;
    this.extractionConfig = this.getExtractionConfig(platform);

    this.init();
  }

  init() {
    console.log(`ChatMergeX content script initialized for ${this.platform}`);

    // 监听来自background的消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });

    // 监听来自Web应用的消息
    window.addEventListener('message', (event) => {
      this.handleWebAppMessage(event);
    });

    // 开始DOM监听
    this.startDOMObserver();

    // 通知background script页面已加载
    this.notifyBackground('PAGE_LOADED', {
      platform: this.platform,
      url: window.location.href,
      title: document.title
    });
  }

  getExtractionConfig(platform) {
    const configs = {
      chatgpt: {
        conversationSelector: '[data-testid="conversation-turn"]',
        messageSelector: '.text-message',
        timestampSelector: '[data-testid="message-time"]',
        titleSelector: 'h1, [data-testid="conversation-title"]',
        pollingInterval: 2000,
        debounceMs: 1000
      },
      doubao: {
        conversationSelector: '.conversation-item, .message-item',
        messageSelector: '.message-content, .text-content',
        timestampSelector: '.time-stamp, .message-time',
        titleSelector: '.conversation-title, h1',
        pollingInterval: 3000,
        debounceMs: 1500
      },
      yuanbao: {
        conversationSelector: '.chat-message, .dialogue-item',
        messageSelector: '.message-text, .content-text',
        timestampSelector: '.time, .timestamp',
        titleSelector: '.chat-title, h1',
        pollingInterval: 2500,
        debounceMs: 1200
      },
      gemini: {
        conversationSelector: '.response-container, .conversation-turn',
        messageSelector: '.response-text, .message-content',
        timestampSelector: '.timestamp, .time-info',
        titleSelector: '.conversation-title, h1',
        pollingInterval: 2000,
        debounceMs: 1000
      },
      grok: {
        conversationSelector: '.message, .conversation-item',
        messageSelector: '.message-content, .text-content',
        timestampSelector: '.timestamp, .time',
        titleSelector: '.conversation-title, h1',
        pollingInterval: 3000,
        debounceMs: 1500
      }
    };

    return configs[platform] || configs.chatgpt;
  }

  handleMessage(message, sender, sendResponse) {
    try {
      const { type, data } = message;

      switch (type) {
        case 'EXTRACT_CONVERSATION':
          this.extractConversation().then(conversation => {
            sendResponse({ success: true, data: conversation });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
          break;

        case 'GET_CURRENT_CONVERSATION':
          this.getCurrentConversation().then(conversation => {
            sendResponse({ success: true, data: conversation });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
          break;

        case 'START_EXTRACTION':
          this.startExtraction();
          sendResponse({ success: true });
          break;

        case 'STOP_EXTRACTION':
          this.stopExtraction();
          sendResponse({ success: true });
          break;

        case 'GET_PLATFORM_INFO':
          sendResponse({
            success: true,
            data: {
              platform: this.platform,
              url: window.location.href,
              title: document.title,
              extractionActive: this.isExtracting
            }
          });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  handleWebAppMessage(event) {
    // 验证消息来源
    if (!this.isTrustedOrigin(event.origin)) {
      return;
    }

    try {
      const { type, data } = event.data;

      switch (type) {
        case 'REQUEST_CONVERSATION_DATA':
          this.extractConversation().then(conversation => {
            event.source.postMessage({
              type: 'CONVERSATION_DATA_RESPONSE',
              data: conversation
            }, event.origin);
          });
          break;

        case 'TOGGLE_EXTRACTION':
          if (this.isExtracting) {
            this.stopExtraction();
          } else {
            this.startExtraction();
          }
          break;

        default:
          console.log('Unknown web app message type:', type);
      }
    } catch (error) {
      console.error('Error handling web app message:', error);
    }
  }

  startDOMObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new MutationObserver((mutations) => {
      this.handleDOMChanges(mutations);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: true
    });
  }

  handleDOMChanges(mutations) {
    if (!this.isExtracting) {
      return;
    }

    // 使用防抖机制避免过度处理
    clearTimeout(this.changeTimeout);
    this.changeTimeout = setTimeout(() => {
      this.processDOMChanges(mutations);
    }, this.extractionConfig.debounceMs);
  }

  processDOMChanges(mutations) {
    let hasSignificantChanges = false;

    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        hasSignificantChanges = true;
      } else if (mutation.type === 'characterData') {
        hasSignificantChanges = true;
      }
    });

    if (hasSignificantChanges) {
      this.onConversationUpdated();
    }
  }

  startExtraction() {
    if (this.isExtracting) {
      return;
    }

    this.isExtracting = true;
    console.log(`Started conversation extraction for ${this.platform}`);

    // 立即提取一次当前对话
    this.extractConversation().then(conversation => {
      if (conversation) {
        this.onConversationDetected(conversation);
      }
    });

    this.notifyBackground('EXTRACTION_STARTED', {
      platform: this.platform,
      url: window.location.href
    });
  }

  stopExtraction() {
    if (!this.isExtracting) {
      return;
    }

    this.isExtracting = false;
    console.log(`Stopped conversation extraction for ${this.platform}`);

    this.notifyBackground('EXTRACTION_STOPPED', {
      platform: this.platform,
      url: window.location.href
    });
  }

  async extractConversation() {
    try {
      const title = this.extractTitle();
      const messages = this.extractMessages();
      const metadata = this.extractMetadata();

      if (!title && messages.length === 0) {
        return null;
      }

      const conversation = {
        id: this.generateConversationId(title, messages),
        title: title || 'Untitled Conversation',
        platform: this.platform,
        url: window.location.href,
        messages: messages,
        metadata: {
          ...metadata,
          extractedAt: new Date().toISOString(),
          messageCount: messages.length,
          platform: this.platform
        },
        timestamp: Date.now()
      };

      this.currentConversation = conversation;
      return conversation;

    } catch (error) {
      console.error('Error extracting conversation:', error);
      return null;
    }
  }

  extractTitle() {
    // 子类应该重写此方法
    const titleElement = document.querySelector(this.extractionConfig.titleSelector);
    return titleElement ? titleElement.textContent.trim() : null;
  }

  extractMessages() {
    // 子类应该重写此方法
    const messageElements = document.querySelectorAll(this.extractionConfig.conversationSelector);
    const messages = [];

    messageElements.forEach((element, index) => {
      const message = this.extractMessageFromElement(element, index);
      if (message) {
        messages.push(message);
      }
    });

    return messages;
  }

  extractMessageFromElement(element, index) {
    // 基础消息提取，子类应该重写
    const content = element.querySelector(this.extractionConfig.messageSelector);
    const timestamp = element.querySelector(this.extractionConfig.timestampSelector);

    if (!content) {
      return null;
    }

    return {
      id: `msg_${index}`,
      content: content.textContent.trim(),
      timestamp: timestamp ? this.parseTimestamp(timestamp.textContent) : null,
      role: this.detectMessageRole(element),
      metadata: {
        elementId: element.id || null,
        className: element.className,
        platform: this.platform
      }
    };
  }

  detectMessageRole(element) {
    // 简单的角色检测，子类应该重写
    const text = element.textContent.toLowerCase();
    if (element.classList.contains('user') || element.classList.contains('human')) {
      return 'user';
    } else if (element.classList.contains('assistant') || element.classList.contains('ai') || element.classList.contains('bot')) {
      return 'assistant';
    }
    return 'unknown';
  }

  extractMetadata() {
    return {
      url: window.location.href,
      title: document.title,
      platform: this.platform,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
  }

  parseTimestamp(timestampText) {
    try {
      // 尝试解析时间戳
      const date = new Date(timestampText);
      return isNaN(date.getTime()) ? null : date.toISOString();
    } catch (error) {
      return null;
    }
  }

  async getCurrentConversation() {
    return this.currentConversation || await this.extractConversation();
  }

  onConversationDetected(conversation) {
    console.log(`New conversation detected on ${this.platform}:`, conversation);
    this.notifyBackground('CONVERSATION_DETECTED', conversation);
    this.notifyWebApp('CONVERSATION_DETECTED', conversation);
  }

  onConversationUpdated() {
    console.log(`Conversation updated on ${this.platform}`);
    this.extractConversation().then(conversation => {
      if (conversation) {
        this.currentConversation = conversation;
        this.notifyBackground('CONVERSATION_UPDATED', conversation);
        this.notifyWebApp('CONVERSATION_UPDATED', conversation);
      }
    });
  }

  notifyBackground(type, data) {
    try {
      chrome.runtime.sendMessage({
        type,
        data: {
          ...data,
          platform: this.platform,
          url: window.location.href,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      console.error('Failed to notify background:', error);
    }
  }

  notifyWebApp(type, data) {
    try {
      // 向Web应用发送消息
      window.postMessage({
        type,
        data: {
          ...data,
          platform: this.platform,
          source: 'extension'
        }
      }, 'http://localhost:3000');
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

  generateConversationId(title, messages) {
    const timestamp = Date.now();
    const titleHash = title ? this.simpleHash(title) : 'untitled';
    const messageCount = messages.length;
    return `${this.platform}_${titleHash}_${timestamp}_${messageCount}`;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // 工具方法
  waitForElement(selector, timeout = 5000) {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// 导出基类供平台特定的content script使用
window.BaseContentScript = BaseContentScript;