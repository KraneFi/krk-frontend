# Krane — Frontend ↔ Backend Wiring Plan (v2)

**Date:** 2026-11-01
**Repos:** `~/Documents/krane/krk-frontend/kranekredit-platform` · `~/Documents/krane/krk-backend`
**Status:** Ready for review — supersedes `krane-frontend-backend-integration.md` (2026-10-21)
**Backend base:** `staging` @ `d483aaf` (pulled 2026-11-02; see §13 for what this added)

**What changed since the 2026-10-21 draft:** decisions §0 carried forward unchanged. This
revision adds a file-level review of both codebases, corrects two factual errors in the
earlier draft (§5.1 weights, §5.2 tier/debt/confidence semantics), and replaces the
milestone list with an executable phase plan keyed to the locked decisions.

---

## 0. Decisions locked (carried forward)

| # | Decision | Choice |
|---|---|---|
| 1 | How the frontend reaches the backend | **Thin BFF / proxy** — credentials stay server-side, responses shaped into the frontend's existing model |
| 2 | Modules the backend lacks (Decision Engine, Loan Queue, Servicing) | **Mock now, build later** — keep seeded mock behind a flag, mark pages "not yet wired" |
| 3 | Canonical score/tier scale | **Map in the adapter** — backend stays 0–1000 / T1–T6; BFF remaps to the frontend's 300–900 / T0–T5 |
| 4 | This document | Saved to `/Users/zedd/.opencode/plan/` |

**Correction to decision 3:** the backend scale is **0–1000**, and `TIER_RANGES` in the
frontend assume a 300–900 scale. Remapping 0–1000 → 300–900 is *lossy and monotonic*;
it will also produce out-of-range values for scores below 300 (`MINIMAL`/`NO_SCORE`
outcomes can be `KRK-0-…`). Two options, both acceptable: clamp+map (`300 + score×0.6`),
or keep 0–1000 and change only the UI copy. **This needs a call before Phase 1.**

---

## 1. Current state

### 1.1 Frontend — a demo shell, not a client

| Fact | Evidence |
|---|---|
| **Zero network calls** | no `fetch`, no `axios`, no `import.meta.env` anywhere in `src/` |
| **One data seam** | `src/data/DataContext.jsx` (55 LOC) calls `generateData(seed)` and spreads the result into context; 13 pages read named collections off `useData()` |
| **Report model is generated** | `src/data/gen-check.js` (419 LOC) derives one internally consistent report per check; `report.deep.{bs360,bureau,mobi}` drives `src/deep/*` (~1,000 LOC) |
| **No auth** | no login page, no token storage; sidebar user is hardcoded `Dammy Krane` in `src/components/Layout.jsx` |
| **Wizard is theatre** | `src/pages/NewCheck.jsx` drives every step with `setTimeout`; **Run Engines** → `runCheck()` returns a locally synthesized report |
| **Platform pages are fiction** | `ApiDocs.jsx` `curl` posts to `/v1/checks` (does not exist); `Users.jsx`, `Compliance.jsx`, `Settings.jsx`, `DecisionEngine.jsx`, `LoanQueue.jsx`, `Servicing.jsx` are hardcoded arrays |
| **No `.gitignore`** | `node_modules/` is untracked but unignored at the `krk-frontend` repo root |

Because all state flows through one context object, wiring is a **provider swap plus an
adapter layer** — not a page rewrite. `DataContext` is the single seam.

### 1.2 Backend — a scoring API, not a lender console

FastAPI, prefix `/api/v1` (`API_V1_PREFIX`), CORS `*`, `/openapi.json` and `/health`
available. 16 modules: `ai, auth, bank_statements, billing, credit_report, identity, meta,
patterns, persona, scoring, telemetry, tenants, transactions, upload, webhooks`.

**No** `loans`, `servicing`, or `policy` module exists (`src/modules/` has none; no
`LoanModel`/`DecisionPolicy` symbols in `src/`).

**The core fit:** `CompositeScoreResponse`
(`src/modules/scoring/application/schemas.py:98`) is the only backend payload that
resembles the frontend's `report`:

```
score, risk_code, debt_code, tier_code, krk_signal, outcome, confidence,
engine_contributions[], flags[], reason_codes[], dockets_used[], metadata, recommendation
```

### 1.3 Repo state blocker

The backend is on `feat/sdk-worker-staging` with ~20 files of real uncommitted work
(asyncpg naive-UTC fixes in `core/audit.py` and `billing/.../repository.py`, JWT `jti`,
pending-credit-report creation, persona `individual_id` fix, async-scoring status endpoint)
plus 463 mode-only (644→755) churn and 6 untracked files. Local `staging` is 30 commits
behind `origin/staging`. **Settle this before building on the branch** — see §11.

---

## 2. Endpoint map (frontend feature → backend)

All paths under `/api/v1` unless noted. Auth column is what the *backend* requires today.

| Frontend feature | Backend endpoint(s) | Auth | Fit |
|---|---|---|---|
| **Auth** | `POST /auth/login` (now `TokenResponse \| MfaChallengeResponse`) · `/auth/login/mfa` · `/auth/signup` · `/auth/refresh` · `/auth/logout` · `GET /auth/me` · `/auth/mfa/totp/*` · `/auth/sso/{provider}/*` · `/legal/agreements/current` | JWT | ✅ **two-branch login** |
| **Demo bootstrap** | `POST /demo/quick-login` → `{tokens, user, individual_id}` | none | ✅ fastest path to a live demo |
| **Demo seed** | `POST /demo/seed-sample` (`healthy\|prime\|distressed`) | JWT | ✅ |
| **Check Detail** | `POST /scores/individuals/{id}/composite` · `POST /scores/composite/from-sources` · `GET /scores/{id}/explain` | **X-API-Key** | ✅ core |
| **Checks list** | *(none)* — only `GET /scores/individual/{id}` per individual | — | ❌ needs new endpoint |
| New Check: identity | `POST /identity/individuals` · `GET /identity/lookup?bvn=` · `/verify` · `/kyc` | **X-API-Key** | ✅ |
| New Check: statements | `POST /bank-statements/upload` (multipart, `provider`, `extract`) · `GET /bank-statements/` · `POST /bank-statements/{...}/analysis` | JWT | ✅ |
| New Check: bureau | `POST /credit-reports/upload` · `GET /credit-reports/{id}` · `/individual/{id}` | JWT | ✅ |
| New Check: async poll | `POST /scores` (`mode=ASYNC`) · `GET /scores/requests/{request_id}` | **X-API-Key** | ✅ |
| Deep: BS360 | `GET /demo/bank-statement/granular/{analysis_id}` | JWT | ⚠️ under `/demo`, should be promoted |
| Deep: Bureau | `GET /credit-reports/{id}` → `metrics` + analysis service | JWT | ⚠️ partial |
| Deep: MoBI360 | `GET /telemetry/devices/{device_id}/signals` | JWT | ⚠️ SMS only |
| Deep: Main Thinker | `CompositeScoreResponse.{engine_contributions,flags,reason_codes}` | X-API-Key | ✅ |
| API & Docs | `GET/POST /tenants/{id}/keys` · `DELETE .../{key_id}` · `GET/POST /webhooks/endpoints` · `GET .../deliveries` · `GET /openapi.json` | JWT | ✅ (no request-log endpoint) |
| Settings | `GET/PATCH /tenants/{id}` · `GET /billing/usage` · `/invoices[/{id}]` | JWT | ✅ |
| Users | `GET /team/members` · `PATCH/DELETE /team/members/{user_id}` · `GET/POST /team/invites` · `POST .../resend` · `DELETE .../{invite_id}` · `GET /auth/me` | JWT | ✅ **now live** |
| Compliance | `GET /kyb/current` · `/current/verification` (+`/history`, `/{key}`) · `POST .../documents` · `POST .../submit` · `POST /current/directors/links` · `GET /kyb/current/access` · admin `GET /kyb/verification/queue` | JWT | ✅ **KYB now live**; retention/export still absent |
| Dashboard | *(none)* | — | ❌ needs aggregates |
| **Decision Engine** | ❌ none | — | ❌ |
| **Loan Queue** | ❌ none | — | ❌ |
| **Servicing** | ❌ none | — | ❌ |
| Health | `GET /health` (no prefix) | none | ✅ |

**Auth split is real and per-route.** `authenticate_user` (JWT Bearer,
`src/modules/auth/api/dependencies.py`) guards uploads, credit reports, persona, demo, AI,
telemetry. `get_current_tenant` (`X-API-Key`, `src/modules/tenants/api/dependencies.py`)
guards scoring, identity and tenants. The BFF must hold **both** credentials.

**`dev-bypass` escape hatch** — `get_current_tenant` accepts `X-API-Key: dev-bypass` and
returns `tenant_id=None`. Works for single-tenant demos; produce unscoped/empty results in
a multi-tenant query. Fine for a demo, must go before any pilot.

---

## 3. Contract mismatches (verified in code)

These silently produce wrong UI. Each is a required adapter rule or a product decision.

| # | Frontend | Backend | Consequence / action |
|---|---|---|---|
| 1 | score **300–900** (`TIER_RANGES`, card copy "300–900 range") | **0–1000** (`_to_1000_scale`: `score_100 × 10`) | Remap in adapter or fix UI copy (decision 3) |
| 2 | tiers **T0–T5** | **T1–T6**, no T0 (`_tier_code`: ≥900 T6 … <500 T1) | `TierBadge` needs a 6th tier; T0 unreachable |
| 3 | debt **D1–D5** | **D0**–D5 (`D0` when DTI == 0) | `D0` renders blank |
| 4 | `confidence: 82` (%) | **0.0–1.0**, and the router returns `round(confidence, 4)` → `0.8231` | UI shows "Confidence 0.8231%" — multiply by 100 |
| 5 | `label: FULL/DEGRADED` = *MoBI360 present → weight redistributed* | `outcome: FULL/DEGRADED/MINIMAL/NO_SCORE` = **engine count** (3/2/1/0) | Same words, different meaning: a 2-engine score is "DEGRADED" regardless of *which* engine is missing |
| 6 | `decision: Auto-Approve / Auto-Decline / Manual Review / Refer` (policy v4.2) | **No decision exists.** `outcome` is not an approval; `recommendation` is AI prose | `DecisionBadge`, Decision column, `AUTO_RATE`, `POLICY_PERF`, `DECLINE_REASONS`, Decision Engine page have **no source**. Product gap, not a mapping bug. |
| 7 | engine keys `bs360` / `bureau` / `mobi` | `bank_statement` / `credit_bureau` / `alternative_data` | Rename in adapter |
| 8 | flag levels `HIGH/MEDIUM/LOW` | `severity` `INFO/WARNING/HIGH/CRITICAL` | Map; `CRITICAL` has no UI treatment |
| 9 | `positive[]` + `adverse[]` as `[code, text]` pairs | flat `reason_codes[]` with `direction` | Split by direction; inspect vocabulary per response |
| 10 | integrity `Clear/Review/High Risk` + `authenticity` + 4 checks | no statement-integrity model in composite; only `balance_integrity_score` in `metrics_snapshot` | "Statement Integrity" card cannot be fully backed |
| 11 | `prequalified[]`, `policy: v4.2`, `pipeline[]` timings, `lineage[]`, `facts.rule` | none | Keep mock / derive / omit — must not be implied as live |
| 12 | MoBI deep channels (Email, App inventory, WhatsApp, Device) | `/telemetry/.../signals` = SMS only | Label partial |

### 3.1 Weight redistribution is **not** identical (correction to v1 §4)

- Frontend (`gen-check.js:81`): `mobi` absent → `{ bs: 0.70, bu: 0.30, mo: 0 }`.
- Backend (`main_thinker.py:9,136-139`): `BASE_WEIGHTS = {bank 0.45, bureau 0.30, alt 0.25}`;
  alt absent → bank `0.45 + 0.25×0.70 = 0.625`, bureau `0.30 + 0.25×0.30 = 0.375`
  → **62.5 / 37.5**.
- Same base weights (45/30/25) — **different degraded path**. The UI's "70% (redistributed)"
  label is wrong against the backend. Adapter must read the real weights from
  `engine_contributions[].weight`, never hardcode.

### 3.2 Reason codes and flags are the honest parts of the contract

`reason_codes[].direction`, `flags[].severity`, `dockets_used[]` and `krk_signal` are
genuinely derivable from the composite and should be rendered **as returned**, not
reinterpreted — they are the only audit-safe explanation surface the backend has.

---

## 4. Target architecture

```
┌─────────────────────────┐        ┌──────────────────────────┐        ┌────────────────────┐
│  krk-frontend (browser) │        │  krk-bff  (Node proxy)   │        │  krk-backend       │
│  React/Vite console     │ fetch  │  • injects X-API-Key+JWT │ HTTP   │  FastAPI /api/v1   │
│  useData() unchanged ───┼───────▶│  • shapes → report model │───────▶│  Postgres + Redis  │
│                         │ /bff/* │  • remaps score/tier     │        │  + ARQ worker      │
│                         │        │  • derives decision      │        └────────────────────┘
│                         │        │  • normalizes errors     │
└─────────────────────────┘        └──────────────────────────┘
```

Rationale (unchanged): the `krane_live_*` key must never reach a browser; shaping
composite → `report` is substantial; the pattern already exists in
`krk-backend/sdk/prototype/bridge-server.mjs`.

**Reuse option — evaluated.** `krk-backend/sdk/typescript` (`@krane/sdk` v0.2.0, `dist/`
already built) already implements the dual-auth model, 401→refresh→retry, retries and
pagination, with resources `auth, tenants, identity, scoring, bankStatements,
creditReports, telemetry, persona, ai, billing, webhooks`. It has **no** `demo` resource.
If the BFF is built in Node, use this SDK inside it instead of hand-rolling transport.

**Pages do not change.** Only `DataContext` is re-implemented behind the same interface.

---

## 5. Adapter field map — `CompositeScoreResponse` → frontend `report`

| `report` field | Backend source | Transform |
|---|---|---|
| `score` | `score` (0–1000) | remap per decision 3 |
| `signal` | `krk_signal` | direct (`KRK-{score}-{risk}-{debt}-{tier}`) |
| `tier` | `tier_code` (T1–T6) | remap T1–T6 → T0–T5 |
| `risk` / `debt` | `risk_code` / `debt_code` | direct; handle `D0` |
| `confidence` | `confidence` (0–1) | `Math.round(x*100)` |
| `decision` | *(none)* | **derive in BFF** (decision 6) |
| `label` | `outcome` | direct, but re-document semantics (mismatch 5) |
| `engines.bs360` | `engine_contributions["bank_statement"]` | rename |
| `engines.bureau` | `engine_contributions["credit_bureau"]` | rename |
| `engines.mobi` | `engine_contributions["alternative_data"]` | rename |
| `engines.*.weight` | `engine_contributions[].weight` | **use returned value**, never hardcode |
| `flags[]` | `flags[]` (`severity,source,code,message`) | map severity |
| `positive[]` / `adverse[]` | `reason_codes[]` by `direction` | split, `[code, message]` |
| `recommendation` | `recommendation` | direct |
| `integrity` | `metrics_snapshot.balance_integrity_score` | partial — label as such |
| `deep.bs360` | `/demo/bank-statement/granular/{id}` `intelligence` | shape |
| `deep.bureau` | credit-report `metrics` + analysis service | shape |
| `deep.mobi` | telemetry `signals` | shape, partial |
| `prequalified[]`, `policy`, `pipeline[]`, `lineage[]` | ❌ none | keep mock, visibly labelled |

**Backend analyzers already match `deep.bs360` closely** — `IncomeEarningMetrics`,
`SpendingConsumptionMetrics`, `BalanceLiquidityMetrics`, `ObligationsDTIMetrics`,
`BehaviouralPatternsMetrics` in
`src/modules/bank_statements/application/services/` map onto `deep.bs360.{income,
spending,obligations,balance,timing}`. Phase 3 is mostly shaping, not modelling.

---

## 6. Phases

### M0 — Stack up + repo hygiene
- Backend: settle the dirty tree (`git stash push -u` or commit on
  `feat/sdk-worker-staging`), then `git fetch --all && git switch staging && git pull --ff-only`.
- `uv sync --all-extras` → `docker compose -f docker/docker-compose.yml up -d postgres redis`
  → `make migrate` → `make seed` → `make dev` (port **8001**) → `make worker` if extraction is needed.
- `uv run python scripts/e2e_bootstrap.py` → `local/e2e-credentials.json` (`e2e-lender`
  tenant + fresh `krane_test_*` key).
- Frontend: `npm install`, add `.gitignore` (`node_modules`, `dist*`, `.env*`).
- **Acceptance:** `GET /health` 200; `scripts/e2e_smoke.py` exits 0; Vite serves 5173.

### M1 — Plumbing
- Create `krk-bff` (Node/Express): config `KRANE_BASE_URL`, `KRANE_API_KEY`, `KRANE_JWT`,
  `BFF_PORT`; routes `GET /bff/health`.
- Frontend: `src/data/api.js` (fetch → BFF), `src/data/adapters.js` (mappers),
  `VITE_BFF_URL`, `VITE_USE_MOCK`.
- Re-implement `DataContext.jsx` to branch mock ↔ live while keeping the `useData()` shape
  byte-identical; add `loading`/`error`; fall back to `generateData()` on failure.
- **Acceptance:** with `VITE_USE_MOCK=true` the app is identical to today.

### M2 — Checks + Check Detail (fastest win)
- BFF: `POST /bff/demo/session` → `demo/quick-login`; `POST /bff/demo/seed` →
  `demo/seed-sample`; `POST /bff/checks/:individualId/composite` → composite + explain.
- Adapter per §5.
- **Acceptance:** Checks, Check Detail and Main-Thinker deep render real backend data.

### M3 — New Check end-to-end
- BFF orchestrates: `identity/individuals` → `identity/lookup` → `/verify` → statement +
  bureau uploads (`extract=true`) → poll `GET /bank-statements/{id}` /
  `GET /credit-reports/{id}` → `POST /scores/composite/from-sources`.
- Frontend: replace the simulated NIBSS enumeration with a real upload step; replace
  `runCheck()` with an async call; replace the `setTimeout` pipeline with polling
  `GET /scores/requests/{request_id}` (`ASYNC` mode + `ScoreRequestStatusResponse`).
- **Acceptance:** a new BVN produces a persisted individual, extracted statement, and
  composite score visible in Checks.

### M4 — Dashboard aggregates
- BFF `/bff/dashboard` over composite list + `/billing/usage` + webhook deliveries.
- **Acceptance:** KPIs and activity derive from live records; anything that can't is
  visibly marked.

### M5 — Platform pages
- API & Docs ← `GET /openapi.json` + tenant keys + webhooks (replaces fake `curl`/log).
- Settings ← tenant + billing. Users ← `auth/me` + `/tenants`.
- **Acceptance:** key create/revoke and webhook CRUD round-trip.

### M6 — Deep analysis
- Promote `GET /demo/bank-statement/granular/{id}` to `GET /bank-statements/{id}/analysis`.
- Shape BS360 + Bureau deep from real payloads; label MoBI channels partial.

### M7 — Compliance (partial) and the mock-only modules
- Compliance: audit/lineage where available; KYB/retention "not yet available".
- Decision Engine / Loan Queue / Servicing: **mock with a visible "not yet wired" badge**
  (locked decision 2), or scope a `policy` / `loans` / `servicing` module later.
- **Acceptance:** UI never implies live data it does not have.

---

## 7. Page matrix

| Page | Today | After this plan |
|---|---|---|
| Checks | generated | ✅ live (needs the new list endpoint) |
| Check Detail | generated | ✅ ~80% live (no policy decision, no integrity card) |
| New Check | fake wizard | ✅ live end-to-end |
| BS360 / Bureau deep | generated | ✅ mostly live |
| MoBI deep | generated | ⚠️ partial (SMS only) |
| API & Docs | hardcoded | ✅ live (OpenAPI + keys + webhooks) |
| Settings | hardcoded | ✅ billing/tenant live; org profile mock |
| Dashboard | generated | ⚠️ ring/KPIs live only with a decision policy |
| Decision Engine | hardcoded | ❌ no backend |
| Loan Queue / Servicing | generated | ❌ no backend |
| Users | hardcoded | ✅ live (team members + invites) |
| Compliance | hardcoded | ✅ KYB verification live; retention/export still absent |

---

## 8. Backend work required

**P0 — blocks the first cut**
1. **`GET /scores/composites?limit&cursor`** — tenant-scoped list of persisted composite
   results joined with individual name/BVN. Today only one individual can be fetched at a
   time, so the Checks page and every aggregate are impossible.
2. **Expose a decision** — either a `policy` evaluation endpoint (`POST /decisions/evaluate`)
   or an explicit BFF-side derivation. Without it, 6 UI surfaces and the Decision Engine
   page have no source.
3. Score/tier convention call (decision 3) — adapter map vs UI copy change.
4. Promote the demo granular analysis endpoint out of `/demo`.
5. Remove `dev-bypass` before any non-demo use.
6. Fix CORS: `allow_origins=["*"]` + `allow_credentials=True` is invalid — set real origins
   (moot if the BFF proxies, but required for direct-browser fallback).
7. `Idempotency-Key` support on `POST /scores`, uploads, `POST /identity/individuals`.
8. Keep the uncommitted `credit_report/application/service.py` fix — without the `PENDING`
   row creation, a just-uploaded report 404s until extraction completes, which breaks the
   M3 upload→poll loop.

**P1** — versioned webhook event names (`score.completed` → `*.v1`); rate-limit headers;
request-log endpoint; retention/KYB endpoints.

**P2** — `loans` / `servicing` / `policy` modules.

**External gates** (`docs/integration-readiness-plans.md`): real `LLM_API_KEY` (blocks
extraction and AI), bureau pull clients, KYC providers, object storage, enabled crons.
These gate M3/M4 — `/demo/seed-sample` is the interim path for M2.

---

## 9. Frontend changes

| File | Change |
|---|---|
| `src/data/api.js` | **new** — fetch client to the BFF |
| `src/data/adapters.js` | **new** — response → `report` / `CHECKS` / `DASH_STATS` |
| `src/data/DataContext.jsx` | re-implement behind `useData()`; add `loading`/`error`; keep `runCheck()` |
| `src/data/{gen-check,generate}.js` | untouched — served when `VITE_USE_MOCK=true` |
| `src/pages/NewCheck.jsx` | replace simulated NIBSS/acquisition with real upload + poll |
| **new** `src/pages/Login.jsx` | JWT capture + "Demo login" (`/demo/quick-login`) |
| `src/components/Layout.jsx` | real user from `/auth/me`; data-source badge (live/mock) |
| `.env.example` | `VITE_BFF_URL`, `VITE_USE_MOCK` |
| `.gitignore` | **new** (none exists) |

---

## 10. Verification

- **Harness:** reuse `scripts/e2e_bootstrap.py` + `scripts/e2e_smoke.py`; point the BFF at
  the same stack.
- **Contract tests:** schema test per BFF adapter so a backend shape change fails loudly —
  especially score scale, tier enum, `D0`, `confidence` range, `outcome` vocabulary.
- **Frontend smoke:** headless run (extend the `sdk/prototype/browser-test.mjs`
  DevTools-Protocol approach) asserting Checks/Detail render from live data.
- **Gate:** `uv run pytest -q` green; `e2e_smoke.py` exits 0; frontend loads with
  `VITE_USE_MOCK=false`.

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| Backend branch is dirty (20 real edits + 463 mode-only + 6 untracked) and `staging` is 30 behind | Stash `-u`, switch, pull. The real edits are valuable (asyncpg tz fixes, JWT `jti`, persona `individual_id`) — do not discard; the untracked `9c4f1d2a7b60_add_audit_log_table.py` duplicates `audit_log` already created by `41089baa322d` and will fail on staging's chain |
| "Checks" doesn't exist as a backend resource | New tenant-scoped list endpoint (§8.1); BFF aggregation is the interim |
| Decision semantics mismatch | Product decision (§0 / mismatch 6) — the highest-leverage open item |
| `DataContext` is imported by all 13 pages | Per-key migration + `VITE_USE_MOCK` fallback; a page must never read `undefined` |
| Weight redistribution differs (62.5/37.5 vs 70/30) | Read `engine_contributions[].weight`; never hardcode |
| Extraction/AI blocked by missing `LLM_API_KEY` | `/demo/seed-sample` for M2; real extraction in M3 |
| UI overstates features (policy, loans, servicing) | Explicit badge until built (locked decision 2) |
| `dev-bypass` gives `tenant_id=None` | Demo-only; remove before pilot |

---

## 12. Open decisions

1. **Score scale** — clamp+map 0–1000 → 300–900 in the adapter, or keep 0–1000 and change
   the UI copy? (Decision 3 says map; the lossy/`KRK-0-…` edge cases need a ruling.)
2. **Decision source** — (a) deterministic policy in the BFF from `score/tier/DTI/flags`,
   (b) a backend `POST /decisions/evaluate`, or (c) drop the decision fields from the UI?
3. **Checks list** — first-class backend resource (recommended) or BFF-only aggregation?
4. **BFF language** — Node/Express with `@krane/sdk` reused, or plain fetch?
5. **Loan/origination/servicing scope** — wanted in this phase at all, or permanently out
   of scope for this console?
6. **Login model** — consumer JWT via `/demo/quick-login`, or a lender/admin user with
   `tenant_id` (needed for every `X-API-Key`-scoped route to be meaningful)?

---

## 13. Revision 2026-11-02 — what pulling `staging` changed

`staging` fast-forwarded to **`d483aaf`** (PR #14, `feature/console-api`). Six new
migrations (`f9433df3122c → d5e89a12c3f4 → a7c1e2f4b9d0 → b3d5f7a9c1e2 → c4e6a8b0d2f4 →
d6f8b0c2e4a6 → e8a0c2d4f6b8`) and five new modules:

| New module | Unblocks |
|---|---|
| `team` | **Users page** — members, role changes, invites (incl. public accept) |
| `kyb` | **Compliance page** — org profile, verification items, document upload, director links, admin review queue, L1–L3 access |
| `developers` | nothing yet (only `GET /developers/ping`) |
| `events` + `notifications` | internal outbox/notification plumbing — **no HTTP routes** |
| `auth` extensions | MFA/TOTP, SSO, email/phone verification, signup, legal agreements |

**Consequences for this plan**

1. **M5 is cheaper than scoped** — Users and Compliance no longer need mock badges; they
   move from "❌ no backend" to "✅ live" (Compliance minus retention/export).
2. **Login is no longer a single call.** `POST /auth/login` returns
   `TokenResponse | MfaChallengeResponse`; the login screen must branch on the response and
   call `POST /auth/login/mfa`. `POST /auth/signup` also exists now, so a real signup flow
   is possible instead of demo-only login.
3. **Request-log endpoint still does not exist** despite the "request logs" migration —
   `GET /developers/*` is a ping only, so `ApiDocs.jsx`'s `REQUEST_LOG` panel stays derived
   from OpenAPI or marked mock.
4. **`/me` is now a separate router** (`me_router` → `/me/agreements/pending`) and legal
   acceptance (`/legal/agreements/current`, `POST /acceptances`) should gate first login.

**Verified running state (2026-11-02):**

- Backend `staging` @ `d483aaf`, API on `http://localhost:8001` (`/health` → 200), Redis +
  ARQ pool connected, worker not started.
- Postgres `e8a0c2d4f6b8` at head; dev data preserved (8 users, 6 tenants, 16 credit
  reports) via a revision stamp, backup at `local/backup-pre-staging-20261102.sql`.
- Frontend Vite on `http://localhost:5173` — still fully mock (§1.1), untouched by M1+.
- Local-only, **uncommitted** platform pin in `krk-backend/pyproject.toml`:
  `[tool.uv] constraint-dependencies` for `numba<0.62` / `llvmlite<0.45` on macOS x86_64.
  Required because `shap` (core dep) pulls `llvmlite 0.46`, which has no Intel wheel and
  fails to build. **This needs a proper PR** — it affects every Intel-Mac contributor.
- WIP from `feat/sdk-worker-staging` is in `git stash@{0}` (async scoring + asyncpg tz
  fixes, JWT `jti`, persona `individual_id`).
