import lawsData from '../../data/laws.json';
import materialsData from '../../data/materials.json';
import tiersData from '../../data/tiers.json';

export const laws = lawsData;
export const materials = materialsData;
export const tiers = tiersData;

export function getLaw(name) {
  return laws.find(l => l.name === name);
}

export function getTierConfig(tier) {
  return tiers[tier];
}

export function getMaterialRate(matName) {
  const entry = materials.find(m => m.material === matName);
  return entry ? entry.ratePerSecond : 0;
}

export function getMaterialMark(matName) {
  const entry = materials.find(m => m.material === matName);
  return entry ? entry.mark : matName;
}

export function getCoreRate() {
  return tiers.coreRatePerSecond;
}

export function getMaxLevel() {
  return tiers.maxLevel;
}
