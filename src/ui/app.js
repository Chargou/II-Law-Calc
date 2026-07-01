import { laws } from '../data/index.js';
import { createState } from '../state.js';
import { findBestNextUpgrade, getUpgradePath, applyUpgrade, ALL_METRICS } from '../optimizer.js';
import { analyzeBottleneck } from '../afkOptimizer.js';
import { renderStatePanel } from './statePanel.js';
import { updateOptimizerPanel } from './optimizerPanel.js';
import { updateAfkPanel } from './afkPanel.js';
import { renderWikiPanel } from './wikiPanel.js';
import { renderMarkTimePanel } from './markTimePanel.js';

const STORAGE_KEY = 'ii-law-calc-state';
const SETTINGS_KEY = 'ii-law-calc-settings';

function defaultWeights() {
  const w = {};
  for (const m of ALL_METRICS) w[m] = 0;
  return w;
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return createState(parsed.laws, parsed.materials, parsed.cores, parsed.reincarnation, parsed.materialRateMult, parsed.coreRateMult, parsed.ashSecret, parsed.stage300);
    }
  } catch (e) {}
  return createState();
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    laws: state.laws,
    materials: state.materials,
    cores: state.cores,
    reincarnation: state.reincarnation,
    materialRateMult: state.materialRateMult,
    coreRateMult: state.coreRateMult,
    ashSecret: state.ashSecret,
    stage300: state.stage300,
  }));
}

function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return {};
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function debugInfo(state, weights, afkHours, timeMode) {
  console.log('=== II Law Calc Debug ===');
  console.log('State:', JSON.parse(JSON.stringify(state)));
  console.log('Weights:', weights);
  console.log('AFK hours:', afkHours);
  console.log('Time mode:', timeMode);
  console.log('Laws:', JSON.parse(JSON.stringify(state.laws)));
  console.log('Materials:', JSON.parse(JSON.stringify(state.materials)));
  console.log('Cores:', state.cores);
  console.log('Reincarnation:', state.reincarnation);
  console.log('Ash Secret:', state.ashSecret);
  console.log('Material rate mult:', state.materialRateMult);
  console.log('Core rate mult:', state.coreRateMult);
}

export function createApp(rootEl) {
  const state = loadState();
  const settings = loadSettings();
  const advanced = settings.advanced || false;
  let weights = settings.weights || { ...defaultWeights(), ...(settings.metric ? { [settings.metric]: 1 } : { Qi: 1 }) };
  let afkHours = settings.afkHours || 2;
  let timeMode = settings.timeMode || 'actual';
  let isAdvanced = advanced;

  const statePanelEl = rootEl.querySelector('#state-panel');
  const optimizerPanelEl = rootEl.querySelector('#optimizer-panel');
  const afkPanelEl = rootEl.querySelector('#afk-panel');
  let currentPath = [];

  function recalculate() {
    const best = findBestNextUpgrade(state, weights, laws, timeMode);
    currentPath = getUpgradePath(state, weights, laws, undefined, timeMode);
    const afk = currentPath.length > 0 ? analyzeBottleneck(state, currentPath, afkHours * 3600, weights, laws) : null;
    updateOptimizerPanel(optimizerPanelEl, best, currentPath, state, timeMode, weights, onStepDone);
    updateAfkPanel(afkPanelEl, afk);
  }

  function onStepDone(index) {
    const step = currentPath[index];
    if (!step) return;
    applyUpgrade(state, step);
    onStateChange();
  }

  function persistSettings() {
    saveSettings({ weights, afkHours, timeMode, advanced: isAdvanced });
  }

  function onStateChange() {
    saveState(state);
    statePanelEl.querySelectorAll('[data-panel]').forEach(input => {
      const panel = input.dataset.panel;
      const name = input.dataset.name;
      if (panel === 'laws') input.value = state.laws[name] || 0;
      else if (panel === 'materials') input.value = state.materials[name] || 0;
      else if (panel === 'cores') input.value = state.cores;
    });
    recalculate();
  }

  function onMetricChange(metric) {
    weights = defaultWeights();
    weights[metric] = 1;
    persistSettings();
    recalculate();
  }

  function onWeightsChange(metric, val) {
    weights = { ...weights, [metric]: val };
    persistSettings();
    recalculate();
  }

  function onAfkHoursChange(hours) {
    afkHours = hours;
    persistSettings();
    recalculate();
  }

  function onTimeModeChange(mode) {
    timeMode = mode;
    persistSettings();
    recalculate();
  }

  function onAdvancedChange(enabled) {
    isAdvanced = enabled;
    if (!enabled) {
      const active = Object.entries(weights).find(([, v]) => v > 0);
      weights = defaultWeights();
      weights[active ? active[0] : 'Qi'] = 1;
    }
    renderStatePanel(statePanelEl, state, {
      onStateChange, onMetricChange, onWeightsChange, onAfkHoursChange,
      onTimeModeChange, onAdvancedChange, onReincarnationChange,
      onAshSecretChange, onStage300Change, onMatMultChange, onCoreMultChange,
      onExport, onImport,
      weights, afkHours, timeMode, advanced: isAdvanced, stage300: state.stage300,
    });
    persistSettings();
    recalculate();
  }

  function onReincarnationChange(val) {
    state.reincarnation = val;
    onStateChange();
  }

  function onAshSecretChange(val) {
    state.ashSecret = val;
    onStateChange();
  }

  function onStage300Change(val) {
    state.stage300 = val;
    onStateChange();
  }

  function onMatMultChange(val) {
    state.materialRateMult = val;
    onStateChange();
  }

  function onCoreMultChange(val) {
    state.coreRateMult = val;
    onStateChange();
  }

  function serializeFullState() {
    return {
      version: 1,
      laws: { ...state.laws },
      materials: { ...state.materials },
      cores: state.cores,
      reincarnation: state.reincarnation,
      materialRateMult: state.materialRateMult,
      coreRateMult: state.coreRateMult,
      ashSecret: state.ashSecret,
      stage300: state.stage300,
      weights: { ...weights },
      afkHours,
      timeMode,
      advanced: isAdvanced,
    };
  }

  function applyFullState(data) {
    state.laws = { ...data.laws };
    state.materials = { ...data.materials };
    state.cores = data.cores;
    state.reincarnation = !!data.reincarnation;
    state.materialRateMult = data.materialRateMult ?? 1;
    state.coreRateMult = data.coreRateMult ?? 1;
    state.ashSecret = !!data.ashSecret;
    state.stage300 = !!data.stage300;
    weights = { ...(data.weights || defaultWeights()) };
    afkHours = data.afkHours ?? 2;
    timeMode = data.timeMode || 'actual';
    isAdvanced = !!data.advanced;
    saveState(state);
    persistSettings();
    renderStatePanel(statePanelEl, state, {
      onStateChange, onMetricChange, onWeightsChange, onAfkHoursChange,
      onTimeModeChange, onAdvancedChange, onReincarnationChange,
      onAshSecretChange, onStage300Change, onMatMultChange, onCoreMultChange,
      weights, afkHours, timeMode, advanced: isAdvanced, stage300: state.stage300,
    });
    recalculate();
  }

  function onExport() {
    const blob = new Blob([JSON.stringify(serializeFullState(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ii-law-calc-state.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function onImport(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.version !== 1) throw new Error('Unsupported format version');
        applyFullState(data);
      } catch (e) {
        alert('Failed to import state: ' + e.message);
      }
    };
    reader.readAsText(file);
  }

  window.debugIILawCalc = () => debugInfo(state, weights, afkHours, timeMode);

  renderStatePanel(statePanelEl, state, {
    onStateChange, onMetricChange, onWeightsChange, onAfkHoursChange,
    onTimeModeChange, onAdvancedChange, onReincarnationChange,
    onAshSecretChange, onStage300Change, onMatMultChange, onCoreMultChange,
    onExport, onImport,
    weights, afkHours, timeMode, advanced: isAdvanced, stage300: state.stage300,
  });

  recalculate();

  // Tabs
  const wikiEl = document.getElementById('tab-wiki');
  const markTimeEl = document.getElementById('tab-mark-time');
  const tabBar = rootEl.querySelector('.tab-bar');
  tabBar.addEventListener('click', e => {
    const btn = e.target.closest('.tab');
    if (!btn) return;
    const tab = btn.dataset.tab;
    tabBar.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    rootEl.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const content = document.getElementById('tab-' + tab);
    content.classList.add('active');
    if (tab === 'wiki' && !wikiEl.dataset.rendered) {
      renderWikiPanel(wikiEl);
      wikiEl.dataset.rendered = '1';
    }
    if (tab === 'mark-time' && !markTimeEl.dataset.rendered) {
      renderMarkTimePanel(markTimeEl);
      markTimeEl.dataset.rendered = '1';
    }
  });
}
