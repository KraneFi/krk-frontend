import { useState } from 'react';
import {
  Smartphone, LayoutGrid, Triangle, Wand2, PieChart, MessageSquare, Mail, AppWindow, MonitorSmartphone, MessageCircle, Palette,
  CheckCircle2, Info, AlertTriangle,
} from 'lucide-react';
import { cn } from '../components/ui.jsx';
import { EngineTitle, SubTabs, Box, StatBox, Note } from './parts.jsx';

const TABS = [
  { key: 'gallery', label: 'Signal Gallery', icon: LayoutGrid },
  { key: 'tri', label: 'Triangulation', icon: Triangle },
  { key: 'narr', label: 'Narration Enrichment', icon: Wand2 },
  { key: 'comp', label: 'Composite Breakdown', icon: PieChart },
];
const CHANNELS = [
  ['SMS', MessageSquare], ['Email', Mail], ['App Inventory', AppWindow], ['Device', MonitorSmartphone], ['WhatsApp', MessageCircle], ['Creator/Freelance', Palette],
];

function SignalCard({ s }) {
  return (
    <Box className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[13.5px] font-medium text-slate-900">{s.title}</div>
          <div className="font-mono text-[11px] text-emerald-600">{s.code}</div>
        </div>
        {s.sources && <span className={cn('text-[11px] font-semibold', s.sources > 1 ? 'text-emerald-600' : 'text-amber-600')}>{s.sources} source{s.sources > 1 ? 's' : ''}</span>}
      </div>
      {s.check && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-slate-500">
          Cross-check:<span className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-700">{s.check}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600"><CheckCircle2 className="h-3 w-3" />CONFIRMS</span>
        </div>
      )}
    </Box>
  );
}

const likeTone = { LIKELY: 'bg-amber-100 text-amber-700', POSSIBLE: 'bg-amber-50 text-amber-700', UNLIKELY: 'bg-emerald-50 text-emerald-700' };

export default function MobiView({ d: MOBI }) {
  const [tab, setTab] = useState('gallery');
  const [ch, setCh] = useState('SMS');
  if (!MOBI) {
    return (
      <div>
        <EngineTitle icon={Smartphone} iconCls="text-emerald-600" title="Alternative Data Engine" />
        <Note tone="amber" icon={AlertTriangle}>MoBI360 was unavailable for this check — its 25% weight was redistributed to BS360 (DEGRADED scoring path).</Note>
      </div>
    );
  }
  const raw = MOBI.channels[ch];
  const data = ch === 'Device' ? { tiles: raw } : { signals: raw, banner: ch === 'SMS' ? 'Bank SMS alerts parsed on-device — only derived signals leave the phone' : null };
  const gap = +MOBI.gap;
  const triVerdict = gap > 5 ? 'EXTENDS' : gap < -5 ? 'CONTRADICTS' : 'CONFIRMS';
  const funnelMax = Math.max(...MOBI.funnel.map((f) => f[1]));
  const penalty = MOBI.dims.find(([k]) => k.startsWith('Risk'))[1];
  const conf = MOBI.confidence;
  const band = MOBI.composite >= 720 ? ['STRONG', 'bg-emerald-50 text-emerald-700'] : MOBI.composite >= 600 ? ['MODERATE', 'bg-blue-50 text-blue-700'] : ['WEAK', 'bg-amber-50 text-amber-700'];
  const betLabel = MOBI.betting >= 50 ? 'FREQUENT' : MOBI.betting >= 15 ? 'OCCASIONAL' : 'RARE';
  return (
    <div>
      <EngineTitle icon={Smartphone} iconCls="text-emerald-600" title="Alternative Data Engine" />
      <SubTabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'gallery' && (
        <div className="space-y-4">
          <Note><strong>Display principle:</strong> Nothing reads as "we read your texts." Every card shows derived signals and evidentiary basis only — never raw message bodies or contact names.</Note>
          <div className="thin-scroll flex gap-1 overflow-x-auto">
            {CHANNELS.map(([k, Icon]) => (
              <button key={k} onClick={() => setCh(k)} className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[12.5px] font-medium', ch === k ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-100')}>
                <Icon className="h-3.5 w-3.5" />{k}
              </button>
            ))}
          </div>
          {data.banner && <Note tone="blue" icon={CheckCircle2}>{data.banner}</Note>}
          {data.signals && <div className="space-y-2">{data.signals.map((s, i) => <SignalCard key={s.code + i} s={s} />)}</div>}
          {data.tiles && (
            <div className="grid gap-3 sm:grid-cols-3">
              {data.tiles.map(([l, v, c]) => <Box key={l}><div className="text-[12px] text-slate-500">{l}</div><div className="mt-1 text-[18px] font-semibold">{v}</div>{c && <div className="font-mono text-[10.5px] text-emerald-600">{c}</div>}</Box>)}
            </div>
          )}
          <div className="flex items-start gap-1.5 text-[11.5px] italic text-slate-500"><Info className="mt-0.5 h-3 w-3" />Consent state: This borrower consented to alternative-data collection (SDK Yes/No gate). Data captured at check time.</div>
        </div>
      )}

      {tab === 'tri' && (
        <div className="space-y-3">
          <p className="text-[12.5px] text-slate-500">Where phone, bank statement, and bureau independently check the same fact — do they agree?</p>
          <Box>
            <div className="flex items-center justify-between"><div className="text-[14px] font-semibold">Mobile Income vs. BS360 Income</div><span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-indigo-700">{triVerdict}</span></div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-emerald-50 p-3"><div className="text-[11.5px] text-emerald-700">Mobile-detected</div><div className="text-[18px] font-semibold">{MOBI.mobileIncome}</div></div>
              <div className="rounded-lg bg-indigo-50 p-3"><div className="text-[11.5px] text-indigo-700">BS360 net income</div><div className="text-[18px] font-semibold">{MOBI.netIncome}</div></div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[12px]"><span className="font-mono text-slate-600">Gap: {MOBI.gap}% — MOBILE_{triVerdict}</span><span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">{Math.abs(gap) > 5 ? 'PROBABLE' : 'CERTAIN'}</span></div>
            <div className="mt-1 text-[12px] text-slate-500">{gap > 5 ? 'Mobile-detected income higher than statement — extra income detected on device but not fully in bank statement.' : 'Mobile-detected income consistent with the bank statement.'}</div>
          </Box>
          <Box className={MOBI.hidden === 'UNLIKELY' ? '' : 'border-amber-200 bg-amber-50/30'}>
            <div className="flex items-center justify-between"><div className="text-[14px] font-semibold">Hidden Account Triangulation</div><span className={cn('rounded px-1.5 py-0.5 text-[10.5px] font-semibold', likeTone[MOBI.hidden])}>{MOBI.hidden}</span></div>
            <div className="mt-1 text-[12.5px] text-slate-600">{MOBI.hidden === 'UNLIKELY' ? 'No secondary-account SMS alerts or self-transfer pattern detected across sources.' : `Self-transfer pattern corroborated by SMS alerts to secondary account. ${MOBI.hidden === 'LIKELY' ? '2' : '1'} of 3 sources confirm — ${MOBI.hidden}, not CERTAIN.`}</div>
          </Box>
          <Box><div className="text-[14px] font-semibold">Loan Stacking Triangulation</div><div className="mt-1 text-[12.5px] text-slate-600">No undisclosed lenders detected via mobile. Combined DTI consistent with bureau + BS360.</div></Box>
          <Box className="border-emerald-200">
            <div className="flex items-center justify-between"><div className="text-[14px] font-semibold">Savings Behaviour Confirmation</div><span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-emerald-700">CERTAIN</span></div>
            <div className="mt-1 text-[12.5px] text-slate-600">PiggyVest and Cowrywise auto-debits confirmed across SMS, app inventory, and bank statement.</div>
          </Box>
          <Box>
            <div className="text-[14px] font-semibold">Betting Risk Triangulation</div>
            <div className="mt-2 flex items-baseline gap-2"><span className="text-[22px] font-semibold">{MOBI.betting}/100</span><span className="text-[12px] text-slate-500">Betting Risk Composite</span></div>
            <div className="text-[12px] text-amber-700">Label: {betLabel} — penalty cannot be offset by positive signals</div>
            <div className="mt-1 text-[12.5px] text-slate-600">{MOBI.gamblingPct > 5 ? 'Elevated' : 'Low'} betting spend ({MOBI.gamblingAmt}, {MOBI.gamblingPct}% of income) corroborated. {MOBI.gamblingPct > 5 ? 'Betting apps installed.' : 'No betting apps installed.'} Penalty cannot be offset by positive signals.</div>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">Sources:{['BS360 gambling_spend', 'MoBI360 app_count', 'MoBI360 sms_frequency'].map((s) => <span key={s} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-600">{s}</span>)}</div>
          </Box>
        </div>
      )}

      {tab === 'narr' && (
        <div className="space-y-4">
          <Box>
            <div className="text-[14px] font-semibold">Resolution Funnel</div>
            <div className="text-[12.5px] text-slate-500">How were opaque gateway narrations resolved into categorized spend?</div>
            <div className="mt-4 space-y-2">
              {MOBI.funnel.map(([k, v, c]) => (
                <div key={k} className="flex items-center gap-3 text-[12px]">
                  <span className="w-36 text-slate-600">{k}</span>
                  <div className="h-2.5 flex-1 rounded-full bg-slate-100"><div className={cn('h-full rounded-full', k === 'Unresolved' ? 'bg-slate-300' : 'bg-emerald-400')} style={{ width: `${(v / funnelMax) * 100}%` }} /></div>
                  <span className="w-9 text-right font-semibold num">{v}%</span>
                  <span className="w-10 text-right font-mono text-slate-500">{c}</span>
                </div>
              ))}
            </div>
          </Box>
          <Box className="overflow-x-auto p-0">
            <div className="px-4 pt-4 text-[14px] font-semibold">Resolved Gateway Transactions</div>
            <table className="mt-3 w-full min-w-[600px] text-[12px]">
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500"><tr>{['Narration', 'Merchant', 'Category', 'Method', 'Conf.'].map((h) => <th key={h} className="px-4 py-2.5 font-semibold">{h}</th>)}</tr></thead>
              <tbody>{MOBI.resolved.map((r, i) => <tr key={i} className="border-t border-slate-100"><td className="px-4 py-2.5 font-mono text-slate-600">{r[0]}</td><td className="px-4 py-2.5 font-medium">{r[1]}</td><td className="px-4 py-2.5 font-mono text-[11px]">{r[2]}</td><td className="px-4 py-2.5 text-slate-600">{r[3]}</td><td className="px-4 py-2.5 font-mono">{r[4]}</td></tr>)}</tbody>
            </table>
          </Box>
          <Note tone="indigo"><strong>Flutterwave narrations are the richest format in Nigerian banking</strong><br />Merchant named explicitly after the slash — highest confidence resolution, no email/SMS needed</Note>
          <div className="grid grid-cols-2 gap-3">
            <StatBox label="Resolution Rate" value={`${MOBI.resolutionRate}%`} valueCls="text-emerald-600" sub="Benchmark: 85%+" />
            <StatBox label="Improvement" value={`+${MOBI.resolutionRate - 85}%`} valueCls="text-indigo-600" sub="vs pre-enrichment categorization" />
          </div>
        </div>
      )}

      {tab === 'comp' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Box><div className="text-[12px] text-slate-500">MoBI360 Composite Score</div><div className="text-[30px] font-bold text-emerald-600 num">{MOBI.composite}<span className="text-[14px] text-slate-400">/1000</span></div><span className={cn('rounded px-1.5 py-0.5 text-[10.5px] font-semibold', band[1])}>{band[0]}</span></Box>
            <Box><div className="text-[12px] text-slate-500">Confidence Level</div><div className="text-[30px] font-bold">{conf}%</div><div className="text-[12px] text-slate-500">{conf}% · {conf >= 80 ? 'HIGH' : 'MEDIUM'} — {MOBI.matchRate}% of signals have 2+ corroborating sources</div></Box>
          </div>
          <Box>
            <div className="text-[14px] font-semibold">Five-Weighted-Dimension Breakdown</div>
            <div className="mt-3 flex h-6 overflow-hidden rounded-full">
              {[[25, 'bg-emerald-500'], [20, 'bg-teal-500'], [20, 'bg-cyan-500'], [20, 'bg-rose-400'], [15, 'bg-indigo-400']].map(([w, c], i) => <div key={i} className={cn('grid place-items-center text-[10.5px] font-semibold text-white', c)} style={{ flex: w }}>{w}%</div>)}
            </div>
            <div className="mt-3"><Note tone="rose" icon={AlertTriangle}><strong>Risk Behaviour Penalty</strong> — Score: −{Math.abs(penalty)} · Deducted, cannot be offset by positive signals. Shown as a subtraction, not a fifth positive bar.</Note></div>
            <div className="mt-3 divide-y divide-slate-100">
              {MOBI.dims.map(([k, v]) => <div key={k} className="flex justify-between py-2 text-[12.5px]"><span className="text-slate-700">{k}</span><span className={cn('font-semibold num', v < 0 ? 'text-rose-600' : 'text-emerald-600')}>{v < 0 ? `−${Math.abs(v)}` : v}</span></div>)}
              <div className="flex justify-between py-2 text-[12.5px]"><span className="text-slate-700">KRK blend contribution</span><span className="font-semibold">25%</span></div>
            </div>
          </Box>
          <div className="rounded-lg bg-slate-100 px-3 py-2 font-mono text-[11.5px] text-slate-600">Output Contract: composite_score {MOBI.composite}, 5-dimension breakdown, status ENGINE-NATIVE, weight_into_KRK 25%</div>
        </div>
      )}
    </div>
  );
}
