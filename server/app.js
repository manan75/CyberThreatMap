const express = require('express');
const cors = require('cors');

const { version } = require('./package.json');

// Builds the HTTP app without starting a server or the polling loop,
// so it can be exercised directly in tests.
// getStatus: () => ({ lastPollAt, lastThreatCount }) supplied by index.js
function createApp({ config, getStatus = () => ({}) }) {
    const app = express();
    app.use(cors(config.cors));

    // Lightweight process liveness check used by Render and the CI smoke test.
    // It verifies that the Express/Node HTTP server is running and responsive.
    // It intentionally does not call external services (SANS ISC) synchronously so it
    // remains fast and avoids cascading restarts if the feed is slow or unreachable.
    // Feed freshness is tracked asynchronously via getStatus() (lastPollAt, lastThreatCount).
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
