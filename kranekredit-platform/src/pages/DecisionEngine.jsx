import { useState } from 'react';
import { Plus, Package, SlidersHorizontal, Users, Check, History } from 'lucide-react';
import { Card, PillTabs, TierBadge, IconTile, cn } from '../components/ui.jsx';
import { RULES } from '../data/core.js';
import { useData } from '../data/DataContext.jsx';
import { useApp } from '../router.jsx';

const STATUS = {
  Active: <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-medium text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Active</span>,
  Paused: <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[11.5px] font-medium text-slate-600"><span className="text-[9px]">❚❚</span>Paused</span>,
  Draft: <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2 py-0.5 text-[11.5px] font-medium text-slate-500"><span className="h-1.5 w-1.5 rounded-full border border-slate-400" />Draft</span>,
};
const OUTCOME = { 'Auto Approve': 'border-emerald-200 bg-emerald-50 text-emerald-700', 'Auto Decline': 'border-rose-200 bg-rose-50 text-rose-600', Refer: 'border-amber-200 bg-amber-50 text-amber-700' };
const NEW_LABEL = { products: 'New Product', rules: 'New Rule', segments: 'New Segment', versions: 'New Version' };

export default function DecisionEngine() {
  const { PRODUCTS, SEGMENTS, VERSIONS } = useData();
  const { notify } = useApp();
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState(PRODUCTS);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PillTabs value={tab} onChange={setTab} tabs={[{ key: 'products', label: 'Loan Products' }, { key: 'rules', label: 'Decision Rules' }, { key: 'segments', label: 'Segments' }, { key: 'versions', label: 'Version History' }]} />
        <button onClick={() => notify(`${NEW_LABEL[tab]} — builder opens in the full product`)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-[13px] font-medium text-white shadow-sm hover:bg-indigo-700"><Plus className="h-4 w-4" />{NEW_LABEL[tab]}</button>
      </div>

      {tab === 'products' && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => {
            const empty = p.matched === 0;
            return (
              <Card key={p.id} className="flex flex-col">
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <IconTile icon={Package} className="bg-indigo-50 text-indigo-600" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold text-slate-900">{p.name}</div>
                      <div className="text-[12.5px] text-slate-500">{p.range}</div>
                    </div>
                    {STATUS[p.status]}
                  </div>
                  <div className="mt-4 grid grid-cols-[1fr_1fr_1.3fr] gap-2">
                    <div><div className="text-[11.5px] text-slate-500">Rate</div><div className="text-[14px] font-semibold text-slate-900">{p.rate}</div></div>
                    <div><div className="text-[11.5px] text-slate-500">Tenor</div><div className="text-[14px] font-semibold text-slate-900">{p.tenor}</div></div>
                    <div><div className="text-[11.5px] text-slate-500">Min Tier</div><TierBadge tier={p.minTier} className="mt-0.5" /></div>
                  </div>
                </div>
                <div className="border-t border-slate-100 px-5 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Performance Funnel</div>
                  <div className="mt-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-slate-100">
                    {!empty && <>
                      <div className="bg-indigo-500" style={{ flex: 45 }} /><div className="bg-violet-500" style={{ flex: 25 }} />
                      <div className="bg-emerald-500" style={{ flex: 15 }} /><div className="bg-amber-500" style={{ flex: 13 }} />
                      <div className="bg-rose-500" style={{ flex: 1 + p.defaulted / 4 }} />
                    </>}
                  </div>
                  <div className="mt-2 flex justify-between text-[12px]">
                    <span className="text-slate-500">{p.matched} matched</span><span className="text-slate-500">{p.accepted} accepted</span><span className="text-rose-500">{p.defaulted} defaulted</span>
                  </div>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-3 border-t border-slate-100 p-4">
                  <button onClick={() => notify(`Editing ${p.name}`)} className="h-9 rounded-lg border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700">Edit</button>
                  <button onClick={() => { setProducts([...products, { ...p, id: p.id + Date.now(), name: `${p.name} (copy)`, status: 'Draft', matched: 0, accepted: 0, defaulted: 0 }]); notify(`${p.name} duplicated as a draft`); }} className="h-9 rounded-lg border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50">Duplicate</button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'rules' && (
        <div className="space-y-3">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-slate-600" />
                <span className="text-[15px] font-semibold text-slate-900">Active Policy: v4.2</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2 py-0.5 text-[11.5px] font-medium text-indigo-700"><span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />Published</span>
              </div>
              <div className="text-[12.5px] text-slate-500">Manual-review floor: <strong className="text-orange-500">30%</strong> · Auto-decision ceiling: <strong className="text-indigo-600">70%</strong></div>
            </div>
            <p className="mt-3 text-[13px] text-slate-500">Rules are evaluated in order. First match wins. Three possible outcomes per rule set: Auto-Approve, Auto-Decline, Refer to Manual Review.</p>
          </Card>
          {RULES.map((r, i) => (
            <Card key={r.id} className="flex gap-4 p-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-[13px] font-semibold text-slate-600">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn('rounded-md border px-2 py-0.5 text-[11.5px] font-medium', OUTCOME[r.outcome])}>{r.outcome}</span>
                  <span className="text-[12px] text-slate-500">Rule {r.id}</span>
                </div>
                <div className="thin-scroll mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-[12.5px] text-slate-700">{r.expr}</div>
              </div>
              <button className="h-fit rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`Edit rule ${r.id}`} onClick={() => notify(`Rule ${r.id} opens in the rule builder`)}><SlidersHorizontal className="h-4 w-4" /></button>
            </Card>
          ))}
          <button onClick={() => notify('Rule builder opens in the full product')} className="flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 px-6 py-8 text-center hover:border-indigo-200">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Plus className="h-5 w-5" /></span>
            <span className="mt-3 text-[14px] font-semibold text-slate-900">Add a new rule</span>
            <span className="mt-1 max-w-sm text-[12.5px] text-slate-500">Visual rule builder — condition rows (field · operator · value) joined by AND/OR, grouped, with three possible outcomes</span>
          </button>
        </div>
      )}

      {tab === 'segments' && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {SEGMENTS.map((s) => (
            <Card key={s.name} className="p-5">
              <div className="flex items-start gap-3">
                <IconTile icon={Users} className="bg-violet-50 text-violet-600" />
                <div className="flex-1"><div className="text-[14.5px] font-semibold text-slate-900">{s.name}</div><div className="text-[12.5px] text-slate-500">{s.customers} customers</div></div>
                <div className="text-[20px] font-semibold text-slate-900">{s.pct}%</div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${(s.pct / 38) * 100}%` }} /></div>
              <div className="mt-3 text-[12px] text-slate-500">Inferred from MoBI360 + narration-enrichment signals</div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'versions' && (
        <Card className="p-5">
          <div className="text-[15px] font-semibold text-slate-900">Policy Version History</div>
          <div className="text-[13px] text-slate-500">Every edit creates a new version — past decisions permanently reference the active version</div>
          <ol className="mt-5">
            {VERSIONS.map((v, i) => (
              <li key={v.v} className="relative flex gap-4 pb-6 last:pb-0">
                {i < VERSIONS.length - 1 && <span className="absolute left-[15px] top-9 h-[calc(100%-28px)] w-px bg-slate-200" />}
                <span className={cn('relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full', v.status === 'Published' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500')}>
                  {v.status === 'Published' ? <Check className="h-4 w-4" /> : <History className="h-4 w-4" />}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14.5px] font-semibold text-slate-900">{v.v}</span>
                    {v.status === 'Published'
                      ? <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2 py-0.5 text-[11.5px] font-medium text-indigo-700"><span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />Published</span>
                      : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11.5px] text-slate-500">⊘ Archived</span>}
                  </div>
                  <div className="mt-0.5 text-[13px] text-slate-600">{v.note}</div>
                  <div className="text-[12px] text-slate-400">{v.by}</div>
                  {v.status !== 'Published' && <button onClick={() => notify(`Comparing ${v.v} with v4.2`)} className="mt-2 text-[12.5px] font-medium text-indigo-600 hover:underline">Compare & Roll back</button>}
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}
