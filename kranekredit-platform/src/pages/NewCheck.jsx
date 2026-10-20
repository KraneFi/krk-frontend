import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Lock, ShieldCheck, Link2, Smartphone, ChevronRight, CheckCircle2, Search, Loader2, Landmark, Building2, Layers,
  RefreshCw, Upload, AlertCircle, ScanText, Sparkles, Zap, Check,
} from 'lucide-react';
import { Card, TierBadge, cn } from '../components/ui.jsx';
import { useData } from '../data/DataContext.jsx';
import { makeRng } from '../data/rng.js';
import { bvnAccounts } from '../data/gen-check.js';
import { Link, useApp } from '../router.jsx';

const MOBI_OPTIONS = ['Connected', 'Not available on this channel', 'Consent not granted', 'Temporarily unavailable', 'Low confidence'];
const MOBI_STATUS = {
  Connected: ['emerald', 'Alternative Data: Connected', 'SDK integrated, signals returned — MoBI360 scoring at full 25% weight'],
  'Not available on this channel': ['slate', 'Alternative Data: Not available on this channel', "STRUCTURALLY_ABSENT — no SDK on this app/channel. MoBI360's 25% weight redistributed to BS360"],
  'Consent not granted': ['slate', 'Alternative Data: Consent not granted', 'Borrower declined the SDK Yes/No gate — weight redistributed to BS360'],
  'Temporarily unavailable': ['amber', 'Alternative Data: Temporarily unavailable', 'SDK handshake timed out — weight redistributed, re-score when available'],
  'Low confidence': ['amber', 'Alternative Data: Low confidence', 'Fewer than 2 corroborating sources — MoBI360 contribution dampened'],
};
const STAGES = [
  ['Consent & Retrieval', 'BVN validation, consent capture, data retrieval', CheckCircle2],
  ['Statement Integrity', 'Authenticity scoring (Ocrolus-pattern)', ScanText],
  ['Narration Enrichment', 'Transaction categorization & enrichment', Layers],
  ['Engine Scoring', 'BS360, Bureau Intelligence, MoBI360', Sparkles],
  ['Main Thinker Synthesis', 'Reconciliation & KRK Signal', Sparkles],
];
const TYPE_PILL = { Commercial: 'bg-indigo-50 text-indigo-600', MFB: 'bg-amber-50 text-amber-600', Fintech: 'bg-emerald-50 text-emerald-600' };
const TYPE_TILE = { Commercial: [Landmark, 'bg-indigo-50 text-indigo-600'], MFB: [Building2, 'bg-orange-50 text-orange-500'], Fintech: [Smartphone, 'bg-emerald-50 text-emerald-600'] };

function Dots({ step }) {
  return (
    <div className="mt-6 flex justify-center gap-1.5">
      {[1, 2, 3, 4].map((i) => <span key={i} className={cn('h-1.5 rounded-full', i <= step ? 'w-7 bg-indigo-500' : 'w-4 bg-slate-200')} />)}
    </div>
  );
}

function StatusChip({ state }) {
  if (state === 'done') return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600"><CheckCircle2 className="h-3 w-3" />API</span>;
  if (state === 'failed') return <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600"><AlertCircle className="h-3 w-3" />Failed</span>;
  if (state === 'running') return <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-indigo-600"><Loader2 className="h-3 w-3 animate-spin" />Retrieving</span>;
  return <span className="text-[11.5px] text-slate-400">Queued</span>;
}

export default function NewCheck() {
  const { navigate } = useApp();
  const { runCheck, seed } = useData();
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(1); // 1 form, 2 resolving/accounts, 3 acquisition, 4 running/result
  const [bvn, setBvn] = useState('');
  const [method, setMethod] = useState('direct');
  const [bank, setBank] = useState(false);
  const [bureau, setBureau] = useState(false);
  const [mobi, setMobi] = useState('Connected');
  const [resolving, setResolving] = useState(false);
  const [selected, setSelected] = useState([]);
  // Linked accounts are derived from the BVN itself, so the same BVN always resolves to the same banks.
  const { BVN_ACCOUNTS, failBank, failBureau } = useMemo(() => {
    if (!/^\d{11}$/.test(bvn)) return { BVN_ACCOUNTS: [], failBank: null, failBureau: null };
    const rng = makeRng((parseInt(bvn.slice(-9), 10) ^ seed) + 7);
    const accts = bvnAccounts(rng);
    return { BVN_ACCOUNTS: accts, failBank: rng.chance(0.7) ? accts[rng.int(1, Math.min(4, accts.length - 1))].bank : null, failBureau: rng.chance(0.6) ? rng.pick(['CRC', 'CRS']) : null };
  }, [bvn, seed]);
  const [src, setSrc] = useState({});
  const [stage, setStage] = useState(0);

  const valid = /^\d{11}$/.test(bvn);
  const canStart = valid && bank && bureau;

  // Step 2: NIBSS resolution
  const start = () => { setSelected(BVN_ACCOUNTS.filter((a) => !a.dormant).slice(0, 5).map((a) => a.bank)); setStep(2); setResolving(true); setTimeout(() => setResolving(false), 2200); };

  // Step 3: parallel acquisition with two scripted failures (Zenith, CRS)
  const sources = [
    ...BVN_ACCOUNTS.filter((a) => selected.includes(a.bank)).map((a) => ({ id: a.bank, group: 'bank', title: a.bank, sub: `Account ••••${a.acct}`, fail: a.bank === failBank })),
    { id: 'FirstCentral', group: 'bureau', title: 'FirstCentral', sub: 'Credit bureau report' },
    { id: 'CRC', group: 'bureau', title: 'CRC', sub: 'Credit bureau report', fail: failBureau === 'CRC' },
    { id: 'CRS', group: 'bureau', title: 'CRS', sub: 'Credit Registry Services', fail: failBureau === 'CRS' },
    ...(mobi === 'Connected' || mobi === 'Low confidence' ? [{ id: 'MoBI360', group: 'alt', title: 'MoBI360 SDK', sub: 'Behavioral telemetry' }] : []),
  ];
  const spool = () => {
    setStep(3);
    const init = {};
    sources.forEach((s, i) => { init[s.id] = i < 4 || s.group !== 'bank' ? 'running' : 'queued'; });
    setSrc(init);
    sources.forEach((s, i) => {
      if (init[s.id] === 'queued') setTimeout(() => setSrc((p) => ({ ...p, [s.id]: 'running' })), 900);
      setTimeout(() => setSrc((p) => ({ ...p, [s.id]: s.fail ? 'failed' : 'done' })), 1400 + i * 260);
    });
  };
  const retry = (id) => { setSrc((p) => ({ ...p, [id]: 'running' })); setTimeout(() => setSrc((p) => ({ ...p, [id]: 'done' })), 1300); };
  const allDone = step === 3 && sources.every((s) => src[s.id] === 'done');
  const bureauCount = ['FirstCentral', 'CRC', 'CRS'].filter((b) => src[b] === 'done').length;

  // Step 4: five-stage pipeline
  useEffect(() => {
    if (step !== 4 || stage > STAGES.length) return;
    const t = setTimeout(() => setStage((s) => s + 1), 1100);
    return () => clearTimeout(t);
  }, [step, stage]);

  const r = result?.report;
  const full = r ? r.label === 'FULL' : mobi === 'Connected';

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/checks" className="mb-6 inline-flex items-center gap-2 text-[14px] text-slate-600 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />Back to Checks</Link>

      {step === 1 && (
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-5">
            <h2 className="text-[17px] font-semibold text-slate-900">New Credit Check</h2>
            <p className="mt-1 text-[13.5px] text-slate-500">Capture the customer's BVN and explicit, independent consents for each data plane.</p>
          </div>
          <div className="space-y-6 p-6">
            <div>
              <label htmlFor="bvn" className="text-[13.5px] font-medium text-slate-900">BVN (Bank Verification Number)</label>
              <div className="relative mt-2">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input id="bvn" inputMode="numeric" maxLength={11} value={bvn} onChange={(e) => setBvn(e.target.value.replace(/\D/g, ''))} placeholder="Enter 11-digit BVN"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 font-mono text-[15px] tracking-wider placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10" />
              </div>
              {valid
                ? <p className="mt-1.5 flex items-center gap-1 text-[12px] text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />BVN format valid — NIBSS lookup ready</p>
                : <p className="mt-1.5 text-[12px] text-slate-500">NIBSS format validation runs client-side</p>}
            </div>

            <div>
              <div className="text-[13.5px] font-medium text-slate-900">Consent & Data Capture Method</div>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {[['direct', ShieldCheck, 'Direct Capture', 'Analyst captures BVN + consent on behalf of customer'], ['link', Link2, 'Self-Service Link', 'Customer links their own bank accounts via tokenized link']].map(([k, Icon, t, s]) => (
                  <button key={k} type="button" onClick={() => setMethod(k)} className={cn('rounded-xl border p-4 text-left transition', method === k ? 'border-indigo-300 bg-indigo-50/40 ring-2 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300')}>
                    <Icon className={cn('h-5 w-5', method === k ? 'text-indigo-600' : 'text-slate-500')} />
                    <div className="mt-3 text-[14px] font-medium text-slate-900">{t}</div>
                    <div className="mt-1 text-[12px] text-slate-500">{s}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[13.5px] font-medium text-slate-900">Independent Data Consents (NDPA)</div>
              <div className="mt-2 space-y-3">
                {[[bank, setBank, 'consent-bank', 'Bank Statement Consent', 'Authorizes KraneKredit to retrieve transactional bank statement data via API (item-linked auto-pull).'],
                  [bureau, setBureau, 'consent-bureau', 'Credit Bureau Consent', 'Authorizes KraneKredit to pull credit bureau reports from FirstCentral, CRC, and CRS (Credit Registry Services).']].map(([v, set, id, t, s]) => (
                  <label key={id} htmlFor={id} className={cn('flex cursor-pointer gap-3 rounded-xl border p-4 transition', v ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 hover:border-slate-300')}>
                    <input id={id} type="checkbox" checked={v} onChange={(e) => set(e.target.checked)} className="mt-0.5 h-4 w-4 accent-indigo-600" />
                    <span><span className="block text-[14px] font-medium text-slate-900">{t}</span><span className="mt-0.5 block text-[12.5px] text-slate-500">{s}</span></span>
                  </label>
                ))}
              </div>
              <p className="mt-3 text-[11.5px] italic text-slate-400">Lawful basis: Contract necessity. Each consent is timestamped and recorded independently — data is processed per the org's retention policy.</p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-[13px] font-medium text-slate-900"><Smartphone className="h-4 w-4 text-slate-500" />MoBI360 SDK Availability (simulate)</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {MOBI_OPTIONS.map((o) => (
                  <button key={o} type="button" onClick={() => setMobi(o)} className={cn('rounded-full border px-3 py-1 text-[12px] font-medium', mobi === o ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}>{o}</button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">In production this is detected automatically from the SDK handshake.</p>
            </div>

            <button disabled={!canStart} onClick={start} className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-[14px] font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:bg-indigo-50 disabled:text-indigo-300 disabled:shadow-none">
              Initiate Check<ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="overflow-hidden kk-fade">
          <div className="border-b border-slate-100 px-6 py-5">
            {resolving
              ? <><h2 className="flex items-center gap-2 text-[17px] font-semibold text-slate-900"><Search className="h-4 w-4 text-indigo-600" />BVN Resolution</h2><p className="mt-1 text-[13.5px] text-slate-500">Querying NIBSS for all bank accounts linked to BVN {bvn}...</p></>
              : <><h2 className="flex items-center gap-2 text-[17px] font-semibold text-slate-900"><CheckCircle2 className="h-4 w-4 text-emerald-600" />BVN Resolved — {BVN_ACCOUNTS.length} Accounts Found</h2><p className="mt-1 text-[13.5px] text-slate-500">Select the bank accounts to spool statements from. Accounts are sorted by activity level (most active first).</p></>}
          </div>
          {resolving ? (
            <div className="flex flex-col items-center py-14 text-center">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
              <div className="mt-3 text-[14px] font-medium text-slate-800">Resolving BVN...</div>
              <div className="text-[12.5px] text-slate-500">Connecting to NIBSS to enumerate linked bank accounts</div>
            </div>
          ) : (
            <div className="space-y-2.5 p-5">
              {BVN_ACCOUNTS.map((a) => {
                const on = selected.includes(a.bank);
                const [Icon, tile] = TYPE_TILE[a.type];
                return (
                  <label key={a.bank} className={cn('flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition', on ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200 hover:border-slate-300')}>
                    <input type="checkbox" checked={on} onChange={() => setSelected(on ? selected.filter((b) => b !== a.bank) : [...selected, a.bank])} className="h-4 w-4 accent-indigo-600" />
                    <span className={cn('grid h-9 w-9 place-items-center rounded-lg', tile)}><Icon className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5 text-[13.5px] font-medium text-slate-900">{a.bank}
                        <span className={cn('rounded px-1.5 text-[10.5px] font-medium', TYPE_PILL[a.type])}>{a.type}</span>
                        {a.dormant && <span className="rounded bg-slate-100 px-1.5 text-[10.5px] text-slate-500">Dormant</span>}
                      </span>
                      <span className="block text-[12px] text-slate-500">Account ••••{a.acct} · Last active {a.last}</span>
                    </span>
                    <span className="hidden w-24 items-center gap-2 sm:flex">
                      <span className="h-1.5 flex-1 rounded-full bg-slate-100"><span className={cn('block h-full rounded-full', a.activity >= 60 ? 'bg-emerald-500' : a.activity >= 30 ? 'bg-amber-500' : 'bg-slate-300')} style={{ width: `${a.activity}%` }} /></span>
                      <span className="w-8 text-right text-[11px] text-slate-500">{a.activity}%</span>
                    </span>
                  </label>
                );
              })}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <span className="text-[13px] text-slate-600"><strong className="text-slate-900">{selected.length}</strong> accounts selected for statement retrieval</span>
                <button disabled={!selected.length} onClick={spool} className="inline-flex h-9 items-center gap-1 rounded-lg bg-indigo-600 px-4 text-[13px] font-medium text-white hover:bg-indigo-700 disabled:opacity-40">Spool Statements<ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </Card>
      )}

      {step === 3 && (
        <Card className="overflow-hidden kk-fade">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="flex items-center gap-2 text-[17px] font-semibold text-slate-900"><Layers className="h-4 w-4 text-indigo-600" />Parallel Data Acquisition</h2>
            <p className="mt-1 text-[13.5px] text-slate-500">Retrieving data from all sources in parallel — bank statements, credit bureaus, and alternative data.</p>
          </div>
          <div className="space-y-5 p-5">
            {[
              ['bank', Landmark, 'Bank Statements', `· ${selected.length} accounts selected via BVN resolution`],
              ['bureau', ShieldCheck, 'Credit Bureau Report', '· Requires ≥ 2 of 3 bureaus'],
              ['alt', Smartphone, 'Alternative Data', '· MoBI360 SDK telemetry'],
            ].map(([g, Icon, t, s]) => (
              <div key={g}>
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[13.5px] font-semibold text-slate-900">
                  <Icon className={cn('h-4 w-4', g === 'bank' ? 'text-indigo-600' : g === 'bureau' ? 'text-violet-600' : 'text-emerald-600')} />{t}
                  <span className="text-[12px] font-normal text-slate-500">{s}</span>
                  {g === 'bureau' && bureauCount >= 2 && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600"><CheckCircle2 className="h-3 w-3" />{bureauCount}/3 retrieved</span>}
                </div>
                <div className="space-y-2">
                  {sources.filter((x) => x.group === g).map((x) => {
                    const st = src[x.id];
                    return (
                      <div key={x.id} className={cn('rounded-xl border p-3 transition', st === 'done' ? 'border-emerald-200' : st === 'failed' ? 'border-rose-200 bg-rose-50/30' : st === 'running' ? 'border-indigo-200 bg-indigo-50/20' : 'border-slate-200')}>
                        <div className="flex items-center gap-3">
                          <span className={cn('grid h-8 w-8 place-items-center rounded-lg', st === 'done' ? 'bg-emerald-50 text-emerald-600' : st === 'failed' ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-500')}>
                            {g === 'bank' ? <Landmark className="h-4 w-4" /> : g === 'bureau' ? <ShieldCheck className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                          </span>
                          <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium text-slate-900">{x.title}</span><span className="block text-[11.5px] text-slate-500">{x.sub}</span></span>
                          <StatusChip state={st} />
                        </div>
                        {st === 'failed' && (
                          <div className="mt-2 flex gap-2 pl-11">
                            <button onClick={() => retry(x.id)} className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11.5px] font-medium text-indigo-600"><RefreshCw className="h-3 w-3" />Try Again</button>
                            <button onClick={() => retry(x.id)} className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11.5px] font-medium text-amber-700"><Upload className="h-3 w-3" />Upload Manually</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {g === 'alt' && (() => {
                    const [tone, t2, s2] = MOBI_STATUS[mobi];
                    return (
                      <div className={cn('flex items-start gap-3 rounded-xl border p-3.5', tone === 'emerald' ? 'border-emerald-200 bg-emerald-50' : tone === 'amber' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50')}>
                        <CheckCircle2 className={cn('mt-0.5 h-5 w-5', tone === 'emerald' ? 'text-emerald-600' : tone === 'amber' ? 'text-amber-600' : 'text-slate-400')} />
                        <div><div className="text-[13.5px] font-semibold text-slate-900">{t2}</div><div className="text-[12px] text-slate-600">{s2}</div></div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
              {allDone
                ? <span className="inline-flex items-center gap-1.5 text-[13px] text-emerald-600"><CheckCircle2 className="h-4 w-4" />All sources retrieved — ready to run engines</span>
                : <span className="inline-flex items-center gap-1.5 text-[13px] text-indigo-600"><Loader2 className="h-4 w-4 animate-spin" />Retrieving sources in parallel...</span>}
              <button disabled={!allDone} onClick={() => { setResult(runCheck({ bvn, mobiStatus: mobi })); setStep(4); setStage(0); }} className="inline-flex h-9 items-center gap-1 rounded-lg bg-indigo-600 px-4 text-[13px] font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-50 disabled:text-indigo-300">Run Engines<ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </Card>
      )}

      {step === 4 && stage <= STAGES.length && (
        <Card className="overflow-hidden kk-fade">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-[17px] font-semibold text-slate-900">Running Assessment</h2>
            <p className="mt-1 text-[13.5px] text-slate-500">Five-stage pipeline — each stage must complete before the next begins.</p>
          </div>
          <div className="space-y-3 p-5">
            {STAGES.map(([t, s, Icon], i) => {
              const state = i < stage ? 'done' : i === stage ? 'run' : 'wait';
              return (
                <div key={t} className={cn('flex items-center gap-4 rounded-xl border p-4', state === 'done' ? 'border-emerald-200 bg-emerald-50/40' : state === 'run' ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-200 opacity-50')}>
                  <span className={cn('grid h-10 w-10 place-items-center rounded-xl', state === 'done' ? 'bg-emerald-500 text-white' : state === 'run' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400')}>
                    {state === 'done' ? <CheckCircle2 className="h-5 w-5" /> : state === 'run' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                  </span>
                  <span className="flex-1"><span className="block text-[14px] font-medium text-slate-900">{t}</span><span className="block text-[12px] text-slate-500">{s}</span></span>
                  {state === 'done' && <span className="text-[12px] font-medium text-emerald-600">Completed</span>}
                  {state === 'run' && <span className="text-[12px] font-medium text-indigo-600">Processing...</span>}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {step === 4 && stage > STAGES.length && (
        <Card className="overflow-hidden kk-fade">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-6 py-8 text-center text-white">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-white/15"><CheckCircle2 className="h-6 w-6" /></span>
            <div className="mt-3 text-[20px] font-semibold">Assessment Complete</div>
            <div className="text-[13px] text-indigo-100">KRK Signal synthesized across all available engines</div>
          </div>
          <div className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              KRK Signal
              <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 normal-case tracking-normal', full ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700')}><Check className="h-3 w-3" />{full ? 'FULL' : 'DEGRADED'}</span>
            </div>
            <div className="mt-2 font-mono text-[28px] font-bold tracking-tight text-slate-900">{r?.signal}</div>
            <div className="mt-2 flex items-center justify-center gap-3 text-[13px]">
              <span className="font-semibold text-slate-900">{r?.score}</span>{r && <TierBadge tier={r.tier} size="md" />}<span className="text-slate-500">Confidence {r?.confidence}%</span>
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button onClick={() => navigate(`/checks/${r.id}`)} className="inline-flex h-11 flex-1 items-center justify-center gap-1 rounded-xl bg-indigo-600 text-[14px] font-medium text-white hover:bg-indigo-700">View Full Report<ChevronRight className="h-4 w-4" /></button>
              <button onClick={() => navigate('/loan-queue')} className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-5 text-[14px] font-medium text-indigo-700 hover:bg-indigo-100"><Zap className="h-4 w-4" />Issue Offer</button>
            </div>
            <button onClick={() => { setStep(1); setBvn(''); setBank(false); setBureau(false); setStage(0); setResult(null); }} className="mt-3 text-[13px] text-slate-500 hover:text-slate-800">Start New Check</button>
          </div>
        </Card>
      )}

      <Dots step={step} />
    </div>
  );
}
