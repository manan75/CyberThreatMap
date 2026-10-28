# DevOps lab demonstration guide

A script for showing each Agile/DevOps practice in this repository, in roughly 25 minutes.
Commands assume a terminal at the repository root, with `npm ci` already run in `server/` and `client/`.

| # | Principle | Show this | Time |
|---|---|---|---|
| 1 | Continuous integration | Actions run on push, a deliberately broken build | 5 min |
| 2 | Automated testing | Offline unit tests and coverage | 3 min |
| 3 | Branching and pull requests | Feature branch, PR template, required checks | 4 min |
| 4 | Health checks and configuration | `/health`, CORS allowlist, fail-fast config | 3 min |
| 5 | Agile project management | Backlog, issue forms, iteration plan | 3 min |
| 6 | Release management | Changelog, release gate, release dry run | 4 min |
| 7 | Dependency and security automation | Dependabot, audit report, dependency review, CodeQL | 3 min |

---

## 1. Continuous integration

**Show:** GitHub → **Actions → CI** → latest run on `feature/devops-pipeline`.
- Jobs: *Server - test (Node 22)*, *Server - test (Node 24)*, *Client - lint, test, build*,
  *CI passed*.
- Open a server job: `npm ci` → coverage table → "Health check passed: {...}".
- Scroll to **Artifacts**: `client-build-<sha>` is the production build produced by CI.

**Talking point:** every push is built and tested the same way, on a clean machine, from the
lockfile. The first push of this branch failed in CI because of a lockfile written by a newer npm.
CI caught a "works on my machine" problem before anyone merged it.

**Live demo: break the build**
```bash
git switch -c demo/broken-build
# move the port-scan threshold from 5 to 10, so a test fails
sed -i 's/if(intensity <5) return "Port Scan";/if(intensity <10) return "Port Scan";/' server/services/locator.js
cd server && npm test        # ✖ boundaries: 5 and 50 move to the next category  (pass 24, fail 1)
cd .. && git commit -am "demo: break classification" && git push -u origin demo/broken-build
```
The CI run turns red at *Server - test*. Clean up afterwards:
```bash
git switch feature/devops-pipeline && git branch -D demo/broken-build
git push origin --delete demo/broken-build
```

## 2. Automated testing

```bash
cd server
npm test                 # 25 tests: collector, locator, config, /health + CORS
npm run test:coverage    # coverage table for the files the tests load
cd ../client
CI=true npm test -- --verbose   # 6 tests: HUD, socket events, globe data, labels
```

**Talking points:**
- External services are **mocked**: axios (SANS ISC), GeoIP lookups, the WebGL globe and
  Socket.IO. Turn Wi-Fi off and run `npm test` again; it still passes.
- `server/tests/locator.test.js` checks the classification boundaries (5 and 50 events per
  target) and the city → region → country fallback.
- `client/src/App.test.js` sends a fake `threat-data` event and checks that the HUD count and
  the globe's arcs and labels update.
- Coverage is 100% for the modules under test. `index.js` (wiring and the polling loop) is not
  unit-tested; the CI smoke test starts it for real instead.

## 3. Branching and pull requests

1. Show the branch list: `main` (untouched) and `feature/devops-pipeline`.
2. **Pull requests → New pull request** → base `main` ← compare `feature/devops-pipeline`.
   The description is pre-filled from `.github/pull_request_template.md`.
3. In the PR's **Checks** tab: CI, npm audit, dependency review and CodeQL run automatically.
4. Show `CONTRIBUTING.md`: branch prefixes, commit style, Definition of Done and the
   recommended branch-protection rule (require **CI passed** before merging).
5. Show the commit history: one focused commit per stage
   (`git log --oneline main..feature/devops-pipeline`).

## 4. Health checks and configuration

```bash
cd server && npm start
# second terminal:
curl http://localhost:4000/health
# {"status":"ok","version":"1.0.0","environment":"development","uptimeSeconds":12,
#  "timestamp":"...","lastPollAt":"...","lastThreatCount":20}

curl -si -H "Origin: http://localhost:3000"  http://localhost:4000/health | grep -i access-control
# Access-Control-Allow-Origin: http://localhost:3000
curl -si -H "Origin: https://evil.example" http://localhost:4000/health | grep -i access-control
# (no header: the browser would block the response)
```

Fail fast on bad configuration:
```bash
PORT=abc node index.js
# Error: Invalid PORT "abc": expected an integer between 0 and 65535
```

Production behaviour without an allowlist (runs, but warns):
```bash
NODE_ENV=production node index.js
# ⚠️  CORS_ORIGINS is not set in production; allowing all origins. ...
```

**Talking points:** `/health` never calls the external API, so it is cheap. Render uses it
(`healthCheckPath` in `render.yaml`) before routing traffic to a new deploy. All configuration
is listed in `server/config.js`, the `.env.example` files and the README table.

## 5. Agile project management

- `docs/BACKLOG.md`: user stories with MoSCoW priority, story points and Given/When/Then
  acceptance criteria. Iteration 1 is done (18 points); the bugs and risks found while doing it
  (US-09 arc colours, US-13 slow first data, US-15 SANS time-outs) are queued for Iteration 2.
- `docs/ITERATION-PLAN.md`: three one-week iterations, ceremonies, Definition of Ready/Done, velocity.
- **Issues → New issue**: the *User story* and *Bug report* forms (blank issues are disabled).
- Optional: create a GitHub Project board (Backlog → Ready → In progress → In review → Done)
  and add a *Points* field.

## 6. Release management

```bash
node scripts/verify-release.js 1.1.0
# Release verification FAILED:
#   - server/package.json version is 1.0.0, expected 1.1.0 (...)
#   - client/package.json version is 0.1.0, expected 1.1.0 (...)
#   - CHANGELOG.md has no "## [1.1.0] - YYYY-MM-DD" section
```

**Talking point:** the release gate refuses inconsistent releases. Then walk through
`docs/RELEASE.md`:
- A `release/vX.Y.Z` branch triggers a **dry run** (verify, full CI, package artifacts).
- A `vX.Y.Z` tag creates a **draft** GitHub Release with the client build, server source and
  SHA-256 checksums.
- **Deployment to Render is manual**, after review, followed by checking `/health` for the
  new version. Rollback is through Render's previous deploy or `git revert`.

Show `CHANGELOG.md` (`[Unreleased]` vs `[1.0.0]`) and the **Release** workflow run in Actions.

## 7. Dependency and security automation

- `.github/dependabot.yml`: weekly npm updates (minor/patch grouped into one PR) and monthly
  GitHub Actions updates.
- **Actions → Security → npm audit (client)** → job **Summary** shows the full audit report;
  the job only fails on *critical*.
- `docs/SECURITY-CHECKS.md`: how to read a finding (runtime vs build-time, direct vs transitive,
  breaking fix or not) and the before/after numbers (server 16 → 2, client 71 → 35, criticals 4 → 0).
- **Security → Code scanning**: CodeQL results.
- Every job declares minimal `permissions` (look at the top of `security.yml`: `permissions: {}`).

**Live demo: dependency review blocks a risky PR**
```bash
git switch -c demo/vulnerable-dep
cd server && npm install lodash@4.17.20 && cd ..
git commit -am "demo: add vulnerable lodash" && git push -u origin demo/vulnerable-dep
```
Open a PR into `main`. *Dependency review* fails and lists the lodash advisories. Close the PR
and delete the branch afterwards; do not merge it.
