// Generates one credit check: the list row, the KRK report and its Deep Analysis.
// Every figure is derived from a small set of underlying facts (score, income,
// obligations, integrity, engine availability) so the pages agree with each other.

import { clamp, round, naira, nairaShort, fmtDate, fmtTime, fmtTimeSec, minutesAgo, relTime, monthName, shortName } from './rng.js';
import { BANKS, EMPLOYERS, LENDERS, GATEWAY_NARRATIONS, PERSONAS, FIRST, LAST } from './pools.js';
import { PRODUCT_CATALOG } from './catalog.js';

export const TIER_RANGES = { T0: [300, 449], T1: [450, 549], T2: [550, 649], T3: [650, 749], T4: [750, 799], T5: [800, 900] };
export const tierOf = (s) => Object.keys(TIER_RANGES).find((t) => s >= TIER_RANGES[t][0] && s <= TIER_RANGES[t][1]);
const tierRank = (t) => +t.slice(1);

const MOBI_STATES = {
  Connected: { available: true, label: 'FULL', source: 'SDK telemetry (active)' },
  'Low confidence': { available: true, label: 'FULL', source: 'SDK telemetry (low confidence)', lowConf: true },
  'Not available on this channel': { available: false, label: 'DEGRADED', source: 'SDK not integrated on this channel', code: 'STRUCTURALLY_ABSENT' },
  'Consent not granted': { available: false, label: 'DEGRADED', source: 'SDK consent not granted', code: 'CONSENT_DECLINED' },
  'Temporarily unavailable': { available: false, label: 'DEGRADED', source: 'SDK temporarily unavailable', code: 'TEMPORARILY_UNAVAILABLE' },
};
export const MOBI_OPTIONS = Object.keys(MOBI_STATES);

export function randomName(rng) { return `${rng.pick(FIRST)} ${rng.pick(LAST)}`; }

export function bvnAccounts(rng) {
  const banks = rng.sample(BANKS, rng.int(6, 10));
  return banks
    .map((b) => {
      const activity = rng.int(5, 98);
      const hrs = activity > 80 ? rng.int(1, 8) : activity > 50 ? rng.int(6, 48) : activity > 20 ? rng.int(48, 240) : rng.int(240, 900);
      return { bank: b.name, type: b.type, acct: rng.digits(4), last: relTime(hrs * 60), activity, dormant: activity < 20 };
    })
    .sort((a, b) => b.activity - a.activity);
}

export function makeCheck(rng, opts) {
  const { now, minsAgo = 0, id, name = randomName(rng), bvn = rng.digits(4), mobiStatus, analyst = 'You' } = opts;
  const created = minutesAgo(now, minsAgo);

  // ---- Core facts ----------------------------------------------------------
  const tier = opts.tier || rng.weighted([['T0', 8], ['T1', 15], ['T2', 24], ['T3', 28], ['T4', 17], ['T5', 8]]);
  const [lo, hi] = TIER_RANGES[tier];
  const score = rng.int(lo, hi);
  const q = (score - 300) / 600; // 0..1 quality
  const mobiKey = mobiStatus || rng.weighted([['Connected', 76], ['Not available on this channel', 14], ['Temporarily unavailable', 5], ['Low confidence', 5]]);
  const mobi = MOBI_STATES[mobiKey];
  const integrity = rng.weighted([['Clear', 80], ['Review', 13], ['High Risk', 7]]);
  const authenticity = integrity === 'Clear' ? rng.int(86, 99) : integrity === 'Review' ? rng.int(58, 72) : rng.int(34, 52);
  const net = round(rng.float(120000, 380000) + q * rng.float(250000, 1500000), 1000);
  const loanCredits = rng.chance(0.6) ? round(net * rng.float(0.04, 0.12), 1000) : 0;
  const gross = net + loanCredits;
  const dti = Math.round(clamp(62 - q * 48 + rng.float(-9, 9), 6, 74));
  const conflict = rng.chance(0.1);
  const confidence = mobi.available ? (mobi.lowConf ? rng.int(70, 78) : rng.int(80, 92)) : rng.int(58, 70);
  const risk = score >= 780 ? 'R1' : score >= 680 ? 'R2' : score >= 560 ? 'R3' : score >= 450 ? 'R4' : 'R5';
  const debt = dti < 15 ? 'D1' : dti < 25 ? 'D2' : dti < 35 ? 'D3' : dti < 45 ? 'D4' : 'D5';
  const signal = `KRK-${score}-${risk}-${debt}-${tier}`;
  const label = mobi.label;
  const employer = rng.pick(EMPLOYERS);
  const homeBank = rng.pick(BANKS.filter((b) => b.type === 'Commercial'));
  const accounts = rng.int(1, 3);
  const gamblingPct = +clamp(rng.chance(0.25) ? rng.float(4, 14) : rng.float(0, 3.5), 0, 20).toFixed(1);
  const hiddenProb = rng.int(5, 78);
  const inquiries = rng.weighted([[0, 2], [1, 3], [2, 3], [3, 3], [4, 2], [6, 1]]);
  const persona = q > 0.55 ? PERSONAS[0] : rng.pick(PERSONAS);

  // ---- Decision (policy v4.2, first match wins) ----------------------------
  let decision; let rule;
  if (tierRank(tier) >= 3 && dti <= 35 && integrity === 'Clear' && !conflict) { decision = 'Auto-Approve'; rule = 'r1'; }
  else if (tier === 'T0') { decision = 'Auto-Decline'; rule = 'r2'; }
  else if (integrity === 'High Risk' || conflict) { decision = 'Refer'; rule = 'r3'; }
  else if (tier === 'T1' && dti > 40) { decision = 'Refer'; rule = 'r4'; }
  else if (tier === 'T5' && confidence >= 80 && integrity === 'Clear') { decision = 'Auto-Approve'; rule = 'r5'; }
  else if (dti > 50) { decision = 'Auto-Decline'; rule = 'default'; }
  else { decision = 'Manual Review'; rule = 'floor'; }
  const needsHuman = decision === 'Manual Review' || decision === 'Refer';
  const status = needsHuman && minsAgo < 1440 && rng.chance(0.65) ? 'Manual Review' : 'Completed';

  const check = { id, name, bvn, signal, score, tier, integrity, decision, status, analyst, created: relTime(minsAgo), minsAgo, mobiKey };

  // ---- Engines (weighted mean reproduces the KRK score) --------------------
  const w = mobi.available ? { bs: 0.45, bu: 0.3, mo: 0.25 } : { bs: 0.7, bu: 0.3, mo: 0 };
  let bs = score + rng.int(-35, 35), bu = score + rng.int(-55, 45), mo = mobi.available ? score + rng.int(-40, 40) : null;
  const shift = Math.round(score - (bs * w.bs + bu * w.bu + (mo || 0) * w.mo));
  bs = clamp(bs + shift, 300, 900); bu = clamp(bu + shift, 300, 900); if (mo !== null) mo = clamp(mo + shift, 300, 900);

  // ---- Bank statement figures ---------------------------------------------
  const outflowPct = clamp(Math.round(30 + dti * 0.5 + rng.int(-8, 8)), 25, 92);
  const outflow = round(net * outflowPct / 100, 1000);
  const avgBal = round(net * rng.float(0.12, 0.6), 1000);
  const selfTransfer = +rng.float(1, hiddenProb > 55 ? 16 : 9).toFixed(1);
  const obligations = round(net * dti / 100, 1000);
  const rent = round(net * rng.float(0.1, 0.22), 1000);
  const utilities = round(net * rng.float(0.03, 0.06), 1000);
  const education = rng.chance(0.35) ? round(net * rng.float(0.03, 0.09), 1000) : 0;
  const fcf = Math.max(0, net - obligations);
  const fcfAfterLiving = Math.max(0, net - obligations - rent - utilities - education);
  const disposable = Math.max(0, net - outflow);

  // ---- Facilities (shared by BS360 + Bureau) --------------------------------
  const nFac = clamp(Math.round(1 + (dti / 22) + rng.int(-1, 1)), 0, 5);
  const facilities = rng.sample(LENDERS, nFac).map(([n, lt, pt, [a, b]], i) => {
    const amount = round(rng.int(a, b), 10000);
    const outstanding = round(amount * rng.float(0.25, 0.95), 1000);
    const monthsExp = rng.int(6, 24);
    const paid = q < 0.3 && rng.chance(0.5) ? monthsExp - rng.int(1, 4) : monthsExp - (rng.chance(0.15) ? 1 : 0);
    return { name: n, lenderType: lt, productType: pt, amount, outstanding, monthsExp, paid: Math.max(1, paid), start: rng.int(0, 70), open: i < nFac - (rng.chance(0.3) ? 1 : 0) || nFac === 1 };
  });
  const totalDebt = facilities.filter((f) => f.open).reduce((s, f) => s + f.outstanding, 0);
  const maxDpd = q > 0.7 ? rng.weighted([[0, 6], [5, 2], [8, 1]]) : q > 0.4 ? rng.weighted([[0, 3], [8, 3], [21, 2], [35, 1]]) : rng.weighted([[12, 2], [35, 3], [65, 2], [95, 1]]);

  // ---- Flags --------------------------------------------------------------
  const flags = [];
  if (integrity === 'High Risk') flags.push({ level: 'HIGH', engine: 'BS360', text: `Statement integrity high risk — authenticity ${authenticity}/100`, action: 'Request original statement via item link before any decision' });
  if (gamblingPct > 5) flags.push({ level: 'HIGH', engine: 'BS360', text: `Betting spend at ${gamblingPct}% of income — above 5% threshold`, action: 'Penalty applied; cannot be offset by positive signals' });
  if (integrity === 'Review') flags.push({ level: 'MEDIUM', engine: 'BS360', text: `Statement flagged for review — authenticity ${authenticity}/100`, action: 'Confirm document genuineness in manual review' });
  if (dti > 40) flags.push({ level: 'MEDIUM', engine: 'Bureau', text: `True DTI at ${dti}% — above the 40% comfort band`, action: 'Cap new EMI to available headroom' });
  if (hiddenProb >= 60) flags.push({ level: 'MEDIUM', engine: 'BS360', text: `Hidden holding account likely (probability ${hiddenProb})`, action: 'Request statements for all linked accounts' });
  if (rng.chance(0.35)) flags.push({ level: 'MEDIUM', engine: 'BS360', text: `Average balance on secondary account dropped ${rng.int(12, 35)}% in last 30 days`, action: 'Review secondary account trend before disbursement' });
  if (conflict) flags.push({ level: 'MEDIUM', engine: 'Bureau', text: 'Facility on CRC not reported to FirstCentral', action: 'Investigate before approval — discrepancy is a signal, not noise' });
  if (inquiries >= 3) flags.push({ level: 'LOW', engine: 'Bureau', text: `${inquiries} credit inquiries in last 6 months — recent credit-seeking behaviour`, action: 'Monitor — no blocking action required' });
  if (!mobi.available) flags.push({ level: 'LOW', engine: 'MoBI360', text: 'Alternative data unavailable — weight redistributed to BS360', action: 'Score computed on BS360 + Bureau only' });
  const topFlags = flags.slice(0, 4);
  const mediumCount = topFlags.filter((f) => f.level === 'MEDIUM').length;
  const highCount = topFlags.filter((f) => f.level === 'HIGH').length;

  // ---- Reason codes --------------------------------------------------------
  const pos = [];
  if (q > 0.35) pos.push(['PC01', `Strong recurring inflow — average monthly inflow of ${nairaShort(net)} over 6 months.`]);
  if (dti < 35) pos.push(['PC03', `Low debit-to-inflow ratio (${dti}%) — healthy disposable income after obligations.`]);
  if (maxDpd === 0) pos.push(['PC07', 'No bureau delinquency in the last 24 months across both FirstCentral and CRC.']);
  if (persona[0] === 'SALARIED_FORMAL') pos.push(['PC12', `Consistent salary deposits from ${employer[0]} detected on day 25–28 of each month.`]);
  if (rng.chance(0.5)) pos.push(['PC15', 'Recurring savings auto-debits to PiggyVest / Cowrywise.']);
  if (pos.length === 0) pos.push(['PC20', 'Verified identity — BVN, name and DOB match across all sources.']);
  const adv = [];
  if (dti > 40) adv.push(['AC01', `High debt-to-income ratio (${dti}%) — limited headroom for new obligations.`]);
  if (inquiries >= 3) adv.push(['AC02', `${inquiries} credit inquiries in the last 6 months — recent credit-seeking behaviour.`]);
  if (maxDpd > 30) adv.push(['AC04', `Bureau delinquency — worst ${maxDpd} days past due in the last 12 months.`]);
  if (integrity !== 'Clear') adv.push(['AC06', `Statement integrity flag — authenticity ${authenticity}/100.`]);
  if (gamblingPct > 5) adv.push(['AC07', `Betting spend at ${gamblingPct}% of income.`]);
  if (q < 0.25) adv.push(['AC09', 'Insufficient transaction history to establish income stability.']);
  if (adv.length === 0) adv.push(['AC08', `Average balance on secondary account dropped ${rng.int(10, 25)}% in the last 30 days.`]);

  // ---- Recommendation ------------------------------------------------------
  const tail = `${signal} · Confidence ${confidence}%${label === 'DEGRADED' ? ' (DEGRADED)' : ''}`;
  let recommendation;
  if (decision === 'Auto-Approve') recommendation = mediumCount + highCount ? `APPROVE WITH CONDITIONS · Resolve ${mediumCount + highCount} flag${mediumCount + highCount > 1 ? 's' : ''} before disbursement · ${tail}` : `APPROVE · No blocking flags · ${tail}`;
  else if (decision === 'Auto-Decline') recommendation = `DECLINE · ${adv[0][1].replace(/\.$/, '')} · ${tail}`;
  else recommendation = `REFER TO MANUAL REVIEW · ${rule === 'r3' ? (conflict ? 'Bureau conflict between FirstCentral and CRC' : 'Statement integrity high risk') : rule === 'r4' ? `T1 with DTI ${dti}%` : !mobi.available ? 'MoBI360 unavailable — score computed on BS360 + Bureau only' : 'Manual-review floor enforced at Tier 2'} · ${tail}`;

  // ---- Products ------------------------------------------------------------
  const eligible = PRODUCT_CATALOG.filter((p) => p.status === 'Active' && tierRank(tier) >= tierRank(p.minTier) && decision !== 'Auto-Decline');
  const reasons = { SALARIED_FORMAL: 'Verified formal employer salary deposits', GIG_ECONOMY: 'Gig-platform payouts with stable weekly cadence', MARKET_TRADER: 'High-frequency trading inflows via POS and transfers', MICRO_MERCHANT: 'POS settlement volume supports working-capital product', FREELANCER: 'Freelance income extension detected — growth product eligible' };
  const prequalified = eligible.slice(0, 3).map((p, i) => ({ name: p.name, range: p.range, terms: `${p.tenorText} · ${p.rate} rate · ${p.fee} fee`, why: i === 0 ? `${reasons[persona[0]]} — regularity ${(0.6 + q * 0.35).toFixed(2)}` : p.why, recommended: i === 0 }));

  // ---- Timeline ------------------------------------------------------------
  const t0 = created;
  const stamp = (s) => fmtTimeSec(new Date(t0.getTime() + s * 1000));
  const consentMethod = rng.pick(['In-app consent link', 'Direct capture (analyst)', 'Self-service link']);

  // ---- Bureau --------------------------------------------------------------
  const fcScore = clamp(bu + rng.int(-6, 8), 300, 900), crcScore = clamp(bu + rng.int(-8, 6), 300, 900);
  const delinquent = maxDpd > 30 ? 1 : 0;
  const bureauDims = [
    { name: 'Repayment Behaviour', w: 35, score: clamp(Math.round(1000 - maxDpd * 6 - rng.int(40, 140)), 300, 1000) },
    { name: 'Current Debt Pressure', w: 20, score: clamp(Math.round(980 - dti * 8), 300, 1000) },
    { name: 'Credit Footprint Depth', w: 15, score: clamp(450 + nFac * 70 + rng.int(-40, 40), 300, 1000) },
    { name: 'Credit Seeking Behaviour', w: 15, score: clamp(900 - inquiries * 95 + rng.int(-30, 30), 300, 1000) },
    { name: 'Adverse Markers', w: 10, score: delinquent ? rng.int(520, 700) : 1000 },
    { name: 'Identity & Data Quality', w: 5, score: rng.int(880, 980) },
  ].map((d) => ({ ...d, verdict: d.score >= 720 ? 'STRONG' : d.score >= 620 ? 'MODERATE' : 'WATCH' }));
  const onTime = +(100 - maxDpd / 6 - rng.float(0, 2)).toFixed(1);
  const dimValue = { 'Repayment Behaviour': `${onTime}%`, 'Current Debt Pressure': `${dti}% DTI`, 'Credit Footprint Depth': `${nFac} facilit${nFac === 1 ? 'y' : 'ies'}`, 'Credit Seeking Behaviour': `${inquiries} inquiries / 6mo`, 'Adverse Markers': delinquent ? '1 delinquency' : 'None', 'Identity & Data Quality': 'Verified' };

  const fileAge = +(rng.float(0.6, 9)).toFixed(1);
  const dpdCell = (f) => {
    const nd = Math.max(0, 24 - Math.round((100 - f.start) / 100 * 24) - (f.open ? 0 : 0));
    const cells = Array.from({ length: 24 }, (_, i) => (i < nd ? 'nd' : 'ok'));
    if (maxDpd > 0 && cells.some((c) => c === 'ok')) {
      const idx = rng.int(nd, 23);
      cells[idx] = maxDpd > 90 ? 'd90p' : maxDpd > 60 ? 'd90' : maxDpd > 30 ? 'd60' : 'd30';
    }
    if (!f.open) for (let i = 24 - rng.int(2, 8); i < 24; i++) cells[i] = 'nd';
    return cells;
  };
  const monthsBack = (n) => { const d = new Date(now); d.setMonth(d.getMonth() - n); return `${monthName(d)} ${d.getFullYear()}`; };
  const inqList = facilities.concat(rng.sample(LENDERS, 3).map(([n]) => ({ name: n })))
    .slice(0, Math.max(inquiries, 1)).map((f, i) => ({ when: monthsBack(Math.min(5, Math.floor(i * 1.3))), who: f.name.split(' ')[0] === 'Access' ? 'Access Bank' : f.name.split(' ')[0], urgent: inquiries >= 3 && i < 3 }));

  // ---- MoBI360 ---------------------------------------------------------------
  const mobileIncome = round(net * rng.float(0.96, 1.15), 1000);
  const mobiDims = mobi.available ? [
    { label: 'Income Confirmation', value: mobileIncome > net * 1.05 ? 'EXTENDED' : 'CONFIRMED', sub: mobileIncome > net * 1.05 ? 'Mobile income above BS360' : 'Matches BS360 income' },
    { label: 'Financial Sophistication', value: `${rng.int(0, 3)} savings platforms`, sub: accounts > 1 ? 'Multi-bank detected' : 'Single bank' },
    { label: 'Income Source Diversity', value: `${rng.int(1, 3)} streams`, sub: persona[1] },
    { label: 'Risk Behaviour', value: gamblingPct > 5 ? 'Elevated' : 'Low', sub: gamblingPct > 5 ? 'Betting apps present' : 'No hidden loans' },
    { label: 'Device Tier', value: q > 0.6 ? 'Mid-high' : q > 0.3 ? 'Mid' : 'Entry', sub: 'Consistent with income' },
    { label: 'Signal Confidence', value: `${confidence}%`, sub: `${Math.max(50, confidence - 6)}% with ≥2 sources` },
  ] : [];

  // ---- BS360 deep ------------------------------------------------------------
  const srcShares = (() => {
    const base = persona[0] === 'SALARIED_FORMAL' ? [65, 14, 10, 6, 5] : persona[0] === 'FREELANCER' ? [10, 60, 12, 10, 8] : persona[0] === 'MICRO_MERCHANT' || persona[0] === 'MARKET_TRADER' ? [5, 10, 12, 65, 8] : [20, 45, 15, 12, 8];
    const jit = base.map((v) => Math.max(1, v + rng.int(-4, 4)));
    const s = jit.reduce((a, b) => a + b, 0);
    const pct = jit.map((v) => Math.round((v / s) * 100));
    pct[0] += 100 - pct.reduce((a, b) => a + b, 0);
    return pct;
  })();
  const srcTypes = [['SALARY', 'bg-indigo-500'], ['FREELANCE', 'bg-blue-500'], ['FAMILY', 'bg-amber-500'], ['BUSINESS', 'bg-violet-500'], ['PASSIVE', 'bg-emerald-500']];
  const sources = srcTypes.map(([type, color], i) => ({ type, color, pct: srcShares[i], amount: naira(round(net * srcShares[i] / 100, 1000)), conf: srcShares[i] > 40 ? 'HIGH' : srcShares[i] > 9 ? rng.pick(['HIGH', 'MEDIUM']) : rng.pick(['MEDIUM', 'LOW']) })).sort((a, b) => b.pct - a.pct);

  const cats = ['TRANSFERS', 'FOOD', 'TRANSPORT', 'UTILITY', 'SAVINGS', 'PERSONAL_CARE', 'ENTERTAINMENT', 'HEALTHCARE', 'BETTING', 'OTHER'];
  const catRaw = cats.map((c) => (c === 'BETTING' ? gamblingPct * 1.6 : rng.float(3, c === 'TRANSFERS' ? 30 : c === 'FOOD' ? 22 : 12)));
  const catSum = catRaw.reduce((a, b) => a + b, 0);
  const categories = cats.map((c, i) => [c, Math.round((catRaw[i] / catSum) * 100)]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);

  const balSeries = (() => {
    let v = avgBal; const out = []; let near = 0;
    for (let i = 0; i < 30; i++) {
      v = clamp(v + rng.float(-0.18, 0.2) * avgBal, avgBal * 0.2, avgBal * 1.9);
      if (rng.chance(q < 0.4 ? 0.12 : 0.05)) { out.push(rng.int(200, 900)); near++; } else out.push(Math.round(v));
    }
    return { series: out, near };
  })();
  const minBal = Math.min(...balSeries.series);
  const regularityScore = +(0.55 + q * 0.4 + rng.float(-0.05, 0.05)).toFixed(2);
  const months = Array.from({ length: 4 }, (_, i) => { const d = new Date(now); d.setMonth(d.getMonth() - (4 - i)); return monthName(d); });

  const p2pIn = Array.from({ length: 3 }, () => [shortName(randomName(rng)), `${naira(round(rng.int(10000, 60000), 1000))} · ${rng.int(2, 6)}mo`]);
  const p2pOut = [['Opay Savings', `${naira(round(net * 0.05, 1000))} · ${rng.int(3, 6)}mo`], [shortName(randomName(rng)), `${naira(round(rng.int(10000, 40000), 1000))} · ${rng.int(2, 6)}mo`], ['GTB Investment', `${naira(round(net * 0.03, 1000))} · ${rng.int(2, 5)}mo`]];

  const transfersRaw = [
    ['Opay Savings', round(net * rng.float(0.03, 0.08), 500), 'SAVINGS'],
    ...facilities.filter((f) => f.open).map((f) => [f.name, round(f.amount / f.monthsExp, 500), 'OBLIGATION']),
    [shortName(randomName(rng)), round(rng.int(10000, 50000), 500), 'DEPENDENT'],
    ['DSTV', 18500, 'OTHER'],
    ['GTB Investment', round(net * rng.float(0.02, 0.05), 500), 'SAVINGS'],
  ].sort((a, b) => b[1] - a[1]);
  const tTotal = transfersRaw.reduce((s, t) => s + t[1], 0);
  let cum = 0;
  const transfers = transfersRaw.map(([n, amt, cls], i) => { cum += amt; return [i + 1, n, naira(amt), cls, rng.int(3, 14), `${Math.round((cum / tTotal) * 100)}%`]; });
  const concIdx = transfers.findIndex((t) => parseInt(t[5], 10) >= 60);

  const contributors = [['Self-credit regularity', Math.round(hiddenProb * 0.35)], ['Large self-debits', Math.round(hiddenProb * 0.4)], ['Salary-benchmark gap', Math.round(hiddenProb * 0.25)]];
  const lifestyle = round(net * 12 * rng.float(0.45, hiddenProb > 60 ? 1.25 : 0.95), 1000);

  const gateDetails = [
    ['Docket Presence', mobi.available ? 'All three engine dockets present' : 'BS360 and Bureau dockets present — MoBI360 absent', mobi.available],
    ['Freshness', `Most recent docket: ${rng.int(1, 9)} hours ago — within freshness threshold`, true],
    ['Coherence', `BVN match across all engines — ${rng.int(93, 99)}% identity coherence`, true],
    ['Usable Docket Count', mobi.available ? '3 of 3 dockets usable — FULL scoring path' : '2 of 3 dockets usable — DEGRADED scoring path', mobi.available],
    ['Persona Confidence', `Persona: ${persona[0]} — confidence ${(0.6 + q * 0.35).toFixed(2)}`, true],
    ['Enterprise vs. Inferred Conflict', `Enterprise "${persona[0] === 'SALARIED_FORMAL' ? 'employed' : 'self-employed'}" matches inferred occupation cluster`, true],
    ['Change Detection', 'No docket changes since initial compute', true],
  ];

  const deep = {
    bs360: {
      composite: bs,
      components: [['Income Stability', 25], ['Spending Discipline', 20], ['Obligation Management', 25], ['Liquidity & Resilience', 15], ['Behavioural Integrity', 15]].map(([n, wt]) => ({ name: n, w: `${wt}%`, flex: wt, score: clamp(bs + rng.int(-45, 45), 300, 900) })),
      income: {
        net: naira(net), gross: naira(gross), excluded: loanCredits ? naira(loanCredits) : null, regularity: regularityScore,
        regularityOk: regularityScore >= 0.75, trend: rng.int(-6, 14), cov: rng.int(9, 32),
        salary: { detected: persona[0] === 'SALARIED_FORMAL', signals: persona[0] === 'SALARIED_FORMAL' ? rng.int(3, 4) : rng.int(0, 2), employer: employer[0], sector: employer[1], day: `Day ${rng.int(24, 28)}`, months: rng.int(4, 12), accounts,
          checklist: ['Amount stability', 'Day-of-month window (25–28)', 'Payroll keyword', `Institutional source (${homeBank.short})`], history: Array.from({ length: 6 }, () => (rng.chance(q > 0.5 ? 0.92 : 0.7) ? 'ok' : 'late')) },
        sources,
      },
      spending: {
        eir: outflowPct, surplus: naira(disposable), deficit: disposable < net * 0.05 ? rng.int(1, 3) : 0, fixed: rng.int(35, 60),
        discretionary: rng.int(14, 34), categories, unclassified: rng.int(4, 18), savingsRate: rng.int(2, 18), savingsConsistency: rng.int(40, 95),
        gambling: { amount: naira(round(net * gamblingPct / 100, 500)), freq: gamblingPct > 5 ? `${rng.int(6, 14)}x/month` : `${rng.int(0, 3)}x/month`, pct: gamblingPct },
        discGrowth: rng.int(-3, 12), incGrowth: rng.int(-2, 14),
      },
      obligations: {
        dti, fcf: naira(fcf), maxEmi: naira(round(fcfAfterLiving * 0.4, 1000)),
        waterfall: [['Net Income', net, 'bg-emerald-400'], ['Loan Repayments', obligations, 'bg-rose-400'], ['Rent', rent, 'bg-rose-400'], ['Utilities', utilities, 'bg-rose-400'], ['Education', education, 'bg-rose-400'], ['Free Cash Flow', fcfAfterLiving, 'bg-indigo-400']],
        lenders: nFac, stacking: nFac >= 4, cycling: nFac >= 4 && rng.chance(0.5),
        regularity: facilities.map((f) => [f.name, f.paid, f.monthsExp]),
      },
      balance: { series: balSeries.series, avg: naira(avgBal), avgX: (avgBal / net).toFixed(2), min: naira(minBal), cushion: Math.max(1, Math.round((avgBal / Math.max(outflow, 1)) * 30)), closing: naira(balSeries.series[29]), closingX: (balSeries.series[29] / net).toFixed(2), near: balSeries.near, streak: Math.min(balSeries.near, rng.int(1, 3)), integrityPass: integrity !== 'High Risk' },
      timing: {
        payday: months.map((m) => [m, clamp(Math.round(18 + (1 - q) * 30 + rng.int(-8, 10)), 6, 75)]),
        monthEnd: Array.from({ length: 12 }, () => +(rng.float(0.6, 1.4) + (1 - q) * 1.3).toFixed(1)),
        billConsistency: clamp(Math.round(60 + q * 35 + rng.int(-5, 5)), 40, 99), reversal: +rng.float(0.2, 4).toFixed(1), velocity: rng.int(60, 260),
        inbound: p2pIn, outbound: p2pOut, phone: `080${rng.int(2, 9)}•••${bvn}`,
      },
      fingerprint: {
        family: sources.find((s) => s.type === 'FAMILY').pct >= 8 ? { avg: sources.find((s) => s.type === 'FAMILY').amount, reg: (0.55 + rng.float(0, 0.35)).toFixed(2), names: p2pIn.map((p) => p[0]) } : null,
        hidden: hiddenProb >= 35 ? (hiddenProb >= 60 ? 'LIKELY' : 'POSSIBLE') : null,
        freelance: sources.find((s) => s.type === 'FREELANCE').pct >= 10 ? { avg: sources.find((s) => s.type === 'FREELANCE').amount, reg: (0.5 + rng.float(0, 0.3)).toFixed(2) } : null,
      },
      digital: (() => {
        const mobile = round(rng.int(5000, 20000), 500); const broadband = rng.chance(0.5) ? round(rng.int(15000, 35000), 500) : 0;
        const subs = [['CREATIVE', [['Netflix', '₦5,500'], ['Spotify', '₦1,500'], ['Showmax', '₦2,900']].slice(0, rng.int(1, 3))], ['DEVELOPER', [['iCloud+', '₦2,500'], ['Notion', '₦5,000'], ['GitHub', '₦6,800']].slice(0, rng.int(0, 3))], ['BUSINESS', [['PiggyVest', 'Free'], ['Canva', '₦7,000']].slice(0, rng.int(1, 2))]].filter(([, r]) => r.length);
        const total = mobile + broadband + rng.int(2000, 12000);
        return { mobile: naira(mobile), broadband: broadband ? naira(broadband) : null, provider: rng.pick(['Spectranet', 'Starlink', 'ipNX', 'Smile']), total: naira(total), pct: ((total / net) * 100).toFixed(1), subs, sims: rng.int(1, 3) };
      })(),
      transfers, concentration: concIdx >= 0 ? { rank: concIdx + 1, name: transfers[concIdx][1] } : null,
      hidden: { prob: hiddenProb, contributors, mismatch: lifestyle > net * 12, annualIncome: naira(net * 12), lifestyle: naira(lifestyle), crossMatch: facilities.filter((f) => f.open).map((f) => [f.name, naira(f.outstanding), naira(f.outstanding)]), totalDebt: naira(totalDebt) },
    },
    bureau: {
      composite: bu, riskDegree: clamp(Math.round(100 - q * 85 + rng.int(-5, 5)), 3, 95), recommendation: decision === 'Auto-Decline' ? 'Decline' : mediumCount + highCount ? 'Approve with Conditions' : decision === 'Auto-Approve' ? 'Approve' : 'Refer',
      dims: bureauDims.map((d) => ({ ...d, color: d.verdict === 'STRONG' ? 'bg-emerald-500' : d.verdict === 'MODERATE' ? 'bg-blue-500' : 'bg-amber-500', chips: {
        'Repayment Behaviour': [`Max DPD: ${maxDpd} days`, `${delinquent} arrears`, `24M quality: ${24 - delinquent} OK/${delinquent} late`, '0 judgements'],
        'Current Debt Pressure': [`DTI: ${dti}%`, `Active facilities: ${facilities.filter((f) => f.open).length}`, `Outstanding: ${nairaShort(totalDebt)}`],
        'Credit Footprint Depth': [`File age: ${fileAge} years`, `Facilities: ${nFac}`, `Activity density: ${(nFac / Math.max(fileAge, 1)).toFixed(2)}/yr`],
        'Credit Seeking Behaviour': [`${inquiries} inquiries in 6 months`, inquiries >= 3 ? '1 urgency cluster detected' : 'No urgency cluster'],
        'Adverse Markers': [`${delinquent ? 1 : 0} dishonoured cheques`, '0 judgements', '0 fraud flags'],
        'Identity & Data Quality': ['BVN: Verified', `Name match: ${rng.int(92, 99)}%`, 'DOB: Verified'],
      }[d.name] })),
      dpd: facilities.map((f) => ({ name: f.name, max: `Max DPD 12M: ${maxDpd && rng.chance(0.6) ? maxDpd : 0} days`, trend: maxDpd > 30 ? 'DETERIORATING' : f.start > 60 ? 'IMPROVING' : 'STABLE', cells: dpdCell(f) })),
      dpdMetrics: [['Max Dpd12 M', maxDpd, maxDpd === 0 ? 'CURRENT' : maxDpd <= 30 ? 'MINOR' : 'SEVERE'], ['Max Facilities Overdue12 M', delinquent, delinquent ? 'OVERDUE' : 'CURRENT'], ['Current Accounts In Arrears', delinquent, delinquent ? 'ARREARS' : 'CURRENT'], ['Active Arrear Amount', delinquent ? naira(round(totalDebt * 0.08, 1000)) : '0', delinquent ? 'ARREARS' : 'CURRENT']],
      delinquent,
      facilities: facilities.map((f) => ({ name: f.name, open: f.open, amount: naira(f.amount), start: f.start, end: f.open ? 100 : clamp(f.start + rng.int(20, 40), f.start + 10, 95) })),
      lifetime: naira(facilities.reduce((s, f) => s + f.amount, 0)),
      termShare: Math.round((facilities.filter((f) => f.productType === 'TERM_LOAN').length / Math.max(nFac, 1)) * 100),
      commercialShare: Math.round((facilities.filter((f) => f.lenderType === 'COMMERCIAL').length / Math.max(nFac, 1)) * 100),
      fileAge, density: (nFac / Math.max(fileAge, 1)).toFixed(2),
      bureauDti: Math.max(3, dti - rng.int(1, 6)), trueDti: dti, headroom: naira(round(fcf * rng.float(1.0, 1.1), 1000)), fcf: naira(fcf), maxEmi: naira(round(fcf * 0.42, 100)), outstanding: naira(totalDebt),
      concentration: facilities.length ? { pct: Math.round((Math.max(...facilities.map((f) => f.outstanding)) / Math.max(totalDebt, 1)) * 100), lender: facilities.reduce((a, b) => (b.outstanding > a.outstanding ? b : a)).name.split(' ')[0] } : null,
      inquiries: inqList, inquiryCount: inquiries, conversion: rng.int(25, 80), inquiryScore: bureauDims[3].score,
      instMix: [['COMMERCIAL_BANK', facilities.filter((f) => f.lenderType === 'COMMERCIAL').length], ['DIGITAL_BANK', facilities.filter((f) => f.lenderType === 'DIGITAL').length]],
      prodMix: [['TERM_LOAN', facilities.filter((f) => f.productType === 'TERM_LOAN').length], ['RETAIL', facilities.filter((f) => f.productType === 'RETAIL').length]],
      recon: [
        ['BVN', `22${rng.digits(5)}${bvn}`, null, true], ['Full Name', name, `${name.split(' ')[0]} ${rng.pick(['A.', 'O.', 'C.', 'I.'])} ${name.split(' ')[1]}`, true],
        ['DOB', `${String(rng.int(1, 28)).padStart(2, '0')}-${rng.pick(['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'])}-${rng.int(1972, 2003)}`, null, true],
        ...facilities.filter((f) => f.open).map((f) => [f.name, naira(f.outstanding), naira(f.outstanding), true]),
        ...(conflict ? [['CRC-only facility', '—', naira(round(rng.int(80000, 400000), 1000)), false]] : []),
        ['Inquiry Count (6mo)', String(inquiries), String(inquiries + rng.int(0, 2)), null],
      ].map(([f, a, b, ok]) => [f, a, b ?? a, ok === null ? a === (b ?? a) : ok]),
      identity: { address: `${rng.pick(['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Enugu', 'Kano'])} (current)`, employer: employer[0] },
      fcScore, crcScore, conflict,
    },
    mobi: mobi.available ? {
      composite: mo, confidence, matchRate: rng.int(52, 78), mobileIncome: naira(mobileIncome), netIncome: naira(net), gap: (((mobileIncome - net) / net) * 100).toFixed(1),
      hidden: hiddenProb >= 35 ? (hiddenProb >= 60 ? 'LIKELY' : 'POSSIBLE') : 'UNLIKELY', betting: Math.round(gamblingPct * 5 + rng.int(0, 10)), gamblingPct, gamblingAmt: naira(round(net * gamblingPct / 100, 500)),
      channels: {
        SMS: [{ title: 'Salary credit alerts confirmed', code: 'SALARY_CONFIRMED', sources: 2, check: 'BS360 income_regularity' }, ...(facilities[0] ? [{ title: `Loan disbursement from ${facilities[0].name.split(' ')[0]} detected`, code: 'LOAN_DISBURSEMENT', sources: 1, check: 'BS360 obligations' }] : []), { title: maxDpd > 30 ? 'Overdue lender reminders detected' : 'No overdue lender alerts', code: maxDpd > 30 ? 'OVERDUE_ALERTS' : 'NO_OVERDUE_ALERTS', sources: 1, check: 'Bureau repayment' }],
        Email: [{ title: `Payroll emails from ${employer[0]}`, code: 'PAYROLL_EMAIL', sources: 2, check: 'BS360 salary_detection' }, { title: 'Flutterwave receipt resolved — Chowdeck delivery', code: 'RECEIPT_MATCH', sources: 2, check: 'BS360 spend_categorization' }],
        'App Inventory': [{ title: 'Savings apps: PiggyVest, Cowrywise', code: 'SAVINGS_APP', sources: 2, check: 'BS360 savings_rate' }, { title: gamblingPct > 5 ? 'Betting apps installed: Bet9ja, SportyBet' : 'No betting apps installed', code: gamblingPct > 5 ? 'BETTING_APPS' : 'NO_BETTING_APPS', sources: 2, check: 'BS360 gambling' }, { title: 'No hidden/overdue loan apps', code: 'NO_LOAN_APPS', sources: 1, check: 'Bureau facilities' }],
        Device: [['Device Tier', q > 0.6 ? 'Mid-high' : q > 0.3 ? 'Mid' : 'Entry', 'CONSISTENT_WITH_INCOME'], ['Rooted Device', 'NO', ''], ['Primary Number vs Application Number', 'MATCH', '']],
        WhatsApp: [{ title: persona[0] === 'MICRO_MERCHANT' || persona[0] === 'MARKET_TRADER' ? 'Business WhatsApp detected (separate from personal)' : 'Personal WhatsApp only', code: persona[0] === 'MICRO_MERCHANT' || persona[0] === 'MARKET_TRADER' ? 'BUSINESS_WA' : 'PERSONAL_WA', sources: 1, check: 'BS360 business_income' }],
        'Creator/Freelance': [{ title: persona[0] === 'FREELANCER' ? 'Creator payouts detected (YouTube, Selar)' : 'TikTok installed — no creator income signals', code: persona[0] === 'FREELANCER' ? 'CREATOR_INCOME' : 'NO_CREATOR_INCOME' }],
      },
      funnel: (() => { const a = [rng.int(30, 48), rng.int(12, 22), rng.int(10, 18), rng.int(8, 14), rng.int(5, 10)]; const u = Math.max(2, 100 - a.reduce((x, y) => x + y, 0)); return [['Email Receipt Match', a[0], '0.95'], ['SMS Confirmation', a[1], '0.85'], ['Amount Signature', a[2], '0.8'], ['Recurring Pattern', a[3], '0.75'], ['Narration Context', a[4], '0.5'], ['Unresolved', u, '—']]; })(),
      resolved: rng.sample(GATEWAY_NARRATIONS, 5),
      resolutionRate: rng.int(86, 97),
      dims: [['Income Confirmation & Extension (25%)', clamp(mo + rng.int(-20, 30), 300, 900)], ['Financial Sophistication (20%)', clamp(mo + rng.int(-30, 30), 300, 900)], ['Income Source Diversity (20%)', clamp(mo + rng.int(-30, 20), 300, 900)], ['Risk Behaviour Penalty (20%)', -Math.round(gamblingPct * 8 + rng.int(10, 40))], ['Occupation & Professional Signal (15%)', clamp(mo + rng.int(-40, 20), 300, 900)]],
    } : null,
    gates: gateDetails,
    persona: { name: persona[1], conf: Math.round((0.6 + q * 0.35) * 100) },
    overlay: [['Age', String(rng.int(23, 54)), null], ['Risk Level', q > 0.6 ? 'Low' : q > 0.35 ? 'Medium' : 'High', q > 0.6 ? 'Low' : 'Medium'], ['Income Level', `${nairaShort(net)}/mo`, null], ['Employment', persona[0] === 'SALARIED_FORMAL' ? 'Employed' : 'Self-employed', null]].map(([k, a, b]) => [k, a, b ?? a]),
    computed: `${fmtDate(created)}, ${fmtTime(created)}`,
    consolidated: [
      { q: 'How much does this person really earn?', a: `${nairaShort(net)}/month adjusted net income`, rows: [['BS360', 'CONFIRMS', `Adjusted Net Income ${nairaShort(net)} (loan-excluded)`], ...(mobi.available ? [['MoBI360', mobileIncome > net * 1.05 ? 'EXTENDS' : 'CONFIRMS', `Mobile income ${nairaShort(mobileIncome)}${mobileIncome > net * 1.05 ? ' — extra income detected on device' : ''}`]] : []), ['Bureau', persona[0] === 'SALARIED_FORMAL' ? 'CONFIRMS' : 'UNVERIFIED', persona[0] === 'SALARIED_FORMAL' ? `Employer "${employer[0]}" named on facility` : 'No employer on bureau file']] },
      { q: 'How much debt do they actually carry?', a: `${nairaShort(totalDebt)} total — ${dti}% True DTI`, rows: [['Bureau', conflict ? 'EXTENDS' : 'CONFIRMS', `${facilities.filter((f) => f.open).length} declared facilities, ${nairaShort(totalDebt)} outstanding`], ['BS360', 'CONFIRMS', `${nFac} detected repayment streams — ${conflict ? 'one unmatched on bureau' : 'all matched to bureau'}`], ...(mobi.available ? [['MoBI360', 'CONFIRMS', 'No undisclosed lenders via SMS/apps']] : [])] },
      { q: "Is there anything this person hasn't told us?", a: hiddenProb >= 60 ? 'LIKELY hidden holding account — not CERTAIN' : hiddenProb >= 35 ? 'POSSIBLE secondary account — monitor' : 'Nothing material detected', warn: hiddenProb >= 35, rows: [['BS360', hiddenProb >= 35 ? 'EXTENDS' : 'CONFIRMS', `Holding Account Probability: ${hiddenProb}`], ...(mobi.available ? [['MoBI360', hiddenProb >= 35 ? 'EXTENDS' : 'CONFIRMS', hiddenProb >= 35 ? '2 of 3 sources confirm (SMS, Apps)' : 'No secondary-account alerts']] : []), ['Bureau', 'UNVERIFIED', 'No undisclosed facilities on bureau']], note: hiddenProb >= 35 ? 'Contradiction/Unverified signals are never silently resolved — investigation action required per shared severity format.' : null },
      { q: 'What does their repayment character look like?', a: maxDpd === 0 ? `Strong — ${onTime}% on-time, no adverse markers` : maxDpd <= 30 ? `Fair — minor slippage, worst ${maxDpd} DPD` : `Weak — worst ${maxDpd} DPD in 12 months`, rows: [['Bureau', maxDpd > 30 ? 'EXTENDS' : 'CONFIRMS', `24M: ${24 - delinquent} OK/${delinquent} late, 0 judgements`], ['BS360', 'CONFIRMS', `Repayment regularity: ${facilities.filter((f) => f.paid === f.monthsExp).length}/${nFac} lenders paying consistently`]] },
      { q: 'Are there risk behaviours that should give us pause?', a: gamblingPct > 5 ? 'Elevated — frequent betting spend' : 'Low — OCCASIONAL betting, no hidden loans', warn: gamblingPct > 5, rows: [['BS360', gamblingPct > 5 ? 'EXTENDS' : 'CONFIRMS', `Gambling spend ${nairaShort(net * gamblingPct / 100)} (${gamblingPct}% of income) — ${gamblingPct > 5 ? 'above' : 'within'} 5% threshold`], ...(mobi.available ? [['MoBI360', 'CONFIRMS', gamblingPct > 5 ? 'Betting apps installed, high SMS frequency' : 'No betting apps, low SMS frequency']] : [])] },
    ],
  };

  const report = {
    id, name, bvn, phone: `+234 80${rng.int(2, 9)} ••• ${bvn}`, signal, score, risk, debt, tier, decision, confidence, policy: 'v4.2', label,
    mobiKey, mobiCode: mobi.code,
    engines: {
      bs360: { weight: mobi.available ? '45% weight' : '70% (redistributed)', redistributed: !mobi.available, source: `Item-linked auto-pull (${accounts} account${accounts > 1 ? 's' : ''})`, score: bs },
      bureau: { weight: '30% weight', source: conflict ? 'FirstCentral + CRC (conflict flagged)' : 'FirstCentral + CRC (reconciled)', score: bu },
      mobi: { weight: mobi.available ? '25% weight' : '0% (redistributed)', source: mobi.source, score: mo, available: mobi.available },
    },
    flags: topFlags, recommendation,
    pipeline: [['Consent & Retrieval', rng.int(3, 7)], ['Statement Integrity', rng.int(4, 9)], ['Narration Enrichment', rng.int(2, 5)], ['Engine Scoring', rng.int(3, 7)], ['Main Thinker Synthesis', rng.int(1, 3)]].map(([n, t]) => ({ name: n, t: `${t}s` })),
    consent: { method: consentMethod, at: `${fmtDate(created)}, ${fmtTime(created)} WAT`, by: analyst },
    sources: [[`${homeBank.short} — ${accounts} account${accounts > 1 ? 's' : ''}`, 'API', stamp(3)], ['FirstCentral Bureau', 'API', stamp(6)], ['CRC Bureau', 'API', stamp(8)], ['MoBI360 SDK', mobi.available ? 'API' : 'Manual', stamp(10)]],
    bs360Metrics: [
      { label: 'Avg Monthly Inflow', value: nairaShort(gross), sub: `${q > 0.5 ? '+' : ''}${Math.round((q - 0.5) * 60)}% vs segment` },
      { label: 'Avg Monthly Outflow', value: nairaShort(outflow), sub: `${outflowPct}% of inflow` },
      { label: 'Avg Balance', value: nairaShort(avgBal), sub: '6-month average' },
      { label: 'Self-transfer Ratio', value: `${selfTransfer}%`, sub: 'Threshold 12%' },
      { label: 'Betting / Gambling Rate', value: `${gamblingPct}%`, sub: 'Threshold 5%' },
      { label: 'Disposable Income', value: nairaShort(disposable), sub: 'After obligations' },
    ],
    integrity: {
      status: integrity, score: authenticity,
      checks: integrity === 'Clear' ? [
        { name: 'Metadata / edit-history', detail: 'No PDF editing software signatures detected', ok: true },
        { name: 'Arithmetic reconciliation', detail: 'Running balance reconciles transaction-by-transaction (0 anomalies)', ok: true },
        { name: 'Template / generation', detail: `Layout matches ${homeBank.short} known statement template`, ok: true },
        { name: 'Font / alignment', detail: `No font inconsistencies across ${rng.int(8, 26)} pages`, ok: true },
      ] : [
        { name: 'Metadata / edit-history', detail: integrity === 'High Risk' ? 'PDF producer field shows editing software after issue date' : 'Metadata incomplete — producer field missing', ok: false },
        { name: 'Arithmetic reconciliation', detail: `Running balance breaks on ${integrity === 'High Risk' ? rng.int(5, 14) : rng.int(1, 3)} rows`, ok: false },
        { name: 'Template / generation', detail: `Layout matches ${homeBank.short} known statement template`, ok: integrity !== 'High Risk' },
        { name: 'Font / alignment', detail: integrity === 'High Risk' ? 'Font substitution detected on amount columns' : 'No font inconsistencies', ok: integrity !== 'High Risk' },
      ],
    },
    bureau: {
      rows: [['Score', fcScore, crcScore], ['Facilities', facilities.filter((f) => f.open).length, facilities.filter((f) => f.open).length + (conflict ? 1 : 0)], ['Delinquent', delinquent, delinquent]],
      conflict,
      waterfall: conflict ? 'Facility mismatch — CRC reports a loan absent on FirstCentral → adverse value carried forward, referred for investigation' : `Match on account numbers — scores within ${Math.abs(fcScore - crcScore)}pt tolerance → confidence-weighted blend (FC ${50 + rng.int(0, 4)}% / CRC ${50 - rng.int(0, 4)}%)`,
      dims: bureauDims.map((d) => ({ name: d.name, w: `${d.w}%`, value: dimValue[d.name], verdict: d.verdict })),
    },
    mobiDims, positive: pos.slice(0, 4), adverse: adv.slice(0, 3), prequalified,
    lineage: [
      ['ShieldCheck', 'Consent Capture', `${consentMethod} — captured by ${analyst}`, stamp(1), 'Recorded'],
      ['Database', `${homeBank.short} — Item item_${rng.hex(4)}`, `${accounts} account${accounts > 1 ? 's' : ''} retrieved (statements)`, stamp(3), 'Retrieved'],
      ['Database', 'FirstCentral Bureau', `Bureau report pulled (${facilities.filter((f) => f.open).length} facilities)`, stamp(6), 'Retrieved'],
      ['Database', 'CRC Bureau', `Bureau report pulled (${facilities.filter((f) => f.open).length + (conflict ? 1 : 0)} facilities)`, stamp(8), 'Retrieved'],
      ['Database', 'MoBI360 SDK', mobi.available ? 'Behavioral telemetry fetched' : `Unavailable — ${mobi.code}`, stamp(10), mobi.available ? 'Retrieved' : 'Skipped'],
      ['Check', 'Statement Integrity', `Authenticity score: ${authenticity} (${integrity})`, stamp(16), integrity === 'Clear' ? 'Passed' : 'Flagged'],
      ['GitMerge', 'Bureau Reconciliation', conflict ? 'Waterfall path: mismatch → adverse carried' : 'Waterfall path: match → blended', stamp(18), 'Resolved'],
    ],
    deep,
    // used by portfolio aggregates
    facts: { net, dti, totalDebt, maxDpd, gamblingPct, homeBank: homeBank.short, accounts, adverseCodes: adv.map((a) => a[0]), integrity, rule },
  };

  return { check, report };
}
