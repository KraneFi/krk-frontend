// Builds a complete, internally consistent dummy dataset for the whole platform
// from one seed. Same seed → same data; a new seed → a fresh dataset.

import { makeRng, clamp, round, naira, nairaShort, fmtDate, minutesAgo, relTime, monthName, shortName, initials } from './rng.js';
import { makeCheck, randomName, tierOf } from './gen-check.js';
import { PRODUCT_CATALOG } from './catalog.js';
import { BANKS } from './pools.js';

const TIERS = ['T0', 'T1', 'T2', 'T3', 'T4', 'T5'];
const ROLES = ['Credit/Risk Analyst', 'Credit/Risk Analyst', 'Credit Ops (Policy)', 'Developer', 'Compliance Officer', 'Viewer', 'Collections Officer'];

export function generateData(seed) {
  const rng = makeRng(seed);
  const now = new Date();

  // ---- Team ---------------------------------------------------------------
  const team = Array.from({ length: rng.int(6, 8) }, (_, i) => {
    const name = randomName(rng);
    const role = i < ROLES.length ? ROLES[i] : rng.pick(ROLES);
    return { name, email: `${name.split(' ')[0].toLowerCase()}@kranetech.ng`, role, status: rng.chance(0.12) ? 'Suspended' : 'Active', last: relTime(rng.int(3, 4000)) };
  });
  const USERS = [{ name: 'Dammy Krane', email: 'dammy@kranetech.ng', role: 'Admin', status: 'Active', last: 'now' }, ...team];
  const analysts = ['You', ...team.filter((t) => t.role === 'Credit/Risk Analyst').map((t) => shortName(t.name))];
  const policyOps = team.find((t) => t.role === 'Credit Ops (Policy)')?.name || 'You';

  // ---- Checks -------------------------------------------------------------
  const nChecks = rng.int(36, 56);
  let mins = rng.int(1, 6);
  const generated = [];
  const usedIds = new Set();
  for (let i = 0; i < nChecks; i++) {
    let id; do { id = `chk_${rng.hex(4)}`; } while (usedIds.has(id)); usedIds.add(id);
    generated.push(makeCheck(rng, { now, minsAgo: mins, id, analyst: rng.weighted(analysts.map((a, k) => [a, k === 0 ? 4 : 2])) }));
    mins += rng.int(8, 420);
  }
  const CHECKS = generated.map((g) => g.check);
  const REPORTS = Object.fromEntries(generated.map((g) => [g.check.id, g.report]));

  // ---- Dashboard aggregates ----------------------------------------------
  const count = (fn) => CHECKS.filter(fn).length;
  const total = CHECKS.length;
  const totalChecks = rng.int(900, 2400);
  const successPct = rng.float(0.71, 0.84);
  const avgScore = Math.round(CHECKS.reduce((s, c) => s + c.score, 0) / total);
  const activeProducts = PRODUCT_CATALOG.length;
  const DASH_STATS = [
    { label: 'Total Checks', value: totalChecks.toLocaleString(), trend: `+${rng.float(3, 18).toFixed(1)}%`, icon: 'FileCheck' },
    { label: 'Successful Checks', value: Math.round(totalChecks * successPct).toLocaleString(), trend: `+${rng.float(2, 12).toFixed(1)}%`, icon: 'CircleCheck' },
    { label: 'Avg KRK Score', value: String(avgScore), trend: `${rng.chance(0.75) ? '+' : '−'}${rng.int(1, 9)} pts`, icon: 'Gauge' },
    { label: 'Active Products', value: String(activeProducts), trend: '0', icon: 'Package', flat: true },
  ];

  const aa = count((c) => c.decision === 'Auto-Approve'), ad = count((c) => c.decision === 'Auto-Decline');
  const mr = count((c) => c.decision === 'Manual Review' || c.decision === 'Refer');
  const pct = (n) => Math.round((n / total) * 100);
  const AUTO_RATE = pct(aa + ad);
  const POLICY_PERF = [
    { label: 'Approval Rate', value: pct(aa + Math.round(mr * 0.6)), color: 'bg-emerald-500' },
    { label: 'Manual Review', value: pct(mr), color: 'bg-amber-500' },
    { label: 'Decline Rate', value: pct(ad), color: 'bg-rose-500' },
    { label: 'Override Rate', value: rng.int(4, 15), color: 'bg-violet-500' },
  ];
  const degradedN = count((c) => REPORTS[c.id].label === 'DEGRADED');
  const avgConf = CHECKS.reduce((s, c) => s + REPORTS[c.id].confidence, 0) / total;
  const DRIFT = { conf: avgConf.toFixed(1), delta: rng.float(-3, 2).toFixed(1), degradedPct: pct(degradedN), full: total - degradedN, degraded: degradedN, healthy: pct(degradedN) <= 15 };

  const reasonMap = { AC01: 'High DTI ratio', AC04: 'Bureau delinquency history', AC06: 'Statement integrity flag', AC09: 'Insufficient transaction history', AC02: 'Credit-seeking behaviour', AC07: 'Betting spend above threshold' };
  const reasonCounts = {};
  CHECKS.filter((c) => c.decision !== 'Auto-Approve').forEach((c) => {
    REPORTS[c.id].facts.adverseCodes.forEach((code) => { if (reasonMap[code]) reasonCounts[reasonMap[code]] = (reasonCounts[reasonMap[code]] || 0) + 1; });
    if (c.tier === 'T0' || c.tier === 'T1') reasonCounts['Low KRK tier (T0/T1)'] = (reasonCounts['Low KRK tier (T0/T1)'] || 0) + 1;
  });
  const rcTotal = Object.values(reasonCounts).reduce((a, b) => a + b, 0) || 1;
  const DECLINE_REASONS = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, n]) => ({ label, value: Math.round((n / rcTotal) * 100) }));

  const lendable = CHECKS.filter((c) => c.decision !== 'Auto-Decline');
  const TIER_DIST = TIERS.map((t) => ({ tier: t, raw: Math.round((count((c) => c.tier === t) / total) * 100), post: Math.round((lendable.filter((c) => c.tier === t).length / Math.max(lendable.length, 1)) * 100) }));

  // ---- Products -----------------------------------------------------------
  const PRODUCTS = PRODUCT_CATALOG.map((p) => {
    if (p.status === 'Draft') return { ...p, matched: 0, accepted: 0, defaulted: 0 };
    const matched = rng.int(p.status === 'Paused' ? 40 : 60, 600);
    const accepted = Math.round(matched * rng.float(0.22, 0.58));
    return { ...p, matched, accepted, defaulted: Math.round(accepted * rng.float(0, 0.04)) };
  });

  // ---- Offers (loan queue) -------------------------------------------------
  const STAGES = ['Offer Sent', 'Viewed', 'Accepted', 'Pending Disbursement', 'Disbursed'];
  const offerChecks = rng.shuffle(lendable.filter((c) => REPORTS[c.id].prequalified.length)).slice(0, rng.int(9, 14));
  const OFFERS = offerChecks.map((c, i) => {
    const p = PRODUCT_CATALOG.find((x) => x.name === REPORTS[c.id].prequalified[0].name);
    const cap = Math.min(p.max, Math.max(p.min, round(REPORTS[c.id].facts.net * rng.float(0.4, 2.6), 10000)));
    return { id: `o${i}`, checkId: c.id, name: c.name, product: p.name, tier: c.tier, amount: round(rng.int(p.min, cap), 10000), stage: rng.weighted([['Offer Sent', 3], ['Viewed', 3], ['Accepted', 2], ['Pending Disbursement', 1], ['Disbursed', 2]]), ago: relTime(rng.int(2, 900)) };
  });

  // ---- Servicing ----------------------------------------------------------
  const loanCount = rng.int(260, 720);
  const shares = [rng.float(0.89, 0.95)];
  let rest = 1 - shares[0];
  [0.55, 0.22, 0.13].forEach((f) => { const v = rest * f * rng.float(0.8, 1.2); shares.push(v); });
  shares.push(Math.max(0.002, 1 - shares.reduce((a, b) => a + b, 0)));
  const bookTotal = round(rng.float(70, 280) * 1e6, 1e5);
  const BUCKET_STYLE = [['Current', 'text-emerald-700', 'bg-emerald-400'], ['DPD 1–30', 'text-orange-600', 'bg-amber-500'], ['DPD 31–60', 'text-orange-600', 'bg-amber-500'], ['DPD 61–90', 'text-rose-600', 'bg-rose-500'], ['DPD 90+', 'text-rose-600', 'bg-rose-500']];
  const BUCKETS = shares.map((s, i) => {
    const amt = bookTotal * s;
    return { label: BUCKET_STYLE[i][0], labelCls: BUCKET_STYLE[i][1], bar: BUCKET_STYLE[i][2], loans: Math.max(1, Math.round(loanCount * s * (i === 0 ? 1 : rng.float(0.7, 1.2)))), amount: nairaShort(amt), share: +(s * 100).toFixed(1), book: `${+(s * 100).toFixed(1)}% of book`, raw: amt };
  });
  const overdue = BUCKETS.slice(1).reduce((s, b) => s + b.raw, 0);
  const par = (from) => +((BUCKETS.slice(from).reduce((s, b) => s + b.raw, 0) / bookTotal) * 100).toFixed(1);
  const PAR_NOW = { par30: par(2), par60: par(3), par90: par(4) };
  const PAR_SERIES = (() => {
    const months = Array.from({ length: 7 }, (_, i) => { const d = new Date(now); d.setMonth(d.getMonth() - (6 - i)); return monthName(d); });
    const trend = rng.chance(0.7) ? -1 : 1; // improving most of the time
    const series = [];
    let a = PAR_NOW.par30, b = PAR_NOW.par60, c = PAR_NOW.par90;
    for (let i = 6; i >= 0; i--) {
      series[i] = { m: months[i], par30: +a.toFixed(1), par60: +b.toFixed(1), par90: +c.toFixed(1) };
      a = clamp(a - trend * rng.float(0.05, 0.4), 0.3, 9); b = clamp(Math.min(b - trend * rng.float(0.03, 0.3), a - 0.2), 0.2, 8); c = clamp(Math.min(c - trend * rng.float(0.02, 0.2), b - 0.1), 0.1, 6);
    }
    return { series, improving: trend < 0 };
  })();

  const loanSource = [...OFFERS.filter((o) => o.stage === 'Disbursed').map((o) => CHECKS.find((c) => c.id === o.checkId)), ...rng.shuffle(lendable)].filter((c, i, arr) => arr.findIndex((x) => x.name === c.name) === i).slice(0, rng.int(8, 14));
  const LOANS = loanSource.map((c) => {
    const p = PRODUCT_CATALOG.find((x) => x.name === (REPORTS[c.id].prequalified[0]?.name || 'QuickCash Personal'));
    const principal = round(rng.int(p.min, Math.min(p.max, Math.max(p.min * 2, REPORTS[c.id].facts.net * 2))), 10000);
    const dpd = rng.weighted([[0, 12], [rng.int(3, 29), 3], [rng.int(31, 59), 2], [rng.int(61, 89), 1], [rng.int(91, 140), 1]]);
    const bucket = dpd === 0 ? 'Current' : dpd <= 30 ? 'DPD 1–30' : dpd <= 60 ? 'DPD 31–60' : dpd <= 90 ? 'DPD 61–90' : 'DPD 90+';
    const fresh = rng.chance(0.15) && dpd === 0;
    return { name: c.name, tier: c.tier, product: p.name, principal: naira(principal), outstanding: naira(fresh ? principal : round(principal * rng.float(0.3, 0.95), 1000)), outstandingRaw: principal, dpd, bucket, status: dpd > 30 ? 'delinquent' : fresh ? 'disbursed' : 'repaying' };
  });
  const COLLECTIONS = LOANS.filter((l) => l.dpd > 0).sort((a, b) => b.dpd - a.dpd).map((l) => ({
    name: l.name, tier: l.tier, bucket: l.bucket, contact: relTime(rng.int(600, 10000)), amount: l.outstanding, dpd: l.dpd,
    promise: rng.chance(0.55) ? (() => { const d = new Date(now); d.setDate(d.getDate() + rng.int(2, 12)); return `${nairaShort(round(l.outstandingRaw * rng.float(0.05, 0.3), 1000))} by ${monthName(d)} ${d.getDate()}`; })() : null,
  }));
  const SERVICING_STATS = [
    { label: 'Total Outstanding', value: nairaShort(bookTotal), icon: 'Wallet', tile: 'bg-indigo-50 text-indigo-600' },
    { label: 'PAR (1+)', value: `${((overdue / bookTotal) * 100).toFixed(1)}%`, sub: `${nairaShort(overdue)} outstanding`, icon: 'TrendingDown', tile: 'bg-rose-50 text-rose-600' },
    { label: 'Active Loans', value: BUCKETS.reduce((s, b) => s + b.loans, 0).toLocaleString(), icon: 'Wallet', tile: 'bg-violet-50 text-violet-600' },
    { label: 'In Collections', value: String(COLLECTIONS.length), icon: 'AlertTriangle', tile: 'bg-amber-50 text-amber-600' },
  ];

  // ---- Activity feed --------------------------------------------------------
  const ACTIVITY = [];
  CHECKS.slice(0, 2).forEach((c) => ACTIVITY.push({ mins: c.minsAgo, icon: 'FileCheck', tone: 'text-indigo-500', title: 'KRK report completed', detail: `${c.signal} — ${shortName(c.name)}`, tier: c.tier, to: `/checks/${c.id}` }));
  const flagged = CHECKS.find((c) => c.integrity !== 'Clear');
  if (flagged) ACTIVITY.push({ mins: flagged.minsAgo, icon: 'ShieldAlert', tone: 'text-amber-500', title: 'Statement flagged', detail: `Authenticity ${REPORTS[flagged.id].integrity.score} — ${shortName(flagged.name)}`, to: `/checks/${flagged.id}` });
  const acc = OFFERS.find((o) => o.stage === 'Accepted');
  if (acc) ACTIVITY.push({ mins: rng.int(10, 200), icon: 'CircleCheck', tone: 'text-emerald-500', title: 'Offer accepted', detail: `${naira(acc.amount)} — ${shortName(acc.name)}`, to: '/loan-queue' });
  const dis = OFFERS.find((o) => o.stage === 'Disbursed');
  if (dis) ACTIVITY.push({ mins: rng.int(30, 400), icon: 'Zap', tone: 'text-violet-500', title: 'Loan disbursed', detail: `${nairaShort(dis.amount)} — ${shortName(dis.name)}`, to: '/servicing' });
  ACTIVITY.push({ mins: rng.int(120, 900), icon: 'FileText', tone: 'text-slate-500', title: 'Policy v4.2 published', detail: `Auto-decision ceiling → ${rng.int(65, 75)}%`, to: '/decision-engine' });
  const resolved = CHECKS.find((c) => (c.decision === 'Manual Review' || c.decision === 'Refer') && c.status === 'Completed');
  if (resolved) ACTIVITY.push({ mins: resolved.minsAgo + rng.int(10, 90), icon: 'FileCheck', tone: 'text-indigo-500', title: 'Manual review resolved', detail: `${rng.pick(['Confirmed genuine', 'Approved with conditions', 'Declined after review'])} — ${resolved.analyst === 'You' ? 'You' : resolved.analyst}`, to: `/checks/${resolved.id}` });
  ACTIVITY.sort((a, b) => a.mins - b.mins).forEach((a) => { a.ago = relTime(a.mins); });

  // ---- Segments / versions ---------------------------------------------------
  const segNames = ['Salaried / Formal', 'Gig Economy', 'Market Trader / Informal', 'Micro-merchant / POS', 'Freelancer / Creator'];
  const segRaw = segNames.map(() => rng.int(80, 520));
  const segTotal = segRaw.reduce((a, b) => a + b, 0);
  const SEGMENTS = segNames.map((n, i) => ({ name: n, customers: segRaw[i], pct: Math.round((segRaw[i] / segTotal) * 100) }));
  const daysAgo = (d) => fmtDate(minutesAgo(now, d * 1440));
  const VERSIONS = [
    { v: 'v4.2', status: 'Published', note: `Adjusted DTI ceiling from ${rng.int(36, 42)}% to 35% for T3 tier`, by: `You · ${daysAgo(rng.int(5, 20))}` },
    { v: 'v4.1', status: 'Archived', note: 'Added rule: auto-decline on Statement Integrity High Risk', by: `${shortName(policyOps)} · ${daysAgo(rng.int(25, 40))}` },
    { v: 'v4.0', status: 'Archived', note: 'Added POS Merchant Boost segment rules', by: `You · ${daysAgo(rng.int(45, 60))}` },
    { v: 'v3.3', status: 'Archived', note: 'Lowered manual-review floor from 35% to 30%', by: `${shortName(team[1]?.name || 'Kemi Okafor')} · ${daysAgo(rng.int(70, 100))}` },
  ];

  // ---- Approvals & audit -------------------------------------------------------
  const maker = () => rng.pick([...team.filter((t) => t.status === 'Active').map((t) => t.name), 'You']);
  const bigOffers = OFFERS.filter((o) => o.amount > 1000000 && (o.stage === 'Accepted' || o.stage === 'Pending Disbursement'));
  const APPROVALS = [
    { id: 'a1', type: 'POLICY PUBLISH', urgent: true, title: 'Decision Policy v4.3', meta: `Publish new version · Requested by ${policyOps} · ${relTime(rng.int(20, 200))}` },
    ...bigOffers.slice(0, 2).map((o, i) => ({ id: `ad${i}`, type: 'DISBURSEMENT', urgent: true, title: `${naira(o.amount)} — ${shortName(o.name)}`, meta: `Approve disbursement · Requested by ${maker()} · ${relTime(rng.int(10, 300))}` })),
    { id: 'a3', type: 'ADMIN INVITE', urgent: false, title: `${randomName(rng).split(' ')[0].toLowerCase()}@kranetech.ng`, meta: `Approve invite · Requested by Dammy Krane · ${relTime(rng.int(60, 600))}` },
    { id: 'a4', type: 'PRICING EDIT', urgent: false, title: rng.pick(PRODUCT_CATALOG.slice(0, 4)).name, meta: `Approve rate change · Requested by ${policyOps} · ${relTime(rng.int(60, 900))}` },
  ].map((a) => ({ ...a, meta: a.meta.replace('Requested by You', 'Requested by You') }));

  const AUDIT = [
    { who: 'You', what: 'Published policy v4.2', target: 'DecisionPolicy', mins: rng.int(120, 300) },
    ...CHECKS.filter((c) => c.status === 'Completed' && c.integrity !== 'Clear').slice(0, 2).map((c) => ({ who: c.analyst, what: 'Resolved statement integrity', target: `Check ${c.id}`, mins: c.minsAgo + 30 })),
    { who: 'You', what: 'Created API key (sandbox)', target: 'API Key k2', mins: rng.int(200, 600) },
    ...(dis ? [{ who: shortName(maker()), what: `Approved disbursement ${nairaShort(dis.amount)}`, target: `Loan ln_${rng.hex(3)}`, mins: rng.int(300, 700) }] : []),
    { who: shortName(policyOps), what: 'Edited loan product pricing', target: rng.pick(PRODUCT_CATALOG).name, mins: rng.int(400, 900) },
  ].sort((a, b) => a.mins - b.mins).map((a) => ({ ...a, ago: relTime(a.mins) }));

  // ---- API ---------------------------------------------------------------------
  const lat = (lo, hi) => rng.int(lo, hi);
  const upDefs = [['KraneKredit API', 30, 70], ['FirstCentral Bureau', 220, 420], ['CRC Bureau', 240, 480], ['Bank Statement Connector', 700, 2100], ['MoBI360 SDK', 90, 220]];
  const degradedUp = rng.int(0, 4);
  const UPSTREAM = upDefs.map(([n, a, b], i) => {
    const ms = lat(a, b) * (i === degradedUp && i !== 0 ? 1.6 : 1);
    return { name: n, meta: `${ms >= 1000 ? (ms / 1000).toFixed(1) + 's' : Math.round(ms) + 'ms'} · ${(99.6 + rng.float(0, 0.39)).toFixed(2)}%`, ok: !(i === degradedUp && i !== 0) };
  });
  const RATE_USED = rng.int(18, 88);
  const API_KEYS = [
    { id: 'k1', name: 'Production — Primary', env: 'live', status: 'Active', key: `krk_live_sk_${rng.hex(4)}`, created: daysAgo(rng.int(60, 120)), used: relTime(rng.int(1, 30)) },
    { id: 'k2', name: 'Sandbox — Development', env: 'sandbox', status: 'Active', key: `krk_test_sk_${rng.hex(4)}`, created: daysAgo(rng.int(60, 130)), used: relTime(rng.int(30, 400)) },
    { id: 'k3', name: 'Sandbox — CI Pipeline', env: 'sandbox', status: 'Revoked', key: `krk_test_sk_${rng.hex(4)}`, created: daysAgo(rng.int(60, 130)), used: relTime(rng.int(2000, 9000)) },
  ];
  const ITEMS = rng.sample(CHECKS.slice(0, 20), 5).map((c) => ({
    name: c.name, bank: REPORTS[c.id].facts.homeBank, accts: REPORTS[c.id].facts.accounts, created: daysAgo(rng.int(5, 120)), sync: relTime(rng.int(2, 6000)),
    status: rng.weighted([['Active', 7], ['Login Required', 2], ['Revoked', 1]]),
  }));
  const succ = () => { const v = rng.float(86, 99.9); return { success: `${v.toFixed(1)}%`, tone: v >= 99 ? 'text-emerald-600' : v >= 95 ? 'text-amber-600' : 'text-rose-600' }; };
  const WEBHOOKS = [
    { url: 'https://api.kranelender.ng/webhooks/krk', events: ['check.completed.v1', 'loan.disbursed.v1', 'item.login_required.v1'], status: 'Active', deliveries: rng.int(800, 3000), ...succ() },
    { url: 'https://hooks.kranelender.ng/krk-staging', events: ['check.completed.v1'], status: 'Active', deliveries: rng.int(100, 600), ...succ() },
    { url: 'https://staging.kranelender.ng/test', events: ['*'], status: 'Paused', deliveries: rng.int(5, 60), ...succ() },
  ];
  const evs = ['check.completed.v1', 'loan.disbursed.v1', 'check.completed.v1', 'item.login_required.v1', 'offer.accepted.v1', 'check.review_required.v1'];
  const DELIVERIES = Array.from({ length: 5 }, (_, i) => { const fail = rng.chance(0.18); return { event: rng.pick(evs), code: fail ? rng.pick([500, 502, 504]) : 200, attempts: fail ? rng.int(2, 4) : 1, ago: relTime(i * rng.int(20, 80) + 2), cache: !fail && rng.chance(0.25) }; });
  const REQUEST_LOG = [
    { method: 'POST', path: '/v1/checks', code: 201, ms: `${rng.int(500, 1900)}ms`, idem: true, ago: CHECKS[0].created },
    { method: 'GET', path: `/v1/checks/${CHECKS[0].id}`, code: 200, ms: `${rng.int(25, 80)}ms`, idem: false, ago: CHECKS[0].created },
    { method: 'POST', path: '/v1/items', code: 201, ms: `${(rng.float(0.8, 2)).toFixed(1)}s`, idem: true, ago: relTime(rng.int(3, 20)) },
    { method: 'POST', path: '/v1/loans/disburse', code: 200, ms: `${rng.int(300, 900)}ms`, idem: true, ago: relTime(rng.int(30, 120)) },
    { method: 'GET', path: `/v1/checks/${CHECKS[1].id}`, code: 200, ms: `${rng.int(25, 80)}ms`, idem: false, ago: CHECKS[1].created },
  ];
  const sampleBvn = `22${rng.digits(9)}`;
  const CURL_SAMPLE = `curl -X POST https://api.kranekredit.ng/v1/checks \\
  -H "Authorization: Bearer ${API_KEYS[1].key}••••" \\
  -H "Idempotency-Key: $(uuidgen)" \\
  -H "Content-Type: application/json" \\
  -d '{
    "bvn": "${sampleBvn}",
    "consent": {
      "method": "in_app",
      "timestamp": "${now.toISOString().slice(0, 19)}+01:00"
    },
    "policy_version": "v4.2"
  }'`;

  // ---- Compliance / settings ------------------------------------------------------
  const kybBase = rng.int(70, 140);
  const inReview = rng.int(4, 6);
  const KYB_DOCS = ['CAC Certificate of Incorporation', 'CAC Status Report / Form CAC 2/7', 'Director ID (NIN)', 'Proof of Address (≤3 months)', 'CBN Operating License Number', 'NDPA Data-Controller Filing Reference', 'Branch List']
    .map((n, i) => ({ name: n, date: daysAgo(kybBase - i * rng.int(0, 3)), status: i === inReview ? 'In Review' : 'Verified' }));
  const lc = CHECKS[0];
  const LINEAGE = { id: lc.id, rows: REPORTS[lc.id].lineage };
  const INTEGRATIONS = [['FirstCentral Bureau', 1], ['CRC Bureau', 2], ['Bank Statement Connector', 3], ['MoBI360 SDK', 4], ['NIBSS (BVN)', -1]].map(([n, i]) => ({ name: n, status: i === degradedUp ? 'Degraded' : 'Connected' }));
  const renewal = new Date(now); renewal.setMonth(renewal.getMonth() + 1); renewal.setDate(15);
  const BILLING = { checks: `${Math.round(totalChecks * rng.float(0.3, 0.9)).toLocaleString()} / 5,000`, credits: rng.int(1500, 12000).toLocaleString(), renewal: fmtDate(renewal) };
  const ORG = { org: 'KraneTech Lending Ltd', type: 'CBN-Licensed Digital Lender', cac: `RC-${rng.digits(7)}`, cbn: `DL-${now.getFullYear() - rng.int(1, 3)}-${rng.digits(5)}`, ndpa: `NDPC/DC/${now.getFullYear() - rng.int(0, 2)}/${rng.digits(4)}`, email: 'ops@kranetech.ng' };

  return {
    seed, generatedAt: now, CHECKS, REPORTS, DASH_STATS, PAR_SERIES: PAR_SERIES.series, PAR_IMPROVING: PAR_SERIES.improving, PAR_NOW, AUTO_RATE, POLICY_PERF, DRIFT,
    DECLINE_REASONS, TIER_DIST, ACTIVITY, PRODUCTS, SEGMENTS, VERSIONS, OFFERS, BUCKETS, COLLECTIONS, LOANS, SERVICING_STATS,
    UPSTREAM, RATE_USED, API_KEYS, ITEMS, WEBHOOKS, DELIVERIES, REQUEST_LOG, CURL_SAMPLE, USERS, APPROVALS, AUDIT, KYB_DOCS, LINEAGE, INTEGRATIONS, BILLING, ORG,
    REVIEW_COUNT: count((c) => c.status === 'Manual Review'),
  };
}

export { initials, tierOf, BANKS };
