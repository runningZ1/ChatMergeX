// Doubao Content Script for ChatMergeX
// 专门用于字节跳动豆包平台的内容提取脚本

class DoubaoContentScript extends BaseContentScript {
  constructor() {
    super('doubao');
    this.conversationObserver = null;
    this.currentConversationId = null;
  }

  getExtractionConfig(platform) {
    return {
      conversationSelector: '.message-item, .chat-message, .conversation-item, [class*="message"]',
      messageSelector: '.message-content, .text-content, .chat-text, [class*="content"]',
      timestampSelector: '.time-stamp, .message-time, .timestamp, [class*="time"]',
      titleSelector: '.conversation-title, .chat-title, h1, [class*="title"]',
      userInputSelector: '.user-message, [class*="user"]',
      assistantInputSelector: '.bot-message, [class*="bot"], [class*="assistant"]',
      pollingInterval: 2000,
      debounceMs: 1000
    };
  }

  startDOMObserver() {
    super.startDOMObserver();

    // 豆包特定的DOM监听
    this.setupDoubaoObserver();
    this.setupSendButtonObserver();
  }

  setupDoubaoObserver() {
    // 监听豆包对话容器
    this.conversationObserver = new MutationObserver(() => {
      if (this.isExtracting) {
        this.debouncedExtraction();
      }
    });

    const conversationContainer = this.findDoubaoConversationContainer();
    if (conversationContainer) {
      this.conversationObserver.observe(conversationContainer, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  }

  setupSendButtonObserver() {
    // 监听豆包的发送按钮
    const sendButtonSelectors = [
      'button[class*="send"]',
      'button[aria-label*="发送"]',
      'button[aria-label*="Send"]',
      '.send-button',
      '[class*="submit-button"]'
    ];

    sendButtonSelectors.forEach(selector => {
      const button = document.querySelector(selector);
      if (button) {
        button.addEventListener('click', () => {
          setTimeout(() => {
            this.onNewMessageSent();
          }, 1500);
        });
      }
    });

    // 同时监听回车键发送
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        const activeElement = document.activeElement;
        if (activeElement && (
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.getAttribute('contenteditable') === 'true'
        )) {
          setTimeout(() => {
            this.onNewMessageSent();
          }, 1500);
        }
      }
    });
  }

  findDoubaoConversationContainer() {
    // 豆包的对话容器选择器
    const selectors = [
      '.chat-container',
      '.conversation-container',
      '.message-list',
      '.chat-messages',
      '[class*="conversation"]',
      '[class*="chat-messages"]',
      'main',
      '.main-content'
    ];

    for (const selector of selectors) {
      const container = document.querySelector(selector);
      if (container) {
        return container;
      }
    }

    return document.body;
  }

  extractTitle() {
    // 豆包特定的标题提取
    const selectors = [
      '.conversation-title',
      '.chat-title',
      '.session-title',
      'h1',
      '.title',
      '[class*="title"]',
      '.header-title'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return this.cleanDoubaoTitle(element.textContent.trim());
      }
    }

    // 从面包屑导航提取
    const breadcrumb = document.querySelector('.breadcrumb, .nav-path');
    if (breadcrumb) {
      const parts = breadcrumb.textContent.split('>');
      if (parts.length > 1) {
        return parts[parts.length - 1].trim();
      }
    }

    // 从URL提取
    const urlMatch = window.location.pathname.match(/\/chat\/([^\/]+)/);
    if (urlMatch) {
      return `Doubao Chat ${urlMatch[1]}`;
    }

    return '豆包对话';
  }

  extractMessages() {
    const messages = [];
    const messageElements = this.findAllDoubaoMessageElements();

    messageElements.forEach((element, index) => {
      const message = this.extractDoubaoMessage(element, index);
      if (message) {
        messages.push(message);
      }
    });

    return messages;
  }

  findAllDoubaoMessageElements() {
    // 豆包的消息元素选择器
    const selectors = [
      '.message-item',
      '.chat-message',
      '.conversation-message',
      '[class*="message-item"]',
      '[class*="chat-message"]',
      '.message-wrapper',
      '.msg-item'
    ];

    let elements = [];
    selectors.forEach(selector => {
      const found = document.querySelectorAll(selector);
      if (found.length > elements.length) {
        elements = Array.from(found);
      }
    });

    // 如果没有找到，尝试更通用的选择器
    if (elements.length === 0) {
      // 寻找包含用户头像和文本内容的元素
      const candidateElements = document.querySelectorAll('[class*="avatar"], [class*="avatar-wrapper"], .user-avatar, .bot-avatar');
      elements = Array.from(candidateElements).map(avatar => {
        return avatar.closest('[class*="message"], [class*="chat"], [class*="conversation"]') || avatar.parentElement;
      }).filter(Boolean);
    }

    // 过滤重复元素
    return this.filterUniqueElements(elements);
  }

  filterUniqueElements(elements) {
    const seenElements = new Set();
    const uniqueElements = [];

    elements.forEach(element => {
      if (!seenElements.has(element)) {
        seenElements.add(element);
        uniqueElements.push(element);
      }
    });

    return uniqueElements;
  }

  extractDoubaoMessage(element, index) {
    try {
      const role = this.detectDoubaoRole(element);
      if (!role) {
        return null;
      }

      const content = this.extractDoubaoContent(element);
      const timestamp = this.extractDoubaoTimestamp(element);
      const metadata = this.extractDoubaoMessageMetadata(element, role);

      if (!content || content.trim().length === 0) {
        return null;
      }

      return {
        id: this.generateDoubaoMessageId(element, index),
        role: role,
        content: content,
        timestamp: timestamp,
        metadata: metadata
      };
    } catch (error) {
      console.error('Error extracting Doubao message:', error);
      return null;
    }
  }

  detectDoubaoRole(element) {
    // 通过类名检测角色
    const className = element.className.toLowerCase();

    if (className.includes('user') ||
        className.includes('human') ||
        element.querySelector('.user-avatar, [class*="user-avatar"]')) {
      return 'user';
    }

    if (className.includes('bot') ||
        className.includes('assistant') ||
        className.includes('ai') ||
        element.querySelector('.bot-avatar, [class*="bot-avatar"], .ai-avatar, [class*="ai-avatar"]')) {
      return 'assistant';
    }

    // 通过头像检测
    const avatar = element.querySelector('.avatar, [class*="avatar"], img[alt*="头像"], img[alt*="avatar"]');
    if (avatar) {
      const alt = avatar.alt || avatar.getAttribute('aria-label') || '';
      if (alt.includes('用户') || alt.includes('user') || alt.includes('我')) {
        return 'user';
      }
      if (alt.includes('豆包') || alt.includes('bot') || alt.includes('AI') || alt.includes('助手')) {
        return 'assistant';
      }
    }

    // 通过文本位置检测
    const textContent = element.textContent.trim();
    const parentElement = element.parentElement;

    if (parentElement) {
      const siblings = Array.from(parentElement.children);
      const elementIndex = siblings.indexOf(element);

      // 豆包通常是用户-助手-用户-助手的交替模式
      if (elementIndex % 2 === 0) {
        return 'user';
      } else {
        return 'assistant';
      }
    }

    return null;
  }

  extractDoubaoContent(element) {
    const contentSelectors = [
      '.message-content',
      '.text-content',
      '.chat-text',
      '.msg-text',
      '[class*="content"]',
      '.markdown-body',
      '.prose'
    ];

    for (const selector of contentSelectors) {
      const contentElement = element.querySelector(selector) ||
                           (element.matches(selector) ? element : null);

      if (contentElement) {
        return this.cleanDoubaoContent(contentElement);
      }
    }

    // 尝试找到文本内容最丰富的子元素
    const textElements = element.querySelectorAll('div, p, span');
    let richestTextElement = null;
    let maxLength = 0;

    textElements.forEach(el => {
      const text = el.textContent.trim();
      if (text.length > maxLength) {
        maxLength = text.length;
        richestTextElement = el;
      }
    });

    if (richestTextElement) {
      return this.cleanDoubaoContent(richestTextElement);
    }

    // 最后回退到整个元素
    return this.cleanDoubaoContent(element);
  }

  cleanDoubaoContent(element) {
    if (!element) return '';

    const clonedElement = element.cloneNode(true);

    // 移除豆包特有的UI元素
    const elementsToRemove = clonedElement.querySelectorAll(
      '.copy-button, .share-button, .like-button, .dislike-button, ' +
      '.action-button, .toolbar, [class*="button"], ' +
      '[aria-label*="复制"], [aria-label*="分享"], [aria-label*="点赞"]'
    );
    elementsToRemove.forEach(el => el.remove());

    let text = clonedElement.textContent || clonedElement.innerText || '';

    // 处理代码块
    const codeBlocks = clonedElement.querySelectorAll('pre code, .code-block');
    codeBlocks.forEach(block => {
      const codeText = block.textContent.trim();
      if (codeText) {
        text = text.replace(block.textContent, `\n\`\`\`\n${codeText}\n\`\`\`\n`);
      }
    });

    // 清理文本
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  extractDoubaoTimestamp(element) {
    // 豆包时间戳提取
    const timestampSelectors = [
      '.time-stamp',
      '.message-time',
      '.timestamp',
      '[class*="time"]',
      'time',
      '.msg-time'
    ];

    for (const selector of timestampSelectors) {
      const timeElement = element.querySelector(selector);
      if (timeElement) {
        const datetime = timeElement.getAttribute('datetime');
        if (datetime) {
          return datetime;
        }

        const timeText = timeElement.textContent.trim();
        return this.parseDoubaoTime(timeText);
      }
    }

    return null;
  }

  parseDoubaoTime(timeText) {
    try {
      const now = new Date();

      if (timeText.includes('刚刚') || timeText.includes('now')) {
        return now.toISOString();
      }

      if (timeText.includes('分钟前')) {
        const minutes = parseInt(timeText) || 1;
        return new Date(now - minutes * 60 * 1000).toISOString();
      }

      if (timeText.includes('小时前')) {
        const hours = parseInt(timeText) || 1;
        return new Date(now - hours * 60 * 60 * 1000).toISOString();
      }

      if (timeText.includes('昨天')) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString();
      }

      // 尝试直接解析
      const parsed = new Date(timeText);
      return isNaN(parsed.getTime()) ? null : parsed.toISOString();
    } catch (error) {
      return null;
    }
  }

  extractDoubaoMessageMetadata(element, role) {
    return {
      platform: 'doubao',
      role: role,
      elementId: element.id || null,
      className: element.className,
      hasCode: !!element.querySelector('pre, code, .code-block'),
      hasLinks: !!element.querySelector('a'),
      hasImages: !!element.querySelector('img'),
      messageId: element.getAttribute('data-message-id') || null,
      conversationId: this.getCurrentDoubaoConversationId(),
      model: this.detectDoubaoModel(element)
    };
  }

  getCurrentDoubaoConversationId() {
    // 从URL提取豆包对话ID
    const urlMatch = window.location.pathname.match(/\/chat\/([^\/]+)/);
    if (urlMatch) {
      return urlMatch[1];
    }

    // 从数据属性查找
    const conversationElement = document.querySelector('[data-conversation-id], [data-session-id]');
    if (conversationElement) {
      return conversationElement.getAttribute('data-conversation-id') ||
             conversationElement.getAttribute('data-session-id');
    }

    return null;
  }

  detectDoubaoModel(element) {
    // 检测豆包使用的模型
    const modelSelectors = [
      '.model-info',
      '.ai-model',
      '[data-model]',
      '[class*="model"]'
    ];

    for (const selector of modelSelectors) {
      const modelElement = element.querySelector(selector) ||
                         document.querySelector(selector);
      if (modelElement) {
        const modelText = modelElement.textContent ||
                        modelElement.getAttribute('data-model');
        if (modelText) {
          return modelText.trim();
        }
      }
    }

    // 检测页面标题或meta信息
    const title = document.title.toLowerCase();
    if (title.includes('doubao') || title.includes('豆包')) {
      return 'Doubao';
    }

    return 'Doubao AI';
  }

  generateDoubaoMessageId(element, index) {
    const elementId = element.getAttribute('data-message-id') ||
                     element.id ||
                     `doubao_msg_${index}`;
    return `${elementId}_${Date.now()}`;
  }

  cleanDoubaoTitle(title) {
    if (!title) return '';

    return title
      .replace(/^豆包\s*/i, '')
      .replace(/^新对话\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  onNewMessageSent() {
    console.log('New message detected in Doubao');
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
        // 添加豆包特定的元数据
        conversation.metadata = {
          ...conversation.metadata,
          conversationId: this.getCurrentDoubaoConversationId(),
          model: this.detectDoubaoModel(document.body),
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
      console.error('Error extracting Doubao conversation:', error);
      return null;
    }
  }
}

// 初始化豆包content script
if (typeof BaseContentScript !== 'undefined') {
  new DoubaoContentScript();
} else {
  console.error('BaseContentScript not loaded for Doubao');
}