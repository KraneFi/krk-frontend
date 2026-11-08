import { useEffect, useState } from 'react';
import {
  Loader2, AlertCircle, Check, Upload, ArrowRight, KeyRound, Smartphone, Send,
  Copy, RotateCcw, Trash2, ExternalLink, Clock, ShieldCheck,
} from 'lucide-react';
import { IconTile, cn } from './ui.jsx';
import { kyb, account } from '../api/resources.js';
import { useApi, describeError } from '../api/useApi.js';
import { useSession } from '../api/auth.js';
import { useApp } from '../router.jsx';

const STATUS = {
  verified: { label: 'Verified', tone: 'bg-emerald-50 text-emerald-700', icon: Check },
  in_review: { label: 'In review', tone: 'bg-amber-50 text-amber-700', icon: Clock },
  in_progress: { label: 'In progress', tone: 'bg-indigo-50 text-indigo-700', icon: Clock },
  action_needed: { label: 'Action needed', tone: 'bg-rose-50 text-rose-600', icon: AlertCircle },
  expiring: { label: 'Expiring', tone: 'bg-amber-50 text-amber-700', icon: AlertCircle },
  not_started: { label: 'Not started', tone: 'bg-slate-100 text-slate-600', icon: Clock },
};

// The backend refuses edits once an item is verified or sitting in review.
const LOCKED = new Set(['verified', 'in_review']);

const ROUTE_TO_PATH = { policy: '/decision-engine', team: '/users', 'api:quickstart': '/api' };

const pretty = (v) => String(v).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const when = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

function Field({ label, hint, required, children }) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-medium text-slate-900">
        {label}{required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11.5px] text-slate-400">{hint}</span>}
    </label>
  );
}

const inputCls = 'mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13px] focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10';

function Primary({ busy, onClick, icon: Icon = ArrowRight, children, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={busy || disabled}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-[13px] font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}{children}
    </button>
  );
}

function Ghost({ busy, onClick, icon: Icon, children, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={busy || disabled}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon && <Icon className="h-4 w-4" />}{children}
    </button>
  );
}

export default function KybItemPanel({ itemKey, onClose, onChanged }) {
  const { notify, navigate } = useApp();
  const { user } = useSession();
  const detail = useApi(() => kyb.item(itemKey), [itemKey], { enabled: Boolean(itemKey) });
  const d = detail.data;

  const [values, setValues] = useState({});
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [director, setDirector] = useState({ name: '', email: '' });
  const [phone, setPhone] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [totp, setTotp] = useState(null);
  const [attest, setAttest] = useState({ explicit_consent: false, credit_use_only: false, lawful_basis: 'consent' });
  const [copied, setCopied] = useState(false);

  // Re-seed the form whenever the item is fetched or changes on the server.
  useEffect(() => {
    if (!d) return;
    setValues(d.draft || d.submitted || {});
    setFile(null);
    setCodeSent(false);
    setCode('');
    setTotp(null);
  }, [d?.key, d?.status, d?.updated_at]);

  useEffect(() => {
    if (user?.phone) setPhone(user.phone);
  }, [user?.phone]);

  const act = async (fn, msg) => {
    setBusy(true);
    try {
      const result = await fn();
      if (msg) notify(msg);
      onChanged?.();
      detail.refetch();
      return { ok: true, result };
    } catch (err) {
      notify(describeError(err));
      return { ok: false };
    } finally {
      setBusy(false);
    }
  };

  const submitForm = () => act(() => kyb.submitItem(itemKey, { fields: values }), 'Submitted');
  const saveDraft = () => act(() => kyb.saveDraft(itemKey, values), 'Draft saved');
  const uploadFile = () => act(() => kyb.uploadDocument(itemKey, file), 'Uploaded — review it, then submit');
  const submitDoc = () => act(() => kyb.submitItem(itemKey, {}), 'Submitted for review');
  const submitAttest = () => act(
    () => kyb.submitItem(itemKey, { attestation: attest }),
    'Attestation recorded',
  );

  const sendCode = async () => {
    const r = await act(() => account.sendPhoneCode(phone), 'Code sent — check your SMS');
    if (r.ok) setCodeSent(true);
  };
  const verifyCode = () => act(() => account.verifyPhone(code), 'Phone verified');
  const setupTotp = async () => {
    const r = await act(() => account.totpSetup(), 'Scan the secret in your authenticator app');
    if (r.ok) setTotp(r.result);
  };
  const enableTotp = () => act(() => account.totpEnable(code), 'Two-factor enabled');

  const sendLink = () => act(
    () => kyb.directors.send(director.name, director.email),
    'Identity link sent to the director',
  );
  const resendLink = () => act(() => kyb.directors.resend(d.director_link.id), 'New link sent — the old one no longer works');
  const revokeLink = () => act(() => kyb.directors.revoke(d.director_link.id), 'Link revoked');

  if (detail.loading && !d) {
    return (
      <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-5 text-[13px] text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />Loading {itemKey}…
      </div>
    );
  }
  if (detail.error) {
    return (
      <div className="flex items-start gap-2 border-t border-slate-100 bg-amber-50/60 px-5 py-4 text-[13px] text-amber-800">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{describeError(detail.error)}
        <button onClick={onClose} className="ml-auto text-[12.5px] font-medium text-amber-700 hover:underline">Close</button>
      </div>
    );
  }
  if (!d) return null;

  const st = STATUS[d.status] || { label: d.status, tone: 'bg-slate-100 text-slate-600', icon: Clock };
  const StatusIcon = st.icon;
  const editable = !LOCKED.has(d.status);
  const isField = d.fields.some((f) => f.name in (d.submitted || {}));

  return (
    <div className="border-t border-slate-200 bg-slate-50/50 px-5 py-5">
      <div className="flex flex-wrap items-start gap-3">
        <IconTile icon={ShieldCheck} size="sm" className="h-9 w-9 bg-indigo-50 text-indigo-600" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-semibold text-slate-900">{d.title}</span>
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', st.tone)}>
              <StatusIcon className="h-3 w-3" />{st.label}
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-500">{d.required_for}</span>
          </div>
          <div className="mt-1 max-w-2xl text-[12.5px] text-slate-500">{d.why}</div>
          {d.reason && d.status === 'action_needed' && (
            <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12.5px] text-rose-700">{d.reason}</div>
          )}
        </div>
        <button onClick={onClose} className="text-[12.5px] font-medium text-slate-500 hover:text-slate-800">Close</button>
      </div>

      {/* Already submitted / locked: show what the server has. */}
      {!editable && d.fields.length > 0 && (
        <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
          {d.fields.map((f) => (
            <div key={f.name}>
              <div className="text-[11px] uppercase tracking-wide text-slate-400">{f.label}</div>
              <div className="text-[13px] text-slate-800">
                {d.submitted?.[f.name] ? (f.choices ? pretty(d.submitted[f.name]) : d.submitted[f.name]) : '—'}
              </div>
            </div>
          ))}
        </div>
      )}

      {editable && d.kind === 'form' && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {d.fields.map((f) => (
              <Field key={f.name} label={f.label} required={f.required} hint={!f.choices && f.example ? `e.g. ${f.example}` : null}>
                {f.choices ? (
                  <select value={values[f.name] ?? ''} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} className={inputCls}>
                    <option value="">Choose…</option>
                    {f.choices.map((c) => <option key={c} value={c}>{pretty(c)}</option>)}
                  </select>
                ) : (
                  <input value={values[f.name] ?? ''} placeholder={f.example} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} className={inputCls} />
                )}
              </Field>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Primary busy={busy} onClick={submitForm} icon={Send}>Submit</Primary>
            <Ghost busy={busy} onClick={saveDraft}>Save draft</Ghost>
            {d.needs_review && <span className="text-[12px] text-slate-500">Goes to compliance review — usually 1–2 business days.</span>}
          </div>
        </div>
      )}

      {editable && d.kind === 'doc' && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          {(d.document || d.draft?.file_name) && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[12.5px] text-slate-700">
              <Check className="h-4 w-4 text-emerald-500" />
              <span className="flex-1">{(d.draft?.file_name) || d.pending_document?.file_name || d.document?.file_name}</span>
              <span className="text-[11.5px] text-slate-400">{d.draft?.file_name ? 'uploaded, not submitted' : 'current'}</span>
            </div>
          )}
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-3 py-3 text-[13px] text-slate-600 hover:border-indigo-300">
            <Upload className="h-4 w-4 text-indigo-500" />
            <span className="flex-1 truncate">{file ? file.name : 'Choose a PDF, JPG or PNG (max 10 MB)'}</span>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Ghost busy={busy} onClick={uploadFile} icon={Upload} disabled={!file}>Upload</Ghost>
            <Primary busy={busy} onClick={submitDoc} icon={Send} disabled={!d.draft?.document_id}>Submit for review</Primary>
            {d.status === 'expiring' && <span className="text-[12px] text-amber-700">The current document stays valid while a replacement is reviewed.</span>}
          </div>
        </div>
      )}

      {editable && d.kind === 'attest' && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="space-y-2.5">
            {[
              ['explicit_consent', 'Every borrower gives explicit consent before a check.'],
              ['credit_use_only', 'Borrower data is used only for credit assessment.'],
            ].map(([k, label]) => (
              <label key={k} className="flex items-start gap-2.5 text-[13px] text-slate-700">
                <input type="checkbox" checked={attest[k]} onChange={(e) => setAttest({ ...attest, [k]: e.target.checked })} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600" />
                {label}
              </label>
            ))}
            <Field label="Lawful basis under the NDPA">
              <select value={attest.lawful_basis} onChange={(e) => setAttest({ ...attest, lawful_basis: e.target.value })} className={inputCls}>
                <option value="consent">Consent</option>
                <option value="contract">Contract</option>
              </select>
            </Field>
          </div>
          <div className="mt-4">
            <Primary busy={busy} onClick={submitAttest} icon={Send} disabled={!attest.explicit_consent || !attest.credit_use_only}>Attest</Primary>
          </div>
        </div>
      )}

      {d.kind === 'director' && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          {d.director_link ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-slate-900">{d.director_link.director_name} · {d.director_link.director_email}</div>
                  <div className="text-[12px] text-slate-500">
                    Sent {when(d.director_link.sent_at)} · expires {when(d.director_link.expires_at)}
                    {d.director_link.completed_at && ` · completed ${when(d.director_link.completed_at)}`}
                  </div>
                </div>
                <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', d.director_link.completed_at ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
                  {d.director_link.completed_at ? 'Completed' : 'Awaiting director'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Ghost icon={copied ? Check : Copy} onClick={() => navigator.clipboard?.writeText(d.director_link.link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {})}>
                  {copied ? 'Copied' : 'Copy link'}
                </Ghost>
                <Ghost icon={ExternalLink} onClick={() => window.open(d.director_link.link, '_blank', 'noopener')}>Open</Ghost>
                <Ghost busy={busy} icon={RotateCcw} onClick={resendLink}>Resend</Ghost>
                <Ghost busy={busy} icon={Trash2} onClick={revokeLink}>Revoke</Ghost>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Director name" required>
                  <input value={director.name} onChange={(e) => setDirector({ ...director, name: e.target.value })} placeholder="Olumide Fashanu" className={inputCls} />
                </Field>
                <Field label="Director email" required hint="They complete BVN/NIN + selfie on their own phone.">
                  <input type="email" value={director.email} onChange={(e) => setDirector({ ...director, email: e.target.value })} placeholder="olumide@example.com" className={inputCls} />
                </Field>
              </div>
              <div className="mt-4">
                <Primary busy={busy} onClick={sendLink} icon={Send} disabled={!director.name || !director.email}>Send identity link</Primary>
              </div>
            </>
          )}
        </div>
      )}

      {d.kind === 'otp' && !LOCKED.has(d.status) && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Phone number" hint="Nigerian number, e.g. +234 801 234 5678.">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 801 234 5678" className={inputCls} />
            </Field>
            <Field label="Verification code" hint={codeSent ? 'Code sent — check your SMS.' : 'Send a code first, then enter it here.'}>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" className={inputCls} />
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Ghost busy={busy} onClick={sendCode} icon={Smartphone} disabled={!phone}>{codeSent ? 'Send another code' : 'Send code'}</Ghost>
            <Primary busy={busy} onClick={verifyCode} icon={Check} disabled={code.length < 6}>Verify</Primary>
            <span className="text-[12px] text-slate-500">Local dev: the SMS provider is the console — the code is written to the API log and <span className="font-mono">local/outbox</span>.</span>
          </div>
        </div>
      )}

      {d.kind === 'twofa' && !LOCKED.has(d.status) && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          {!totp ? (
            <Primary busy={busy} onClick={setupTotp} icon={KeyRound}>Set up authenticator</Primary>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                <div className="text-[11px] uppercase tracking-wide text-slate-400">Manual entry secret</div>
                <div className="mt-0.5 font-mono text-[13px] text-slate-900">{totp.secret_display}</div>
                <div className="mt-1 break-all font-mono text-[11px] text-slate-400">{totp.otpauth_uri}</div>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <Field label="6-digit code from the app">
                  <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" className={inputCls} />
                </Field>
                <Primary busy={busy} onClick={enableTotp} icon={Check} disabled={code.length < 6}>Enable</Primary>
              </div>
            </div>
          )}
        </div>
      )}

      {d.kind === 'link' && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1 text-[12.5px] text-slate-500">
              {d.status === 'verified' ? 'Complete.' : `Continue in the console${ROUTE_TO_PATH[d.route] ? '' : ' — no matching page for this step yet'}.`}
            </div>
            {ROUTE_TO_PATH[d.route] && (
              <Primary onClick={() => navigate(ROUTE_TO_PATH[d.route])} icon={ArrowRight}>Open</Primary>
            )}
          </div>
        </div>
      )}

      {d.kind === 'none' && !isField && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-[12.5px] text-slate-500">
          This item is derived from your account, not edited here.
        </div>
      )}

      {d.history?.length > 0 && (
        <div className="mt-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">History</div>
          <ol className="mt-2 space-y-2">
            {d.history.map((h, i) => (
              <li key={i} className="flex gap-2.5 text-[12.5px]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                <div className="min-w-0">
                  <div className="text-slate-700">{h.text}</div>
                  <div className="text-[11.5px] text-slate-400">
                    {when(h.at)}{h.actor_name ? ` · ${h.actor_name}` : ''}{h.to_status ? ` · ${pretty(h.to_status)}` : ''}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
