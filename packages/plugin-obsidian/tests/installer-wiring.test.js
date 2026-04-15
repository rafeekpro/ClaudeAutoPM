import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..');
const INSTALL_JS = join(ROOT, 'install', 'install.js');
const POST_INSTALL_JS = join(ROOT, 'install', 'post-install-check.js');
const CLAUDE_MD_SECTION = join(ROOT, 'packages', 'plugin-obsidian', 'claude-md', 'obsidian-section.md');

describe('Installer wiring for plugin-obsidian', () => {
  const installSrc = fs.readFileSync(INSTALL_JS, 'utf8');
  const postInstallSrc = fs.readFileSync(POST_INSTALL_JS, 'utf8');

  it('install.js contains obsidian scenario key in configs', () => {
    assert.match(installSrc, /obsidian:\s*\{/);
  });

  it('install.js scenario menu mentions Obsidian', () => {
    assert.match(installSrc, /Obsidian/);
  });

  it('install.js choice map has an entry mapping to obsidian', () => {
    assert.match(installSrc, /['"]?\d['"]?\s*:\s*['"]obsidian['"]/);
  });

  it('install.js obsidian config includes plugin-core, plugin-pm, plugin-obsidian', () => {
    const obsidianBlock = installSrc.match(/obsidian:\s*\{[\s\S]*?plugins:\s*\[([^\]]*)\]/);
    assert.ok(obsidianBlock, 'obsidian config block with plugins array not found');
    const plugins = obsidianBlock[1];
    assert.match(plugins, /plugin-core/);
    assert.match(plugins, /plugin-pm/);
    assert.match(plugins, /plugin-obsidian/);
  });

  it('post-install-check.js references obsidian or vault', () => {
    assert.match(postInstallSrc, /obsidian|vault/i);
  });

  it('claude-md/obsidian-section.md exists and contains required sections', () => {
    assert.ok(fs.existsSync(CLAUDE_MD_SECTION), 'obsidian-section.md does not exist');
    const content = fs.readFileSync(CLAUDE_MD_SECTION, 'utf8');
    assert.match(content, /Vault Sync/);
    assert.match(content, /Frontmatter Convention/);
    assert.match(content, /Important Rules/);
  });

  it('claude-md/obsidian-section.md mentions unidirectional sync', () => {
    const content = fs.readFileSync(CLAUDE_MD_SECTION, 'utf8');
    assert.match(content, /unidirectional/i);
  });

  it('claude-md/obsidian-section.md includes frontmatter convention', () => {
    const content = fs.readFileSync(CLAUDE_MD_SECTION, 'utf8');
    assert.match(content, /type:\s*issue\|prd\|epic\|agent\|rule/);
    assert.match(content, /status:\s*open\|in-progress\|closed/);
  });
});
