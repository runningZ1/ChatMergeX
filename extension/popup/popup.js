// ChatMergeX Popup Script
// 扩展弹出窗口的交互逻辑

class ChatMergeXP popup {
  constructor() {
    this.platforms = ['chatgpt', 'doubao', 'yuanbao', 'gemini', 'grok'];
    this.init();
  }

  async init() {
    console.log('ChatMergeX popup initialized');

    // 绑定事件监听器
    this.bindEventListeners();

    // 初始化UI
    await this.initializeUI();

    // 加载数据
    await this.loadData();

    // 定期更新状态
    this.startStatusUpdates();
  }

  bindEventListeners() {
    // 立即同步按钮
    document.getElementById('syncNowBtn').addEventListener('click', () => {
      this.syncNow();
    });

    // 打开Web应用按钮
    document.getElementById('openWebAppBtn').addEventListener('click', () => {
      this.openWebApp();
    });

    // 设置按钮
    document.getElementById('settingsBtn').addEventListener('click', () => {
      this.openSettings();
    });

    // 平台卡片点击
    document.querySelectorAll('.platform-card').forEach(card => {
      card.addEventListener('click', () => {
        const platform = card.dataset.platform;
        this.openPlatform(platform);
      });
    });

    // 页脚链接
    document.getElementById('helpLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.openHelp();
    });

    document.getElementById('feedbackLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.openFeedback();
    });

    document.getElementById('versionLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.showVersionInfo();
    });

    // 状态指示器点击
    document.getElementById('status').addEventListener('click', () => {
      this.toggleConnectionStatus();
    });
  }

  async initializeUI() {
    // 设置初始状态
    this.updateConnectionStatus(false);
    this.hideLoading();
  }

  async loadData() {
    try {
      // 获取同步状态
      const syncStatus = await this.getSyncStatus();
      this.updateSyncStatus(syncStatus);

      // 获取统计数据
      const stats = await this.getStats();
      this.updateStats(stats);

      // 检查当前标签页的平台
      await this.checkCurrentPlatform();

    } catch (error) {
      console.error('Failed to load data:', error);
      this.showNotification('加载数据失败', 'error');
    }
  }

  async getSyncStatus() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_SYNC_STATUS' }, (response) => {
        resolve(response.data || {
          enabled: false,
          lastSync: null,
          queueLength: 0,
          platforms: []
        });
      });
    });
  }

  async getStats() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_STATS' }, (response) => {
        resolve(response.data || {
          totalConversations: 0,
          syncQueue: 0,
          platforms: {}
        });
      });
    });
  }

  async checkCurrentPlatform() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url) return;

      const platform = this.detectPlatformFromUrl(tab.url);
      if (platform) {
        this.updatePlatformStatus(platform, 'active');

        // 获取平台信息
        const platformInfo = await this.getPlatformInfo(tab.id);
        this.updatePlatformInfo(platform, platformInfo);
      }
    } catch (error) {
      console.error('Failed to check current platform:', error);
    }
  }

  detectPlatformFromUrl(url) {
    const platformMap = {
      'chat.openai.com': 'chatgpt',
      'chatgpt.com': 'chatgpt',
      'doubao.com': 'doubao',
      'www.doubao.com': 'doubao',
      'yuanbao.tencent.com': 'yuanbao',
      'gemini.google.com': 'gemini',
      'grok.x.ai': 'grok'
    };

    for (const [domain, platform] of Object.entries(platformMap)) {
      if (url.includes(domain)) {
        return platform;
      }
    }

    return null;
  }

  async getPlatformInfo(tabId) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { type: 'GET_PLATFORM_INFO' }, (response) => {
        resolve(response.data || {
          platform: 'unknown',
          extractionActive: false,
          url: '',
          title: ''
        });
      });
    });
  }

  updateConnectionStatus(connected) {
    const statusEl = document.getElementById('status');
    if (connected) {
      statusEl.classList.remove('inactive');
      statusEl.title = '已连接到Web应用';
    } else {
      statusEl.classList.add('inactive');
      statusEl.title = '未连接到Web应用';
    }
  }

  updateSyncStatus(status) {
    const syncDot = document.getElementById('syncDot');
    const syncStatus = document.getElementById('syncStatus');

    if (status.queueLength > 0) {
      syncDot.classList.add('syncing');
      syncStatus.textContent = `同步中 (${status.queueLength} 项)`;
    } else if (status.enabled) {
      syncDot.classList.remove('syncing');
      syncStatus.textContent = status.lastSync
        ? `最后同步: ${this.formatTime(status.lastSync)}`
        : '已启用同步';
    } else {
      syncDot.classList.remove('syncing');
      syncStatus.textContent = '同步已禁用';
    }
  }

  updateStats(stats) {
    document.getElementById('totalConversations').textContent = stats.totalConversations || 0;
    document.getElementById('syncQueue').textContent = stats.syncQueue || 0;
  }

  updatePlatformStatus(platform, status) {
    const card = document.querySelector(`.platform-card[data-platform="${platform}"]`);
    if (!card) return;

    const statusText = card.querySelector('.platform-status-text');

    if (status === 'active') {
      card.classList.add('active');
      statusText.textContent = '检测到';
    } else {
      card.classList.remove('active');
      statusText.textContent = '未检测到';
    }
  }

  updatePlatformInfo(platform, info) {
    const card = document.querySelector(`.platform-card[data-platform="${platform}"]`);
    if (!card || !info) return;

    const statusText = card.querySelector('.platform-status-text');

    if (info.extractionActive) {
      statusText.textContent = '正在提取';
      card.classList.add('active');
    } else if (info.supported) {
      statusText.textContent = '已就绪';
      card.classList.add('active');
    }
  }

  async syncNow() {
    const btn = document.getElementById('syncNowBtn');
    const originalText = btn.innerHTML;

    try {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> 同步中...';

      const response = await this.sendMessage('TRIGGER_SYNC', { force: true });

      if (response.success) {
        this.showNotification('同步已启动');
        this.updateSyncStatus({
          enabled: true,
          queueLength: 1,
          lastSync: null
        });
      } else {
        this.showNotification('同步启动失败', 'error');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      this.showNotification('同步失败', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

  async openWebApp() {
    try {
      await chrome.tabs.create({
        url: 'http://localhost:3000'
      });
      window.close();
    } catch (error) {
      console.error('Failed to open web app:', error);
      this.showNotification('无法打开Web应用', 'error');
    }
  }

  async openSettings() {
    try {
      await chrome.tabs.create({
        url: 'http://localhost:3000/settings'
      });
      window.close();
    } catch (error) {
      console.error('Failed to open settings:', error);
      this.showNotification('无法打开设置', 'error');
    }
  }

  openPlatform(platform) {
    const platformUrls = {
      chatgpt: 'https://chat.openai.com',
      doubao: 'https://www.doubao.com',
      yuanbao: 'https://yuanbao.tencent.com',
      gemini: 'https://gemini.google.com',
      grok: 'https://grok.x.ai'
    };

    const url = platformUrls[platform];
    if (url) {
      chrome.tabs.create({ url });
      window.close();
    }
  }

  openHelp() {
    chrome.tabs.create({
      url: 'https://github.com/runningZ1/ChatMergeX#readme'
    });
  }

  openFeedback() {
    chrome.tabs.create({
      url: 'https://github.com/runningZ1/ChatMergeX/issues'
    });
  }

  showVersionInfo() {
    this.showNotification('ChatMergeX Extension v1.0.0');
  }

  async toggleConnectionStatus() {
    // 实现连接状态切换逻辑
    const statusEl = document.getElementById('status');
    const isCurrentlyConnected = !statusEl.classList.contains('inactive');

    this.updateConnectionStatus(!isCurrentlyConnected);

    const message = isCurrentlyConnected ? '已断开连接' : '已连接';
    this.showNotification(message);
  }

  showLoading() {
    document.getElementById('loading').style.display = 'block';
  }

  hideLoading() {
    document.getElementById('loading').style.display = 'none';
  }

  showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');

    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');

    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }

  sendMessage(type, data = {}) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type, data }, (response) => {
        resolve(response || { success: false });
      });
    });
  }

  formatTime(timestamp) {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) {
      return '刚刚';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)} 分钟前`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)} 小时前`;
    } else {
      return date.toLocaleDateString();
    }
  }

  startStatusUpdates() {
    // 每5秒更新一次状态
    setInterval(async () => {
      try {
        const syncStatus = await this.getSyncStatus();
        this.updateSyncStatus(syncStatus);

        const stats = await this.getStats();
        this.updateStats(stats);
      } catch (error) {
        console.error('Status update failed:', error);
      }
    }, 5000);
  }
}

// 初始化popup
document.addEventListener('DOMContentLoaded', () => {
  new ChatMergeXP popup();
});