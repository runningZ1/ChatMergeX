// Yuanbao Content Script for ChatMergeX
// 腾讯元宝平台内容提取脚本

class YuanbaoContentScript extends BaseContentScript {
  constructor() {
    super('yuanbao');
  }

  getExtractionConfig(platform) {
    return {
      conversationSelector: '.dialogue-item, .chat-message, [class*="message"]',
      messageSelector: '.message-text, .content-text, [class*="content"]',
      timestampSelector: '.time, .timestamp, [class*="time"]',
      titleSelector: '.chat-title, h1, [class*="title"]',
      pollingInterval: 2500,
      debounceMs: 1200
    };
  }

  extractTitle() {
    const selectors = [
      '.chat-title',
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

    return '元宝对话';
  }

  detectMessageRole(element) {
    const className = element.className.toLowerCase();

    if (className.includes('user') || className.includes('human')) {
      return 'user';
    } else if (className.includes('assistant') || className.includes('ai')) {
      return 'assistant';
    }

    // 通过头像或位置判断
    const avatar = element.querySelector('.avatar, [class*="avatar"]');
    if (avatar) {
      const alt = avatar.alt || '';
      if (alt.includes('用户') || alt.includes('user')) {
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
      id: `yuanbao_msg_${index}`,
      content: contentElement.textContent.trim(),
      timestamp: timestampElement ? this.parseTimestamp(timestampElement.textContent) : null,
      role: role,
      metadata: {
        elementId: element.id || null,
        className: element.className,
        platform: 'yuanbao'
      }
    };
  }
}

// 初始化
if (typeof BaseContentScript !== 'undefined') {
  new YuanbaoContentScript();
} else {
  console.error('BaseContentScript not loaded for Yuanbao');
}