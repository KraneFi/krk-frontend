import { useState } from 'react';
import { Wallet, TrendingDown, AlertTriangle, Phone, MessageSquare, Mail, RotateCcw, CalendarDays, X } from 'lucide-react';
import { Card, CardHeader, PillTabs, TierBadge, Avatar, IconTile, cn } from '../components/ui.jsx';
import { useData } from '../data/DataContext.jsx';
import { useApp } from '../router.jsx';

const ICONS = { Wallet, TrendingDown, AlertTriangle };

export default function Servicing() {
  const { SERVICING_STATS, BUCKETS, COLLECTIONS, LOANS } = useData();
  const { notify } = useApp();
  const [tab, setTab] = useState('overview');
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {SERVICING_STATS.map((s) => (
          <Card key={s.label} className="p-5">
            <IconTile icon={ICONS[s.icon]} className={s.tile} />
            <div className="mt-4 text-[22px] font-semibold leading-none text-slate-900 num">{s.value}</div>
            <div className="mt-1.5 text-[13px] text-slate-500">{s.label}</div>
            {s.sub && <div className="text-[11.5px] text-slate-400">{s.sub}</div>}
          </Card>
        ))}
      </div>

      <PillTabs value={tab} onChange={setTab} tabs={[{ key: 'overview', label: 'Portfolio Overview' }, { key: 'queue', label: 'Collections Queue' }, { key: 'loans', label: 'All Loans' }]} />

      {tab === 'overview' && (
        <Card className="p-5">
          <CardHeader title="Delinquency Buckets" sub="Loans bucketed by Days Past Due (DPD) — standard servicing convention" />
          <div className="mt-5 space-y-3">
            {BUCKETS.map((b) => (
              <div key={b.label} className="grid grid-cols-[88px_1fr_88px] items-center gap-4 sm:grid-cols-[110px_1fr_110px]">
                <div><div className={cn('text-[13.5px] font-medium', b.labelCls)}>{b.label}</div><div className="text-[11.5px] text-slate-500">{b.loans} loans</div></div>
                <div className="h-8 overflow-hidden rounded-xl bg-slate-50"><div className={cn('h-full rounded-xl', b.bar)} style={{ width: `${Math.max(b.share, 1.2)}%` }} /></div>
                <div className="text-right"><div className="text-[13.5px] font-semibold text-slate-900">{b.amount}</div><div className="text-[11.5px] text-slate-500">{b.book}</div></div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'queue' && (
        <Card className="overflow-hidden">
          <div className="p-5 pb-3"><CardHeader title="Collections Queue" sub="Sorted by DPD bucket and outstanding amount — systematic follow-up" /></div>
          {COLLECTIONS.map((c, i) => (
            <div key={i} className="flex flex-wrap items-center gap-4 border-t border-slate-100 px-5 py-4">
              <IconTile icon={AlertTriangle} className="bg-amber-50 text-amber-500" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><span className="text-[14px] font-medium text-slate-900">{c.name}</span><TierBadge tier={c.tier} /></div>
                <div className="text-[12px] text-slate-500">{c.bucket} · Last contact {c.contact}</div>
              </div>
              <div className="text-right"><div className="text-[15px] font-semibold text-rose-600 num">{c.amount}</div><div className="text-[11.5px] text-slate-500">{c.dpd} days past due</div></div>
              {c.promise
                ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11.5px] font-medium text-emerald-700"><CalendarDays className="h-3 w-3" />{c.promise}</span>
                : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] text-slate-500">No promise</span>}
              <div className="flex gap-1.5">
                {[[Phone, 'Call'], [MessageSquare, 'SMS'], [Mail, 'Email']].map(([Icon, l]) => (
                  <button key={l} onClick={() => notify(`${l} to ${c.name} logged`)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label={`${l} ${c.name}`}><Icon className="h-4 w-4" /></button>
                ))}
                <button onClick={() => notify(`Restructure proposal started for ${c.name}`)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50"><RotateCcw className="h-3.5 w-3.5" />Restructure</button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {tab === 'loans' && (
        <Card className="thin-scroll overflow-x-auto">
          <table className="w-full min-w-[900px] text-[13px]">
            <thead><tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wider text-slate-500">{['Customer', 'Product', 'Principal', 'Outstanding', 'DPD', 'Bucket', 'Tier', 'Status'].map((h) => <th key={h} className="px-5 py-3.5 font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {LOANS.map((l, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="px-5 py-3.5"><div className="flex items-center gap-3"><Avatar name={l.name} /><span className="font-medium text-slate-900">{l.name}</span></div></td>
                  <td className="px-5 py-3.5 text-slate-500">{l.product}</td>
                  <td className="px-5 py-3.5 font-semibold num">{l.principal}</td>
                  <td className="px-5 py-3.5 font-semibold num">{l.outstanding}</td>
                  <td className={cn('px-5 py-3.5 font-semibold num', l.dpd ? 'text-rose-500' : 'text-slate-600')}>{l.dpd}</td>
                  <td className="px-5 py-3.5"><span className={cn('rounded-full px-2 py-0.5 text-[11.5px] font-medium', l.bucket === 'Current' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-600')}>{l.bucket}</span></td>
                  <td className="px-5 py-3.5"><TierBadge tier={l.tier} /></td>
                  <td className="px-5 py-3.5">
                    {l.status === 'delinquent'
                      ? <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11.5px] font-medium text-rose-600"><X className="h-3 w-3" />delinquent</span>
                      : <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-medium text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />{l.status}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
