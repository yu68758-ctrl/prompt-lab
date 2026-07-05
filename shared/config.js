// ============================================
// API 配置管理 - shared/config.js
// ============================================

const DEFAULT_CONFIG = {
  apis: {
    analysis: {
      name: '分析模型',
      endpoint: 'https://xinyuanai666.com/v1/chat/completions',
      model: 'gpt-4o',
      apiKey: '',
      description: '用于参考图分析、文案拆解等'
    },
    imageGen: {
      name: '生图模型',
      endpoint: 'https://xinyuanai666.com/v1/images/generations',
      model: 'gpt-image-2',
      apiKey: '',
      description: '用于无字整图生成'
    },
    imageEdit: {
      name: '图生图模型',
      endpoint: 'https://xinyuanai666.com/v1/images/edits',
      model: 'gpt-image-2',
      apiKey: '',
      description: '用于参考图融合、标题生成'
    }
  },
  fonts: {
    title: '/System/Library/Fonts/STHeiti Medium.ttc',
    subtitle: '/System/Library/Fonts/STHeiti Medium.ttc'
  },
  output: {
    format: 'png',
    quality: 95
  }
};

class ConfigManager {
  constructor() {
    this.storageKey = 'poster_pipeline_config';
  }

  load() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return this._deepMerge(JSON.parse(JSON.stringify(DEFAULT_CONFIG)), JSON.parse(saved));
      }
    } catch (e) {
      console.warn('配置加载失败，使用默认配置:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }

  save(config) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(config));
      return true;
    } catch (e) {
      console.error('配置保存失败:', e);
      return false;
    }
  }

  getApiConfig(apiName) {
    const config = this.load();
    return config.apis[apiName] || null;
  }

  updateApi(apiName, updates) {
    const config = this.load();
    if (config.apis[apiName]) {
      Object.assign(config.apis[apiName], updates);
      this.save(config);
    }
    return config;
  }

  reset() {
    localStorage.removeItem(this.storageKey);
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }

  // Alias for load() - used by main dashboard
  getAll() {
    return this.load();
  }

  _deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this._deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }
}

// 全局单例
window.PipelineConfig = new ConfigManager();
