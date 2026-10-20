import { useState } from 'react';
import { FileCheck, ClipboardCheck, ShieldAlert, Search, Download, Check } from 'lucide-react';
import { Card, Avatar, TierBadge, DecisionBadge, Pill, IconTile, cn } from '../components/ui.jsx';
import { useData } from '../data/DataContext.jsx';
import { Link, useApp } from '../router.jsx';

const FILTERS = ['All', 'Completed', 'Manual Review', 'Auto-Approve', 'Auto-Decline', 'Refer'];
const INTEGRITY_TONE = { Clear: 'emerald', Review: 'amber', 'High Risk': 'rose' };

export default function Checks() {
  const { navigate, notify } = useApp();
  const { CHECKS } = useData();
  const [filter, setFilter] = useState('All');
  const [q, setQ] = useState('');

  const rows = CHECKS.filter((c) => {
    const f = filter === 'All' || (filter === 'Completed' || filter === 'Manual Review' ? c.status === filter : c.decision === filter);
    const s = q.trim().toLowerCase();
    return f && (!s || c.name.toLowerCase().includes(s) || c.signal.toLowerCase().includes(s));
  });

  const exportCsv = () => {
    const csv = [['Customer', 'BVN', 'KRK Signal', 'Score', 'Integrity', 'Decision', 'Status', 'Analyst', 'Created'], ...rows.map((c) => [c.name, `••••••${c.bvn}`, c.signal, c.score, c.integrity, c.decision, c.status, c.analyst, c.created])]
      .map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = 'krk-checks.csv';
      a.click();
      notify(`Exported ${rows.length} checks`);
    } catch { notify('Export is unavailable in this preview'); }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          [FileCheck, 'bg-indigo-50 text-indigo-600', CHECKS.length, 'Total Checks'],
          [ClipboardCheck, 'bg-emerald-50 text-emerald-600', CHECKS.filter((c) => c.status === 'Completed').length, 'Completed'],
          [ShieldAlert, 'bg-amber-50 text-amber-600', CHECKS.filter((c) => c.status === 'Manual Review').length, 'Manual Review'],
        ].map(([Icon, tile, v, l]) => (
          <Card key={l} className="flex items-center gap-4 p-4">
            <IconTile icon={Icon} className={tile} />
            <div>
              <div className="text-[22px] font-semibold leading-none text-slate-900 num">{v}</div>
              <div className="mt-1 text-[13px] text-slate-500">{l}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn('rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors', filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
                {f}
              </button>
            ))}
          </div>
          <div className="ml-auto flex w-full gap-2 sm:w-auto">
            <label className="relative flex-1 sm:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="checks-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customer or signal..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[13px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:w-56" />
            </label>
            <button onClick={exportCsv} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50">
              <Download className="h-4 w-4" />Export
            </button>
          </div>
        </div>
        <div className="thin-scroll overflow-x-auto">
          <table className="w-full min-w-[1080px] text-[13px]">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {['Customer', 'KRK Signal', 'Score', 'Integrity', 'Decision', 'Status', 'Analyst', 'Created', ''].map((h) => <th key={h} className="px-5 py-3.5 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} onClick={() => navigate('/checks/' + c.id)} className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} />
                      <div>
                        <div className="font-medium text-slate-900">{c.name}</div>
                        <div className="text-[12px] text-slate-500">BVN ••••••{c.bvn}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-mono text-[12.5px] text-slate-700">{c.signal}</td>
                  <td className="px-5 py-4"><div className="flex items-center gap-2"><span className="text-[15px] font-semibold text-slate-900 num">{c.score}</span><TierBadge tier={c.tier} /></div></td>
                  <td className="px-5 py-4"><Pill tone={INTEGRITY_TONE[c.integrity]}>{c.integrity}</Pill></td>
                  <td className="px-5 py-4"><DecisionBadge decision={c.decision} /></td>
                  <td className="px-5 py-4">
                    {c.status === 'Completed'
                      ? <Pill tone="emerald"><Check className="h-3 w-3" />Completed</Pill>
                      : <Pill tone="amber"><span className="font-bold">!</span>Manual Review</Pill>}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">{c.analyst}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-500">{c.created}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-right">
                    <Link to={'/checks/' + c.id} className="text-[13px] font-medium text-indigo-600 hover:underline">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <div className="p-10 text-center text-[13px] text-slate-500">No checks match this filter.</div>}
        </div>
      </Card>
    </div>
  );
}
