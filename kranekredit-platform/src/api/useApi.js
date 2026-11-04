import { useEffect, useRef, useState } from 'react'

// Runs an async loader and tracks loading/error state. Aborts state writes after
// unmount so a slow response cannot resurrect a unmounted page.
export function useApi(loader, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, loading: enabled, error: null })
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null })
      return
    }
    let alive = true
    setState((s) => ({ ...s, loading: true, error: null }))
    Promise.resolve()
      .then(loader)
      .then((data) => { if (alive && mounted.current) setState({ data, loading: false, error: null }) })
      .catch((error) => { if (alive && mounted.current) setState({ data: null, loading: false, error }) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}

// Friendly message for the errors this app actually hits.
export function describeError(error) {
  if (!error) return null
  if (error.code === 'not_an_org_member') return 'This account is not a member of a lender organisation.'
  if (error.code === 'not_a_lender_user') return 'Sign up as a lender to create an organisation.'
  if (error.code === 'email_not_verified') return 'Verify your email address first.'
  if (error.status === 401) return 'Your session expired — sign in again.'
  if (error.status === 403) return error.detail || 'You do not have permission to do this.'
  if (error.status === 404) return 'Not set up yet.'
  if (error.status >= 500) return 'The API failed to respond. It may be unable to reach its database.'
  return error.detail || error.message || 'Something went wrong.'
}
