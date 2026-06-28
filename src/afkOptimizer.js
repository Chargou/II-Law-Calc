import { getUpgradeCost } from './costCalculator.js';
import { getMaterialRate, getCoreRate } from './data/index.js';
import { getLevel, getMaterial, getCores } from './state.js';

export function analyzeBottleneck(state, path, timeBudgetSeconds) {
  const resourceNeeds = {};

  for (let stepIdx = 0; stepIdx < path.length; stepIdx++) {
    const step = path[stepIdx];
    const cost = getUpgradeCost(step.law, step.fromLevel);

    for (const { name, qty } of cost.materials) {
      if (!resourceNeeds[name]) {
        resourceNeeds[name] = { totalQty: 0, earliestStep: -1, type: 'material' };
      }
      resourceNeeds[name].totalQty += qty;
      if (resourceNeeds[name].earliestStep === -1) {
        const have = getMaterial(state, name);
        if (resourceNeeds[name].totalQty > have) {
          resourceNeeds[name].earliestStep = stepIdx;
        }
      }
    }

    if (!resourceNeeds['_cores']) {
      resourceNeeds['_cores'] = { totalQty: 0, earliestStep: -1, type: 'cores' };
    }
    resourceNeeds['_cores'].totalQty += cost.cores;
    if (resourceNeeds['_cores'].earliestStep === -1 && resourceNeeds['_cores'].totalQty > state.cores) {
      resourceNeeds['_cores'].earliestStep = stepIdx;
    }
  }

  const bottlenecks = [];

  for (const [name, info] of Object.entries(resourceNeeds)) {
    if (info.earliestStep === -1) continue;

    let deficit;
    if (info.type === 'cores') {
      deficit = Math.max(0, info.totalQty - state.cores);
    } else {
      deficit = Math.max(0, info.totalQty - getMaterial(state, name));
    }

    if (deficit <= 0) continue;

    const mult = state.reincarnation ? (info.type === 'cores' ? 3 : 2) : 1;
    const rate = (info.type === 'cores' ? getCoreRate() : getMaterialRate(name)) * mult;
    const timeNeeded = deficit / rate;

    bottlenecks.push({
      name: info.type === 'cores' ? 'cores' : name,
      type: info.type,
      deficit,
      timeNeeded,
      earliestStep: info.earliestStep,
    });
  }

  if (bottlenecks.length === 0) return null;

  const minNeed = bottlenecks.reduce((a, b) => a.timeNeeded < b.timeNeeded ? a : b);
  let best;
  if (timeBudgetSeconds >= minNeed.timeNeeded) {
    best = bottlenecks.reduce((a, b) => a.timeNeeded > b.timeNeeded ? a : b);
  } else {
    best = bottlenecks.reduce((a, b) => a.earliestStep < b.earliestStep ? a : b);
  }

  return {
    resource: best.name,
    type: best.type,
    deficit: best.deficit,
    timeNeeded: best.timeNeeded,
    duration: Math.min(best.timeNeeded, timeBudgetSeconds),
    reason: `Earliest bottleneck: ${best.name} needed for ${path[best.earliestStep].law.name} (${Math.round(best.timeNeeded)}s needed, ${Math.round(timeBudgetSeconds)}s budget)`,
  };
}
