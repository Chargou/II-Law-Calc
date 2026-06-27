import { describe, it, expect } from 'vitest';
import { analyzeBottleneck } from '../src/afkOptimizer.js';
import { createState, getLevel, getMaterial, getCores } from '../src/state.js';
import { getUpgradePath } from '../src/optimizer.js';
import { laws } from '../src/data/index.js';

const QI = { Qi: 1 };

describe('analyzeBottleneck', () => {
  it('returns a recommendation when there are resource deficits', () => {
    const state = createState({}, {}, 50000);
    const path = getUpgradePath(state, QI, laws);
    expect(path.length).toBeGreaterThan(0);

    const rec = analyzeBottleneck(state, path, 7200);
    expect(rec).not.toBeNull();
    expect(rec.resource).toBeDefined();
    expect(rec.duration).toBeGreaterThan(0);
    expect(rec.reason).toContain(rec.resource);
  });

  it('returns null when state has enough resources', () => {
    const state = createState({}, {}, 10000000);
    const path = getUpgradePath(state, QI, laws);
    // Add enough materials for all steps
    for (const step of path) {
      for (const { name, qty } of step.cost.materials) {
        state.materials[name] = (state.materials[name] || 0) + qty;
      }
    }
    state.cores = 100000000;

    const rec = analyzeBottleneck(state, path, 7200);
    expect(rec).toBeNull();
  });

  it('duration does not exceed time budget', () => {
    const state = createState({}, {}, 0);
    const path = getUpgradePath(state, QI, laws);
    const budget = 1800;
    const rec = analyzeBottleneck(state, path, budget);
    if (rec) {
      expect(rec.duration).toBeLessThanOrEqual(budget + 0.01);
    }
  });
});
