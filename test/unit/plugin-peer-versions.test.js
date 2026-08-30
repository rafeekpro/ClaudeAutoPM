/**
 * Workspace peer-dependency consistency guard.
 *
 * Every plugin under packages/ that peers on @claudeautopm/plugin-core must
 * declare a range the workspace copy of plugin-core actually satisfies. When
 * it doesn't, `npm ci` fails with ERESOLVE and npm resolves the peer against
 * a stale registry tarball instead of the workspace link.
 *
 * This broke in 2da146a ("chore(release): 4.0.0"), which bumped every plugin's
 * `version` and `engines` but left the peer ranges at ^3.0.0. It stayed
 * invisible for two months because every CI workflow installs with
 * --legacy-peer-deps (.github/workflows/test.yml:29), which skips peer
 * resolution entirely.
 *
 * NOT covered here on purpose: plugin.json's `compatibleWith`. That is a
 * different axis — PluginManager compares it against the ROOT package version,
 * not plugin-core's — and it is a `>=` range that 4.0.0 already satisfies.
 * Tightening it to a caret range would make every plugin fail to load the
 * moment the root package hits 5.0.0 (PluginManager.isCompatible pins majors).
 *
 * To fix a failure: update the peer range in the named package.json to match
 * plugin-core's current major, then regenerate package-lock.json.
 *
 * Runs under both jest (npm test) and node --test (npm run test:unit).
 */

'use strict';

if (typeof describe === 'undefined') {
  // Running under node --test: provide jest-like globals.
  const nodeTest = require('node:test');
  globalThis.describe = nodeTest.describe;
  globalThis.test = nodeTest.test;
}

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const PACKAGES_DIR = path.join(ROOT, 'packages');
const CORE = '@claudeautopm/plugin-core';

/** plugin-testing peers on the root package, not plugin-core — see file header. */
const NO_CORE_PEER_EXPECTED = new Set(['plugin-testing']);

function readManifest(dir) {
  const manifestPath = path.join(PACKAGES_DIR, dir, 'package.json');
  if (!fs.existsSync(manifestPath)) return null;
  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
}

function workspacePackages() {
  return fs.readdirSync(PACKAGES_DIR)
    .filter(dir => fs.statSync(path.join(PACKAGES_DIR, dir)).isDirectory())
    .filter(dir => readManifest(dir) !== null)
    .sort();
}

/** Major from a plain version ("4.0.0") or a caret/tilde range ("^4.0.0"). */
function majorOf(spec) {
  const match = /^[\^~]?(\d+)\./.exec(String(spec).trim());
  return match ? Number(match[1]) : null;
}

describe('workspace plugin peer dependencies', () => {
  const packages = workspacePackages();
  const coreVersion = readManifest('plugin-core')?.version;

  // A filter bug that matched nothing would make every assertion below pass.
  test('discovers the workspace packages', () => {
    assert.ok(packages.length >= 10, `expected the plugin packages, found ${packages.length}`);
    assert.ok(packages.includes('plugin-core'), 'plugin-core should be a workspace package');
    assert.ok(coreVersion, 'plugin-core must declare a version');
  });

  test('every declared plugin-core peer range matches plugin-core\'s major', () => {
    const coreMajor = majorOf(coreVersion);
    const mismatches = [];

    for (const dir of packages) {
      const range = readManifest(dir).peerDependencies?.[CORE];
      if (!range) continue;

      if (majorOf(range) !== coreMajor) {
        mismatches.push(`${dir}: peers on ${CORE}@"${range}" but workspace plugin-core is ${coreVersion}`);
      }
    }

    assert.strictEqual(mismatches.join('\n'), '', `\n${mismatches.join('\n')}\n`);
  });

  test('every plugin peers on plugin-core, except known exemptions', () => {
    const missing = packages.filter(dir =>
      dir !== 'plugin-core' &&
      !NO_CORE_PEER_EXPECTED.has(dir) &&
      !readManifest(dir).peerDependencies?.[CORE]
    );

    // Catches a NEW plugin added without a peer range, while leaving the
    // deliberate exemption visible rather than silently filtered away.
    assert.strictEqual(missing.join(', '), '', `packages missing a ${CORE} peer: ${missing.join(', ')}`);
  });

  test('plugin-core declares no peer on itself', () => {
    assert.ok(!readManifest('plugin-core').peerDependencies?.[CORE]);
  });
});
