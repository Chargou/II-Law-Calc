import { describe, it, expect } from 'vitest';
import * as BN from '../src/bigNum.js';
import { parseBigNum } from '../src/suffixParser.js';

function bn(mantissa, exponent) {
  return { mantissa, exponent };
}

describe('fromNumber', () => {
  it('converts zero', () => {
    const z = BN.fromNumber(0);
    expect(z.mantissa).toBe(0);
    expect(z.exponent).toBe(0);
  });

  it('converts positive integers', () => {
    const n = BN.fromNumber(123);
    expect(n).toEqual(bn(1.23, 2));
  });

  it('converts negative numbers', () => {
    const n = BN.fromNumber(-456);
    expect(n).toEqual(bn(-4.56, 2));
  });

  it('converts small decimals', () => {
    const n = BN.fromNumber(0.0015);
    expect(BN.toString(n)).toBe('0.0015');
  });

  it('converts large numbers', () => {
    const n = BN.fromNumber(1e100);
    expect(n.mantissa).toBeCloseTo(1, 5);
    expect(n.exponent).toBe(100);
  });

  it('handles NaN', () => {
    const n = BN.fromNumber(NaN);
    expect(n.mantissa).toBeNaN();
  });

  it('handles Infinity', () => {
    const n = BN.fromNumber(Infinity);
    expect(n.mantissa).toBeCloseTo(1.7976931348623157, 5);
    expect(n.exponent).toBe(308);
  });

  it('handles -Infinity', () => {
    const n = BN.fromNumber(-Infinity);
    expect(n.mantissa).toBeLessThan(0);
    expect(n.exponent).toBe(308);
  });
});

describe('fromString', () => {
  it('parses plain number', () => {
    expect(BN.fromString('123')).toEqual(bn(1.23, 2));
  });

  it('parses plain decimal', () => {
    expect(BN.fromString('45.6')).toEqual(bn(4.56, 1));
  });

  it('parses scientific notation', () => {
    expect(BN.fromString('1.5e123')).toEqual(bn(1.5, 123));
  });

  it('parses scientific notation with +', () => {
    expect(BN.fromString('2e+50')).toEqual(bn(2, 50));
  });

  it('parses scientific notation with -', () => {
    expect(BN.fromString('1.5e-10')).toEqual(bn(1.5, -10));
  });

  it('parses e-shorthand', () => {
    expect(BN.fromString('e100')).toEqual(bn(1, 100));
  });

  it('parses suffix notation k', () => {
    expect(BN.fromString('5k')).toEqual(bn(5, 3));
  });

  it('parses suffix notation M', () => {
    expect(BN.fromString('3.5M')).toEqual(bn(3.5, 6));
  });

  it('parses suffix notation Qa', () => {
    expect(BN.fromString('5Qa')).toEqual(bn(5, 15));
  });

  it('parses suffix notation SpTg', () => {
    const n = BN.fromString('2SpTg');
    expect(n.mantissa).toBe(2);
    expect(n.exponent).toBe(114);
  });

  it('parses suffix notation SxD', () => {
    const n = BN.fromString('3SxD');
    expect(n.mantissa).toBe(3);
    expect(n.exponent).toBe(51);
  });

  it('parses negative string', () => {
    expect(BN.fromString('-5Qa')).toEqual(bn(-5, 15));
  });

  it('handles null/undefined', () => {
    expect(BN.fromString(null).mantissa).toBeNaN();
    expect(BN.fromString(undefined).mantissa).toBeNaN();
  });

  it('handles empty string', () => {
    expect(BN.fromString('').mantissa).toBeNaN();
  });

  it('handles comma-separated', () => {
    expect(BN.fromString('1,234')).toEqual(bn(1.234, 3));
  });
});

describe('fromParts', () => {
  it('normalizes mantissa >= 10', () => {
    expect(BN.fromParts(15, 10)).toEqual(bn(1.5, 11));
  });

  it('normalizes mantissa < 1', () => {
    expect(BN.fromParts(0.15, 10)).toEqual(bn(1.5, 9));
  });

  it('leaves normalized values alone', () => {
    expect(BN.fromParts(1.5, 10)).toEqual(bn(1.5, 10));
  });

  it('handles zero', () => {
    expect(BN.fromParts(0, 100)).toEqual(bn(0, 0));
  });

  it('handles negative mantissa', () => {
    expect(BN.fromParts(-1.5, 10)).toEqual(bn(-1.5, 10));
  });
});

describe('add', () => {
  it('adds same exponent', () => {
    const a = BN.fromParts(1, 10);
    const b = BN.fromParts(2, 10);
    expect(BN.add(a, b)).toEqual(bn(3, 10));
  });

  it('adds different exponents', () => {
    const a = BN.fromParts(5, 10);
    const b = BN.fromParts(3, 8);
    const r = BN.add(a, b);
    expect(r.mantissa).toBeCloseTo(5.03, 5);
    expect(r.exponent).toBe(10);
  });

  it('adds zero', () => {
    const a = BN.fromParts(1.5, 10);
    expect(BN.add(a, BN.fromNumber(0))).toEqual(a);
  });

  it('handles negligible difference', () => {
    const a = BN.fromParts(1, 100);
    const b = BN.fromParts(1, 80);
    const r = BN.add(a, b);
    expect(r).toEqual(bn(1, 100));
  });

  it('adds negative numbers', () => {
    const a = BN.fromParts(5, 10);
    const b = BN.fromParts(-3, 10);
    expect(BN.add(a, b)).toEqual(bn(2, 10));
  });

  it('handles NaN propagation', () => {
    const n = BN.add(BN.fromNumber(NaN), BN.fromParts(1, 10));
    expect(n.mantissa).toBeNaN();
  });
});

describe('sub', () => {
  it('subtracts same exponent', () => {
    const a = BN.fromParts(5, 10);
    const b = BN.fromParts(3, 10);
    expect(BN.sub(a, b)).toEqual(bn(2, 10));
  });

  it('subtracts yielding negative', () => {
    const a = BN.fromParts(3, 10);
    const b = BN.fromParts(5, 10);
    expect(BN.sub(a, b)).toEqual(bn(-2, 10));
  });

  it('subtracts zero', () => {
    const a = BN.fromParts(1.5, 10);
    expect(BN.sub(a, BN.fromNumber(0))).toEqual(a);
  });
});

describe('mul', () => {
  it('multiplies', () => {
    const a = BN.fromParts(1.5, 10);
    const b = BN.fromParts(3, 5);
    expect(BN.mul(a, b)).toEqual(bn(4.5, 15));
  });

  it('multiplies with normalization', () => {
    const a = BN.fromParts(5, 10);
    const b = BN.fromParts(3, 5);
    expect(BN.mul(a, b)).toEqual(bn(1.5, 16));
  });

  it('multiply by zero', () => {
    const a = BN.fromParts(1.5, 10);
    const r = BN.mul(a, BN.fromNumber(0));
    expect(r.mantissa).toBe(0);
    expect(r.exponent).toBe(0);
  });
});

describe('div', () => {
  it('divides', () => {
    const a = BN.fromParts(6, 15);
    const b = BN.fromParts(2, 5);
    expect(BN.div(a, b)).toEqual(bn(3, 10));
  });

  it('divides with normalization', () => {
    const a = BN.fromParts(1.5, 10);
    const b = BN.fromParts(3, 5);
    expect(BN.div(a, b)).toEqual(bn(5, 4));
  });

  it('division by zero returns NaN', () => {
    const r = BN.div(BN.fromParts(1, 1), BN.fromNumber(0));
    expect(r.mantissa).toBeNaN();
  });

  it('zero divided by non-zero', () => {
    const r = BN.div(BN.fromNumber(0), BN.fromParts(1, 10));
    expect(r.mantissa).toBe(0);
  });
});

describe('pow', () => {
  it('raises to integer power', () => {
    const base = BN.fromParts(2, 0);
    const r = BN.pow(base, 10);
    expect(r.mantissa).toBeCloseTo(1.024, 5);
    expect(r.exponent).toBe(3);
  });

  it('power of 0', () => {
    const base = BN.fromParts(1.5, 10);
    const r = BN.pow(base, 0);
    expect(r).toEqual(bn(1, 0));
  });

  it('power of 1', () => {
    const base = BN.fromParts(1.5, 10);
    const r = BN.pow(base, 1);
    expect(r).toEqual(base);
  });

  it('power of 0 to 0', () => {
    const r = BN.pow(BN.fromNumber(0), 0);
    expect(r).toEqual(bn(1, 0));
  });

  it('negative power', () => {
    const base = BN.fromParts(2, 3);
    const r = BN.pow(base, -1);
    expect(r).toEqual(bn(5, -4));
  });
});

describe('log10', () => {
  it('computes log10 of positive value', () => {
    const val = BN.fromParts(1.5, 10);
    const l = BN.log10(val);
    expect(l).toBeCloseTo(10.176, 2);
  });

  it('returns -Infinity for zero', () => {
    expect(BN.log10(BN.fromNumber(0))).toBe(-Infinity);
  });

  it('returns NaN for negative', () => {
    expect(BN.log10(BN.fromParts(-1, 0))).toBeNaN();
  });
});

describe('cmp', () => {
  it('equal values', () => {
    expect(BN.cmp(BN.fromParts(1.5, 10), BN.fromParts(1.5, 10))).toBe(0);
  });

  it('greater by exponent', () => {
    expect(BN.cmp(BN.fromParts(1, 20), BN.fromParts(1, 10))).toBe(1);
  });

  it('less by exponent', () => {
    expect(BN.cmp(BN.fromParts(1, 10), BN.fromParts(1, 20))).toBe(-1);
  });

  it('greater by mantissa', () => {
    expect(BN.cmp(BN.fromParts(5, 10), BN.fromParts(3, 10))).toBe(1);
  });

  it('negative less than positive', () => {
    expect(BN.cmp(BN.fromParts(-1, 10), BN.fromParts(1, 10))).toBe(-1);
  });

  it('zero equal to zero', () => {
    expect(BN.cmp(BN.fromNumber(0), BN.fromNumber(0))).toBe(0);
  });

  it('zero less than positive', () => {
    expect(BN.cmp(BN.fromNumber(0), BN.fromParts(1, 0))).toBe(-1);
  });
});

describe('toString', () => {
  it('zero', () => {
    expect(BN.toString(BN.fromNumber(0))).toBe('0');
  });

  it('plain number < 1e6', () => {
    expect(BN.toString(BN.fromString('123.45'))).toBe('123.45');
  });

  it('plain integer < 1e6', () => {
    expect(BN.toString(BN.fromString('5000'))).toBe('5000');
  });

  it('suffix notation for millions', () => {
    expect(BN.toString(BN.fromString('5.5M'))).toBe('5.5M');
  });

  it('suffix notation for Qd', () => {
    expect(BN.toString(BN.fromString('5Qa'))).toBe('5Qa');
  });

  it('suffix notation for SpTg', () => {
    const s = BN.toString(BN.fromString('2SpTg'));
    expect(s).toContain('SpTg');
  });

  it('scientific notation for >= 1e306', () => {
    const s = BN.toString(BN.fromParts(1.5, 306));
    expect(s).toMatch(/1\.5e306/);
  });

  it('negative', () => {
    const s = BN.toString(BN.fromString('-123.45'));
    expect(s).toBe('-123.45');
  });

  it('NaN', () => {
    expect(BN.toString(BN.fromNumber(NaN))).toBe('NaN');
  });
});

describe('toNumber', () => {
  it('converts small value', () => {
    expect(BN.toNumber(BN.fromString('123.45'))).toBeCloseTo(123.45, 5);
  });

  it('converts zero', () => {
    expect(BN.toNumber(BN.fromNumber(0))).toBe(0);
  });

  it('returns Infinity for overflow', () => {
    const big = BN.fromParts(1, 400);
    expect(BN.toNumber(big)).toBe(Infinity);
  });

  it('handles NaN', () => {
    expect(BN.toNumber(BN.fromNumber(NaN))).toBeNaN();
  });
});

describe('suffixParser.parseBigNum', () => {
  it('parses k suffix', () => {
    const r = parseBigNum('5k');
    expect(r).toEqual(bn(5, 3));
  });

  it('parses M suffix', () => {
    const r = parseBigNum('3.5M');
    expect(r).toEqual(bn(3.5, 6));
  });

  it('parses composite suffix', () => {
    const r = parseBigNum('2SpTg');
    expect(r.mantissa).toBe(2);
    expect(r.exponent).toBe(114);
  });

  it('parses plain number', () => {
    const r = parseBigNum('123.45');
    expect(r.mantissa).toBeCloseTo(1.2345, 5);
    expect(r.exponent).toBe(2);
  });

  it('parses scientific', () => {
    const r = parseBigNum('1.5e123');
    expect(r).toEqual(bn(1.5, 123));
  });

  it('handles null', () => {
    expect(parseBigNum(null).mantissa).toBeNaN();
  });
});

describe('integration', () => {
  it('fromString → mul → toString (spec example)', () => {
    const a = BN.fromString('5Qa');
    const b = BN.fromString('3SxD');
    const c = BN.mul(a, b);
    expect(c.mantissa).toBeCloseTo(1.5, 5);
    expect(c.exponent).toBe(67);
  });

  it('fromString → add → toString', () => {
    const a = BN.fromString('1e50');
    const b = BN.fromString('2e50');
    const c = BN.add(a, b);
    expect(BN.toString(c)).toBe('300QiD');
  });

  it('cmp across many orders of magnitude', () => {
    const small = BN.fromString('1');
    const large = BN.fromString('1e100');
    expect(BN.cmp(small, large)).toBe(-1);
    expect(BN.cmp(large, small)).toBe(1);
    expect(BN.cmp(large, large)).toBe(0);
  });
});
