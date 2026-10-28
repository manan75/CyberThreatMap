const { test, describe, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');

const axios = require('axios');
const { fetchThreats } = require('../services/collector');

// axios.get is replaced in every test, so these tests never touch the network.
describe('fetchThreats', () => {
    beforeEach(() => {
        // Keep the test output readable; the collector logs on every call.
        mock.method(console, 'log', () => {});
        mock.method(console, 'error', () => {});
    });
    afterEach(() => mock.restoreAll());

    test('returns the array sent by the SANS ISC API', async () => {
        const feed = [{ ip: '1.2.3.4', attacks: 3, count: 30 }];
        const get = mock.method(axios, 'get', async () => ({ data: feed }));

        assert.deepEqual(await fetchThreats(), feed);
        assert.equal(get.mock.callCount(), 1);
        assert.match(get.mock.calls[0].arguments[0], /^https:\/\/isc\.sans\.edu\/api\/sources\/attacks\//);
    });

    test('returns [] when the API responds with an unexpected shape', async () => {
        mock.method(axios, 'get', async () => ({ data: { error: 'rate limited' } }));
        assert.deepEqual(await fetchThreats(), []);
    });

    test('returns [] instead of throwing when the request fails', async () => {
        mock.method(axios, 'get', async () => { throw new Error('ENOTFOUND isc.sans.edu'); });
        assert.deepEqual(await fetchThreats(), []);
        assert.equal(console.error.mock.callCount(), 1);
    });
});
