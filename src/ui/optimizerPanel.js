import { getFarmingTimeNeeded, getTotalTimeCost } from '../farming.js';
import { getMaterialRate, getCoreRate } from '../data/index.js';
import { computeStepDeficits } from '../optimizer.js';

function fmtTime(seconds) {
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

function formatMats(mats) {
  return mats.map(m => `${fmtNum(m.qty)} ${m.name}`).join(', ');
}

function renderBestNext(best, state, timeMode) {
  if (!best) {
    return '<div class="card"><h3>Best Next Upgrade</h3><p class="empty-state">No upgrades available — set weights to find upgrades.</p></div>';
  }

  const ft = getFarmingTimeNeeded(state, best.cost);
  const timeLabel = timeMode === 'actual' ? 'Actual time' : 'Total time';
  const timeValue = timeMode === 'actual' ? ft.actual : ft.total;
  return `
    <div class="card">
      <h3>Best Next Upgrade</h3>
      <div class="upgrade-law">${best.law.name} <span class="upgrade-level">${best.fromLevel} → ${best.toLevel}</span></div>
      <div class="upgrade-cost">${formatMats(best.cost.materials)}, ${fmtNum(best.cost.cores)} cores</div>
      <div class="upgrade-stat">Score: <strong class="gain">${fmtNum(best.totalGain)}</strong> (weighted gain)</div>
      <div class="upgrade-stat">${timeLabel}: <strong>${fmtTime(timeValue)}</strong></div>
    </div>
  `;
}

function renderFarmStep(step) {
  if (step.type === 'cores') {
    return `Farm cores for ${fmtTime(step.duration)} (${fmtNum(step.deficit)} cores needed)`;
  }
  return `Farm ${step.mark} for ${fmtTime(step.duration)} (${fmtNum(step.deficit)} ${step.resource} needed)`;
}

function renderDetailRow(detail) {
  if (detail.deficits.farmSteps.length === 0) {
    return '<div class="detail-empty">No farming needed — you have enough resources.</div>';
  }
  return detail.deficits.farmSteps.map(fs => `
    <div class="detail-farm">${renderFarmStep(fs)}</div>
  `).join('');
}

function formatBuffs(buffs) {
  return Object.entries(buffs).map(([k, v]) => `${k}: ${v}`).join('&#10;');
}

function formatScoreBreakdown(law, weights) {
  if (!weights) return '';
  const parts = [];
  let total = 0;
  for (const metric of ['Qi', 'Divinity', 'Citizens', 'Damage', 'Manual Luck', 'Disciple Luck', 'Remnants']) {
    const w = weights[metric] || 0;
    if (w <= 0) continue;
    let gain = law.buffs[metric] ?? 0;
    let label = metric;
    if (metric === 'Qi' && law.buffs['Breakthrough Cost']) {
      const bc = law.buffs['Breakthrough Cost'];
      gain *= (1 / bc);
      label += ` (×${fmtNum(1 / bc)} breakthrough)`;
    }
    const contrib = gain * w;
    total += contrib;
    parts.push(`${label}: ${fmtNum(gain)} × ${fmtNum(w)} = ${fmtNum(contrib)}`);
  }
  parts.push(`Total: ${fmtNum(total)}`);
  return parts.join('&#10;');
}

function renderFullPath(path, state, timeMode, weights, onStepDone) {
  if (path.length === 0) {
    return '<div class="card"><h3>Full Upgrade Path</h3><p class="empty-state">Enter resources and select a metric to see the upgrade path.</p></div>';
  }

  const timeLabel = timeMode === 'actual' ? 'Actual' : 'Total';
  const enriched = computeStepDeficits(state, path);

  const stepTime = (step) => timeMode === 'actual'
    ? step.deficits.farmSteps.reduce((s, fs) => s + fs.duration, 0)
    : getTotalTimeCost(state, step.cost);

  const rows = enriched.map((step, i) => `
      <tr class="path-row" data-step="${i}">
        <td>${i + 1}</td>
        <td title="${formatBuffs(step.law.buffs)}">${step.law.name}</td>
        <td>${step.fromLevel}→${step.toLevel}</td>
        <td>${formatMats(step.cost.materials)}</td>
        <td>${fmtNum(step.cost.cores)}</td>
        <td class="gain"${weights ? ` title="${formatScoreBreakdown(step.law, weights)}"` : ''}>${fmtNum(step.totalGain)}</td>
        <td>${fmtTime(stepTime(step))}</td>
      </tr>
      <tr class="detail-row" data-step="${i}">
        <td colspan="7">
          <div class="step-detail">${renderDetailRow(step)}</div>
          ${onStepDone ? '<button class="step-done-btn" data-step="' + i + '">Done</button>' : ''}
        </td>
      </tr>
    `).join('');

  const totalTime = enriched.reduce((sum, step) => sum + stepTime(step), 0);

  const resourceTime = {};
  if (timeMode === 'actual') {
    for (const step of enriched) {
      for (const fs of step.deficits.farmSteps) {
        const key = fs.type === 'cores' ? 'cores' : fs.resource;
        resourceTime[key] = (resourceTime[key] || 0) + fs.duration;
      }
    }
  } else {
    for (const step of enriched) {
      for (const { name, qty } of step.cost.materials) {
        resourceTime[name] = (resourceTime[name] || 0) + qty / getMaterialRate(name);
      }
      resourceTime.cores = (resourceTime.cores || 0) + step.cost.cores / getCoreRate();
    }
  }

  return `
    <div class="card">
      <h3>Full Upgrade Path (${path.length} steps)</h3>
      <div class="scroll-table">
        <table class="path-table">
          <thead>
            <tr>
              <th title="Step number">#</th>
              <th title="Law name — hover for buffs">Law</th>
              <th title="Level before → after upgrade">Level</th>
              <th title="Materials needed for this upgrade">Materials</th>
              <th title="Cores needed for this upgrade">Cores</th>
              <th title="Weighted total gain (sum of metric gains × weights)">Score</th>
              <th title="${timeMode === 'actual' ? 'Farming time based on current deficit' : 'Farming time for full cost'}">${timeLabel}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="path-total">Total ${timeLabel.toLowerCase()} time: ${fmtTime(totalTime)}</div>
      <div class="path-resources">
        ${Object.entries(resourceTime).sort(([a], [b]) => a === 'cores' ? 1 : b === 'cores' ? -1 : a.localeCompare(b)).map(([name, time]) => `
          <span class="resource-time">${name}: ${fmtTime(time)}</span>
        `).join('')}
      </div>
    </div>
  `;
}

export function updateOptimizerPanel(el, best, path, state, timeMode = 'total', weights, onStepDone) {
  el.innerHTML = renderBestNext(best, state, timeMode) + renderFullPath(path, state, timeMode, weights, onStepDone);

  el.querySelectorAll('.path-row').forEach(row => {
    row.addEventListener('click', () => {
      const idx = row.dataset.step;
      const detail = el.querySelector(`.detail-row[data-step="${idx}"]`);
      if (detail) {
        detail.classList.toggle('open');
      }
    });
  });

  el.querySelectorAll('.step-done-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      onStepDone(parseInt(btn.dataset.step));
    });
  });
}
