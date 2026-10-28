# Release process

A lightweight, repeatable release flow. Automation **builds and verifies** a release;
a person **approves and deploys** it.

## Versioning

- [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`
  - PATCH: bug fixes only, MINOR: backwards-compatible features, MAJOR: breaking changes
    (for example, a change to the `threat-data` Socket.IO payload).
- One project version: `server/package.json` and `client/package.json` always carry the same
  version, and it is the version shown by `GET /health`.
- Tags look like `v1.1.0`.
- Every user-visible change is added to `## [Unreleased]` in [CHANGELOG.md](../CHANGELOG.md)
  in the same pull request (the PR template reminds you).

## What is automated

[`.github/workflows/release.yml`](../.github/workflows/release.yml):

| Trigger | Verify version + changelog | Full CI | Package artifacts | Draft GitHub Release |
|---|---|---|---|---|
| push to `release/vX.Y.Z` (dry run) | ✅ | ✅ | ✅ (workflow artifact) | ❌ |
| push tag `vX.Y.Z` | ✅ | ✅ | ✅ | ✅ (draft only) |
| *Run workflow* button (dry run)* | ✅ | ✅ | ✅ | ❌ |

\* GitHub only shows the button once the workflow file is on the default branch.

Packaged artifacts:
- `cyberthreatmap-client-build-vX.Y.Z.tar.gz`: the production React build from CI
- `cyberthreatmap-server-vX.Y.Z.tar.gz`: server source at the tagged commit (`npm ci` to install)
- `SHA256SUMS.txt` and `RELEASE_NOTES.md` (taken from the changelog section)

`scripts/verify-release.js` is the release gate and can be run locally:

```bash
node scripts/verify-release.js 1.1.0          # checks versions + changelog
node scripts/verify-release.js 1.1.0 --notes  # prints the release notes
```

**Nothing in this workflow deploys.** Production deployment stays a manual step.

## Step by step

1. **Branch** from an up-to-date `main`:
   ```bash
   git switch main && git pull
   git switch -c release/v1.1.0
   ```
2. **Bump versions** (updates `package.json` and `package-lock.json`, no git tag):
   ```bash
   (cd server && npm version 1.1.0 --no-git-tag-version)
   (cd client && npm version 1.1.0 --no-git-tag-version)
   ```
3. **Changelog**: rename `## [Unreleased]` content to `## [1.1.0] - YYYY-MM-DD`, leave a fresh
   empty `## [Unreleased]` above it and update the compare links at the bottom.
4. **Verify locally**: `node scripts/verify-release.js 1.1.0`
5. **Push** the release branch. The Release workflow does a dry run; check that it is green
   and download the `release-v1.1.0` artifact if you want to inspect it.
6. **Pull request** `release/v1.1.0` → `main`, get it reviewed, merge it.
7. **Tag** the merge commit on `main` and push the tag:
   ```bash
   git switch main && git pull
   git tag -a v1.1.0 -m "Release v1.1.0"
   git push origin v1.1.0
   ```
   The workflow re-runs every check and creates a **draft** GitHub Release with the artifacts.
8. **Deploy manually** (needs the project owner's approval), see below.
9. **Verify production**: `curl https://<backend>.onrender.com/health` should report
   `"version":"1.1.0"` and a recent `lastPollAt`. Open the frontend and check the globe updates.
10. **Publish** the draft release on GitHub.

## Deploying to Render (manual)

The app is hosted on Render using [`render.yaml`](../render.yaml). The backend's
`healthCheckPath: /health` makes Render wait for a healthy instance before switching traffic.

> ⚠️ **Render auto-deploys by default.** Unless Auto-Deploy has been turned off for the
> services, merging to the branch Render watches (usually `main`) deploys it immediately.
> To make deployment really manual, set **Settings → Build & Deploy → Auto-Deploy: No** for
> both services (or `autoDeploy: false` in `render.yaml`). This branch does **not** change that
> setting because it alters production behaviour and must be the owner's decision.

With Auto-Deploy off, deploy from the Render dashboard: **Manual Deploy → Deploy latest
commit** (or a specific commit) for the backend first, then the frontend.

Environment variables to check on Render before deploying:

| Service | Variable | Value |
|---|---|---|
| backend | `NODE_ENV` | `production` (already in `render.yaml`) |
| backend | `CORS_ORIGINS` | the frontend URL, e.g. `https://cyber-threat-map-frontend.onrender.com` (recommended) |
| frontend | `REACT_APP_BACKEND_URL` | the backend URL (it is baked into the build) |

## Rollback

- **Fastest:** Render dashboard → service → **Events** → choose the previous successful deploy
  → **Rollback**.
- **In git:** `git revert <bad commit>` on a branch, open a PR, merge, release a PATCH version.
  Never rewrite `main` history.
