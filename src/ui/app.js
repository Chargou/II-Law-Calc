import { laws } from '../data/index.js';
import { createState } from '../state.js';
import { findBestNextUpgrade, getUpgradePath, ALL_METRICS } from '../optimizer.js';
import { analyzeBottleneck } from '../afkOptimizer.js';
import { renderStatePanel } from './statePanel.js';
import { updateOptimizerPanel } from './optimizerPanel.js';
import { updateAfkPanel } from './afkPanel.js';

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
      return createState(parsed.laws, parsed.materials, parsed.cores);
    }
  } catch (e) {}
  return createState();
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    laws: state.laws,
    materials: state.materials,
    cores: state.cores,
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

  function recalculate() {
    const best = findBestNextUpgrade(state, weights, laws, timeMode);
    const path = getUpgradePath(state, weights, laws, undefined, timeMode);
    const afk = path.length > 0 ? analyzeBottleneck(state, path, afkHours * 3600) : null;
    updateOptimizerPanel(optimizerPanelEl, best, path, state, timeMode);
    updateAfkPanel(afkPanelEl, afk);
  }

  function persistSettings() {
    saveSettings({ weights, afkHours, timeMode, advanced: isAdvanced });
  }

  function onStateChange() {
    saveState(state);
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
      onStateChange,
      onMetricChange,
      onWeightsChange,
      onAfkHoursChange,
      onTimeModeChange,
      onAdvancedChange,
      weights,
      afkHours,
      timeMode,
      advanced: isAdvanced,
    });
    persistSettings();
    recalculate();
  }

  renderStatePanel(statePanelEl, state, {
    onStateChange,
    onMetricChange,
    onWeightsChange,
    onAfkHoursChange,
    onTimeModeChange,
    onAdvancedChange,
    weights,
    afkHours,
    timeMode,
    advanced: isAdvanced,
  });

  recalculate();
}
