import clsx from 'clsx';
import { TIERS } from '../data/core.js';

export const cn = clsx;

export function Card({ className, children, ...rest }) {
  return <div className={cn('rounded-2xl border border-slate-200/70 bg-white shadow-sm', className)} {...rest}>{children}</div>;
}

export function CardHeader({ title, sub, icon: Icon, iconCls = 'text-indigo-500', right, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
          {Icon && <Icon className={cn('h-4 w-4', iconCls)} />}
          {title}
        </h3>
        {sub && <p className="mt-0.5 text-[13px] text-slate-500">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Button({ variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, className, children, ...rest }) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors whitespace-nowrap disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40';
  const sizes = { sm: 'h-8 px-3 text-[12px]', md: 'h-9 px-3.5 text-[13px]', lg: 'h-11 px-5 text-[14px]' };
  const variants = {
    primary: 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 disabled:bg-indigo-50 disabled:text-indigo-300 disabled:shadow-none',
    outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    soft: 'border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
    danger: 'border border-rose-200 bg-white text-rose-600 hover:bg-rose-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
  };
  return (
    <button className={cn(base, sizes[size], variants[variant], className)} {...rest}>
      {Icon && <Icon className="h-4 w-4" />}
      {children}
      {IconRight && <IconRight className="h-4 w-4" />}
    </button>
  );
}

const TIER_STYLE = {
  T0: 'bg-red-50 text-red-600', T1: 'bg-orange-50 text-orange-600', T2: 'bg-amber-50 text-amber-600',
  T3: 'bg-cyan-50 text-cyan-700', T4: 'bg-blue-50 text-blue-700', T5: 'bg-green-50 text-green-700',
};
const TIER_DOT = { T0: 'bg-red-500', T1: 'bg-orange-500', T2: 'bg-amber-500', T3: 'bg-cyan-500', T4: 'bg-blue-500', T5: 'bg-green-500' };
export const TIER_SOLID = { T0: 'hsl(var(--tier-0))', T1: 'hsl(var(--tier-1))', T2: 'hsl(var(--tier-2))', T3: 'hsl(var(--tier-3))', T4: 'hsl(var(--tier-4))', T5: 'hsl(var(--tier-5))' };
export const TIER_HERO = { T0: 'from-red-50', T1: 'from-orange-50', T2: 'from-amber-50', T3: 'from-cyan-50', T4: 'from-blue-50', T5: 'from-green-50' };

export function TierBadge({ tier, size = 'sm', className }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full font-medium leading-tight', size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-[12.5px]', TIER_STYLE[tier], className)}>
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', TIER_DOT[tier])} />
      {tier} · {TIERS[tier].name}
    </span>
  );
}

const TONES = {
  emerald: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', rose: 'bg-rose-50 text-rose-600',
  indigo: 'bg-indigo-50 text-indigo-700', violet: 'bg-violet-50 text-violet-700', slate: 'bg-slate-100 text-slate-600',
  blue: 'bg-blue-50 text-blue-700', orange: 'bg-orange-50 text-orange-600',
};
export function Pill({ tone = 'slate', dot, border, className, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-medium', TONES[tone], border && 'border border-current/20', className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const DECISION = {
  'Auto-Approve': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Manual Review': 'border-amber-200 bg-amber-50 text-amber-700',
  'Auto-Decline': 'border-rose-200 bg-rose-50 text-rose-600',
  Refer: 'border-amber-200 bg-amber-50 text-amber-700',
};
export function DecisionBadge({ decision, className }) {
  return <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-[11.5px] font-medium', DECISION[decision], className)}>{decision}</span>;
}

export function Avatar({ name, className, gradient }) {
  const ini = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <span className={cn('inline-grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold', gradient ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white' : 'bg-slate-100 text-slate-600', className)}>
      {ini}
    </span>
  );
}

export function IconTile({ icon: Icon, className, size = 'md' }) {
  const s = size === 'lg' ? 'h-11 w-11 rounded-xl' : size === 'sm' ? 'h-8 w-8 rounded-lg' : 'h-10 w-10 rounded-xl';
  return (
    <span className={cn('grid shrink-0 place-items-center', s, className)}>
      <Icon className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
    </span>
  );
}

// Pill-style tab group (Decision Engine, Servicing, API, Users, Compliance)
export function PillTabs({ tabs, value, onChange, className }) {
  return (
    <div className={cn('thin-scroll inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100/80 p-1', className)} role="tablist">
      {tabs.map((t) => {
        const key = t.key ?? t;
        const Icon = t.icon;
        const active = value === key;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors', active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {t.label ?? t}
            {t.badge != null && <span className="ml-0.5 rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold leading-4 text-white">{t.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

// Underline tabs (Check Detail, Deep Analysis)
export function LineTabs({ tabs, value, onChange, className }) {
  return (
    <div className={cn('thin-scroll flex gap-1 overflow-x-auto border-b border-slate-200', className)} role="tablist">
      {tabs.map((t) => {
        const key = t.key ?? t;
        const Icon = t.icon;
        const active = value === key;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={cn('-mb-px inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-[14px] font-medium transition-colors', active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800')}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {t.label ?? t}
          </button>
        );
      })}
    </div>
  );
}

export function Progress({ value, max = 100, className, bar = 'bg-indigo-500' }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div className={cn('h-full rounded-full', bar)} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-indigo-600' : 'bg-slate-200')}>
      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
    </button>
  );
}

export function SectionLabel({ children, className }) {
  return <div className={cn('text-[11px] font-semibold uppercase tracking-wider text-slate-500', className)}>{children}</div>;
}
