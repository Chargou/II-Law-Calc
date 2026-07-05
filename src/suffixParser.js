export const SIMPLE = {
  'k': 3, 'm': 6, 'b': 9, 't': 12,
  'qa': 15, 'qi': 18, 'sx': 21, 'sp': 24, 'oc': 27, 'no': 30, 'dc': 33,
  'cent': 303,
};

export const BASES = { 'd': 0, 'vg': 1, 'tg': 2, 'qag': 3, 'qig': 4, 'sg': 5, 'st': 6, 'og': 7, 'ct': 8 };
export const PREFIX = { '': 0, 'u': 1, 'd': 2, 't': 3, 'qa': 4, 'qi': 5, 'sx': 6, 'sp': 7, 'oc': 8, 'no': 9 };

export function suffixExp(s) {
  const low = s.toLowerCase();
  if (low in SIMPLE) return SIMPLE[low];
  for (const [base, idx] of Object.entries(BASES)) {
    if (low.endsWith(base)) {
      const p = low.slice(0, -base.length);
      if (p in PREFIX) return 33 + idx * 30 + PREFIX[p] * 3;
    }
  }
  return NaN;
}

export function parseNumber(str) {
  if (str === undefined || str === null) return NaN;
  let s = String(str).trim().replace(/,/g, '');
  if (s === '') return NaN;

  const sign = s.startsWith('-') ? -1 : 1;
  if (s.startsWith('+') || s.startsWith('-')) s = s.slice(1);

  // Scientific: e<N> or e+<N>
  if (s.startsWith('e')) {
    const expStr = s.slice(1).replace(/^\+/, '');
    const exp = parseNumber(expStr);
    if (isNaN(exp)) return NaN;
    return sign * Math.pow(10, exp);
  }

  // Split number and suffix
  const m = s.match(/^([\d.]+)(.*)$/);
  if (!m) return sign * Number(s);

  const num = Number(m[1]);
  const suf = m[2];
  if (!suf || suf === '') return sign * num;

  const exp = suffixExp(suf);
  if (isNaN(exp)) return sign * Number(s);

  return sign * num * Math.pow(10, exp);
}

export function parseBigNum(str) {
  if (str === undefined || str === null) return { mantissa: NaN, exponent: 0 };
  let s = String(str).trim().replace(/,/g, '');
  if (s === '') return { mantissa: NaN, exponent: 0 };

  let sign = 1;
  if (s.startsWith('-')) { sign = -1; s = s.slice(1); }
  if (s.startsWith('+')) s = s.slice(1);

  if (s.startsWith('e') || s.startsWith('E')) {
    const exp = parseInt(s.slice(1), 10);
    if (isNaN(exp)) return { mantissa: NaN, exponent: 0 };
    return { mantissa: sign, exponent: exp };
  }

  const sci = s.match(/^([\d.]+)e([+-]?\d+)$/i);
  if (sci) {
    let mantissa = sign * parseFloat(sci[1]);
    let exponent = parseInt(sci[2], 10);
    while (Math.abs(mantissa) >= 10) { mantissa /= 10; exponent++; }
    while (Math.abs(mantissa) < 1 && mantissa !== 0) { mantissa *= 10; exponent--; }
    return { mantissa, exponent };
  }

  const m = s.match(/^([\d.]+)(.*)$/);
  if (!m) return { mantissa: NaN, exponent: 0 };

  const num = parseFloat(m[1]);
  const suf = m[2];
  if (!suf) {
    if (isNaN(num)) return { mantissa: NaN, exponent: 0 };
    if (num === 0) return { mantissa: 0, exponent: 0 };
    const [ms, es] = (sign * num).toExponential().split('e');
    return { mantissa: parseFloat(ms), exponent: parseInt(es, 10) };
  }

  const exp = suffixExp(suf);
  if (isNaN(exp)) {
    const fallback = sign * parseFloat(str);
    if (isNaN(fallback)) return { mantissa: NaN, exponent: 0 };
    if (fallback === 0) return { mantissa: 0, exponent: 0 };
    const [ms, es] = fallback.toExponential().split('e');
    return { mantissa: parseFloat(ms), exponent: parseInt(es, 10) };
  }

  let mantissa = sign * num;
  let exponent = exp;
  while (Math.abs(mantissa) >= 10) { mantissa /= 10; exponent++; }
  while (Math.abs(mantissa) < 1 && mantissa !== 0) { mantissa *= 10; exponent--; }
  return { mantissa, exponent };
}
