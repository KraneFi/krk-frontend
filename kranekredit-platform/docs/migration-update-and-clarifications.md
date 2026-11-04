# Backend → staging: migration update + UI/API clarifications

**Date:** 2026-11-02
**Scope:** `krk-backend` `staging` @ `d483aaf` · `krk-frontend/kranekredit-platform`
**Action needed from:** backend owner (items 1–7), UI owner (items 8–10)

---

## TL;DR

Backend is on `staging` at `d483aaf` and running locally on `:8001`. Six new migrations
applied, dev data preserved. The pull added `team`, `kyb`, `developers`, `events`,
`notifications` and MFA/SSO/signup — so **Users and Compliance pages now have a real API**.

Before we wire the console to the API, there are **7 contract gaps** that will produce
visibly wrong numbers or missing screens if we guess. The two that block everything are
**score/tier scale** and **the approve/decline decision** — the backend has neither concept
in a form the UI can render today.

---

## 1. Migration update

**What changed**

- `staging` fast-forwarded 30 commits → **`d483aaf`** (PR #14, `feature/console-api`).
- 6 new migrations, applied cleanly, linear chain:
  `f9433df3122c → d5e89a12c3f4 → a7c1e2f4b9d0 → b3d5f7a9c1e2 → c4e6a8b0d2f4 → d6f8b0c2e4a6 → e8a0c2d4f6b8`
  - `d5e89a12c3f4` add `scored` column to sources
  - `a7c1e2f4b9d0` statement analyses keyed by individual
  - `b3d5f7a9c1e2` console foundations (events outbox, request logs, audit fields, org/key columns)
  - `c4e6a8b0d2f4` auth account (email/phone verification, TOTP, SSO identities, agreements, idle sessions)
  - `d6f8b0c2e4a6` org profile + KYB
  - `e8a0c2d4f6b8` team memberships and invites
- DB is now at **head `e8a0c2d4f6b8`**.

**Data was preserved, not rebuilt.** The local DB was stamped `9c4f1d2a7b60` — a
feature-branch-only migration that does not exist on `staging` — so `alembic upgrade head`
refused to run. I backed up (`local/backup-pre-staging-20261102.sql`, 144 KB), set the
version row to the shared ancestor `f9433df3122c`, and upgraded. Nothing was dropped:
8 users, 6 tenants, 13 individuals, 16 credit reports, 11 statement analyses all intact.

**Two things worth fixing upstream**

1. **`llvmlite` won't build on Intel Macs.** `shap` (a *core* dependency) pulls
   `numba → llvmlite 0.46`, which has no macOS x86_64 wheel and fails to compile. Anyone on
   an Intel Mac gets a broken `uv sync`. Workaround currently sitting **uncommitted** in
   `pyproject.toml`:
   ```toml
   [tool.uv]
   constraint-dependencies = [
       "numba<0.62; sys_platform == 'darwin' and platform_machine == 'x86_64'",
       "llvmlite<0.45; sys_platform == 'darwin' and platform_machine == 'x86_64'",
   ]
   ```
   This should be a proper PR — it's not specific to my machine.

2. **The audit-log migration needs a home.** `9c4f1d2a7b60_add_audit_log_table.py` exists
   only as an untracked file on `feat/sdk-worker-staging`, and it duplicates `audit_log`
   which `41089baa322d` already creates. It's currently in a stash, so the staging chain is
   clean — but it will bite the next person who syncs that branch's DB.

**Environment status:** API `:8001` (`/health` 200, 102 paths), Postgres + Redis healthy,
frontend `:5173`. ARQ worker **not** started, so async extraction/scoring queues but does
not process. WIP from `feat/sdk-worker-staging` is in `git stash@{0}`.

> Note: `git pull` over SSH fails on this machine (key not authorized for the org repo);
> I fetched over HTTPS via the keychain. No remote config changed.

---

## 2. Clarifications needed — UI ↔ API

### Blocking (can't build Checks or Dashboard without these)

**1. Score and tier scale.** ✅ **Resolved 2026-11-04 — the API is canonical.** The UI now
uses **0–1000**, tiers **T1–T6** (no T0) and debt **D0–D5**. No client-side remap: a real
score of 745 is T4 server-side, while a 300–900 remap would have labelled it T3.
- ~~Option A: remap in an adapter~~ — rejected: `tier_code` is computed from the 0–1000 score,
  so a rescale contradicts the server's own tier.
- ~~Option B: UI changes to 0–1000/T1–T6~~ — **chosen and implemented.**

**2. Is there an approve / decline / refer decision anywhere?** This is the biggest one.
`CompositeScoreResponse.outcome` is **not** a credit decision — it's engine availability
(`FULL` / `DEGRADED` / `MINIMAL` / `NO_SCORE` = 3/2/1/0 engines). There is no policy engine
in the backend. But the console's entire value prop — the Decision column, approval rate,
decline reasons, the Decision Engine page — depends on
`Auto-Approve / Auto-Decline / Manual Review / Refer` under "policy v4.2".
- Do we add a `POST /decisions/evaluate` policy layer (preferred, reusable), derive it
  client-side, or drop those surfaces for now?

**3. A tenant-wide list of assessments.** There is no endpoint that lists checks. You can
only fetch one individual at a time (`GET /scores/individual/{id}`). The Checks page and
every dashboard aggregate need something like
`GET /scores/composites?limit&cursor` returning composite results joined with individual
name/BVN, scoped to the tenant. Is that acceptable as a new endpoint, or should we
aggregate client-side (N+1 calls)?

### Semantics that will silently render wrong

**4. Weight redistribution doesn't match.** UI assumes **70/30** (bank/bureau) when
alternative data is missing. The engine actually does **62.5/37.5**
(`main_thinker.py:136-139`). Base weights agree at 45/30/25, the degraded path does not.
Confirm 62.5/37.5 is intended, and confirm the UI should always read
`engine_contributions[].weight` rather than compute it.

**5. `outcome` has two meanings.** The UI uses `FULL` / `DEGRADED` to mean "MoBI360 present
or not, weight redistributed". The API uses the same words to mean "how many engines
reported". A 2-engine result is `DEGRADED` regardless of *which* engine is missing. Which
semantics should the badge show?

**6. Enumerations the UI can't style yet.** We need canonical value lists for:
- `reason_codes[].direction` — what are the exact values? (UI splits into positive/adverse
  and currently assumes a fixed set.)
- `flags[].severity` — API emits `INFO / WARNING / HIGH / CRITICAL`; UI only styles
  `HIGH / MEDIUM / LOW`. Map, or change one side?

**7. Statement integrity.** The UI shows an authenticity score (0–100) plus four integrity
checks (metadata, arithmetic reconciliation, template, fonts). The API only exposes
`balance_integrity_score` inside `metrics_snapshot` — there's no statement-integrity model
in the composite. Is that card out of scope for the composite, or coming from the bank
statement analysis?

### Integration shape

**8. Auth split — is it intended?** Some routes take **JWT Bearer** (uploads, credit
reports, persona, demo, AI, telemetry, team, KYB) and others take **`X-API-Key`** (scoring
and identity). The console will have a logged-in user, not an API key. Should scoring gain
JWT-based tenant resolution, or should the console go through a thin BFF that holds both
credentials? Also: `X-API-Key: dev-bypass` currently returns `tenant_id=None` — is that
staying? It will silently return unscoped results outside a demo.

**9. Login is now two-step.** `POST /auth/login` returns `TokenResponse | MfaChallengeResponse`.
Confirm the expected flow for a console user (login → MFA challenge → `/auth/login/mfa`),
and whether new users should go through `/auth/signup` + legal acceptance
(`/legal/agreements/current`, `POST /acceptances`) rather than the demo login.

**10. Demo endpoints are gated on environment.** `demo_router` and the dev routers only
mount when `not settings.is_production`. Confirm the console's demo mode is expected to be
non-production only, so we don't build a flow that 404s in staging/prod.

---

## 3. What the UI is doing meanwhile

- Staying on generated mock data behind a flag (`VITE_USE_MOCK`), so the demo keeps working
  while the adapter is built.
- **Users** and **Compliance** move from "mock" to "wire to real API" given `team/*` and
  the KYB routes now exist. Note: the KYB surface is mounted under **`/orgs/*`**
  (`/orgs/current/verification`, `/orgs/current/directors/links`), not `/kyb/*`.
- **Users**, **Compliance** and **API & Docs / Settings** are now wired to the real API
  (auth, team, KYB checklist, tenant keys, org profile). The KYB checklist is interactive:
  forms, document upload, consent attestation, director links, phone verification and TOTP
  all submit to the API and move the access tier.
- **New Check** will change shape: the backend is **document upload + extraction**, not NIBSS
  BVN→account enumeration. The current 4-step wizard's account-picker step has no API
  equivalent and will be replaced with an upload step.
- The scoring screens stay on generated mock data behind a flag (`VITE_DATA_MODE=mock`)
  until the score-scale, decision and list questions below are settled.

---

## 4. Asks

| # | Ask | Owner |
|---|---|---|
| 1 | Decide score/tier scale (300–900/T0–T5 vs 0–1000/T1–T6) | Backend + UI |
| 2 | Decide where the approve/decline/refer decision comes from | Backend |
| 3 | Agree on a tenant-wide composites list endpoint | Backend |
| 4 | Confirm 62.5/37.5 degraded weights | Backend |
| 5 | Confirm `outcome` semantics for the UI badge | Backend + UI |
| 6 | Publish canonical `direction` / `severity` values | Backend |
| 7 | Confirm whether statement integrity is in the composite | Backend |
| 8 | Confirm auth model for a console user (JWT everywhere vs BFF) | Backend |
| 9 | Land the Intel-Mac `llvmlite` pin as a PR | Backend |
| 10 | Decide whether `9c4f1d2a7b60` is kept, renumbered, or dropped | Backend |
