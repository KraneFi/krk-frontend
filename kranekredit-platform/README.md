# KraneKredit Intelligence Suite — Front-end

Credit decisioning and loan management console for African lenders: KRK Signal credit
checks, a three-engine scoring stack (BS360 bank statements, Credit Bureau, MoBI360
alternative data) synthesised by the Main Thinker engine, policy rules, loan origination,
servicing & collections, API management, user roles and compliance.

This repository is a code rebuild of the Base44 prototype. It keeps the prototype's colour
tokens, design style, information architecture, modules and API surface, and runs entirely
on **randomised dummy data** — there is no backend yet.

## Quick start

Requires Node.js 18+ (20 recommended, see `.nvmrc`).

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # production build in dist/
npm run preview        # serve the production build locally
npm run build:single   # one self-contained HTML file in dist-single/
```

## Deploying

**GitHub Pages (included):** `.github/workflows/deploy.yml` builds and publishes on every
push to `main`. One-time setup: *Settings → Pages → Build and deployment → Source:
GitHub Actions*. The site appears at `https://<user>.github.io/<repo>/`.

**Vercel / Netlify:** import the repo; build command `npm run build`, output directory `dist`.

## Modules

| Area | Route | File |
|---|---|---|
| Dashboard — portfolio KPIs, PAR trend, tier mix, decline reasons, activity | `/` | `src/pages/Dashboard.jsx` |
| Checks — list, filters, search | `/checks` | `src/pages/Checks.jsx` |
| New Check — BVN capture, consents, NIBSS account resolution, parallel acquisition, 5-stage pipeline | `/checks/new` | `src/pages/NewCheck.jsx` |
| Check Detail — KRK Signal report, engine breakdown, flags, reason codes, pre-qualified offers | `/checks/:id` | `src/pages/CheckDetail.jsx` |
| Deep Analysis Breakdown — BS360, Bureau, MoBI360, Main Thinker, Consolidated | overlay | `src/deep/*` |
| Decision Engine — policy rules, loan products, segments, versions | `/decision-engine` | `src/pages/DecisionEngine.jsx` |
| Loan Queue — origination pipeline & offers | `/loan-queue` | `src/pages/LoanQueue.jsx` |
| Servicing & Collections | `/servicing` | `src/pages/Servicing.jsx` |
| API & Documentation — keys, connections, webhooks, logs | `/api` | `src/pages/ApiDocs.jsx` |
| User Management — roles, maker-checker | `/users` | `src/pages/Users.jsx` |
| Compliance & Audit — KYB, lineage, retention, exports | `/compliance` | `src/pages/Compliance.jsx` |
| Settings | `/settings` | `src/pages/Settings.jsx` |

## Project structure

```
src/
  main.jsx, App.jsx        entry point, providers, route table
  router.jsx               small in-memory router + toasts (swap for react-router when needed)
  index.css                Tailwind + design tokens (HSL CSS variables)
  components/              Layout (sidebar, header) and shared UI primitives
  pages/                   one file per route
  deep/                    Deep Analysis Breakdown overlay and its engine views
  data/
    rng.js                 seeded PRNG (mulberry32) + formatting helpers
    pools.js               names, banks, employers, lenders, personas
    catalog.js             loan product catalogue
    gen-check.js           generates one credit check + full report + deep analysis
    generate.js            generates every page's dataset from one seed
    DataContext.jsx        provider: current seed, regenerate(), runCheck()
    core.js                static reference data (tiers, rules, roles, retention…)
```

## Dummy data

All figures come from a seeded generator, so each dataset is internally consistent
(KRK score → tier → policy rule → decision; engine scores blend 45/30/25, or 70/30/0
when MoBI360 is unavailable; dashboard aggregates are computed from the generated checks).

- **Regenerate data** (header button) creates a new seed and a fresh dataset. The seed is
  kept in `localStorage` (`kk-data-seed`) so a reload shows the same data.
- **New Check** derives linked bank accounts and the resulting report from the BVN, so the
  same BVN always gives the same result within a dataset.

To connect a real backend, replace the values returned by `useData()` in
`src/data/DataContext.jsx` with API calls to the endpoints documented on the
API & Documentation page.

## Stack

React 18 · Vite 5 · Tailwind CSS 3 · lucide-react · Recharts · clsx
