// ============================================
// API 调用封装 - shared/api.js
// ============================================

class PipelineAPI {
  constructor() {
    this.config = window.PipelineConfig;
  }

  // ---- 分析模型调用（文本/图片理解）----
  async callAnalysis(messages, options = {}) {
    const api = this.config.getApiConfig('analysis');
    if (!api.apiKey) throw new Error('请先配置分析模型的 API Key');

    const body = {
      model: options.model || api.model,
      messages,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature ?? 0.7
    };

    const resp = await fetch(api.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`分析模型调用失败 (${resp.status}): ${err}`);
    }

    const data = await resp.json();
    return data.choices?.[0]?.message?.content || '';
  }

  // ---- 生图模型调用（文生图）----
  async callImageGen(prompt, options = {}) {
    const api = this.config.getApiConfig('imageGen');
    if (!api.apiKey) throw new Error('请先配置生图模型的 API Key');

    const body = {
      model: options.model || api.model,
      prompt,
      n: options.n || 1,
      size: options.size || '1536x1024',
      quality: options.quality || 'high'
    };

    const resp = await fetch(api.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`生图模型调用失败 (${resp.status}): ${err}`);
    }

    const data = await resp.json();
    return data.data || [];
  }

  // ---- 图生图模型调用（编辑/融合）----
  async callImageEdit(prompt, imageFiles, options = {}) {
    const api = this.config.getApiConfig('imageEdit');
    if (!api.apiKey) throw new Error('请先配置图生图模型的 API Key');

    const formData = new FormData();
    formData.append('model', options.model || api.model);
    formData.append('prompt', prompt);

    if (Array.isArray(imageFiles)) {
      imageFiles.forEach((file, i) => {
        formData.append(i === 0 ? 'image' : `image_${i}`, file);
      });
    } else {
      formData.append('image', imageFiles);
    }

    if (options.n) formData.append('n', options.n);
    if (options.size) formData.append('size', options.size);

    const resp = await fetch(api.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${api.apiKey}`
      },
      body: formData
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`图生图模型调用失败 (${resp.status}): ${err}`);
    }

    const data = await resp.json();
    return data.data || [];
  }

  // ---- 辅助：Base64 转 File 对象 ----
  base64ToFile(base64, filename = 'image.png') {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  }

  // ---- 辅助：图片 URL 转 Base64 ----
  async urlToBase64(url) {
    const resp = await fetch(url);
    const blob = await resp.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  // ---- 辅助：Toast 通知 ----
  toast(msg, type = 'info') {
    const el = document.createElement('div');
    const bg = type === 'error' ? 'rgba(239,68,68,0.9)' : type === 'success' ? 'rgba(34,197,94,0.9)' : 'rgba(99,102,241,0.9)';
    el.style.cssText = `position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:500;z-index:99999;pointer-events:none;opacity:0;transition:opacity .3s;background:${bg};color:#fff;box-shadow:0 4px 16px rgba(0,0,0,.3);max-width:360px;`;
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.style.opacity = '1');
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 2500);
  }
}

// 全局单例
window.PipelineAPI = new PipelineAPI();
