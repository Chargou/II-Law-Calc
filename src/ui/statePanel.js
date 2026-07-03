import { laws, materials } from '../data/index.js';
import { getLevel, setLevel, getMaterial, getCores } from '../state.js';

const METRICS = ['Qi', 'Divinity', 'Citizens', 'Damage', 'Manual Luck', 'Disciple Luck', 'Remnants'];

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function buildSectionHtml(id, title, items, getValue) {
  const inputs = items.map(item => {
    const name = item.name || item.material || item;
    const label = item.label || name;
    const maxAttr = item.max !== undefined ? ` max="${item.max}"` : '';
    return `
      <div class="input-group">
        <label>${label}</label>
        <input type="number" data-panel="${id}" data-name="${name}" value="${getValue(name)}" min="0"${maxAttr}>
      </div>
    `;
  }).join('');

  return `
    <div class="section" data-section="${id}">
      <div class="section-header">
        <span class="toggle-icon">▼</span>
        <span>${title}</span>
      </div>
      <div class="section-body">${inputs}</div>
    </div>
  `;
}

function handleInput(state, el, options) {
  const panel = el.dataset.panel;
  const name = el.dataset.name;
  const val = clamp(parseInt(el.value) || 0, 0, el.max ? parseInt(el.max) : Infinity);

  el.value = val;

  if (panel === 'laws') {
    setLevel(state, name, val);
  } else if (panel === 'materials') {
    state.materials[name] = val;
  } else if (panel === 'cores') {
    state.cores = val;
  }
  options.onStateChange();
}

export function renderStatePanel(el, state, options) {
  const lawItems = laws.map(l => ({ name: l.name, label: l.name, max: 10 }));
  const materialItems = materials.map(m => ({ name: m.material, label: m.material }));

  const weights = options.weights;
  const advanced = options.advanced;

  el.innerHTML = `
    ${buildSectionHtml('laws', 'Law Levels', lawItems, name => getLevel(state, name))}
    ${buildSectionHtml('materials', 'Materials', materialItems, name => getMaterial(state, name))}
    ${buildSectionHtml('cores', 'Cores', [{ name: 'cores', label: 'Cores' }], () => getCores(state))}
    <div class="controls">
      ${advanced ? `
        <div class="weights-grid">
          <div class="weights-title">Weights</div>
          ${METRICS.map(m => `
            <div class="weight-row">
              <label>${m}</label>
              <input type="number" class="weight-input" data-metric="${m}" value="${weights[m] || 0}" min="0" step="1">
            </div>
          `).join('')}
        </div>
      ` : `
        <label>
          Metric
          <select id="metric-select">
            ${METRICS.map(m => `<option value="${m}"${weights[m] ? ' selected' : ''}>${m}</option>`).join('')}
          </select>
        </label>
      `}
      <label>
        AFK hours
        <input type="number" id="afk-hours" value="${options.afkHours}" min="0.5" step="0.5">
      </label>
      <label class="checkbox-label">
        <input type="checkbox" id="time-mode" ${options.timeMode === 'actual' ? 'checked' : ''}>
        Use actual time (instead of total)
      </label>
      <label class="checkbox-label">
        <input type="checkbox" id="advanced-mode" ${advanced ? 'checked' : ''}>
        Advanced mode (weights)
      </label>
      <div class="section" data-section="multipliers">
        <div class="section-header">
          <span class="toggle-icon">▶</span>
          <span>Mats &amp; Cores multipliers</span>
        </div>
        <div class="section-body" style="display:none">
          <label class="checkbox-label">
            <input type="checkbox" id="reincarnation" ${state.reincarnation ? 'checked' : ''}>
            First reincarnation done (2× mat rate, 3× core rate)
          </label>
          <label class="checkbox-label">
            <input type="checkbox" id="ash-secret" ${state.ashSecret ? 'checked' : ''}>
            Mark of Ash Secret Maxed (2× mat &amp; core rate)
          </label>
          <label class="checkbox-label">
            <input type="checkbox" id="stage-300" ${state.stage300 ? 'checked' : ''}>
            Stage 300 (2× mat &amp; core rate)
          </label>
          <label class="checkbox-label">
            <input type="checkbox" id="ash-tree" ${state.ashTree ? 'checked' : ''}>
            Ash Tree &mdash; Law secret upgrade (2× mats chance)
          </label>
          <label class="checkbox-label">
            <input type="checkbox" id="divinity-mat" ${state.divinityMat ? 'checked' : ''}>
            Divinity board 3 (2× mats)
          </label>
          <label class="checkbox-label">
            <input type="checkbox" id="divinity-core" ${state.divinityCore ? 'checked' : ''}>
            Divinity board 3 (2× cores)
          </label>
          <div class="mult-row">
            <label>Other mat mult</label>
            <input type="number" id="mat-mult" value="${state.materialRateMult ?? 1}" min="0.01" step="0.01">
          </div>
          <div class="mult-row">
            <label>Other core mult</label>
            <input type="number" id="core-mult" value="${state.coreRateMult ?? 1}" min="0.01" step="0.01">
          </div>
        </div>
      </div>
      <div class="io-buttons">
        <button class="io-btn" id="export-btn">Export</button>
        <button class="io-btn" id="import-btn">Import</button>
        <input type="file" id="import-file" accept=".json" style="display:none">
      </div>
    </div>
  `;

  el.addEventListener('input', e => {
    const input = e.target;
    if (input.dataset.panel) {
      handleInput(state, input, options);
    }
  });

  el.addEventListener('click', e => {
    const header = e.target.closest('.section-header');
    if (!header) return;
    const section = header.closest('.section');
    const body = section.querySelector('.section-body');
    const icon = header.querySelector('.toggle-icon');
    const collapsed = section.dataset.collapsed === 'true';
    section.dataset.collapsed = String(!collapsed);
    body.style.display = collapsed ? 'block' : 'none';
    icon.textContent = collapsed ? '▼' : '▶';
  });

  const metricSelect = el.querySelector('#metric-select');
  if (metricSelect) {
    metricSelect.addEventListener('change', e => {
      options.onMetricChange(e.target.value);
    });
  }

  el.querySelectorAll('.weight-input').forEach(inp => {
    inp.addEventListener('change', e => {
      const metric = e.target.dataset.metric;
      const val = Math.max(0, parseFloat(e.target.value) || 0);
      e.target.value = val;
      options.onWeightsChange(metric, val);
    });
  });

  el.querySelector('#afk-hours').addEventListener('change', e => {
    options.onAfkHoursChange(parseFloat(e.target.value) || 2);
  });

  el.querySelector('#time-mode').addEventListener('change', e => {
    options.onTimeModeChange(e.target.checked ? 'actual' : 'total');
  });

  el.querySelector('#advanced-mode').addEventListener('change', e => {
    options.onAdvancedChange(e.target.checked);
  });

  el.querySelector('#reincarnation').addEventListener('change', e => {
    options.onReincarnationChange(e.target.checked);
  });

  el.querySelector('#ash-secret').addEventListener('change', e => {
    options.onAshSecretChange(e.target.checked);
  });

  el.querySelector('#stage-300').addEventListener('change', e => {
    options.onStage300Change(e.target.checked);
  });

  el.querySelector('#ash-tree').addEventListener('change', e => {
    options.onAshTreeChange(e.target.checked);
  });

  el.querySelector('#divinity-mat').addEventListener('change', e => {
    options.onDivinityMatChange(e.target.checked);
  });

  el.querySelector('#divinity-core').addEventListener('change', e => {
    options.onDivinityCoreChange(e.target.checked);
  });

  el.querySelector('#mat-mult').addEventListener('change', e => {
    options.onMatMultChange(parseFloat(e.target.value) || 1);
  });

  el.querySelector('#core-mult').addEventListener('change', e => {
    options.onCoreMultChange(parseFloat(e.target.value) || 1);
  });

  el.querySelector('#export-btn').addEventListener('click', () => options.onExport());

  el.querySelector('#import-btn').addEventListener('click', () => {
    el.querySelector('#import-file').click();
  });

  el.querySelector('#import-file').addEventListener('change', e => {
    if (e.target.files[0]) {
      options.onImport(e.target.files[0]);
      e.target.value = '';
    }
  });
}
