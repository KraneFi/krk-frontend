import { useState } from 'react';
import { Activity, KeyRound, Link2, Webhook, ScrollText, BookOpen, Plus, Copy, Check, X, AlertTriangle, RotateCcw, CheckCircle2, AlertCircle, Terminal, Server } from 'lucide-react';
import { Card, CardHeader, PillTabs, IconTile, cn } from '../components/ui.jsx';
import { useData } from '../data/DataContext.jsx';
import { useApp } from '../router.jsx';

function CopyIcon({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button aria-label="Copy" className="text-slate-400 hover:text-slate-700" onClick={() => {
      navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1200); }).catch(() => {});
    }}>{done ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}</button>
  );
}

export default function ApiDocs() {
  const { UPSTREAM, API_KEYS, ITEMS, WEBHOOKS, DELIVERIES, REQUEST_LOG, CURL_SAMPLE, RATE_USED } = useData();
  const { notify } = useApp();
  const [tab, setTab] = useState('keys');
  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
        <Card className="p-5">
          <CardHeader title="Rate Limit" icon={Activity} right={<span className="text-[12.5px] font-medium text-amber-600">Tier 2</span>} />
          <div className="mt-3 flex items-baseline gap-1.5"><span className="text-[26px] font-semibold text-slate-900">{RATE_USED}</span><span className="text-[13px] text-slate-500">/ 100 requests/min</span></div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${RATE_USED}%` }} /></div>
        </Card>
        <Card className="p-5">
          <CardHeader title="Upstream Data Source Status" />
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {UPSTREAM.map((u) => (
              <div key={u.name} className="flex items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5">
                <span className={cn('h-2 w-2 shrink-0 rounded-full', u.ok ? 'bg-emerald-500' : 'bg-amber-500')} />
                <div><div className="text-[12.5px] font-medium text-slate-900">{u.name}</div><div className="text-[11px] text-slate-500">{u.meta}</div></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <PillTabs value={tab} onChange={setTab} tabs={[
        { key: 'keys', label: 'API Keys', icon: KeyRound }, { key: 'items', label: 'Connections (Items)', icon: Link2 },
        { key: 'webhooks', label: 'Webhooks', icon: Webhook }, { key: 'logs', label: 'Logs', icon: ScrollText }, { key: 'docs', label: 'Reference Docs', icon: BookOpen },
      ]} />

      {tab === 'keys' && (
        <Card className="overflow-hidden">
          <div className="p-5"><CardHeader title="API Keys" sub="Sandbox and live key pairs — scoped, rotatable, revocable" right={<button onClick={() => notify('New sandbox key generated')} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-[13px] font-medium text-white hover:bg-indigo-700"><Plus className="h-4 w-4" />Generate Key</button>} /></div>
          {API_KEYS.map((k) => (
            <div key={k.id} className="flex flex-wrap items-center gap-4 border-t border-slate-100 px-5 py-4">
              <IconTile icon={KeyRound} className={k.env === 'live' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-medium text-slate-900">{k.name}</span>
                  <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase', k.env === 'live' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600')}>{k.env}</span>
                  {k.status === 'Active'
                    ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />Active</span>
                    : <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-600"><X className="h-3 w-3" />Revoked</span>}
                </div>
                <div className="mt-1 flex items-center gap-2 font-mono text-[12px] text-slate-500">{k.key}••••••••••••<CopyIcon text={k.key} /></div>
              </div>
              <div className="text-right text-[11.5px] text-slate-500"><div>Created {k.created}</div><div>Last used {k.used}</div></div>
              <button onClick={() => notify(`${k.name} rotated`)} className="text-[12.5px] font-medium text-slate-600 hover:text-slate-900">Rotate</button>
            </div>
          ))}
        </Card>
      )}

      {tab === 'items' && (
        <Card className="overflow-hidden">
          <div className="p-5"><CardHeader title="Connection Items" sub="Persistent bank connection objects (Plaid Item/Link pattern) — no re-authentication per check" /></div>
          {ITEMS.map((it, i) => (
            <div key={i} className="flex flex-wrap items-center gap-4 border-t border-slate-100 px-5 py-4">
              <IconTile icon={Link2} size="sm" className="h-9 w-9 bg-indigo-50 text-indigo-600" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[14px]"><span className="font-medium text-slate-900">{it.name}</span><span className="text-slate-400">·</span><span className="text-slate-500">{it.bank}</span><span className="rounded-full bg-slate-100 px-1.5 text-[10.5px] text-slate-600">{it.accts} acct{it.accts > 1 ? 's' : ''}</span></div>
                <div className="text-[12px] text-slate-500">Created {it.created} · Last sync {it.sync}</div>
              </div>
              {it.status === 'Active' && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-medium text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />Active</span>}
              {it.status === 'Revoked' && <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11.5px] font-medium text-rose-600"><X className="h-3 w-3" />Revoked</span>}
              {it.status === 'Login Required' && <>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11.5px] font-medium text-amber-700"><AlertTriangle className="h-3 w-3" />Login Required</span>
                <button onClick={() => notify(`Re-auth link sent to ${it.name}`)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 text-[12px] font-medium text-amber-700"><RotateCcw className="h-3.5 w-3.5" />Re-auth</button>
              </>}
            </div>
          ))}
        </Card>
      )}

      {tab === 'webhooks' && (
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="p-5"><CardHeader title="Webhook Endpoints" sub="Signed (HMAC), versioned events, replayable deliveries" right={<button onClick={() => notify('Add endpoint')} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-[13px] font-medium text-white hover:bg-indigo-700"><Plus className="h-4 w-4" />Add Endpoint</button>} /></div>
            {WEBHOOKS.map((w) => (
              <div key={w.url} className="flex flex-wrap items-start gap-3 border-t border-slate-100 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="break-all font-mono text-[13px] text-slate-900">{w.url}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">{w.events.map((e) => <span key={e} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-600">{e}</span>)}</div>
                </div>
                <div className="flex items-center gap-3 text-[12px]">
                  {w.status === 'Active'
                    ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-medium text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />Active</span>
                    : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11.5px] font-medium text-slate-600">❚❚ Paused</span>}
                  <span className="text-slate-500">{w.deliveries} deliveries</span>
                  <span className={cn('font-medium', w.tone)}>{w.success} success</span>
                </div>
              </div>
            ))}
          </Card>
          <Card className="overflow-hidden">
            <div className="p-5"><CardHeader title="Recent Deliveries" sub="Per-attempt status with manual replay" /></div>
            {DELIVERIES.map((d, i) => (
              <div key={i} className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-5 py-3">
                {d.code < 300 ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-rose-500" />}
                <span className="flex-1 font-mono text-[12.5px] text-slate-600">{d.event}</span>
                <span className={cn('rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold', d.code < 300 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600')}>{d.code}</span>
                <span className="text-[12px] text-slate-500">{d.attempts} attempt{d.attempts > 1 ? 's' : ''}</span>
                {d.cache && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-600">idempotency cache</span>}
                <span className="text-[12px] text-slate-400">{d.ago}</span>
                <button onClick={() => notify(`${d.event} replayed`)} className="text-[12.5px] font-medium text-indigo-600 hover:underline">Replay</button>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === 'logs' && (
        <Card className="overflow-hidden">
          <div className="p-5"><CardHeader title="API Request Log" sub="Idempotency cache hits vs fresh processing" /></div>
          {REQUEST_LOG.map((l, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-5 py-3">
              <Terminal className="h-4 w-4 text-slate-500" />
              <span className={cn('rounded px-1.5 py-0.5 font-mono text-[10.5px] font-semibold', l.method === 'POST' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700')}>{l.method}</span>
              <span className="flex-1 font-mono text-[13px] text-slate-800">{l.path}</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-700">{l.code}</span>
              <span className="text-[12px] text-slate-500">{l.ms}</span>
              {l.idem && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] text-violet-600">idempotent</span>}
              <span className="text-[12px] text-slate-400">{l.ago}</span>
            </div>
          ))}
        </Card>
      )}

      {tab === 'docs' && (
        <Card className="p-6">
          <div className="flex items-center gap-2 text-[16px] font-semibold text-slate-900"><BookOpen className="h-5 w-5 text-indigo-500" />Reference Documentation</div>
          <p className="mt-3 text-[13.5px] text-slate-500">Live-editable examples pre-filled with your sandbox key</p>
          <div className="mt-4 overflow-hidden rounded-xl bg-slate-950">
            <div className="flex items-center gap-2 px-4 pt-3">
              <span className="h-3 w-3 rounded-full bg-rose-400" /><span className="h-3 w-3 rounded-full bg-amber-400" /><span className="h-3 w-3 rounded-full bg-emerald-400" />
              <span className="ml-2 text-[12px] text-slate-500">Create a Check</span>
              <span className="ml-auto"><CopyIcon text={CURL_SAMPLE} /></span>
            </div>
            <pre className="thin-scroll overflow-x-auto px-4 py-4 font-mono text-[13px] leading-relaxed text-slate-200">{CURL_SAMPLE}</pre>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[[Server, 'API Reference'], [BookOpen, 'Guides'], [Webhook, 'Webhook Events']].map(([Icon, l]) => (
              <button key={l} onClick={() => notify(`${l} opens in the developer portal`)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50"><Icon className="h-4 w-4" />{l}</button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
