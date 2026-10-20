import { useState } from 'react';
import { Layers, ChevronDown, ChevronUp, CheckCircle2, ArrowUpRight, HelpCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../components/ui.jsx';
import { EngineTitle } from './parts.jsx';

const ENGINE_CHIP = { BS360: 'bg-indigo-50 text-indigo-700', MoBI360: 'bg-emerald-50 text-emerald-700', Bureau: 'bg-violet-50 text-violet-700' };
const VERDICT = { CONFIRMS: ['text-emerald-600', CheckCircle2], EXTENDS: ['text-indigo-600', ArrowUpRight], UNVERIFIED: ['text-slate-400', HelpCircle] };

function Chip({ engine, verdict }) {
  const [cls, Icon] = VERDICT[verdict];
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px]">
      <span className={cn('rounded px-1.5 py-0.5 font-medium', ENGINE_CHIP[engine])}>{engine}</span>
      <span className={cn('inline-flex items-center gap-0.5 font-semibold', cls)}><Icon className="h-3 w-3" />{verdict}</span>
    </span>
  );
}

export default function ConsolidatedView({ items: CONSOLIDATED }) {
  const [open, setOpen] = useState(0);
  return (
    <div>
      <EngineTitle icon={Layers} title="Cross-Engine Narrative" />
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
        <Layers className="mt-0.5 h-4 w-4 text-indigo-600" />
        <div><div className="text-[13.5px] font-semibold text-indigo-800">Consolidated Cross-Engine Narrative</div><div className="text-[12px] text-indigo-600">Organized around financial questions — each answered once, with every engine's contribution folded in</div></div>
      </div>
      <div className="space-y-3">
        {CONSOLIDATED.map((c, i) => {
          const isOpen = open === i;
          const summary = [...new Map(c.rows.map((r) => [r[0] + r[1], r])).values()];
          return (
            <div key={c.q} className={cn('overflow-hidden rounded-xl border bg-white', c.warn ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200')}>
              <button onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-start gap-3 p-4 text-left">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-slate-900">{c.q}</div>
                  <div className={cn('text-[13px] font-medium', c.warn ? 'text-amber-700' : 'text-indigo-600')}>{c.a}</div>
                  <div className="mt-2 flex flex-wrap gap-3">{summary.map(([e, v]) => <Chip key={e + v} engine={e} verdict={v} />)}</div>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </button>
              {isOpen && (
                <div className="space-y-2 border-t border-slate-100 p-4">
                  {c.rows.map(([e, v, t], j) => (
                    <div key={j} className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
                      <Chip engine={e} verdict={v} />
                      <span className="text-[12.5px] text-slate-700">{t}</span>
                    </div>
                  ))}
                  {c.note && <div className="flex items-start gap-1.5 text-[12px] text-amber-700"><AlertTriangle className="mt-0.5 h-3.5 w-3.5" />{c.note}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-[11.5px] italic text-slate-500">Synthesis layer sitting above Sections 7–10 — never a fourth competing source of truth.</p>
    </div>
  );
}
