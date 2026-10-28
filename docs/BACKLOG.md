# Product backlog

Ordered by priority. **Priority** uses MoSCoW (Must / Should / Could / Won't this time).
**Points** are relative effort (1 = a couple of hours, 8 = most of an iteration).
Each story has testable acceptance criteria; a story is finished when it meets the
[Definition of Done](../CONTRIBUTING.md#definition-of-done).

To work on a story, open an issue with the **User story** template, copying the ID and
acceptance criteria from here.

## Overview

| ID | Story | Priority | Points | Iteration | Status |
|---|---|---|---|---|---|
| US-01 | Automated CI on every push and PR | Must | 3 | 1 | ✅ Done |
| US-02 | Offline backend unit tests | Must | 3 | 1 | ✅ Done |
| US-03 | Frontend component tests | Must | 2 | 1 | ✅ Done |
| US-04 | Backend health endpoint | Must | 1 | 1 | ✅ Done |
| US-05 | Explicit configuration and safe CORS | Should | 2 | 1 | ✅ Done |
| US-06 | PR/issue templates and contribution guide | Should | 1 | 1 | ✅ Done |
| US-07 | Dependency and security automation | Must | 3 | 1 | ✅ Done |
| US-08 | Changelog and release workflow | Should | 3 | 1 | ✅ Done |
| US-09 | Colour arcs by attack type | Must | 1 | 2 | To do |
| US-10 | Protect `main` with required checks | Must | 1 | 2 | To do (repo admin) |
| US-11 | Restrict production CORS to the frontend | Should | 1 | 2 | To do (owner approval) |
| US-12 | Show data freshness and connection errors in the HUD | Should | 2 | 2 | To do |
| US-13 | Send the latest snapshot to newly connected clients | Should | 2 | 2 | To do |
| US-15 | Time-outs and failure reporting for the SANS feed | Should | 2 | 2 | To do |
| US-16 | Reproducible, manual production deploys on Render | Should | 1 | 2 | To do (owner approval) |
| US-14 | Clear the `ip-address` advisory in the server | Should | 2 | 3 | To do |
| US-17 | Spike: replace Create React App build tooling | Could | 5 | 3 | To do |
| US-18 | Reduce the initial JavaScript bundle | Could | 3 | 3 | To do |
| US-19 | Historical timeline / attack playback | Won't (this time) | 8 | none | Parked |

**Iteration 1 velocity: 18 points.** See [ITERATION-PLAN.md](ITERATION-PLAN.md).

---

## Done (Iteration 1)

### US-01 Automated CI on every push and PR (Must, 3)
As a **developer**, I want every push and pull request to be tested and built automatically,
so that broken code is caught before it reaches `main`.
- [x] Given a push to any branch, when CI runs, then server tests, client lint, client tests and a production build run.
- [x] Dependencies are installed with `npm ci` from the lockfile.
- [x] Jobs have timeouts and a read-only token.
- [x] A single "CI passed" check can be required by branch protection.

### US-02 Offline backend unit tests (Must, 3)
As a **developer**, I want meaningful backend tests that do not need the internet,
so that results are reliable and fast.
- [x] `npm test` runs real tests instead of the placeholder that always failed.
- [x] SANS ISC (axios) and GeoIP are mocked; tests pass with the network off.
- [x] Classification thresholds, GeoIP label fallbacks, error handling, config and `/health` are covered.

### US-03 Frontend component tests (Must, 2)
As a **developer**, I want tests for the React app, so that UI regressions are caught.
- [x] The stale "learn react" test is replaced.
- [x] WebGL globe and Socket.IO are mocked; socket events drive the real `App` component.
- [x] HUD status, vector count, arc/ring data and label de-duplication are asserted.

### US-04 Backend health endpoint (Must, 1)
As an **operator**, I want `GET /health`, so that Render and I can tell whether the backend is alive.
- [x] Returns 200 with status, version, environment, uptime and last poll time and count.
- [x] Never calls the external API.
- [x] Render uses it as `healthCheckPath`; CI smoke-tests it.

### US-05 Explicit configuration and safe CORS (Should, 2)
As an **operator**, I want all environment settings in one documented place, and CORS limited to
known origins, so that deployments are predictable and the API is not open to every site by accident.
- [x] `NODE_ENV`, `PORT`, `CORS_ORIGINS` read in `server/config.js`; `.env.example` files exist.
- [x] Development allows only the local React origins.
- [x] Production without `CORS_ORIGINS` keeps working (allow-all) and logs a warning.

### US-06 PR/issue templates and contribution guide (Should, 1)
As a **contributor**, I want clear templates and a written workflow, so that I know how to propose changes.
- [x] PR template with a test checklist; bug and user-story issue forms.
- [x] `CONTRIBUTING.md` describes branching, commits, PRs, reviews and the Definition of Done.

### US-07 Dependency and security automation (Must, 3)
As a **maintainer**, I want vulnerable or outdated dependencies flagged automatically, so that
security issues are not missed.
- [x] Dependabot for npm (server, client) and GitHub Actions.
- [x] Dependency review on PRs, npm audit (critical gate plus report), CodeQL, weekly schedule.
- [x] Least-privilege permissions per job; findings explained in `docs/SECURITY-CHECKS.md`.
- [x] Non-breaking audit fixes applied: no critical findings remain.

### US-08 Changelog and release workflow (Should, 3)
As a **maintainer**, I want a repeatable release process, so that releases are traceable and
production is deployed only after a human approves.
- [x] `CHANGELOG.md` in Keep a Changelog format.
- [x] Release workflow verifies versions and the changelog, runs full CI and packages artifacts.
- [x] Tag pushes create a **draft** release only; deployment stays manual (`docs/RELEASE.md`).

---

## Iteration 2: reliability and production hardening

### US-09 Colour arcs by attack type (Must, 1): bug
As a **viewer**, I want DoS/flood arcs drawn in red and the others in orange, as the legend says,
so that heavy attacks stand out.
Today `arcColor` checks `d.type === 'DDoS Flood'`, but the type lives at `d.src.type` and the
backend's label is `"Denial of Service (DoS/DDoS) or Flooding Attack"`, so every arc is orange.
- [ ] Given a DoS/flood attack, when it is drawn, then its arc is `#ff0000`.
- [ ] Given a port scan or exploit attempt, then its arc is `#ff9900`.
- [ ] A unit test checks the colour function for each attack type.

### US-10 Protect `main` with required checks (Must, 1)
As a **team**, we want `main` to accept changes only through reviewed PRs with green checks.
- [ ] A branch rule on `main` requires a PR, 1 approval and the checks listed in `CONTRIBUTING.md`.
- [ ] Force pushes and branch deletion are blocked.
- [ ] Demonstrated by a PR with a failing test that cannot be merged.

### US-11 Restrict production CORS to the frontend (Should, 1)
As an **operator**, I want the production API to accept browser requests only from our frontend.
- [ ] `CORS_ORIGINS` is set on the Render backend to the frontend URL.
- [ ] The production start-up log shows no CORS warning.
- [ ] The production globe still receives data.

### US-12 Show data freshness and connection errors in the HUD (Should, 2)
As a **viewer**, I want to see when data was last updated and whether the connection failed,
so that I can tell a quiet period from a broken connection.
- [ ] The HUD shows "LAST UPDATE: hh:mm:ss" after each `threat-data` event.
- [ ] On `connect_error` / `disconnect`, the status shows a clear offline message.
- [ ] Component tests cover both states.

### US-13 Send the latest snapshot to newly connected clients (Should, 2)
As a **viewer**, I want to see attacks as soon as I open the page, instead of waiting up to 60 s
for the next poll.
- [ ] The server keeps the last broadcast payload in memory.
- [ ] Given a client connects after a poll, then it immediately receives that payload.
- [ ] No extra calls are made to the SANS API.

### US-15 Time-outs and failure reporting for the SANS feed (Should, 2)
As an **operator**, I want slow or failing SANS requests to be bounded and visible.
During setup the API took about 28 s to answer, and a failed poll looks the same as "no attacks".
- [ ] The axios request has a time-out (e.g. 15 s).
- [ ] `/health` reports `lastPollOk` and the last error message.
- [ ] Tests cover time-out and error paths with mocks.

### US-16 Reproducible, manual production deploys on Render (Should, 1)
As an **operator**, I want production built from the lockfile and deployed only on purpose.
- [ ] `render.yaml` build commands use `npm ci` instead of `npm install`.
- [ ] Auto-Deploy is turned off (dashboard or `autoDeploy: false`) and the release guide is followed.
- [ ] Render's Node version is pinned to the one CI tests.

---

## Iteration 3: security debt and performance

### US-14 Clear the `ip-address` advisory in the server (Should, 2)
As a **maintainer**, I want no high-severity findings in the production server.
- [ ] Evaluate `geoip-lite` 2.x (uses `ip-address` ^10.2) for API or data changes.
- [ ] Upgrade if compatible; all locator tests pass; `npm audit` in `server` shows 0 high.
- [ ] Otherwise document the decision in `docs/SECURITY-CHECKS.md`.

### US-17 Spike: replace Create React App build tooling (Could, 5)
As a **maintainer**, I want to know the cost of moving off the unmaintained `react-scripts`,
which accounts for all 35 remaining client findings. React and the app code stay unchanged;
only the build/test tooling changes.
- [ ] Time-boxed spike (max 1 day) comparing a modern build tool and test runner.
- [ ] Written recommendation with effort, risks and audit results; no merge without agreement.

### US-18 Reduce the initial JavaScript bundle (Could, 3)
As a **viewer on a slow connection**, I want the page to load faster.
The production bundle is about 580 kB gzipped.
- [ ] Lazy-load the globe component and show a loading state.
- [ ] Main bundle size reduced and recorded in the PR.

### US-19 Historical timeline / attack playback (Won't this time, 8)
From the README's future ideas. It needs storage of past polls, which conflicts with the
current "no database" constraint, so it is parked.
