import { useState } from 'react';
import { Lock, Check, Clock, Hourglass, ShieldCheck, Database, GitMerge, Trash2, Download } from 'lucide-react';
import { Card, CardHeader, PillTabs, IconTile, cn } from '../components/ui.jsx';
import { ACCESS_TIERS, RETENTION } from '../data/core.js';
import { useData } from '../data/DataContext.jsx';
import { useApp } from '../router.jsx';

const LINEAGE_ICON = { ShieldCheck, Database, Check, GitMerge };

export default function Compliance() {
  const { KYB_DOCS, LINEAGE } = useData();
  const { notify } = useApp();
  const [tab, setTab] = useState('kyb');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [cust, setCust] = useState('');

  return (
    <div className="space-y-6">
      <PillTabs value={tab} onChange={setTab} tabs={[{ key: 'kyb', label: 'KYB & Access Tiers' }, { key: 'lineage', label: 'Data Lineage' }, { key: 'retention', label: 'Retention' }, { key: 'export', label: 'Audit Export' }]} />

      {tab === 'kyb' && (
        <>
          <Card className="p-5">
            <CardHeader title="Access Tier Progression" icon={Lock} />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {ACCESS_TIERS.map((t) => (
                <div key={t.tier} className={cn('rounded-xl border p-4', t.state === 'done' && 'border-emerald-200', t.state === 'current' && 'border-amber-300 bg-amber-50/40 ring-1 ring-amber-200', t.state === 'locked' && 'border-slate-200 opacity-60')}>
                  <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-slate-500">
                    {t.tier}
                    {t.state === 'done' && <Check className="h-4 w-4 text-emerald-500" />}
                    {t.state === 'current' && <span className="text-orange-500">CURRENT</span>}
                    {t.state === 'locked' && <Lock className="h-3.5 w-3.5 text-slate-400" />}
                  </div>
                  <div className="mt-2 text-[14px] font-semibold text-slate-900">{t.name}</div>
                  <div className="text-[12px] text-slate-500">{t.req}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="overflow-hidden">
            <div className="p-5"><CardHeader title="KYB Documents" sub="Dynamic checklist scoped to institution type: CBN-Licensed Digital Lender" /></div>
            {KYB_DOCS.map((d) => (
              <div key={d.name} className="flex flex-wrap items-center gap-4 border-t border-slate-100 px-5 py-3.5">
                <IconTile icon={d.status === 'Verified' ? Check : Clock} size="sm" className={cn('h-9 w-9', d.status === 'Verified' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')} />
                <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium text-slate-900">{d.name}</div><div className="text-[12px] text-slate-500">Uploaded {d.date}</div></div>
                {d.status === 'Verified'
                  ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-medium text-emerald-700"><Check className="h-3 w-3" />Verified</span>
                  : <><span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11.5px] font-medium text-amber-700"><Hourglass className="h-3 w-3" />In Review</span><span className="text-[12px] text-slate-500">SLA: 1–2 business days</span></>}
              </div>
            ))}
          </Card>
        </>
      )}

      {tab === 'lineage' && (
        <Card className="p-5">
          <CardHeader title={`Data Lineage — Check ${LINEAGE.id}`} sub="Every data source, with timestamps, consent basis, and waterfall path" />
          <ol className="mt-5">
            {LINEAGE.rows.map(([icon, title, sub, time, state], i) => { const l = { icon, title, sub, time, state };
              const Icon = LINEAGE_ICON[l.icon];
              return (
                <li key={l.title} className="relative flex gap-3 pb-5 last:pb-0">
                  {i < LINEAGE.rows.length - 1 && <span className="absolute left-[11px] top-7 h-[calc(100%-22px)] w-px bg-emerald-100" />}
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Icon className="h-3.5 w-3.5" /></span>
                  <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium text-slate-900">{l.title}</div><div className="text-[12px] text-slate-500">{l.sub}</div></div>
                  <div className="text-right"><div className="font-mono text-[12px] text-slate-500">{l.time}</div><div className={cn('text-[11.5px]', l.state === 'Skipped' || l.state === 'Flagged' ? 'text-amber-600' : 'text-emerald-600')}>{l.state}</div></div>
                </li>
              );
            })}
          </ol>
        </Card>
      )}

      {tab === 'retention' && (
        <Card className="overflow-hidden">
          <div className="p-5"><CardHeader title="Data Retention & Deletion Policies" sub="Configurable per NDPA obligations — auto-purge scheduling with audit trail" /></div>
          {RETENTION.map((r) => (
            <div key={r.name} className="flex flex-wrap items-center gap-4 border-t border-slate-100 px-5 py-4">
              <IconTile icon={Database} size="sm" className="h-9 w-9 bg-indigo-50 text-indigo-600" />
              <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium text-slate-900">{r.name}</div><div className="text-[12px] text-slate-500">Retention: {r.months} months</div></div>
              {r.purge
                ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-medium text-emerald-700"><Trash2 className="h-3 w-3" />Auto-purge</span>
                : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11.5px] text-slate-600">Manual</span>}
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-medium text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />Active</span>
              <button onClick={() => notify(`Editing retention for ${r.name}`)} className="text-[12.5px] font-medium text-indigo-600 hover:underline">Edit</button>
            </div>
          ))}
        </Card>
      )}

      {tab === 'export' && (
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <IconTile icon={Download} size="lg" className="bg-indigo-50 text-indigo-600" />
            <div><div className="text-[15px] font-semibold text-slate-900">Export Audit Package</div><div className="text-[13px] text-slate-500">Respond to regulator or auditor inquiries without engineering support</div></div>
          </div>
          <p className="mt-4 text-[13.5px] text-slate-600">Export by date range and/or customer. Includes: decision policy version in effect, reason codes issued, consent records, and the action audit log for that period.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[['exp-from', 'From Date', 'date', from, setFrom], ['exp-to', 'To Date', 'date', to, setTo], ['exp-cust', 'Customer (optional)', 'text', cust, setCust]].map(([id, l, t, v, set]) => (
              <label key={id} htmlFor={id} className="block">
                <span className="text-[13px] font-medium text-slate-900">{l}</span>
                <input id={id} type={t} value={v} onChange={(e) => set(e.target.value)} placeholder={t === 'text' ? 'BVN or name' : undefined}
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13.5px] focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10" />
              </label>
            ))}
          </div>
          <button onClick={() => notify(from && to ? `Audit package generated for ${from} to ${to}` : 'Choose a From and To date to generate the export')}
            className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-[13.5px] font-medium text-white hover:bg-indigo-700"><Download className="h-4 w-4" />Generate Export</button>
        </Card>
      )}
    </div>
  );
}
