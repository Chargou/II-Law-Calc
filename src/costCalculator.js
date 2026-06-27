import { getTierConfig, getMaxLevel } from './data/index.js';

export function getUpgradeCost(law, currentLevel) {
  const tier = getTierConfig(law.tier);
  const levelFactor = currentLevel + 1;
  const materials = law.materials.map(name => ({
    name,
    qty: tier.baseMaterial * levelFactor,
  }));
  return {
    materials,
    cores: tier.baseCores * levelFactor,
  };
}

export function canAfford(state, cost) {
  for (const { name, qty } of cost.materials) {
    if ((state.materials[name] || 0) < qty) return false;
  }
  if ((state.cores || 0) < cost.cores) return false;
  return true;
}

export function totalCost(law, fromLevel, toLevel) {
  const tier = getTierConfig(law.tier);
  const sum = toLevel * (toLevel + 1) - fromLevel * (fromLevel + 1);
  const factor = sum / 2;
  return {
    materials: law.materials.map(name => ({
      name,
      qty: tier.baseMaterial * factor,
    })),
    cores: tier.baseCores * factor,
  };
}

export function isMaxLevel(law, currentLevel) {
  return currentLevel >= getMaxLevel();
}
