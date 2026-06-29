import { suffixExp, SIMPLE, BASES, PREFIX } from './suffixParser.js';

const ZERO = Object.freeze({ mantissa: 0, exponent: 0 });
const NAN = Object.freeze({ mantissa: NaN, exponent: 0 });

function normalize(bn) {
  let { mantissa, exponent } = bn;
  if (Number.isNaN(mantissa)) return { mantissa: NaN, exponent: 0 };
  if (mantissa === 0) return { mantissa: 0, exponent: 0 };
  while (Math.abs(mantissa) >= 10) { mantissa /= 10; exponent++; }
  while (Math.abs(mantissa) < 1) { mantissa *= 10; exponent--; }
  return { mantissa, exponent };
}

function displaySuffix(suf) {
  if (suf === 'k') return 'k';
  if (suf.length <= 2) return suf.charAt(0).toUpperCase() + suf.slice(1);
  const base = suf.slice(-2);
  const prefix = suf.slice(0, -2);
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  return (prefix ? cap(prefix) : '') + cap(base);
}

const SUFFIXES = (() => {
  const list = [];
  for (const [suf, exp] of Object.entries(SIMPLE)) {
    list.push({ suffix: suf, exponent: exp, display: displaySuffix(suf) });
  }
  for (const [base, baseIdx] of Object.entries(BASES)) {
    for (const [prefix, prefixIdx] of Object.entries(PREFIX)) {
      const suf = prefix + base;
      list.push({ suffix: suf, exponent: 33 + baseIdx * 30 + prefixIdx * 3, display: displaySuffix(suf) });
    }
  }
  list.sort((a, b) => b.exponent - a.exponent);
  return list;
})();

export function fromNumber(n) {
  if (Number.isNaN(n)) return { mantissa: NaN, exponent: 0 };
  if (!isFinite(n)) {
    return fromNumber(Math.sign(n) * Number.MAX_VALUE);
  }
  if (n === 0) return { mantissa: 0, exponent: 0 };
  const [m, e] = n.toExponential().split('e');
  return normalize({ mantissa: parseFloat(m), exponent: parseInt(e, 10) });
}

export function fromString(s) {
  if (s == null) return { mantissa: NaN, exponent: 0 };
  let str = String(s).trim().replace(/,/g, '');
  if (str === '') return { mantissa: NaN, exponent: 0 };

  let sign = 1;
  if (str.startsWith('-')) { sign = -1; str = str.slice(1); }
  if (str.startsWith('+')) str = str.slice(1);

  if (str.startsWith('e') || str.startsWith('E')) {
    const exp = parseInt(str.slice(1), 10);
    if (isNaN(exp)) return { mantissa: NaN, exponent: 0 };
    return { mantissa: sign, exponent: exp };
  }

  const sci = str.match(/^([\d.]+)e([+-]?\d+)$/i);
  if (sci) {
    return normalize({ mantissa: sign * parseFloat(sci[1]), exponent: parseInt(sci[2], 10) });
  }

  const m = str.match(/^([\d.]+)(.*)$/);
  if (!m) return { mantissa: NaN, exponent: 0 };

  const num = parseFloat(m[1]);
  const suf = m[2];
  if (!suf) return fromNumber(sign * num);

  const suffixE = suffixExp(suf);
  if (isNaN(suffixE)) return fromNumber(sign * parseFloat(str));

  return normalize({ mantissa: sign * num, exponent: suffixE });
}

export function fromParts(mantissa, exponent) {
  return normalize({ mantissa, exponent });
}

export function add(a, b) {
  if (Number.isNaN(a.mantissa) || Number.isNaN(b.mantissa)) return { mantissa: NaN, exponent: 0 };
  if (a.mantissa === 0) return { mantissa: b.mantissa, exponent: b.exponent };
  if (b.mantissa === 0) return { mantissa: a.mantissa, exponent: a.exponent };

  let { mantissa: mA, exponent: eA } = a;
  let { mantissa: mB, exponent: eB } = b;

  const expDiff = eA - eB;
  if (Math.abs(expDiff) > 15) return expDiff > 0 ? { mantissa: a.mantissa, exponent: a.exponent } : { mantissa: b.mantissa, exponent: b.exponent };

  if (expDiff >= 0) {
    mB /= Math.pow(10, expDiff);
  } else {
    mA /= Math.pow(10, -expDiff);
  }

  return normalize({ mantissa: mA + mB, exponent: Math.max(eA, eB) });
}

export function sub(a, b) {
  return add(a, { mantissa: -b.mantissa, exponent: b.exponent });
}

export function mul(a, b) {
  if (Number.isNaN(a.mantissa) || Number.isNaN(b.mantissa)) return { mantissa: NaN, exponent: 0 };
  if (a.mantissa === 0 || b.mantissa === 0) return { mantissa: 0, exponent: 0 };
  return normalize({ mantissa: a.mantissa * b.mantissa, exponent: a.exponent + b.exponent });
}

export function div(a, b) {
  if (Number.isNaN(a.mantissa) || Number.isNaN(b.mantissa)) return { mantissa: NaN, exponent: 0 };
  if (b.mantissa === 0) return { mantissa: NaN, exponent: 0 };
  if (a.mantissa === 0) return { mantissa: 0, exponent: 0 };
  return normalize({ mantissa: a.mantissa / b.mantissa, exponent: a.exponent - b.exponent });
}

export function pow(base, exp) {
  if (Number.isNaN(base.mantissa)) return { mantissa: NaN, exponent: 0 };
  if (base.mantissa === 0) return exp === 0 ? fromNumber(1) : { mantissa: 0, exponent: 0 };
  if (!Number.isInteger(exp)) {
    return fromNumber(Math.pow(10, exp * log10(base)));
  }
  if (exp === 0) return fromNumber(1);
  if (exp < 0) return div(fromNumber(1), pow(base, -exp));
  let result = fromNumber(1);
  let b = { mantissa: base.mantissa, exponent: base.exponent };
  let e = exp;
  while (e > 0) {
    if (e & 1) result = mul(result, b);
    b = mul(b, b);
    e >>= 1;
  }
  return result;
}

export function log10(a) {
  if (Number.isNaN(a.mantissa)) return NaN;
  if (a.mantissa === 0) return -Infinity;
  if (a.mantissa < 0) return NaN;
  return a.exponent + Math.log10(a.mantissa);
}

export function cmp(a, b) {
  if (Number.isNaN(a.mantissa) || Number.isNaN(b.mantissa)) return NaN;
  if (a.mantissa === 0 && b.mantissa === 0) return 0;
  if (a.mantissa === 0) return b.mantissa > 0 ? -1 : 1;
  if (b.mantissa === 0) return a.mantissa > 0 ? 1 : -1;
  if (a.mantissa > 0 && b.mantissa < 0) return 1;
  if (a.mantissa < 0 && b.mantissa > 0) return -1;
  if (a.exponent > b.exponent) return a.mantissa > 0 ? 1 : -1;
  if (a.exponent < b.exponent) return a.mantissa > 0 ? -1 : 1;
  if (a.mantissa > b.mantissa) return 1;
  if (a.mantissa < b.mantissa) return -1;
  return 0;
}

function toPlainString(mantissa, exponent) {
  let sign = '';
  let m = mantissa;
  if (m < 0) { sign = '-'; m = -m; }

  const mStr = String(m);
  const dotIdx = mStr.indexOf('.');
  const digits = dotIdx === -1 ? mStr : mStr.slice(0, dotIdx) + mStr.slice(dotIdx + 1);
  const origDotPos = dotIdx === -1 ? mStr.length : dotIdx;
  const newDotPos = origDotPos + exponent;

  if (newDotPos <= 0) {
    return sign + '0.' + '0'.repeat(-newDotPos) + digits;
  }
  if (newDotPos >= digits.length) {
    return sign + digits + '0'.repeat(newDotPos - digits.length);
  }
  return sign + digits.slice(0, newDotPos) + '.' + digits.slice(newDotPos);
}

function toSuffixedString(mantissa, exponent) {
  for (const { exponent: sufExp, display } of SUFFIXES) {
    if (exponent >= sufExp) {
      const shift = exponent - sufExp;
      const value = mantissa * Math.pow(10, shift);
      const formatted = parseFloat(value.toPrecision(6));
      return `${formatted}${display}`;
    }
  }
  return toScientificString(mantissa, exponent);
}

function toScientificString(mantissa, exponent) {
  return `${mantissa}e${exponent}`;
}

export function toString(a) {
  if (Number.isNaN(a.mantissa)) return 'NaN';
  if (a.mantissa === 0) return '0';
  const { mantissa, exponent } = normalize(a);
  if (exponent < 6) return toPlainString(mantissa, exponent);
  if (exponent < 306) return toSuffixedString(mantissa, exponent);
  return toScientificString(mantissa, exponent);
}

export function toNumber(a) {
  if (Number.isNaN(a.mantissa)) return NaN;
  if (a.mantissa === 0) return 0;
  const sign = a.mantissa > 0 ? 1 : -1;
  if (a.exponent > 308) return sign * Infinity;
  if (a.exponent < -323) return 0;
  return a.mantissa * Math.pow(10, a.exponent);
}
