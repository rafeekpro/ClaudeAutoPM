import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const TEMPLATES_DIR = join(process.cwd(), 'packages/plugin-obsidian/templates');

describe('Obsidian templates', () => {
  const expectedFiles = [
    'MOC.md.tmpl',
    'DASHBOARD.md.tmpl',
    '_templates/issue.md',
    '_templates/prd.md',
    '_templates/epic.md',
    'diagrams/01-architecture.md',
    'diagrams/pizarra.excalidraw.md',
    'FRONTMATTER_SCHEMA.md',
  ];

  describe('file existence', () => {
    for (const file of expectedFiles) {
      it(`${file} exists`, () => {
        const filePath = join(TEMPLATES_DIR, file);
        assert.ok(existsSync(filePath), `Missing template: ${file}`);
      });
    }
  });

  describe('MOC.md.tmpl', () => {
    it('contains {{PREFIX}} placeholder', () => {
      const content = readFileSync(join(TEMPLATES_DIR, 'MOC.md.tmpl'), 'utf8');
      assert.ok(content.includes('{{PREFIX}}'), 'MOC.md.tmpl must contain {{PREFIX}} placeholder');
    });
  });

  describe('DASHBOARD.md.tmpl', () => {
    it('contains {{PREFIX}} placeholder', () => {
      const content = readFileSync(join(TEMPLATES_DIR, 'DASHBOARD.md.tmpl'), 'utf8');
      assert.ok(
        content.includes('{{PREFIX}}'),
        'DASHBOARD.md.tmpl must contain {{PREFIX}} placeholder'
      );
    });
  });

  describe('Templater templates', () => {
    const templaterFiles = ['_templates/issue.md', '_templates/prd.md', '_templates/epic.md'];

    for (const file of templaterFiles) {
      it(`${file} contains Templater syntax`, () => {
        const content = readFileSync(join(TEMPLATES_DIR, file), 'utf8');
        assert.ok(
          content.includes('<% tp.'),
          `${file} must contain Templater syntax (<% tp.)`
        );
      });
    }
  });

  describe('diagrams/01-architecture.md', () => {
    it('contains valid Mermaid code block', () => {
      const content = readFileSync(
        join(TEMPLATES_DIR, 'diagrams/01-architecture.md'),
        'utf8'
      );
      assert.ok(content.includes('```mermaid'), 'Must contain a ```mermaid code block');
      assert.ok(
        content.includes('graph') || content.includes('flowchart'),
        'Mermaid block must contain a graph or flowchart directive'
      );
    });
  });

  describe('diagrams/pizarra.excalidraw.md', () => {
    it('contains Excalidraw JSON', () => {
      const content = readFileSync(
        join(TEMPLATES_DIR, 'diagrams/pizarra.excalidraw.md'),
        'utf8'
      );
      assert.ok(
        content.includes('"type": "excalidraw"'),
        'Must contain Excalidraw JSON with type field'
      );
    });
  });

  describe('FRONTMATTER_SCHEMA.md', () => {
    it('documents all required fields', () => {
      const content = readFileSync(
        join(TEMPLATES_DIR, 'FRONTMATTER_SCHEMA.md'),
        'utf8'
      );
      const requiredFields = ['type', 'status', 'created', 'updated', 'tags'];
      for (const field of requiredFields) {
        assert.ok(
          content.includes(`\`${field}\``),
          `FRONTMATTER_SCHEMA.md must document the "${field}" field`
        );
      }
    });
  });

  describe('no hardcoded paths', () => {
    const templatedFiles = [
      'MOC.md.tmpl',
      'DASHBOARD.md.tmpl',
      '_templates/epic.md',
    ];

    for (const file of templatedFiles) {
      it(`${file} has no hardcoded vault paths`, () => {
        const content = readFileSync(join(TEMPLATES_DIR, file), 'utf8');
        // Paths like FROM "my-project/issues" would be hardcoded.
        // All folder references in dataview FROM clauses must use {{PREFIX}}.
        const fromClauses = content.match(/FROM\s+"([^"]+)"/g) || [];
        for (const clause of fromClauses) {
          assert.ok(
            clause.includes('{{PREFIX}}'),
            `Hardcoded path found in ${file}: ${clause} — should use {{PREFIX}}`
          );
        }
      });
    }
  });
});
