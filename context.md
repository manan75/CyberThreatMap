# Project context (for humans and AI agents)

Read this first. It summarises what the project is, how it is built, what has been done,
the rules for working on it, and the traps that have already cost time.
Last updated: 2026-10-28, on branch `feature/devops-pipeline`.

---

## 1. What this is

**CyberThreatMap** is a real-time 3D globe of internet attacks.

- The backend polls the **SANS ISC** "top attacking IPs" feed every 60 s, geolocates each IP
  with **geoip-lite** (an offline database), classifies the attack heuristically, assigns a random
  simulated honeypot target, and broadcasts the batch over **Socket.IO** as a `threat-data` event.
- The frontend (**React 19 + react-globe.gl**) draws arcs, rings and labels plus a HUD and a legend.
- Hosting is on **Render** (`render.yaml`): one Node web service for the backend and one static
  site for the frontend.

| Repository | Role |
|---|---|
| `AnujSharma-05/CyberThreatMap` | upstream / original; its `main` feeds the live Render deployment |
| `manan75/CyberThreatMap` | fork used for the college Agile/DevOps lab; git remote `origin` |

Locally the remotes are `origin` = fork and `upstream` = original.

---

## 2. Hard rules (agreed with the project owner)

1. **Do not touch `main`** (fork or upstream). Do not merge, force-push, tag, publish a
   release or deploy without the owner's explicit approval.
2. **Production deployment is manual.** Never trigger Render deploys or change Render settings.
3. **Keep the stack.** React, Node/Express, Socket.IO, SANS ISC, GeoIP and Render stay.
   **No** Docker or Compose, databases, Kubernetes, Kafka, or a new frontend framework.
4. Keep changes **small, modular and reviewable**. Avoid new dependencies, and avoid UI or
   business-logic changes that are outside the task.
5. **Verify before claiming.** Never say a test, build or check passed unless it actually ran.
   Docs describe what exists, not plans.
6. Work on a branch (`feature/…`, `fix/…`, `docs/…`, `chore/…`) and integrate through a PR.

---

## 3. Repository map

```
.github/
  workflows/ci.yml        CI: server tests (Node 22+24) + /health smoke; client lint/test/build + artifact
  workflows/security.yml  dependency review (PR), npm audit (critical gate), CodeQL; weekly cron
  workflows/release.yml   release/vX.Y.Z branch = dry run; vX.Y.Z tag = DRAFT release. Never deploys
  dependabot.yml          npm (server, client) weekly; GitHub Actions monthly
  pull_request_template.md, ISSUE_TEMPLATE/ (bug_report, user_story, config)
server/
  index.js                entrypoint: config -> app -> http + Socket.IO -> 60 s polling loop
  app.js                  createApp({config, getStatus}): Express + CORS + GET /health (no side effects)
  config.js               loadConfig(env): NODE_ENV, PORT, CORS_ORIGINS (single source of truth)
  services/collector.js   fetchThreats(): axios GET to SANS ISC, returns [] on any error
  services/locator.js     enrichThreatData(raw), classifyAttack(attacks, count)
  tests/*.test.js         node:test unit tests (axios + geoip mocked)
  scripts/live-feed-check.js  manual script that calls the REAL SANS API (not a test)
  .env.example
client/
  src/App.js              entire UI: socket connection, HUD, legend, <Globe>
  src/App.test.js         Jest + RTL; react-globe.gl and socket.io-client mocked
  .env.example            REACT_APP_BACKEND_URL
scripts/verify-release.js release gate (versions + CHANGELOG section); --notes prints release notes
docs/                     BACKLOG, ITERATION-PLAN, RELEASE, SECURITY-CHECKS, DEVOPS-LAB-GUIDE
CHANGELOG.md  CONTRIBUTING.md  SECURITY.md  render.yaml  readme.md  context.md (this file)
```

### Data contract (`threat-data` payload, an array of)
```js
{
  src: { ip, country, region, city /* always set: city | "region, country" | "MAPPED: CC" */,
         lat, lng, type /* "Port Scan" | "Exploit Attempt" |
                           "Denial of Service (DoS/DDoS) or Flooding Attack" | "Unknown Attack Type" */ },
  dst: { name, lat, lng },   // random entry from TARGETS in index.js
  magnitude,                 // SANS "count"
  timestamp                  // ISO string
}
```
Classification: `intensity = count / attacks`; `< 5` Port Scan, `< 50` Exploit Attempt, `>= 50` DoS.
Changing this payload is a breaking change (MAJOR version).

---

## 4. Run, test, build

Prerequisites: **Node 22 LTS or newer**, npm. Always install with `npm ci`.

```bash
# backend
cd server && npm ci
npm test                    # 25 tests, offline
npm run test:coverage
npm start                   # :4000   (npm run dev also loads server/.env; needs Node >= 22.9)
curl localhost:4000/health  # {"status":"ok","version":...,"lastPollAt":...,"lastThreatCount":...}
npm run check:live-feed     # hits the real SANS API once (manual)

# frontend
cd client && npm ci
npm run lint                # eslint, max 0 warnings
CI=true npm test            # 6 tests, run once (without CI=true Jest enters watch mode)
CI=true npm run build       # warnings are errors when CI=true
npm start                   # :3000

# release gate
node scripts/verify-release.js 1.1.0 [--notes]
```

### Configuration
| Var | Side | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | server | `development` | `production` on Render |
| `PORT` | server | `4000` | invalid value stops start-up with an error |
| `CORS_ORIGINS` | server | dev: `http://localhost:3000,http://127.0.0.1:3000`; prod: `*` + warning | comma list or `*` |
| `REACT_APP_BACKEND_URL` | client (build time) | `http://127.0.0.1:4000` | baked into the bundle |

---

## 5. Current state of `feature/devops-pipeline`

Branched from `main` at `f8aee67` (upstream and fork `main` were identical). Ten focused
commits (`git log --oneline main..feature/devops-pipeline`). Pushed to the fork only.

**Verified results (2026-10-28):**
- Server: 25/25 tests locally and in CI on Node 22 and 24; `/health` smoke test passes in CI.
- Client: 6/6 tests, lint clean, `CI=true` build compiles (~580 kB gzipped main bundle).
- Live end-to-end: real backend → SANS → GeoIP → socket.io-client received 20 attacks.
- GitHub Actions: CI ✅, Security ✅ (npm audit server and client, CodeQL with 0 open alerts),
  Release dry run ✅ (on a temporary `release/v1.1.0` branch, since deleted; no tag or release created).
- npm audit: server 16 → 2 findings (0 critical); client 71 → 35 (0 critical, all under `react-scripts`).

**Not yet exercised:** the *Dependency review* job, which only runs on a pull request into
`main`, and no PR has been opened yet.

**Pending owner decisions:**
1. Open a PR `feature/devops-pipeline` → fork `main` (review only, no merge).
2. Enable branch protection on the fork's `main` requiring **CI passed** (US-10).
3. Render (production): turn Auto-Deploy off, set `CORS_ORIGINS`, use `npm ci` in build commands
   (US-11, US-16).

---

## 6. Known issues and next work (see `docs/BACKLOG.md`)

| ID | Issue | Where |
|---|---|---|
| US-09 | **Arcs are always orange.** `arcColor` checks `d.type === 'DDoS Flood'`, but the type is `d.src.type` with a different string | `client/src/App.js` |
| US-13 | New clients wait up to 60 s for data; nothing is sent on `connection` | `server/index.js` |
| US-15 | No axios time-out (SANS has taken ~28 s); a failed poll is indistinguishable from "no attacks" | `services/collector.js` |
| US-12 | HUD shows no last-update time and no connection-error state | `client/src/App.js` |
| US-14 | `ip-address` advisory via `geoip-lite` 1.x; npm's suggested fix is a breaking *downgrade*. Evaluate geoip-lite 2.x | `server` deps |
| US-17 | All 35 client audit findings come from `react-scripts@5` (unmaintained). Spike only; React stays | `client` tooling |
| US-16 | Render auto-deploys on merge by default; `render.yaml` uses `npm install`, not `npm ci` | `render.yaml` (owner) |

Iteration 2 = US-09, 10, 11, 12, 13, 15, 16. Iteration 3 = US-14, 17, 18.

---

## 7. Gotchas (already hit, don't repeat)

- **Lockfiles must work with npm 10.** CI uses the npm bundled with Node 22 (10.9.x). A
  lockfile written by npm 11 dropped an optional peer (`yaml@2` under tailwindcss) and broke
  `npm ci` in CI. After changing dependencies with a newer npm, run
  `npx npm@10 install --package-lock-only` and check that `npm ci` works.
- **`npm audit fix` on Windows sometimes applies nothing on the first run.** Check `git diff`
  and run it again. Never use `--force` (it proposes breaking changes, even downgrades).
- **The npm audit endpoint is flaky** ("audit endpoint returned an error"); retry.
- **Node test discovery:** `node --test tests/` treats the directory as a file on Node 22. The
  script uses a quoted glob, `node --test "tests/**/*.test.js"`. Do not create `server/test.js`
  again: Node's default pattern would pick it up and hit the live API.
- **CRA Jest has `resetMocks: true`.** `jest.fn()` implementations are wiped before each test,
  so the socket mock in `App.test.js` uses plain functions. `react-globe.gl` is ESM/WebGL and
  must stay mocked.
- **`socket.io-client` is created at module load** in `App.js` (`io(...)` runs on import), so
  tests read `io.connectArgs` from the mock rather than counting calls per test.
- **CORS does not cover WebSockets.** The client uses `transports: ['websocket']`, so
  `CORS_ORIGINS` restricts HTTP (e.g. `/health`) but not the socket connection.
- **`server/index.js` has side effects** (listen + polling) when required; test `app.js`,
  `config.js` and `services/*` instead.
- **Reusable CI:** `release.yml` calls `ci.yml` through `workflow_call`. The concurrency group
  is `${{ github.workflow }}-${{ github.ref }}` so release and normal CI runs don't cancel
  each other; keep it that way.
- **`workflow_dispatch`** buttons only appear once a workflow file is on the default branch.
- **CodeQL** flagged building a `RegExp` from CLI input in `verify-release.js`; it now uses string
  matching. Don't reintroduce that pattern.
- **Windows:** git `autocrlf` warnings are expected; the repo stores LF. The GitHub API and
  `github.com` were intermittently unreachable from the dev machine, so retry `gh` and `git push`.
- When a local server is started for a smoke test, stop it afterwards (port 4000/4100).

---

## 8. Conventions

- Branches: `feature/`, `fix/`, `docs/`, `chore/`, `release/vX.Y.Z`. Short-lived, one issue each.
- Commits: Conventional Commits (`feat(server): …`, `fix(client): …`, `test: …`, `docs: …`,
  `chore(deps): …`).
- Every user-visible change goes under `## [Unreleased]` in `CHANGELOG.md`.
- One project version: `server/package.json` and `client/package.json` must match (the release
  gate checks this). `/health` reports the server version.
- Code style follows the surrounding file: the server uses CommonJS and 4-space indent, the
  client uses ES modules and 2-space indent.
- Tests: `node:test` + `node:assert/strict` on the server (use `mock.method`, no new libraries);
  Jest + React Testing Library on the client.
- Workflows: pin action major versions (`checkout@v7`, `setup-node@v7`, `upload-artifact@v7`,
  `download-artifact@v8`, `dependency-review-action@v5`, `codeql-action@v4`), set
  `timeout-minutes`, use least-privilege `permissions`, and `persist-credentials: false`.
- Definition of Done: acceptance criteria met, tests added, all checks green, PR reviewed and
  merged, changelog and docs updated, no new high or critical findings.
