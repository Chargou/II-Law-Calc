import { getUpgradeCost, isMaxLevel } from './costCalculator.js';
import { getMaterialRate, getCoreRate } from './data/index.js';
import { getLevel, getMaterial, getCores, computeMultipliers } from './state.js';
import { computeTotalGain } from './optimizer.js';

export function analyzeBottleneck(state, path, timeBudgetSeconds, weights, laws) {
  const { matMult, coreMult } = computeMultipliers(state);

  // 1. Walk sequential steps, accumulate resource needs.
  //    At each step, if any resource's deficit time >= budget,
  //    return the closest-to-budget match at that step immediately.
  const cumMats = {};
  let cumCores = 0;

  for (let stepIdx = 0; stepIdx < path.length; stepIdx++) {
    const step = path[stepIdx];
    const cost = step.cost;

    for (const { name, qty } of cost.materials) {
      cumMats[name] = (cumMats[name] || 0) + qty;
    }
    cumCores += cost.cores;

    let bestAtThisStep = null;

    for (const [name, totalQty] of Object.entries(cumMats)) {
      const have = getMaterial(state, name);
      const deficit = Math.max(0, totalQty - have);
      if (deficit <= 0) continue;
      const rate = getMaterialRate(name) * matMult;
      const timeNeeded = deficit / rate;
      if (timeNeeded >= timeBudgetSeconds) {
        bestAtThisStep = pickCloser(bestAtThisStep, { resource: name, type: 'material', deficit, timeNeeded, stepName: path[stepIdx].law.name }, timeBudgetSeconds);
      }
    }

    const coreDeficit = Math.max(0, cumCores - getCores(state));
    if (coreDeficit > 0) {
      const rate = getCoreRate() * coreMult;
      const timeNeeded = coreDeficit / rate;
      if (timeNeeded >= timeBudgetSeconds) {
        bestAtThisStep = pickCloser(bestAtThisStep, { resource: 'cores', type: 'cores', deficit: coreDeficit, timeNeeded, stepName: path[stepIdx].law.name }, timeBudgetSeconds);
      }
    }

    if (bestAtThisStep) {
      return buildResult(bestAtThisStep, timeBudgetSeconds, `Path bottleneck: ${bestAtThisStep.resource} needed for ${bestAtThisStep.stepName}`);
    }
  }

  // 2. No resource fills the budget in the path — collect candidates from path
  //    and zero-score laws, pick the one closest to budget.
  //    If all are below budget, pick the longest.
  let overallBest = collectPathCandidates(cumMats, cumCores, state, matMult, coreMult, timeBudgetSeconds);

  for (const law of laws) {
    const currentLevel = getLevel(state, law.name);
    if (isMaxLevel(law, currentLevel)) continue;
    const gain = computeTotalGain(law, weights);
    if (gain > 0) continue;

    const cost = getUpgradeCost(law, currentLevel);
    for (const { name, qty } of cost.materials) {
      const have = getMaterial(state, name);
      const deficit = Math.max(0, qty - have);
      if (deficit <= 0) continue;
      const rate = getMaterialRate(name) * matMult;
      const timeNeeded = deficit / rate;
      overallBest = pickBetterMatch(overallBest, { resource: name, type: 'material', deficit, timeNeeded, stepName: law.name }, timeBudgetSeconds);
    }

    const coreDeficit = Math.max(0, cost.cores - getCores(state));
    if (coreDeficit > 0) {
      const rate = getCoreRate() * coreMult;
      const timeNeeded = coreDeficit / rate;
      overallBest = pickBetterMatch(overallBest, { resource: 'cores', type: 'cores', deficit: coreDeficit, timeNeeded, stepName: law.name }, timeBudgetSeconds);
    }
  }

  if (overallBest) {
    const source = overallBest.stepName ? `Fallback: ${overallBest.resource} needed for ${overallBest.stepName}` : `Farm ${overallBest.resource}`;
    return buildResult(overallBest, timeBudgetSeconds, source);
  }

  return null;
}

function collectPathCandidates(cumMats, cumCores, state, matMult, coreMult, budget) {
  let best = null;
  for (const [name, totalQty] of Object.entries(cumMats)) {
    const have = getMaterial(state, name);
    const deficit = Math.max(0, totalQty - have);
    if (deficit <= 0) continue;
    const rate = getMaterialRate(name) * matMult;
    const timeNeeded = deficit / rate;
    best = pickBetterMatch(best, { resource: name, type: 'material', deficit, timeNeeded, stepName: null }, budget);
  }
  const coreDeficit = Math.max(0, cumCores - getCores(state));
  if (coreDeficit > 0) {
    const rate = getCoreRate() * coreMult;
    const timeNeeded = coreDeficit / rate;
    best = pickBetterMatch(best, { resource: 'cores', type: 'cores', deficit: coreDeficit, timeNeeded, stepName: null }, budget);
  }
  return best;
}

function pickCloser(current, candidate, budget) {
  if (!current) return candidate;
  return Math.abs(candidate.timeNeeded - budget) < Math.abs(current.timeNeeded - budget) ? candidate : current;
}

function pickBetterMatch(current, candidate, budget) {
  if (!current) return candidate;
  const curScore = matchScore(current.timeNeeded, budget);
  const candScore = matchScore(candidate.timeNeeded, budget);
  return candScore < curScore ? candidate : current;
}

function matchScore(timeNeeded, budget) {
  if (timeNeeded >= budget) {
    return timeNeeded - budget;
  }
  return (budget - timeNeeded) * 10;
}

function buildResult(match, budget, reason) {
  return {
    resource: match.resource,
    type: match.type,
    deficit: match.deficit,
    timeNeeded: match.timeNeeded,
    duration: Math.min(match.timeNeeded, budget),
    reason,
  };
}
