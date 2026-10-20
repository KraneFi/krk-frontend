import { useState } from 'react';
import { BrainCircuit, Layers, CheckCircle2, Sparkles, GitBranch, History, AlertTriangle, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { cn } from '../components/ui.jsx';
import { EngineTitle, SubTabs, Box, Note } from './parts.jsx';

const TABS = [
  { key: 'comp', label: 'Score Composition', icon: Layers },
  { key: 'gates', label: 'Scoring Label & Gates', icon: CheckCircle2 },
  { key: 'signal', label: 'KRK Signal Breakdown', icon: Sparkles },
  { key: 'overlay', label: 'Decision-Science Overlay', icon: GitBranch },
  { key: 'history', label: 'Re-Scoring History', icon: History },
];

export default function MainThinkerView({ report }) {
  const [tab, setTab] = useState('comp');
  const [open, setOpen] = useState(null);
  const degraded = report.label === 'DEGRADED';
  const e = report.engines;
  const D = report.deep;
  const w = degraded ? { bs: 70, bu: 30, mo: 0 } : { bs: 45, bu: 30, mo: 25 };

  return (
    <div>
      <EngineTitle icon={BrainCircuit} title="Synthesis & KRK Signal" />
      <SubTabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'comp' && (
        <div className="space-y-4">
          <Box className="border-indigo-200 text-center">
            <div className="text-[12px] text-slate-500">Final KRK Composite Score</div>
            <div className="text-[34px] font-bold text-indigo-700 num">{report.score}<span className="text-[15px] font-medium text-slate-400">/1000</span></div>
          </Box>
          <div className="text-[13.5px] font-semibold text-slate-900">Engine Contribution Waterfall</div>
          <div className="flex h-11 overflow-hidden rounded-xl">
            <div className="relative grid place-items-center bg-amber-500 text-white" style={{ flex: w.bs }}>
              <div className="text-center leading-tight"><div className="text-[12px] font-bold">{w.bs}%</div><div className="text-[9.5px] opacity-80">BS360</div></div>
            </div>
            <div className="grid place-items-center bg-violet-500 text-white" style={{ flex: w.bu }}><div className="text-center leading-tight"><div className="text-[12px] font-bold">{w.bu}%</div><div className="text-[9.5px] opacity-80">BUREAU</div></div></div>
            {w.mo > 0 && <div className="grid place-items-center bg-emerald-500 text-white" style={{ flex: w.mo }}><div className="text-center leading-tight"><div className="text-[12px] font-bold">{w.mo}%</div><div className="text-[9.5px] opacity-80">MOBI360</div></div></div>}
          </div>
          {degraded
            ? <Note tone="amber" icon={AlertTriangle}>Weight redistributed — MoBI360 unavailable, its 25% share moved to BS360 (DEGRADED scoring path)</Note>
            : <Note tone="emerald" icon={CheckCircle2}>No weight redistribution — all engines at full documented weight (FULL scoring path)</Note>}
          <div className="grid gap-3 sm:grid-cols-3">
            <Box className="border-dashed border-amber-300">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">BS360<span className="rounded-full border border-amber-300 bg-amber-50 px-1.5 text-[9.5px] text-amber-700">⚠ PROPOSED</span></div>
              <div className="mt-1 text-[22px] font-bold text-amber-600">{e.bs360.score}</div>
              <div className="text-[11px] text-slate-500">weight 45% → actual {w.bs}%</div>
            </Box>
            <Box><div className="text-[11px] font-semibold text-slate-600">BUREAU</div><div className="mt-1 text-[22px] font-bold text-violet-600">{e.bureau.score}</div><div className="text-[11px] text-slate-500">weight 30% → actual {w.bu}%</div></Box>
            <Box className={cn(!e.mobi.available && 'opacity-50')}><div className="text-[11px] font-semibold text-slate-600">MOBI360</div><div className="mt-1 text-[22px] font-bold text-emerald-600">{e.mobi.score ?? '—'}</div><div className="text-[11px] text-slate-500">weight 25% → actual {w.mo}%</div></Box>
          </div>
          <p className="flex gap-1.5 text-[11.5px] italic text-slate-500"><Info className="mt-0.5 h-3 w-3 shrink-0" />BS360's PROPOSED composite is visually distinguished (dashed border, amber P badge) from Bureau's and MoBI360's engine-native composites per OI-1.</p>
        </div>
      )}

      {tab === 'gates' && (
        <div className="space-y-4">
          <Box className={cn('text-center', degraded ? 'border-amber-200' : 'border-emerald-200')}>
            <div className="text-[12px] text-slate-500">Scoring Label</div>
            <span className={cn('mt-2 inline-block rounded-lg px-4 py-1.5 text-[20px] font-bold', degraded ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700')}>{report.label}</span>
            <div className="mt-2 text-[11.5px] text-slate-500">The single most important metadata — tells you how much to trust everything else on this page</div>
          </Box>
          <div className="flex flex-wrap gap-2">
            {[['BS360', true], ['Bureau', true], ['MoBI360', e.mobi.available]].map(([n, ok]) => (
              <span key={n} className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px]', ok ? 'border-emerald-200 text-slate-700' : 'border-slate-200 text-slate-400')}>
                <CheckCircle2 className={cn('h-3.5 w-3.5', ok ? 'text-emerald-500' : 'text-slate-300')} />{n}<span className={cn('text-[10px] font-semibold', ok ? 'text-emerald-600' : 'text-slate-400')}>{ok ? 'ENGINE-CONFIRMED' : 'STRUCTURALLY_ABSENT'}</span>
              </span>
            ))}
          </div>
          <div className="text-[13.5px] font-semibold text-slate-900">Gate-by-Gate Trace (7-Gate Protocol)</div>
          <div className="space-y-2">
            {D.gates.map(([name, detail, pass], i) => {
              const fail = !pass;
              return (
                <button key={name} onClick={() => setOpen(open === i ? null : i)} className={cn('block w-full rounded-xl border bg-white px-4 py-3 text-left', fail ? 'border-amber-200' : 'border-emerald-200')}>
                  <div className="flex items-center gap-3">
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-600">{i + 1}</span>
                    <span className="flex-1 text-[13.5px] font-medium text-slate-900">{name}</span>
                    <span className={cn('text-[11px] font-bold', fail ? 'text-amber-600' : 'text-emerald-600')}>{fail ? 'WARN' : 'PASS'}</span>
                    {open === i ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                  </div>
                  {open === i && <div className="ml-9 mt-2 text-[12.5px] text-slate-600">{detail}</div>}
                </button>
              );
            })}
          </div>
          <p className="text-[11.5px] italic text-slate-500">Exportable as-is for audit files — the explainability layer a compliance user needs to defend a decision.</p>
        </div>
      )}

      {tab === 'signal' && (
        <div className="space-y-4">
          <Box className="text-center"><div className="text-[12px] text-slate-500">Alphanumeric KRK Signal</div><div className="mt-1 font-mono text-[28px] font-bold tracking-tight text-slate-900">{report.signal}</div></Box>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[['Score', report.score], ['Risk', report.risk], ['Debt', report.debt], ['Tier', report.tier]].map(([k, v]) => <Box key={k}><div className="text-[11.5px] text-slate-500">{k}</div><div className="text-[20px] font-semibold text-indigo-700">{v}</div></Box>)}
          </div>
          <Note tone="amber" icon={AlertTriangle}>R-code segment shows its own computation basis — Bureau's 0–100 Risk Degree and KRK's R1–R5 codes are structurally similar but not confirmed to be the same scale (OI-6).</Note>
        </div>
      )}

      {tab === 'overlay' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Box><div className="text-[12px] text-slate-500">Base Weighted Score</div><div className="text-[24px] font-semibold">{report.score}</div></Box>
            <Box className="border-indigo-200 bg-indigo-50/30"><div className="text-[12px] text-slate-500">Post-Overlay Score</div><div className="text-[24px] font-semibold text-indigo-700">{report.score}</div></Box>
          </div>
          <Box className="overflow-x-auto p-0">
            <div className="px-4 pt-4 text-[13.5px] font-semibold">Enterprise Decision-Science Variables</div>
            <table className="mt-3 w-full min-w-[480px] text-[12.5px]">
              <thead className="bg-slate-50 text-left text-[11.5px] text-slate-500"><tr>{['Variable', 'Enterprise', 'Inferred', 'Conflict'].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {D.overlay.map(([k, a, b]) => (
                  <tr key={k} className="border-t border-slate-100"><td className="px-4 py-2.5 font-medium">{k}</td><td className="px-4 py-2.5">{a} <span className="text-[10.5px] text-indigo-500">(used)</span></td><td className="px-4 py-2.5 text-slate-600">{b}</td><td className="px-4 py-2.5">{a === b ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}</td></tr>
                ))}
              </tbody>
            </table>
          </Box>
          <Box>
            <div className="text-[13.5px] font-semibold">Persona & Recommendation Trace</div>
            <div className="mt-2 text-[16px] font-semibold text-slate-900">{D.persona.name}</div>
            <div className="text-[12px] text-slate-500">Confidence: {D.persona.conf}%</div>
            <div className="mt-2 text-[11.5px] italic text-slate-500">Source: BS360 Family/Social Infusion Pattern detection — not re-derived, per Main Thinker Engine documentation</div>
          </Box>
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-4">
          <div className="text-[13.5px] font-semibold">Scoring Version Timeline</div>
          <Box className="flex items-start gap-3">
            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500" />
            <div>
              <div className="flex items-center gap-2"><span className="font-mono text-[13px] font-semibold">{report.signal}</span><span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold', degraded ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700')}>{report.label}</span></div>
              <div className="text-[12.5px] text-slate-600">Initial compute</div>
              <div className="text-[11.5px] text-slate-400">{D.computed}</div>
            </div>
          </Box>
          <Note tone="emerald" icon={CheckCircle2}>{D.gates[1][1]} (Gate 2)</Note>
          <Note tone="amber" icon={AlertTriangle}>No source document specifies a re-scoring cadence — staleness banner states data age, not a false freshness guarantee (OI-3).</Note>
        </div>
      )}
    </div>
  );
}
