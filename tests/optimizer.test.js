import { describe, it, expect } from 'vitest';
import { findBestNextUpgrade, getUpgradePath } from '../src/optimizer.js';
import { laws } from '../src/data/index.js';
import { createState, getLevel, getMaterial } from '../src/state.js';

const QI = { Qi: 1 };

describe('findBestNextUpgrade', () => {
  it('returns an upgrade for Qi weight', () => {
    const state = createState({}, {}, 500000);
    const best = findBestNextUpgrade(state, QI, laws);
    expect(best).not.toBeNull();
    expect(best.law).toBeDefined();
    expect(best.totalGain).toBeGreaterThan(0);
    expect(best.timeCost).toBeGreaterThan(0);
  });

  it('returns law that buffs the chosen metric', () => {
    const state = createState({}, {}, 500000);
    const best = findBestNextUpgrade(state, QI, laws);
    expect(best.law.buffs.Qi).toBeDefined();
  });

  it('returns null when all weights are zero', () => {
    const state = createState({}, {}, 500000);
    const best = findBestNextUpgrade(state, { Qi: 0, Divinity: 0, Citizens: 0, Damage: 0, 'Manual Luck': 0, 'Disciple Luck': 0, Remnants: 0 }, laws);
    expect(best).toBeNull();
  });

  it('skips maxed out laws', () => {
    const maxedLaws = {};
    for (const law of laws) maxedLaws[law.name] = 10;
    const state = createState(maxedLaws, {}, 500000);
    const best = findBestNextUpgrade(state, QI, laws);
    expect(best).toBeNull();
  });
});

describe('getUpgradePath', () => {
  it('returns a sequence of upgrades for Qi weight', () => {
    const state = createState({}, {}, 10000000);
    const path = getUpgradePath(state, QI, laws);
    expect(path.length).toBeGreaterThan(0);
    for (const step of path) {
      expect(step.law).toBeDefined();
      expect(step.fromLevel).toBeDefined();
      expect(step.toLevel).toBe(step.fromLevel + 1);
      expect(step.totalGain).toBeGreaterThan(0);
    }
  });

  it('respects maxTime filter', () => {
    const state = createState({}, {}, 10000000);
    const fullPath = getUpgradePath(state, QI, laws);
    const shortPath = getUpgradePath(state, QI, laws, 3600);
    expect(shortPath.length).toBeLessThanOrEqual(fullPath.length);
  });

  it('upgrades sequentially (level increases)', () => {
    const state = createState({}, {}, 10000000);
    const path = getUpgradePath(state, QI, laws);
    const lawLevels = {};
    for (const step of path) {
      const name = step.law.name;
      lawLevels[name] = (lawLevels[name] || 0) + 1;
      expect(step.toLevel).toBe(step.fromLevel + 1);
    }
  });

  it('still returns path when state has low resources (positive time cost is fine)', () => {
    const state = createState({}, {}, 0);
    const path = getUpgradePath(state, QI, laws);
    expect(path.length).toBeGreaterThan(0);
  });
});
