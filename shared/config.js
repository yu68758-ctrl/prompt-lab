/**
 * prompt-lab/shared/config.js
 * API 配置管理 — 读写 localStorage，提供全局默认值
 */

const PromptLabConfig = (() => {
  const STORAGE_KEY = 'prompt-lab-config';

  const DEFAULTS = {
    apiBase: 'https://token-plan-cn.xiaomimimo.com/v1',
    apiModel: 'mimo-v2.5',
    apiKey: '',
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {}
    return { ...DEFAULTS };
  }

  function save(cfg) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  }

  function get() {
    return load();
  }

  function set(patch) {
    const merged = { ...load(), ...patch };
    save(merged);
    return merged;
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    return { ...DEFAULTS };
  }

  /** 渲染一个 settings modal 到 body */
  function renderSettingsModal() {
    if (document.getElementById('pl-settings-modal')) return;
    const cfg = get();
    const overlay = document.createElement('div');
    overlay.id = 'pl-settings-modal';
    overlay.innerHTML = `
      <div style="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center" onclick="if(event.target===this)PromptLabConfig.closeSettings()">
        <div style="background:#1e1e2e;border-radius:14px;padding:28px;width:420px;max-width:92vw;color:#e0e0e0;box-shadow:0 8px 32px rgba(0,0,0,.4)">
          <h3 style="margin:0 0 20px;font-size:16px;font-weight:600">⚙️ API 设置</h3>
          <div style="margin-bottom:14px">
            <label style="display:block;font-size:12px;color:#aaa;margin-bottom:4px">API Base URL</label>
            <input id="pl-cfg-base" value="${cfg.apiBase}" style="width:100%;background:#12121c;border:1px solid #333;border-radius:6px;padding:8px 10px;color:#e0e0e0;font-size:13px;font-family:monospace;outline:none">
          </div>
          <div style="margin-bottom:14px">
            <label style="display:block;font-size:12px;color:#aaa;margin-bottom:4px">Model</label>
            <input id="pl-cfg-model" value="${cfg.apiModel}" style="width:100%;background:#12121c;border:1px solid #333;border-radius:6px;padding:8px 10px;color:#e0e0e0;font-size:13px;font-family:monospace;outline:none">
          </div>
          <div style="margin-bottom:20px">
            <label style="display:block;font-size:12px;color:#aaa;margin-bottom:4px">API Key</label>
            <input id="pl-cfg-key" type="password" value="${cfg.apiKey}" placeholder="sk-..." style="width:100%;background:#12121c;border:1px solid #333;border-radius:6px;padding:8px 10px;color:#e0e0e0;font-size:13px;font-family:monospace;outline:none">
            <p style="font-size:11px;color:#666;margin-top:4px">Key 仅在浏览器本地使用，不会发送到第三方服务器</p>
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end">
            <button onclick="PromptLabConfig.resetDefaults()" style="background:#2a2a2a;color:#aaa;border:none;border-radius:6px;padding:8px 14px;font-size:13px;cursor:pointer">恢复默认</button>
            <button onclick="PromptLabConfig.closeSettings()" style="background:#2a2a2a;color:#ccc;border:none;border-radius:6px;padding:8px 14px;font-size:13px;cursor:pointer">取消</button>
            <button onclick="PromptLabConfig.applySettings()" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer">保存</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
  }

  function applySettings() {
    set({
      apiBase: document.getElementById('pl-cfg-base').value.trim(),
      apiModel: document.getElementById('pl-cfg-model').value.trim(),
      apiKey: document.getElementById('pl-cfg-key').value.trim(),
    });
    closeSettings();
    // 通知其他模块配置已更新
    window.dispatchEvent(new CustomEvent('promptlab:config-changed', { detail: get() }));
  }

  function closeSettings() {
    const m = document.getElementById('pl-settings-modal');
    if (m) m.remove();
  }

  function resetDefaults() {
    reset();
    closeSettings();
    window.dispatchEvent(new CustomEvent('promptlab:config-changed', { detail: get() }));
  }

  return { get, set, save, reset, renderSettingsModal, applySettings, closeSettings, resetDefaults };
})();

window.PromptLabConfig = PromptLabConfig;
