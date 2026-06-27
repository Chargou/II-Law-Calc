import { getMaterialRate, getCoreRate } from './data/index.js';

export function getDeficit(state, cost) {
  const materialDeficits = cost.materials.map(({ name, qty }) => {
    const have = state.materials[name] || 0;
    return {
      name,
      qty: Math.max(0, qty - have),
    };
  });
  const coreDeficit = Math.max(0, cost.cores - state.cores);
  return { materials: materialDeficits, cores: coreDeficit };
}

export function getActualTimeCost(state, cost) {
  const deficit = getDeficit(state, cost);
  let totalSeconds = 0;

  for (const { name, qty } of deficit.materials) {
    if (qty > 0) {
      totalSeconds += qty / getMaterialRate(name);
    }
  }

  if (deficit.cores > 0) {
    totalSeconds += deficit.cores / getCoreRate();
  }

  return totalSeconds;
}

export function getTotalTimeCost(state, cost) {
  let totalSeconds = 0;

  for (const { name, qty } of cost.materials) {
    totalSeconds += qty / getMaterialRate(name);
  }

  totalSeconds += cost.cores / getCoreRate();

  return totalSeconds;
}

export function getFarmingTimeNeeded(state, cost) {
  return {
    actual: getActualTimeCost(state, cost),
    total: getTotalTimeCost(state, cost),
  };
}
