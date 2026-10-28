# Security policy

## Reporting a vulnerability

Please **do not** open a public issue for security problems. Use GitHub's
**Security → Report a vulnerability** (private vulnerability reporting) on this repository,
or contact the maintainer directly. Include steps to reproduce and the affected version
(`GET /health` shows it).

We aim to acknowledge reports within a week.

## Scope

CyberThreatMap displays **public** threat-intelligence data (SANS ISC top attacking IPs) and
stores no user data, credentials or secrets. The most relevant risks are vulnerable
dependencies, denial of service against the backend, and misconfigured CORS.

## Automated checks

Dependabot, dependency review, `npm audit` and CodeQL run automatically. How to read and
act on their findings is explained in [docs/SECURITY-CHECKS.md](docs/SECURITY-CHECKS.md).
