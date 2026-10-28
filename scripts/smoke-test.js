// Smoke test: starts the server on port 4100, waits for /health,
// verifies { status: "ok" }, then shuts down.
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 4100;
const serverDir = path.resolve(__dirname, '..', 'server');

console.log(`Starting server on port ${PORT} (NODE_ENV=test)...`);

const child = spawn('node', ['index.js'], {
    cwd: serverDir,
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'test' },
    stdio: 'ignore'
});

let cleanedUp = false;
function cleanup() {
    if (cleanedUp) return;
    cleanedUp = true;
    try {
        child.kill();
    } catch {}
}

process.on('exit', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

async function checkHealth() {
    return new Promise((resolve) => {
        const req = http.get(`http://127.0.0.1:${PORT}/health`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (res.statusCode === 200 && json.status === 'ok') {
                        resolve(json);
                        return;
                    }
                } catch {}
                resolve(null);
            });
        });
        req.on('error', () => resolve(null));
        req.setTimeout(1000, () => {
            req.destroy();
            resolve(null);
        });
    });
}

async function run() {
    const maxAttempts = 15;
    for (let i = 1; i <= maxAttempts; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const health = await checkHealth();
        if (health) {
            console.log(`\x1b[32m[CI OK] Smoke test passed!\x1b[0m Received 200 from /health:`);
            console.log(`  status: ${health.status}, version: ${health.version}, env: ${health.environment}`);
            cleanup();
            process.exit(0);
        }
    }
    console.error(`\x1b[31m[CI ERROR] Server did not become healthy within ${maxAttempts}s.\x1b[0m`);
    cleanup();
    process.exit(1);
}

run();
