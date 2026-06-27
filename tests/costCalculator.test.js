import { describe, it, expect } from 'vitest';
import { getUpgradeCost, canAfford, totalCost, isMaxLevel } from '../src/costCalculator.js';
import { getLaw } from '../src/data/index.js';

describe('getUpgradeCost', () => {
  it('returns correct cost for lesser law level 0→1', () => {
    const law = getLaw('Perception');
    const cost = getUpgradeCost(law, 0);
    expect(cost.materials).toHaveLength(1);
    expect(cost.materials[0]).toEqual({ name: 'Lucent', qty: 5 });
    expect(cost.cores).toBe(25000);
  });

  it('scales by level factor (n+1)', () => {
    const law = getLaw('Perception');
    const cost = getUpgradeCost(law, 3);
    expect(cost.materials[0].qty).toBe(20);
    expect(cost.cores).toBe(100000);
  });

  it('returns materials for greater law with 2 materials', () => {
    const law = getLaw('Alacrity');
    const cost = getUpgradeCost(law, 0);
    expect(cost.materials).toHaveLength(2);
    expect(cost.materials[0]).toEqual({ name: 'Kismet', qty: 10 });
    expect(cost.materials[1]).toEqual({ name: 'Morrow', qty: 10 });
    expect(cost.cores).toBe(50000);
  });

  it('returns materials for origin law', () => {
    const law = getLaw('Time');
    const cost = getUpgradeCost(law, 0);
    expect(cost.materials).toHaveLength(2);
    expect(cost.materials[0].qty).toBe(15);
    expect(cost.cores).toBe(100000);
  });
});

describe('canAfford', () => {
  it('returns true when state has sufficient resources', () => {
    const state = { materials: { Lucent: 50 }, cores: 100000 };
    const cost = { materials: [{ name: 'Lucent', qty: 5 }], cores: 25000 };
    expect(canAfford(state, cost)).toBe(true);
  });

  it('returns false when materials insufficient', () => {
    const state = { materials: { Lucent: 3 }, cores: 100000 };
    const cost = { materials: [{ name: 'Lucent', qty: 5 }], cores: 25000 };
    expect(canAfford(state, cost)).toBe(false);
  });

  it('returns false when cores insufficient', () => {
    const state = { materials: { Lucent: 50 }, cores: 10000 };
    const cost = { materials: [{ name: 'Lucent', qty: 5 }], cores: 25000 };
    expect(canAfford(state, cost)).toBe(false);
  });
});

describe('totalCost', () => {
  it('computes cumulative cost from level 0 to 3', () => {
    const law = getLaw('Illusion');
    const cost = totalCost(law, 0, 3);
    expect(cost.materials[0]).toEqual({ name: 'Ichor', qty: 30 });
    expect(cost.cores).toBe(150000);
  });

  it('computes cost from level 2 to 5', () => {
    const law = getLaw('Anima');
    const cost = totalCost(law, 2, 5);
    expect(cost.materials[0].qty).toBe(60);
    expect(cost.cores).toBe(300000);
  });
});

describe('isMaxLevel', () => {
  it('returns true at max level', () => {
    const law = getLaw('Perception');
    expect(isMaxLevel(law, 10)).toBe(true);
  });

  it('returns false below max level', () => {
    const law = getLaw('Perception');
    expect(isMaxLevel(law, 9)).toBe(false);
  });
});
