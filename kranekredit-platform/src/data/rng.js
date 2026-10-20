// Seeded randomness + formatting helpers shared by the generators.

export function makeRng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = {
    next,
    float: (min, max) => min + next() * (max - min),
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
    weighted: (pairs) => {
      const total = pairs.reduce((s, [, w]) => s + w, 0);
      let x = next() * total;
      for (const [v, w] of pairs) { x -= w; if (x <= 0) return v; }
      return pairs[pairs.length - 1][0];
    },
    shuffle: (arr) => {
      const a2 = [...arr];
      for (let i = a2.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a2[i], a2[j]] = [a2[j], a2[i]]; }
      return a2;
    },
    sample: (arr, n) => r.shuffle(arr).slice(0, n),
    digits: (n) => Array.from({ length: n }, () => Math.floor(next() * 10)).join(''),
    hex: (n) => Array.from({ length: n }, () => Math.floor(next() * 16).toString(16)).join(''),
  };
  return r;
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const round = (v, step = 1) => Math.round(v / step) * step;

export const naira = (n) => '₦' + Math.round(n).toLocaleString('en-NG');
export function nairaShort(n) {
  if (n >= 1e6) return `₦${(n / 1e6).toFixed(n >= 1e8 ? 0 : 1).replace(/\.0$/, '')}M`;
  if (n >= 1e3) return `₦${Math.round(n / 1e3)}K`;
  return naira(n);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const monthName = (d) => MONTHS[d.getMonth()];
export const fmtDate = (d) => `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
export const fmtTime = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
export const fmtTimeSec = (d) => `${fmtTime(d)}:${String(d.getSeconds()).padStart(2, '0')}`;
export const minutesAgo = (now, mins) => new Date(now.getTime() - mins * 60000);

export function relTime(mins) {
  if (mins < 1) return 'just now';
  if (mins < 60) return `${Math.round(mins)} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} hr ago`;
  const d = Math.round(mins / 1440);
  if (d < 7) return d === 1 ? '1 day ago' : `${d} days ago`;
  const w = Math.round(d / 7);
  return w === 1 ? '1 week ago' : `${w} weeks ago`;
}

export const initials = (name) => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
export const shortName = (name) => { const [f, l] = name.split(' '); return `${f} ${l ? l[0] + '.' : ''}`.trim(); };
