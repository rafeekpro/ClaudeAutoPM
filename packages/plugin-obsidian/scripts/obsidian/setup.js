#!/usr/bin/env node
/**
 * setup.js — Obsidian setup wizard backend.
 *
 * Non-interactive script that Claude Code executes on behalf of the user.
 * Configures an Obsidian vault for use with ClaudeAutoPM.
 *
 * Usage:
 *   node setup.js --vault-path /path/to/vault [--prefix my-project] [--watch] [--no-watch]
 *                  [--project-root /path/to/project]
 *
 * Node built-ins only (fs, path, child_process, os, url).
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, renameSync,
         symlinkSync, readdirSync, accessSync, constants, lstatSync } from 'node:fs';
import { join, basename, dirname, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { platform } from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Output helpers ─────────────────────────────────────────────────

function log(msg)  { process.stdout.write(`[setup] ${msg}\n`); }
function err(msg)  { process.stderr.write(`[error] ${msg}\n`); }
function warn(msg) { process.stderr.write(`[warn]  ${msg}\n`); }

// ─── Environment detection ─────────────────────────────────────────

function detectEnvironment() {
  if (platform() === 'darwin') {
    return 'macos';
  }
  try {
    const procVersion = readFileSync('/proc/version', 'utf8');
    if (/microsoft/i.test(procVersion)) {
      return 'wsl';
    }
  } catch {
    // /proc/version not available — not Linux or WSL
  }
  return 'linux';
}

// ─── Argument parsing ───────────────────────────────────────────────

function parseArgs(argv) {
  const args = {
    vaultPath: null,
    prefix: null,
    watch: false,
    projectRoot: null,
  };

  let i = 0;
  while (i < argv.length) {
    switch (argv[i]) {
      case '--vault-path':
        args.vaultPath = argv[++i];
        break;
      case '--prefix':
        args.prefix = argv[++i];
        break;
      case '--watch':
        args.watch = true;
        break;
      case '--no-watch':
        args.watch = false;
        break;
      case '--project-root':
        args.projectRoot = argv[++i];
        break;
      default:
        err(`Unknown option: ${argv[i]}`);
        printUsage();
        process.exit(1);
    }
    i++;
  }

  return args;
}

function printUsage() {
  process.stderr.write(`Usage: node setup.js --vault-path /path/to/vault [OPTIONS]

Options:
  --vault-path PATH    Path to Obsidian vault (required)
  --prefix NAME        Vault subfolder prefix (default: project directory name)
  --watch              Enable watch mode in config
  --no-watch           Disable watch mode in config (default)
  --project-root DIR   Override project root directory
`);
}

// ─── Project root detection ─────────────────────────────────────────

function findProjectRoot(startDir) {
  let dir = startDir || process.cwd();
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, '.claude'))) {
      return dir;
    }
    dir = dirname(dir);
  }
  // Fallback: use cwd
  return process.cwd();
}

// ─── Vault path validation ──────────────────────────────────────────

function validateVaultPath(vaultPath) {
  if (!existsSync(vaultPath)) {
    err(`Vault path does not exist: ${vaultPath}`);
    if (/^[A-Za-z]:[\\\/]/.test(vaultPath)) {
      err('Detected Windows path format. On WSL, use /mnt/c/... format:');
      const drive = vaultPath[0].toLowerCase();
      err(`  ${'/mnt/' + drive + vaultPath.slice(2).replace(/\\/g, '/')}`);
    }
    process.exit(1);
  }
  try {
    accessSync(vaultPath, constants.W_OK);
  } catch {
    err(`Vault path is not writable: ${vaultPath}`);
    process.exit(1);
  }
}

// ─── Config merging ─────────────────────────────────────────────────

function mergeConfig(configPath, obsidianSection) {
  let existing = {};
  if (existsSync(configPath)) {
    try {
      existing = JSON.parse(readFileSync(configPath, 'utf8'));
    } catch {
      // If config is malformed, start fresh but warn
      warn(`Could not parse ${configPath}, creating new config`);
    }
  }

  // Deep-merge: only touch the obsidian namespace
  existing.obsidian = { ...(existing.obsidian || {}), ...obsidianSection };

  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(configPath, JSON.stringify(existing, null, 2) + '\n');
  return existing;
}

// ─── Template substitution ──────────────────────────────────────────

function substituteTemplate(content, vars) {
  return content
    .replace(/\{\{PREFIX\}\}/g, vars.prefix)
    .replace(/\{\{PROJECT_NAME\}\}/g, vars.projectName)
    .replace(/\{\{CREATED_DATE\}\}/g, vars.createdDate);
}

// ─── Template generation ────────────────────────────────────────────

function generateTemplates(vaultDest, prefix, projectRoot) {
  // Find templates: check relative to script first, then source repo from project root
  const candidates = [
    join(__dirname, '..', '..', 'templates'),
    join(projectRoot, 'packages', 'plugin-obsidian', 'templates'),
  ];
  const templatesDir = candidates.find(d => existsSync(join(d, 'MOC.md.tmpl'))) || candidates[0];
  const createdDate = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const projectName = prefix;

  const vars = { prefix, projectName, createdDate };

  const templateMap = [
    { src: 'MOC.md.tmpl',                    dest: join(vaultDest, 'MOC.md') },
    { src: 'DASHBOARD.md.tmpl',              dest: join(vaultDest, 'DASHBOARD.md') },
    { src: '_templates/issue.md',            dest: join(vaultDest, '_templates', 'issue.md') },
    { src: '_templates/prd.md',              dest: join(vaultDest, '_templates', 'prd.md') },
    { src: '_templates/epic.md',             dest: join(vaultDest, '_templates', 'epic.md') },
    { src: 'diagrams/01-architecture.md',    dest: join(vaultDest, 'diagrams', '01-architecture.md') },
    { src: 'diagrams/pizarra.excalidraw.md', dest: join(vaultDest, 'diagrams', 'pizarra.excalidraw.md') },
  ];

  const generated = [];

  for (const { src, dest } of templateMap) {
    const srcPath = join(templatesDir, src);
    if (!existsSync(srcPath)) {
      warn(`Template not found: ${srcPath}`);
      continue;
    }

    mkdirSync(dirname(dest), { recursive: true });
    const content = readFileSync(srcPath, 'utf8');
    writeFileSync(dest, substituteTemplate(content, vars));
    generated.push(dest);
  }

  return generated;
}

// ─── Canonical frontmatter application ──────────────────────────────

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;

  const yamlBlock = match[1];
  const fields = {};
  for (const line of yamlBlock.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim();
    if (key) fields[key] = val;
  }

  return {
    raw: match[0],
    fields,
    body: content.slice(match[0].length),
  };
}

function serializeFrontmatter(fields) {
  const lines = ['---'];
  for (const [key, val] of Object.entries(fields)) {
    lines.push(`${key}: ${val}`);
  }
  lines.push('---');
  return lines.join('\n');
}

function applyCanonicalFrontmatter(filePath, dirType) {
  const content = readFileSync(filePath, 'utf8');
  const parsed = parseFrontmatter(content);

  // Skip files without frontmatter
  if (!parsed) return false;

  const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const defaults = {
    type: dirType === 'issues' ? 'issue' : dirType === 'prds' ? 'prd' : 'issue',
    status: 'open',
    created: now,
    updated: now,
    tags: dirType === 'issues' ? '[issue]' : `[${dirType === 'prds' ? 'prd' : 'issue'}]`,
  };

  let changed = false;
  const merged = { ...parsed.fields };

  for (const [key, val] of Object.entries(defaults)) {
    if (!(key in merged)) {
      merged[key] = val;
      changed = true;
    }
  }

  if (!changed) return false;

  const newContent = serializeFrontmatter(merged) + '\n' + parsed.body;
  writeFileSync(filePath, newContent);
  return true;
}

function applyFrontmatterToDir(dirPath, dirType) {
  if (!existsSync(dirPath)) return 0;

  let count = 0;
  const entries = readdirSync(dirPath);
  for (const entry of entries) {
    if (!entry.endsWith('.md')) continue;
    const filePath = join(dirPath, entry);
    try {
      if (applyCanonicalFrontmatter(filePath, dirType)) {
        count++;
      }
    } catch (e) {
      warn(`Could not process ${filePath}: ${e.message}`);
    }
  }
  return count;
}

// ─── Issues migration ───────────────────────────────────────────────

function handleIssuesMigration(projectRoot) {
  const topLevelIssues = join(projectRoot, 'issues');
  const claudeIssues = join(projectRoot, '.claude', 'issues');

  if (existsSync(topLevelIssues)) return false;
  if (!existsSync(claudeIssues)) return false;

  // Check if .claude/issues is already a symlink
  try {
    const stat = lstatSync(claudeIssues);
    if (stat.isSymbolicLink()) return false;
  } catch {
    return false;
  }

  // Move .claude/issues/ to issues/
  renameSync(claudeIssues, topLevelIssues);

  // Create symlink .claude/issues -> issues/
  // Use relative path for portability
  symlinkSync(join('..', 'issues'), claudeIssues);

  log('Migrated .claude/issues/ -> issues/ (symlink created)');
  return true;
}

// ─── Sync script copy ───────────────────────────────────────────────

function copySyncScript(projectRoot) {
  const src = join(__dirname, 'sync-to-obsidian.sh');
  const destDir = join(projectRoot, '.claude', 'scripts');
  const dest = join(destDir, 'sync-to-obsidian.sh');

  if (!existsSync(src)) {
    warn('Sync script not found at ' + src);
    return false;
  }

  mkdirSync(destDir, { recursive: true });
  copyFileSync(src, dest);

  try {
    execSync(`chmod +x "${dest}"`, { stdio: 'ignore' });
  } catch {
    // chmod may fail on some systems; not critical
  }

  return true;
}

// ─── Run first sync ─────────────────────────────────────────────────

function runFirstSync(projectRoot) {
  const scripts = [
    join(projectRoot, '.claude', 'scripts', 'sync-to-obsidian.sh'),
    join(__dirname, 'sync-to-obsidian.sh'),
  ];

  for (const script of scripts) {
    if (existsSync(script)) {
      try {
        execSync(`bash "${script}" --project-root "${projectRoot}"`, {
          stdio: 'pipe',
          timeout: 30000,
        });
        return true;
      } catch (e) {
        warn(`First sync failed: ${e.message}`);
        return false;
      }
    }
  }

  warn('Sync script not found, skipping first sync');
  return false;
}

// ─── Main ───────────────────────────────────────────────────────────

function main() {
  const userArgs = process.argv.slice(2);
  const args = parseArgs(userArgs);

  // Require --vault-path
  if (!args.vaultPath) {
    err('--vault-path is required');
    printUsage();
    process.exit(1);
  }

  // Convert Windows paths to WSL paths if needed (e.g., C:\Users\... → /mnt/c/Users/...)
  let rawVaultPath = args.vaultPath;
  if (detectEnvironment() === 'wsl' && /^[A-Za-z]:[\\\/]/.test(rawVaultPath)) {
    const drive = rawVaultPath[0].toLowerCase();
    rawVaultPath = '/mnt/' + drive + rawVaultPath.slice(2).replace(/\\/g, '/');
    log(`Converted Windows path to WSL: ${rawVaultPath}`);
  }

  // Resolve paths
  const vaultPath = resolve(rawVaultPath);
  const projectRoot = args.projectRoot ? resolve(args.projectRoot) : findProjectRoot(process.cwd());
  const prefix = args.prefix || basename(projectRoot);
  const configPath = join(projectRoot, '.claude', 'config.json');
  const vaultDest = join(vaultPath, prefix);

  // 1. Detect environment
  const environment = detectEnvironment();
  log(`Environment: ${environment}`);

  // 2. Validate vault path
  validateVaultPath(vaultPath);
  log(`Vault path: ${vaultPath}`);

  // 3. Merge config
  const obsidianConfig = {
    vault_path: vaultPath,
    vault_prefix: prefix,
    watch: args.watch,
    environment,
  };

  mergeConfig(configPath, obsidianConfig);
  log('Config updated: .claude/config.json');

  // 4. Generate templates
  const generated = generateTemplates(vaultDest, prefix, projectRoot);
  log(`Generated ${generated.length} template files`);

  // 5. Apply canonical frontmatter
  const issuesDir = join(projectRoot, 'issues');
  const prdsDir = join(projectRoot, 'prds');

  // Handle migration first (before frontmatter application)
  handleIssuesMigration(projectRoot);

  const issuesUpdated = applyFrontmatterToDir(issuesDir, 'issues');
  const prdsUpdated = applyFrontmatterToDir(prdsDir, 'prds');
  if (issuesUpdated > 0 || prdsUpdated > 0) {
    log(`Applied canonical frontmatter: ${issuesUpdated} issues, ${prdsUpdated} PRDs`);
  }

  // 6. Copy sync script
  copySyncScript(projectRoot);

  // 7. Run first sync
  const syncOk = runFirstSync(projectRoot);

  // 8. Print summary
  const envLabel = environment === 'wsl' ? 'WSL2' : environment === 'macos' ? 'macOS' : 'Linux';

  process.stdout.write(`
\u2705 Obsidian setup complete!

Vault: ${vaultPath}
Prefix: ${prefix}
Environment: ${envLabel}

Generated files:
  ${vaultDest}/MOC.md
  ${vaultDest}/DASHBOARD.md
  ${vaultDest}/_templates/ (3 templates)
  ${vaultDest}/diagrams/ (2 diagrams)

${syncOk ? 'First sync completed.' : 'First sync skipped (sync script not available).'}

Next steps:
  1. Open the vault folder in Obsidian
  2. Install recommended plugins:
     - Dataview: https://obsidian.md/plugins?id=dataview
     - Templater: https://obsidian.md/plugins?id=templater-obsidian
     - Excalidraw: https://obsidian.md/plugins?id=obsidian-excalidraw-plugin
     - Mermaid Tools: https://obsidian.md/plugins?id=mermaid-tools
  3. Run /obsidian:sync --watch for continuous sync
`);
}

main();
