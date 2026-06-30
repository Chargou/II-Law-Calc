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
    // milestone=10000, target=10 < 10000, no crossing
    expect(BN.toNumber(r.seconds)).toBeCloseTo(0.01, 5);
    expect(r.tiersCrossed).toBe(0);
  });

  it('crosses one milestone during session', () => {
    const r = computeMarkTime({ mps: '1000', rarity: '1', clone: '1', target: '20000', tier: '0', progress: '0' });
    // independent milestones: thresh0=10000, thresh1=14500, thresh2=21025
    // loop1: 10000 opens at 1000mps→10s, cross→tier1, boost=1.1, opensToNext=4500, rem=10000
    // loop2: 4500 opens at 1100mps→4.0909s, cross→tier2, boost=1.21, opensToNext=6525, rem=5500
    // loop3: 5500 opens at 1210mps→4.545s < 6525/1210=5.392, finish
    // total=10+4.0909+4.545=18.636, tiersCrossed=2
    expect(BN.toNumber(r.seconds)).toBeCloseTo(18.63636, 4);
    expect(r.tiersCrossed).toBe(2);
    expect(BN.toNumber(r.finalMps)).toBeCloseTo(1210, 5);
  });

  it('crosses multiple milestones', () => {
    const r = computeMarkTime({ mps: '1000', rarity: '1', clone: '1', target: '50000', tier: '0', progress: '0' });
    // independent milestones, 5 crossed (thresh0–thresh4 at 10000,14500,21025,30486.25,44205.06)
    // loop times: 10 + 4.0909 + 5.3926 + 7.1082 + 9.3695 + 3.5983 = 39.56
    expect(BN.toNumber(r.seconds)).toBeCloseTo(39.56, 2);
    expect(r.tiersCrossed).toBe(5);
    expect(BN.toNumber(r.finalMps)).toBeCloseTo(1610.51, 5);
  });

  it('pre-skip: instant tier advance at start', () => {
    const r = computeMarkTime({ mps: '1000', rarity: '1', clone: '1', target: '10', tier: '0', progress: '20000' });
    // pre-skip: 20000 >= 10000→tier1, 20000 >= 14500→tier2, 20000 < 21025→stop
    // opensToNext = 21025 - 20000 = 1025, boost = 1.21
    // time = 10 / (1000*1.21) = 0.008264
    expect(r.tiersCrossed).toBe(2);
    expect(BN.toNumber(r.seconds)).toBeCloseTo(0.00826446, 4);
  });

  it('multiple pre-skips', () => {
    const r = computeMarkTime({ mps: '1000', rarity: '1', clone: '1', target: '10', tier: '0', progress: '50000' });
    // pre-skip: 50000 crosses thresh0(10000)→t1, thresh1(14500)→t2, thresh2(21025)→t3,
    //           thresh3(30486.25)→t4, thresh4(44205.0625)→t5, 50000 < thresh5(64097.34)→stop
    // opensToNext = 64097.34 - 50000 = 14097.34, boost = 1.1^5 = 1.61051
    // time = 10 / (1000*1.61051) = 0.006209
    expect(r.tiersCrossed).toBe(5);
    expect(BN.toNumber(r.finalMps)).toBeCloseTo(1610.51, 5);
  });

  it('target finishes exactly at milestone', () => {
    const r = computeMarkTime({ mps: '1000', rarity: '1', clone: '1', target: '10000', tier: '0', progress: '0' });
    // milestone thresh0=10000, timeToTarget=timeToMilestone=10
    // equal → milestone crossed first, remaining=0
    expect(r.tiersCrossed).toBe(1);
    expect(BN.toNumber(r.seconds)).toBeCloseTo(10, 5);
  });

  it('starts at higher tier', () => {
    const r = computeMarkTime({ mps: '1000', rarity: '1', clone: '1', target: '50', tier: '5', progress: '5000' });
    // User MPS already includes 1.1^5, bulkBoost starts at 1
    // milestone=10000*1.45^5=64097.34, opensToNext=59097.34, target=50 < opensToNext
    expect(r.tiersCrossed).toBe(0);
    expect(BN.toNumber(r.seconds)).toBeCloseTo(0.05, 3);
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
