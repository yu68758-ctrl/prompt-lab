// ============================================
// 数据流转管理 - shared/store.js
// ============================================

// 统一数据 Schema 定义
const SCHEMAS = {
  skill01Output: {
    posterType: '',
    dimensions: { width: 297, height: 210, unit: 'mm' },
    styleKeywords: [],
    colorPalette: [],
    visualElements: [],
    titleStyle: { font: 'bold', color: 'white', effect: 'glow' },
    copyCapacity: { maxChars: 50, level: '少量文案' },
    rawAnalysis: '',
    confidence: 0,
    referenceImages: []
  },
  skill02Output: {
    title: '',
    subtitle: '',
    bodyCopy: [],
    cta: '',
    compliance: { required: false, elements: [] },
    copyCapacity: { maxChars: 50, level: '少量文案' }
  },
  skill03Output: {
    mainPrompt: '',
    negativePrompt: '',
    stylePrompt: '',
    titleDesignSupportAssets: '',
    titleText: '',
    titleStyleRef: ''
  },
  skill04Output: {
    fullCanvas: { url: '', width: 0, height: 0 },
    titleDesignSupport: { url: '' },
    version: 1
  },
  skill05Output: {
    finalImage: { url: '', width: 0, height: 0 },
    titleRendered: false,
    qualityCheck: { passed: false, issues: [] }
  }
};

class PipelineStore {
  constructor() {
    this.projectKey = 'poster_pipeline_project';
    this.historyKey = 'poster_pipeline_history';
  }

  // ---- 当前项目数据 ----
  getProject() {
    try {
      const data = localStorage.getItem(this.projectKey);
      return data ? JSON.parse(data) : this._emptyProject();
    } catch {
      return this._emptyProject();
    }
  }

  saveProject(project) {
    localStorage.setItem(this.projectKey, JSON.stringify(project));
  }

  // 获取指定 Skill 的输出
  getSkillOutput(skillNum) {
    const project = this.getProject();
    return project[`skill0${skillNum}Output`] || null;
  }

  // 保存指定 Skill 的输出
  saveSkillOutput(skillNum, data) {
    const project = this.getProject();
    project[`skill0${skillNum}Output`] = data;
    project.steps[skillNum - 1].completed = true;
    project.steps[skillNum - 1].completedAt = new Date().toISOString();
    project.updatedAt = new Date().toISOString();
    this.saveProject(project);
  }

  // 获取某步骤的输入（前一步的输出）
  getSkillInput(skillNum) {
    if (skillNum <= 1) return null;
    return this.getSkillOutput(skillNum - 1);
  }

  // 获取所有前置步骤的输出
  getAllPreviousOutputs(skillNum) {
    const outputs = {};
    for (let i = 1; i < skillNum; i++) {
      outputs[`skill0${i}`] = this.getSkillOutput(i);
    }
    return outputs;
  }

  // 步骤状态
  getStepStatus(skillNum) {
    const project = this.getProject();
    return project.steps[skillNum - 1] || { completed: false };
  }

  markStepComplete(skillNum) {
    const project = this.getProject();
    project.steps[skillNum - 1].completed = true;
    project.steps[skillNum - 1].completedAt = new Date().toISOString();
    this.saveProject(project);
  }

  markStepIncomplete(skillNum) {
    const project = this.getProject();
    project.steps[skillNum - 1].completed = false;
    project.steps[skillNum - 1].completedAt = null;
    this.saveProject(project);
  }

  // 重置项目
  resetProject() {
    this.saveProject(this._emptyProject());
  }

  // Alias: save current project to history
  saveToHistory() {
    this.addToHistory(this.getProject());
  }

  // Partial merge into project (used by main dashboard)
  setProject(partial) {
    const project = this.getProject();
    Object.assign(project, partial);
    if (partial.stepStatus) {
      partial.stepStatus.forEach((completed, i) => {
        if (project.steps[i]) {
          project.steps[i].completed = completed;
          if (completed) project.steps[i].completedAt = new Date().toISOString();
        }
      });
    }
    this.saveProject(project);
  }

  // ---- 历史记录 ----
  getHistory() {
    try {
      const data = localStorage.getItem(this.historyKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  addToHistory(projectSnapshot) {
    const history = this.getHistory();
    history.unshift({
      id: Date.now().toString(),
      savedAt: new Date().toISOString(),
      data: projectSnapshot
    });
    if (history.length > 20) history.length = 20;
    localStorage.setItem(this.historyKey, JSON.stringify(history));
  }

  loadFromHistory(id) {
    const history = this.getHistory();
    const item = history.find(h => h.id === id);
    if (item) {
      this.saveProject(item.data);
      return item.data;
    }
    return null;
  }

  deleteHistory(id) {
    const history = this.getHistory().filter(h => h.id !== id);
    localStorage.setItem(this.historyKey, JSON.stringify(history));
  }

  // ---- 内部 ----
  _emptyProject() {
    return {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      steps: [
        { name: '参考图反推', skill: 1, completed: false, completedAt: null },
        { name: '文案拆解', skill: 2, completed: false, completedAt: null },
        { name: 'Prompt 构建', skill: 3, completed: false, completedAt: null },
        { name: '生图执行', skill: 4, completed: false, completedAt: null },
        { name: '排版合成', skill: 5, completed: false, completedAt: null }
      ],
      skill01Output: null,
      skill02Output: null,
      skill03Output: null,
      skill04Output: null,
      skill05Output: null
    };
  }
}

// 全局单例
window.PipelineStore = new PipelineStore();
