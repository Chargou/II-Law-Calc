import { getUpgradeCost, isMaxLevel } from './costCalculator.js';
import { getActualTimeCost, getTotalTimeCost } from './farming.js';
import { getLevel, setLevel, cloneState } from './state.js';
import { getMaxLevel, getMaterialRate, getCoreRate, getMaterialMark } from './data/index.js';

export const ALL_METRICS = ['Qi', 'Divinity', 'Citizens', 'Damage', 'Manual Luck', 'Disciple Luck', 'Remnants'];

function computeEffectiveGain(law, metric) {
  let gain = law.buffs[metric] ?? 0;
  if (metric === 'Qi' && law.buffs['Breakthrough Cost']) {
    gain *= (1 / law.buffs['Breakthrough Cost']);
  }
  return gain;
}

function computeTotalGain(law, weights) {
  let total = 0;
  for (const metric of ALL_METRICS) {
    const w = weights[metric] || 0;
    if (w <= 0) continue;
    total += computeEffectiveGain(law, metric) * w;
  }
  return total;
}

export function findBestNextUpgrade(state, weights, laws, timeMode = 'total') {
  let best = null;

  for (const law of laws) {
    const currentLevel = getLevel(state, law.name);
    if (isMaxLevel(law, currentLevel)) continue;

    const totalGain = computeTotalGain(law, weights);
    if (totalGain <= 0) continue;

    const cost = getUpgradeCost(law, currentLevel);
    const totalTime = getTotalTimeCost(state, cost);
    const actualTime = getActualTimeCost(state, cost);
    const timeCost = timeMode === 'actual' ? actualTime : totalTime;

    let score;
    if (timeCost <= 0) {
      score = 1e15 * totalGain + totalGain / (totalTime || 0.001);
    } else {
      score = totalGain / timeCost;
    }

    if (!best || score > best.score) {
      best = { law, totalGain, timeCost, cost, fromLevel: currentLevel, toLevel: currentLevel + 1, score };
    }
  }

  return best;
}

function applyUpgrade(state, upgrade) {
  const cost = upgrade.cost;
  for (const { name, qty } of cost.materials) {
    const have = state.materials[name] || 0;
    state.materials[name] = have - qty;
  }
  state.cores -= cost.cores;
  setLevel(state, upgrade.law.name, upgrade.toLevel);
}

export function getUpgradePath(state, weights, laws, maxTime, timeMode = 'total') {
  const simState = cloneState(state);
  const path = [];

  while (true) {
    const best = findBestNextUpgrade(simState, weights, laws, timeMode);
    if (!best) break;
    if (maxTime !== undefined && best.timeCost > maxTime) break;

    applyUpgrade(simState, best);
    path.push(best);
  }

  return path;
}

export function computeStepDeficits(state, path) {
  const cumMats = {};
  let cumCores = 0;

  const matMult = state.reincarnation ? 2 : 1;
  const coreMult = state.reincarnation ? 3 : 1;

  return path.map((step) => {
    for (const { name, qty } of step.cost.materials) {
      cumMats[name] = (cumMats[name] || 0) + qty;
    }
    cumCores += step.cost.cores;

    const farmSteps = [];

    const materialDeficits = step.cost.materials.map(({ name, qty }) => {
      const totalNeeded = cumMats[name];
      const have = state.materials[name] || 0;
      const remainingAfterPrev = have - (totalNeeded - qty);
      const deficit = Math.max(0, qty - Math.max(0, remainingAfterPrev));
      const rate = getMaterialRate(name) * matMult;
      const mark = getMaterialMark(name);
      if (deficit > 0) {
        farmSteps.push({ type: 'material', resource: name, mark, deficit, rate, duration: deficit / rate });
      }
      return { name, needed: qty, have: Math.max(0, remainingAfterPrev), deficit, rate, mark, timeSeconds: deficit > 0 ? deficit / rate : 0 };
    });

    const coresAfterPrev = state.cores - (cumCores - step.cost.cores);
    const coreDeficit = Math.max(0, step.cost.cores - Math.max(0, coresAfterPrev));
    const coreTime = coreDeficit > 0 ? coreDeficit / (getCoreRate() * coreMult) : 0;
    if (coreDeficit > 0) {
      farmSteps.push({ type: 'cores', deficit: coreDeficit, duration: coreTime });
    }

    return { ...step, deficits: { materials: materialDeficits, cores: coreDeficit, coreTime, farmSteps } };
  });
}
