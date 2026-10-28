# Contributing to CyberThreatMap

This project uses a simple **feature-branch + pull request** workflow. `main` is always
releasable: nothing is committed to it directly, and every change reaches it through a
reviewed pull request with green automated checks.

## 1. Pick up work

1. Find or create an issue using the **User story** or **Bug report** template.
   Stories come from [docs/BACKLOG.md](docs/BACKLOG.md); the current plan is in
   [docs/ITERATION-PLAN.md](docs/ITERATION-PLAN.md).
2. Assign yourself so others know it is in progress.

## 2. Create a branch

Always branch from an up-to-date `main`:

```bash
git switch main
git pull
git switch -c feature/short-description
```

| Prefix | Use for | Example |
|---|---|---|
| `feature/` | new functionality or tooling | `feature/devops-pipeline` |
| `fix/` | bug fixes | `fix/arc-colour-by-attack-type` |
| `docs/` | documentation only | `docs/render-setup` |
| `chore/` | dependencies, config, cleanup | `chore/update-axios` |
| `release/vX.Y.Z` | release preparation ([docs/RELEASE.md](docs/RELEASE.md)) | `release/v1.1.0` |

Keep branches short-lived (a few days at most) and focused on one issue.

## 3. Develop and test locally

Prerequisites: **Node.js 22 LTS or newer** and npm.

```bash
# Backend
cd server
npm ci                 # exact versions from package-lock.json
npm test               # unit tests (no internet needed)
npm run test:coverage  # same, with a coverage table
npm run dev            # start on :4000, reads server/.env if present
# optional: npm run check:live-feed   -> calls the real SANS ISC API once

# Frontend (second terminal)
cd client
npm ci
npm run lint
npm test               # watch mode; CI=true npm test runs once
npm start              # http://localhost:3000
```

Configuration is described in the README ("Configuration") and the `.env.example` files.

**Dependencies:** use `npm install <pkg>` so `package-lock.json` is updated, commit both files,
and keep new dependencies to a minimum. CI installs with `npm ci` using the npm bundled with
Node 22 (npm 10). If CI reports that the lockfile is out of sync after you used a newer npm,
regenerate it with `npx npm@10 install --package-lock-only`.

## 4. Commit

Small commits with clear messages. We use the
[Conventional Commits](https://www.conventionalcommits.org/) style:

```
feat(server): add /health endpoint
fix(client): colour arcs by attack type
test(server): cover GeoIP fallback labels
docs: explain CORS_ORIGINS
chore(deps): bump axios to 1.21.0
```

Add a line to `## [Unreleased]` in [CHANGELOG.md](CHANGELOG.md) for anything a user or
operator would notice.

## 5. Open a pull request

```bash
git push -u origin feature/short-description
```

Open a PR into `main`. The template asks for a summary, the linked issue (`Closes #12`),
how to test, and a checklist.

Automated checks run on every PR:

| Check | Workflow | Blocks merge when |
|---|---|---|
| **CI passed** | `ci.yml` | any server test, client lint, client test, build or `/health` smoke test fails |
| Dependency review | `security.yml` | the PR adds a dependency with a high/critical advisory |
| npm audit | `security.yml` | a critical advisory exists in either lockfile |
| CodeQL | `security.yml` | (reports alerts in the Security tab) |

## 6. Review and merge

- At least one approving review, all conversations resolved, all required checks green.
- Prefer **Squash and merge** so `main` has one commit per story.
- Delete the branch after merging.

### Recommended branch protection for `main`

Settings → Branches (or Rules → Rulesets) → add a rule for `main`:

- Require a pull request before merging (1 approval)
- Require status checks to pass: **CI passed**, **npm audit (server)**, **npm audit (client)**,
  **Dependency review (PR only)**
- Require branches to be up to date before merging
- Block force pushes and deletions

## Definition of Done

A story is done when:

- [ ] Its acceptance criteria are met
- [ ] Tests cover the new behaviour and all checks are green
- [ ] It has been reviewed and merged to `main` via a PR
- [ ] The changelog and documentation are updated
- [ ] There are no new high/critical security findings
