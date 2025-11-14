// ChatGPT Content Script for ChatMergeX
// 专门用于ChatGPT平台的内容提取脚本

class ChatGPTContentScript extends BaseContentScript {
  constructor() {
    super('chatgpt');
    this.conversationObserver = null;
    this.currentConversationId = null;
  }

  getExtractionConfig(platform) {
    return {
      conversationSelector: '[data-message-author-role], [data-testid="conversation-turn-1"], [data-testid="conversation-turn-2"], .text-message',
      messageSelector: '.markdown, .whitespace-pre-wrap, [data-message-author-role]',
      timestampSelector: 'time, .text-xs, .text-gray-500',
      titleSelector: 'h1, [data-testid="conversation-title"], .text-lg',
      userInputSelector: '[data-message-author-role="user"]',
      assistantInputSelector: '[data-message-author-role="assistant"]',
      pollingInterval: 1500,
      debounceMs: 800
    };
  }

  startDOMObserver() {
    super.startDOMObserver();

    // ChatGPT特定的DOM监听
    this.setupChatGPTObserver();
    this.setupButtonObserver();
  }

  setupChatGPTObserver() {
    // 监听对话内容变化
    this.conversationObserver = new MutationObserver(() => {
      if (this.isExtracting) {
        this.debouncedExtraction();
      }
    });

    // 寻找对话容器
    const conversationContainer = this.findConversationContainer();
    if (conversationContainer) {
      this.conversationObserver.observe(conversationContainer, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  }

  setupButtonObserver() {
    // 监听发送按钮点击，表示新消息
    const sendButton = document.querySelector('button[data-testid="send-button"]') ||
                     document.querySelector('button[aria-label*="Send"]');

    if (sendButton) {
      sendButton.addEventListener('click', () => {
        setTimeout(() => {
          this.onNewMessageSent();
        }, 1000);
      });
    }
  }

  findConversationContainer() {
    // ChatGPT的对话容器选择器
    const selectors = [
      '[data-testid="conversation-turn"]',
      '.flex-1.overflow-hidden',
      '.conversation-content',
      '[data-testid="conversation-container"]',
      '.w-full.h-full.overflow-hidden'
    ];

    for (const selector of selectors) {
      const container = document.querySelector(selector);
      if (container) {
        return container.parentElement || container;
      }
    }

    // 回退到主内容区域
    return document.querySelector('main') || document.body;
  }

  extractTitle() {
    // ChatGPT特定的标题提取
    const selectors = [
      '[data-testid="conversation-title"]',
      'h1',
      '.text-xl.font-semibold',
      '.conversation-title',
      '[class*="conversation-title"]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return this.cleanTitle(element.textContent.trim());
      }
    }

    // 从URL中提取标题（如果有的话）
    const urlMatch = window.location.pathname.match(/\/c\/([^\/]+)/);
    if (urlMatch) {
      return `ChatGPT Conversation ${urlMatch[1]}`;
    }

    return 'New Chat';
  }

  extractMessages() {
    const messages = [];
    const messageElements = this.findAllMessageElements();

    messageElements.forEach((element, index) => {
      const message = this.extractChatGPTMessage(element, index);
      if (message) {
        messages.push(message);
      }
    });

    return messages;
  }

  findAllMessageElements() {
    // ChatGPT的消息元素选择器
    const selectors = [
      '[data-message-author-role]',
      '[data-testid^="conversation-turn"]',
      '.group.w-full',
      '.text-message',
      '.message-content'
    ];

    let elements = [];
    selectors.forEach(selector => {
      const found = document.querySelectorAll(selector);
      if (found.length > 0) {
        elements = Array.from(found);
        return;
      }
    });

    // 过滤掉重复的元素
    const uniqueElements = [];
    const seenElements = new Set();

    elements.forEach(element => {
      if (!seenElements.has(element)) {
        seenElements.add(element);
        uniqueElements.push(element);
      }
    });

    return uniqueElements;
  }

  extractChatGPTMessage(element, index) {
    try {
      const role = this.detectChatGPTRole(element);
      if (!role) {
        return null;
      }

      const content = this.extractChatGPTContent(element);
      const timestamp = this.extractChatGTPTimestamp(element);
      const metadata = this.extractChatGPTMessageMetadata(element, role);

      if (!content || content.trim().length === 0) {
        return null;
      }

      return {
        id: this.generateMessageId(element, index),
        role: role,
        content: content,
        timestamp: timestamp,
        metadata: metadata
      };
    } catch (error) {
      console.error('Error extracting ChatGPT message:', error);
      return null;
    }
  }

  detectChatGPTRole(element) {
    // 使用data属性检测角色
    const role = element.getAttribute('data-message-author-role');
    if (role) {
      return role; // 'user' 或 'assistant'
    }

    // 使用文本特征检测
    const text = element.textContent.toLowerCase();
    const className = element.className.toLowerCase();

    // 用户消息特征
    if (className.includes('user') ||
        element.querySelector('[data-message-author-role="user"]') ||
        text.includes('you:') ||
        element.classList.contains('bg-gray-100')) {
      return 'user';
    }

    // 助手消息特征
    if (className.includes('assistant') ||
        element.querySelector('[data-message-author-role="assistant"]') ||
        text.includes('chatgpt:') ||
        element.classList.contains('bg-gray-50')) {
      return 'assistant';
    }

    // 通过父元素检测
    const parent = element.closest('[data-message-author-role]');
    if (parent) {
      return parent.getAttribute('data-message-author-role');
    }

    return null;
  }

  extractChatGPTContent(element) {
    const contentSelectors = [
      '.markdown',
      '.whitespace-pre-wrap',
      '.prose',
      '[data-message-author-role] > div > div',
      '.message-content',
      '.text-gray-800',
      '.dark\\:text-gray-100'
    ];

    for (const selector of contentSelectors) {
      const contentElement = element.querySelector(selector) ||
                           (element.matches(selector) ? element : null);

      if (contentElement) {
        return this.cleanContent(contentElement);
      }
    }

    // 回退：直接获取文本内容
    return this.cleanContent(element);
  }

  cleanContent(element) {
    if (!element) return '';

    // 克隆元素以避免修改原始DOM
    const clonedElement = element.cloneNode(true);

    // 移除不需要的元素
    const elementsToRemove = clonedElement.querySelectorAll(
      'button, .copy-button, .feedback-button, .action-button, [aria-label*="Copy"], [aria-label*="Share"]'
    );
    elementsToRemove.forEach(el => el.remove());

    // 获取清理后的文本
    let text = clonedElement.textContent || clonedElement.innerText || '';

    // 清理文本
    text = text
      .replace(/\s+/g, ' ') // 合并多个空白字符
      .replace(/\n\s*\n/g, '\n') // 移除空行
      .trim();

    return text;
  }

  extractChatGTPTimestamp(element) {
    // ChatGPT时间戳提取
    const timestampSelectors = [
      'time',
      '.text-xs',
      '.text-gray-500',
      '.timestamp',
      '[data-timestamp]'
    ];

    for (const selector of timestampSelectors) {
      const timeElement = element.querySelector(selector);
      if (timeElement) {
        const datetime = timeElement.getAttribute('datetime');
        if (datetime) {
          return datetime;
        }

        const timeText = timeElement.textContent.trim();
        return this.parseChatGPTTime(timeText);
      }
    }

    return null;
  }

  parseChatGPTTime(timeText) {
    try {
      // ChatGPT时间格式解析
      const now = new Date();

      if (timeText.toLowerCase().includes('now') || timeText === 'Just now') {
        return now.toISOString();
      }

      if (timeText.includes('minutes ago')) {
        const minutes = parseInt(timeText) || 1;
        return new Date(now - minutes * 60 * 1000).toISOString();
      }

      if (timeText.includes('hours ago')) {
        const hours = parseInt(timeText) || 1;
        return new Date(now - hours * 60 * 60 * 1000).toISOString();
      }

      if (timeText.includes('yesterday')) {
        return new Date(now - 24 * 60 * 60 * 1000).toISOString();
      }

      // 尝试直接解析
      const parsed = new Date(timeText);
      return isNaN(parsed.getTime()) ? null : parsed.toISOString();
    } catch (error) {
      return null;
    }
  }

  extractChatGPTMessageMetadata(element, role) {
    return {
      platform: 'chatgpt',
      role: role,
      elementId: element.id || null,
      className: element.className,
      hasCode: !!element.querySelector('pre, code'),
      hasLinks: !!element.querySelector('a'),
      hasImages: !!element.querySelector('img'),
      messageId: element.getAttribute('data-message-id') || null,
      conversationId: this.getCurrentConversationId(),
      model: this.detectModel(element)
    };
  }

  getCurrentConversationId() {
    // 从URL或DOM中提取对话ID
    const urlMatch = window.location.pathname.match(/\/c\/([^\/]+)/);
    if (urlMatch) {
      return urlMatch[1];
    }

    // 从数据属性中查找
    const conversationElement = document.querySelector('[data-conversation-id]');
    if (conversationElement) {
      return conversationElement.getAttribute('data-conversation-id');
    }

    return null;
  }

  detectModel(element) {
    // 检测使用的AI模型
    const modelSelectors = [
      '[data-model-id]',
      '.model-info',
      '.gpt-model',
      '[class*="gpt-4"]',
      '[class*="gpt-3"]'
    ];

    for (const selector of modelSelectors) {
      const modelElement = element.querySelector(selector) ||
                         document.querySelector(selector);
      if (modelElement) {
        const modelText = modelElement.textContent ||
                        modelElement.getAttribute('data-model-id');
        if (modelText) {
          return modelText.trim();
        }
      }
    }

    // 从页面标题检测
    const title = document.title.toLowerCase();
    if (title.includes('gpt-4')) return 'GPT-4';
    if (title.includes('gpt-3')) return 'GPT-3';

    return 'Unknown';
  }

  generateMessageId(element, index) {
    // 生成唯一的消息ID
    const elementId = element.getAttribute('data-message-id') ||
                     element.id ||
                     `chatgpt_msg_${index}`;
    return `${elementId}_${Date.now()}`;
  }

  cleanTitle(title) {
    if (!title) return '';

    // 清理标题文本
    return title
      .replace(/^Chat\s*\w*[-_]?\s*/i, '') // 移除前缀
      .replace(/\s+/g, ' ') // 合并空白
      .trim();
  }

  onNewMessageSent() {
    console.log('New message detected in ChatGPT');
    setTimeout(() => {
      this.extractConversation().then(conversation => {
        if (conversation) {
          this.onConversationUpdated();
        }
      });
    }, 2000);
  }

  debouncedExtraction() {
    if (this.extractionTimeout) {
      clearTimeout(this.extractionTimeout);
    }

    this.extractionTimeout = setTimeout(() => {
      this.extractConversation().then(conversation => {
        if (conversation) {
          this.onConversationUpdated();
        }
      });
    }, this.extractionConfig.debounceMs);
  }

  // 覆盖基类方法
  async extractConversation() {
    try {
      const conversation = await super.extractConversation();

      if (conversation) {
        // 添加ChatGPT特定的元数据
        conversation.metadata = {
          ...conversation.metadata,
          conversationId: this.getCurrentConversationId(),
          model: this.detectModel(document.body),
          url: window.location.href,
          platformSpecific: {
            hasCodeBlocks: conversation.messages.some(msg => msg.metadata.hasCode),
            hasLinks: conversation.messages.some(msg => msg.metadata.hasLinks),
            hasImages: conversation.messages.some(msg => msg.metadata.hasImages)
          }
        };
      }

      return conversation;
    } catch (error) {
      console.error('Error extracting ChatGPT conversation:', error);
      return null;
    }
  }
}

// 初始化ChatGPT content script
if (typeof BaseContentScript !== 'undefined') {
  new ChatGPTContentScript();
} else {
  console.error('BaseContentScript not loaded for ChatGPT');
}