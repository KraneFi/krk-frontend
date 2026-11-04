import { useState } from 'react';
import { Activity, KeyRound, Link2, Webhook, ScrollText, BookOpen, Plus, Copy, Check, X, AlertTriangle, RotateCcw, CheckCircle2, AlertCircle, Terminal, Server, Loader2, Info } from 'lucide-react';
import { Card, CardHeader, PillTabs, IconTile, cn } from '../components/ui.jsx';
import { useData } from '../data/DataContext.jsx';
import { useApp } from '../router.jsx';
import { tenant } from '../api/resources.js';
import { useApi, describeError } from '../api/useApi.js';
import { useSession } from '../api/auth.js';
import { LIVE, API_BASE } from '../config.js';

function CopyIcon({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button aria-label="Copy" className="text-slate-400 hover:text-slate-700" onClick={() => {
      navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1200); }).catch(() => {});
    }}>{done ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}</button>
  );
}

const fmt = (iso) => {
  if (!iso) return 'never';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const METHOD_TONE = {
  GET: 'bg-blue-50 text-blue-700',
  POST: 'bg-emerald-50 text-emerald-700',
  PATCH: 'bg-amber-50 text-amber-700',
  PUT: 'bg-amber-50 text-amber-700',
  DELETE: 'bg-rose-50 text-rose-600',
};

// Shown where a tab needs something the browser is not allowed to hold.
function NotWired({ title, reason }) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <IconTile icon={Info} className="bg-slate-100 text-slate-500" />
        <div>
          <div className="text-[14px] font-semibold text-slate-900">{title}</div>
          <div className="mt-1 max-w-2xl text-[13px] text-slate-500">{reason}</div>
        </div>
      </div>
    </Card>
  );
}

const OPENAPI_URL = `${API_BASE}/openapi.json`;

export default function ApiDocs() {
  const { UPSTREAM, API_KEYS, ITEMS, WEBHOOKS, DELIVERIES, REQUEST_LOG, RATE_USED } = useData();
  const { notify } = useApp();
  const { user } = useSession();
  const [tab, setTab] = useState('keys');
  const [freshKey, setFreshKey] = useState(null);
  const [creating, setCreating] = useState(false);

  const tenantId = user?.tenant_id;
  const keys = useApi(() => tenant.keys(tenantId), [tenantId], { enabled: LIVE && Boolean(tenantId) });
  const org = useApi(() => tenant.get(tenantId), [tenantId], { enabled: LIVE && Boolean(tenantId) });
  const spec = useApi(() => fetch(OPENAPI_URL).then((r) => { if (!r.ok) throw new Error(`openapi ${r.status}`); return r.json(); }), [], { enabled: LIVE && tab === 'docs' });

  const generate = async () => {
    setCreating(true);
    try {
      const created = await tenant.createKey(tenantId, `Console ${new Date().toISOString().slice(0, 10)}`, 'test');
      setFreshKey(created.raw_key);
      keys.refetch();
      notify('API key created — copy it now, it is shown once');
    } catch (err) {
      notify(describeError(err));
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (k) => {
    try {
      await tenant.revokeKey(tenantId, k.id);
      notify(`${k.label} revoked`);
      keys.refetch();
    } catch (err) {
      notify(describeError(err));
    }
  };

  const liveKeys = keys.data || [];
  const groups = spec.data
    ? Object.entries(spec.data.paths).reduce((acc, [path, ops]) => {
        for (const [method, op] of Object.entries(ops)) {
          const tag = (op.tags && op.tags[0]) || 'other';
          (acc[tag] ||= []).push({ method: method.toUpperCase(), path, summary: op.summary });
        }
        return acc;
      }, {})
    : {};

  const curlSample = `curl ${API_BASE}/api/v1/orgs/current \\
  -H "Authorization: Bearer $KRANE_TOKEN"

curl ${API_BASE}/api/v1/team/members \\
  -H "Authorization: Bearer $KRANE_TOKEN"`;

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
        <Card className="p-5">
          <CardHeader title="Rate Limit" icon={Activity} right={<span className="text-[12.5px] font-medium text-amber-600">{LIVE && org.data ? org.data.tier : 'Tier 2'}</span>} />
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-[26px] font-semibold text-slate-900">{LIVE && org.data ? '—' : RATE_USED}</span>
            <span className="text-[13px] text-slate-500">{LIVE ? 'not exposed by the API yet' : '/ 100 requests/min'}</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${LIVE ? 0 : RATE_USED}%` }} /></div>
        </Card>
        <Card className="p-5">
          <CardHeader title="Upstream Data Source Status" right={LIVE ? <span className="text-[11.5px] text-slate-400">sample data</span> : null} />
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
          <div className="p-5">
            <CardHeader title="API Keys" sub={LIVE ? 'Tenant keys — the raw value is shown once at creation' : 'Sandbox and live key pairs — scoped, rotatable, revocable'}
              right={<button onClick={generate} disabled={!LIVE || creating} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-[13px] font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Generate Key
              </button>} />
          </div>

          {freshKey && (
            <div className="mx-5 mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <div className="text-[12.5px] font-semibold text-emerald-800">Copy this key now — it will not be shown again</div>
              <div className="mt-1.5 flex items-center gap-2 font-mono text-[12.5px] text-emerald-900"><span className="break-all">{freshKey}</span><CopyIcon text={freshKey} /></div>
            </div>
          )}

          {LIVE && !tenantId && (
            <div className="px-5 pb-5"><NotWired title="No tenant on this account" reason="Your user has no tenant yet. Create an organisation first (Compliance → KYB)." /></div>
          )}
          {LIVE && keys.loading && (
            <div className="flex items-center gap-3 border-t border-slate-100 px-5 py-4 text-[13px] text-slate-500"><Loader2 className="h-4 w-4 animate-spin text-indigo-500" />Loading keys…</div>
          )}
          {LIVE && keys.error && (
            <div className="flex items-start gap-2 border-t border-slate-100 px-5 py-4 text-[13px] text-amber-800"><AlertCircle className="mt-0.5 h-4 w-4" />{describeError(keys.error)}</div>
          )}

          {LIVE && !keys.loading && !keys.error && !liveKeys.length && (
            <div className="border-t border-slate-100 px-5 py-8 text-center text-[13px] text-slate-500">No API keys yet — generate one to call the scoring API.</div>
          )}

          {LIVE && liveKeys.map((k) => (
            <div key={k.id} className="flex flex-wrap items-center gap-4 border-t border-slate-100 px-5 py-4">
              <IconTile icon={KeyRound} className={k.environment === 'live' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-medium text-slate-900">{k.label}</span>
                  <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase', k.environment === 'live' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600')}>{k.environment}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />{k.status}</span>
                </div>
                <div className="mt-1 font-mono text-[12px] text-slate-500">{k.key_prefix}••••••••••••</div>
              </div>
              <div className="text-right text-[11.5px] text-slate-500">
                <div>Created {fmt(k.created_at)}</div>
                <div>Last used {k.last_used_at ? fmt(k.last_used_at) : 'never'}</div>
              </div>
              <button onClick={() => revoke(k)} className="text-[12.5px] font-medium text-rose-600 hover:underline">Revoke</button>
            </div>
          ))}

          {!LIVE && API_KEYS.map((k) => (
            <div key={k.id} className="flex flex-wrap items-center gap-4 border-t border-slate-100 px-5 py-4">
              <IconTile icon={KeyRound} className={k.env === 'live' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-medium text-slate-900">{k.name}</span>
                  <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase', k.env === 'live' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600')}>{k.env}</span>
                </div>
                <div className="mt-1 flex items-center gap-2 font-mono text-[12px] text-slate-500">{k.key}••••••••••••<CopyIcon text={k.key} /></div>
              </div>
              <div className="text-right text-[11.5px] text-slate-500"><div>Created {k.created}</div><div>Last used {k.used}</div></div>
            </div>
          ))}
        </Card>
      )}

      {tab === 'items' && (
        LIVE
          ? <NotWired title="Connection Items are not backed by an endpoint" reason="The frontend models persistent bank connections (Plaid Item/Link), but the API has no items resource — bank data arrives through /bank-statements/upload instead. Kept out of the UI rather than faked." />
          : (
            <Card className="overflow-hidden">
              <div className="p-5"><CardHeader title="Connection Items" sub="Persistent bank connection objects (Plaid Item/Link pattern)" /></div>
              {ITEMS.map((it, i) => (
                <div key={i} className="flex flex-wrap items-center gap-4 border-t border-slate-100 px-5 py-4">
                  <IconTile icon={Link2} size="sm" className="h-9 w-9 bg-indigo-50 text-indigo-600" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[14px]"><span className="font-medium text-slate-900">{it.name}</span><span className="text-slate-400">·</span><span className="text-slate-500">{it.bank}</span></div>
                    <div className="text-[12px] text-slate-500">Created {it.created} · Last sync {it.sync}</div>
                  </div>
                </div>
              ))}
            </Card>
          )
      )}

      {tab === 'webhooks' && (
        LIVE
          ? <NotWired title="Webhooks require a tenant API key" reason="GET /webhooks/endpoints and the delivery history are guarded by X-API-Key, not by the user session. Exposing a tenant key in the browser is not acceptable, so this tab needs the thin BFF before it can be wired." />
          : (
            <div className="space-y-5">
              <Card className="overflow-hidden">
                <div className="p-5"><CardHeader title="Webhook Endpoints" sub="Signed (HMAC), versioned events, replayable deliveries" /></div>
                {WEBHOOKS.map((w) => (
                  <div key={w.url} className="flex flex-wrap items-start gap-3 border-t border-slate-100 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="break-all font-mono text-[13px] text-slate-900">{w.url}</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">{w.events.map((e) => <span key={e} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-600">{e}</span>)}</div>
                    </div>
                    <div className="flex items-center gap-3 text-[12px]">
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
                    <span className="text-[12px] text-slate-400">{d.ago}</span>
                  </div>
                ))}
              </Card>
            </div>
          )
      )}

      {tab === 'logs' && (
        LIVE
          ? <NotWired title="No request-log endpoint yet" reason="The console foundations migration added a request_logs table, but nothing exposes it over HTTP. This tab stays empty until that endpoint exists — the previous version showed invented requests." />
          : (
            <Card className="overflow-hidden">
              <div className="p-5"><CardHeader title="API Request Log" sub="Idempotency cache hits vs fresh processing" /></div>
              {REQUEST_LOG.map((l, i) => (
                <div key={i} className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-5 py-3">
                  <Terminal className="h-4 w-4 text-slate-500" />
                  <span className={cn('rounded px-1.5 py-0.5 font-mono text-[10.5px] font-semibold', METHOD_TONE[l.method])}>{l.method}</span>
                  <span className="flex-1 font-mono text-[13px] text-slate-800">{l.path}</span>
                  <span className="text-[12px] text-slate-500">{l.ms}</span>
                  <span className="text-[12px] text-slate-400">{l.ago}</span>
                </div>
              ))}
            </Card>
          )
      )}

      {tab === 'docs' && (
        <Card className="p-6">
          <div className="flex items-center gap-2 text-[16px] font-semibold text-slate-900"><BookOpen className="h-5 w-5 text-indigo-500" />Reference Documentation</div>
          <p className="mt-2 text-[13.5px] text-slate-500">
            {LIVE ? <>Generated from the running API&apos;s <span className="font-mono text-slate-600">/openapi.json</span>.</> : 'Live-editable examples pre-filled with your sandbox key'}
          </p>

          {LIVE && spec.loading && <div className="mt-4 flex items-center gap-2 text-[13px] text-slate-500"><Loader2 className="h-4 w-4 animate-spin text-indigo-500" />Loading the API specification…</div>}
          {LIVE && spec.error && <div className="mt-4 flex items-start gap-2 text-[13px] text-amber-800"><AlertCircle className="mt-0.5 h-4 w-4" />{describeError(spec.error)}</div>}

          {LIVE && spec.data && (
            <div className="thin-scroll mt-4 max-h-[520px] overflow-y-auto rounded-xl border border-slate-200">
              {Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([tag, ops]) => (
                <div key={tag}>
                  <div className="sticky top-0 border-b border-slate-100 bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{tag} <span className="ml-1 font-normal text-slate-400">({ops.length})</span></div>
                  {ops.map((op) => (
                    <div key={`${op.method} ${op.path}`} className="flex flex-wrap items-center gap-3 border-b border-slate-50 px-4 py-2 last:border-0">
                      <span className={cn('w-16 shrink-0 rounded px-1.5 py-0.5 text-center font-mono text-[10.5px] font-semibold', METHOD_TONE[op.method])}>{op.method}</span>
                      <span className="font-mono text-[12.5px] text-slate-800">{op.path}</span>
                      {op.summary && <span className="text-[12px] text-slate-400">{op.summary}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 overflow-hidden rounded-xl bg-slate-950">
            <div className="flex items-center gap-2 px-4 pt-3">
              <span className="h-3 w-3 rounded-full bg-rose-400" /><span className="h-3 w-3 rounded-full bg-amber-400" /><span className="h-3 w-3 rounded-full bg-emerald-400" />
              <span className="ml-2 text-[12px] text-slate-500">{LIVE ? 'Authenticated request' : 'Create a Check'}</span>
              <span className="ml-auto"><CopyIcon text={curlSample} /></span>
            </div>
            <pre className="thin-scroll overflow-x-auto px-4 py-4 font-mono text-[13px] leading-relaxed text-slate-200">{curlSample}</pre>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[[Server, 'API Reference'], [BookOpen, 'Guides'], [Webhook, 'Webhook Events']].map(([Icon, l]) => (
              <a key={l} href={`${API_BASE}/docs`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50"><Icon className="h-4 w-4" />{l}</a>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
