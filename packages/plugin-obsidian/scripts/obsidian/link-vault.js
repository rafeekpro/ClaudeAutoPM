#!/usr/bin/env node
/**
 * link-vault.js — Scan project markdown files and inject [[wikilinks]]
 *
 * Adds a `## Related` section to each file with wikilinks to connected content.
 * Scans issues, epics, PRDs for cross-references (#NNN, epic names, PR references).
 *
 * Usage:
 *   node link-vault.js [--project-root DIR] [--dry-run]
 *
 * Node built-ins only.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, basename, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Output helpers ─────────────────────────────────────────────────

function log(msg)  { process.stdout.write(`[link]  ${msg}\n`); }
function warn(msg) { process.stderr.write(`[warn]  ${msg}\n`); }

// ─── Argument parsing ───────────────────────────────────────────────

function parseArgs(argv) {
  const args = { projectRoot: null, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--project-root':
        args.projectRoot = argv[++i];
        break;
      case '--dry-run':
      case '--check':
        args.dryRun = true;
        break;
      case '-h':
      case '--help':
        console.log('Usage: link-vault.js [--project-root DIR] [--dry-run]');
        console.log('  Scans project files and injects [[wikilinks]] for Obsidian Graph View');
        process.exit(0);
    }
  }
  return args;
}

// ─── File discovery ─────────────────────────────────────────────────

function findMarkdownFiles(dir) {
  const files = [];
  if (!existsSync(dir)) return files;

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      files.push(...findMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

// ─── Frontmatter parsing ────────────────────────────────────────────

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();
      // Strip quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      fm[key] = value;
    }
  }
  return fm;
}

// ─── Reference detection ────────────────────────────────────────────

function findReferences(content, filePath, projectRoot) {
  const refs = new Set();

  // Find #NNN issue references (not inside wikilinks already)
  const issueRefs = content.matchAll(/(?<!\[\[)#(\d{1,5})(?!\d)(?!\|)(?!\])/g);
  for (const match of issueRefs) {
    const num = match[1];
    // Check if issue file exists
    const issueFile = join(projectRoot, 'issues', `${num}.md`);
    const claudeIssueFile = join(projectRoot, '.claude', 'issues', `${num}.md`);
    if (existsSync(issueFile) || existsSync(claudeIssueFile)) {
      refs.add(`[[issues/${num}|#${num}]]`);
    }
  }

  // Find epic references in depends_on, parent fields
  const fm = parseFrontmatter(content);

  if (fm.depends_on) {
    // Parse array-like: [538, 539]
    const deps = fm.depends_on.replace(/[\[\]]/g, '').split(',').map(s => s.trim()).filter(Boolean);
    for (const dep of deps) {
      // Find which epic this task belongs to
      const epicDirs = existsSync(join(projectRoot, '.claude', 'epics'))
        ? readdirSync(join(projectRoot, '.claude', 'epics'))
        : [];
      for (const epicName of epicDirs) {
        const taskFile = join(projectRoot, '.claude', 'epics', epicName, `${dep}.md`);
        if (existsSync(taskFile)) {
          refs.add(`[[epics/${epicName}/${dep}|Task #${dep}]]`);
        }
      }
    }
  }

  if (fm.github && fm.github.includes('/issues/')) {
    const ghNum = fm.github.match(/\/issues\/(\d+)/);
    if (ghNum) {
      refs.add(`[[issues/${ghNum[1]}|#${ghNum[1]}]]`);
    }
  }

  // Detect parent epic from file path
  const relPath = relative(projectRoot, filePath);
  const epicMatch = relPath.match(/\.claude\/epics\/([^/]+)\//);
  if (epicMatch) {
    const epicName = epicMatch[1];
    const taskNum = basename(filePath, '.md');
    // Link to parent epic if this is a task file
    if (/^\d+$/.test(taskNum)) {
      refs.add(`[[epics/${epicName}/epic|${epicName}]]`);
    }
  }

  // Find PRD references
  if (fm.prd) {
    refs.add(`[[prds/${fm.prd}|${fm.prd}]]`);
  }

  return [...refs];
}

// ─── Wikilink injection ─────────────────────────────────────────────

function injectRelatedSection(content, links) {
  if (links.length === 0) return { content, changed: false };

  const relatedSection = `\n## Related\n\n${links.map(l => `- ${l}`).join('\n')}\n`;

  // Check if ## Related already exists
  const relatedIdx = content.indexOf('\n## Related');
  if (relatedIdx !== -1) {
    // Find end of existing Related section (next ## heading or EOF)
    const afterRelated = content.slice(relatedIdx + 1);
    const nextHeadingIdx = afterRelated.search(/\n## (?!Related)/);
    const endIdx = nextHeadingIdx !== -1
      ? relatedIdx + 1 + nextHeadingIdx
      : content.length;

    // Replace existing Related section
    const before = content.slice(0, relatedIdx);
    const after = content.slice(endIdx);
    return { content: before + relatedSection + after, changed: true };
  }

  // Append Related section
  return { content: content.trimEnd() + '\n' + relatedSection, changed: true };
}

// ─── Main ───────────────────────────────────────────────────────────

function main() {
  const userArgs = process.argv.slice(2);
  const args = parseArgs(userArgs);

  const projectRoot = args.projectRoot ? resolve(args.projectRoot) : process.cwd();

  // Directories to scan for wikilink injection
  const scanDirs = [
    join(projectRoot, 'issues'),
    join(projectRoot, '.claude', 'issues'),
    join(projectRoot, '.claude', 'epics'),
    join(projectRoot, '.claude', 'prds'),
    join(projectRoot, 'prds'),
  ];

  let totalFiles = 0;
  let linkedFiles = 0;
  let totalLinks = 0;

  for (const dir of scanDirs) {
    const files = findMarkdownFiles(dir);
    for (const filePath of files) {
      totalFiles++;

      const content = readFileSync(filePath, 'utf8');
      const links = findReferences(content, filePath, projectRoot);

      if (links.length === 0) continue;

      const { content: newContent, changed } = injectRelatedSection(content, links);

      if (changed) {
        if (args.dryRun) {
          log(`Would link: ${relative(projectRoot, filePath)} (${links.length} links)`);
        } else {
          writeFileSync(filePath, newContent, 'utf8');
          log(`Linked: ${relative(projectRoot, filePath)} (${links.length} links)`);
        }
        linkedFiles++;
        totalLinks += links.length;
      }
    }
  }

  console.log('');
  if (args.dryRun) {
    console.log(`Dry-run: ${linkedFiles} files would be linked (${totalLinks} links) out of ${totalFiles} scanned`);
  } else {
    console.log(`${linkedFiles} files linked (${totalLinks} links) out of ${totalFiles} scanned`);
  }
}

main();
