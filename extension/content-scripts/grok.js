// Grok Content Script for ChatMergeX
// X AI Grok平台内容提取脚本

class GrokContentScript extends BaseContentScript {
  constructor() {
    super('grok');
  }

  getExtractionConfig(platform) {
    return {
      conversationSelector: '.message, .conversation-item, .chat-message',
      messageSelector: '.message-content, .text-content',
      timestampSelector: '.timestamp, .time',
      titleSelector: '.conversation-title, h1',
      pollingInterval: 3000,
      debounceMs: 1500
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

    return 'Grok对话';
  }

  detectMessageRole(element) {
    const className = element.className.toLowerCase();

    if (className.includes('user') || className.includes('human')) {
      return 'user';
    } else if (className.includes('assistant') || className.includes('grok')) {
      return 'assistant';
    }

    // 通过头像或样式判断
    const avatar = element.querySelector('.avatar');
    if (avatar) {
      const alt = avatar.alt || '';
      if (alt.includes('user') || alt.includes('you')) {
        return 'user';
      }
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
      id: `grok_msg_${index}`,
      content: contentElement.textContent.trim(),
      timestamp: timestampElement ? this.parseTimestamp(timestampElement.textContent) : null,
      role: role,
      metadata: {
        elementId: element.id || null,
        className: element.className,
        platform: 'grok'
      }
    };
  }
}

// 初始化
if (typeof BaseContentScript !== 'undefined') {
  new GrokContentScript();
} else {
  console.error('BaseContentScript not loaded for Grok');
}