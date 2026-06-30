import { computeMarkTime, formatDuration } from '../markTime.js';

export function renderMarkTimePanel(rootEl) {
  rootEl.innerHTML = `
    <div class="card">
      <h3>Mark Time Estimator</h3>
      <p class="wiki-text">Estimate the expected time to farm a target amount of a specific mark.</p>
      <div class="input-group">
        <label for="mt-mps">MPS</label>
        <input type="text" id="mt-mps" value="1" />
      </div>
      <div class="input-group">
        <label for="mt-rarity">Target Rarity</label>
        <input type="text" id="mt-rarity" value="2" />
      </div>
      <div class="input-group">
        <label for="mt-clone">Clone</label>
        <input type="text" id="mt-clone" value="1" />
      </div>
      <div class="input-group">
        <label for="mt-target">Target Amount</label>
        <input type="text" id="mt-target" value="1" />
      </div>
      <details style="margin-top:12px">
        <summary style="cursor:pointer;color:#8b949e;font-size:0.85rem">Milestones (optional)</summary>
        <div style="padding:8px 0 0 16px">
          <div class="input-group">
            <label for="mt-tier">Current Tier</label>
            <input type="number" id="mt-tier" min="0" step="1" />
          </div>
          <div class="input-group">
            <label for="mt-progress">Progress (opens)</label>
            <input type="text" id="mt-progress" />
          </div>
        </div>
      </details>
      <button id="mt-compute" class="io-btn" style="margin-top:16px;flex:none;width:auto;padding:8px 24px">Compute</button>
      <div id="mt-result" style="margin-top:16px;padding-top:12px;border-top:1px solid #30363d">
        <p class="empty-state">Enter values and press Compute.</p>
      </div>
    </div>
  `;

  const mps = rootEl.querySelector('#mt-mps');
  const rarity = rootEl.querySelector('#mt-rarity');
  const clone = rootEl.querySelector('#mt-clone');
  const target = rootEl.querySelector('#mt-target');
  const tier = rootEl.querySelector('#mt-tier');
  const progress = rootEl.querySelector('#mt-progress');
  const computeBtn = rootEl.querySelector('#mt-compute');
  const resultEl = rootEl.querySelector('#mt-result');

  function compute() {
    const result = computeMarkTime({
      mps: mps.value || '1',
      rarity: rarity.value || '1',
      clone: clone.value || '1',
      target: target.value || '1',
      tier: tier.value,
      progress: progress.value,
    });

    const duration = formatDuration(result.seconds);

    let html = `<p class="afk-action"><strong>Expected time:</strong> ${duration}</p>`;

    if (result.tiersCrossed > 0) {
      const mpsStr = result.finalMps.mantissa.toPrecision(4) + 'e' + result.finalMps.exponent;
      html += `<p class="afk-reason" style="margin-top:6px">Will cross <strong>${result.tiersCrossed}</strong> milestone tier${result.tiersCrossed !== 1 ? 's' : ''}. Final MPS: <strong>${mpsStr}</strong></p>`;
    }

    resultEl.innerHTML = html;
  }

  computeBtn.addEventListener('click', compute);

  rootEl.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') compute();
    });
  });
}
