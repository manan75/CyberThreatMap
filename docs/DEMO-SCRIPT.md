# Demo script (examiner run-through, ~20 min)

Repo: https://github.com/manan75/CyberThreatMap  ·  Branch: `feature/devops-pipeline`
Open before you start: **Actions** tab, **Pull requests** tab, VS Code at repo root, one terminal at repo root.

## 0. One-time prep (before the examiner arrives)
```powershell
git add -A
git commit -m "chore: add one-command demo scripts and demo guide"
git push
```
Check Actions: **CI** and **Security** are green for this commit.

## 1. Run the app (2 min)
```powershell
.\start-app.bat      # starts backend :4000, waits for /health, then starts frontend :3000
```
Browser opens at http://localhost:3000 (globe + HUD). Say: backend polls SANS ISC, pushes over Socket.IO.
```powershell
.\check-health.bat   # /health JSON + CORS allowed vs. blocked origin
.\stop-app.bat       # when finished
```

## 2. Automated tests, offline (2 min)
```powershell
.\run-tests.bat      # server tests + coverage, client lint + tests
```
Turn Wi-Fi off first if you want to prove the external APIs are mocked.

## 3. Local pipeline = GitHub pipeline (2 min)
```powershell
.\run-pipeline.bat   # same 5 stages as .github/workflows/ci.yml
```
Open `.github/workflows/ci.yml` next to it and point at the matching commands.

## 4. CI on GitHub: red, then green (5 min) - the main demo
```powershell
git switch -c demo/broken-build
(Get-Content server/services/locator.js) -replace 'intensity <5\)', 'intensity <10)' | Set-Content server/services/locator.js
git commit -am "demo: break classification"
git push -u origin demo/broken-build
```
GitHub: open a PR `demo/broken-build` -> `main`. **Checks** go red at *Server - test*; *CI passed* is red.
Fix it live:
```powershell
git revert --no-edit HEAD
git push
```
Checks rerun and go green. Cleanup (close the PR first):
```powershell
git switch feature/devops-pipeline
git branch -D demo/broken-build
git push origin --delete demo/broken-build
```
Show in the PR: template pre-filled, Node 22/24 matrix, client build artifact on the run page.

## 5. Security on GitHub (3 min)
Show in Actions -> **Security**: npm audit summary, CodeQL; **Security tab** -> Code scanning.
Optional live block:
```powershell
git switch -c demo/vulnerable-dep
cd server; npm install lodash@4.17.20; cd ..
git commit -am "demo: vulnerable dep"
git push -u origin demo/vulnerable-dep
```
PR into `main` -> **Dependency review** fails. Close the PR, delete the branch, switch back.

## 6. Release gate (3 min)
```powershell
.\verify-release.bat          # 9.9.9 -> REJECTED (versions + changelog mismatch)
.\verify-release.bat 1.1.0    # works only on release/v1.1.0 (where versions are bumped)
```
GitHub: Actions -> **Release** -> run on `release/v1.1.0` (dry run: verify, CI, package). Do **not** push a `v*` tag.

## 7. Agile artefacts (2 min)
`docs/BACKLOG.md`, `docs/ITERATION-PLAN.md`, then GitHub **Issues -> New issue** (User story form) and the PR template.
Be upfront: branch protection is not enabled yet (next improvement); deployment is manual.

## Script reference
| File | Does |
|---|---|
| `start-app.bat` | installs deps if missing, creates `.env` files, starts backend, waits for `/health`, starts frontend |
| `stop-app.bat` | kills listeners on 4000/3000 and closes their windows |
| `check-health.bat` | `/health` + CORS check (`scripts/check-health.ps1`) |
| `run-tests.bat` | all test/lint suites, summary at the end |
| `run-pipeline.bat` | local mirror of CI (5 stages, uses `scripts/smoke-test.js`) |
| `verify-release.bat [ver]` | runs the release gate |

Set `NOPAUSE=1` to stop the scripts waiting for a keypress.
