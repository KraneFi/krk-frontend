import { useState } from 'react';
import {
  Landmark, Sparkles, AlertTriangle, Wallet, CreditCard, Scale, PiggyBank, Activity, Fingerprint, Smartphone, Repeat, EyeOff,
  Check, CheckCircle2, ArrowRight, TrendingUp, TrendingDown, XCircle,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, ReferenceLine, YAxis } from 'recharts';
import { cn } from '../components/ui.jsx';
import { naira } from '../data/rng.js';
import { EngineTitle, SubTabs, Box, StatBox, QCard, Note } from './parts.jsx';

const TABS = [
  { key: 'income', label: 'Income', icon: Wallet },
  { key: 'spending', label: 'Spending', icon: CreditCard },
  { key: 'obligations', label: 'Obligations & DTI', icon: Scale },
  { key: 'balance', label: 'Balance & Liquidity', icon: PiggyBank },
  { key: 'timing', label: 'Behavioural Timing', icon: Activity },
  { key: 'fingerprint', label: 'Income Fingerprint', icon: Fingerprint },
  { key: 'digital', label: 'Digital Lifestyle', icon: Smartphone },
  { key: 'transfers', label: 'Recurring Transfers', icon: Repeat },
  { key: 'hidden', label: 'Hidden Accounts', icon: EyeOff },
];
const SEG_COLORS = ['#dc2626', '#e11d48', '#e11d48', '#dc2626', '#e11d48'];

function Gauge({ value, label, sub, color }) {
  const r = 30, c = 2 * Math.PI * r;
  return (
    <Box className="flex flex-col items-center justify-center text-center">
      <div className="relative h-20 w-20">
        <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
          <circle cx="36" cy="36" r={r} fill="none" stroke="#f1f5f9" strokeWidth="6" />
          <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(Math.min(value, 100) / 100) * c} ${c}`} />
        </svg>
        <div className="absolute inset-0 grid place-items-center leading-none"><div><div className="text-[18px] font-semibold text-slate-900">{value}%</div><div className="mt-0.5 text-[10px] text-slate-500">{label}</div></div></div>
      </div>
      <div className="mt-2 text-[11.5px] font-medium" style={{ color }}>{sub}</div>
    </Box>
  );
}
const Trend = ({ v }) => (v >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-rose-500" />);

export default function BS360View({ d }) {
  const [tab, setTab] = useState('income');
  const inc = d.income, sp = d.spending, ob = d.obligations, bal = d.balance, tm = d.timing, fp = d.fingerprint, dg = d.digital, hd = d.hidden;
  const eirTone = sp.eir < 50 ? ['#22c55e', 'Healthy'] : sp.eir < 75 ? ['#f59e0b', 'Stretched'] : ['#f43f5e', 'Over-extended'];
  const dtiTone = ob.dti < 30 ? ['#22c55e', '<30% Green'] : ob.dti <= 43 ? ['#f59e0b', '30-43% Amber'] : ['#f43f5e', '>43% Red'];
  const wfMax = Math.max(...ob.waterfall.map((w) => w[1]), 1);
  const balMax = Math.max(...bal.series) * 1.1;
  const catMax = Math.max(...sp.categories.map((c) => c[1]), 1);

  return (
    <div>
      <EngineTitle icon={Landmark} iconCls="text-amber-600" title="Bank Statement Engine" />

      <div className="mb-6 rounded-xl border border-dashed border-amber-300 bg-amber-50/30 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
            <Sparkles className="h-4 w-4 text-amber-500" />BS360 Composite Score
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10.5px] font-semibold text-amber-700"><AlertTriangle className="h-3 w-3" />PROPOSED</span>
          </div>
          <div className="text-[28px] font-bold leading-none text-amber-700 num">{d.composite}<span className="text-[14px] font-medium text-slate-400">/1000</span></div>
        </div>
        <p className="mt-2 text-[12px] text-amber-700">Pending Data Science ratification (OI-1) — built entirely from BS360's own documented metrics. Never styled as ratified.</p>
        <div className="mt-3 flex h-5 overflow-hidden rounded-full">
          {d.components.map((c, i) => <div key={c.name} className="grid place-items-center text-[10px] font-semibold text-white" style={{ flex: c.flex, background: SEG_COLORS[i] }}>{c.score}</div>)}
        </div>
        <div className="mt-2 flex text-center">
          {d.components.map((c) => (
            <div key={c.name} style={{ flex: c.flex }} className="min-w-0 px-0.5">
              <div className="truncate text-[10.5px] text-slate-500">{c.name}</div>
              <div className="text-[11px] font-semibold text-slate-700">{c.score} · {c.w}</div>
            </div>
          ))}
        </div>
      </div>

      <SubTabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'income' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatBox label="Adjusted Net Income (loan-excluded)" value={inc.net} valueCls="text-indigo-700" className="border-indigo-200 bg-indigo-50/40">
              {inc.excluded ? <>
                <div className="mt-1 text-[11.5px] text-slate-400 line-through">Gross: {inc.gross}</div>
                <div className="text-[11.5px] text-orange-600">Excluded {inc.excluded} loan credits</div>
              </> : <div className="mt-1 text-[11.5px] text-slate-500">No loan credits to exclude</div>}
            </StatBox>
            <StatBox label="Income Regularity Score" value={inc.regularity} valueCls={inc.regularityOk ? 'text-emerald-600' : 'text-amber-600'} sub={inc.regularityOk ? '≥ 0.75 threshold — GREEN' : '< 0.75 threshold — AMBER'} />
            <StatBox label="3M vs Prior Trend" value={`${inc.trend > 0 ? '+' : ''}${inc.trend}%`} valueCls={inc.trend >= 0 ? 'text-emerald-600' : 'text-rose-600'} sub={`CoV: ${inc.cov}% (${inc.cov < 25 ? '<25% green' : '≥25% amber'})`} />
          </div>
          <QCard title="Salary Detection" question="Is there a formal salary, from whom, and how reliable?" verdict={inc.salary.detected ? 'DETECTED' : 'NOT DETECTED'} verdictSub={`${inc.salary.signals}/4 signals`} note={`Based on ${inc.salary.months} months of statement data, ${inc.salary.accounts} account${inc.salary.accounts > 1 ? 's' : ''}`}>
            <div className="grid gap-3 sm:grid-cols-3">
              {[['Employer', inc.salary.detected ? inc.salary.employer : '—'], ['Sector', inc.salary.detected ? inc.salary.sector : '—'], ['Modal Salary Day', inc.salary.detected ? inc.salary.day : '—']].map(([k, v]) => (
                <div key={k}><div className="text-[11.5px] text-slate-500">{k}</div><div className="text-[13.5px] font-semibold text-slate-900">{v}</div></div>
              ))}
            </div>
            <div className="mt-4 text-[12px] font-semibold text-slate-700">Four-Signal Checklist</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {inc.salary.checklist.map((c, i) => <div key={c} className="flex items-center gap-2 text-[12.5px] text-slate-700">{i < inc.salary.signals ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-slate-300" />}{c}</div>)}
            </div>
            <div className="mt-4 text-[12px] font-semibold text-slate-700">On-Time History (6 months)</div>
            <div className="mt-2 flex gap-1.5">
              {inc.salary.history.map((h, i) => <span key={i} className={cn('grid h-8 flex-1 place-items-center rounded-md text-[11px] font-semibold', h === 'ok' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>{h === 'ok' ? '✓' : 'Late'}</span>)}
            </div>
          </QCard>
          <QCard title="Income Source Composite" question="What type of income is this, source by source?" note="Each segment tagged with confidence based on 4-signal match count" defaultOpen>
            <div className="flex h-8 overflow-hidden rounded-full">
              {inc.sources.map((s) => <div key={s.type} className={cn('grid place-items-center text-[10.5px] font-semibold text-white', s.color)} style={{ flex: s.pct }}>{s.pct >= 10 ? s.type : ''}</div>)}
            </div>
            <div className="mt-3 divide-y divide-slate-100">
              {inc.sources.map((s) => (
                <div key={s.type} className="flex items-center gap-3 py-2 text-[12.5px]">
                  <span className={cn('h-2.5 w-2.5 rounded-sm', s.color)} />
                  <span className="w-24 font-semibold text-slate-700">{s.type}</span>
                  <span className="flex-1 text-slate-600 num">{s.amount} ({s.pct}%)</span>
                  <span className={cn('rounded px-1.5 py-0.5 text-[10.5px] font-semibold', s.conf === 'HIGH' ? 'bg-emerald-50 text-emerald-700' : s.conf === 'MEDIUM' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600')}>{s.conf}</span>
                </div>
              ))}
            </div>
          </QCard>
        </div>
      )}

      {tab === 'spending' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Gauge value={sp.eir} label="EIR" sub={eirTone[1]} color={eirTone[0]} />
            <StatBox label="Avg Monthly Surplus" value={sp.surplus} valueCls="text-emerald-600" sub={`Deficit months: ${sp.deficit}`} />
            <Box>
              <div className="text-[12px] text-slate-500">Fixed vs Variable Split</div>
              <div className="mt-3 flex h-3 overflow-hidden rounded-full"><div className="bg-slate-400" style={{ width: `${sp.fixed}%` }} /><div className="bg-indigo-400" style={{ width: `${100 - sp.fixed}%` }} /></div>
              <div className="mt-1.5 flex justify-between text-[11.5px] text-slate-600"><span>Fixed {sp.fixed}%</span><span>Variable {100 - sp.fixed}%</span></div>
              <div className="mt-1 text-[11.5px] italic text-slate-500">Discretionary ratio: {sp.discretionary}% — the shock absorber</div>
            </Box>
          </div>
          <QCard title="Spend Category Breakdown" question="12-class spend taxonomy" verdict={`${sp.categories.length} categories`} note={`MoBI360 narration enrichment active — ${sp.unclassified}% unclassified`}>
            <div className="space-y-2">
              {sp.categories.map(([k, v]) => (
                <div key={k} className="flex items-center gap-3 text-[12px]">
                  <span className="w-28 font-medium text-slate-600">{k}</span>
                  <div className="h-2 flex-1 rounded-full bg-slate-100"><div className={cn('h-full rounded-full', k === 'BETTING' ? 'bg-rose-400' : 'bg-indigo-400')} style={{ width: `${(v / catMax) * 100}%` }} /></div>
                  <span className="w-9 text-right font-semibold text-slate-800 num">{v}%</span>
                </div>
              ))}
            </div>
          </QCard>
          <div className="grid gap-3 sm:grid-cols-2">
            <Box className="border-emerald-200">
              <div className="flex items-center gap-2 text-[14px] font-semibold text-slate-900"><PiggyBank className="h-4 w-4 text-emerald-600" />Savings Rate</div>
              <div className="mt-2 text-[22px] font-semibold text-emerald-600">{sp.savingsRate}%</div>
              <div className="text-[12px] text-slate-500">Consistency: {sp.savingsConsistency}%</div>
            </Box>
            <Box className={sp.gambling.pct > 5 ? 'border-rose-300 bg-rose-50/40' : 'border-rose-200 bg-rose-50/20'}>
              <div className="flex items-center gap-2 text-[14px] font-semibold text-slate-900"><AlertTriangle className="h-4 w-4 text-rose-500" />Gambling Spend</div>
              <div className="mt-2 text-[22px] font-semibold text-rose-600">{sp.gambling.amount}</div>
              <div className="text-[12px] text-slate-600">{sp.gambling.freq} · {sp.gambling.pct}% of income (threshold 5%)</div>
              <div className="mt-1 text-[11.5px] italic text-rose-500">Never folded into general category — standalone card per engine rule</div>
            </Box>
          </div>
          <Box>
            <div className="text-[14px] font-semibold text-slate-900">Lifestyle Inflation</div>
            <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div><div className="text-[12px] text-slate-500">Discretionary growth</div><div className="flex items-center gap-1 text-[15px] font-semibold text-slate-900"><Trend v={sp.discGrowth} />{sp.discGrowth > 0 ? '+' : ''}{sp.discGrowth}%</div></div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
              <div><div className="text-[12px] text-slate-500">Income growth</div><div className="flex items-center gap-1 text-[15px] font-semibold text-slate-900"><Trend v={sp.incGrowth} />{sp.incGrowth > 0 ? '+' : ''}{sp.incGrowth}%</div></div>
            </div>
            <div className="mt-2 text-[12px] italic text-slate-500">{sp.incGrowth >= sp.discGrowth ? 'Income growth is outpacing discretionary spend growth — healthy.' : 'Discretionary spend is growing faster than income — lifestyle inflation risk.'}</div>
          </Box>
        </div>
      )}

      {tab === 'obligations' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Gauge value={ob.dti} label="DTI" sub={dtiTone[1]} color={dtiTone[0]} />
            <StatBox label="Free Cash Flow After Obligations" value={ob.fcf} />
            <StatBox label="Max Sustainable New EMI" value={ob.maxEmi} valueCls="text-indigo-600" sub="FCF × 40%" />
          </div>
          <QCard title="Obligation Waterfall" question="Which obligation is consuming the most headroom?" defaultOpen>
            <div className="space-y-2.5">
              {ob.waterfall.map(([label, value, color]) => (
                <div key={label} className="flex items-center gap-3 text-[12px]">
                  <span className="w-28 text-slate-600">{label}</span>
                  <div className="h-4 flex-1"><div className={cn('h-full rounded', color)} style={{ width: `${(value / wfMax) * 100}%` }} /></div>
                  <span className="w-24 text-right font-semibold text-slate-800 num">{naira(value)}</span>
                </div>
              ))}
            </div>
          </QCard>
          <Box className={ob.stacking ? 'border-amber-200 bg-amber-50/40' : 'border-emerald-200 bg-emerald-50/40'}>
            <div className="flex items-center gap-2 text-[14px] font-semibold text-slate-900">{ob.stacking ? <AlertTriangle className="h-4 w-4 text-amber-600" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}Lender Stacking Check</div>
            <div className={cn('mt-1 text-[12.5px]', ob.stacking ? 'text-amber-700' : 'text-emerald-700')}>{ob.lenders} lender{ob.lenders === 1 ? '' : 's'} detected · {ob.stacking ? 'Concurrent lender stacking detected' : 'No concurrent lender stacking detected'}</div>
            <div className={cn('text-[12.5px]', ob.stacking ? 'text-amber-700' : 'text-emerald-700')}>Credit Cycling (loan disbursed within 7 days of repayment): <strong>{ob.cycling ? 'Detected' : 'None'}</strong></div>
          </Box>
          <Box>
            <div className="text-[14px] font-semibold text-slate-900">Repayment Regularity Table</div>
            <div className="text-[12px] text-slate-500">One row per detected lender — months paid ÷ months expected</div>
            {ob.regularity.length ? (
              <div className="mt-3 divide-y divide-slate-100">
                {ob.regularity.map(([n, a, b]) => (
                  <div key={n} className="flex items-center gap-3 py-2 text-[12.5px]">
                    <span className="w-40 text-slate-700">{n}</span>
                    <div className="h-2 flex-1 rounded-full bg-slate-100"><div className={cn('h-full rounded-full', a / b >= 0.9 ? 'bg-emerald-500' : 'bg-amber-500')} style={{ width: `${(a / b) * 100}%` }} /></div>
                    <span className="w-12 text-right font-semibold num">{a}/{b}</span>
                  </div>
                ))}
              </div>
            ) : <div className="mt-3 text-[12.5px] text-slate-500">No lender repayments detected on statement.</div>}
          </Box>
        </div>
      )}

      {tab === 'balance' && (
        <div className="space-y-4">
          <Note tone={bal.integrityPass ? 'emerald' : 'rose'} icon={bal.integrityPass ? CheckCircle2 : XCircle}><strong>Arithmetic Integrity Validation: {bal.integrityPass ? 'PASS' : 'FAIL'}</strong> <span className="ml-1 font-mono">balance[n] = balance[n-1] + credit − debit</span></Note>
          <Box>
            <div className="text-[14px] font-semibold text-slate-900">Reconstructed Daily Balance Series</div>
            <div className="mt-3 h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bal.series.map((v, i) => ({ i, v }))} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                  <defs><linearGradient id="bal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0.03} /></linearGradient></defs>
                  <YAxis hide domain={[0, balMax]} />
                  <ReferenceLine y={1000} stroke="#f43f5e" strokeDasharray="4 4" />
                  <Area type="linear" dataKey="v" stroke="#6366f1" strokeWidth={2} fill="url(#bal)" isAnimationActive={false}
                    dot={(p) => (p.payload.v < 1000 ? <circle key={p.index} cx={p.cx} cy={p.cy} r={4} fill="#f43f5e" /> : <g key={p.index} />)} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Red ticks = near-zero days (below ₦1,000 threshold) · Red dashed line = near-zero threshold</div>
          </Box>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBox label="Avg Daily Balance" value={bal.avg} sub={`${bal.avgX}× monthly income`} />
            <StatBox label="Minimum Balance" value={bal.min} sub={bal.near ? 'Near-zero event' : 'Above threshold'} />
            <StatBox label="Liquidity Cushion" value={`${bal.cushion} days`} sub="Survival if income stops" />
            <StatBox label="Closing Balance" value={bal.closing} sub={`${bal.closingX}× monthly income`} />
          </div>
          {bal.near > 0
            ? <Note tone="amber" icon={AlertTriangle}>Near-Zero Events: {bal.near} day{bal.near > 1 ? 's' : ''} · Longest streak: {bal.streak} consecutive day{bal.streak > 1 ? 's' : ''}</Note>
            : <Note tone="emerald" icon={CheckCircle2}>No near-zero balance days in the last 30 days</Note>}
        </div>
      )}

      {tab === 'timing' && (
        <div className="space-y-4">
          <Box>
            <div className="text-[14px] font-semibold text-slate-900">Payday Burst — 72-hour Post-Salary Spend Ratio</div>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {tm.payday.map(([m, v]) => (
                <div key={m} className="text-center">
                  <div className="flex h-14 items-end overflow-hidden rounded-lg bg-slate-50"><div className={cn('w-full rounded-lg', v < 20 ? 'bg-emerald-400' : v <= 50 ? 'bg-amber-400' : 'bg-rose-400')} style={{ height: `${Math.min(100, v)}%` }} /></div>
                  <div className="mt-1.5 text-[12px] font-semibold text-slate-800">{m}</div>
                  <div className="text-[11px] text-slate-500">{v}%</div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[11px] text-slate-500">Bands: &lt;20% green / 20–50% amber / &gt;60% red</div>
          </Box>
          <Box>
            <div className="text-[14px] font-semibold text-slate-900">Month-End Pressure Index (12 months)</div>
            <div className="relative mt-4 flex h-16 items-end gap-1.5">
              <div className="absolute inset-x-0 top-0 border-t border-dashed border-rose-300" />
              {tm.monthEnd.map((v, i) => <div key={i} className={cn('flex-1 rounded-t', v >= 2.5 ? 'bg-rose-400' : 'bg-indigo-300')} style={{ height: `${Math.min(100, (v / 2.5) * 100)}%` }} />)}
            </div>
            <div className="mt-2 text-[11px] text-slate-500">Severe-pressure threshold: 2.5 (red dashed line)</div>
          </Box>
          <div className="grid grid-cols-3 gap-3 text-center">
            <StatBox label="Bill Payment Consistency" value={`${tm.billConsistency}%`} valueCls={tm.billConsistency >= 80 ? 'text-emerald-600' : 'text-amber-600'} />
            <StatBox label="Reversal Rate" value={`${tm.reversal}%`} />
            <StatBox label="Transaction Velocity" value={tm.velocity} sub="↗ trending up" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[['P2P Support Network — Top Inbound', tm.inbound], ['P2P Support Network — Top Outbound', tm.outbound]].map(([t, rows]) => (
              <Box key={t}>
                <div className="text-[13.5px] font-semibold text-slate-900">{t}</div>
                <div className="mt-2 divide-y divide-slate-100">{rows.map(([n, v], i) => <div key={i} className="flex justify-between py-1.5 text-[12.5px]"><span className="text-slate-700">{n}</span><span className="text-slate-500">{v}</span></div>)}</div>
              </Box>
            ))}
          </div>
          <Note tone="emerald" icon={CheckCircle2}><strong>Airtime/Data Identity Continuity: MATCH</strong> <span className="ml-1 text-slate-600">Same phone {tm.phone} topped up consistently — matches application number</span></Note>
        </div>
      )}

      {tab === 'fingerprint' && (
        <div className="space-y-4">
          <Note>Each card shown only when detected — never as empty placeholder.</Note>
          {fp.family && (
            <Box className="border-violet-200">
              <div className="text-[14px] font-semibold text-slate-900">Family/Social Infusion</div>
              <div className="text-[12.5px] text-slate-600">Regular family infusions detected — reads as income instability signal, not additional income.</div>
              <div className="mt-2 text-[12.5px] font-medium text-slate-800">Monthly avg: {fp.family.avg} · Regularity: {fp.family.reg}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">{fp.family.names.map((n) => <span key={n} className="rounded-full bg-violet-50 px-2 py-0.5 text-[11.5px] text-violet-700">{n}</span>)}</div>
            </Box>
          )}
          {fp.hidden && (
            <Box className="border-amber-200 bg-amber-50/30">
              <div className="flex items-center justify-between"><div className="text-[14px] font-semibold text-slate-900">Hidden Holding Account</div><span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10.5px] font-bold text-amber-700">{fp.hidden}</span></div>
              <div className="text-[12.5px] text-slate-600">Self-transfer pattern suggests a secondary account. Engine recommends requesting all bank statements.</div>
              <div className="mt-2 flex flex-wrap gap-1.5">{['Self-credit regularity (M)', 'Large self-debits (M)'].map((n) => <span key={n} className="rounded-full bg-amber-100 px-2 py-0.5 text-[11.5px] text-amber-800">{n}</span>)}</div>
              <div className="mt-2 text-[12px] font-medium text-amber-700">⚠ Cannot be silently dismissed without logged reason — engine recommends requesting all bank statements</div>
            </Box>
          )}
          {fp.freelance && (
            <Box className="border-blue-200">
              <div className="text-[14px] font-semibold text-slate-900">Freelance/Remote</div>
              <div className="text-[12.5px] text-slate-600">Project-based freelance income detected with growing trend.</div>
              <div className="mt-2 text-[12.5px] font-medium text-slate-800">Monthly avg: {fp.freelance.avg} · Regularity: {fp.freelance.reg}</div>
            </Box>
          )}
          {!fp.family && !fp.hidden && !fp.freelance && <Box className="text-center text-[12.5px] text-slate-500">No distinctive income fingerprints detected for this customer.</Box>}
        </div>
      )}

      {tab === 'digital' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Box>
              <div className="text-[13.5px] font-semibold text-slate-900">Connectivity Tier</div>
              <div className="mt-2 space-y-1 text-[12.5px]">
                <div className="flex justify-between"><span className="text-slate-600">Mobile Data</span><span className="font-semibold">{dg.mobile}</span></div>
                {dg.broadband && <div className="flex justify-between"><span className="text-slate-600">Broadband ({dg.provider})</span><span className="font-semibold">{dg.broadband}</span></div>}
              </div>
              <span className={cn('mt-3 inline-block rounded-full px-2 py-0.5 text-[11.5px] font-medium', dg.broadband ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}>{dg.broadband ? 'Remote-work capable' : 'Mobile-only connectivity'}</span>
            </Box>
            <StatBox label="Total Digital Fixed Cost" value={dg.total} sub={`${dg.pct}% of income · Bands: <8% / >15%`} />
          </div>
          <Box>
            <div className="text-[13.5px] font-semibold text-slate-900">Subscription Inventory (by occupation cluster)</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {dg.subs.map(([k, rows]) => (
                <div key={k} className="rounded-lg bg-slate-50 p-3">
                  <div className="text-[10.5px] font-semibold tracking-wider text-slate-500">{k}</div>
                  {rows.map(([n, v]) => <div key={n} className="mt-1.5 flex justify-between text-[12.5px]"><span className="text-slate-700">{n}</span><span className="text-slate-500">{v}</span></div>)}
                </div>
              ))}
            </div>
            <div className="mt-3 text-[12px] text-slate-500">Active SIMs: {dg.sims} · Primary number matches application: YES</div>
          </Box>
        </div>
      )}

      {tab === 'transfers' && (
        <div className="space-y-4">
          <Box className="overflow-x-auto p-0">
            <table className="w-full min-w-[560px] text-[12.5px]">
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500"><tr>{['#', 'Name', 'Avg/Mo', 'Class', 'Months', 'Cum %'].map((h) => <th key={h} className="px-4 py-2.5 font-semibold">{h}</th>)}</tr></thead>
              <tbody>
                {d.transfers.map(([n, name, amt, cls, m, cum]) => (
                  <tr key={n} className={cn('border-t border-slate-100', d.concentration?.rank === n && 'bg-amber-50/60')}>
                    <td className="px-4 py-2.5 text-slate-400">{n}</td><td className="px-4 py-2.5 font-medium text-slate-800">{name}</td><td className="px-4 py-2.5 num">{amt}</td>
                    <td className="px-4 py-2.5"><span className={cn('rounded px-1.5 py-0.5 text-[10.5px] font-semibold', { SAVINGS: 'bg-emerald-50 text-emerald-700', OBLIGATION: 'bg-rose-50 text-rose-600', DEPENDENT: 'bg-violet-50 text-violet-700', OTHER: 'bg-slate-100 text-slate-600' }[cls])}>{cls}</span></td>
                    <td className="px-4 py-2.5 num">{m}</td><td className="px-4 py-2.5 font-semibold num">{cum}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
          {d.concentration && <Note tone="amber" icon={AlertTriangle}>60% concentration threshold crossed at rank {d.concentration.rank} ({d.concentration.name}) — concentration risk flag</Note>}
        </div>
      )}

      {tab === 'hidden' && (
        <div className="space-y-4">
          <Box>
            <div className="flex items-baseline justify-between"><div className="text-[14px] font-semibold text-slate-900">Holding Account Probability</div><div className={cn('text-[24px] font-bold', hd.prob >= 60 ? 'text-rose-600' : hd.prob >= 35 ? 'text-amber-600' : 'text-emerald-600')}>{hd.prob}<span className="text-[13px] text-slate-400"> / 100</span></div></div>
            <div className="relative mt-3 h-3 rounded-full bg-gradient-to-r from-emerald-200 via-amber-200 to-rose-300">
              <span className="absolute -top-1 h-5 w-1 rounded bg-slate-900" style={{ left: `${hd.prob}%` }} />
            </div>
            <div className="mt-1.5 flex justify-between text-[10.5px] text-slate-500"><span>0</span><span>60 (strong)</span><span>80 (request all)</span><span>100</span></div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {[...hd.contributors.map(([k, v]) => [k, `+${v}`]), ['Lifestyle-vs-income mismatch', hd.mismatch ? 'Detected' : 'Not detected']].map(([k, v]) => (
                <div key={k} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-[12.5px]"><span className="text-slate-600">{k}</span><span className={cn('font-semibold', v.startsWith('+') || v === 'Detected' ? 'text-amber-600' : 'text-slate-500')}>{v}</span></div>
              ))}
            </div>
          </Box>
          <Box>
            <div className="text-[14px] font-semibold text-slate-900">Lifestyle Coherence</div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div><div className="text-[12px] text-slate-500">Annual Income</div><div className="text-[16px] font-semibold">{hd.annualIncome}</div></div>
              <div><div className="text-[12px] text-slate-500">Annualised Lifestyle</div><div className="text-[16px] font-semibold">{hd.lifestyle}</div></div>
            </div>
            <div className={cn('mt-2 text-[12px]', hd.mismatch ? 'text-amber-700' : 'text-emerald-600')}>{hd.mismatch ? 'Lifestyle exceeds stated income — undisclosed income or account likely' : 'No unexplained gap — lifestyle within income means'}</div>
          </Box>
          <Box className="overflow-x-auto p-0">
            <div className="px-4 pt-4 text-[14px] font-semibold text-slate-900">Credit-Report Cross-Match Table</div>
            {hd.crossMatch.length ? (
              <table className="mt-2 w-full min-w-[480px] text-[12.5px]">
                <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500"><tr>{['Facility', 'Bureau', 'Statement', 'Status'].map((h) => <th key={h} className="px-4 py-2.5 font-semibold">{h}</th>)}</tr></thead>
                <tbody>{hd.crossMatch.map(([f, a, b]) => <tr key={f} className="border-t border-slate-100"><td className="px-4 py-2.5 font-medium">{f}</td><td className="px-4 py-2.5 num">{a}</td><td className="px-4 py-2.5 num">{b}</td><td className="px-4 py-2.5"><span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-emerald-700">MATCHED</span></td></tr>)}</tbody>
              </table>
            ) : <div className="px-4 pb-4 pt-2 text-[12.5px] text-slate-500">No open facilities on bureau or statement.</div>}
          </Box>
          <Box className="border-emerald-200 bg-emerald-50/30">
            <div className="flex items-center justify-between"><div className="text-[14px] font-semibold text-slate-900">Total Debt Exposure</div><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"><Check className="mr-0.5 inline h-3 w-3" />Confirmed</span></div>
            <div className="mt-1 text-[20px] font-semibold">{hd.totalDebt} total</div>
            <div className="text-[12px] text-slate-500">No new loan activity within 90 days of application</div>
          </Box>
        </div>
      )}
    </div>
  );
}
