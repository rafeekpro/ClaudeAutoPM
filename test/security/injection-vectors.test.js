/**
 * Security regression tests for injection vectors (issue #606)
 *
 * Demonstrates and guards against:
 *  - Shell injection via epic name, npm package name, az CLI filter values
 *  - Path traversal via PRD @file content references
 *  - Use of `sh -c` with user-controlled commands in pr-validation
 *  - Credential (auth token) logging in dashboard-serve
 *
 * Each test corresponds to a concrete attack vector found in the epic #605 audit.
 */

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..', '..');

// ---------------------------------------------------------------------------
// 1. pr-validation: no `sh -c`, commands parsed into argv arrays
// ---------------------------------------------------------------------------
test('pr-validation: parseCommand tokenizes into argv array (no sh -c)', () => {
  const PRValidation = require(path.join(ROOT, 'autopm/.claude/scripts/pr-validation.js'));
  const validator = new PRValidation();

  assert.strictEqual(typeof validator.parseCommand, 'function',
    'parseCommand helper must exist so commands run without a shell');

  const parts = validator.parseCommand('docker-compose run --rm app npm test');
  assert.deepStrictEqual(parts, ['docker-compose', 'run', '--rm', 'app', 'npm', 'test']);

  // Metacharacters must be treated as literal argv content, never shell syntax
  const malicious = validator.parseCommand('docker build -t "app; rm -rf /" .');
  assert.deepStrictEqual(malicious, ['docker', 'build', '-t', 'app; rm -rf /', '.']);
});

test('pr-validation: source no longer spawns sh -c', () => {
  const src = fs.readFileSync(path.join(ROOT, 'autopm/.claude/scripts/pr-validation.js'), 'utf8');
  assert.ok(!/spawn\(\s*['"]sh['"]\s*,\s*\[\s*['"]-c['"]/.test(src),
    "pr-validation must not use spawn('sh', ['-c', ...])");
});

// ---------------------------------------------------------------------------
// 2. epic name validation rejects shell metacharacters
// ---------------------------------------------------------------------------
test('epic: epic name with command substitution is rejected', () => {
  const epicCmd = require(path.join(ROOT, 'bin/commands/epic.js'));
  assert.strictEqual(typeof epicCmd.isValidEpicName, 'function',
    'epic command must export isValidEpicName');

  assert.strictEqual(epicCmd.isValidEpicName('$(touch /tmp/pwned)'), false);
  assert.strictEqual(epicCmd.isValidEpicName('foo; rm -rf /'), false);
  assert.strictEqual(epicCmd.isValidEpicName('foo`whoami`'), false);
  assert.strictEqual(epicCmd.isValidEpicName('../escape'), false);
  // Legitimate names still allowed
  assert.strictEqual(epicCmd.isValidEpicName('fullstack-app_v2.1'), true);
});

// ---------------------------------------------------------------------------
// 3. prd @file path traversal confined to project root
// ---------------------------------------------------------------------------
test('prd: @file path traversal outside project root is rejected', () => {
  const prdCmd = require(path.join(ROOT, 'lib/cli/commands/prd.js'));
  assert.strictEqual(typeof prdCmd.resolveContentFilePath, 'function',
    'prd command must export resolveContentFilePath');

  assert.throws(() => prdCmd.resolveContentFilePath('../../../etc/passwd'),
    /outside the project|traversal|not allowed/i);
  assert.throws(() => prdCmd.resolveContentFilePath('/etc/passwd'),
    /outside the project|traversal|not allowed/i);

  // A path inside the project resolves fine
  const ok = prdCmd.resolveContentFilePath('docs/spec.md');
  assert.strictEqual(ok, path.join(process.cwd(), 'docs/spec.md'));
});

// ---------------------------------------------------------------------------
// 4. AzureDevOpsCliWrapper escapes shell metacharacters in values
// ---------------------------------------------------------------------------
test('AzureDevOpsCliWrapper: values are shell-escaped, no quote breakout', () => {
  const Wrapper = require(path.join(ROOT, 'lib/providers/AzureDevOpsCliWrapper.js'));
  const wrapper = new Wrapper({ token: 't', organization: 'o', project: 'p' });

  assert.strictEqual(typeof wrapper._shellEscapeArg, 'function',
    'wrapper must provide a shell-escaping helper');

  const evil = 'x"; rm -rf / #';
  const escaped = wrapper._shellEscapeArg(evil);
  // After escaping, when embedded inside double quotes there must be no
  // un-escaped double-quote that could terminate the quoted string early.
  assert.ok(!/(^|[^\\])"/.test(escaped),
    `escaped value must not contain an unescaped double quote: ${escaped}`);

  // Backtick and $ must be neutralized
  const cmdSubst = wrapper._shellEscapeArg('$(whoami)`id`');
  assert.ok(/\\\$/.test(cmdSubst) && /\\`/.test(cmdSubst),
    `command-substitution chars must be escaped: ${cmdSubst}`);
});

// ---------------------------------------------------------------------------
// 5. PluginManager validates npm package names before exec
// ---------------------------------------------------------------------------
test('PluginManager: invalid npm package names are rejected', () => {
  const PluginManager = require(path.join(ROOT, 'lib/plugins/PluginManager.js'));
  assert.strictEqual(typeof PluginManager.isValidNpmPackageName, 'function',
    'PluginManager must expose isValidNpmPackageName');

  assert.strictEqual(PluginManager.isValidNpmPackageName('foo; rm -rf /'), false);
  assert.strictEqual(PluginManager.isValidNpmPackageName('$(touch x)'), false);
  assert.strictEqual(PluginManager.isValidNpmPackageName('pkg && evil'), false);
  // Valid npm names (scoped and unscoped) accepted
  assert.strictEqual(PluginManager.isValidNpmPackageName('@autopm/plugin-core'), true);
  assert.strictEqual(PluginManager.isValidNpmPackageName('lodash'), true);
});

// ---------------------------------------------------------------------------
// 6. setup-context7 validates package names before global install
// ---------------------------------------------------------------------------
test('setup-context7: package name validation rejects injection', () => {
  const SetupContext7 = require(path.join(ROOT, 'autopm/.claude/scripts/setup-context7.js'));
  const setup = new SetupContext7();
  assert.strictEqual(typeof setup.isValidPackageName, 'function',
    'setup-context7 must expose isValidPackageName');

  assert.strictEqual(setup.isValidPackageName('@modelcontextprotocol/server-github'), true);
  assert.strictEqual(setup.isValidPackageName('pkg; rm -rf /'), false);
  assert.strictEqual(setup.isValidPackageName('$(whoami)'), false);
});

// ---------------------------------------------------------------------------
// 7. dashboard-serve does not print the auth token value
// ---------------------------------------------------------------------------
test('dashboard-serve: auth token value is not printed to stdout', () => {
  const src = fs.readFileSync(path.join(ROOT, 'autopm/.claude/scripts/pm/dashboard-serve.js'), 'utf8');
  assert.ok(!/console\.log\([^)]*Token:\s*\$\{token\}/.test(src),
    'dashboard-serve must not console.log the raw token value');
});
