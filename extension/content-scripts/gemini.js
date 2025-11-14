// Gemini Content Script for ChatMergeX
// Google Gemini平台内容提取脚本

class GeminiContentScript extends BaseContentScript {
  constructor() {
    super('gemini');
  }

  getExtractionConfig(platform) {
    return {
      conversationSelector: '.response-container, .conversation-turn, .message-wrapper',
      messageSelector: '.response-text, .message-content, .markdown',
      timestampSelector: '.timestamp, .time-info, time',
      titleSelector: '.conversation-title, h1',
      pollingInterval: 2000,
      debounceMs: 1000
    };
  }

  extractTitle() {
    const selectors = [
      '.conversation-title',
      'h1',
      '.title'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }

    return 'Gemini对话';
  }

  detectMessageRole(element) {
    const className = element.className.toLowerCase();

    if (className.includes('user') || className.includes('human')) {
      return 'user';
    } else if (className.includes('model') || className.includes('assistant')) {
      return 'assistant';
    }

    // 通过data属性检测
    const role = element.getAttribute('data-message-role');
    if (role) {
      return role;
    }

    return null;
  }

  extractMessageFromElement(element, index) {
    const role = this.detectMessageRole(element);
    if (!role) return null;

    const contentElement = element.querySelector(this.extractionConfig.messageSelector);
    if (!contentElement) return null;

    const timestampElement = element.querySelector(this.extractionConfig.timestampSelector);

    return {
      id: `gemini_msg_${index}`,
      content: contentElement.textContent.trim(),
      timestamp: timestampElement ? this.parseTimestamp(timestampElement.textContent) : null,
      role: role,
      metadata: {
        elementId: element.id || null,
        className: element.className,
        platform: 'gemini'
      }
    };
  }
}

// 初始化
if (typeof BaseContentScript !== 'undefined') {
  new GeminiContentScript();
} else {
  console.error('BaseContentScript not loaded for Gemini');
}