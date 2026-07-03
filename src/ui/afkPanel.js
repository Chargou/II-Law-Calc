import { materials, getMaterialRate, getCoreRate } from '../data/index.js';
import { getMaterial, getCores } from '../state.js';
import { parseNumber } from '../suffixParser.js';

function fmtTime(seconds) {
  if (seconds < 1) return `${seconds.toFixed(2)}s`;
  if (seconds < 10) return `${seconds.toFixed(1)}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function fmtNum(n) {
  if (n === undefined || n === null) return '0';
  if (Number.isInteger(n)) return n.toLocaleString();
  if (n < 1) return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  if (n < 100) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function renderAfkCard(afk) {
  if (!afk) {
    return `
      <div class="card" style="margin-bottom:16px">
        <h3>Long AFK Recommendation</h3>
        <p class="empty-state">Run the optimizer above to see long AFK recommendations.</p>
      </div>
    `;
  }
  const resourceLabel = afk.type === 'cores' ? 'Cores' : `${afk.resource}`;
  return `
    <div class="card" style="margin-bottom:16px">
      <h3>Long AFK Recommendation</h3>
      <div class="afk-action">Farm <strong>${resourceLabel}</strong> for <strong>${fmtTime(afk.duration)}</strong></div>
      <div class="upgrade-cost">${fmtNum(afk.deficit)} ${afk.type === 'cores' ? 'cores' : afk.resource} needed (${fmtTime(afk.timeNeeded)} total)</div>
      <div class="afk-reason">${afk.reason}</div>
    </div>
  `;
}

function computeTime(state, resource, amount, targetMode, matMult, coreMult) {
  const parsed = parseNumber(amount);
  if (isNaN(parsed) || parsed <= 0) return null;

  const mult = resource === 'cores' ? coreMult : matMult;
  const rate = resource === 'cores' ? getCoreRate() * mult : getMaterialRate(resource) * mult;
  if (rate <= 0) return null;

  const current = resource === 'cores' ? getCores(state) : getMaterial(state, resource);
  let needed = parsed;
  if (targetMode) {
    needed = Math.max(0, parsed - current);
  }
  if (needed <= 0) return { seconds: 0, needed: 0, rate, ratePerSec: rate, current };
  return { seconds: needed / rate, needed, rate, ratePerSec: rate, current };
}

function renderCalcCard(state, matMult, coreMult) {
  const matOptions = materials.map(m =>
    `<option value="${m.material}">${m.material} (${m.mark})</option>`
  ).join('');

  return `
    <div class="card" id="farm-calc-card">
      <h3>Farming Time Calculator</h3>
      <div class="input-group">
        <label>Resource</label>
        <select id="farm-resource">
          <option value="cores">Cores</option>
          ${matOptions}
        </select>
      </div>
      <div class="input-group">
        <label>Amount</label>
        <input type="text" id="farm-amount" value="1" placeholder="e.g. 500k, 1.2M">
      </div>
      <label class="checkbox-label">
        <input type="checkbox" id="farm-target-mode">
        Target amount (include current stock)
      </label>
      <div id="farm-result" style="margin-top:10px;padding-top:10px;border-top:1px solid #30363d;min-height:1.5em"></div>
    </div>
  `;
}

function updateResult(el, state, matMult, coreMult) {
  const resource = document.getElementById('farm-resource').value;
  const amount = document.getElementById('farm-amount').value;
  const targetMode = document.getElementById('farm-target-mode').checked;
  const resultEl = document.getElementById('farm-result');
  if (!resultEl) return;

  const result = computeTime(state, resource, amount, targetMode, matMult, coreMult);
  if (!result) {
    resultEl.innerHTML = '<span style="color:#8b949e">Enter a valid amount.</span>';
    return;
  }

  const label = resource === 'cores' ? 'cores' : resource;
  const rateLabel = resource === 'cores' ? `${fmtNum(result.ratePerSec)}/s` : `${fmtNum(result.ratePerSec)}/s (${fmtNum(result.rate)}/s with current mult)`;

  if (result.needed === 0) {
    resultEl.innerHTML = `You already have enough ${label} (${fmtNum(result.current)}). No farming needed.`;
    return;
  }

  resultEl.innerHTML = `
    <div style="margin-bottom:4px">Farming time: <strong>${fmtTime(result.seconds)}</strong></div>
    <div style="font-size:0.8rem;color:#8b949e">
      Need ${fmtNum(result.needed)} more ${label} · Rate: ${rateLabel}
      ${result.current > 0 ? `· Current: ${fmtNum(result.current)}` : ''}
    </div>
  `;
}

function wireEvents(el, state, matMult, coreMult) {
  const handler = () => updateResult(el, state, matMult, coreMult);

  const resource = el.querySelector('#farm-resource');
  const amount = el.querySelector('#farm-amount');
  const targetMode = el.querySelector('#farm-target-mode');

  if (resource) resource.addEventListener('change', handler);
  if (amount) amount.addEventListener('input', handler);
  if (targetMode) targetMode.addEventListener('click', handler);

  updateResult(el, state, matMult, coreMult);
}

export function updateAfkPanel(el, afk, state, matMult, coreMult) {
  el.innerHTML = renderAfkCard(afk) + renderCalcCard(state, matMult, coreMult);
  wireEvents(el, state, matMult, coreMult);
}
