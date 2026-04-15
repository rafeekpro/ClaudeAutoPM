#!/usr/bin/env node
/**
 * Tests for setup.js — Obsidian setup wizard backend.
 *
 * Uses Node built-in test runner (node:test + node:assert).
 * Run: node --test packages/plugin-obsidian/tests/setup.test.js
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
  readdirSync,
  lstatSync,
  readlinkSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCRIPT_PATH = join(__dirname, '..', 'scripts', 'obsidian', 'setup.js');

// ─── Helpers ────────────────────────────────────────────────────────

function makeTempDir() {
  return mkdtempSync(join(tmpdir(), 'setup-test-'));
}

function runSetup(args = [], options = {}) {
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

function setupProjectDir(testDir, extraConfig = {}) {
  const project = join(testDir, 'project');
  const vault = join(testDir, 'vault');

  mkdirSync(join(project, '.claude'), { recursive: true });
  mkdirSync(vault, { recursive: true });

  if (Object.keys(extraConfig).length > 0) {
    writeFileSync(
      join(project, '.claude', 'config.json'),
      JSON.stringify(extraConfig, null, 2)
    );
  }

  return { project, vault };
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

// ─── Test: detectEnvironment ────────────────────────────────────────

describe('detectEnvironment', () => {
  it('returns linux, macos, or wsl', () => {
    // We test this indirectly via the config output
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProjectDir(testDir);
      const result = runSetup(
        ['--vault-path', vault, '--project-root', project],
        { cwd: project }
      );
      assert.equal(result.status, 0);

      const config = readJson(join(project, '.claude', 'config.json'));
      assert.ok(
        ['linux', 'macos', 'wsl'].includes(config.obsidian.environment),
        `Expected environment to be linux, macos, or wsl, got: ${config.obsidian.environment}`
      );
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ─── Test: mergeConfig ──────────────────────────────────────────────

describe('mergeConfig', () => {
  it('preserves existing keys when adding obsidian section', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProjectDir(testDir, {
        version: '3.5.1',
        tools: { docker: { enabled: false } },
        plugins: ['plugin-core'],
      });

      const result = runSetup(
        ['--vault-path', vault, '--prefix', 'test-proj', '--project-root', project],
        { cwd: project }
      );
      assert.equal(result.status, 0);

      const config = readJson(join(project, '.claude', 'config.json'));
      assert.equal(config.version, '3.5.1');
      assert.deepEqual(config.tools, { docker: { enabled: false } });
      assert.deepEqual(config.plugins, ['plugin-core']);
      assert.equal(config.obsidian.vault_path, vault);
      assert.equal(config.obsidian.vault_prefix, 'test-proj');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('creates new config file when none exists', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProjectDir(testDir);
      // No config.json written

      const result = runSetup(
        ['--vault-path', vault, '--prefix', 'new-proj', '--project-root', project],
        { cwd: project }
      );
      assert.equal(result.status, 0);

      assert.ok(existsSync(join(project, '.claude', 'config.json')));
      const config = readJson(join(project, '.claude', 'config.json'));
      assert.equal(config.obsidian.vault_path, vault);
      assert.equal(config.obsidian.vault_prefix, 'new-proj');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ─── Test: substituteTemplate ───────────────────────────────────────

describe('substituteTemplate', () => {
  it('replaces {{PREFIX}}, {{PROJECT_NAME}}, {{CREATED_DATE}}', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProjectDir(testDir);

      const result = runSetup(
        ['--vault-path', vault, '--prefix', 'my-proj', '--project-root', project],
        { cwd: project }
      );
      assert.equal(result.status, 0);

      // Check MOC.md for substitutions
      const mocPath = join(vault, 'my-proj', 'MOC.md');
      assert.ok(existsSync(mocPath), 'MOC.md should exist');
      const mocContent = readFileSync(mocPath, 'utf8');

      assert.ok(!mocContent.includes('{{PREFIX}}'), 'Should not contain {{PREFIX}}');
      assert.ok(!mocContent.includes('{{PROJECT_NAME}}'), 'Should not contain {{PROJECT_NAME}}');
      assert.ok(!mocContent.includes('{{CREATED_DATE}}'), 'Should not contain {{CREATED_DATE}}');
      assert.ok(mocContent.includes('my-proj'), 'Should contain the prefix');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ─── Test: generateTemplates ────────────────────────────────────────

describe('generateTemplates', () => {
  it('creates all expected files in vault directory', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProjectDir(testDir);

      const result = runSetup(
        ['--vault-path', vault, '--prefix', 'gen-test', '--project-root', project],
        { cwd: project }
      );
      assert.equal(result.status, 0);

      const prefix = join(vault, 'gen-test');

      // MOC and DASHBOARD
      assert.ok(existsSync(join(prefix, 'MOC.md')), 'MOC.md');
      assert.ok(existsSync(join(prefix, 'DASHBOARD.md')), 'DASHBOARD.md');

      // _templates
      assert.ok(existsSync(join(prefix, '_templates', 'issue.md')), '_templates/issue.md');
      assert.ok(existsSync(join(prefix, '_templates', 'prd.md')), '_templates/prd.md');
      assert.ok(existsSync(join(prefix, '_templates', 'epic.md')), '_templates/epic.md');

      // diagrams
      assert.ok(
        existsSync(join(prefix, 'diagrams', '01-architecture.md')),
        'diagrams/01-architecture.md'
      );
      assert.ok(
        existsSync(join(prefix, 'diagrams', 'pizarra.excalidraw.md')),
        'diagrams/pizarra.excalidraw.md'
      );
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ─── Test: applyCanonicalFrontmatter ────────────────────────────────

describe('applyCanonicalFrontmatter', () => {
  it('adds missing fields to a markdown file', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProjectDir(testDir);

      // Create issues directory with a file that has partial frontmatter
      mkdirSync(join(project, 'issues'), { recursive: true });
      writeFileSync(
        join(project, 'issues', 'test-issue.md'),
        '---\ntitle: Test Issue\n---\n\n# Test Issue\n'
      );

      const result = runSetup(
        ['--vault-path', vault, '--prefix', 'fm-test', '--project-root', project],
        { cwd: project }
      );
      assert.equal(result.status, 0);

      const content = readFileSync(join(project, 'issues', 'test-issue.md'), 'utf8');
      assert.ok(content.includes('type:'), 'Should have type field');
      assert.ok(content.includes('status:'), 'Should have status field');
      assert.ok(content.includes('created:'), 'Should have created field');
      assert.ok(content.includes('updated:'), 'Should have updated field');
      assert.ok(content.includes('tags:'), 'Should have tags field');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('does NOT overwrite existing fields', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProjectDir(testDir);

      mkdirSync(join(project, 'issues'), { recursive: true });
      writeFileSync(
        join(project, 'issues', 'existing.md'),
        '---\ntitle: My Title\nstatus: in-progress\ntype: task\n---\n\n# Content\n'
      );

      const result = runSetup(
        ['--vault-path', vault, '--prefix', 'fm-test', '--project-root', project],
        { cwd: project }
      );
      assert.equal(result.status, 0);

      const content = readFileSync(join(project, 'issues', 'existing.md'), 'utf8');
      assert.ok(content.includes('status: in-progress'), 'status should remain in-progress');
      assert.ok(content.includes('type: task'), 'type should remain task');
      assert.ok(content.includes('title: My Title'), 'title should remain My Title');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('skips files without frontmatter', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProjectDir(testDir);

      mkdirSync(join(project, 'issues'), { recursive: true });
      const originalContent = '# No Frontmatter\n\nJust plain markdown.\n';
      writeFileSync(join(project, 'issues', 'plain.md'), originalContent);

      const result = runSetup(
        ['--vault-path', vault, '--prefix', 'fm-test', '--project-root', project],
        { cwd: project }
      );
      assert.equal(result.status, 0);

      const content = readFileSync(join(project, 'issues', 'plain.md'), 'utf8');
      assert.equal(content, originalContent, 'File without frontmatter should be unchanged');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ─── Test: vault path validation ────────────────────────────────────

describe('vault path validation', () => {
  it('rejects non-existent path', () => {
    const testDir = makeTempDir();
    try {
      const { project } = setupProjectDir(testDir);
      const fakePath = join(testDir, 'nonexistent', 'vault');

      const result = runSetup(
        ['--vault-path', fakePath, '--project-root', project],
        { cwd: project }
      );
      assert.notEqual(result.status, 0);
      const combined = result.stdout + result.stderr;
      assert.match(combined, /does not exist/i);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ─── Test: argument parsing ─────────────────────────────────────────

describe('argument parsing', () => {
  it('--vault-path argument parsing works correctly', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProjectDir(testDir);

      const result = runSetup(
        ['--vault-path', vault, '--prefix', 'arg-test', '--project-root', project],
        { cwd: project }
      );
      assert.equal(result.status, 0);

      const config = readJson(join(project, '.claude', 'config.json'));
      assert.equal(config.obsidian.vault_path, vault);
      assert.equal(config.obsidian.vault_prefix, 'arg-test');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('prints usage and exits 1 when --vault-path is missing', () => {
    const testDir = makeTempDir();
    try {
      const { project } = setupProjectDir(testDir);

      const result = runSetup(['--project-root', project], { cwd: project });
      assert.notEqual(result.status, 0);
      const combined = result.stdout + result.stderr;
      assert.match(combined, /--vault-path/);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('defaults prefix to directory name when not provided', () => {
    const testDir = makeTempDir();
    try {
      const project = join(testDir, 'my-awesome-project');
      const vault = join(testDir, 'vault');
      mkdirSync(join(project, '.claude'), { recursive: true });
      mkdirSync(vault, { recursive: true });

      const result = runSetup(
        ['--vault-path', vault, '--project-root', project],
        { cwd: project }
      );
      assert.equal(result.status, 0);

      const config = readJson(join(project, '.claude', 'config.json'));
      assert.equal(config.obsidian.vault_prefix, 'my-awesome-project');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('--watch flag sets watch to true in config', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProjectDir(testDir);

      const result = runSetup(
        ['--vault-path', vault, '--watch', '--project-root', project],
        { cwd: project }
      );
      assert.equal(result.status, 0);

      const config = readJson(join(project, '.claude', 'config.json'));
      assert.equal(config.obsidian.watch, true);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('--no-watch flag sets watch to false in config', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProjectDir(testDir);

      const result = runSetup(
        ['--vault-path', vault, '--no-watch', '--project-root', project],
        { cwd: project }
      );
      assert.equal(result.status, 0);

      const config = readJson(join(project, '.claude', 'config.json'));
      assert.equal(config.obsidian.watch, false);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ─── Test: full setup flow ──────────────────────────────────────────

describe('full setup flow', () => {
  it('creates config, generates templates, handles missing issues/prds gracefully', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProjectDir(testDir);
      // No issues/ or prds/ directories

      const result = runSetup(
        ['--vault-path', vault, '--prefix', 'full-test', '--project-root', project],
        { cwd: project }
      );
      assert.equal(result.status, 0);

      // Config should be created
      assert.ok(existsSync(join(project, '.claude', 'config.json')));
      const config = readJson(join(project, '.claude', 'config.json'));
      assert.equal(config.obsidian.vault_path, vault);

      // Templates should be generated
      assert.ok(existsSync(join(vault, 'full-test', 'MOC.md')));
      assert.ok(existsSync(join(vault, 'full-test', 'DASHBOARD.md')));

      // Output should indicate success
      assert.match(result.stdout, /setup complete/i);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('applies frontmatter to existing issues when issues/ exists', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProjectDir(testDir);

      // Create issues and prds directories
      mkdirSync(join(project, 'issues'), { recursive: true });
      mkdirSync(join(project, 'prds'), { recursive: true });

      writeFileSync(
        join(project, 'issues', 'issue-1.md'),
        '---\ntitle: Issue 1\n---\n\n# Issue 1\n'
      );
      writeFileSync(
        join(project, 'prds', 'prd-1.md'),
        '---\ntitle: PRD 1\n---\n\n# PRD 1\n'
      );

      const result = runSetup(
        ['--vault-path', vault, '--prefix', 'fm-flow', '--project-root', project],
        { cwd: project }
      );
      assert.equal(result.status, 0);

      // Issues should have canonical fields
      const issueContent = readFileSync(join(project, 'issues', 'issue-1.md'), 'utf8');
      assert.ok(issueContent.includes('type:'), 'Issue should have type field');

      // PRDs should have canonical fields
      const prdContent = readFileSync(join(project, 'prds', 'prd-1.md'), 'utf8');
      assert.ok(prdContent.includes('type:'), 'PRD should have type field');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('handles .claude/issues migration to issues/', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProjectDir(testDir);

      // Create .claude/issues/ (no top-level issues/)
      mkdirSync(join(project, '.claude', 'issues'), { recursive: true });
      writeFileSync(
        join(project, '.claude', 'issues', 'migrated.md'),
        '---\ntitle: Migrated\n---\n\n# Migrated\n'
      );

      const result = runSetup(
        ['--vault-path', vault, '--prefix', 'migrate-test', '--project-root', project],
        { cwd: project }
      );
      assert.equal(result.status, 0);

      // issues/ should exist at top level
      assert.ok(existsSync(join(project, 'issues')), 'issues/ should exist');
      assert.ok(
        existsSync(join(project, 'issues', 'migrated.md')),
        'migrated.md should be in issues/'
      );

      // .claude/issues should be a symlink
      const stat = lstatSync(join(project, '.claude', 'issues'));
      assert.ok(stat.isSymbolicLink(), '.claude/issues should be a symlink');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('prints next steps on completion', () => {
    const testDir = makeTempDir();
    try {
      const { project, vault } = setupProjectDir(testDir);

      const result = runSetup(
        ['--vault-path', vault, '--prefix', 'next-test', '--project-root', project],
        { cwd: project }
      );
      assert.equal(result.status, 0);

      assert.match(result.stdout, /next steps/i);
      assert.match(result.stdout, /Dataview/i);
      assert.match(result.stdout, /obsidian:sync/i);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});
