import { useEffect, useState } from 'react';
import { X, ChevronRight, ChevronLeft, Lock, Landmark, ShieldCheck, Smartphone, BrainCircuit, Layers } from 'lucide-react';
import { cn } from '../components/ui.jsx';
import BS360View from './BS360View.jsx';
import BureauView from './BureauView.jsx';
import MobiView from './MobiView.jsx';
import MainThinkerView from './MainThinkerView.jsx';
import ConsolidatedView from './ConsolidatedView.jsx';

const ENGINES = [
  { key: 'bs360', label: 'BS360', weight: '45%', icon: Landmark, crumb: 'BS360' },
  { key: 'bureau', label: 'Bureau', weight: '30%', icon: ShieldCheck, crumb: 'Bureau' },
  { key: 'mobi', label: 'MoBI360', weight: '25%', icon: Smartphone, crumb: 'MoBI360' },
  { key: 'mt', label: 'Main Thinker', icon: BrainCircuit, crumb: 'Main Thinker' },
  { key: 'cons', label: 'Consolidated', icon: Layers, crumb: 'Consolidated' },
];

// Full-screen "Deep Analysis Breakdown" overlay opened from any "View more".
export default function DeepAnalysis({ report, initial = 'mt', onClose }) {
  const [engine, setEngine] = useState(initial);
  const current = ENGINES.find((e) => e.key === engine);

  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white kk-fade" role="dialog" aria-modal="true" aria-label="Deep Analysis Breakdown"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center gap-3 border-b border-slate-200 py-3" style={{ paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))', paddingRight: 'max(16px, env(safe-area-inset-right, 0px))' }}>
        <nav className="flex min-w-0 items-center gap-1.5 text-[13px]">
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">Report</button>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <span className="truncate font-medium text-slate-800">{report.name}</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <span className="font-medium text-indigo-600">{current.crumb}</span>
        </nav>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11.5px] font-medium text-indigo-600"><Lock className="h-3 w-3" />Pro Tier</span>
        <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Close"><X className="h-4 w-4" /></button>
      </div>

      <div className="thin-scroll flex gap-1 overflow-x-auto border-b border-slate-200 py-2" style={{ paddingLeft: 'max(12px, env(safe-area-inset-left, 0px))', paddingRight: 'max(12px, env(safe-area-inset-right, 0px))' }}>
        {ENGINES.map((e) => {
          const Icon = e.icon;
          const off = e.key === 'mobi' && report.engines.mobi.available === false;
          return (
            <button key={e.key} disabled={off} onClick={() => setEngine(e.key)}
              className={cn('inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-medium transition-colors disabled:opacity-40',
                engine === e.key ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800')}>
              <Icon className={cn('h-4 w-4', engine === e.key && e.key === 'bs360' && 'text-amber-600')} />
              {e.label}
              {e.weight && <span className="text-[11px] text-slate-400">{e.weight}</span>}
            </button>
          );
        })}
      </div>

      <div className="thin-scroll flex-1 overflow-y-auto bg-slate-50/70">
        <div className="mx-auto w-full max-w-[880px] py-8" style={{ paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))', paddingRight: 'max(16px, env(safe-area-inset-right, 0px))' }}>
          {engine === 'bs360' && <BS360View d={report.deep.bs360} />}
          {engine === 'bureau' && <BureauView d={report.deep.bureau} name={report.name} />}
          {engine === 'mobi' && <MobiView d={report.deep.mobi} />}
          {engine === 'mt' && <MainThinkerView report={report} />}
          {engine === 'cons' && <ConsolidatedView items={report.deep.consolidated} />}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white py-3 text-[12px]" style={{ paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))', paddingRight: 'max(16px, env(safe-area-inset-right, 0px))' }}>
        <button onClick={onClose} className="inline-flex items-center gap-1 text-[13px] text-slate-600 hover:text-slate-900"><ChevronLeft className="h-4 w-4" />Back to Summary</button>
        <span className="hidden text-slate-400 sm:inline">Every number traceable to a named metric in an engine's own documentation</span>
      </div>
    </div>
  );
}
