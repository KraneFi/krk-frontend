// Headless smoke: inject a session, load a route, report visible text + console errors.
// Usage: node scripts/smoke.mjs <path> [--token=...] [--refresh=...]
const [, , route = '/', ...flags] = process.argv
const arg = (k) => {
  const flag = flags.find((f) => f.startsWith(`--${k}=`))
  return flag ? flag.slice(k.length + 3) : undefined
}
const token = arg('token') || ''
const refresh = arg('refresh') || ''
const apiKey = arg('key') || ''
const base = 'http://localhost:5173'

const targets = await (await fetch('http://127.0.0.1:9222/json')).json()
const page = targets.find((t) => t.type === 'page')
const ws = new WebSocket(page.webSocketDebuggerUrl)
let id = 0
const pending = new Map()
const errors = []

ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data)
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id) }
  if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description || ''))
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '))
})

const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

await new Promise((r) => ws.addEventListener('open', r))
await send('Runtime.enable')
await send('Page.enable')

// Seed the session before the app boots.
await send('Page.navigate', { url: `${base}/` })
await sleep(1200)
await send('Runtime.evaluate', {
  expression: `localStorage.setItem('kk-access-token', ${JSON.stringify(token)}); localStorage.setItem('kk-refresh-token', ${JSON.stringify(refresh)});${apiKey ? ` sessionStorage.setItem('kk-scoring-key', ${JSON.stringify(apiKey)});` : ''}`,
})

await send('Page.navigate', { url: `${base}${route}` })
await sleep(3000)

// The app uses an in-memory router: navigate by clicking the sidebar link.
const navLabel = arg('nav')
if (navLabel) {
  await send('Runtime.evaluate', {
    expression: `(() => { const a = [...document.querySelectorAll('aside a')].find(x => x.textContent.trim() === ${JSON.stringify(navLabel)}); if (a) a.click(); return !!a })()`,
    returnByValue: true,
  })
  await sleep(2500)
}

// Click any button/tab by its visible label, for second-level navigation.
// `--nth=1` picks the second match (lists repeat "Start").
const clickLabel = arg('click')
const nth = Number(arg('nth') || 0)
if (clickLabel) {
  await send('Runtime.evaluate', {
    expression: `(() => { const b = [...document.querySelectorAll('button, a')].filter(x => x.textContent.trim() === ${JSON.stringify(clickLabel)})[${nth}]; if (b) b.click(); return !!b })()`,
    returnByValue: true,
  })
  await sleep(2500)
  const extra = arg('click2')
  if (extra) {
    await send('Runtime.evaluate', {
      expression: `(() => { const b = [...document.querySelectorAll('button, a')].find(x => x.textContent.trim() === ${JSON.stringify(extra)}); if (b) b.click(); return !!b })()`,
      returnByValue: true,
    })
    await sleep(3000)
  }
}

// Run arbitrary setup (fill inputs, click submit) after the navigation settles.
const script = arg('eval')
if (script) {
  const out = await send('Runtime.evaluate', {
    expression: `(async () => { ${script} })()`,
    returnByValue: true,
    awaitPromise: true,
  })
  if (out.exceptionDetails) console.log('--- eval error:', out.exceptionDetails.text)
  else if (out.result?.value !== undefined) console.log('--- eval:', JSON.stringify(out.result.value))
  await sleep(3000)
}

const { result } = await send('Runtime.evaluate', {
  expression: `document.body.innerText.replace(/\\n{2,}/g, '\\n').slice(0, 1600)`,
  returnByValue: true,
})

console.log('--- route:', route)
console.log(result.value)
console.log('--- console errors:', errors.length ? errors.slice(0, 5).join(' | ') : 'none')
ws.close()
process.exit(0)
