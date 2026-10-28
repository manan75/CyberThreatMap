const { test, describe, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');

const geoip = require('geoip-lite');
const { enrichThreatData, classifyAttack } = require('../services/locator');

describe('classifyAttack', () => {
    test('low events per target is a port scan', () => {
        assert.equal(classifyAttack(100, 200), 'Port Scan'); // intensity 2
    });

    test('moderate events per target is an exploit attempt', () => {
        assert.equal(classifyAttack(10, 100), 'Exploit Attempt'); // intensity 10
    });

    test('high events per target is a DoS / flood', () => {
        assert.equal(classifyAttack(2, 1000), 'Denial of Service (DoS/DDoS) or Flooding Attack');
    });

    test('boundaries: 5 and 50 move to the next category', () => {
        assert.equal(classifyAttack(1, 5), 'Exploit Attempt');
        assert.equal(classifyAttack(1, 50), 'Denial of Service (DoS/DDoS) or Flooding Attack');
    });

    test('missing numbers fall back to unknown', () => {
        assert.equal(classifyAttack(undefined, undefined), 'Unknown Attack Type');
    });
});

describe('enrichThreatData', () => {
    afterEach(() => mock.restoreAll());

    function stubGeo(table) {
        mock.method(geoip, 'lookup', ip => table[ip] ?? null);
    }

    test('adds coordinates, location and attack type to each record', () => {
        stubGeo({
            '1.2.3.4': { country: 'DE', region: 'BE', city: 'Berlin', ll: [52.52, 13.405] }
        });

        const [result] = enrichThreatData([{ ip: '1.2.3.4', attacks: 10, count: 20 }]);

        assert.deepEqual(result.src, {
            ip: '1.2.3.4',
            country: 'DE',
            region: 'BE',
            city: 'Berlin',
            lat: 52.52,
            lng: 13.405,
            type: 'Port Scan'
        });
        assert.equal(result.magnitude, 20);
        assert.ok(!Number.isNaN(Date.parse(result.timestamp)));
    });

    test('skips IPs that GeoIP cannot locate', () => {
        stubGeo({ '1.1.1.1': { country: 'AU', region: '', city: 'Sydney', ll: [-33.8, 151.2] } });

        const result = enrichThreatData([
            { ip: '10.0.0.1', attacks: 1, count: 1 },
            { ip: '1.1.1.1', attacks: 1, count: 1 }
        ]);

        assert.equal(result.length, 1);
        assert.equal(result[0].src.ip, '1.1.1.1');
    });

    test('falls back to "region, country" when the city is missing', () => {
        stubGeo({ '5.5.5.5': { country: 'US', region: 'CA', city: '', ll: [36, -119] } });
        const [result] = enrichThreatData([{ ip: '5.5.5.5', attacks: 1, count: 1 }]);
        assert.equal(result.src.city, 'CA, US');
    });

    test('falls back to "MAPPED: country" when city and region are missing', () => {
        stubGeo({ '6.6.6.6': { country: 'CN', region: ' ', city: '  ', ll: [35, 105] } });
        const [result] = enrichThreatData([{ ip: '6.6.6.6', attacks: 1, count: 1 }]);
        assert.equal(result.src.city, 'MAPPED: CN');
    });

    test('returns an empty list for empty input', () => {
        assert.deepEqual(enrichThreatData([]), []);
    });

    test('real GeoIP database does not locate private addresses', () => {
        // Uses the bundled offline database, no network needed.
        assert.deepEqual(enrichThreatData([{ ip: '192.168.1.1', attacks: 1, count: 1 }]), []);
    });
});
