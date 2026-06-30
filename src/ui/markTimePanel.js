import { computeMarkTime, formatDuration } from '../markTime.js';
import * as BN from '../bigNum.js';

function detectDisplayStyle(str) {
  if (!str) return 'auto';
  const s = String(str).trim();
  if (/^[\d.]+e[+-]?\d+$/i.test(s)) return 'scientific';
  return 'suffixed';
}

function formatBnWithStyle(bn, style) {
  if (style === 'scientific') {
    let m = bn.mantissa, e = bn.exponent;
    if (Number.isNaN(m) || m === 0) return BN.toString(bn);
    while (Math.abs(m) >= 10) { m /= 10; e++; }
    while (Math.abs(m) < 1) { m *= 10; e--; }
    return m.toPrecision(4) + 'e' + e;
  }
  return BN.toString(bn);
}

export function renderMarkTimePanel(rootEl) {
  rootEl.innerHTML = `
    <div class="card">
      <h3>Mark Time Estimator</h3>
      <p class="wiki-text">Estimate the expected time to farm a target amount of a specific mark.</p>
      <div class="input-group">
        <label for="mt-mps">MPS</label>
        <input type="text" id="mt-mps" class="mt-mps" value="1" />
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
            <label for="mt-progress">Total opens (all time)</label>
            <input type="text" id="mt-progress" class="mt-progress" />
          </div>
          <div id="mt-milestone-info" class="wiki-text" style="margin-top:8px;font-size:0.85rem;color:#8b949e"></div>
        </div>
      </details>
      <div id="mt-result" style="margin-top:16px;padding-top:12px;border-top:1px solid #30363d">
        <p class="empty-state">Enter values and press Compute.</p>
      </div>
    </div>
    <div class="card">
      <h3>Milestone Progression</h3>
      <div class="input-group">
        <label for="mt-mps2">MPS</label>
        <input type="text" id="mt-mps2" class="mt-mps" value="1" />
      </div>
      <div class="input-group">
        <label for="mt-progress2">Total opens</label>
        <input type="text" id="mt-progress2" class="mt-progress" />
      </div>
      <div class="input-group" style="margin-top:12px">
        <label for="mt-duration">Duration</label>
        <input type="text" id="mt-duration" placeholder="e.g. 2h30m or 1:30:00" />
      </div>
      <div id="mt-result-time" class="mt-sub-result" style="margin-top:8px;min-height:1.2em"></div>
      <div class="input-group" style="margin-top:16px">
        <label for="mt-target-tier">Target tier</label>
        <input type="number" id="mt-target-tier" min="0" step="1" />
      </div>
      <div id="mt-result-goal" class="mt-sub-result" style="margin-top:8px;padding-top:8px;border-top:1px solid #30363d;min-height:1.2em"></div>
    </div>
  `;

  const mps = rootEl.querySelector('#mt-mps');
  const rarity = rootEl.querySelector('#mt-rarity');
  const clone = rootEl.querySelector('#mt-clone');
  const target = rootEl.querySelector('#mt-target');
  const progress = rootEl.querySelector('#mt-progress');
  const resultEl = rootEl.querySelector('#mt-result');
  const milestoneInfoEl = rootEl.querySelector('#mt-milestone-info');

  const durationInput = rootEl.querySelector('#mt-duration');
  const targetTierInput = rootEl.querySelector('#mt-target-tier');
  const resultTimeEl = rootEl.querySelector('#mt-result-time');
  const resultGoalEl = rootEl.querySelector('#mt-result-goal');

  const MARK_TIME_KEY = 'ii-law-calc-mark-time';

  function setInputVal(input, val) {
    if (val !== undefined && val !== null) input.value = val;
  }

  function loadMarkTime() {
    try { return JSON.parse(localStorage.getItem(MARK_TIME_KEY)) || {}; } catch { return {}; }
  }

  function saveMarkTime(obj) {
    const current = loadMarkTime();
    localStorage.setItem(MARK_TIME_KEY, JSON.stringify({ ...current, ...obj }));
  }

  const saved = loadMarkTime();
  setInputVal(mps, saved['mt-mps'] || saved['mt-mps2']);
  setInputVal(rarity, saved.rarity);
  setInputVal(clone, saved.clone);
  setInputVal(target, saved.target);
  setInputVal(progress, saved['mt-progress'] || saved['mt-progress2']);
  setInputVal(durationInput, saved.duration);
  setInputVal(targetTierInput, saved.targetTier);

  // Sync linked inputs after loading
  document.querySelectorAll('.mt-mps').forEach(el => { if (el !== mps) el.value = mps.value; });
  document.querySelectorAll('.mt-progress').forEach(el => { if (el !== progress) el.value = progress.value; });
  updateMilestoneInfo();

  function milestoneAt(tier) {
    return BN.mul(BN.fromString('10000'), BN.pow(BN.fromString('1.45'), tier));
  }

  function deriveMilestoneFromProgress(totalOpens) {
    const totalBN = BN.fromString(String(totalOpens));
    if (totalBN.mantissa === 0) return { tier: 0, progress: BN.fromNumber(0), needed: BN.fromString('10000') };
    const logRatio = Math.log10(1.45);
    let T = Math.max(-1, Math.floor(BN.log10(BN.div(totalBN, BN.fromString('10000'))) / logRatio));
    if (T < 0) return { tier: 0, progress: totalBN, needed: BN.fromString('10000') };
    let msT = milestoneAt(T);
    while (BN.cmp(msT, totalBN) > 0 && T > 0) { T--; msT = milestoneAt(T); }
    let msT1 = milestoneAt(T + 1);
    while (BN.cmp(msT1, totalBN) <= 0) { T++; msT = msT1; msT1 = milestoneAt(T + 1); }
    return { tier: T + 1, progress: totalBN, needed: msT1 };
  }

  function findCurrentTier(totalOpens) {
    if (totalOpens.mantissa === 0) return 0;
    const logRatio = Math.log10(1.45);
    let T = Math.max(0, Math.floor(BN.log10(BN.div(totalOpens, BN.fromString('10000'))) / logRatio) + 1);
    let mt = milestoneAt(T);
    while (BN.cmp(mt, totalOpens) <= 0) { T++; mt = BN.mul(mt, BN.fromString('1.45')); }
    while (T > 0 && BN.cmp(milestoneAt(T - 1), totalOpens) > 0) T--;
    return T;
  }

  function updateMilestoneInfo() {
    if (!progress.value) { milestoneInfoEl.textContent = ''; return; }
    const info = deriveMilestoneFromProgress(progress.value);
    const boost = BN.pow(BN.fromString('1.1'), info.tier);
    milestoneInfoEl.innerHTML = `Tier <strong>${info.tier}</strong> &middot; Boost: <strong>${BN.toString(boost)}</strong> &middot; Opens: <strong>${BN.toString(info.progress)}</strong> / <strong>${BN.toString(info.needed)}</strong>`;
  }

  function parseDuration(str) {
    if (!str) return NaN;
    const s = String(str).trim();
    if (!s) return NaN;

    if (s.includes(':')) {
      const parts = s.split(':');
      const nums = parts.map(p => parseFloat(p) || 0);
      if (nums.length === 2) return nums[0] * 60 + nums[1];
      if (nums.length === 3) return nums[0] * 3600 + nums[1] * 60 + nums[2];
    }

    let secs = 0;
    let m;
    if ((m = s.match(/([\d.]+)\s*h/i))) secs += parseFloat(m[1]) * 3600;
    if ((m = s.match(/([\d.]+)\s*m/i))) secs += parseFloat(m[1]) * 60;
    if ((m = s.match(/([\d.]+)\s*s/i))) secs += parseFloat(m[1]);
    if (secs > 0) return secs;

    return parseFloat(s) || NaN;
  }

  function computeForward(mpsStr, progressStr, durationSec) {
    const mpsBN = BN.fromString(mpsStr || '1');
    let totalOpens = BN.fromString(String(progressStr || '0'));
    let curTier = findCurrentTier(totalOpens);
    let bulkBoost = BN.fromNumber(1);
    let remainingSecs = BN.fromNumber(durationSec || 0);

    let milestoneThresh = milestoneAt(curTier);
    let opensToNext = BN.sub(milestoneThresh, totalOpens);

    while (BN.cmp(remainingSecs, BN.fromNumber(0)) > 0) {
      const effectiveMPS = BN.mul(mpsBN, bulkBoost);
      const timeToMilestone = BN.div(opensToNext, effectiveMPS);

      if (BN.cmp(timeToMilestone, remainingSecs) > 0) {
        totalOpens = BN.add(totalOpens, BN.mul(effectiveMPS, remainingSecs));
        remainingSecs = BN.fromNumber(0);
      } else {
        totalOpens = milestoneThresh;
        remainingSecs = BN.sub(remainingSecs, timeToMilestone);
        curTier++;
        bulkBoost = BN.mul(bulkBoost, BN.fromString('1.1'));
        milestoneThresh = BN.mul(milestoneThresh, BN.fromString('1.45'));
        opensToNext = BN.sub(milestoneThresh, totalOpens);
      }
    }

    return { totalOpens, curTier, finalMps: BN.mul(mpsBN, bulkBoost) };
  }

  function computeToGoal(mpsStr, progressStr, targetTier) {
    const mpsBN = BN.fromString(mpsStr || '1');
    let totalOpens = BN.fromString(String(progressStr || '0'));
    let curTier = findCurrentTier(totalOpens);
    let bulkBoost = BN.fromNumber(1);
    let totalTime = BN.fromNumber(0);

    let milestoneThresh = milestoneAt(curTier);
    let opensToNext = BN.sub(milestoneThresh, totalOpens);

    while (curTier < targetTier) {
      const effectiveMPS = BN.mul(mpsBN, bulkBoost);
      totalTime = BN.add(totalTime, BN.div(opensToNext, effectiveMPS));
      totalOpens = milestoneThresh;
      curTier++;
      bulkBoost = BN.mul(bulkBoost, BN.fromString('1.1'));
      milestoneThresh = BN.mul(milestoneThresh, BN.fromString('1.45'));
      opensToNext = BN.sub(milestoneThresh, totalOpens);
    }

    return { totalTime, curTier, finalMps: BN.mul(mpsBN, bulkBoost) };
  }

  function compute() {
    const mpsStyle = detectDisplayStyle(mps.value);
    const result = computeMarkTime({
      mps: mps.value || '1',
      rarity: rarity.value || '1',
      clone: clone.value || '1',
      target: target.value || '1',
      tier: progress.value ? String(findCurrentTier(BN.fromString(progress.value))) : undefined,
      progress: progress.value,
    });
    const duration = formatDuration(result.seconds);
    let html = `<p class="afk-action"><strong>Expected time:</strong> ${duration}</p>`;
    if (result.tiersCrossed > 0) {
      html += `<p class="afk-reason" style="margin-top:6px">Will cross <strong>${result.tiersCrossed}</strong> milestone tier${result.tiersCrossed !== 1 ? 's' : ''}. Final MPS: <strong>${formatBnWithStyle(result.finalMps, mpsStyle)}</strong></p>`;
    }
    resultEl.innerHTML = html;
  }

  function computeForTime() {
    if (!durationInput.value || !durationInput.value.trim()) { resultTimeEl.textContent = ''; return; }
    const dur = parseDuration(durationInput.value);
    if (isNaN(dur) || dur <= 0) { resultTimeEl.innerHTML = '<span style="color:#f85149">Invalid duration.</span>'; return; }
    const r = computeForward(mps.value, progress.value, dur);
    const mpsStr = BN.toString(r.finalMps);
    resultTimeEl.innerHTML = `After <strong>${formatDuration(BN.fromNumber(dur))}</strong>: <strong>${BN.toString(r.totalOpens)}</strong> total opens, tier <strong>${r.curTier}</strong>. Final MPS: <strong>${mpsStr}</strong>`;
  }

  function computeForGoal() {
    if (targetTierInput.value === '' || targetTierInput.value === undefined) { resultGoalEl.textContent = ''; return; }
    const target = parseInt(targetTierInput.value, 10);
    if (isNaN(target) || target < 0) { resultGoalEl.innerHTML = '<span style="color:#f85149">Invalid target tier.</span>'; return; }
    const curTier = findCurrentTier(BN.fromString(String(progress.value || '0')));
    if (target <= curTier) { resultGoalEl.innerHTML = '<span style="color:#f85149">Target tier must exceed current tier.</span>'; return; }
    const r = computeToGoal(mps.value, progress.value, target);
    resultGoalEl.innerHTML = `Time to reach tier <strong>${target}</strong>: <strong>${formatDuration(r.totalTime)}</strong>. Final MPS: <strong>${BN.toString(r.finalMps)}</strong>`;
  }

  function syncInputs() {
    const val = this.value;
    const isMps = this.classList.contains('mt-mps');
    document.querySelectorAll(isMps ? '.mt-mps' : '.mt-progress').forEach(el => {
      if (el !== this) el.value = val;
    });
    if (!isMps) updateMilestoneInfo();
    saveMarkTime({ [this.id]: val });
    recomputeAll();
  }

  function onInputAndSave(inp, key) {
    inp.addEventListener('input', () => saveMarkTime({ [key]: inp.value }));
  }

  function recomputeAll() {
    compute();
    computeForTime();
    computeForGoal();
  }

  document.querySelectorAll('.mt-mps, .mt-progress').forEach(inp => inp.addEventListener('input', syncInputs));
  onInputAndSave(rarity, 'rarity');
  onInputAndSave(clone, 'clone');
  onInputAndSave(target, 'target');
  rarity.addEventListener('input', compute);
  clone.addEventListener('input', compute);
  target.addEventListener('input', compute);
  onInputAndSave(durationInput, 'duration');
  durationInput.addEventListener('input', computeForTime);
  onInputAndSave(targetTierInput, 'targetTier');
  targetTierInput.addEventListener('input', computeForGoal);

  rootEl.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') recomputeAll();
    });
  });

  recomputeAll();
}
