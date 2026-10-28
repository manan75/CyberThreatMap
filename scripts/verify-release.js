#!/usr/bin/env node
// Release gate: checks that a version is ready to be released.
//
//   node scripts/verify-release.js 1.1.0            -> validate
//   node scripts/verify-release.js v1.1.0 --notes   -> validate, then print the
//                                                     CHANGELOG section (release notes)
//
// Rules:
//   1. The version is valid SemVer (MAJOR.MINOR.PATCH).
//   2. server/package.json and client/package.json both carry that version.
//   3. CHANGELOG.md has a "## [X.Y.Z] - YYYY-MM-DD" section with content.
// No dependencies, so it runs before `npm ci` and on any Node version >= 18.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const args = process.argv.slice(2);
const printNotes = args.includes('--notes');
const raw = args.find(a => !a.startsWith('--'));

function fail(errors) {
    console.error('Release verification FAILED:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
}

if (!raw) fail(['Usage: node scripts/verify-release.js <version> [--notes]']);

const version = raw.replace(/^v/, '');
const errors = [];

if (!/^\d+\.\d+\.\d+$/.test(version)) {
    fail([`"${raw}" is not a MAJOR.MINOR.PATCH version`]);
}

for (const pkg of ['server', 'client']) {
    const { version: actual } = JSON.parse(fs.readFileSync(path.join(root, pkg, 'package.json'), 'utf8'));
    if (actual !== version) {
        errors.push(`${pkg}/package.json version is ${actual}, expected ${version} ` +
            `(run: cd ${pkg} && npm version ${version} --no-git-tag-version)`);
    }
}

// Plain string matching (no regex built from input) to find "## [X.Y.Z] - YYYY-MM-DD".
const lines = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8').split(/\r?\n/);
const prefix = `## [${version}] - `;
const start = lines.findIndex(line =>
    line.startsWith(prefix) && /^\d{4}-\d{2}-\d{2}$/.test(line.slice(prefix.length).trim()));
let notes = '';

if (start === -1) {
    errors.push(`CHANGELOG.md has no "## [${version}] - YYYY-MM-DD" section`);
} else {
    const end = lines.findIndex((line, i) => i > start && line.startsWith('## ['));
    notes = lines.slice(start + 1, end === -1 ? undefined : end)
        .filter(line => !/^\[.*\]: /.test(line)) // drop link reference definitions
        .join('\n')
        .trim();
    if (!notes) errors.push(`CHANGELOG.md section for ${version} is empty`);
}

if (errors.length) fail(errors);

if (printNotes) {
    console.log(notes);
} else {
    console.log(`Release ${version} verified: package versions match and CHANGELOG entry found.`);
}
