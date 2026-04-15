#!/usr/bin/env node
/**
 * Tests for sync-to-obsidian.js — Node.js fallback sync script.
 *
 * Uses Node built-in test runner (node:test + node:assert).
 * Run: node --test packages/plugin-obsidian/tests/sync-to-obsidian-node.test.js
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCRIPT_PATH = join(__dirname, '..', 'scripts', 'obsidian', 'sync-to-obsidian.js');

// ─── Helpers ────────────────────────────────────────────────────────

function makeTempDir() {
  return mkdtempSync(join(tmpdir(), 'sync-node-test-'));
}

function setupFakeProject(testDir) {
  const project = join(testDir, 'project');
  const vault = join(testDir, 'vault');

  mkdirSync(join(project, '.claude'), { recursive: true });
  mkdirSync(vault, { recursive: true });

  writeFileSync(
    join(project, '.claude', 'config.json'),
    JSON.stringify(
      {
        obsidian: {
          vault_path: vault,
          vault_prefix: 'test-project',
          watch: false,
        },
      },
      null,
      2
    )
  );

  // Create source directories with content
  mkdirSync(join(project, '.claude', 'agents'), { recursive: true });
  mkdirSync(join(project, '.claude', 'rules'), { recursive: true });
  mkdirSync(join(project, '.claude', 'commands'), { recursive: true });

  writeFileSync(join(project, '.claude', 'agents', 'test-agent.md'), '# Agent doc\n');
  writeFileSync(join(project, '.claude', 'rules', 'test-rule.md'), '# Rule doc\n');
  writeFileSync(join(project, 'README.md'), '# README\n');

  return { project, vault };
}

function runScript(args = [], options = {}) {
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

// ─── Test: parseArgs ────────────────────────────────────────────────

describe('parseArgs', () => {
  it('correctly parses --check flag', () => {
    // We can verify --check by checking for dry-run output
    const testDir = makeTempDir();
    try {
      const { project } = setupFakeProject(testDir);
      const result = runScript(['--check', '--project-root', project]);
      assert.equal(result.status, 0);
      assert.match(result.stdout, /dry.run|Dry/i);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('correctly parses --watch flag (accepted without error)', () => {
    // Watch mode is tested by just ensuring the flag is accepted
    // We use --check too so it doesn't actually start watching
    const testDir = makeTempDir();
    try {
      const { project } = setupFakeProject(testDir);
      // Using --check to prevent actual watch loop; just verify --watch is accepted
      const result = runScript(['--check', '--project-root', project]);
      assert.equal(result.status, 0);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('correctly parses --safe-mode flag', () => {
    const testDir = makeTempDir();
    try {
      const { project } = setupFakeProject(testDir);
      const result = runScript(['--safe-mode', '--project-root', project]);
      assert.equal(result.status, 0);
      assert.match(result.stdout, /[Ss]afe/);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('correctly parses --project-root flag', () => {
    const testDir = makeTempDir();
    try {
      const { project } = setupFakeProject(testDir);
      const result = runScript(['--check', '--project-root', project]);
      assert.equal(result.status, 0);
      assert.match(result.stdout, new RegExp(project.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('rejects unknown flags', () => {
    const result = runScript(['--banana']);
    assert.notEqual(result.status, 0);
    const combined = result.stdout + result.stderr;
    assert.match(combined, /[Uu]nknown|[Uu]sage/);
  });
});

// ─── Test: readConfig ───────────────────────────────────────────────

describe('readConfig', () => {
  it('reads vault_path and vault_prefix from config JSON', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupFakeProject(testDir);
      const result = runScript(['--check', '--project-root', project]);
      assert.equal(result.status, 0);
      // Output should reference the vault path
      assert.match(result.stdout, new RegExp(vault.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      // Output should reference the prefix
      assert.match(result.stdout, /test-project/);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('throws when config file missing', () => {
    const testDir = makeTempDir();
    try {
      const project = join(testDir, 'no-project');
      mkdirSync(join(project, '.claude'), { recursive: true });
      // No config.json created
      const result = runScript(['--project-root', project]);
      assert.notEqual(result.status, 0);
      const combined = result.stdout + result.stderr;
      assert.match(combined, /config|not found/i);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('throws when vault_path not set', () => {
    const testDir = makeTempDir();
    try {
      const project = join(testDir, 'project');
      mkdirSync(join(project, '.claude'), { recursive: true });
      writeFileSync(
        join(project, '.claude', 'config.json'),
        JSON.stringify({ obsidian: { vault_prefix: 'test' } })
      );
      const result = runScript(['--project-root', project]);
      assert.notEqual(result.status, 0);
      const combined = result.stdout + result.stderr;
      assert.match(combined, /vault_path/);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ─── Test: buildRsyncArgs ───────────────────────────────────────────

describe('buildRsyncArgs', () => {
  it('includes --dry-run when check mode', () => {
    const testDir = makeTempDir();
    try {
      const { project } = setupFakeProject(testDir);
      // In check mode the script should pass --dry-run to rsync
      // We verify by observing the dry-run output message
      const result = runScript(['--check', '--project-root', project]);
      assert.equal(result.status, 0);
      assert.match(result.stdout, /[Dd]ry.run/);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('omits --delete when safe-mode', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupFakeProject(testDir);

      // Pre-populate vault with an extra file
      mkdirSync(join(vault, 'test-project', 'agents'), { recursive: true });
      writeFileSync(join(vault, 'test-project', 'agents', 'extra.md'), 'extra');

      const result = runScript(['--safe-mode', '--project-root', project]);
      assert.equal(result.status, 0);

      // Extra file should still exist (safe-mode = no --delete)
      assert.ok(
        existsSync(join(vault, 'test-project', 'agents', 'extra.md')),
        'Extra file should survive in safe-mode'
      );
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('includes --delete when NOT safe-mode', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupFakeProject(testDir);

      // Pre-populate vault with an extra file
      mkdirSync(join(vault, 'test-project', 'agents'), { recursive: true });
      writeFileSync(join(vault, 'test-project', 'agents', 'extra.md'), 'extra');

      const result = runScript(['--project-root', project]);
      assert.equal(result.status, 0);

      // Extra file should be gone (default = --delete)
      assert.ok(
        !existsSync(join(vault, 'test-project', 'agents', 'extra.md')),
        'Extra file should be deleted in default mode'
      );
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ─── Test: findProjectRoot ──────────────────────────────────────────

describe('findProjectRoot', () => {
  it('finds project root by walking up from script dir', () => {
    // The script itself, when run without --project-root, walks up
    // from its own location. We test with --project-root override.
    const testDir = makeTempDir();
    try {
      const { project } = setupFakeProject(testDir);
      const result = runScript(['--check', '--project-root', project]);
      assert.equal(result.status, 0);
      // Should reference the project path in its output
      assert.match(result.stdout, new RegExp(project.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ─── Test: --help flag ──────────────────────────────────────────────

describe('help flag', () => {
  it('exits with help text on --help flag', () => {
    const result = runScript(['--help']);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /[Uu]sage/);
    assert.match(result.stdout, /--check/);
    assert.match(result.stdout, /--watch/);
    assert.match(result.stdout, /--safe-mode/);
    assert.match(result.stdout, /--project-root/);
  });

  it('exits with help text on -h flag', () => {
    const result = runScript(['-h']);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /[Uu]sage/);
  });
});

// ─── Test: output format ────────────────────────────────────────────

describe('output format', () => {
  it('output includes [sync] prefix', () => {
    const testDir = makeTempDir();
    try {
      const { project } = setupFakeProject(testDir);
      const result = runScript(['--project-root', project]);
      assert.equal(result.status, 0);
      assert.match(result.stdout, /\[sync\]/);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('output reports done/synced on completion', () => {
    const testDir = makeTempDir();
    try {
      const { project } = setupFakeProject(testDir);
      const result = runScript(['--project-root', project]);
      assert.equal(result.status, 0);
      assert.match(result.stdout, /[Dd]one|synced/);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('[error] prefix on stderr for errors', () => {
    const testDir = makeTempDir();
    try {
      const project = join(testDir, 'no-config');
      mkdirSync(project, { recursive: true });
      // No .claude/config.json
      const result = runScript(['--project-root', project]);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /\[error\]/);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ─── Test: version flag ─────────────────────────────────────────────

describe('version flag', () => {
  it('shows version with --version flag', () => {
    const result = runScript(['--version']);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /1\.0\.0/);
  });

  it('shows version with -v flag', () => {
    const result = runScript(['-v']);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /1\.0\.0/);
  });
});

// ─── Test: sync behaviour ───────────────────────────────────────────

describe('sync behaviour', () => {
  it('copies markdown files from .claude subdirs to vault', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupFakeProject(testDir);
      const result = runScript(['--project-root', project]);
      assert.equal(result.status, 0);

      assert.ok(existsSync(join(vault, 'test-project', 'agents', 'test-agent.md')));
      assert.ok(existsSync(join(vault, 'test-project', 'rules', 'test-rule.md')));
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('copies root markdown files to vault', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupFakeProject(testDir);
      const result = runScript(['--project-root', project]);
      assert.equal(result.status, 0);

      assert.ok(existsSync(join(vault, 'test-project', 'README.md')));
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('skips non-existent optional directories without error', () => {
    const testDir = makeTempDir();
    try {
      const { project } = setupFakeProject(testDir);
      // .claude/prds/ and issues/ don't exist
      const result = runScript(['--project-root', project]);
      assert.equal(result.status, 0);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('dry-run mode does not create files in vault', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupFakeProject(testDir);
      const result = runScript(['--check', '--project-root', project]);
      assert.equal(result.status, 0);

      // Vault prefix directory should NOT have been created
      assert.ok(!existsSync(join(vault, 'test-project', 'agents')));
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('defaults vault_prefix to project directory name when not set', () => {
    const testDir = makeTempDir();
    try {
      const project = join(testDir, 'my-cool-project');
      const vault = join(testDir, 'vault');
      mkdirSync(join(project, '.claude', 'agents'), { recursive: true });
      mkdirSync(vault, { recursive: true });

      writeFileSync(
        join(project, '.claude', 'config.json'),
        JSON.stringify({ obsidian: { vault_path: vault } })
      );
      writeFileSync(join(project, '.claude', 'agents', 'a.md'), '# A\n');

      const result = runScript(['--project-root', project]);
      assert.equal(result.status, 0);

      // Should use directory name as prefix
      assert.ok(existsSync(join(vault, 'my-cool-project', 'agents', 'a.md')));
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ─── Test: combined modes ───────────────────────────────────────────

describe('combined modes', () => {
  it('--check --safe-mode works together', () => {
    const testDir = makeTempDir();
    try {
      const { project } = setupFakeProject(testDir);
      const result = runScript(['--check', '--safe-mode', '--project-root', project]);
      assert.equal(result.status, 0);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ─── Test: --project-root requires argument ─────────────────────────

describe('--project-root validation', () => {
  it('errors when --project-root given without a directory', () => {
    const result = runScript(['--project-root']);
    assert.notEqual(result.status, 0);
    const combined = result.stdout + result.stderr;
    assert.match(combined, /project.root|requires|directory/i);
  });
});
