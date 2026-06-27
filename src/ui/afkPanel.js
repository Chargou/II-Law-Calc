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

export function updateAfkPanel(el, afk) {
  if (!afk) {
    el.innerHTML = `
      <div class="card">
        <h3>Long AFK Recommendation</h3>
        <p class="empty-state">Run the optimizer above to see long AFK recommendations.</p>
      </div>
    `;
    return;
  }

  const resourceLabel = afk.type === 'cores' ? 'Cores' : `${afk.resource}`;

  el.innerHTML = `
    <div class="card">
      <h3>Long AFK Recommendation</h3>
      <div class="afk-action">Farm <strong>${resourceLabel}</strong> for <strong>${fmtTime(afk.duration)}</strong></div>
      <div class="upgrade-cost">${fmtNum(afk.deficit)} ${afk.type === 'cores' ? 'cores' : afk.resource} needed (${fmtTime(afk.timeNeeded)} total)</div>
      <div class="afk-reason">${afk.reason}</div>
    </div>
  `;
}
