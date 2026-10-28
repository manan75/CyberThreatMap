# Iteration plan

Three one-week iterations (Scrum-style, sized for a small student team).
Stories and acceptance criteria are in [BACKLOG.md](BACKLOG.md).

## Working agreement

| Event | When | Output |
|---|---|---|
| Iteration planning | Day 1, 30 min | Iteration goal + chosen stories moved to "In progress" issues |
| Stand-up (async is fine) | Daily, 5 min | What I did, what I'll do, blockers |
| Backlog refinement | Mid-iteration, 20 min | Next stories have acceptance criteria and estimates |
| Review / demo | Last day, 20 min | Merged stories shown working; changelog updated |
| Retrospective | Last day, 15 min | One thing to keep, one thing to change |

**Definition of Ready:** the story has a user, a goal, testable acceptance criteria, an estimate,
and no unresolved blockers.
**Definition of Done:** see [CONTRIBUTING.md](../CONTRIBUTING.md#definition-of-done).

Suggested board columns (GitHub Projects): **Backlog → Ready → In progress → In review → Done**.
An issue moves to *In review* when its PR is opened and to *Done* when the PR is merged.

---

## Iteration 1: DevOps foundation ✅ (implemented on `feature/devops-pipeline`)

**Goal:** every change is automatically tested, built and security-checked, and the team has
a written way of working.

| Story | Points | Status |
|---|---|---|
| US-01 CI on every push and PR | 3 | Done |
| US-02 Offline backend unit tests | 3 | Done |
| US-03 Frontend component tests | 2 | Done |
| US-04 Health endpoint | 1 | Done |
| US-05 Explicit config and safe CORS | 2 | Done |
| US-06 Templates and contribution guide | 1 | Done |
| US-07 Dependency and security automation | 3 | Done |
| US-08 Changelog and release workflow | 3 | Done |
| **Total** | **18** | |

Review notes (what we learned):
- The original test script always failed and the only frontend test could not run: there was
  effectively no safety net before this iteration.
- A lockfile written by a newer npm broke `npm ci` on the CI runner. CI caught it on the first
  push, which is exactly the point of CI. The fix and the guidance are in `CONTRIBUTING.md`.
- Writing tests surfaced a real bug (US-09: arcs never turn red), which goes into the next iteration.

## Iteration 2: reliability and production hardening (planned)

**Goal:** production is protected by process (branch rules, manual deploys) and the app
behaves well when the data source is slow or a user has just connected.

| Story | Points | Note |
|---|---|---|
| US-09 Colour arcs by attack type | 1 | bug found in Iteration 1 |
| US-10 Protect `main` with required checks | 1 | repository admin |
| US-11 Restrict production CORS | 1 | needs owner approval (Render setting) |
| US-13 Snapshot for new clients | 2 | |
| US-15 SANS time-outs and failure reporting | 2 | |
| US-12 Freshness and errors in the HUD | 2 | builds on US-15 |
| US-16 Reproducible, manual Render deploys | 1 | needs owner approval |
| **Total** | **10** | lower than 18 on purpose: these touch production |

Release at the end: **v1.1.0** following [RELEASE.md](RELEASE.md).

## Iteration 3: security debt and performance (planned)

**Goal:** reduce remaining dependency findings and improve load time.

| Story | Points |
|---|---|
| US-14 Clear the `ip-address` advisory | 2 |
| US-17 Spike: replace CRA build tooling | 5 |
| US-18 Reduce initial bundle | 3 |
| **Total** | **10** |

Release at the end: **v1.2.0** (or v1.1.1 if only fixes are merged).

## Tracking

- Burn-down: count the remaining points in the iteration each day (GitHub Projects' "Insights"
  chart can do this from a *Points* number field).
- Velocity: points finished per iteration (Iteration 1 = 18). Use the average of recent
  iterations when planning the next one.
