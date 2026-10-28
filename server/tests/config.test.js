const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { loadConfig, parseOrigins, DEFAULT_DEV_ORIGINS } = require('../config');

describe('loadConfig', () => {
    test('development defaults: port 4000 and local React origins only', () => {
        const config = loadConfig({});
        assert.equal(config.nodeEnv, 'development');
        assert.equal(config.port, 4000);
        assert.deepEqual(config.cors.origin, DEFAULT_DEV_ORIGINS);
        assert.deepEqual(config.warnings, []);
    });

    test('uses PORT from the environment (Render sets this)', () => {
        assert.equal(loadConfig({ PORT: '10000' }).port, 10000);
    });

    test('rejects an invalid PORT instead of silently using a default', () => {
        assert.throws(() => loadConfig({ PORT: 'abc' }), /Invalid PORT/);
        assert.throws(() => loadConfig({ PORT: '70000' }), /Invalid PORT/);
    });

    test('CORS_ORIGINS restricts origins in any environment', () => {
        const config = loadConfig({
            NODE_ENV: 'production',
            CORS_ORIGINS: 'https://threat-map.onrender.com/, https://example.org'
        });
        assert.deepEqual(config.cors.origin, ['https://threat-map.onrender.com', 'https://example.org']);
        assert.deepEqual(config.warnings, []);
    });

    test('CORS_ORIGINS="*" explicitly allows every origin', () => {
        assert.equal(loadConfig({ CORS_ORIGINS: '*' }).cors.origin, '*');
    });

    test('production without CORS_ORIGINS keeps the old open behaviour and warns', () => {
        const config = loadConfig({ NODE_ENV: 'production' });
        assert.equal(config.cors.origin, '*');
        assert.equal(config.warnings.length, 1);
        assert.match(config.warnings[0], /CORS_ORIGINS/);
    });
});

describe('parseOrigins', () => {
    test('ignores blanks and trailing slashes', () => {
        assert.deepEqual(parseOrigins(' http://a.com/ ,, http://b.com '), ['http://a.com', 'http://b.com']);
        assert.deepEqual(parseOrigins(undefined), []);
    });
});
