import {
  FileCheck, CircleCheck, Gauge, Package, TrendingUp, ArrowDownLeft, Activity, Zap, ClipboardCheck, UserPlus,
  ArrowUpRight, ShieldAlert, FileText, ArrowDown,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Card, CardHeader, Pill, TierBadge, IconTile, cn, TIER_SOLID } from '../components/ui.jsx';
import { useData } from '../data/DataContext.jsx';
import { Link, useApp } from '../router.jsx';

const ICONS = { FileCheck, CircleCheck, Gauge, Package, ShieldAlert, Zap, FileText };

function Donut({ value }) {
  const r = 40, c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto h-[124px] w-[124px]">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#eef2ff" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="#6366f1" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(value / 100) * c} ${c}`} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-[22px] font-semibold leading-none text-slate-900">{value}%</div>
          <div className="mt-1 text-[10px] text-slate-500">Auto-decision</div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { navigate } = useApp();
  const { DASH_STATS, PAR_SERIES, PAR_NOW, PAR_IMPROVING, AUTO_RATE, POLICY_PERF, DECLINE_REASONS, TIER_DIST, ACTIVITY, DRIFT, REVIEW_COUNT } = useData();
  const tierMax = Math.max(40, ...TIER_DIST.map((t) => Math.max(t.raw, t.post)));
  const declineMax = Math.max(10, ...DECLINE_REASONS.map((d) => d.value)) + 4;
  const parMax = Math.max(8, Math.ceil(Math.max(...PAR_SERIES.map((p) => p.par30)) / 2) * 2 + 2);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {DASH_STATS.map((s) => {
          const Icon = ICONS[s.icon];
          return (
            <Card key={s.label} className="p-5">
              <div className="flex items-start justify-between">
                <IconTile icon={Icon} className="bg-indigo-50 text-indigo-600" />
                <span className={cn('inline-flex items-center gap-1 text-[12px] font-medium', s.flat ? 'text-slate-400' : 'text-emerald-600')}>
                  {!s.flat && <TrendingUp className="h-3.5 w-3.5" />}{s.trend}
                </span>
              </div>
              <div className="mt-4 text-[26px] font-semibold leading-none tracking-tight text-slate-900 num">{s.value}</div>
              <div className="mt-1.5 text-[13px] text-slate-500">{s.label}</div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <div className="p-5">
            <CardHeader title="Portfolio at Risk" sub="Outstanding principal on overdue loans ÷ total outstanding" right={<span className="text-[12px] font-medium text-slate-500">Last 7 months</span>} />
            <div className="mt-4 h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={PAR_SERIES} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    {[['g30', '#6366f1'], ['g60', '#f59e0b'], ['g90', '#f43f5e']].map(([id, c]) => (
                      <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c} stopOpacity={0.12} />
                        <stop offset="100%" stopColor={c} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, parMax]} ticks={Array.from({ length: parMax / 2 + 1 }, (_, i) => i * 2)} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v, n) => [`${v}%`, n.toUpperCase()]} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Area type="monotone" dataKey="par30" stroke="#6366f1" strokeWidth={2} fill="url(#g30)" />
                  <Area type="monotone" dataKey="par60" stroke="#f59e0b" strokeWidth={2} fill="url(#g60)" />
                  <Area type="monotone" dataKey="par90" stroke="#f43f5e" strokeWidth={2} fill="url(#g90)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 px-5 py-4 text-[13px]">
            {[['PAR30', `${PAR_NOW.par30}%`, 'bg-indigo-500'], ['PAR60', `${PAR_NOW.par60}%`, 'bg-amber-500'], ['PAR90', `${PAR_NOW.par90}%`, 'bg-rose-500']].map(([k, v, c]) => (
              <span key={k} className="inline-flex items-center gap-2 text-slate-500">
                <span className={cn('h-2 w-2 rounded-full', c)} />{k}<strong className="font-semibold text-slate-900">{v}</strong>
              </span>
            ))}
            {PAR_IMPROVING
              ? <span className="ml-auto inline-flex items-center gap-1.5 text-[13px] font-medium text-emerald-600"><ArrowDownLeft className="h-4 w-4" />Improving vs 90-day avg</span>
              : <span className="ml-auto inline-flex items-center gap-1.5 text-[13px] font-medium text-rose-600"><ArrowUpRight className="h-4 w-4" />Deteriorating vs 90-day avg</span>}
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader title="Policy Performance" sub="Decision engine outcomes" />
          <div className="my-6"><Donut value={AUTO_RATE} /></div>
          <div className="space-y-3">
            {POLICY_PERF.map((p) => (
              <div key={p.label} className="flex items-center gap-3 text-[13px]">
                <span className={cn('h-2 w-2 rounded-full', p.color)} />
                <span className="flex-1 text-slate-600">{p.label}</span>
                <span className="font-semibold text-slate-900 num">{p.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <CardHeader title="Score & Model Drift" icon={Activity} iconCls="text-slate-500" right={DRIFT.healthy ? <Pill tone="emerald">Healthy</Pill> : <Pill tone="amber">Watch</Pill>} />
          <div className="mt-5">
            <div className="flex justify-between text-[13px]"><span className="text-slate-600">Avg Confidence</span><span className="font-semibold text-slate-900">{DRIFT.conf}%</span></div>
            <div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${DRIFT.conf}%` }} /></div>
            <div className={cn('mt-2 inline-flex items-center gap-1 text-[12px]', DRIFT.delta < 0 ? 'text-rose-500' : 'text-emerald-600')}><ArrowDown className={cn('h-3 w-3', DRIFT.delta >= 0 && 'rotate-180')} />{Math.abs(DRIFT.delta)}pt vs last month</div>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex justify-between text-[13px]"><span className="text-slate-600">Degraded-engine checks</span><span className="font-semibold text-slate-900">{DRIFT.degradedPct}%</span></div>
            <div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className={cn('h-full rounded-full', DRIFT.healthy ? 'bg-amber-400' : 'bg-rose-500')} style={{ width: `${Math.min(100, (DRIFT.degradedPct / 15) * 100)}%` }} /></div>
            <div className="mt-2 text-[12px] text-slate-500">Threshold: 15% — {DRIFT.full} full / {DRIFT.degraded} degraded</div>
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader title="Decline Reason Distribution" sub="Why the engine declined" />
          <div className="mt-4 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DECLINE_REASONS} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap={10}>
                <XAxis type="number" hide domain={[0, declineMax]} />
                <YAxis type="category" dataKey="label" width={112} tick={{ fontSize: 10.5, fill: '#64748b' }} axisLine={false} tickLine={false} interval={0} />
                <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(v) => [`${v}%`, 'Share']} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
                  {DECLINE_REASONS.map((_, i) => <Cell key={i} fill={['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader title="Tier Distribution" sub="Raw KRK vs post-policy" />
          <div className="mt-5 space-y-3">
            {TIER_DIST.map((t) => (
              <div key={t.tier} className="flex items-center gap-3 text-[12.5px]">
                <span className="w-6 font-medium text-slate-600">{t.tier}</span>
                <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="absolute inset-y-0 left-0 rounded-full opacity-30" style={{ width: `${(t.raw / tierMax) * 100}%`, background: TIER_SOLID[t.tier] }} />
                  <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(t.post / tierMax) * 100}%`, background: TIER_SOLID[t.tier] }} />
                </div>
                <span className="w-9 text-right font-semibold text-slate-900 num">{t.raw}%</span>
                <span className="w-8 text-right text-slate-400 num">{t.post}%</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-4 border-t border-slate-100 pt-3 text-[12px] text-slate-500">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-300" />Raw KRK</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500" />After policy</span>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <CardHeader title="Quick Actions" />
          <div className="mt-4 space-y-3">
            {[
              ['/checks/new', Zap, 'bg-indigo-50 text-indigo-600', 'Check New Customer', 'BVN + consent → KRK Signal'],
              ['/decision-engine', Package, 'bg-violet-50 text-violet-600', 'Create Loan Product', 'Define terms & eligibility'],
              ['/checks', ClipboardCheck, 'bg-amber-50 text-amber-600', 'Review Manual Queue', `${REVIEW_COUNT} check${REVIEW_COUNT === 1 ? '' : 's'} awaiting review`],
              ['/users', UserPlus, 'bg-emerald-50 text-emerald-600', 'Invite Team Member', 'Add analyst or developer'],
            ].map(([to, Icon, tile, t, s]) => (
              <a key={t} href="#" onClick={(e) => { e.preventDefault(); navigate(to); }} className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-indigo-200 hover:bg-indigo-50/30">
                <IconTile icon={Icon} size="sm" className={cn('h-9 w-9', tile)} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium text-slate-900">{t}</div>
                  <div className="text-[12px] text-slate-500">{s}</div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-500" />
              </a>
            ))}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <CardHeader title="Recent Activity" sub="Latest events across your organization" right={<Link to="/checks" className="text-[13px] font-medium text-indigo-600 hover:underline">View all</Link>} />
          <ol className="mt-5">
            {ACTIVITY.map((a, i) => {
              const Icon = ICONS[a.icon];
              return (
                <li key={i} onClick={() => a.to && navigate(a.to)} className={cn('relative flex gap-3 pb-5 last:pb-0', a.to && 'cursor-pointer')}>
                  {i < ACTIVITY.length - 1 && <span className="absolute left-[9px] top-6 h-[calc(100%-20px)] w-px bg-slate-200" />}
                  <Icon className={cn('mt-0.5 h-[18px] w-[18px] shrink-0', a.tone)} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-medium text-slate-900 hover:text-indigo-700">{a.title}</div>
                    <div className="text-[13px] text-slate-500">{a.detail}</div>
                  </div>
                  {a.tier && <TierBadge tier={a.tier} className="hidden h-fit sm:inline-flex" />}
                  <span className="whitespace-nowrap text-[12px] text-slate-400">{a.ago}</span>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>
    </div>
  );
}
