# Dependency and security checks

What runs, when, what makes it fail, and how to act on a finding.

## The checks

| Check | Where | When | Fails the build when | Permissions |
|---|---|---|---|---|
| **Dependabot version updates** | `.github/dependabot.yml` | weekly (npm), monthly (Actions) | n/a: opens PRs | managed by GitHub |
| **Dependabot security alerts / updates** | repo Settings → Code security | when an advisory is published | n/a: alert + PR | managed by GitHub |
| **Dependency review** | `security.yml` | every PR to `main` | the PR **adds or upgrades to** a package with a **high or critical** advisory | `contents: read` |
| **npm audit** | `security.yml` | PRs, pushes to any branch, Mondays 06:00 UTC | **critical** advisory anywhere in a lockfile; all findings are listed in the job summary | `contents: read` |
| **CodeQL** | `security.yml` | PRs, pushes to any branch, Mondays | reports alerts in **Security → Code scanning** | `contents: read`, `security-events: write` |

Why the scheduled run matters: new advisories are published for packages we already use.
The Monday run catches them even when nobody is pushing code.

> On a **fork**, Dependabot version updates are off until you enable them in
> **Insights → Dependency graph → Dependabot**. Dependabot alerts and security updates are
> switched on in **Settings → Code security**.

## Why the audit gate is "critical" and not "high"

`npm audit` reports every known advisory in the *whole* dependency tree, including build
tools that never run in production. Failing on "high" today would make CI permanently red
for issues we cannot fix without a breaking change, and a permanently red check gets ignored.

Instead the gate is layered:
1. **Dependency review** stops *new* high/critical problems from entering through a PR.
2. **npm audit** fails on *any* critical problem, and lists everything else for triage.
3. Known, accepted findings are documented below and tracked in the backlog.

## How to read an npm audit finding

```
ip-address  <=10.7.3
Severity: high
ip-address: Address6 ... allowing SSRF ... - https://github.com/advisories/GHSA-...
fix available via `npm audit fix --force`
Will install geoip-lite@1.2.2, which is a breaking change
node_modules/ip-address
  geoip-lite  1.3.0 - 2.0.1
```

Ask these questions in order:

1. **Which package, and how did it get here?** The indented lines show the chain
   (`geoip-lite` → `ip-address`). `npm ls <package>` shows every path.
2. **Does it run in production?** Packages under `react-scripts` (webpack, Jest, SVGO,
   PostCSS, webpack-dev-server) run only on a developer machine or in CI; they are not in the
   static bundle served to users. Server dependencies run in production.
3. **Is the vulnerable code reachable?** Read the advisory. For example, the `ip-address` issues
   are in IPv6/subnet helpers and HTML output that this app does not call directly.
4. **What does the fix cost?**
   - `fix available via npm audit fix`: a safe update within declared version ranges. Apply it,
     run the tests, open a PR.
   - `--force` / "breaking change": needs a planned story. Note that npm sometimes suggests a
     *downgrade* (like `geoip-lite@1.2.2` above), which you should not accept blindly.
5. **Decide:** fix now, schedule as a backlog story, or accept with a written reason.

| Severity | Runs in production | Action |
|---|---|---|
| Critical | any | Fix before merging (the CI gate enforces this) |
| High | yes | Fix this iteration, or create a "Must have" story |
| High | build/dev only | Backlog story; fix during tooling upgrades |
| Moderate/low | any | Let Dependabot handle it; review in the weekly triage |

## Reading dependency review results

The check fails with a table of the packages a PR introduces and their advisories.
Usually you choose a patched version or a different package. If the PR is a Dependabot
update that *reduces* risk but still lands on a version with a remaining advisory, record the
reason in the PR description before an admin overrides it.

## Reading CodeQL alerts

**Security → Code scanning** lists each alert with the code path that triggers it.
Fix real issues in a normal PR. If an alert is a false positive, **dismiss it with a reason**
("false positive" / "used in tests") so the decision is recorded, rather than ignoring it.

## Handling Dependabot pull requests

1. Wait for CI and Security checks. Green checks plus a patch/minor bump means review the
   changelog link and merge.
2. Major bumps: read the release notes, run the app locally, and treat it like a story.
3. If CI fails, the update broke something. Do not merge; comment or open an issue.

## Current baseline (2026-10-28)

Measured with `npm audit` on branch `feature/devops-pipeline`:

| Package | Before | After non-breaking `npm audit fix` | Remaining findings |
|---|---|---|---|
| server | 16 (1 critical, 11 high, 4 moderate) | **2** (0 critical, 1 high, 1 moderate) | `ip-address` via `geoip-lite`; the only npm suggestion is a breaking downgrade. Runtime dependency, vulnerable helpers not called directly. Backlog **US-14**. |
| client | 71 (3 critical, 34 high, 16 moderate, 18 low) | **35** (0 critical, 13 high, 6 moderate, 16 low) | All reachable only through `react-scripts@5` build/dev tooling; fixing needs replacing CRA's build tooling. Backlog **US-17**. |
