import { useState } from 'react';
import { UserPlus, ShieldAlert, Clock, X, Check, History, Loader2, AlertCircle, Mail, Trash2, RotateCcw } from 'lucide-react';
import { Card, CardHeader, PillTabs, Avatar, cn } from '../components/ui.jsx';
import { ROLE_STYLE } from '../data/core.js';
import { useData } from '../data/DataContext.jsx';
import { useApp } from '../router.jsx';
import { team } from '../api/resources.js';
import { useSession } from '../api/auth.js';
import { useApi, describeError } from '../api/useApi.js';
import { LIVE } from '../config.js';

const INVITE_ROLES = [
  ['credit_analyst', 'Credit Analyst'],
  ['credit_ops', 'Credit Ops'],
  ['compliance_officer', 'Compliance Officer'],
  ['developer', 'Developer'],
  ['viewer', 'Viewer'],
  ['admin', 'Admin'],
];

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function Users() {
  const { USERS, APPROVALS, AUDIT } = useData();
  const { notify } = useApp();
  const { user } = useSession();
  const [tab, setTab] = useState('team');
  const [approvals, setApprovals] = useState(APPROVALS);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('credit_analyst');
  const [inviting, setInviting] = useState(false);
  const live = useApi(() => team.members(), [], { enabled: LIVE });
  const canManageTeam = user?.member_role === 'admin';
  const liveInvites = useApi(() => team.invites(), [], { enabled: LIVE && canManageTeam });

  // Live rows keep the same shape the table already renders.
  const rows = LIVE && live.data
    ? live.data.map((m) => ({
        name: m.full_name,
        email: m.email,
        role: m.role_label,
        status: 'Active',
        last: m.is_you ? 'You' : `Joined ${fmtDate(m.joined_at)}`,
      }))
    : USERS;

  const decide = (a, ok) => {
    if (ok && a.meta.includes('Requested by You')) return notify('Four-eyes rule: you made this request, so another checker must approve it');
    setApprovals(approvals.filter((x) => x.id !== a.id));
    notify(`${a.title} ${ok ? 'approved' : 'rejected'}`);
  };

  const openInvite = () => {
    if (!LIVE) return notify('Invite sent for approval (admin invites need a checker)');
    if (!canManageTeam) return notify('Only organisation admins can invite team members');
    setTab('team');
    setInviteOpen((open) => !open);
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email) return;
    setInviting(true);
    try {
      await team.invite(email, inviteRole);
      setInviteEmail('');
      setInviteRole('credit_analyst');
      setInviteOpen(false);
      liveInvites.refetch();
      notify(`Invite sent to ${email}`);
    } catch (err) {
      notify(describeError(err));
    } finally {
      setInviting(false);
    }
  };

  const resendInvite = async (inv) => {
    try {
      await team.resendInvite(inv.id);
      liveInvites.refetch();
      notify(`Invite resent to ${inv.email}`);
    } catch (err) {
      notify(describeError(err));
    }
  };

  const revokeInvite = async (inv) => {
    try {
      await team.revokeInvite(inv.id);
      liveInvites.refetch();
      notify(`Invite revoked for ${inv.email}`);
    } catch (err) {
      notify(describeError(err));
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PillTabs value={tab} onChange={setTab} tabs={[{ key: 'team', label: 'Team' }, { key: 'approvals', label: 'Pending Approvals', badge: approvals.length || null }, { key: 'audit', label: 'Audit Log' }]} />
        <button onClick={openInvite} disabled={LIVE && !canManageTeam} title={LIVE && !canManageTeam ? 'Only organisation admins can invite team members' : undefined} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-[13px] font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-50 disabled:text-indigo-300"><UserPlus className="h-4 w-4" />Invite Member</button>
      </div>

      {tab === 'team' && LIVE && inviteOpen && (
        <Card className="p-5">
          <CardHeader title="Invite a team member" sub="They receive an email invite. Inviting an Admin needs Live (level 2) and a second approver." />
          <form onSubmit={sendInvite} className="mt-4 flex flex-wrap items-end gap-3">
            <label htmlFor="invite-email" className="block min-w-[220px] flex-1">
              <span className="text-[13px] font-medium text-slate-900">Work email</span>
              <input
                id="invite-email"
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="name@company.com"
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13.5px] focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
              />
            </label>
            <label htmlFor="invite-role" className="block">
              <span className="text-[13px] font-medium text-slate-900">Role</span>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13.5px] focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
              >
                {INVITE_ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <button type="submit" disabled={inviting || !inviteEmail.trim()} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-[13.5px] font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}Send invite
            </button>
            <button type="button" onClick={() => setInviteOpen(false)} className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-4 text-[13.5px] font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          </form>
        </Card>
      )}

      {tab === 'team' && LIVE && live.loading && (
        <Card className="flex items-center gap-3 p-6 text-[13px] text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />Loading team members…
        </Card>
      )}
      {tab === 'team' && LIVE && live.error && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-[13px] text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{describeError(live.error)}</span>
        </div>
      )}

      {tab === 'team' && (
        <Card className="thin-scroll overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead><tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wider text-slate-500">{['Member', 'Role', 'Status', 'Last Active'].map((h) => <th key={h} className="px-5 py-3.5 font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((u) => (
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

      {tab === 'team' && LIVE && canManageTeam && (
        <Card className="overflow-hidden">
          <div className="p-5">
            <CardHeader
              title="Pending Invites"
              sub="Waiting and expired invites — expired ones can be resent"
              right={<button onClick={() => liveInvites.refetch()} className="text-[12.5px] font-medium text-indigo-600 hover:underline">Refresh</button>}
            />
          </div>
          {liveInvites.loading && <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-4 text-[13px] text-slate-500"><Loader2 className="h-4 w-4 animate-spin text-indigo-500" />Loading invites…</div>}
          {liveInvites.error && <div className="flex items-start gap-2 border-t border-slate-100 px-5 py-4 text-[13px] text-amber-800"><AlertCircle className="mt-0.5 h-4 w-4" />{describeError(liveInvites.error)}</div>}
          {liveInvites.data && !liveInvites.data.length && <div className="border-t border-slate-100 px-5 py-6 text-center text-[13px] text-slate-500">No invites waiting.</div>}
          {liveInvites.data?.map((inv) => (
            <div key={inv.id} className="flex flex-wrap items-center gap-4 border-t border-slate-100 px-5 py-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600"><Mail className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13.5px] font-medium text-slate-900">{inv.email}</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', inv.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600')}>{inv.status}</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-medium text-slate-600">{inv.role_label}</span>
                </div>
                <div className="text-[12px] text-slate-500">
                  Sent {fmtDate(inv.sent_at)} · Expires {fmtDate(inv.expires_at)}
                  {inv.invited_by_name ? ` · by ${inv.invited_by_name}` : ''}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => resendInvite(inv)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"><RotateCcw className="h-3.5 w-3.5" />Resend</button>
                <button onClick={() => revokeInvite(inv)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-200 px-2.5 text-[12.5px] font-medium text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" />Revoke</button>
              </div>
            </div>
          ))}
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
