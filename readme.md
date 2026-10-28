# 🌍 Global Cyber Threat Monitor (3D)

[![CI](https://github.com/manan75/CyberThreatMap/actions/workflows/ci.yml/badge.svg)](https://github.com/manan75/CyberThreatMap/actions/workflows/ci.yml)
[![Security](https://github.com/manan75/CyberThreatMap/actions/workflows/security.yml/badge.svg)](https://github.com/manan75/CyberThreatMap/actions/workflows/security.yml)

> *"Visualizing the invisible war happening on the internet — right now."*

![Project Screenshot](./screenshot.png)

---

## 📖 Table of Contents

- [The Story](#-the-story--wait-can-i-see-that-live)
- [The Challenge](#-the-challenge--where-is-the-data)
- [Tech Stack & Architecture](#️-tech-stack--architecture)
- [Computer Science Concepts Used](#-computer-science-concepts-used)
- [How to Run the Project](#-how-to-run-the-project)
- [Configuration](#️-configuration)
- [Testing](#-testing)
- [Development Workflow (Agile & DevOps)](#-development-workflow-agile--devops)
- [Future Improvements](#-future-improvements)
- [Acknowledgments](#-acknowledgments)

---

## ⚡ The Story — *"Wait… can I see that live?"*

This project started during a late-night YouTube rabbit hole.  
I was watching an [IBM video](https://youtu.be/z503nLsfe5s) explaining **DDoS (Distributed Denial of Service)** attacks — botnets, zombie machines, traffic floods, and how entire services can be knocked offline.

The explanations were clear, but abstract.

I kept thinking:

> *"What If we can see it all Live!"*

That curiosity led to the idea of building a **cyber-war room style visualization** — a real-time, global, 3D map of ongoing cyber threats.

This project is the result.

---

## 🚧 The Challenge — *"Where is the data?"*

The first assumption was naive:

> *"I'll just stream live attack data from the internet."*

Reality hit quickly:

1. **Live attack data is highly sensitive** — companies do not expose it publicly.
2. **Packet sniffing at scale** requires massive infrastructure and permissions.
3. Exposing real victim data would be unethical and illegal.

### 🔁 The Pivot

Instead of raw live traffic, I discovered the  
**SANS Internet Storm Center (ISC)** Threat Feed.

SANS collects data from **global honeypots** and publishes:
- Top attacking IPs
- Attack counts
- Update intervals of a few minutes

This changed the engineering problem:

| Before | After |
|------|------|
| Live packet streaming | Periodic threat polling |
| Infinite data firehose | Controlled, ethical data source |
| Direct visualization | Simulated real-time flow |

---

## 🛠️ Tech Stack & Architecture

The system follows a **Producer–Consumer architecture**.

### 🧠 Backend — *The Command Center*

- **Node.js + Express** — Central intelligence hub  
- **Axios** — Polls the SANS ISC threat feed every 60 seconds  
- **GeoIP-Lite** — Converts IPs to geographic coordinates (O(1) lookup)  
- **Socket.io** — Real-time broadcasting to connected clients  

📡 The backend collects, enriches, buffers, and streams threat intelligence.

### 🎨 Frontend — *The War Room*

- **React.js** — State management & live updates  
- **Globe.gl (Three.js / WebGL)** — 3D Earth with animated attack vectors  

Each arc represents:
- Source: Attacking IP (GeoIP-based)
- Destination: Simulated honeypot target
- Intensity: Derived from attack metrics

---

## 🎓 Computer Science Concepts Used

This project applies real engineering principles — not just visuals.

### 1️⃣ Polling vs WebSockets

**Problem:**  
The SANS API is REST-based, but the UI needs real-time updates.

**Wrong approach:**  
Frontend polling every second → API bans + inefficiency.

**Solution:**  
- Backend polls slowly (every 60 seconds)
- Backend pushes updates instantly via WebSockets

✔ Decoupled architecture  
✔ Scalable  
✔ API-friendly  

### 2️⃣ Heuristic Attack Classification

Raw data gives numbers — not intent.

A heuristic model infers attack type:

| Attack Ratio (attacks : count) | Classification |
|-------------------------------|---------------|
| ~1:1 | Port Scan / Reconnaissance |
| ~1:50+ | DDoS / Brute-force Flood |

This turns raw metrics into meaningful insight.

### 3️⃣ Data Normalization & Enrichment (Mini ETL)

Raw IPs alone cannot be visualized.

**ETL Pipeline:**

1. **Extract** — Parse IPs & metrics from JSON  
2. **Transform** — GeoIP lookup → Latitude & Longitude  
3. **Load** — Inject simulated honeypot targets and vectors  

✔ Ethical  
✔ Scalable  
✔ Visually expressive  

---

## 🚀 How to Run the Project

### ✅ Prerequisites

- Node.js 22 LTS or newer (CI tests Node 22 and 24)
- npm

### 🔥 Step 1: Start the Backend

```bash
cd server
npm ci
npm start
```

Expected output:

```
Backend is alive! (development)
Server running on: http://localhost:4000
Health check: http://localhost:4000/health
Socket Endpoint: ws://localhost:4000
```

Check it: `curl http://localhost:4000/health` →
`{"status":"ok","version":"1.0.0",...,"lastPollAt":"...","lastThreatCount":20}`

### 🌐 Step 2: Start the Frontend

```bash
cd client
npm ci
npm start
```

Open:

```
http://localhost:3000
```

---

## ⚙️ Configuration

All settings come from environment variables. Defaults work for local development, so
nothing needs to be set to run the project locally. See `server/.env.example` and
`client/.env.example`.

| Variable | Where | Default | Purpose |
|---|---|---|---|
| `NODE_ENV` | server | `development` | `production` on Render |
| `PORT` | server | `4000` | Render injects its own value |
| `CORS_ORIGINS` | server | dev: `http://localhost:3000,http://127.0.0.1:3000`; production: `*` + warning | Comma-separated browser origins allowed to call the API |
| `REACT_APP_BACKEND_URL` | client (build time) | `http://127.0.0.1:4000` | Backend URL the globe connects to |

Note: CORS is enforced by browsers for HTTP requests. The globe connects with a pure
WebSocket transport, which CORS does not cover.

---

## 🧪 Testing

```bash
cd server && npm test            # 25 unit tests, external APIs mocked (no internet needed)
cd server && npm run test:coverage
cd client && npm run lint && CI=true npm test   # 6 component tests, globe and socket mocked
```

`cd server && npm run check:live-feed` calls the real SANS ISC API once. It is a manual
check, not part of the test suite.

---

## 🔁 Development Workflow (Agile & DevOps)

| Topic | Where |
|---|---|
| **Start here:** project context for new contributors and AI agents | [context.md](context.md) |
| Branching, PRs, Definition of Done | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Backlog (user stories, priorities, acceptance criteria) | [docs/BACKLOG.md](docs/BACKLOG.md) |
| Iteration plan | [docs/ITERATION-PLAN.md](docs/ITERATION-PLAN.md) |
| CI, security and release workflows | [.github/workflows](.github/workflows) |
| Reading security findings | [docs/SECURITY-CHECKS.md](docs/SECURITY-CHECKS.md) |
| Releasing and deploying (manual) | [docs/RELEASE.md](docs/RELEASE.md), [CHANGELOG.md](CHANGELOG.md) |
| Lab demonstration script | [docs/DEVOPS-LAB-GUIDE.md](docs/DEVOPS-LAB-GUIDE.md) |

---

## 🔮 Future Improvements

- 🕰️ Historical timeline (attack playback)
- 🔊 Sound alerts for large-scale DDoS events
- 🧠 Clickable attack details (ports, protocol)
- 🚦 Global DEFCON-style threat indicator

---

## 🤝 Acknowledgments

- **SANS Internet Storm Center (ISC)** — Open threat intelligence
- **Globe.gl** — 3D visualization engine
- **IBM** — Inspiration for the project

