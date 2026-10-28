# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the
project uses [Semantic Versioning](https://semver.org/). See [docs/RELEASE.md](docs/RELEASE.md)
for how a release is cut.

## [Unreleased]

### Added
- `GET /health` backend endpoint returning status, version, environment, uptime and the
  time and size of the last SANS ISC poll. Render uses it as the health check (`render.yaml`).
- `server/config.js`: every environment variable (`NODE_ENV`, `PORT`, `CORS_ORIGINS`) is read
  in one place; an invalid `PORT` stops the server at start-up instead of failing later.
- `.env.example` files for server and client.
- Backend unit tests (Node's built-in `node:test`, 25 tests) for the collector, locator,
  configuration and HTTP app. External APIs are mocked, so tests run offline.
- Frontend tests (6) for the HUD, socket events, globe data and label generation, with
  `react-globe.gl` and `socket.io-client` mocked.
- `npm run lint` for the client, and `npm run test:coverage` / `npm run check:live-feed`
  for the server.
- GitHub Actions: CI (tests, lint, build, health smoke test), Security (dependency review,
  npm audit, CodeQL) and Release (verify, package, draft release).
- Dependabot configuration for npm (server, client) and GitHub Actions.
- Pull request template, issue forms (bug report, user story), `CONTRIBUTING.md`,
  `SECURITY.md`, backlog, iteration plan, release guide and lab demonstration guide in `docs/`.

### Changed
- CORS is now configurable: local React origins only in development, an explicit allowlist
  through `CORS_ORIGINS`, and the previous allow-all behaviour (with a warning) in production
  when `CORS_ORIGINS` is not set, so the existing Render deployment keeps working.
- The Express app is created in `server/app.js`; `server/index.js` keeps the polling and
  Socket.IO wiring.
- The manual live-API script `server/test.js` moved to `server/scripts/live-feed-check.js`
  so the test runner never calls the real API.

### Security
- Server lockfile: non-breaking `npm audit fix` (axios 1.13.2 → 1.21.0 and transitive
  packages); audit findings went from 16 (1 critical) to 2 (0 critical).
- Client lockfile: non-breaking `npm audit fix` (including socket.io-parser 4.2.4 → 4.2.7);
  findings went from 71 (3 critical) to 35 (0 critical), all inside `react-scripts` tooling.

## [1.0.0] - 2026-02-02

Baseline: the application as it was on `main` at commit `f8aee67`.

### Added
- Express + Socket.IO backend polling the SANS ISC top-attackers feed every 60 seconds.
- GeoIP enrichment with city → region → country fallback labels and heuristic attack
  classification (port scan, exploit attempt, DoS/flood).
- React 3D globe (react-globe.gl) with animated arcs, impact rings, labels, HUD and legend.
- Render blueprint (`render.yaml`) for the backend web service and the static frontend.

[Unreleased]: https://github.com/manan75/CyberThreatMap/compare/f8aee67...HEAD
[1.0.0]: https://github.com/manan75/CyberThreatMap/tree/f8aee6718a6c22340d1a012f3c6ca8d38e4ae2e3
