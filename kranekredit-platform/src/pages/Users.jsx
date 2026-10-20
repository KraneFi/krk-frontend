import { useState } from 'react';
import { UserPlus, ShieldAlert, Clock, X, Check, History } from 'lucide-react';
import { Card, CardHeader, PillTabs, Avatar, cn } from '../components/ui.jsx';
import { ROLE_STYLE } from '../data/core.js';
import { useData } from '../data/DataContext.jsx';
import { useApp } from '../router.jsx';

export default function Users() {
  const { USERS, APPROVALS, AUDIT } = useData();
  const { notify } = useApp();
  const [tab, setTab] = useState('team');
  const [approvals, setApprovals] = useState(APPROVALS);
  const decide = (a, ok) => {
    if (ok && a.meta.includes('Requested by You')) return notify('Four-eyes rule: you made this request, so another checker must approve it');
    setApprovals(approvals.filter((x) => x.id !== a.id));
    notify(`${a.title} ${ok ? 'approved' : 'rejected'}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PillTabs value={tab} onChange={setTab} tabs={[{ key: 'team', label: 'Team' }, { key: 'approvals', label: 'Pending Approvals', badge: approvals.length || null }, { key: 'audit', label: 'Audit Log' }]} />
        <button onClick={() => notify('Invite sent for approval (admin invites need a checker)')} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-[13px] font-medium text-white shadow-sm hover:bg-indigo-700"><UserPlus className="h-4 w-4" />Invite Member</button>
      </div>

      {tab === 'team' && (
        <Card className="thin-scroll overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead><tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wider text-slate-500">{['Member', 'Role', 'Status', 'Last Active'].map((h) => <th key={h} className="px-5 py-3.5 font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {USERS.map((u) => (
                <tr key={u.email} className="border-b border-slate-100 last:border-0">
                  <td className="px-5 py-3.5"><div className="flex items-center gap-3"><Avatar name={u.name} gradient /><div><div className="font-medium text-slate-900">{u.name}</div><div className="text-[12px] text-slate-500">{u.email}</div></div></div></td>
                  <td className="px-5 py-3.5"><span className={cn('rounded-full px-2 py-0.5 text-[11.5px] font-medium', ROLE_STYLE[u.role])}>{u.role}</span></td>
                  <td className="px-5 py-3.5">
                    {u.status === 'Active'
                      ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-medium text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />Active</span>
                      : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11.5px] font-medium text-slate-600">❚❚ Suspended</span>}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{u.last}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'approvals' && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-3.5 text-[13.5px] text-slate-700">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span><strong className="text-slate-900">Maker-checker (four-eyes) enforced.</strong> No single user can both create and approve a financial exposure. The maker cannot also be the checker on the same action.</span>
          </div>
          {approvals.map((a) => (
            <Card key={a.id} className="flex flex-wrap items-center gap-4 p-4">
              <span className={cn('grid h-10 w-10 place-items-center rounded-xl', a.urgent ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500')}><Clock className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-semibold tracking-wider text-slate-600">{a.type}</span>
                  {a.urgent && <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-rose-600">Urgent</span>}
                </div>
                <div className="mt-1 text-[14.5px] font-medium text-slate-900">{a.title}</div>
                <div className="text-[12px] text-slate-500">{a.meta}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => decide(a, false)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-[13px] font-medium text-slate-600 hover:bg-slate-50"><X className="h-4 w-4" />Reject</button>
                <button onClick={() => decide(a, true)} className="inline-flex h-9 items-center gap-1 rounded-lg bg-emerald-600 px-3 text-[13px] font-medium text-white hover:bg-emerald-700"><Check className="h-4 w-4" />Approve</button>
              </div>
            </Card>
          ))}
          {!approvals.length && <Card className="p-10 text-center text-[13px] text-slate-500">No pending approvals.</Card>}
        </div>
      )}

      {tab === 'audit' && (
        <Card className="p-5">
          <CardHeader title="Action Audit Log" sub="All team actions — backs Compliance & Audit exports" />
          <ol className="mt-5">
            {AUDIT.map((a, i) => (
              <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
                {i < AUDIT.length - 1 && <span className="absolute left-[11px] top-7 h-[calc(100%-22px)] w-px bg-slate-200" />}
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-500"><History className="h-3.5 w-3.5" /></span>
                <div className="min-w-0 flex-1"><div className="text-[13.5px] text-slate-700"><strong className="font-semibold text-slate-900">{a.who}</strong> {a.what}</div><div className="text-[12px] text-slate-500">{a.target}</div></div>
                <span className="whitespace-nowrap text-[12px] text-slate-400">{a.ago}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}
