import { useState } from 'react';
import { Lock, Check, Clock, Hourglass, ShieldCheck, Database, GitMerge, Trash2, Download, Loader2, AlertCircle, ChevronRight, ChevronDown } from 'lucide-react';
import { Card, CardHeader, PillTabs, IconTile, cn } from '../components/ui.jsx';
import { ACCESS_TIERS, RETENTION } from '../data/core.js';
import { useData } from '../data/DataContext.jsx';
import { useApp } from '../router.jsx';
import { kyb } from '../api/resources.js';
import { useApi, describeError } from '../api/useApi.js';
import { LIVE } from '../config.js';
import KybItemPanel from '../components/KybItemPanel.jsx';

const LINEAGE_ICON = { ShieldCheck, Database, Check, GitMerge };

const TIER_LABELS = [
  { tier: 'TIER 0', name: 'Explore', req: 'Account created' },
  { tier: 'TIER 1', name: 'Sandbox', req: 'Phone and business basics' },
  { tier: 'TIER 2', name: 'Live (Restricted)', req: 'KYB documents verified' },
  { tier: 'TIER 3', name: 'Live (Full)', req: 'Compliance review of first live checks' },
];

const DOC_STATUS = {
  verified: { label: 'Verified', ok: true },
  needs_review: { label: 'In Review', ok: false },
  under_review: { label: 'In Review', ok: false },
  submitted: { label: 'In Review', ok: false },
  not_started: { label: 'Not started', ok: false },
  action_required: { label: 'Action required', ok: false },
  rejected: { label: 'Rejected', ok: false },
};

export default function Compliance() {
  const { KYB_DOCS, LINEAGE } = useData();
  const { notify } = useApp();
  const [tab, setTab] = useState('kyb');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [cust, setCust] = useState('');
  const [openKey, setOpenKey] = useState(null);
  const access = useApi(() => kyb.access(), [], { enabled: LIVE });
  const verification = useApi(() => kyb.verification(), [], { enabled: LIVE });

  // Live: derive tiers from access.level; mock: keep the generated checklist.
  const tiers = LIVE && access.data
    ? TIER_LABELS.map((t, i) => ({
        ...t,
        state: i < access.data.level ? 'done' : i === access.data.level ? 'current' : 'locked',
      }))
    : ACCESS_TIERS;

  const docs = LIVE && verification.data
    ? verification.data.groups.flatMap((g) => g.items).map((it) => {
        const s = DOC_STATUS[it.status] || { label: it.status, ok: false };
        return { key: it.key, name: it.title, status: s.label, ok: s.ok, why: it.why, updated: it.updated_at };
      })
    : KYB_DOCS.map((d) => ({ ...d, status: d.status, ok: d.status === 'Verified', why: null }));

  const refreshCompliance = () => { access.refetch(); verification.refetch(); };

  return (
    <div className="space-y-6">
      <PillTabs value={tab} onChange={setTab} tabs={[{ key: 'kyb', label: 'KYB & Access Tiers' }, { key: 'lineage', label: 'Data Lineage' }, { key: 'retention', label: 'Retention' }, { key: 'export', label: 'Audit Export' }]} />

      {tab === 'kyb' && LIVE && (access.loading || verification.loading) && (
        <Card className="flex items-center gap-3 p-6 text-[13px] text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />Loading compliance status…
        </Card>
      )}
      {tab === 'kyb' && LIVE && (access.error || verification.error) && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-[13px] text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{describeError(access.error || verification.error)}</span>
        </div>
      )}

      {tab === 'kyb' && (
        <>
          <Card className="p-5">
            <CardHeader title="Access Tier Progression" icon={Lock} />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {tiers.map((t) => (
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
            {LIVE && access.data && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-[12.5px] text-slate-600">
                <span>Level <strong className="text-slate-900">{access.data.level}</strong> · {access.data.label}</span>
                {access.data.next_label && <span>Next: <strong className="text-slate-900">{access.data.next_label}</strong> ({access.data.progress.done}/{access.data.progress.total})</span>}
                {access.data.requirements?.length > 0 && (
                  <span className="text-slate-500">Outstanding: {access.data.requirements.map((r) => r.title).join(', ')}</span>
                )}
              </div>
            )}
          </Card>
          <Card className="overflow-hidden">
            <div className="p-5">
              <CardHeader
                title="KYB Documents"
                sub={LIVE && verification.data ? `${docs.filter((d) => d.ok).length} of ${docs.length} verified — open any item to complete it` : 'Dynamic checklist scoped to institution type: CBN-Licensed Digital Lender'}
              />
            </div>
            {LIVE && verification.data
              ? verification.data.groups.map((g) => (
                  <div key={g.name}>
                    <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{g.name}</span>
                      <span className="text-[11px] text-slate-400">{g.done}/{g.total}</span>
                    </div>
                    {g.items.map((it) => {
                      const open = openKey === it.key;
                      const ok = it.status === 'verified';
                      const inReview = it.status === 'in_review';
                      const needsAction = it.status === 'action_needed';
                      return (
                        <div key={it.key}>
                          <button
                            onClick={() => setOpenKey(open ? null : it.key)}
                            aria-expanded={open}
                            className={cn('flex w-full flex-wrap items-center gap-4 border-t border-slate-100 px-5 py-3.5 text-left hover:bg-slate-50/70', open && 'bg-indigo-50/40')}
                          >
                            <IconTile icon={ok ? Check : Clock} size="sm" className={cn('h-9 w-9', ok ? 'bg-emerald-50 text-emerald-600' : needsAction ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-600')} />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[13.5px] font-medium text-slate-900">{it.title}</span>
                                {it.required_for === 'optional' && (
                                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">Optional</span>
                                )}
                              </div>
                              <div className="text-[12px] text-slate-500">{it.subtitle || it.why}</div>
                            </div>
                            {ok
                              ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-medium text-emerald-700"><Check className="h-3 w-3" />Verified</span>
                              : inReview
                                ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11.5px] font-medium text-amber-700"><Hourglass className="h-3 w-3" />In Review</span>
                                : needsAction
                                  ? <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11.5px] font-medium text-rose-600"><AlertCircle className="h-3 w-3" />Action needed</span>
                                  : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11.5px] text-slate-600">{it.status === 'expiring' ? 'Expiring' : it.status === 'in_progress' ? 'In progress' : 'Not started'}</span>}
                            <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-indigo-600">
                              {it.action_label}{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </span>
                          </button>
                          {open && <KybItemPanel itemKey={it.key} onClose={() => setOpenKey(null)} onChanged={refreshCompliance} />}
                        </div>
                      );
                    })}
                  </div>
                ))
              : KYB_DOCS.map((d) => (
                  <div key={d.name} className="flex flex-wrap items-center gap-4 border-t border-slate-100 px-5 py-3.5">
                    <IconTile icon={d.ok ? Check : Clock} size="sm" className={cn('h-9 w-9', d.ok ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-medium text-slate-900">{d.name}</div>
                      <div className="text-[12px] text-slate-500">{d.why || (d.date ? `Uploaded ${d.date}` : 'Awaiting submission')}</div>
                    </div>
                    {d.ok
                      ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-medium text-emerald-700"><Check className="h-3 w-3" />Verified</span>
                      : d.status === 'In Review'
                        ? <><span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11.5px] font-medium text-amber-700"><Hourglass className="h-3 w-3" />In Review</span><span className="text-[12px] text-slate-500">SLA: 1–2 business days</span></>
                        : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11.5px] text-slate-600">{d.status}</span>}
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
