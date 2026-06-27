import { describe, it, expect } from 'vitest';
import { getDeficit, getActualTimeCost, getTotalTimeCost, getFarmingTimeNeeded } from '../src/farming.js';
import { getMaterialRate, getCoreRate } from '../src/data/index.js';

function makeState(materials, cores) {
  return { materials: { ...materials }, cores };
}

describe('getDeficit', () => {
  it('returns zero deficit when state has enough', () => {
    const state = makeState({ Lucent: 100 }, 50000);
    const cost = { materials: [{ name: 'Lucent', qty: 20 }], cores: 25000 };
    const def = getDeficit(state, cost);
    expect(def.materials[0].qty).toBe(0);
    expect(def.cores).toBe(0);
  });

  it('returns correct deficit when state is short', () => {
    const state = makeState({ Lucent: 5 }, 10000);
    const cost = { materials: [{ name: 'Lucent', qty: 20 }], cores: 25000 };
    const def = getDeficit(state, cost);
    expect(def.materials[0].qty).toBe(15);
    expect(def.cores).toBe(15000);
  });
});

describe('getActualTimeCost', () => {
  it('returns 0 when state has all resources', () => {
    const state = makeState({ Lucent: 100 }, 100000);
    const cost = { materials: [{ name: 'Lucent', qty: 5 }], cores: 25000 };
    expect(getActualTimeCost(state, cost)).toBe(0);
  });

  it('computes material farming time for deficit', () => {
    const state = makeState({ Lucent: 0 }, 100000);
    const cost = { materials: [{ name: 'Lucent', qty: 5 }], cores: 25000 };
    const expected = 5 / getMaterialRate('Lucent');
    expect(getActualTimeCost(state, cost)).toBeCloseTo(expected, 2);
  });

  it('includes both material and core deficits', () => {
    const state = makeState({ Lucent: 0 }, 0);
    const cost = { materials: [{ name: 'Lucent', qty: 5 }], cores: 25000 };
    const expected = 5 / getMaterialRate('Lucent') + 25000 / getCoreRate();
    expect(getActualTimeCost(state, cost)).toBeCloseTo(expected, 2);
  });
});

describe('getTotalTimeCost', () => {
  it('equals full cost divided by rates regardless of inventory', () => {
    const state = makeState({ Lucent: 100 }, 200000);
    const cost = { materials: [{ name: 'Lucent', qty: 5 }], cores: 25000 };
    const expected = 5 / getMaterialRate('Lucent') + 25000 / getCoreRate();
    expect(getTotalTimeCost(state, cost)).toBeCloseTo(expected, 2);
  });
});

describe('getFarmingTimeNeeded', () => {
  it('returns both actual and total', () => {
    const state = makeState({ Lucent: 2 }, 10000);
    const cost = { materials: [{ name: 'Lucent', qty: 5 }], cores: 25000 };
    const result = getFarmingTimeNeeded(state, cost);
    expect(result.actual).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(result.actual);
  });
});
