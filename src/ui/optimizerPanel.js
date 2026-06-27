import { getFarmingTimeNeeded, getTotalTimeCost } from '../farming.js';
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

function renderFullPath(path, state, timeMode) {
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
        <td>${step.law.name}</td>
        <td>${step.fromLevel}→${step.toLevel}</td>
        <td>${formatMats(step.cost.materials)}</td>
        <td>${fmtNum(step.cost.cores)}</td>
        <td class="gain">${fmtNum(step.totalGain)}</td>
        <td>${fmtTime(stepTime(step))}</td>
      </tr>
      <tr class="detail-row" data-step="${i}">
        <td colspan="7">
          <div class="step-detail">${renderDetailRow(step)}</div>
        </td>
      </tr>
    `).join('');

  const totalTime = enriched.reduce((sum, step) => sum + stepTime(step), 0);

  return `
    <div class="card">
      <h3>Full Upgrade Path (${path.length} steps)</h3>
      <div class="scroll-table">
        <table class="path-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Law</th>
              <th>Level</th>
              <th>Materials</th>
              <th>Cores</th>
              <th>Score</th>
              <th>${timeLabel}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="path-total">Total ${timeLabel.toLowerCase()} time: ${fmtTime(totalTime)}</div>
    </div>
  `;
}

export function updateOptimizerPanel(el, best, path, state, timeMode = 'total') {
  el.innerHTML = renderBestNext(best, state, timeMode) + renderFullPath(path, state, timeMode);

  el.querySelectorAll('.path-row').forEach(row => {
    row.addEventListener('click', () => {
      const idx = row.dataset.step;
      const detail = el.querySelector(`.detail-row[data-step="${idx}"]`);
      if (detail) {
        detail.classList.toggle('open');
      }
    });
  });
}
