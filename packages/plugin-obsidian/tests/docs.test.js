import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..', '..');

describe('plugin-obsidian documentation', () => {
  describe('docs/plugins/obsidian.md', () => {
    const docPath = resolve(root, 'docs', 'plugins', 'obsidian.md');

    it('exists', () => {
      assert.ok(existsSync(docPath), `${docPath} must exist`);
    });

    it('contains required sections', () => {
      const content = readFileSync(docPath, 'utf8');
      const required = [
        'Overview',
        'Prerequisites',
        'Installation',
        'Commands',
        'Troubleshooting',
      ];
      for (const section of required) {
        assert.ok(
          content.includes(`## ${section}`),
          `Missing required section: ## ${section}`
        );
      }
    });
  });

  describe('packages/plugin-obsidian/README.md', () => {
    const readmePath = resolve(root, 'packages', 'plugin-obsidian', 'README.md');

    it('mentions obsidian setup command', () => {
      const content = readFileSync(readmePath, 'utf8');
      assert.ok(
        content.includes('obsidian setup'),
        'README must mention obsidian setup'
      );
    });

    it('mentions obsidian sync command', () => {
      const content = readFileSync(readmePath, 'utf8');
      assert.ok(
        content.includes('obsidian sync'),
        'README must mention obsidian sync'
      );
    });

    it('mentions obsidian doctor command', () => {
      const content = readFileSync(readmePath, 'utf8');
      assert.ok(
        content.includes('obsidian doctor'),
        'README must mention obsidian doctor'
      );
    });
  });

  describe('CHANGELOG.md', () => {
    const changelogPath = resolve(root, 'CHANGELOG.md');

    it('mentions plugin-obsidian', () => {
      const content = readFileSync(changelogPath, 'utf8');
      assert.ok(
        content.includes('plugin-obsidian'),
        'CHANGELOG must mention plugin-obsidian'
      );
    });
  });

  describe('README.md', () => {
    const readmePath = resolve(root, 'README.md');

    it('scenario table mentions Obsidian', () => {
      const content = readFileSync(readmePath, 'utf8');
      assert.ok(
        content.includes('Obsidian'),
        'README scenario table must mention Obsidian'
      );
    });
  });
});
