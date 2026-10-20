import { useState } from 'react';
import { ShieldCheck, Gauge, TrendingUp, BookOpen, Scale, Search, GitMerge, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '../components/ui.jsx';
import { EngineTitle, SubTabs, Box, StatBox, Note } from './parts.jsx';

const TABS = [
  { key: 'risk', label: 'Risk Degree', icon: Gauge },
  { key: 'repay', label: 'Repayment Behaviour', icon: TrendingUp },
  { key: 'history', label: 'Lending History', icon: BookOpen },
  { key: 'debt', label: 'Debt Pressure', icon: Scale },
  { key: 'seeking', label: 'Credit Seeking', icon: Search },
  { key: 'recon', label: 'Reconciliation', icon: GitMerge },
];
const CELL = { ok: 'bg-emerald-400', nd: 'bg-slate-200', d30: 'bg-amber-400', d60: 'bg-orange-500', d90: 'bg-red-400', d90p: 'bg-red-600' };
const VERDICT = { STRONG: 'text-emerald-600', MODERATE: 'text-blue-600', WATCH: 'text-amber-600' };

const riskBand = (r) => (r < 20 ? 'Very Low' : r < 40 ? 'Low' : r < 60 ? 'Moderate' : r < 80 ? 'High' : 'Very High');
const subBand = (s) => (s >= 720 ? ['NORMAL', 'bg-emerald-50 text-emerald-700'] : s >= 560 ? ['ELEVATED', 'bg-amber-50 text-amber-700'] : ['HIGH', 'bg-rose-50 text-rose-700']);
const metricTone = (s) => (s === 'CURRENT' ? 'text-emerald-600' : s === 'MINOR' ? 'text-amber-600' : 'text-rose-600');

export default function BureauView({ d: BUREAU, name }) {
  const [tab, setTab] = useState('risk');
  const B = BUREAU;
  const urgent = B.inquiries.filter((q) => q.urgent);
  const crcOnly = B.recon.find((r) => r[0] === 'CRC-only facility');
  const crcAmt = crcOnly ? parseInt(crcOnly[2].replace(/[^0-9]/g, ''), 10) : 0;
  const outNum = parseInt(B.outstanding.replace(/[^0-9]/g, ''), 10) || 0;
  const gap = B.trueDti - B.bureauDti;
  const nameRow = B.recon.find((r) => r[0] === 'Full Name');
  return (
    <div>
      <EngineTitle icon={ShieldCheck} iconCls="text-violet-600" title="Credit Bureau Intelligence" />
      <SubTabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'risk' && (
        <div className="space-y-4">
          <Box className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[12px] text-slate-500">Bureau Composite Score</div>
              <div className="text-[32px] font-bold leading-tight text-violet-700 num">{BUREAU.composite}<span className="text-[15px] font-medium text-slate-400">/1000</span></div>
              <div className="text-[12px] text-slate-500">Risk Degree: {B.riskDegree}/100 ({riskBand(B.riskDegree)})</div>
            </div>
            <div className="text-right"><div className="text-[12px] text-slate-500">Recommendation</div><div className="text-[16px] font-bold text-slate-900">{B.recommendation}</div></div>
          </Box>
          <div className="text-[13.5px] font-semibold text-slate-900">Six Weighted Dimensions</div>
          <div className="flex h-7 overflow-hidden rounded-full">
            {BUREAU.dims.map((d) => <div key={d.name} className={cn('grid place-items-center border-r border-white/40 text-[10.5px] font-semibold text-white', d.color)} style={{ flex: d.w }}>{d.w >= 15 ? `${d.w}%` : ''}</div>)}
          </div>
          <div className="space-y-2">
            {BUREAU.dims.map((d) => (
              <Box key={d.name} className="py-3">
                <div className="flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', d.color)} />
                  <span className="text-[13.5px] font-semibold text-slate-900">{d.name}</span>
                  <span className="rounded bg-slate-100 px-1.5 text-[10.5px] text-slate-500">{d.w}%</span>
                  <span className={cn('ml-auto text-[11px] font-bold', VERDICT[d.verdict])}>{d.verdict} · {d.score}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">{d.chips.map((c) => <span key={c} className="rounded-md bg-slate-50 px-2 py-0.5 text-[11.5px] text-slate-600">{c}</span>)}</div>
              </Box>
            ))}
          </div>
          <div className="rounded-lg bg-slate-100 px-3 py-2 font-mono text-[11.5px] text-slate-600">Output Contract: composite_score {B.composite}, 6-dimension breakdown, status ENGINE-NATIVE, weight_into_KRK 30%</div>
        </div>
      )}

      {tab === 'repay' && (
        <div className="space-y-4">
          <Note tone="blue"><strong>ND months are not missed payments.</strong> ND = no data submitted (loan not active yet or account closed). Never rendered as risk.</Note>
          <Box>
            <div className="text-[14px] font-semibold text-slate-900">24-Month DPD Grid</div>
            <div className="text-[12.5px] text-slate-500">One row per facility — 24 monthly cells</div>
            <div className="mt-1 flex items-center gap-1 text-[11.5px] italic text-slate-500"><Info className="h-3 w-3" />The most information-dense visualization in the Deep Analysis Breakdown</div>
            <div className="mt-4 space-y-4">
              {BUREAU.dpd.map((f) => (
                <div key={f.name}>
                  <div className="flex items-center justify-between gap-2 text-[12.5px]">
                    <span className="font-medium text-slate-800">{f.name}</span>
                    <span className="flex items-center gap-2 text-slate-500">{f.max}<span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold', f.trend === 'IMPROVING' ? 'bg-emerald-50 text-emerald-700' : f.trend === 'DETERIORATING' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600')}>{f.trend}</span></span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-[repeat(24,minmax(0,1fr))] gap-[3px]">
                    {f.cells.map((c, i) => <span key={i} className={cn('h-4 rounded-full', CELL[c])} title={c.toUpperCase()} />)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-slate-500">
              {[['OK', 'ok'], ['ND', 'nd'], ['1-30', 'd30'], ['31-60', 'd60'], ['61-90', 'd90'], ['90+', 'd90p']].map(([l, k]) => <span key={k} className="inline-flex items-center gap-1"><span className={cn('h-2.5 w-2.5 rounded-full', CELL[k])} />{l}</span>)}
            </div>
          </Box>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {B.dpdMetrics.map(([l, v, s]) => [l, v, s, metricTone(s)]).map(([l, v, s, c]) => (
              <Box key={l} className="p-3"><div className="text-[11px] text-slate-500">{l}</div><div className="mt-1 text-[18px] font-semibold">{v}</div><div className={cn('text-[10.5px] font-semibold', c)}>{s}</div></Box>
            ))}
          </div>
          {B.delinquent
            ? <Note tone="amber" icon={AlertTriangle}><strong>Adverse Markers: 1 flagged</strong> · 1 dishonoured cheque · 0 judgements <em className="ml-1 text-slate-500">Any count above zero overrides every other positive signal</em></Note>
            : <Note tone="emerald" icon={CheckCircle2}><strong>Adverse Markers: Clear</strong> · 0 dishonoured cheques · 0 judgements <em className="ml-1 text-slate-500">Any count above zero overrides every other positive signal</em></Note>}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-4">
          <Box>
            <div className="text-[14px] font-semibold text-slate-900">Facility Timeline</div>
            <div className="text-[12.5px] text-slate-500">What has this person borrowed, from whom, in what sequence?</div>
            <div className="mt-4 space-y-3">
              {BUREAU.facilities.map((f) => (
                <div key={f.name} className="grid grid-cols-[140px_1fr] items-center gap-3 text-[12.5px] sm:grid-cols-[170px_1fr]">
                  <div><div className="font-medium text-slate-800">{f.name}</div><div className="text-[11px] text-slate-500">{f.amount}</div></div>
                  <div className="relative h-5 rounded bg-slate-50">
                    <div className={cn('absolute inset-y-0 flex items-center rounded px-2 text-[10px] font-semibold text-white', f.open ? 'bg-indigo-500' : 'bg-slate-300')} style={{ left: `${f.start}%`, width: `${f.end - f.start}%` }}>{f.open ? 'OPEN' : 'CLOSED'}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-slate-100 pt-3 text-[13px]"><span className="text-slate-600">Total Lifetime Credit Accessed</span><strong>{B.lifetime}</strong></div>
          </Box>
          <div className="grid gap-3 sm:grid-cols-2">
            <Box>
              <div className="text-[13.5px] font-semibold">Loan Type Breakdown</div>
              <div className="mt-3 flex h-3 overflow-hidden rounded-full"><div className="bg-indigo-500" style={{ width: `${B.termShare}%` }} /><div className="bg-violet-400" style={{ width: `${100 - B.termShare}%` }} /></div>
              <div className="mt-2 flex justify-between text-[12px] text-slate-600"><span>TERM_LOAN: {B.termShare}%</span><span>RETAIL: {100 - B.termShare}%</span></div>
            </Box>
            <Box>
              <div className="text-[13.5px] font-semibold">Lender Type Profile</div>
              <div className="mt-3 flex h-3 overflow-hidden rounded-full"><div className="bg-blue-500" style={{ width: `${B.commercialShare}%` }} /><div className="bg-emerald-400" style={{ width: `${100 - B.commercialShare}%` }} /></div>
              <div className="mt-2 flex justify-between text-[12px] text-slate-600"><span>COMMERCIAL {B.commercialShare}%</span><span>DIGITAL {100 - B.commercialShare}%</span></div>
              <div className="mt-1 font-mono text-[11.5px] text-indigo-600">{B.commercialShare >= 50 ? 'COMMERCIAL_BANK_DOMINANT' : 'DIGITAL_LENDER_DOMINANT'}</div>
            </Box>
            <StatBox label="File Age" value={`${B.fileAge} years`} />
            <StatBox label="Activity Density" value={`${B.density}/yr`} />
          </div>
        </div>
      )}

      {tab === 'debt' && (
        <div className="space-y-4">
          <Box>
            <div className="text-[14px] font-semibold text-slate-900">Bureau DTI vs. True DTI</div>
            <div className="text-[12.5px] text-slate-500">How much of income is spoken for by formal debt — and what's the honest number?</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-3"><div className="text-[12px] text-slate-500">Bureau DTI</div><div className="text-[24px] font-semibold">{B.bureauDti}%</div><div className="text-[11.5px] text-slate-500">Formal installments ÷ income</div></div>
              <div className="rounded-lg bg-indigo-50 p-3"><div className="text-[12px] text-indigo-600">True DTI</div><div className="text-[24px] font-semibold text-indigo-700">{B.trueDti}%</div><div className="text-[11.5px] text-indigo-600">Formal + BS360-detected repayments ÷ BS360-verified income</div></div>
            </div>
            <div className={cn('mt-3 text-[12.5px]', gap > 5 ? 'text-amber-600' : 'text-emerald-600')}>Gap: {gap}% — {gap > 5 ? 'informal obligations not on bureau' : 'within normal range'}</div>
            <div className="mt-1 text-[11.5px] italic text-slate-500">Net income sourced from BS360 — Bureau's DTI calculation is downstream of BS360's income figure</div>
          </Box>
          <div className="grid grid-cols-2 gap-3">
            <StatBox label="Free Headroom for New Obligation" value={B.headroom} sub={`BS360 FCF: ${B.fcf}`} />
            <StatBox label="Max New EMI (headroom × 40%)" value={B.maxEmi} valueCls="text-indigo-600" />
            <StatBox label="Outstanding (All Open)" value={B.outstanding} />
            <StatBox label="Debt Concentration" value={B.concentration ? `${B.concentration.pct}%` : '—'} sub={B.concentration ? `${B.concentration.lender} — ${B.concentration.pct > 75 ? 'above threshold' : 'within threshold'}` : 'No open facilities'} />
          </div>
        </div>
      )}

      {tab === 'seeking' && (
        <div className="space-y-4">
          <Box>
            <div className="text-[14px] font-semibold text-slate-900">Inquiry Velocity Timeline</div>
            <div className="text-[12.5px] text-slate-500">Is this person shopping for credit normally, or does the pattern look like distress?</div>
            <ol className="mt-4 space-y-2">
              {BUREAU.inquiries.map((q, i) => (
                <li key={i} className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-[12.5px]', q.urgent ? 'bg-amber-50' : 'bg-slate-50')}>
                  <span className="w-20 text-slate-500">{q.when}</span>
                  <span className="flex-1 font-medium text-slate-800">{q.who}</span>
                  {q.urgent && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">URGENCY CLUSTER</span>}
                </li>
              ))}
            </ol>
            <div className={cn('mt-3 text-[12px]', urgent.length ? 'text-amber-700' : 'text-slate-500')}>3+ inquiries within 7 days grouped as "urgency cluster"{urgent.length ? ` — ${urgent[0].when} has ${urgent.length} inquiries in ${urgent.length + 1} days` : ' — none detected'}</div>
          </Box>
          <div className="grid gap-3 sm:grid-cols-2">
            <Box><div className="text-[13.5px] font-semibold">Institution Mix</div><div className="mt-2 space-y-1 text-[12.5px]">{B.instMix.map(([k, v]) => <div key={k} className="flex justify-between"><span>{k}</span><strong>{v}</strong></div>)}</div></Box>
            <Box><div className="text-[13.5px] font-semibold">Product Mix</div><div className="mt-2 space-y-1 text-[12.5px]">{B.prodMix.map(([k, v]) => <div key={k} className="flex justify-between"><span>{k}</span><strong>{v}</strong></div>)}</div></Box>
            <StatBox label="Inquiry-to-Approval Conversion Estimate" value={`${B.conversion}%`} sub={B.conversion < 45 ? 'Possible mass decline — bureau sees inquiries, not outcomes.' : 'Healthy conversion — bureau sees inquiries, not outcomes.'} />
            <Box><div className="text-[12px] text-slate-500">Inquiry Sub-Score</div><div className="mt-1 text-[22px] font-semibold">{B.inquiryScore}<span className="text-[13px] text-slate-400">/1000</span></div><span className={cn('rounded px-1.5 py-0.5 text-[10.5px] font-semibold', subBand(B.inquiryScore)[1])}>{subBand(B.inquiryScore)[0]}</span></Box>
          </div>
        </div>
      )}

      {tab === 'recon' && (
        <div className="space-y-4">
          <Box className="overflow-x-auto p-0">
            <div className="px-4 pt-4"><div className="text-[14px] font-semibold">Cross-Bureau Reconciliation Table</div><div className="text-[12.5px] text-slate-500">FirstCentral vs CRC</div></div>
            <table className="mt-3 w-full min-w-[560px] text-[12.5px]">
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500"><tr>{['Field', 'FirstCentral', 'CRC', 'Status'].map((h) => <th key={h} className="px-4 py-2.5 font-semibold">{h}</th>)}</tr></thead>
              <tbody>
                {BUREAU.recon.map(([f, a, b, ok]) => (
                  <tr key={f} className={cn('border-t border-slate-100', !ok && 'bg-amber-50/50')}>
                    <td className="px-4 py-2.5 font-medium">{f}</td><td className="px-4 py-2.5 num">{a}</td><td className="px-4 py-2.5 num">{b}</td>
                    <td className="px-4 py-2.5">{ok ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />CONFIRMED</span> : <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600"><AlertTriangle className="h-3.5 w-3.5" />VARIANT</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
          <div className="grid gap-3 sm:grid-cols-2">
            <Box>
              <div className="text-[13.5px] font-semibold">Adjusted Total Credit Range</div>
              <div className="mt-2 space-y-1 text-[12.5px]"><div className="flex justify-between"><span className="text-slate-600">Confirmed</span><strong>{B.outstanding}</strong></div><div className="flex justify-between"><span className="text-slate-600">Including CRC-only</span><strong>₦{(outNum + crcAmt).toLocaleString('en-NG')}</strong></div></div>
              <div className="mt-2 text-[11.5px] italic text-slate-500">Uncertainty visible as a range, not a single number</div>
            </Box>
            <Box>
              <div className="text-[13.5px] font-semibold">Identity & Data Quality</div>
              <div className="mt-2 space-y-1 text-[12.5px] text-slate-700">
                <div>BVN Match: <span className="text-emerald-600">✓</span></div><div>DOB Match: <span className="text-emerald-600">✓</span></div>
                <div>Name: {nameRow ? nameRow[2] : name} (merged)</div><div>Address: {B.identity.address}</div><div>Employer detected on bureau: {B.identity.employer}</div>
              </div>
            </Box>
          </div>
        </div>
      )}
    </div>
  );
}
