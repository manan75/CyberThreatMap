const express = require('express');
const cors = require('cors');

const { version } = require('./package.json');

// Builds the HTTP app without starting a server or the polling loop,
// so it can be exercised directly in tests.
// getStatus: () => ({ lastPollAt, lastThreatCount }) supplied by index.js
function createApp({ config, getStatus = () => ({}) }) {
    const app = express();
    app.use(cors(config.cors));

    // Lightweight liveness check used by Render and the CI smoke test.
    // It never calls the SANS API, so it stays fast and reliable.
    app.get('/health', (req, res) => {
        res.json({
            status: 'ok',
            version,
            environment: config.nodeEnv,
            uptimeSeconds: Math.round(process.uptime()),
            timestamp: new Date().toISOString(),
            ...getStatus()
        });
    });

    return app;
}

module.exports = { createApp };
