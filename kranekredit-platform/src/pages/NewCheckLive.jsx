import { useState } from 'react';
import {
  Loader2, Upload, Sparkles, ShieldCheck, AlertCircle, ArrowRight, FileText, CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, IconTile, cn } from '../components/ui.jsx';
import { useApp } from '../router.jsx';
import { useSession } from '../api/auth.js';
import { describeError } from '../api/useApi.js';
import {
  ensureScoringKey, demo, identity, bankStatements, creditReports, scores,
  saveCheck, toCheckRecord,
} from '../api/scoring.js';

const inputCls = 'mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13px] focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10';

const PROFILES = [
  ['prime', 'Prime', 'Strong salary, low DTI, deep buffer'],
  ['healthy', 'Healthy', 'Stable income, moderate commitments'],
  ['stretched', 'Stretched', 'High DTI, thin balance days'],
  ['distressed', 'Distressed', 'Irregular income, delinquency signals'],
];

const BANKS = ['GTBANK', 'ACCESS_BANK', 'FIRST_BANK', 'UBA', 'ZENITH_BANK', 'KUDA', 'WEMA_BANK', 'STERLING_BANK', 'MONIEPOINT', 'OPAY'];
const BUREAUS = [['first_central', 'FirstCentral'], ['crc', 'CRC'], ['credit_registry', 'CreditRegistry'], ['custom_pdf', 'Other PDF']];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForExtraction(get, tries = 40) {
  for (let i = 0; i < tries; i += 1) {
    const doc = await get();
    const status = String(doc.ingestion_status || doc.extract_status || '').toLowerCase();
    if (status === 'completed' || status === 'success') return doc;
    if (status === 'failed') throw new Error('Document extraction failed — check the file and try again.');
    await sleep(3000);
  }
  throw new Error('Extraction is still running. Try again in a minute.');
}

export default function NewCheckLive() {
  const { user } = useSession();
  const { notify, navigate } = useApp();
  const [mode, setMode] = useState('sample');
  const [profile, setProfile] = useState('healthy');
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', bvn: '' });
  const [bank, setBank] = useState('GTBANK');
  const [bureau, setBureau] = useState('first_central');
  const [statement, setStatement] = useState(null);
  const [report, setReport] = useState(null);
  const [step, setStep] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const tenantId = user?.tenant_id;
  const displayName = [form.first_name, form.last_name].filter(Boolean).join(' ') || `Sample · ${profile}`;

  const finish = (composite, extra) => {
    const record = toCheckRecord(composite, {
      name: displayName,
      phone: form.phone || null,
      bvn: form.bvn || null,
    }, extra);
    saveCheck(tenantId, record);
    notify(`Check complete — ${record.krk_signal}`);
    navigate(`/checks/${record.id}`);
  };

  const runSample = async () => {
    setStep('Seeding the sample profile…');
    const seeded = await demo.seedSample(profile);
    setStep('Running the Main Thinker engine…');
    const composite = await scores.fromSources({
      individual_id: seeded.individual_id,
      bank_statement_analysis_ids: seeded.bank_statement_analysis_id ? [seeded.bank_statement_analysis_id] : [],
      credit_report_ids: seeded.credit_report_id ? [seeded.credit_report_id] : [],
      auto_discover: false,
    });
    finish(composite, {
      source: 'sample',
      profile_type: profile,
      analysis_id: seeded.bank_statement_analysis_id || null,
      report_id: seeded.credit_report_id || null,
    });
  };

  const runUpload = async () => {
    if (!statement) throw new Error('Choose a bank statement to upload.');
    setStep('Registering the borrower…');
    const individual = await identity.create({
      first_name: form.first_name || null,
      last_name: form.last_name || null,
      phone: form.phone || null,
      bvn: form.bvn || null,
    });

    setStep('Uploading the bank statement…');
    const doc = await bankStatements.upload(individual.id, statement, bank);

    let reportId = null;
    if (report) {
      setStep('Uploading the credit report…');
      const uploaded = await creditReports.upload(individual.id, report, bureau);
      reportId = uploaded.source_id;
      setStep('Waiting for the credit report extraction…');
      await waitForExtraction(() => creditReports.get(reportId));
    }

    setStep('Waiting for the statement extraction…');
    await waitForExtraction(() => bankStatements.get(doc.source_id));

    setStep('Scoring the statement…');
    const analysis = await bankStatements.analyse([doc.source_id], individual.id);

    setStep('Running the Main Thinker engine…');
    const composite = await scores.fromSources({
      individual_id: individual.id,
      bank_statement_analysis_ids: [analysis.id],
      credit_report_ids: reportId ? [reportId] : [],
      auto_discover: false,
    });
    finish(composite, { source: 'upload', analysis_id: analysis.id, report_id: reportId });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (!tenantId) throw new Error('This account has no organisation yet.');
      await ensureScoringKey(tenantId);
      if (mode === 'sample') await runSample();
      else await runUpload();
    } catch (err) {
      setError(err?.message || describeError(err));
      setStep(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <Card className="p-6">
        <CardHeader
          title="New Check"
          sub="Create a borrower, attach the data sources, and run the Main Thinker composite"
          icon={ShieldCheck}
        />

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {[
            ['sample', 'Sample profile', 'Synthetic dockets — no upload needed', Sparkles],
            ['upload', 'Upload documents', 'Real statement + optional credit report', Upload],
          ].map(([key, title, sub, Icon]) => (
            <button key={key} type="button" onClick={() => setMode(key)} disabled={busy}
              className={cn('flex items-start gap-3 rounded-xl border p-3.5 text-left transition', mode === key ? 'border-indigo-300 bg-indigo-50/60 ring-1 ring-indigo-200' : 'border-slate-200 hover:bg-slate-50')}>
              <IconTile icon={Icon} size="sm" className={mode === key ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'} />
              <div>
                <div className="text-[13.5px] font-semibold text-slate-900">{title}</div>
                <div className="text-[12px] text-slate-500">{sub}</div>
              </div>
            </button>
          ))}
        </div>

        <form onSubmit={submit}>
          {mode === 'sample' ? (
            <div className="mt-5">
              <span className="text-[12.5px] font-medium text-slate-900">Profile</span>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {PROFILES.map(([key, label, sub]) => (
                  <button key={key} type="button" onClick={() => setProfile(key)} disabled={busy}
                    className={cn('rounded-xl border px-3 py-2.5 text-left', profile === key ? 'border-indigo-300 bg-indigo-50/60' : 'border-slate-200 hover:bg-slate-50')}>
                    <div className="text-[13px] font-medium text-slate-900">{label}</div>
                    <div className="text-[11.5px] text-slate-500">{sub}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {[['first_name', 'First name'], ['last_name', 'Last name'], ['phone', 'Phone'], ['bvn', 'BVN (11 digits)']].map(([k, label]) => (
                  <label key={k} className="block">
                    <span className="text-[12.5px] font-medium text-slate-900">{label}</span>
                    <input value={form[k]} onChange={(e) => set(k, e.target.value)} className={inputCls} />
                  </label>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="block">
                  <span className="text-[12.5px] font-medium text-slate-900">Bank statement</span>
                  <label className="mt-1.5 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-3 py-2.5 text-[13px] text-slate-600 hover:border-indigo-300">
                    <FileText className="h-4 w-4 text-indigo-500" />
                    <span className="flex-1 truncate">{statement ? statement.name : 'PDF or JSON'}</span>
                    <input type="file" accept=".pdf,.json" className="hidden" onChange={(e) => setStatement(e.target.files?.[0] || null)} />
                  </label>
                </div>
                <label className="block">
                  <span className="text-[12.5px] font-medium text-slate-900">Bank</span>
                  <select value={bank} onChange={(e) => setBank(e.target.value)} className={inputCls}>
                    {BANKS.map((b) => <option key={b} value={b}>{b.replace(/_/g, ' ')}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="block">
                  <span className="text-[12.5px] font-medium text-slate-900">Credit report <span className="font-normal text-slate-400">(optional)</span></span>
                  <label className="mt-1.5 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-3 py-2.5 text-[13px] text-slate-600 hover:border-indigo-300">
                    <FileText className="h-4 w-4 text-violet-500" />
                    <span className="flex-1 truncate">{report ? report.name : 'PDF'}</span>
                    <input type="file" accept=".pdf" className="hidden" onChange={(e) => setReport(e.target.files?.[0] || null)} />
                  </label>
                </div>
                <label className="block">
                  <span className="text-[12.5px] font-medium text-slate-900">Bureau</span>
                  <select value={bureau} onChange={(e) => setBureau(e.target.value)} className={inputCls}>
                    {BUREAUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </label>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12.5px] text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={busy}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-[13.5px] font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {busy ? 'Running…' : 'Run check'}
            </button>
            {step && <span className="text-[12.5px] text-slate-500">{step}</span>}
          </div>
        </form>
      </Card>

      <div className="space-y-5">
        <Card className="p-5">
          <CardHeader title="How this runs" icon={Sparkles} />
          <ol className="mt-3 space-y-2.5 text-[12.5px] text-slate-600">
            {[
              'Create the borrower (or seed a synthetic profile).',
              'Attach a bank statement and, optionally, a credit report.',
              'Wait for extraction, then analyse the statement.',
              'POST /scores/composite/from-sources → Main Thinker.',
              'Store the resulting KRK signal in this browser.',
            ].map((t, i) => (
              <li key={t} className="flex gap-2.5">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-indigo-50 text-[11px] font-semibold text-indigo-600">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="p-5">
          <div className="flex items-start gap-2.5 text-[12.5px] text-slate-600">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <p>
              Scoring needs a tenant API key. This browser session mints its own sandbox key on the
              first run and keeps it in <span className="font-mono">sessionStorage</span> — it dies
              with the tab and can be revoked from <strong>API &amp; Docs</strong>. Nothing is baked
              into the bundle, but a production build should proxy these calls server-side.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
