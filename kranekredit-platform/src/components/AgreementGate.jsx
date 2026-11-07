import { useState } from 'react'
import { ShieldCheck, Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import { account } from '../api/resources.js'
import { useApi, describeError } from '../api/useApi.js'

const fmt = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

function Spinner() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
    </div>
  )
}

function AcceptAgreements({ docs, onAccepted }) {
  const [checked, setChecked] = useState(() => new Set())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const allChecked = docs.length > 0 && checked.size === docs.length
  const toggle = (id) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      await account.acceptAgreements(docs.map((d) => d.id))
      onAccepted()
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-[560px]">
        <div className="mb-6 text-center">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-600/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-[20px] font-semibold text-slate-900">Before you continue</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Your organisation must accept the current legal agreements. We ask again whenever a version changes.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-3">
            {docs.map((doc) => (
              <label key={doc.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={checked.has(doc.id)}
                  onChange={() => toggle(doc.id)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[13.5px] font-medium text-slate-900">{doc.title}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10.5px] text-slate-600">v{doc.version}</span>
                  </span>
                  <span className="mt-0.5 block text-[12.5px] text-slate-500">{doc.summary}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-3 text-[11.5px] text-slate-400">
                    {doc.effective_at && <span>Effective {fmt(doc.effective_at)}</span>}
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-indigo-600 hover:underline">
                        Read document <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[12.5px] text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{describeError(error)}</span>
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={!allChecked || busy}
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-[14px] font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:bg-indigo-50 disabled:text-indigo-300"
          >
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" />Saving acceptance…</> : 'Accept and continue'}
          </button>
          <p className="mt-3 text-center text-[11.5px] text-slate-400">
            Acceptance is recorded against your user, with IP and browser, in the audit log.
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Blocks the console while the API reports pending legal agreements. Fails open
 * on a transport/API error so a broken agreements route cannot lock everyone out;
 * the acceptance is still enforced by the backend on the next successful load.
 */
export default function AgreementGate({ children }) {
  const pending = useApi(() => account.pendingAgreements(), [])
  const [accepted, setAccepted] = useState(false)

  if (accepted) return children
  if (pending.loading) return <Spinner />
  if (pending.error) return children
  if (!pending.data?.length) return children
  return <AcceptAgreements docs={pending.data} onAccepted={() => setAccepted(true)} />
}
