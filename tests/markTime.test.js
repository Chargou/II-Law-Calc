import { describe, it, expect } from 'vitest';
import { computeMarkTime, formatDuration } from '../src/markTime.js';
import * as BN from '../src/bigNum.js';

function bn(m, e) {
  return { mantissa: m, exponent: e };
}

describe('computeMarkTime — no milestones', () => {
  it('basic case', () => {
    const r = computeMarkTime({ mps: '10', rarity: '2', clone: '1', target: '5' });
    expect(BN.toNumber(r.seconds)).toBeCloseTo(1, 5);
    expect(r.tiersCrossed).toBe(0);
  });

  it('with clone > 1', () => {
    const r = computeMarkTime({ mps: '10', rarity: '2', clone: '3', target: '5' });
    // effTarget = ceil(5/3) = 2, time = 2*2/10 = 0.4
    expect(BN.toNumber(r.seconds)).toBeCloseTo(0.4, 5);
  });

  it('clone > target → one proc', () => {
    const r = computeMarkTime({ mps: '10', rarity: '2', clone: '17', target: '1' });
    // effTarget = ceil(1/17) = 1, time = 1*2/10 = 0.2
    expect(BN.toNumber(r.seconds)).toBeCloseTo(0.2, 5);
  });

  it('large rarity', () => {
    const r = computeMarkTime({ mps: '1', rarity: '1e6', clone: '1', target: '1' });
    // time = 1 * 1e6 / 1 = 1e6
    expect(BN.toNumber(r.seconds)).toBeCloseTo(1e6, 5);
  });

  it('suffix notation inputs', () => {
    const r = computeMarkTime({ mps: '5k', rarity: '2', clone: '1', target: '1' });
    // time = 1 * 2 / 5000 = 0.0004
    expect(BN.toNumber(r.seconds)).toBeCloseTo(0.0004, 6);
  });

  it('time less than 1 second', () => {
    const r = computeMarkTime({ mps: '1000', rarity: '2', clone: '1', target: '1' });
    expect(BN.cmp(r.seconds, bn(1, 0))).toBe(-1);
  });

  it('time more than a year', () => {
    const r = computeMarkTime({ mps: '1', rarity: '1e12', clone: '1', target: '1' });
    // time = 1e12 seconds ≈ 31710 years
    expect(formatDuration(r.seconds)).toMatch(/^Time longer than a year/);
  });

  it('instant result from fast compute', () => {
    const r = computeMarkTime({ mps: '1e9', rarity: '1', clone: '1', target: '1' });
    // time = 1/1e9 = 1e-9 seconds → Instant
    expect(formatDuration(r.seconds)).toBe('Instant');
  });

  it('handles NaN inputs', () => {
    const r = computeMarkTime({ mps: 'abc', rarity: '2', clone: '1', target: '5' });
    expect(r.seconds.mantissa).toBeNaN();
  });
});

describe('computeMarkTime — with milestones', () => {
  it('no milestone crossing, small target', () => {
    const r = computeMarkTime({ mps: '1000', rarity: '1', clone: '1', target: '10', tier: '0', progress: '0' });
    // tier=0, bulkBoost=1, milestoneTarget=10000*1.45^1=14500
    // effTarget=10, remaining=10, opensToMilestone=14500, opensThisStep=10
    // time = 10*1/(1000*1) = 0.01
    expect(BN.toNumber(r.seconds)).toBeCloseTo(0.01, 5);
    expect(r.tiersCrossed).toBe(0);
  });

  it('crosses one milestone during session', () => {
    const r = computeMarkTime({ mps: '1000', rarity: '1', clone: '1', target: '20000', tier: '0', progress: '0' });
    // tier=0, bulkBoost=1, milestone0=14500
    // step1: opensToMilestone=14500, opensThisStep=14500, time1=14500/(1000*1)=14.5s, remaining=5500
    // milestone reached: tier=1, bulkBoost=1.1, milestone1=14500*1.45=21025
    // step2: opensToMilestone=21025, opensThisStep=5500, time2=5500/(1000*1.1)=5s
    // total=19.5s, tiersCrossed=1
    expect(BN.toNumber(r.seconds)).toBeCloseTo(19.5, 4);
    expect(r.tiersCrossed).toBe(1);
    // finalMps = 1000 * 1.1^1 = 1100
    expect(BN.toNumber(r.finalMps)).toBeCloseTo(1100, 5);
  });

  it('crosses multiple milestones', () => {
    const r = computeMarkTime({ mps: '1000', rarity: '1', clone: '1', target: '50000', tier: '0', progress: '0' });
    // tier=0: milestone=14500, step1 opens=14500, time1=14.5
    // tier=1: milestone=21025, step2 opens=21025, time2=21025/1100=19.1136...
    // tier=2: milestone~30486, remaining=50000-14500-21025=14475, opensThisStep=14475, time3=14475/(1000*1.21)=11.963...
    // total~45.58s, tiersCrossed=2
    expect(r.tiersCrossed).toBe(2);
    expect(BN.toNumber(r.finalMps)).toBeCloseTo(1000 * 1.1 * 1.1, 5);
  });

  it('pre-skip: instant tier advance at start', () => {
    const r = computeMarkTime({ mps: '1000', rarity: '1', clone: '1', target: '10', tier: '0', progress: '20000' });
    // tier=0, milestoneTarget=14500, progress=20000 >= 14500
    // pre-skip: accumulated=20000-14500=5500, tier=1, bulkBoost=1.1, milestoneTarget=14500*1.45=21025
    // remaining=10, opensToMilestone=21025-5500=15525, opensThisStep=10
    // time = 10*1/(1000*1.1) = 0.00909...
    expect(r.tiersCrossed).toBe(1);
    expect(BN.toNumber(r.seconds)).toBeCloseTo(0.0090909, 4);
  });

  it('multiple pre-skips', () => {
    // progress so large it skips multiple tiers immediately
    const r = computeMarkTime({ mps: '1000', rarity: '1', clone: '1', target: '10', tier: '0', progress: '50000' });
    // tier=0 milestone=14500, skip: accumulated=50000-14500=35500, tier=1
    // tier=1 milestone=21025, skip: accumulated=35500-21025=14475, tier=2
    // tier=2 milestone=30486 (14500*1.45^2), progress=14475 < 30486, no more skip
    // remaining=10, opensToMilestone=30486-14475=16011, opensThisStep=10
    // time = 10/(1000*1.21) = 0.00826...
    expect(r.tiersCrossed).toBe(2);
    expect(BN.toNumber(r.finalMps)).toBeCloseTo(1000 * 1.1 * 1.1, 5);
  });

  it('target finishes exactly at milestone', () => {
    const r = computeMarkTime({ mps: '1000', rarity: '1', clone: '1', target: '14500', tier: '0', progress: '0' });
    // tier=0: milestoneTarget=14500, opensThisStep=14500 (exactly fills milestone)
    // time = 14500/(1000*1) = 14.5
    // after: accumulated=14500 >= milestoneTarget, tier becomes 1
    // remaining=0, done
    expect(r.tiersCrossed).toBe(1);
    expect(BN.toNumber(r.seconds)).toBeCloseTo(14.5, 5);
  });

  it('starts at higher tier', () => {
    const r = computeMarkTime({ mps: '1000', rarity: '1', clone: '1', target: '50', tier: '5', progress: '5000' });
    // tier=5, bulkBoost=1.1^5=1.61051, milestoneTarget=10000*1.45^6=10000*~9.33=93300ish
    // remaining=50, opensToMilestone=~93300-5000=88300, opensThisStep=50
    // time = 50/(1000*1.61051) = 0.03105...
    expect(r.tiersCrossed).toBe(0);
    expect(BN.toNumber(r.seconds)).toBeCloseTo(0.03105, 3);
  });
});

describe('formatDuration', () => {
  it('instant for < 1s', () => {
    expect(formatDuration(bn(5, -1))).toBe('Instant');
  });

  it('seconds only', () => {
    expect(formatDuration(BN.fromNumber(30))).toBe('30 seconds');
  });

  it('minutes and seconds', () => {
    expect(formatDuration(BN.fromNumber(130))).toBe('2 minutes, 10 seconds');
  });

  it('hours and minutes', () => {
    expect(formatDuration(BN.fromNumber(3661))).toBe('1 hours, 1 minutes, 1 seconds');
  });

  it('days and hours', () => {
    expect(formatDuration(BN.fromNumber(90000))).toBe('1 days, 1 hours');
  });

  it('months and days', () => {
    const secs = 2592000 + 86400 + 3600 + 120;
    expect(formatDuration(BN.fromNumber(secs))).toBe('1 months, 1 days, 1 hours, 2 minutes');
  });

  it('just over a year → year message', () => {
    const secs = 31536000 + 1;
    expect(formatDuration(BN.fromNumber(secs))).toMatch(/^Time longer than a year/);
  });

  it('exactly one year → formatted', () => {
    // 365 days = 31536000 seconds, this is NOT over a year
    expect(formatDuration(BN.fromNumber(31536000))).toBe('12 months, 5 days');
  });

  it('NaN → overflow', () => {
    expect(formatDuration(bn(NaN, 0))).toBe('Time overflow');
  });

  it('zero → overflow', () => {
    expect(formatDuration(bn(0, 0))).toBe('Time overflow');
  });
});
