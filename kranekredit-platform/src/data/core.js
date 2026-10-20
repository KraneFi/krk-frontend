// Mock data, transcribed from the Base44 prototype (kranekredit-platform.base44.app).

export const TIERS = {
  T0: { code: 'T0', name: 'Restricted' },
  T1: { code: 'T1', name: 'Krane Basic' },
  T2: { code: 'T2', name: 'Krane Standard' },
  T3: { code: 'T3', name: 'Krane Plus' },
  T4: { code: 'T4', name: 'Krane Prime' },
  T5: { code: 'T5', name: 'Krane Platinum' },
};

export const CHECKS = [
  { id: 'chk_8f2a', name: 'Adaeze Okonkwo', bvn: '4471', signal: 'KRK-742-R2-D3-T3', score: 742, tier: 'T3', integrity: 'Clear', decision: 'Auto-Approve', status: 'Completed', analyst: 'You', created: '2 min ago' },
  { id: 'chk_7d1c', name: 'Kwasi Mensah', bvn: '8823', signal: 'KRK-778-R1-D2-T4', score: 778, tier: 'T4', integrity: 'Clear', decision: 'Auto-Approve', status: 'Completed', analyst: 'You', created: '18 min ago' },
  { id: 'chk_6b9f', name: 'Chidi Okafor', bvn: '1192', signal: 'KRK-534-R3-D4-T1', score: 534, tier: 'T1', integrity: 'Review', decision: 'Manual Review', status: 'Manual Review', analyst: 'Tunde A.', created: '41 min ago' },
  { id: 'chk_5a8e', name: 'Funmi Bakare', bvn: '3367', signal: 'KRK-801-R1-D1-T5', score: 801, tier: 'T5', integrity: 'Clear', decision: 'Auto-Approve', status: 'Completed', analyst: 'You', created: '1 hr ago' },
  { id: 'chk_4c7d', name: 'Tunde Adeyemi', bvn: '7740', signal: 'KRK-412-R4-D5-T0', score: 412, tier: 'T0', integrity: 'Clear', decision: 'Auto-Decline', status: 'Completed', analyst: 'Tunde A.', created: '4 hr ago' },
  { id: 'chk_3b6c', name: 'Ngozi Eze', bvn: '5598', signal: 'KRK-668-R2-D3-T3', score: 668, tier: 'T3', integrity: 'Clear', decision: 'Manual Review', status: 'Completed', analyst: 'You', created: '5 hr ago' },
  { id: 'chk_2a5b', name: 'Ibrahim Sani', bvn: '2245', signal: 'KRK-589-R3-D4-T2', score: 589, tier: 'T2', integrity: 'High Risk', decision: 'Auto-Approve', status: 'Completed', analyst: 'Kemi O.', created: '6 hr ago' },
  { id: 'chk_1a4b', name: 'Bola Adebayo', bvn: '8810', signal: 'KRK-715-R2-D3-T3', score: 715, tier: 'T3', integrity: 'Review', decision: 'Manual Review', status: 'Manual Review', analyst: 'Kemi O.', created: '8 hr ago' },
  { id: 'chk_0a3a', name: 'Yetunde Williams', bvn: '3358', signal: 'KRK-823-R1-D1-T5', score: 823, tier: 'T5', integrity: 'Clear', decision: 'Auto-Approve', status: 'Completed', analyst: 'You', created: '1 day ago' },
  { id: 'chk_9z2z', name: 'Emeka Nwosu', bvn: '7721', signal: 'KRK-612-R3-D4-T2', score: 612, tier: 'T2', integrity: 'Clear', decision: 'Auto-Decline', status: 'Completed', analyst: 'Tunde A.', created: '1 day ago' },
];

export const DASH_STATS = [
  { label: 'Total Checks', value: '1,284', trend: '+12.4%', icon: 'FileCheck' },
  { label: 'Successful Checks', value: '982', trend: '+8.1%', icon: 'CircleCheck' },
  { label: 'Avg KRK Score', value: '671', trend: '+4 pts', icon: 'Gauge' },
  { label: 'Active Products', value: '6', trend: '0', icon: 'Package', flat: true },
];

export const PAR_SERIES = [
  { m: 'Jan', par30: 4.2, par60: 2.8, par90: 1.9 },
  { m: 'Feb', par30: 4.4, par60: 3.0, par90: 2.1 },
  { m: 'Mar', par30: 4.0, par60: 2.9, par90: 2.0 },
  { m: 'Apr', par30: 3.8, par60: 2.6, par90: 1.8 },
  { m: 'May', par30: 3.5, par60: 2.4, par90: 1.6 },
  { m: 'Jun', par30: 3.2, par60: 2.2, par90: 1.5 },
  { m: 'Jul', par30: 2.9, par60: 2.0, par90: 1.4 },
];

export const POLICY_PERF = [
  { label: 'Approval Rate', value: 68, color: 'bg-emerald-500' },
  { label: 'Manual Review', value: 19, color: 'bg-amber-500' },
  { label: 'Decline Rate', value: 7, color: 'bg-rose-500' },
  { label: 'Override Rate', value: 11, color: 'bg-violet-500' },
];

export const DECLINE_REASONS = [
  { label: 'High DTI ratio', value: 34 },
  { label: 'Bureau delinquency history', value: 28 },
  { label: 'Statement integrity flag', value: 18 },
  { label: 'Low KRK tier (T0/T1)', value: 12 },
  { label: 'Insufficient transaction history', value: 8 },
];

export const TIER_DIST = [
  { tier: 'T0', raw: 8, post: 0 },
  { tier: 'T1', raw: 15, post: 4 },
  { tier: 'T2', raw: 24, post: 18 },
  { tier: 'T3', raw: 28, post: 33 },
  { tier: 'T4', raw: 17, post: 28 },
  { tier: 'T5', raw: 8, post: 17 },
];

export const ACTIVITY = [
  { icon: 'FileCheck', tone: 'text-indigo-500', title: 'KRK report completed', detail: 'KRK-742-R2-D3-T3 — Adaeze O.', tier: 'T3', ago: '2 min ago' },
  { icon: 'CircleCheck', tone: 'text-emerald-500', title: 'Offer accepted', detail: '₦450,000 — Kwasi A.', ago: '18 min ago' },
  { icon: 'ShieldAlert', tone: 'text-amber-500', title: 'Statement flagged', detail: 'Authenticity 62 — Chidi O.', ago: '41 min ago' },
  { icon: 'Zap', tone: 'text-violet-500', title: 'Loan disbursed', detail: '₦1.2M — Funmi B.', ago: '1 hr ago' },
  { icon: 'FileText', tone: 'text-slate-500', title: 'Policy v4 published', detail: 'Approval ceiling → 72%', ago: '3 hr ago' },
  { icon: 'FileCheck', tone: 'text-indigo-500', title: 'Manual review resolved', detail: 'Confirmed genuine — Tunde A.', ago: '4 hr ago' },
];

export const PRODUCTS = [
  { id: 'p1', name: 'QuickCash Personal', range: '₦50,000 – ₦500,000', rate: '5.5%', tenor: '1–6mo', minTier: 'T2', status: 'Active', matched: 284, accepted: 98, defaulted: 3 },
  { id: 'p2', name: 'SME Growth Loan', range: '₦200,000 – ₦5,000,000', rate: '8%', tenor: '6–24mo', minTier: 'T3', status: 'Active', matched: 142, accepted: 41, defaulted: 2 },
  { id: 'p3', name: 'Salary Advance Express', range: '₦20,000 – ₦300,000', rate: '4%', tenor: '1–3mo', minTier: 'T1', status: 'Active', matched: 512, accepted: 287, defaulted: 7 },
  { id: 'p4', name: 'Premium Prime Credit', range: '₦500,000 – ₦10,000,000', rate: '6.5%', tenor: '12–36mo', minTier: 'T4', status: 'Active', matched: 67, accepted: 22, defaulted: 0 },
  { id: 'p5', name: 'POS Merchant Boost', range: '₦100,000 – ₦2,000,000', rate: '7.5%', tenor: '3–12mo', minTier: 'T2', status: 'Paused', matched: 89, accepted: 24, defaulted: 1 },
  { id: 'p6', name: 'Platinum Overdraft', range: '₦1,000,000 – ₦20,000,000', rate: '5%', tenor: '1–12mo', minTier: 'T5', status: 'Draft', matched: 0, accepted: 0, defaulted: 0 },
];

export const RULES = [
  { id: 'r1', outcome: 'Auto Approve', expr: 'Tier ≥ T3 AND DTI ≤ 35% AND Integrity = Clear AND Bureau Conflict = false' },
  { id: 'r2', outcome: 'Auto Decline', expr: 'Tier = T0' },
  { id: 'r3', outcome: 'Refer', expr: 'Integrity = High Risk OR Bureau Conflict = true' },
  { id: 'r4', outcome: 'Refer', expr: 'Tier = T1 AND DTI > 40%' },
  { id: 'r5', outcome: 'Auto Approve', expr: 'Tier = T5 AND Confidence ≥ 80% AND Integrity = Clear' },
];

export const SEGMENTS = [
  { name: 'Salaried / Formal', customers: 482, pct: 38 },
  { name: 'Gig Economy', customers: 204, pct: 16 },
  { name: 'Market Trader / Informal', customers: 318, pct: 25 },
  { name: 'Micro-merchant / POS', customers: 167, pct: 13 },
  { name: 'Freelancer / Creator', customers: 113, pct: 9 },
];

export const VERSIONS = [
  { v: 'v4.2', status: 'Published', note: 'Adjusted DTI ceiling from 38% to 35% for T3 tier', by: 'You · 28 Jul 2026' },
  { v: 'v4.1', status: 'Archived', note: 'Added rule: auto-decline on Statement Integrity High Risk', by: 'Tunde A. · 14 Jul 2026' },
  { v: 'v4.0', status: 'Archived', note: 'Added POS Merchant Boost segment rules', by: 'You · 01 Jul 2026' },
  { v: 'v3.3', status: 'Archived', note: 'Lowered manual-review floor from 35% to 30%', by: 'Kemi O. · 15 Jun 2026' },
];

export const STAGES = [
  { key: 'Offer Sent', dot: 'bg-indigo-500' },
  { key: 'Viewed', dot: 'bg-amber-500' },
  { key: 'Accepted', dot: 'bg-emerald-500' },
  { key: 'Pending Disbursement', dot: 'bg-violet-500' },
  { key: 'Disbursed', dot: 'bg-slate-500' },
];

export const OFFERS = [
  { id: 'o1', name: 'Adaeze Okonkwo', product: 'QuickCash Personal', tier: 'T3', amount: 450000, stage: 'Offer Sent', ago: '2 min ago' },
  { id: 'o2', name: 'Ngozi Eze', product: 'Salary Advance Express', tier: 'T3', amount: 180000, stage: 'Offer Sent', ago: '1 hr ago' },
  { id: 'o3', name: 'Bola Adebayo', product: 'QuickCash Personal', tier: 'T3', amount: 320000, stage: 'Viewed', ago: '3 hr ago' },
  { id: 'o4', name: 'Ibrahim Sani', product: 'POS Merchant Boost', tier: 'T2', amount: 750000, stage: 'Viewed', ago: '5 hr ago' },
  { id: 'o5', name: 'Kwasi Mensah', product: 'SME Growth Loan', tier: 'T4', amount: 1200000, stage: 'Accepted', ago: '18 min ago' },
  { id: 'o6', name: 'Yetunde Williams', product: 'Premium Prime Credit', tier: 'T5', amount: 2000000, stage: 'Accepted', ago: '2 hr ago' },
  { id: 'o7', name: 'Emeka Nwosu', product: 'Salary Advance Express', tier: 'T2', amount: 250000, stage: 'Pending Disbursement', ago: '30 min ago' },
  { id: 'o8', name: 'Funmi Bakare', product: 'SME Growth Loan', tier: 'T5', amount: 1500000, stage: 'Disbursed', ago: '1 hr ago' },
  { id: 'o9', name: 'Bola Adebayo', product: 'QuickCash Personal', tier: 'T3', amount: 400000, stage: 'Disbursed', ago: '3 hr ago' },
];

export const SERVICING_STATS = [
  { label: 'Total Outstanding', value: '₦156.0M', icon: 'Wallet', tile: 'bg-indigo-50 text-indigo-600' },
  { label: 'PAR (1+)', value: '9.0%', sub: '₦14.0M outstanding', icon: 'TrendingDown', tile: 'bg-rose-50 text-rose-600' },
  { label: 'Active Loans', value: '8', icon: 'Wallet', tile: 'bg-violet-50 text-violet-600' },
  { label: 'In Collections', value: '3', icon: 'AlertTriangle', tile: 'bg-amber-50 text-amber-600' },
];

export const BUCKETS = [
  { label: 'Current', loans: 384, amount: '₦142.0M', share: 91, labelCls: 'text-emerald-700', bar: 'bg-emerald-400', book: '91% of book' },
  { label: 'DPD 1–30', loans: 24, amount: '₦8.4M', share: 5.4, labelCls: 'text-orange-600', bar: 'bg-amber-500', book: '5.4% of book' },
  { label: 'DPD 31–60', loans: 9, amount: '₦3.1M', share: 2, labelCls: 'text-orange-600', bar: 'bg-amber-500', book: '2% of book' },
  { label: 'DPD 61–90', loans: 4, amount: '₦1.6M', share: 1, labelCls: 'text-rose-600', bar: 'bg-rose-500', book: '1% of book' },
  { label: 'DPD 90+', loans: 2, amount: '₦900K', share: 0.6, labelCls: 'text-rose-600', bar: 'bg-rose-500', book: '0.6% of book' },
];

export const COLLECTIONS = [
  { name: 'Tunde Adeyemi', tier: 'T1', bucket: 'DPD 61–90', contact: '2 days ago', amount: '₦67,000', dpd: 72, promise: '₦30K by Aug 2' },
  { name: 'Ibrahim Sani', tier: 'T2', bucket: 'DPD 31–60', contact: '5 days ago', amount: '₦600,000', dpd: 45, promise: null },
  { name: 'Bola Adebayo', tier: 'T3', bucket: 'DPD 1–30', contact: '1 day ago', amount: '₦280,000', dpd: 12, promise: '₦50K by Aug 5' },
];

export const LOANS = [
  { name: 'Funmi Bakare', product: 'SME Growth Loan', principal: '₦1,500,000', outstanding: '₦1,125,000', dpd: 0, bucket: 'Current', tier: 'T5', status: 'repaying' },
  { name: 'Bola Adebayo', product: 'QuickCash Personal', principal: '₦400,000', outstanding: '₦280,000', dpd: 12, bucket: 'DPD 1–30', tier: 'T3', status: 'repaying' },
  { name: 'Ibrahim Sani', product: 'POS Merchant Boost', principal: '₦750,000', outstanding: '₦600,000', dpd: 45, bucket: 'DPD 31–60', tier: 'T2', status: 'delinquent' },
  { name: 'Emeka Nwosu', product: 'Salary Advance Express', principal: '₦250,000', outstanding: '₦175,000', dpd: 0, bucket: 'Current', tier: 'T2', status: 'repaying' },
  { name: 'Kwasi Mensah', product: 'SME Growth Loan', principal: '₦1,200,000', outstanding: '₦1,200,000', dpd: 0, bucket: 'Current', tier: 'T4', status: 'disbursed' },
  { name: 'Yetunde Williams', product: 'Premium Prime Credit', principal: '₦2,000,000', outstanding: '₦1,850,000', dpd: 0, bucket: 'Current', tier: 'T5', status: 'repaying' },
  { name: 'Tunde Adeyemi', product: 'Salary Advance Express', principal: '₦100,000', outstanding: '₦67,000', dpd: 72, bucket: 'DPD 61–90', tier: 'T1', status: 'delinquent' },
  { name: 'Ngozi Eze', product: 'QuickCash Personal', principal: '₦320,000', outstanding: '₦160,000', dpd: 0, bucket: 'Current', tier: 'T3', status: 'repaying' },
];

export const UPSTREAM = [
  { name: 'KraneKredit API', meta: '42ms · 99.99%', ok: true },
  { name: 'FirstCentral Bureau', meta: '280ms · 99.94%', ok: true },
  { name: 'CRC Bureau', meta: '310ms · 99.91%', ok: true },
  { name: 'Bank Statement Connector', meta: '1.4s · 99.72%', ok: false },
  { name: 'MoBI360 SDK', meta: '120ms · 99.98%', ok: true },
];

export const API_KEYS = [
  { id: 'k1', name: 'Production — Primary', env: 'live', status: 'Active', key: 'krk_live_sk_8f2a', created: '10 Jul 2026', used: '2 min ago' },
  { id: 'k2', name: 'Sandbox — Development', env: 'sandbox', status: 'Active', key: 'krk_test_sk_3b1c', created: '01 Jul 2026', used: '1 hr ago' },
  { id: 'k3', name: 'Sandbox — CI Pipeline', env: 'sandbox', status: 'Revoked', key: 'krk_test_sk_9d4e', created: '05 Jul 2026', used: '3 days ago' },
];

export const ITEMS = [
  { name: 'Adaeze Okonkwo', bank: 'GTBank', accts: 3, created: '14 Jul 2026', sync: '2 min ago', status: 'Active' },
  { name: 'Kwasi Mensah', bank: 'Access Bank', accts: 2, created: '10 Jul 2026', sync: '18 min ago', status: 'Active' },
  { name: 'Chidi Okafor', bank: 'Zenith Bank', accts: 1, created: '08 Jul 2026', sync: '3 days ago', status: 'Login Required' },
  { name: 'Funmi Bakare', bank: 'UBA', accts: 2, created: '05 Jul 2026', sync: '1 hr ago', status: 'Active' },
  { name: 'Tunde Adeyemi', bank: 'First Bank', accts: 1, created: '20 Jun 2026', sync: '2 weeks ago', status: 'Revoked' },
];

export const WEBHOOKS = [
  { url: 'https://api.kranelender.ng/webhooks/krk', events: ['check.completed.v1', 'loan.disbursed.v1', 'item.login_required.v1'], status: 'Active', deliveries: 1284, success: '99.2%', tone: 'text-emerald-600' },
  { url: 'https://hooks.kranelender.ng/krk-staging', events: ['check.completed.v1'], status: 'Active', deliveries: 342, success: '97.8%', tone: 'text-amber-600' },
  { url: 'https://staging.kranelender.ng/test', events: ['*'], status: 'Paused', deliveries: 18, success: '88.9%', tone: 'text-rose-600' },
];

export const DELIVERIES = [
  { event: 'check.completed.v1', code: 200, attempts: 1, ago: '2 min ago' },
  { event: 'loan.disbursed.v1', code: 200, attempts: 1, ago: '1 hr ago' },
  { event: 'check.completed.v1', code: 200, attempts: 1, ago: '1 hr ago', cache: true },
  { event: 'item.login_required.v1', code: 500, attempts: 3, ago: '2 hr ago' },
  { event: 'check.completed.v1', code: 200, attempts: 1, ago: '3 hr ago' },
];

export const REQUEST_LOG = [
  { method: 'POST', path: '/v1/checks', code: 201, ms: '847ms', idem: true, ago: '2 min ago' },
  { method: 'GET', path: '/v1/checks/chk_8f2a', code: 200, ms: '42ms', idem: false, ago: '2 min ago' },
  { method: 'POST', path: '/v1/items', code: 201, ms: '1.2s', idem: true, ago: '3 min ago' },
  { method: 'POST', path: '/v1/loans/disburse', code: 200, ms: '634ms', idem: true, ago: '1 hr ago' },
  { method: 'GET', path: '/v1/items/item_01', code: 200, ms: '38ms', idem: false, ago: '1 hr ago' },
];

export const CURL_SAMPLE = `curl -X POST https://api.kranekredit.ng/v1/checks \\
  -H "Authorization: Bearer krk_test_sk_3b1c••••" \\
  -H "Idempotency-Key: $(uuidgen)" \\
  -H "Content-Type: application/json" \\
  -d '{
    "bvn": "22164744710",
    "consent": {
      "method": "in_app",
      "timestamp": "2026-07-29T14:22:01+01:00"
    },
    "policy_version": "v4.2"
  }'`;

export const USERS = [
  { name: 'Dammy Krane', email: 'dammy@kranetech.ng', role: 'Admin', status: 'Active', last: 'now' },
  { name: 'Tunde Adeyemi', email: 'tunde@kranetech.ng', role: 'Credit/Risk Analyst', status: 'Active', last: '12 min ago' },
  { name: 'Kemi Okafor', email: 'kemi@kranetech.ng', role: 'Credit/Risk Analyst', status: 'Active', last: '1 hr ago' },
  { name: 'Aisha Bello', email: 'aisha@kranetech.ng', role: 'Credit Ops (Policy)', status: 'Active', last: '3 hr ago' },
  { name: 'David Olu', email: 'david@kranetech.ng', role: 'Developer', status: 'Active', last: '2 days ago' },
  { name: 'Grace Eze', email: 'grace@kranetech.ng', role: 'Compliance Officer', status: 'Active', last: '5 hr ago' },
  { name: 'Samuel Toro', email: 'samuel@kranetech.ng', role: 'Viewer', status: 'Suspended', last: '1 week ago' },
];

export const ROLE_STYLE = {
  Admin: 'bg-indigo-50 text-indigo-700',
  'Credit/Risk Analyst': 'bg-violet-50 text-violet-700',
  'Credit Ops (Policy)': 'bg-amber-50 text-amber-700',
  Developer: 'bg-emerald-50 text-emerald-700',
  'Compliance Officer': 'bg-rose-50 text-rose-700',
  Viewer: 'bg-slate-100 text-slate-600',
  'Collections Officer': 'bg-blue-50 text-blue-700',
};

export const APPROVALS = [
  { id: 'a1', type: 'POLICY PUBLISH', urgent: true, title: 'Decision Policy v5.0', meta: 'Publish new version · Requested by Aisha Bello · 1 hr ago' },
  { id: 'a2', type: 'DISBURSEMENT', urgent: true, title: '₦1,500,000 — Funmi B.', meta: 'Approve disbursement · Requested by You · 30 min ago' },
  { id: 'a3', type: 'ADMIN INVITE', urgent: false, title: 'newadmin@kranetech.ng', meta: 'Approve invite · Requested by Dammy Krane · 2 hr ago' },
  { id: 'a4', type: 'PRICING EDIT', urgent: false, title: 'QuickCash Personal', meta: 'Approve rate change · Requested by Aisha Bello · 3 hr ago' },
];

export const AUDIT = [
  { who: 'You', what: 'Published policy v4.2', target: 'DecisionPolicy', ago: '3 hr ago' },
  { who: 'Tunde A.', what: 'Resolved statement integrity', target: 'Check chk_4c7d', ago: '4 hr ago' },
  { who: 'You', what: 'Created API key (sandbox)', target: 'API Key k2', ago: '5 hr ago' },
  { who: 'Kemi O.', what: 'Approved disbursement ₦1.2M', target: 'Loan ln_01', ago: '6 hr ago' },
  { who: 'Aisha B.', what: 'Edited loan product pricing', target: 'QuickCash Personal', ago: '8 hr ago' },
];

export const ACCESS_TIERS = [
  { tier: 'TIER 0', name: 'Unverified', req: 'Account created', state: 'done' },
  { tier: 'TIER 1', name: 'Sandbox', req: 'Email + phone verified', state: 'done' },
  { tier: 'TIER 2', name: 'Live (Restricted)', req: 'KYB documents verified', state: 'current' },
  { tier: 'TIER 3', name: 'Live (Full)', req: 'Compliance review of first 50 live checks', state: 'locked' },
];

export const KYB_DOCS = [
  { name: 'CAC Certificate of Incorporation', date: '12 Jul 2026', status: 'Verified' },
  { name: 'CAC Status Report / Form CAC 2/7', date: '12 Jul 2026', status: 'Verified' },
  { name: 'Director ID (NIN)', date: '12 Jul 2026', status: 'Verified' },
  { name: 'Proof of Address (≤3 months)', date: '14 Jul 2026', status: 'Verified' },
  { name: 'CBN Operating License Number', date: '15 Jul 2026', status: 'Verified' },
  { name: 'NDPA Data-Controller Filing Reference', date: '20 Jul 2026', status: 'In Review' },
  { name: 'Branch List', date: '15 Jul 2026', status: 'Verified' },
];

export const LINEAGE = [
  { icon: 'ShieldCheck', title: 'Consent Capture', sub: 'In-app consent link — captured by You', time: '14:22:01 WAT', state: 'Recorded' },
  { icon: 'Database', title: 'GTBank — Item item_01', sub: '3 accounts retrieved (statements)', time: '14:22:04 WAT', state: 'Retrieved' },
  { icon: 'Database', title: 'FirstCentral Bureau', sub: 'Bureau report pulled (3 facilities)', time: '14:22:07 WAT', state: 'Retrieved' },
  { icon: 'Database', title: 'CRC Bureau', sub: 'Bureau report pulled (3 facilities)', time: '14:22:09 WAT', state: 'Retrieved' },
  { icon: 'Database', title: 'MoBI360 SDK', sub: 'Behavioral telemetry fetched', time: '14:22:11 WAT', state: 'Retrieved' },
  { icon: 'Check', title: 'Statement Integrity', sub: 'Authenticity score: 94 (Clear)', time: '14:22:17 WAT', state: 'Passed' },
  { icon: 'GitMerge', title: 'Bureau Reconciliation', sub: 'Waterfall path: match → blended', time: '14:22:19 WAT', state: 'Resolved' },
];

export const RETENTION = [
  { name: 'Raw Bank Statements', months: 24, purge: true },
  { name: 'Bureau Reports', months: 12, purge: true },
  { name: 'Check Results', months: 60, purge: false },
  { name: 'Consent Records', months: 72, purge: true },
];

export const NOTIFICATIONS = [
  { title: 'Check completed', sub: 'When a KRK report finishes processing', on: true },
  { title: 'Statement integrity flag', sub: 'When a statement is flagged for review', on: true },
  { title: 'Manual review needed', sub: 'When a check routes to manual review', on: true },
  { title: 'Loan disbursement', sub: 'When a loan is disbursed or needs approval', on: true },
  { title: 'Policy published', sub: 'When a new decision policy version goes live', on: false },
  { title: 'Bureau conflict detected', sub: 'When FirstCentral and CRC disagree', on: true },
];

export const INTEGRATIONS = [
  { name: 'FirstCentral Bureau', status: 'Connected' },
  { name: 'CRC Bureau', status: 'Connected' },
  { name: 'Bank Statement Connector', status: 'Degraded' },
  { name: 'MoBI360 SDK', status: 'Connected' },
  { name: 'NIBSS (BVN)', status: 'Connected' },
];

export const BVN_ACCOUNTS = [
  { bank: 'Guaranty Trust Bank', type: 'Commercial', acct: '6789', last: '2 hours ago', activity: 95 },
  { bank: 'Access Bank', type: 'Commercial', acct: '5432', last: '1 day ago', activity: 88 },
  { bank: 'Opay MFB', type: 'MFB', acct: '5432', last: '1 hour ago', activity: 85 },
  { bank: 'Zenith Bank', type: 'Commercial', acct: '5678', last: '3 hours ago', activity: 78 },
  { bank: 'Kuda Microfinance Bank', type: 'MFB', acct: '5678', last: '4 hours ago', activity: 72 },
  { bank: 'PalmPay', type: 'Fintech', acct: '5432', last: '6 hours ago', activity: 65 },
  { bank: 'First Bank of Nigeria', type: 'Commercial', acct: '5432', last: '2 days ago', activity: 48 },
  { bank: 'United Bank for Africa', type: 'Commercial', acct: '9012', last: '5 days ago', activity: 35 },
  { bank: 'Carbon', type: 'Fintech', acct: '6543', last: '2 weeks ago', activity: 18, dormant: true },
  { bank: 'Stanbic IBTC', type: 'Commercial', acct: '5432', last: '1 month ago', activity: 8, dormant: true },
];
