import { useState } from 'react';
import {
  ArrowLeft, RefreshCw, Download, ChevronRight, Copy, CheckCircle2, AlertTriangle, Landmark, ShieldCheck, Smartphone,
  Sparkles, Info, Clock, User, Layers, TrendingUp, TrendingDown, XCircle, Zap,
} from 'lucide-react';
import { Card, CardHeader, TierBadge, DecisionBadge, Pill, SectionLabel, LineTabs, IconTile, cn, TIER_HERO } from '../components/ui.jsx';
import { useData } from '../data/DataContext.jsx';
import { Link, useApp } from '../router.jsx';
import DeepAnalysis from '../deep/DeepAnalysis.jsx';

function Metric({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-3.5">
      <SectionLabel className="text-[10.5px]">{label}</SectionLabel>
      <div className="mt-1.5 text-[20px] font-semibold leading-none text-slate-900 num">{value}</div>
      <div className="mt-1.5 text-[11.5px] text-slate-500">{sub}</div>
    </div>
  );
}

function Ring({ value, tone }) {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#f1f5f9" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={tone} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(value / 100) * c} ${c}`} />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[18px] font-semibold text-slate-900">{value}</span>
    </div>
  );
}

export default function CheckDetail({ id }) {
  const { REPORTS, CHECKS } = useData();
  const r = REPORTS[id] || REPORTS[CHECKS[0].id];
  const { notify, navigate } = useApp();
  const [tab, setTab] = useState('overview');
  const [deep, setDeep] = useState(null);
  const degraded = r.label === 'DEGRADED';

  const engines = [
    { key: 'bs360', name: 'BS360', desc: 'Bank Statement Intelligence', icon: Landmark, tile: 'bg-indigo-50 text-indigo-600', ...r.engines.bs360 },
    { key: 'bureau', name: 'Bureau Intelligence', desc: 'FirstCentral + CRC Reconciled', icon: ShieldCheck, tile: 'bg-violet-50 text-violet-600', available: true, ...r.engines.bureau },
    { key: 'mobi', name: 'MoBI360', desc: 'Alternative / Behavioral Data', icon: Smartphone, tile: 'bg-emerald-50 text-emerald-600', ...r.engines.mobi },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/checks" className="inline-flex items-center gap-2 text-[14px] text-slate-600 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />Back to Checks</Link>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => notify('Re-run queued — the check will refresh with the latest dockets')} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" />Re-run</button>
          <button onClick={() => notify('PDF report generated for ' + r.id)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50"><Download className="h-4 w-4" />PDF Report</button>
          <button onClick={() => navigate('/loan-queue')} className="inline-flex h-9 items-center gap-1 rounded-lg bg-indigo-600 px-3.5 text-[13px] font-medium text-white shadow-sm hover:bg-indigo-700">Issue Offer<ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className={cn('bg-gradient-to-br via-white to-white p-6', TIER_HERO[r.tier])}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-[22px] font-semibold text-slate-900">{r.name}<Copy className="h-4 w-4 text-slate-400" /></h2>
              <p className="mt-1 text-[13px] text-slate-500">BVN ••••••{r.bvn} · {r.phone} · Check ID {r.id}</p>
            </div>
            <div className="text-left sm:text-right">
              <SectionLabel className="text-[10.5px]">KRK Signal</SectionLabel>
              <div className="mt-1 font-mono text-[22px] font-bold tracking-tight text-slate-900 sm:text-[26px]">{r.signal}</div>
              <div className="mt-2 flex gap-2 sm:justify-end"><TierBadge tier={r.tier} size="md" /><DecisionBadge decision={r.decision} /></div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
            <Metric label="KRK Score" value={r.score} sub="300–900 range" />
            <Metric label="Risk Code" value={r.risk} sub="R1–R5 scale" />
            <Metric label="Debt Code" value={r.debt} sub="D1–D5 scale" />
            <Metric label="Confidence" value={`${r.confidence}%`} sub="Engine availability" />
            <Metric label="Policy" value={r.policy} sub="Decision version" />
          </div>
        </div>

        <div className="space-y-5 p-6 pt-4">
          <div className={cn('flex items-center gap-3 rounded-xl border px-4 py-3', degraded ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50')}>
            <IconTile icon={degraded ? AlertTriangle : CheckCircle2} size="sm" className={degraded ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'} />
            <span className="text-[14px] font-semibold text-slate-900">Scoring Label: {r.label}</span>
            <span className="text-[13px] text-slate-500">· Confidence {r.confidence}%</span>
          </div>

          <div>
            <SectionLabel className="mb-3">Per-Engine Breakdown</SectionLabel>
            <div className="space-y-3">
              {engines.map((e) => {
                const off = e.available === false;
                return (
                  <div key={e.key} className={cn('flex items-center gap-4 rounded-xl border border-slate-200 p-4', off && 'opacity-50')}>
                    <IconTile icon={e.icon} className={e.tile} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[14px] font-semibold text-slate-900">{e.name}</span>
                        <Pill tone={e.redistributed || off ? 'indigo' : 'slate'}>{e.weight}</Pill>
                        {off && <Pill tone="slate">Missing</Pill>}
                      </div>
                      <div className="text-[12.5px] text-slate-600">{e.desc}</div>
                      <div className="text-[12px] text-slate-400">{e.source}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[18px] font-semibold text-slate-900 num">{e.score ?? '—'}</div>
                      {!off && <div className="inline-flex items-center gap-1 text-[11.5px] font-medium text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />available</div>}
                    </div>
                    {!off && (
                      <button onClick={() => setDeep(e.key)} className="hidden items-center gap-0.5 text-[12.5px] font-medium text-indigo-600 hover:underline sm:inline-flex">
                        View more<ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
              <button onClick={() => setDeep('mt')} className="flex w-full items-center gap-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 text-left transition hover:bg-indigo-50">
                <IconTile icon={Sparkles} className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white" />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-slate-900">Main Thinker Engine</div>
                  <div className="text-[12.5px] text-slate-600">Reconciliation waterfall + integrity gating + reason-code synthesis → {r.signal}</div>
                </div>
                <div className="text-right">
                  <div className="text-[18px] font-semibold text-slate-900 num">{r.score}</div>
                  <div className="text-[11.5px] font-medium text-indigo-600">Final score</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-[14px] font-semibold text-slate-900">Flags Requiring Attention</span>
            <span className="text-[12.5px] text-slate-500">Aggregated across all engines</span>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {r.flags.map((f) => (
              <div key={f.text} className={cn('flex gap-3 rounded-xl border p-4', f.level === 'HIGH' ? 'border-rose-200 bg-rose-50' : f.level === 'MEDIUM' ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50')}>
                {f.level === 'HIGH' ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" /> : f.level === 'MEDIUM' ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /> : <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />}
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn('rounded px-1.5 py-0.5 text-[10.5px] font-bold', f.level === 'HIGH' ? 'bg-rose-100 text-rose-700' : f.level === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-white text-blue-700')}>{f.level}</span>
                    <span className="text-[11.5px] text-slate-500">{f.engine}</span>
                  </div>
                  <div className="mt-1 text-[13.5px] font-medium text-slate-900">{f.text}</div>
                  <div className="text-[12px] text-slate-500">{f.action}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 py-5">
          <SectionLabel>Final Recommendation</SectionLabel>
          <p className="mt-2 text-[14.5px] font-medium text-slate-900">{r.recommendation}</p>
        </div>
      </Card>

      <LineTabs value={tab} onChange={setTab} tabs={[
        { key: 'overview', label: 'Overview' }, { key: 'bank', label: 'Bank Statement' }, { key: 'bureau', label: 'Credit Bureau' },
        { key: 'alt', label: 'Alternative Data' }, { key: 'decision', label: 'Decision & Recommendation' },
      ]} />

      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <CardHeader title="Processing Pipeline" sub="Five-stage assessment flow" />
            <div className="thin-scroll mt-6 overflow-x-auto pb-2">
              <div className="flex min-w-[560px] items-start">
                {r.pipeline.map((s, i) => (
                  <div key={s.name} className="relative flex flex-1 flex-col items-center text-center">
                    {i < r.pipeline.length - 1 && <span className="absolute left-1/2 top-5 h-px w-full bg-emerald-200" />}
                    <span className="relative z-10 grid h-10 w-10 place-items-center rounded-full bg-emerald-500 text-white ring-4 ring-white"><CheckCircle2 className="h-5 w-5" /></span>
                    <div className="mt-2 text-[12.5px] font-medium text-slate-800">{s.name}</div>
                    <div className="text-[11px] text-slate-400">{s.t}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <CardHeader title="Consent & Data Lineage" />
            <div className="mt-4 flex gap-3">
              <IconTile icon={ShieldCheck} size="sm" className="bg-emerald-50 text-emerald-600" />
              <div className="text-[13px]">
                <div className="font-medium text-slate-900">{r.consent.method}</div>
                <div className="flex items-center gap-1 text-[12px] text-slate-500"><Clock className="h-3 w-3" />{r.consent.at}</div>
                <div className="flex items-center gap-1 text-[12px] text-slate-500"><User className="h-3 w-3" />Captured by {r.consent.by}</div>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 p-3">
              <SectionLabel className="mb-2">Data Sources</SectionLabel>
              {r.sources.map(([n, m, t]) => (
                <div key={n} className="flex items-center justify-between py-1.5 text-[12.5px]">
                  <span className="text-slate-600">{n}</span>
                  <span className="flex items-center gap-3">
                    <span className={cn('inline-flex items-center gap-1 font-medium', m === 'API' ? 'text-emerald-600' : 'text-amber-600')}><CheckCircle2 className="h-3 w-3" />{m}</span>
                    <span className="font-mono text-[11.5px] text-slate-400">{t}</span>
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'bank' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="p-5">
              <CardHeader title="BS360 — Statement Intelligence" sub="Category-level metrics shown; composite score pending BS360 formula publication" right={<Pill tone={r.integrity.status === 'Clear' ? 'emerald' : r.integrity.status === 'Review' ? 'amber' : 'rose'}>{r.integrity.status}</Pill>} />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {r.bs360Metrics.map((m) => (
                  <div key={m.label} className="rounded-xl border border-slate-200 p-4">
                    <div className="text-[12px] text-slate-500">{m.label}</div>
                    <div className="mt-1 text-[20px] font-semibold text-slate-900 num">{m.value}</div>
                    <div className="text-[11.5px] text-slate-400">{m.sub}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-100 px-5 py-4">
              <button onClick={() => setDeep('bs360')} className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-[13px] font-medium text-indigo-700 hover:bg-indigo-100"><Layers className="h-4 w-4" />View more — BS360 Deep Analysis</button>
            </div>
          </Card>
          <Card className="p-5">
            <CardHeader title="Statement Integrity" sub="Authenticity scoring (Ocrolus-pattern)" right={<Pill tone={r.integrity.status === 'Clear' ? 'emerald' : r.integrity.status === 'Review' ? 'amber' : 'rose'}>{r.integrity.status}</Pill>} />
            <div className="mt-4 flex items-center gap-4">
              <Ring value={r.integrity.score} tone={r.integrity.score >= 80 ? '#22c55e' : r.integrity.score >= 55 ? '#f59e0b' : '#f43f5e'} />
              <div>
                <div className={cn('text-[14px] font-semibold', r.integrity.status === 'Clear' ? 'text-emerald-700' : r.integrity.status === 'Review' ? 'text-amber-700' : 'text-rose-600')}>Authenticity: {r.integrity.score}/100</div>
                <div className="text-[12px] text-slate-500">{r.integrity.checks.every((c) => c.ok) ? 'All four integrity checks passed' : `${r.integrity.checks.filter((c) => !c.ok).length} of 4 integrity checks failed`}</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {r.integrity.checks.map((c) => (
                <div key={c.name} className="flex gap-3 rounded-xl border border-slate-200 p-3">
                  {c.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />}
                  <div><div className="text-[13px] font-medium text-slate-900">{c.name}</div><div className="text-[12px] text-slate-500">{c.detail}</div></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'bureau' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <CardHeader title="Bureau Reconciliation" sub="FirstCentral vs CRC — side-by-side" right={r.bureau.conflict ? <Pill tone="amber"><AlertTriangle className="h-3 w-3" />Conflict flagged</Pill> : <Pill tone="emerald"><CheckCircle2 className="h-3 w-3" />No conflicts</Pill>} />
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-[13px]">
                <thead className="bg-slate-50 text-[12px] text-slate-500"><tr><th className="px-4 py-2.5 text-left font-medium" /><th className="px-4 py-2.5 font-medium">FirstCentral</th><th className="px-4 py-2.5 font-medium">CRC</th></tr></thead>
                <tbody>{r.bureau.rows.map(([k, a, b]) => <tr key={k} className="border-t border-slate-100"><td className="px-4 py-2.5 text-slate-600">{k}</td><td className="px-4 py-2.5 text-center font-semibold num">{a}</td><td className="px-4 py-2.5 text-center font-semibold num">{b}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5">
              <div className="text-[12.5px] font-semibold text-indigo-700">Waterfall Path</div>
              <div className="mt-1 text-[12.5px] text-indigo-600">{r.bureau.waterfall}</div>
            </div>
          </Card>
          <Card className="p-5">
            <CardHeader title="Six Weighted Dimensions" sub="Bureau composite breakdown" />
            <div className="mt-4 space-y-2">
              {r.bureau.dims.map((d) => (
                <div key={d.name} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[13px] font-medium text-slate-900">{d.name}<Pill tone="slate" className="text-[10.5px]">{d.w}</Pill></div>
                    <div className="text-[12px] text-slate-500">{d.value}</div>
                  </div>
                  <Pill tone={d.verdict === 'STRONG' ? 'emerald' : d.verdict === 'WATCH' ? 'amber' : 'blue'} className="text-[10.5px] font-semibold">{d.verdict}</Pill>
                </div>
              ))}
            </div>
            <button onClick={() => setDeep('bureau')} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-[13px] font-medium text-indigo-700 hover:bg-indigo-100"><Layers className="h-4 w-4" />View more — Bureau Deep Analysis</button>
          </Card>
        </div>
      )}

      {tab === 'alt' && (r.engines.mobi.available ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <IconTile icon={CheckCircle2} size="sm" className="bg-emerald-100 text-emerald-600" />
            <div><div className="text-[14px] font-semibold text-slate-900">Alternative Data: Connected</div><div className="text-[12.5px] text-slate-600">SDK integrated, signals returned — MoBI360 scoring at full 25% weight</div></div>
          </div>
          <Card className="p-5">
            <CardHeader title="MoBI360 — Alternative Data Dimensions" sub="Five weighted signal categories" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {r.mobiDims.map((m) => (
                <div key={m.label} className="rounded-xl border border-slate-200 p-4">
                  <div className="text-[12px] text-slate-500">{m.label}</div>
                  <div className="mt-1 text-[16px] font-semibold text-slate-900">{m.value}</div>
                  <div className="text-[11.5px] text-slate-400">{m.sub}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setDeep('mobi')} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-[13px] font-medium text-indigo-700 hover:bg-indigo-100"><Layers className="h-4 w-4" />View more — MoBI360 Deep Analysis</button>
          </Card>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <XCircle className="h-5 w-5 text-slate-400" />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold text-slate-900">Alternative Data: {r.mobiKey}</div>
            <div className="text-[12.5px] text-slate-500">{r.mobiCode} — {r.engines.mobi.source}. MoBI360's 25% weight redistributed to BS360</div>
          </div>
          <Pill tone="amber">Weight redistributed → BS360</Pill>
        </div>
      ))}

      {tab === 'decision' && (
        <div className="space-y-4">
          <button onClick={() => setDeep('mt')} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 text-[13px] font-medium text-white shadow-sm hover:bg-indigo-700">View Scoring Detail — Main Thinker Deep Dive<ChevronRight className="h-4 w-4" /></button>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden">
              <div className="border-b border-slate-100 p-5"><CardHeader title="Reason Codes — Score Explainability" sub="Ranked factors backing the KRK Signal" /></div>
              <div className="space-y-5 p-5">
                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-emerald-700"><TrendingUp className="h-4 w-4" />Top Positive Factors</div>
                  <div className="space-y-2">
                    {r.positive.map(([c, t]) => (
                      <div key={c} className="flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                        <span className="h-fit rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-emerald-700">{c}</span>
                        <span className="text-[13px] text-slate-700">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-rose-600"><TrendingDown className="h-4 w-4" />Top Adverse Factors</div>
                  <div className="space-y-2">
                    {r.adverse.map(([c, t]) => (
                      <div key={c} className="flex gap-3 rounded-xl border border-rose-100 bg-rose-50/40 p-3">
                        <span className="h-fit rounded bg-rose-100 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-rose-600">{c}</span>
                        <span className="text-[13px] text-slate-700">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="border-b border-slate-100 p-5"><CardHeader title="Prequalified Products" sub="From the Main Thinker Recommendation Engine" /></div>
              <div className="space-y-3 p-5">
                {!r.prequalified.length && <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-[13px] text-slate-500">No products prequalified — {r.decision === 'Auto-Decline' ? 'the check was declined under policy v4.2' : `no active product accepts ${r.tier}`}.</div>}
                {r.prequalified.map((p) => (
                  <div key={p.name} className={cn('rounded-xl border p-4', p.recommended ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-200')}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14px] font-semibold text-slate-900">{p.name}</span>
                      {p.recommended && <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10.5px] font-semibold text-white">Recommended</span>}
                    </div>
                    <div className="mt-1 text-[13px] font-medium text-slate-700">{p.range}</div>
                    <div className="text-[12px] text-slate-500">{p.terms}</div>
                    <div className="mt-2 text-[12px] italic text-slate-500">{p.why}</div>
                  </div>
                ))}
                {r.prequalified.length > 0 && <button onClick={() => navigate('/loan-queue')} className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 text-[13px] font-medium text-white hover:bg-indigo-700"><Zap className="h-4 w-4" />Issue Offer</button>}
              </div>
            </Card>
          </div>
        </div>
      )}

      {deep && <DeepAnalysis report={r} initial={deep} onClose={() => setDeep(null)} />}
    </div>
  );
}
