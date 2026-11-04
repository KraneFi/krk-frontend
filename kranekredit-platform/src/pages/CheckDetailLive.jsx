import { useState } from 'react';
import {
  ArrowLeft, RefreshCw, AlertTriangle, Info, Layers,
  Landmark, ShieldCheck, Sparkles, TrendingUp, TrendingDown, Trash2,
} from 'lucide-react';
import { Card, TierBadge, OutcomeBadge, Pill, SectionLabel, IconTile, cn } from '../components/ui.jsx';
import { Link, useApp } from '../router.jsx';
import { useSession } from '../api/auth.js';
import { getCheck, saveCheck, removeCheck, scores, ensureScoringKey } from '../api/scoring.js';
import { describeError } from '../api/useApi.js';

const ENGINE_LABEL = {
  bank_statement: 'Bank Statement Intelligence',
  credit_bureau: 'Credit Bureau',
  alternative_data: 'Alternative Data',
};

const fmt = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const SEVERITY = {
  critical: 'rose',
  high: 'rose',
  warning: 'amber',
  info: 'slate',
  low: 'slate',
  positive: 'emerald',
  negative: 'rose',
};

function Metric({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-3.5">
      <SectionLabel className="text-[10.5px]">{label}</SectionLabel>
      <div className="mt-1.5 text-[20px] font-semibold leading-none text-slate-900 num">{value}</div>
      <div className="mt-1.5 text-[11.5px] text-slate-500">{sub}</div>
    </div>
  );
}

export default function CheckDetailLive({ id }) {
  const { user } = useSession();
  const { navigate, notify } = useApp();
  const tenantId = user?.tenant_id;
  const [record, setRecord] = useState(() => getCheck(tenantId, id));
  const [busy, setBusy] = useState(false);

  if (!record) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <IconTile icon={Info} className="bg-slate-100 text-slate-500" />
          <div>
            <div className="text-[15px] font-semibold text-slate-900">This check is not in this browser</div>
            <p className="mt-1 max-w-xl text-[13px] text-slate-500">
              Checks are stored per browser until the API can list them tenant-wide. If it was run
              somewhere else — or in another browser — it will not appear here.
            </p>
            <Link to="/checks" className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-[13px] font-medium text-white hover:bg-indigo-700">
              <ArrowLeft className="h-4 w-4" />Back to Checks
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  const engines = record.engine_contributions || [];
  const reasons = record.reason_codes || [];
  const flags = record.flags || [];

  const rerun = async () => {
    setBusy(true);
    try {
      await ensureScoringKey(tenantId);
      const hasRefs = Boolean(record.analysis_id || record.report_id);
      const composite = await scores.fromSources({
        individual_id: record.individual_id,
        bank_statement_analysis_ids: record.analysis_id ? [record.analysis_id] : [],
        credit_report_ids: record.report_id ? [record.report_id] : [],
        auto_discover: !hasRefs,
      });
      const next = {
        ...record,
        score: composite.score,
        risk_code: composite.risk_code,
        debt_code: composite.debt_code,
        tier_code: composite.tier_code,
        krk_signal: composite.krk_signal,
        outcome: composite.outcome,
        confidence: composite.confidence,
        engine_contributions: composite.engine_contributions || [],
        flags: composite.flags || [],
        reason_codes: composite.reason_codes || [],
        dockets_used: composite.dockets_used || [],
        recommendation: composite.recommendation || null,
        rerun_at: new Date().toISOString(),
      };
      saveCheck(tenantId, next);
      setRecord(next);
      notify(`Re-scored — ${next.krk_signal}`);
    } catch (err) {
      notify(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  const drop = () => {
    removeCheck(tenantId, record.id);
    navigate('/checks');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/checks" className="inline-flex items-center gap-2 text-[14px] text-slate-600 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />Back to Checks</Link>
        <div className="flex flex-wrap gap-2">
          <button onClick={rerun} disabled={busy} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className={cn('h-4 w-4', busy && 'animate-spin')} />Re-score
          </button>
          <button onClick={drop} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 text-[13px] font-medium text-rose-600 hover:bg-rose-50">
            <Trash2 className="h-4 w-4" />Remove
          </button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-50 via-white to-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-[22px] font-semibold text-slate-900">{record.name}</h2>
              <p className="mt-1 text-[13px] text-slate-500">
                {record.bvn ? `BVN ••••••${String(record.bvn).slice(-4)} · ` : ''}
                {record.phone ? `${record.phone} · ` : ''}Started {fmt(record.created_at)} · Check {record.id}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <SectionLabel className="text-[10.5px]">KRK Signal</SectionLabel>
              <div className="mt-1 font-mono text-[22px] font-bold tracking-tight text-slate-900 sm:text-[26px]">{record.krk_signal}</div>
              <div className="mt-2 flex flex-wrap gap-2 sm:justify-end">
                <TierBadge tier={record.tier_code} size="md" />
                <OutcomeBadge outcome={record.outcome} />
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
            <Metric label="KRK Score" value={record.score} sub="0–1000 scale" />
            <Metric label="Risk Code" value={record.risk_code} sub="R1–R5 scale" />
            <Metric label="Debt Code" value={record.debt_code} sub="D0–D5 scale" />
            <Metric label="Confidence" value={`${Math.round((record.confidence || 0) * 100)}%`} sub="Engine availability" />
            <Metric label="Engines" value={`${engines.length}/3`} sub={record.outcome} />
          </div>
        </div>

        <div className="space-y-5 p-6 pt-4">
          {record.score === 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div className="text-[13px] text-amber-900">
                <strong>No engine reported data.</strong> The API returned a zero-score fallback
                (<span className="font-mono">KRK-0-R5-D0-T1</span>) because no docket was available for
                this individual — not because the borrower scored badly.
              </div>
            </div>
          )}

          <div>
            <SectionLabel className="mb-3">Engine Contributions</SectionLabel>
            {engines.length ? (
              <div className="space-y-3">
                {engines.map((e) => {
                  const Icon = e.engine === 'bank_statement' ? Landmark : e.engine === 'credit_bureau' ? ShieldCheck : Sparkles;
                  return (
                    <div key={e.engine} className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 p-4">
                      <IconTile icon={Icon} className="bg-indigo-50 text-indigo-600" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-semibold text-slate-900">{ENGINE_LABEL[e.engine] || e.engine}</span>
                          <Pill tone="slate">{(e.weight * 100).toFixed(1)}% weight</Pill>
                        </div>
                        <div className="text-[12.5px] text-slate-500">Engine score {e.score} → contributes {e.contribution.toFixed(2)} points</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[18px] font-semibold text-slate-900 num">{e.score}</div>
                        <div className="text-[11.5px] text-slate-400">0–100 engine</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 p-4 text-[13px] text-slate-500">No engine contributed to this score.</div>
            )}
          </div>

          {reasons.length > 0 && (
            <div>
              <SectionLabel className="mb-3">Reason Codes</SectionLabel>
              <div className="grid gap-2 sm:grid-cols-2">
                {reasons.map((r) => (
                  <div key={r.code} className="flex items-start gap-2.5 rounded-xl border border-slate-200 px-3.5 py-2.5">
                    {String(r.direction).toLowerCase() === 'negative'
                      ? <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                      : <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />}
                    <div className="min-w-0">
                      <div className="font-mono text-[11.5px] text-slate-500">{r.code}</div>
                      <div className="text-[12.5px] text-slate-700">{r.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {flags.length > 0 && (
            <div>
              <SectionLabel className="mb-3">Risk Flags</SectionLabel>
              <div className="space-y-2">
                {flags.map((f, i) => (
                  <div key={`${f.code}-${i}`} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5">
                    <Pill tone={SEVERITY[String(f.severity).toLowerCase()] || 'slate'}>{f.severity}</Pill>
                    <span className="font-mono text-[11.5px] text-slate-500">{f.code}</span>
                    <span className="min-w-0 flex-1 text-[12.5px] text-slate-700">{f.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {record.recommendation && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-900"><Sparkles className="h-4 w-4 text-indigo-500" />AI note</div>
              <p className="mt-1.5 text-[13px] text-slate-700">{record.recommendation}</p>
              <p className="mt-1 text-[11.5px] text-slate-500">Generated text — not a credit decision. The API has no approve/decline field today.</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-[12.5px] text-slate-600">
            <Layers className="h-4 w-4 text-slate-400" />
            <span>Dockets used: <strong className="text-slate-900">{record.dockets_used?.join(', ') || 'none'}</strong></span>
            <span className="text-slate-400">·</span>
            <span>Individual <span className="font-mono">{record.individual_id}</span></span>
            {record.rerun_at && <span className="text-slate-400">· re-scored {fmt(record.rerun_at)}</span>}
          </div>
        </div>
      </Card>
    </div>
  );
}
