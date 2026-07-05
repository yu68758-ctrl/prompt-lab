/**
 * prompt-lab/shared/api.js
 * OpenAI-compatible Chat Completions API 调用封装
 * 支持多模态 (text + image_url)，streaming 可选
 */

const PromptLabAPI = (() => {

  /**
   * 调用 Chat Completions API
   * @param {Array} messages - [{ role, content }]  content 可以是 string 或 [{type,text},{type,image_url,...}]
   * @param {Object} opts - { stream, temperature, maxTokens, onToken }
   * @returns {Promise<string|null>} assistant 回复文本
   */
  async function chat(messages, opts = {}) {
    const cfg = PromptLabConfig.get();
    if (!cfg.apiBase || !cfg.apiKey) {
      PromptLabAPI.toast('请先配置 API（点击右上角 ⚙️）', 'error');
      return null;
    }

    const body = {
      model: cfg.apiModel,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 4096,
    };

    try {
      const res = await fetch(`${cfg.apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API ${res.status}: ${errText.slice(0, 300)}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (err) {
      PromptLabAPI.toast('API 调用失败: ' + err.message, 'error');
      console.error('[PromptLab API]', err);
      return null;
    }
  }

  /**
   * 多模态调用 — 自动组装文本+图片
   * @param {string} systemPrompt
   * @param {string} userText
   * @param {File[]|string[]} images - File 对象或 base64 data URLs
   */
  async function multimodal(systemPrompt, userText, images = []) {
    const content = [{ type: 'text', text: userText }];
    for (const img of images) {
      if (typeof img === 'string') {
        content.push({ type: 'image_url', image_url: { url: img } });
      } else if (img instanceof File) {
        const dataUrl = await readFileAsBase64(img);
        content.push({ type: 'image_url', image_url: { url: dataUrl } });
      }
    }
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content },
    ];
    return chat(messages);
  }

  /** File → base64 data URL */
  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /** 简单 toast 通知 */
  function toast(msg, type = 'info') {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
      padding:10px 20px;border-radius:8px;font-size:13px;font-weight:500;
      z-index:99999;pointer-events:none;opacity:0;transition:opacity .3s;
      background:${type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#333'};
      color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.3);
    `;
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.style.opacity = '1');
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 2500);
  }

  return { chat, multimodal, readFileAsBase64, toast };
})();

window.PromptLabAPI = PromptLabAPI;
