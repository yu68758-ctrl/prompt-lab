/**
 * prompt-lab/shared/store.js
 * 全局数据流转 — 5 步流程的共享状态，localStorage 持久化
 */

const PromptLabStore = (() => {
  const STORAGE_KEY = 'prompt-lab-store';

  const STEPS = [
    { id: 'skill-01', label: '参考图反推',   icon: '📷', short: '反推' },
    { id: 'skill-02', label: '文案拆解',     icon: '📝', short: '文案' },
    { id: 'skill-03', label: 'Prompt 构建',  icon: '🧩', short: 'Prompt' },
    { id: 'skill-04', label: '生图执行',     icon: '🎨', short: '生图' },
    { id: 'skill-05', label: '排版合成',     icon: '🖼️', short: '排版' },
  ];

  // 每个 step 的数据 schema
  const DEFAULT_DATA = {
    'skill-01': { images: [], result: null },       // 参考图反推结果
    'skill-02': { text: '', result: null },          // 文案拆解结果
    'skill-03': { prompt: '', negative: '', result: null }, // Prompt 构建
    'skill-04': { images: [], result: null },        // 生图结果
    'skill-05': { layout: null, result: null },      // 排版合成
  };

  let state = {
    currentStep: 0,          // 当前步骤索引 0-4
    data: JSON.parse(JSON.stringify(DEFAULT_DATA)),
    meta: { createdAt: Date.now(), updatedAt: Date.now() },
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        state = {
          ...state,
          ...saved,
          data: { ...JSON.parse(JSON.stringify(DEFAULT_DATA)), ...(saved.data || {}) },
        };
      }
    } catch {}
    return state;
  }

  function save() {
    state.meta.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getState() { return load(); }

  function getStep() { return load().currentStep; }

  function setStep(idx) {
    state.currentStep = Math.max(0, Math.min(STEPS.length - 1, idx));
    save();
    window.dispatchEvent(new CustomEvent('promptlab:step-changed', { detail: { step: state.currentStep } }));
  }

  function nextStep() { setStep(state.currentStep + 1); }
  function prevStep() { setStep(state.currentStep - 1); }

  function getStepData(stepId) {
    return load().data[stepId] || {};
  }

  function setStepData(stepId, patch) {
    state.data[stepId] = { ...(state.data[stepId] || {}), ...patch };
    save();
    window.dispatchEvent(new CustomEvent('promptlab:data-changed', { detail: { stepId, data: state.data[stepId] } }));
  }

  function clearAll() {
    state.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    state.currentStep = 0;
    save();
    window.dispatchEvent(new CustomEvent('promptlab:cleared'));
  }

  return { STEPS, DEFAULT_DATA, getState, getStep, setStep, nextStep, prevStep, getStepData, setStepData, clearAll, load };
})();

window.PromptLabStore = PromptLabStore;
