import { useEffect, useState } from 'react';
import { Building2, CreditCard, Bell, Plug, Database, Save, Loader2, AlertCircle, Info } from 'lucide-react';
import { Card, CardHeader, Switch, IconTile, cn } from '../components/ui.jsx';
import { NOTIFICATIONS } from '../data/core.js';
import { useData } from '../data/DataContext.jsx';
import { useApp } from '../router.jsx';
import { kyb } from '../api/resources.js';
import { billing } from '../api/billing.js';
import { useSession } from '../api/auth.js';
import { useApi, describeError } from '../api/useApi.js';
import { LIVE } from '../config.js';

const SECTIONS = [
  ['profile', 'Company Profile', Building2], ['billing', 'Billing & Plan', CreditCard], ['notifs', 'Notification Preferences', Bell],
  ['integrations', 'Connected Integrations', Plug], ['data', 'Data Export / Deletion', Database],
];

// Fields the API accepts directly. Legal identity fields go through a change
// request, so they are shown read-only rather than pretending to be editable.
const EDITABLE = [
  ['display_name', 'Organization Name'],
  ['website', 'Website'],
  ['support_phone', 'Support Phone'],
];
const READONLY = [
  ['legal_name', 'Legal Name'],
  ['rc_number', 'CAC Number'],
  ['institution_label', 'Institution Type'],
  ['registered_address', 'Registered Address'],
];

function NotWired({ title, reason }) {
  return (
    <Card className="h-fit p-6">
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

export default function Settings() {
  const { INTEGRATIONS, BILLING, ORG } = useData();
  const { notify } = useApp();
  const { user } = useSession();
  const [sec, setSec] = useState('profile');
  const [notifs, setNotifs] = useState(NOTIFICATIONS.map((n) => n.on));
  const [profile, setProfile] = useState(ORG);
  const [saving, setSaving] = useState(false);

  const org = useApi(() => kyb.current(), [], { enabled: LIVE });
  const tenantId = user?.tenant_id;
  const usage = useApi(() => billing.usage(tenantId), [tenantId], { enabled: LIVE && sec === 'billing' && Boolean(tenantId) });
  const invoices = useApi(() => billing.invoices(tenantId), [tenantId], { enabled: LIVE && sec === 'billing' && Boolean(tenantId) });

  // Mirror the live organisation into the local form state once it loads.
  useEffect(() => {
    if (LIVE && org.data) setProfile(org.data);
  }, [LIVE, org.data]);

  const save = async (e) => {
    e.preventDefault();
    if (!LIVE) return notify('Company profile saved');
    setSaving(true);
    try {
      await kyb.update({
        display_name: profile.display_name,
        website: profile.website || null,
        support_phone: profile.support_phone || null,
      });
      org.refetch();
      notify('Company profile saved');
    } catch (err) {
      notify(describeError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
      <nav className="thin-scroll flex gap-1 overflow-x-auto lg:flex-col">
        {SECTIONS.map(([k, l, Icon]) => (
          <button key={k} onClick={() => setSec(k)} className={cn('inline-flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-[13.5px] font-medium', sec === k ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100')}>
            <Icon className="h-4 w-4" />{l}
          </button>
        ))}
      </nav>

      {sec === 'profile' && LIVE && org.loading && (
        <Card className="flex items-center gap-3 p-6 text-[13px] text-slate-500"><Loader2 className="h-4 w-4 animate-spin text-indigo-500" />Loading organisation…</Card>
      )}
      {sec === 'profile' && LIVE && org.error && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-[13px] text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{describeError(org.error)}</span>
        </div>
      )}

      {sec === 'profile' && (!LIVE || (!org.loading && !org.error)) && (
        <Card className="p-6">
          <CardHeader title="Company Profile" sub={LIVE ? 'Live from GET /orgs/current — legal fields change via a review request' : "Your organization's public and regulatory details"} />
          <div className="mt-5 flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white"><Building2 className="h-6 w-6" /></span>
            <div>
              <div className="text-[15px] font-semibold text-slate-900">{profile.display_name || profile.org || 'Unnamed organisation'}</div>
              <div className="text-[13px] text-slate-500">{profile.institution_label || profile.type || 'Institution type not set'}</div>
            </div>
          </div>
          <form onSubmit={save}>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {EDITABLE.map(([k, l]) => (
                <label key={k} htmlFor={'s-' + k} className="block">
                  <span className="text-[13px] font-medium text-slate-900">{l}</span>
                  <input id={'s-' + k} value={profile[k] ?? ''} onChange={(e) => setProfile({ ...profile, [k]: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13.5px] focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10" />
                </label>
              ))}
              {LIVE && READONLY.map(([k, l]) => (
                <label key={k} htmlFor={'s-' + k} className="block">
                  <span className="text-[13px] font-medium text-slate-900">{l}</span>
                  <input id={'s-' + k} value={profile[k] ?? '—'} readOnly disabled
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 text-[13.5px] text-slate-500" />
                </label>
              ))}
              {!LIVE && [['cac', 'CAC Number'], ['cbn', 'CBN License Number'], ['ndpa', 'NDPA Filing Reference']].map(([k, l]) => (
                <label key={k} htmlFor={'s-' + k} className="block">
                  <span className="text-[13px] font-medium text-slate-900">{l}</span>
                  <input id={'s-' + k} value={profile[k] ?? ''} onChange={(e) => setProfile({ ...profile, [k]: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13.5px] focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10" />
                </label>
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              <button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-[13.5px] font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save Changes
              </button>
            </div>
          </form>
        </Card>
      )}

      {sec === 'billing' && (LIVE
        ? (
          <div className="space-y-5">
            {!tenantId && (
              <NotWired title="No tenant on this account" reason="Billing is scoped to a lender organisation, and this account has none yet. Create one under Compliance → KYB." />
            )}

            {tenantId && (
              <Card className="p-6">
                <CardHeader
                  title="Usage"
                  sub="Live from GET /billing/usage — requests recorded this period"
                  right={<span className="text-[12px] font-medium text-slate-500">{org.data ? `Level ${org.data.access_level} · ${org.data.access_label}` : ''}</span>}
                />
                {usage.loading && <div className="mt-4 flex items-center gap-2 text-[13px] text-slate-500"><Loader2 className="h-4 w-4 animate-spin text-indigo-500" />Loading usage…</div>}
                {usage.error && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-[13px] text-amber-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      <strong className="font-semibold">Usage could not be loaded.</strong>{' '}
                      {!usage.error.status
                        ? 'The browser could not read an API error: the backend returns this 500 without CORS headers, so it surfaces as a network failure. This is the known billing-usage bug (usage_records.created_at is stored without a timezone while the query passes an aware UTC timestamp). Invoices below still load.'
                        : usage.error.status >= 500
                          ? 'This is a backend bug in the usage date query (usage_records.created_at is stored without a timezone while the query passes an aware UTC timestamp). Invoices below still load.'
                          : describeError(usage.error)}
                    </span>
                  </div>
                )}
                {usage.data && (
                  <div className="mt-5">
                    <div className="flex flex-wrap items-end gap-6">
                      <div>
                        <div className="text-[12px] text-slate-500">Total requests</div>
                        <div className="mt-1 text-[26px] font-semibold leading-none text-slate-900 num">{usage.data.total_requests}</div>
                      </div>
                      <div>
                        <div className="text-[12px] text-slate-500">Period</div>
                        <div className="mt-1 font-mono text-[14px] text-slate-900">{usage.data.period}</div>
                      </div>
                    </div>
                    {Object.keys(usage.data.breakdown || {}).length > 0 && (
                      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                        {Object.entries(usage.data.breakdown).map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 text-[13px] last:border-0">
                            <span className="font-mono text-slate-600">{type}</span>
                            <span className="font-semibold text-slate-900 num">{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )}

            {tenantId && (
              <Card className="overflow-hidden">
                <div className="p-6">
                  <CardHeader title="Invoices" sub="Live from GET /billing/invoices — issued per billing period" />
                </div>
                {invoices.loading && <div className="flex items-center gap-2 border-t border-slate-100 px-6 py-4 text-[13px] text-slate-500"><Loader2 className="h-4 w-4 animate-spin text-indigo-500" />Loading invoices…</div>}
                {invoices.error && <div className="flex items-start gap-2 border-t border-slate-100 px-6 py-4 text-[13px] text-amber-800"><AlertCircle className="mt-0.5 h-4 w-4" />{describeError(invoices.error)}</div>}
                {invoices.data && !invoices.data.length && <div className="border-t border-slate-100 px-6 py-8 text-center text-[13px] text-slate-500">No invoices yet — they are issued at the end of a billing period.</div>}
                {invoices.data?.map((inv) => (
                  <div key={inv.id} className="flex flex-wrap items-center gap-4 border-t border-slate-100 px-6 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[12.5px] text-slate-900">{inv.id}</div>
                      <div className="text-[12px] text-slate-500">{inv.period_start} → {inv.period_end}</div>
                    </div>
                    <div className="text-right text-[12px] text-slate-500">
                      <div>{inv.total_usage} requests</div>
                      <div className="font-semibold text-slate-900">{Number(inv.total_amount).toLocaleString()}</div>
                    </div>
                    <span className={cn('rounded-full px-2 py-0.5 text-[11.5px] font-medium', inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>{inv.status}</span>
                  </div>
                ))}
              </Card>
            )}

            <p className="text-[11.5px] text-slate-400">
              Billing calls use this browser&apos;s session API key (same key as scoring), not the console login token. The key lives in sessionStorage and is revocable from API &amp; Docs → API Keys.
            </p>
          </div>
        )
        : (
          <Card className="h-fit p-6">
            <CardHeader title="Billing & Plan" sub="Manage your subscription and usage" />
            <div className="mt-5 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/60 to-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[11px] font-semibold text-white">Growth Plan</span>
                  <div className="mt-2 text-[24px] font-semibold text-slate-900">₦450,000<span className="text-[13px] font-normal text-slate-500">/mo</span></div>
                </div>
                <button onClick={() => notify('Plan options: Growth, Scale, Enterprise')} className="h-9 rounded-lg border border-indigo-200 px-3 text-[13px] font-medium text-indigo-700 hover:bg-indigo-50">Upgrade</button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[['Checks this month', BILLING.checks], ['Integration credits', BILLING.credits], ['Next renewal', BILLING.renewal]].map(([k, v]) => <div key={k}><div className="text-[12px] text-slate-500">{k}</div><div className="text-[15px] font-semibold text-slate-900">{v}</div></div>)}
              </div>
            </div>
          </Card>
        ))}

      {sec === 'notifs' && (
        <Card className="h-fit p-6">
          <CardHeader title="Notification Preferences" sub={LIVE ? 'Sample preferences — no endpoint stores these yet' : 'Choose what you want to be notified about'} />
          <div className="mt-3">
            {NOTIFICATIONS.map((n, i) => (
              <div key={n.title} className="flex items-center gap-4 border-b border-slate-100 py-3.5 last:border-0">
                <div className="flex-1"><div className="text-[13.5px] font-medium text-slate-900">{n.title}</div><div className="text-[12px] text-slate-500">{n.sub}</div></div>
                <Switch checked={notifs[i]} label={n.title} onChange={(v) => setNotifs(notifs.map((x, j) => (j === i ? v : x)))} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {sec === 'integrations' && (
        <Card className="h-fit p-6">
          <CardHeader title="Connected Integrations" sub={LIVE ? 'Sample data — upstream connector status is not exposed by the API' : 'Upstream data sources and connectors'} />
          <div className="mt-3">
            {INTEGRATIONS.map((g) => (
              <div key={g.name} className="flex items-center gap-3 border-b border-slate-100 py-3.5 last:border-0">
                <IconTile icon={Plug} size="sm" className={g.status === 'Connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} />
                <span className="flex-1 text-[13.5px] font-medium text-slate-900">{g.name}</span>
                <span className={cn('rounded-full px-2 py-0.5 text-[11.5px] font-medium', g.status === 'Connected' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>{g.status}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {sec === 'data' && (
        <Card className="h-fit p-6">
          <CardHeader title="Data Export / Deletion" sub={LIVE ? 'Not available — no export or deletion endpoint exists yet' : "Export or permanently delete your organization's data"} />
          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-4">
              <Database className="h-5 w-5 text-indigo-500" />
              <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium text-slate-900">Export All Data</div><div className="text-[12px] text-slate-500">Download all checks, loans, policies, and audit logs as JSON</div></div>
              <button disabled={LIVE} onClick={() => notify('Full export queued — you will get a signed link by email')} className="h-9 rounded-lg border border-slate-200 px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40">Export</button>
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-200 bg-rose-50/40 p-4">
              <Database className="h-5 w-5 text-rose-500" />
              <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium text-rose-600">Delete Organization Data</div><div className="text-[12px] text-slate-500">Permanently delete all data. This action cannot be undone and requires maker-checker approval.</div></div>
              <button disabled={LIVE} onClick={() => notify('Deletion request sent to a second admin for approval')} className="h-9 rounded-lg border border-rose-200 bg-white px-3 text-[13px] font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-40">Request Deletion</button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
