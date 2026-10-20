import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { generateData } from './generate.js';
import { makeCheck } from './gen-check.js';
import { makeRng } from './rng.js';

// Holds the generated dataset. The seed is remembered per browser so the data
// stays put across reloads; "Regenerate" draws a fresh seed and a new dataset.
const Ctx = createContext(null);
export const useData = () => useContext(Ctx);

const KEY = 'kk-data-seed';
const newSeed = () => Math.floor(Math.random() * 2 ** 31);
function initialSeed() {
  try {
    const s = parseInt(localStorage.getItem(KEY), 10);
    if (Number.isFinite(s)) return s;
  } catch { /* storage unavailable */ }
  return newSeed();
}

export function DataProvider({ children }) {
  const [seed, setSeed] = useState(initialSeed);
  const [extra, setExtra] = useState([]); // checks created through New Check

  const base = useMemo(() => generateData(seed), [seed]);
  const data = useMemo(() => {
    if (!extra.length) return base;
    return {
      ...base,
      CHECKS: [...extra.map((e) => e.check), ...base.CHECKS],
      REPORTS: { ...base.REPORTS, ...Object.fromEntries(extra.map((e) => [e.check.id, e.report])) },
      REVIEW_COUNT: base.REVIEW_COUNT + extra.filter((e) => e.check.status === 'Manual Review').length,
    };
  }, [base, extra]);

  const regenerate = useCallback(() => {
    const s = newSeed();
    try { localStorage.setItem(KEY, String(s)); } catch { /* ignore */ }
    setExtra([]);
    setSeed(s);
  }, []);

  // Runs a "live" check for the New Check flow and adds it to the dataset.
  const runCheck = useCallback(({ bvn, mobiStatus }) => {
    const rng = makeRng(parseInt(bvn.slice(-9), 10) ^ seed);
    const id = `chk_${Math.random().toString(16).slice(2, 6)}`;
    const made = makeCheck(rng, { now: new Date(), minsAgo: 0, id, bvn: bvn.slice(-4), mobiStatus, analyst: 'You' });
    made.check.created = 'just now';
    setExtra((x) => [made, ...x]);
    return made;
  }, [seed]);

  const value = useMemo(() => ({ ...data, seed, regenerate, runCheck }), [data, seed, regenerate, runCheck]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
