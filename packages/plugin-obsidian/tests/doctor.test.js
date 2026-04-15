#!/usr/bin/env node
/**
 * Tests for doctor.js -- Obsidian integration diagnostics.
 *
 * Uses Node built-in test runner (node:test + node:assert).
 * Run: node --test packages/plugin-obsidian/tests/doctor.test.js
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  existsSync,
  readFileSync,
  symlinkSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCRIPT_PATH = join(__dirname, '..', 'scripts', 'obsidian', 'doctor.js');

// --- Helpers ----------------------------------------------------------------

function makeTempDir() {
  return mkdtempSync(join(tmpdir(), 'doctor-test-'));
}

function runDoctor(args = [], options = {}) {
  try {
    const stdout = execFileSync('node', [SCRIPT_PATH, ...args], {
      encoding: 'utf8',
      timeout: 15000,
      ...options,
    });
    return { status: 0, stdout, stderr: '' };
  } catch (err) {
    return {
      status: err.status ?? 1,
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
    };
  }
}

function setupProject(testDir, config = null) {
  const project = join(testDir, 'project');
  const vault = join(testDir, 'vault');

  mkdirSync(join(project, '.claude'), { recursive: true });
  mkdirSync(vault, { recursive: true });

  if (config !== null) {
    writeFileSync(
      join(project, '.claude', 'config.json'),
      JSON.stringify(config, null, 2)
    );
  }

  return { project, vault };
}

function makeFullConfig(vault, prefix = 'test-project') {
  return {
    obsidian: {
      vault_path: vault,
      vault_prefix: prefix,
    },
  };
}

// --- Test: checkRsync -------------------------------------------------------

describe('checkRsync', () => {
  it('passes when rsync is available', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProject(testDir);
      // Create vault prefix structure so all checks can run
      mkdirSync(join(vault, 'test-project', 'issues'), { recursive: true });
      writeFileSync(
        join(project, '.claude', 'config.json'),
        JSON.stringify(makeFullConfig(vault), null, 2)
      );

      const result = runDoctor(['--project-root', project]);
      // rsync should show as pass (rsync is installed in CI and dev envs)
      assert.match(result.stdout, /rsync/);
      assert.match(result.stdout, /installed/i);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('fails gracefully when tool missing (uses PATH override)', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProject(testDir);
      writeFileSync(
        join(project, '.claude', 'config.json'),
        JSON.stringify(makeFullConfig(vault), null, 2)
      );

      // Run with a PATH that includes node but not rsync
      const nodeDir = dirname(process.execPath);
      const result = runDoctor(['--project-root', project], {
        env: { ...process.env, PATH: nodeDir },
      });
      const combined = result.stdout + result.stderr;
      assert.match(combined, /rsync/);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// --- Test: checkVaultPath ---------------------------------------------------

describe('checkVaultPath', () => {
  it('passes for existing writable directory', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProject(testDir);
      writeFileSync(
        join(project, '.claude', 'config.json'),
        JSON.stringify(makeFullConfig(vault), null, 2)
      );

      const result = runDoctor(['--project-root', project]);
      assert.match(result.stdout, /[Vv]ault\s*path/);
      assert.match(result.stdout, /ok/i);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('fails for non-existent path', () => {
    const testDir = makeTempDir();
    try {
      const { project } = setupProject(testDir);
      writeFileSync(
        join(project, '.claude', 'config.json'),
        JSON.stringify(
          { obsidian: { vault_path: '/tmp/nonexistent-vault-xyz', vault_prefix: 'x' } },
          null,
          2
        )
      );

      const result = runDoctor(['--project-root', project]);
      assert.notEqual(result.status, 0);
      const combined = result.stdout + result.stderr;
      assert.match(combined, /[Vv]ault/);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('fails when config has no obsidian section', () => {
    const testDir = makeTempDir();
    try {
      const { project } = setupProject(testDir, { version: '1.0' });

      const result = runDoctor(['--project-root', project]);
      assert.notEqual(result.status, 0);
      const combined = result.stdout + result.stderr;
      assert.match(combined, /obsidian|vault_path|config/i);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// --- Test: checkDotfolderIssues ---------------------------------------------

describe('checkDotfolderIssues', () => {
  it('warns when .claude/issues exists but issues/ does not', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProject(testDir);
      writeFileSync(
        join(project, '.claude', 'config.json'),
        JSON.stringify(makeFullConfig(vault), null, 2)
      );
      // Create .claude/issues as a real directory (not symlink)
      mkdirSync(join(project, '.claude', 'issues'), { recursive: true });
      writeFileSync(join(project, '.claude', 'issues', 'issue-1.md'), '# Issue 1\n');

      const result = runDoctor(['--project-root', project]);
      assert.match(result.stdout, /dotfolder|invisible/i);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('passes when issues/ exists', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProject(testDir);
      writeFileSync(
        join(project, '.claude', 'config.json'),
        JSON.stringify(makeFullConfig(vault), null, 2)
      );
      mkdirSync(join(project, 'issues'), { recursive: true });

      const result = runDoctor(['--project-root', project]);
      assert.match(result.stdout, /[Ii]ssues\s*location/);
      // Should not have the error indicator for issues location
      assert.ok(
        !result.stdout.match(/Issues\s*location.*dotfolder/i),
        'Should not warn about dotfolder when issues/ exists'
      );
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('passes when neither exists (no issues yet)', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProject(testDir);
      writeFileSync(
        join(project, '.claude', 'config.json'),
        JSON.stringify(makeFullConfig(vault), null, 2)
      );

      const result = runDoctor(['--project-root', project]);
      // Should pass or skip -- no error for issues location
      assert.ok(
        !result.stdout.match(/Issues\s*location.*dotfolder/i),
        'Should not warn when no issues directory exists at all'
      );
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// --- Test: checkDataviewPrefix ----------------------------------------------

describe('checkDataviewPrefix', () => {
  it('passes when vault/{prefix}/ structure exists', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProject(testDir);
      writeFileSync(
        join(project, '.claude', 'config.json'),
        JSON.stringify(makeFullConfig(vault, 'my-proj'), null, 2)
      );
      // Create the expected vault structure
      mkdirSync(join(vault, 'my-proj', 'issues'), { recursive: true });

      const result = runDoctor(['--project-root', project]);
      assert.match(result.stdout, /[Dd]ataview\s*prefix/);
      assert.match(result.stdout, /correct|ok/i);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// --- Test: checkSymlink -----------------------------------------------------

describe('checkSymlink', () => {
  it('passes when symlink target exists', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProject(testDir);
      writeFileSync(
        join(project, '.claude', 'config.json'),
        JSON.stringify(makeFullConfig(vault), null, 2)
      );
      // Create issues/ and symlink .claude/issues -> ../../issues
      mkdirSync(join(project, 'issues'), { recursive: true });
      symlinkSync(
        join(project, 'issues'),
        join(project, '.claude', 'issues')
      );

      const result = runDoctor(['--project-root', project]);
      assert.match(result.stdout, /[Ss]ymlink/);
      assert.match(result.stdout, /ok/i);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('warns when symlink is broken', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProject(testDir);
      writeFileSync(
        join(project, '.claude', 'config.json'),
        JSON.stringify(makeFullConfig(vault), null, 2)
      );
      // Create a symlink pointing to non-existent target
      symlinkSync(
        join(project, 'nonexistent-issues'),
        join(project, '.claude', 'issues')
      );

      const result = runDoctor(['--project-root', project]);
      assert.match(result.stdout, /[Ss]ymlink/);
      assert.match(result.stdout, /broken/i);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('passes when no symlink exists (not migrated)', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProject(testDir);
      writeFileSync(
        join(project, '.claude', 'config.json'),
        JSON.stringify(makeFullConfig(vault), null, 2)
      );

      const result = runDoctor(['--project-root', project]);
      // No error about symlink
      assert.ok(
        !result.stdout.match(/[Ss]ymlink.*broken/i),
        'Should not warn about broken symlink when none exists'
      );
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// --- Test: full doctor run --------------------------------------------------

describe('full doctor run', () => {
  it('returns exit 0 when all checks pass', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProject(testDir);
      writeFileSync(
        join(project, '.claude', 'config.json'),
        JSON.stringify(makeFullConfig(vault), null, 2)
      );
      // Create vault prefix directory so Dataview check passes
      mkdirSync(join(vault, 'test-project'), { recursive: true });
      // Create issues/ so dotfolder check passes
      mkdirSync(join(project, 'issues'), { recursive: true });

      const result = runDoctor(['--project-root', project]);
      assert.equal(result.status, 0);
      assert.match(result.stdout, /passed/i);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('returns exit 1 when a check fails', () => {
    const testDir = makeTempDir();
    try {
      const { project } = setupProject(testDir);
      writeFileSync(
        join(project, '.claude', 'config.json'),
        JSON.stringify(
          { obsidian: { vault_path: '/tmp/nonexistent-vault-xyz', vault_prefix: 'x' } },
          null,
          2
        )
      );

      const result = runDoctor(['--project-root', project]);
      assert.equal(result.status, 1);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// --- Test: output format ----------------------------------------------------

describe('output format', () => {
  it('matches expected pattern with header and summary', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProject(testDir);
      writeFileSync(
        join(project, '.claude', 'config.json'),
        JSON.stringify(makeFullConfig(vault), null, 2)
      );
      mkdirSync(join(vault, 'test-project'), { recursive: true });
      mkdirSync(join(project, 'issues'), { recursive: true });

      const result = runDoctor(['--project-root', project]);
      assert.equal(result.status, 0);

      // Header
      assert.match(result.stdout, /Obsidian Doctor/);
      // Separator (Unicode double-line: U+2550)
      assert.match(result.stdout, /[\u2550]+/);
      // Summary line with counts
      assert.match(result.stdout, /\d+\s+passed/i);
      // Status indicators
      assert.ok(
        result.stdout.includes('\u2705') || result.stdout.includes('PASS'),
        'Should contain pass indicators'
      );
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// --- Test: --help flag ------------------------------------------------------

describe('help flag', () => {
  it('shows usage on --help', () => {
    const result = runDoctor(['--help']);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /[Uu]sage/);
    assert.match(result.stdout, /--project-root/);
  });

  it('shows usage on -h', () => {
    const result = runDoctor(['-h']);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /[Uu]sage/);
  });
});
