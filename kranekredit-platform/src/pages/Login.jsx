import { useState } from 'react'
import { Lock, Mail, Loader2, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react'
import { login, loginMfa } from '../api/auth.js'
import { describeError } from '../api/useApi.js'
import { API_BASE, LIVE } from '../config.js'

function Field({ id, label, type, value, onChange, icon: Icon, autoFocus }) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-[13px] font-medium text-slate-900">{label}</span>
      <div className="relative mt-1.5">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id={id} type={type} value={value} autoFocus={autoFocus} autoComplete={type === 'password' ? 'current-password' : 'username'}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
        />
      </div>
    </label>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [challenge, setChallenge] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const result = await login(email.trim(), password)
      if (result.mfaRequired) setChallenge(result.challengeToken)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const submitMfa = async (e) => {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      await loginMfa(challenge, code.trim())
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 text-center">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-600/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-[20px] font-semibold text-slate-900">KraneKredit Intelligence</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            {challenge ? 'Enter the code from your authenticator app' : 'Sign in to the lender console'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {!challenge ? (
            <form onSubmit={submit} className="space-y-4">
              <Field id="email" label="Work email" type="email" value={email} onChange={setEmail} icon={Mail} autoFocus />
              <Field id="password" label="Password" type="password" value={password} onChange={setPassword} icon={Lock} />
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[12.5px] text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{describeError(error)}</span>
                </div>
              )}
              <button type="submit" disabled={busy || !email || !password}
                className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-[14px] font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:bg-indigo-50 disabled:text-indigo-300">
                {busy ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in…</> : <>Sign in<ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={submitMfa} className="space-y-4">
              <Field id="code" label="Authentication code" type="text" value={code} onChange={setCode} icon={ShieldCheck} autoFocus />
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[12.5px] text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{describeError(error)}</span>
                </div>
              )}
              <button type="submit" disabled={busy || code.length < 6}
                className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-[14px] font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:bg-indigo-50 disabled:text-indigo-300">
                {busy ? <><Loader2 className="h-4 w-4 animate-spin" />Verifying…</> : 'Verify'}
              </button>
              <button type="button" onClick={() => { setChallenge(null); setCode(''); setError(null) }} className="w-full text-[12.5px] text-slate-500 hover:text-slate-800">
                Back to sign in
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-[11.5px] text-slate-400">
          {LIVE ? <>API <span className="font-mono text-slate-500">{API_BASE}</span></> : 'Mock data mode — no API calls'}
        </p>
      </div>
    </div>
  )
}
