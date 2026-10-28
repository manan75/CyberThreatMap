const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { createApp } = require('../app');
const { loadConfig } = require('../config');
const { version } = require('../package.json');

// Starts the Express app on a random free port and returns its base URL.
async function startApp(env, getStatus) {
    const app = createApp({ config: loadConfig(env), getStatus });
    const server = await new Promise(resolve => {
        const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });
    return { server, baseUrl: `http://127.0.0.1:${server.address().port}` };
}

describe('GET /health', () => {
    let server;
    let baseUrl;

    before(async () => {
        ({ server, baseUrl } = await startApp({ NODE_ENV: 'test' }, () => ({
            lastPollAt: '2026-01-01T00:00:00.000Z',
            lastThreatCount: 7
        })));
    });
    after(() => { server.closeAllConnections(); server.close(); });

    test('responds 200 with status, version and polling info', async () => {
        const res = await fetch(`${baseUrl}/health`);
        assert.equal(res.status, 200);

        const body = await res.json();
        assert.equal(body.status, 'ok');
        assert.equal(body.version, version);
        assert.equal(body.environment, 'test');
        assert.equal(body.lastThreatCount, 7);
        assert.equal(body.lastPollAt, '2026-01-01T00:00:00.000Z');
        assert.equal(typeof body.uptimeSeconds, 'number');
    });

    test('unknown routes return 404', async () => {
        const res = await fetch(`${baseUrl}/does-not-exist`);
        assert.equal(res.status, 404);
    });
});

describe('CORS', () => {
    let server;
    let baseUrl;

    before(async () => {
        ({ server, baseUrl } = await startApp({ CORS_ORIGINS: 'https://frontend.example' }));
    });
    after(() => { server.closeAllConnections(); server.close(); });

    test('allows a configured origin', async () => {
        const res = await fetch(`${baseUrl}/health`, { headers: { Origin: 'https://frontend.example' } });
        assert.equal(res.headers.get('access-control-allow-origin'), 'https://frontend.example');
    });

    test('does not allow an unknown origin', async () => {
        const res = await fetch(`${baseUrl}/health`, { headers: { Origin: 'https://evil.example' } });
        assert.equal(res.headers.get('access-control-allow-origin'), null);
    });
});
