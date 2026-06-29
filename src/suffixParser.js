const SIMPLE = {
  'k': 3, 'm': 6, 'b': 9, 't': 12,
  'qd': 15, 'qn': 18, 'sx': 21, 'sp': 24, 'oc': 27, 'no': 30,
  'cent': 303,
};

const BASES = { 'de': 0, 'vt': 1, 'tg': 2, 'qg': 3, 'qi': 4, 'sg': 5, 'st': 6, 'og': 7, 'ng': 8 };
const PREFIX = { '': 0, 'u': 1, 'd': 2, 't': 3, 'qd': 4, 'qn': 5, 'sx': 6, 'sp': 7, 'oc': 8, 'no': 9 };

function suffixExp(s) {
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
