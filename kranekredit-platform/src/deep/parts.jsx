import { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { cn } from '../components/ui.jsx';

export function EngineTitle({ icon: Icon, iconCls = 'text-indigo-600', title }) {
  return (
    <div className="mb-5">
      <h2 className="flex items-center gap-2 text-[18px] font-semibold text-slate-900"><Icon className={cn('h-5 w-5', iconCls)} />{title}</h2>
      <p className="mt-1 text-[13px] text-slate-500">Deep Analysis Breakdown — analyst-depth view of every metric, threshold, and piece of supporting evidence</p>
    </div>
  );
}

export function SubTabs({ tabs, value, onChange }) {
  return (
    <div className="thin-scroll mb-5 flex gap-1 overflow-x-auto border-b border-slate-200 pb-0" role="tablist">
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = value === t.key;
        return (
          <button key={t.key} role="tab" aria-selected={active} onClick={() => onChange(t.key)}
            className={cn('-mb-px inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-medium',
              active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800')}>
            {Icon && <Icon className="h-3.5 w-3.5" />}{t.label}
          </button>
        );
      })}
    </div>
  );
}

export function Box({ className, children }) {
  return <div className={cn('rounded-xl border border-slate-200 bg-white p-4', className)}>{children}</div>;
}

export function StatBox({ label, value, sub, valueCls = 'text-slate-900', className, children }) {
  return (
    <Box className={className}>
      <div className="text-[12px] text-slate-500">{label}</div>
      <div className={cn('mt-1 text-[22px] font-semibold num', valueCls)}>{value}</div>
      {sub && <div className="mt-0.5 text-[11.5px] text-slate-500">{sub}</div>}
      {children}
    </Box>
  );
}

// Question-led card with an evidence drawer (used across BS360 / Bureau / MoBI360).
export function QCard({ title, question, verdict, verdictSub, note, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-slate-900">{title}</div>
          {question && <div className="text-[12.5px] text-slate-500">{question}</div>}
          {note && <div className="mt-3 flex items-center gap-1.5 text-[11.5px] italic text-slate-500"><Info className="h-3 w-3" />{note}</div>}
        </div>
        {verdict && (
          <div className="text-right">
            <div className="text-[17px] font-bold text-slate-900">{verdict}</div>
            {verdictSub && <span className="mt-1 inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-emerald-700">{verdictSub}</span>}
          </div>
        )}
      </div>
      {children && (
        <>
          <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-center gap-1 border-t border-slate-100 bg-slate-50/60 py-2 text-[12.5px] text-slate-600 hover:bg-slate-50">
            {open ? 'Hide evidence' : 'View evidence'}{open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {open && <div className="border-t border-slate-100 p-4">{children}</div>}
        </>
      )}
    </div>
  );
}

export function Note({ tone = 'slate', icon: Icon = Info, children, className }) {
  const t = {
    slate: 'border-slate-200 bg-slate-50 text-slate-600', amber: 'border-amber-200 bg-amber-50 text-amber-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700', emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700', rose: 'border-rose-200 bg-rose-50 text-rose-700',
  }[tone];
  return <div className={cn('flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-[12.5px]', t, className)}><Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" /><div>{children}</div></div>;
}

export function Verdict({ v }) {
  const t = { STRONG: 'bg-emerald-50 text-emerald-700', MODERATE: 'bg-blue-50 text-blue-700', WATCH: 'bg-amber-50 text-amber-700', ELEVATED: 'bg-amber-50 text-amber-700', CONFIRMS: 'text-emerald-600', EXTENDS: 'text-indigo-600', UNVERIFIED: 'text-slate-400' }[v] || 'bg-slate-100 text-slate-600';
  return <span className={cn('rounded px-1.5 py-0.5 text-[10.5px] font-semibold', t)}>{v}</span>;
}
