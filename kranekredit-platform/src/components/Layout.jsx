import { useState } from 'react';
import {
  LayoutGrid, FileCheck2, SlidersHorizontal, KanbanSquare, CreditCard, Code2, Users, ShieldCheck, Settings2,
  ChevronRight, Sparkles, Search, Bell, Plus, Menu, X, Shuffle,
} from 'lucide-react';
import { useData } from '../data/DataContext.jsx';
import { useApp } from '../router.jsx';
import { cn } from './ui.jsx';

const NAV = [
  { group: 'Overview', items: [{ to: '/', label: 'Dashboard', icon: LayoutGrid }] },
  { group: 'Credit Intelligence', items: [
    { to: '/checks', label: 'Checks', icon: FileCheck2 },
    { to: '/decision-engine', label: 'Decision Engine', icon: SlidersHorizontal },
  ] },
  { group: 'Lending', items: [
    { to: '/loan-queue', label: 'Loan Queue', icon: KanbanSquare },
    { to: '/servicing', label: 'Servicing & Collections', icon: CreditCard },
  ] },
  { group: 'Platform', items: [
    { to: '/api', label: 'API & Documentation', icon: Code2 },
    { to: '/users', label: 'User Management', icon: Users },
    { to: '/compliance', label: 'Compliance & Audit', icon: ShieldCheck },
    { to: '/settings', label: 'Settings', icon: Settings2 },
  ] },
];

export const PAGE_META = {
  '/': ['Dashboard', 'Portfolio performance and operational analytics'],
  '/checks': ['Checks', 'Credit assessments and KRK reports'],
  '/checks/new': ['New Check', 'Initiate a credit assessment'],
  detail: ['Check Detail', 'KRK Signal report'],
  '/decision-engine': ['Decision Engine', 'Policy rules, loan products, and segments'],
  '/loan-queue': ['Loan Queue', 'Origination pipeline and offers'],
  '/servicing': ['Servicing & Collections', 'Repayment tracking and delinquency management'],
  '/api': ['API & Documentation', 'Keys, connections, webhooks, and logs'],
  '/users': ['User Management', 'Roles, permissions, and maker-checker approvals'],
  '/compliance': ['Compliance & Audit', 'KYB, data lineage, retention, and exports'],
  '/settings': ['Settings', 'Company profile, environment, and notifications'],
};

function Sidebar({ open, onClose }) {
  const { path, navigate } = useApp();
  const isActive = (to) => (to === '/' ? path === '/' : path === to || path.startsWith(to + '/'));
  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-sidebar text-sidebar-fg transition-transform lg:translate-x-0',
        open ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
      )}
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingLeft: 'env(safe-area-inset-left, 0px)' }}
    >
      <div className="flex items-center gap-3 px-5 pb-4 pt-5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-900/40">
          <Sparkles className="h-5 w-5 text-white" />
        </span>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold text-white">KraneKredit</div>
          <div className="text-[10.5px] font-medium uppercase tracking-wider text-slate-400">Intelligence Suite</div>
        </div>
        <button className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-white/5 lg:hidden" onClick={onClose} aria-label="Close navigation">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mx-4 rounded-xl border border-white/10 bg-sidebar-surface px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">Access Tier</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10.5px] font-semibold text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />Tier 2 — Live
          </span>
        </div>
        <p className="mt-1.5 text-[11.5px] leading-snug text-slate-400">Restricted live access — manual-review floor enforced</p>
      </div>

      <nav className="mt-4 flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {NAV.map((g) => (
          <div key={g.group}>
            <div className="px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">{g.group}</div>
            <div className="space-y-0.5">
              {g.items.map((it) => {
                const active = isActive(it.to);
                const Icon = it.icon;
                return (
                  <a
                    key={it.to}
                    href="#"
                    aria-current={active ? 'page' : undefined}
                    onClick={(e) => { e.preventDefault(); navigate(it.to); onClose(); }}
                    className={cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all',
                      active ? 'bg-white/[0.06] text-white' : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200',
                    )}
                  >
                    <Icon className={cn('h-4 w-4', active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300')} />
                    <span className="flex-1">{it.label}</span>
                    {active && <ChevronRight className="h-3.5 w-3.5 text-slate-500" />}
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-3 border-t border-white/10 px-5 py-4" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 0px))' }}>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-[11px] font-semibold text-white">DK</span>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold text-white">Dammy Krane</div>
          <div className="text-[11.5px] text-slate-400">Org Admin · KraneTech</div>
        </div>
      </div>
    </aside>
  );
}

export default function Layout({ meta, children }) {
  const { navigate, notify } = useApp();
  const { regenerate } = useData();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  return (
    <div className="min-h-full">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="lg:pl-[260px]">
        <header
          className="sticky z-20 flex h-16 items-center gap-4 border-b border-border bg-card/80 backdrop-blur-md"
          style={{ top: 'env(safe-area-inset-top, 0px)', paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))', paddingRight: 'max(16px, env(safe-area-inset-right, 0px))' }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3 md:px-2">
            <button className="-ml-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-[17px] font-semibold leading-tight text-slate-900">{meta[0]}</h1>
              <p className="truncate text-[12.5px] text-slate-500">{meta[1]}</p>
            </div>
          </div>
          <label className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="global-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate('/checks'); }}
              placeholder="Search checks, loans, customers..."
              className="h-9 w-64 rounded-lg border border-input bg-background pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 xl:w-80"
            />
          </label>
          <button
            onClick={() => { regenerate(); notify('New dummy dataset generated'); }}
            title="Generate a new randomised dummy dataset"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[12.5px] font-medium text-slate-600 hover:bg-slate-50"
          >
            <Shuffle className="h-4 w-4" /><span className="hidden xl:inline">Regenerate data</span>
          </button>
          <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications">
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>
          <button
            onClick={() => navigate('/checks/new')}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-[13px] font-medium text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">New Check</span>
          </button>
        </header>
        <main
          id="kk-main"
          className="kk-fade mx-auto w-full max-w-[1400px] py-6 md:py-8"
          style={{ paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))', paddingRight: 'max(16px, env(safe-area-inset-right, 0px))' }}
        >
          <div className="md:px-2">{children}</div>
        </main>
      </div>
    </div>
  );
}
