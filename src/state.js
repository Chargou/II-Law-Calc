import { laws as allLaws, materials as allMaterials } from './data/index.js';

export function createState(initialLaws = {}, initialMaterials = {}, initialCores = 0, reincarnation = false, materialRateMult = 1, coreRateMult = 1, ashSecret = false) {
  const lawLevels = {};
  for (const law of allLaws) {
    lawLevels[law.name] = initialLaws[law.name] ?? 0;
  }

  const mats = {};
  for (const mat of allMaterials) {
    mats[mat.material] = initialMaterials[mat.material] ?? 0;
  }

  return {
    laws: lawLevels,
    materials: mats,
    cores: Math.max(0, initialCores),
    reincarnation,
    materialRateMult,
    coreRateMult,
    ashSecret,
  };
}

export function computeMultipliers(state) {
  let matMult = 1;
  let coreMult = 1;
  if (state.reincarnation) { matMult *= 2; coreMult *= 3; }
  if (state.ashSecret) { matMult *= 2; coreMult *= 2; }
  matMult *= (state.materialRateMult ?? 1);
  coreMult *= (state.coreRateMult ?? 1);
  return { matMult, coreMult };
}

export function getLevel(state, lawName) {
  return state.laws[lawName] ?? 0;
}

export function setLevel(state, lawName, level) {
  state.laws[lawName] = Math.max(0, level);
}

export function getMaterial(state, matName) {
  return state.materials[matName] ?? 0;
}

export function addMaterials(state, add) {
  for (const [matName, qty] of Object.entries(add)) {
    state.materials[matName] = (state.materials[matName] || 0) + qty;
  }
}

export function spendMaterials(state, costMaterials) {
  for (const { name, qty } of costMaterials) {
    const have = state.materials[name] || 0;
    if (have < qty) return false;
  }
  for (const { name, qty } of costMaterials) {
    state.materials[name] -= qty;
  }
  return true;
}

export function getCores(state) {
  return state.cores;
}

export function addCores(state, qty) {
  state.cores += Math.max(0, qty);
}

export function spendCores(state, qty) {
  if (state.cores < qty) return false;
  state.cores -= qty;
  return true;
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}
