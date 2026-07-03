import { laws, materials, tiers, getMaterialRate, getMaterialMark, getCoreRate } from '../data/index.js';

function fmtNum(n) {
  if (Number.isInteger(n)) return n.toLocaleString();
  if (n < 1) return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  if (n < 100) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

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

export function renderWikiPanel(el, matMult, coreMult) {
  el.innerHTML = `
    <div class="card wiki-section">
      <h3>How Law Synthesis Works</h3>
      <p class="wiki-text">
        Each <strong>mark</strong> in the game produces a specific <strong>material</strong> over time.
        You can spend materials and <strong>cores</strong> to synthesize and upgrade <strong>laws</strong>,
        which grant permanent buffs to your account.
      </p>
      <p class="wiki-text">
        Materials and cores are farmed passively in real time. Each mark has a base proc rate
        (chance per second). The average time between procs is <code>1 / rate</code>.
        The "Your avg time / mat" column accounts for your current material rate multipliers.
        Cores have a flat generation rate.
      </p>
    </div>

    <div class="card wiki-section">
      <h3>Marks &amp; Materials</h3>
      <div class="scroll-table">
        <table class="wiki-table">
          <thead>
            <tr>
              <th>Mark</th>
              <th>Material</th>
              <th>Rate / sec</th>
              <th>Avg time / proc</th>
              <th>Your avg time / mat</th>
            </tr>
          </thead>
          <tbody>
            ${materials.map(m => {
              const effectiveRate = m.ratePerSecond * (matMult ?? 1);
              return `
              <tr>
                <td>${m.mark}</td>
                <td>${m.material}</td>
                <td>${fmtNum(m.ratePerSecond)}</td>
                <td>${fmtTime(1 / m.ratePerSecond)}</td>
                <td>${fmtTime(1 / effectiveRate)}</td>
              </tr>
            `}).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card wiki-section">
      <h3>Cores</h3>
      <p class="wiki-text">Base core rate: <strong>10 cores every 0.25s</strong> (${fmtNum(getCoreRate())}/s).
      Your beast core rate: <strong>${fmtNum(Math.round(10 * (coreMult ?? 1)))} cores every 0.25s</strong> (${fmtNum(getCoreRate() * (coreMult ?? 1))}/s).</p>
    </div>

    <div class="card wiki-section">
      <h3>Tiers</h3>
      <div class="scroll-table">
        <table class="wiki-table">
          <thead>
            <tr>
              <th>Tier</th>
              <th>Base material per level</th>
              <th>Base cores per level</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries({
              lesser: tiers.lesser,
              greater: tiers.greater,
              origin: tiers.origin,
            }).map(([tier, cfg]) => `
              <tr>
                <td>${tier.charAt(0).toUpperCase() + tier.slice(1)}</td>
                <td>${cfg.baseMaterial}</td>
                <td>${fmtNum(cfg.baseCores)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <p class="wiki-text">Max level: <strong>${tiers.maxLevel}</strong>. Cost at level L: <code>base × (L + 1)</code>. Total to reach level N: <code>base × N × (N + 1) / 2</code>.</p>
    </div>

    <div class="card wiki-section">
      <h3>Laws</h3>
      <div class="scroll-table">
        <table class="wiki-table law-detail-table">
          <thead>
            <tr>
              <th>Law</th>
              <th>Tier</th>
              <th>Materials</th>
              <th>Per-level buffs</th>
              <th>Level 1 cost</th>
              <th>Level 10 total cost</th>
            </tr>
          </thead>
          <tbody>
            ${laws.map(law => {
              const tier = tiers[law.tier];
              const l1mat = law.materials.map(m => `${fmtNum(tier.baseMaterial)} ${m}`).join(', ');
              const l1cores = fmtNum(tier.baseCores);
              const totalFactor = tiers.maxLevel * (tiers.maxLevel + 1) / 2;
              const l10mat = law.materials.map(m => `${fmtNum(tier.baseMaterial * totalFactor)} ${m}`).join(', ');
              const l10cores = fmtNum(tier.baseCores * totalFactor);
              const buffs = Object.entries(law.buffs).map(([k, v]) => {
                let label = k;
                let perLevel = v;
                if (k === 'Breakthrough Cost') {
                  perLevel = v;
                  label = `${k} (×${fmtNum(1 / v)} Qi mult)`;
                }
                return `${label}: ${fmtNum(perLevel)}`;
              }).join('<br>');
              const totalBuffs = Object.entries(law.buffs).map(([k, v]) => {
                let label = k;
                let total = v * tiers.maxLevel;
                if (k === 'Breakthrough Cost') {
                  total = v;
                  label = `${k} (×${fmtNum(1 / v)} Qi mult)`;
                }
                return `${label}: ${fmtNum(total)}`;
              }).join('<br>');
              return `
                <tr>
                  <td><strong>${law.name}</strong></td>
                  <td>${law.tier.charAt(0).toUpperCase() + law.tier.slice(1)}</td>
                  <td>${law.materials.join(', ')}</td>
                  <td class="buffs-cell">${buffs}</td>
                  <td>${l1mat}<br>${l1cores} cores</td>
                  <td>${l10mat}<br>${l10cores} cores</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
