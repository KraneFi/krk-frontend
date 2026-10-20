import { useState } from 'react';
import { Building2, CreditCard, Bell, Plug, Database, Save } from 'lucide-react';
import { Card, CardHeader, Switch, IconTile, cn } from '../components/ui.jsx';
import { NOTIFICATIONS } from '../data/core.js';
import { useData } from '../data/DataContext.jsx';
import { useApp } from '../router.jsx';

const SECTIONS = [
  ['profile', 'Company Profile', Building2], ['billing', 'Billing & Plan', CreditCard], ['notifs', 'Notification Preferences', Bell],
  ['integrations', 'Connected Integrations', Plug], ['data', 'Data Export / Deletion', Database],
];

export default function Settings() {
  const { INTEGRATIONS, BILLING, ORG } = useData();
  const { notify } = useApp();
  const [sec, setSec] = useState('profile');
  const [notifs, setNotifs] = useState(NOTIFICATIONS.map((n) => n.on));
  const [profile, setProfile] = useState(ORG);

  return (
    <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
      <nav className="thin-scroll flex gap-1 overflow-x-auto lg:flex-col">
        {SECTIONS.map(([k, l, Icon]) => (
          <button key={k} onClick={() => setSec(k)} className={cn('inline-flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-[13.5px] font-medium', sec === k ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100')}>
            <Icon className="h-4 w-4" />{l}
          </button>
        ))}
      </nav>

      {sec === 'profile' && (
        <Card className="p-6">
          <CardHeader title="Company Profile" sub="Your organization's public and regulatory details" />
          <div className="mt-5 flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white"><Building2 className="h-6 w-6" /></span>
            <div><div className="text-[15px] font-semibold text-slate-900">KraneTech Lending</div><div className="text-[13px] text-slate-500">CBN-Licensed Digital Lender</div><button className="text-[12.5px] font-medium text-indigo-600 hover:underline">Change logo</button></div>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); notify('Company profile saved'); }}>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[['org', 'Organization Name'], ['type', 'Institution Type'], ['cac', 'CAC Number'], ['cbn', 'CBN License Number'], ['ndpa', 'NDPA Filing Reference'], ['email', 'Contact Email']].map(([k, l]) => (
                <label key={k} htmlFor={'s-' + k} className="block">
                  <span className="text-[13px] font-medium text-slate-900">{l}</span>
                  <input id={'s-' + k} value={profile[k]} onChange={(e) => setProfile({ ...profile, [k]: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13.5px] focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10" />
                </label>
              ))}
            </div>
            <div className="mt-5 flex justify-end"><button type="submit" className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-[13.5px] font-medium text-white hover:bg-indigo-700"><Save className="h-4 w-4" />Save Changes</button></div>
          </form>
        </Card>
      )}

      {sec === 'billing' && (
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
      )}

      {sec === 'notifs' && (
        <Card className="h-fit p-6">
          <CardHeader title="Notification Preferences" sub="Choose what you want to be notified about" />
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
          <CardHeader title="Connected Integrations" sub="Upstream data sources and connectors" />
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
          <CardHeader title="Data Export / Deletion" sub="Export or permanently delete your organization's data" />
          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-4">
              <Database className="h-5 w-5 text-indigo-500" />
              <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium text-slate-900">Export All Data</div><div className="text-[12px] text-slate-500">Download all checks, loans, policies, and audit logs as JSON</div></div>
              <button onClick={() => notify('Full export queued — you will get a signed link by email')} className="h-9 rounded-lg border border-slate-200 px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50">Export</button>
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-200 bg-rose-50/40 p-4">
              <Database className="h-5 w-5 text-rose-500" />
              <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium text-rose-600">Delete Organization Data</div><div className="text-[12px] text-slate-500">Permanently delete all data. This action cannot be undone and requires maker-checker approval.</div></div>
              <button onClick={() => notify('Deletion request sent to a second admin for approval')} className="h-9 rounded-lg border border-rose-200 bg-white px-3 text-[13px] font-medium text-rose-600 hover:bg-rose-50">Request Deletion</button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
