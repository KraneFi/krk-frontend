import { useMemo, useState } from 'react';
import { FileCheck, Search, Download, Plus, Info, Trash2 } from 'lucide-react';
import { Card, Avatar, TierBadge, OutcomeBadge, IconTile } from '../components/ui.jsx';
import { Link, useApp } from '../router.jsx';
import { useSession } from '../api/auth.js';
import { listChecks, removeCheck } from '../api/scoring.js';

const fmt = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export default function ChecksLive() {
  const { navigate, notify } = useApp();
  const { user } = useSession();
  const tenantId = user?.tenant_id;
  const [q, setQ] = useState('');
  const [nonce, setNonce] = useState(0);

  const rows = useMemo(() => {
    const all = listChecks(tenantId);
    const s = q.trim().toLowerCase();
    return s ? all.filter((c) => `${c.name} ${c.krk_signal}`.toLowerCase().includes(s)) : all;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, q, nonce]);

  const scored = rows.filter((c) => c.score > 0).length;

  const exportCsv = () => {
    const csv = [['Customer', 'KRK Signal', 'Score', 'Tier', 'Risk', 'Debt', 'Outcome', 'Confidence', 'Created'],
      ...rows.map((c) => [c.name, c.krk_signal, c.score, c.tier_code, c.risk_code, c.debt_code, c.outcome, c.confidence, c.created_at])]
      .map((r) => r.map((v) => `"${v ?? ''}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'krk-checks.csv';
    a.click();
    notify(`Exported ${rows.length} checks`);
  };

  const drop = (id) => {
    removeCheck(tenantId, id);
    setNonce((n) => n + 1);
    notify('Removed from this browser');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <strong>This list lives in your browser.</strong> The API can score and fetch a single
          individual&apos;s history, but it has no tenant-wide checks endpoint yet — so this page only
          shows checks started from this browser. Nothing else is invented.
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          [FileCheck, 'bg-indigo-50 text-indigo-600', rows.length, 'Checks in this browser'],
          [FileCheck, 'bg-emerald-50 text-emerald-600', scored, 'With a score'],
          [FileCheck, 'bg-amber-50 text-amber-600', rows.length - scored, 'No engine reported'],
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
          <label className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customer or signal..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[13px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </label>
          <div className="ml-auto flex gap-2">
            <button onClick={exportCsv} disabled={!rows.length} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40">
              <Download className="h-4 w-4" />Export
            </button>
            <Link to="/checks/new" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-[13px] font-medium text-white hover:bg-indigo-700">
              <Plus className="h-4 w-4" />New Check
            </Link>
          </div>
        </div>

        {rows.length ? (
          <div className="thin-scroll overflow-x-auto">
            <table className="w-full min-w-[900px] text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {['Customer', 'KRK Signal', 'Score', 'Engine coverage', 'Created', ''].map((h) => <th key={h} className="px-5 py-3.5 font-semibold">{h}</th>)}
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
                          <div className="text-[12px] text-slate-500">{c.bvn ? `BVN ••••••${String(c.bvn).slice(-4)}` : c.phone || c.individual_id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-[12.5px] text-slate-700">{c.krk_signal}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-semibold text-slate-900 num">{c.score}</span>
                        <TierBadge tier={c.tier_code} />
                      </div>
                    </td>
                    <td className="px-5 py-4"><OutcomeBadge outcome={c.outcome} /></td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">{fmt(c.created_at)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={(e) => { e.stopPropagation(); drop(c.id); }} aria-label="Remove from this browser" className="text-slate-300 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
                        <Link to={'/checks/' + c.id} className="text-[13px] font-medium text-indigo-600 hover:underline">View →</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-500"><FileCheck className="h-6 w-6" /></div>
            <div className="mt-3 text-[15px] font-semibold text-slate-900">No checks yet</div>
            <p className="mx-auto mt-1 max-w-md text-[13px] text-slate-500">Run a check with a sample profile or your own statement and it will appear here.</p>
            <Link to="/checks/new" className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-[13px] font-medium text-white hover:bg-indigo-700">
              <Plus className="h-4 w-4" />Run a check
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
