/**
 * Jest TDD Tests for Template Engine
 *
 * Comprehensive test suite for the template rendering engine
 * Following strict TDD: ALL TESTS WRITTEN FIRST (RED PHASE)
 *
 * Test Coverage:
 * - Template discovery (built-in vs user custom)
 * - Variable substitution {{variable}}
 * - Auto-generated variables (id, timestamp, author, date)
 * - Conditionals {{#if}}...{{/if}}
 * - Loops {{#each}}...{{/each}}
 * - Template validation
 * - Error handling
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const TemplateEngine = require('../../lib/template-engine');

describe('Template Engine - Comprehensive Jest Tests', () => {
  let tempDir;
  let builtInDir;
  let userDir;
  let engine;
  const tempDirs = []; // Track all temp dirs for cleanup

  beforeEach(() => {
    // Create isolated test environment (NO process.chdir!)
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'template-engine-test-'));
    tempDirs.push(tempDir); // Track for cleanup

    // Create user template directories with absolute paths
    userDir = path.join(tempDir, '.claude', 'templates');
    fs.mkdirSync(path.join(userDir, 'prds'), { recursive: true });
    fs.mkdirSync(path.join(userDir, 'epics'), { recursive: true });
    fs.mkdirSync(path.join(userDir, 'tasks'), { recursive: true });

    // Create built-in templates directory with absolute paths
    builtInDir = path.join(tempDir, 'autopm', '.claude', 'templates');
    fs.mkdirSync(path.join(builtInDir, 'prds'), { recursive: true });
    fs.mkdirSync(path.join(builtInDir, 'epics'), { recursive: true });
    fs.mkdirSync(path.join(builtInDir, 'tasks'), { recursive: true });

    // Initialize engine with custom paths for testing (both builtInDir and userDir)
    engine = new TemplateEngine(builtInDir, userDir);
  });

  // Cleanup ALL temp dirs after all tests complete (safer than afterEach)
  afterAll(() => {
    tempDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        try {
          fs.rmSync(dir, { recursive: true, force: true });
        } catch (err) {
          // Ignore cleanup errors
        }
      }
    });
  });

  describe('Template Discovery', () => {
    test('1. should find built-in template', () => {
      // Create built-in template
      const builtInPath = path.join(tempDir, 'autopm', '.claude', 'templates', 'prds', 'api-feature.md');
      fs.writeFileSync(builtInPath, '# Built-in API Feature Template');

      const templatePath = engine.findTemplate('prds', 'api-feature');

      expect(templatePath).toBe(builtInPath);
      expect(fs.existsSync(templatePath)).toBe(true);
    });

    test('2. should find user custom template (overrides built-in)', () => {
      // Create both templates using absolute paths
      const builtInPath = path.join(builtInDir, 'prds', 'api-feature.md');
      const userPath = path.join(userDir, 'prds', 'api-feature.md');

      fs.writeFileSync(builtInPath, '# Built-in');
      fs.writeFileSync(userPath, '# User Custom');

      const templatePath = engine.findTemplate('prds', 'api-feature');

      // Use fs.realpathSync to get canonical paths (handles /var vs /private/var on macOS)
      expect(fs.realpathSync(templatePath)).toBe(fs.realpathSync(userPath));
      expect(fs.readFileSync(templatePath, 'utf8')).toContain('User Custom');
    });

    test('3. should return null for non-existent template', () => {
      const templatePath = engine.findTemplate('prds', 'non-existent');

      expect(templatePath).toBeNull();
    });

    test('4. should list all templates (built-in + user)', () => {
      // Create built-in templates using absolute paths
      fs.writeFileSync(
        path.join(builtInDir, 'prds', 'api-feature.md'),
        'built-in'
      );
      fs.writeFileSync(
        path.join(builtInDir, 'prds', 'ui-feature.md'),
        'built-in'
      );

      // Create user templates using absolute paths
      fs.writeFileSync(path.join(userDir, 'prds', 'custom-feature.md'), 'user');

      const templates = engine.listTemplates('prds');

      expect(templates).toHaveLength(3);
      expect(templates.find(t => t.name === 'api-feature' && !t.custom)).toBeDefined();
      expect(templates.find(t => t.name === 'ui-feature' && !t.custom)).toBeDefined();
      expect(templates.find(t => t.name === 'custom-feature' && t.custom)).toBeDefined();
    });

    test('5. should list only user templates when no built-in exist', () => {
      fs.writeFileSync(path.join(userDir, 'prds', 'my-template.md'), 'user only');

      const templates = engine.listTemplates('prds');

      expect(templates).toHaveLength(1);
      expect(templates[0]).toEqual({ name: 'my-template', custom: true });
    });

    test('6. should list only built-in templates when no user templates exist', () => {
      fs.writeFileSync(
        path.join(builtInDir, 'prds', 'bug-fix.md'),
        'built-in'
      );

      const templates = engine.listTemplates('prds');

      expect(templates).toHaveLength(1);
      expect(templates[0]).toEqual({ name: 'bug-fix', custom: false });
    });
  });

  describe('Auto-Generated Variables', () => {
    test('7. should generate auto variables (id, timestamp, author)', () => {
      const autoVars = engine.generateAutoVariables();

      expect(autoVars).toHaveProperty('id');
      expect(autoVars).toHaveProperty('timestamp');
      expect(autoVars).toHaveProperty('date');
      expect(autoVars).toHaveProperty('author');

      // Validate formats
      expect(autoVars.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(autoVars.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(autoVars.author).toBeTruthy();
    });

    test('8. should use USER env variable for author', () => {
      const originalUser = process.env.USER;
      process.env.USER = 'testuser';

      const autoVars = engine.generateAutoVariables();

      expect(autoVars.author).toBe('testuser');

      // Restore
      if (originalUser) {
        process.env.USER = originalUser;
      } else {
        delete process.env.USER;
      }
    });

    test('9. should generate sequential IDs (prd-001, prd-002)', () => {
      // Create some existing PRDs using absolute paths
      const prdsDir = path.join(tempDir, '.claude', 'prds');
      fs.mkdirSync(prdsDir, { recursive: true });
      fs.writeFileSync(path.join(prdsDir, 'prd-001.md'), 'content');
      fs.writeFileSync(path.join(prdsDir, 'prd-002.md'), 'content');

      const id = engine.generateId('prd', prdsDir);

      expect(id).toBe('prd-003');
    });

    test('10. should generate ID for different types (epic-001, task-001)', () => {
      const epicsDir = path.join(tempDir, '.claude', 'epics');
      const tasksDir = path.join(tempDir, '.claude', 'tasks');
      fs.mkdirSync(epicsDir, { recursive: true });
      fs.mkdirSync(tasksDir, { recursive: true });

      const epicId = engine.generateId('epic', epicsDir);
      const taskId = engine.generateId('task', tasksDir);

      expect(epicId).toBe('epic-001');
      expect(taskId).toBe('task-001');
    });
  });

  describe('Variable Substitution', () => {
    test('11. should render simple variable {{title}}', () => {
      const template = '# {{title}}\n\nDescription: {{description}}';
      const variables = { title: 'My Feature', description: 'Feature description' };

      const result = engine.render(template, variables);

      expect(result).toBe('# My Feature\n\nDescription: Feature description');
    });

    test('12. should render auto variables {{id}}, {{timestamp}}', () => {
      const template = 'ID: {{id}}\nCreated: {{timestamp}}\nAuthor: {{author}}';
      const variables = {};

      const result = engine.render(template, variables);

      expect(result).toMatch(/ID: \w+-\d{3}/);
      expect(result).toMatch(/Created: \d{4}-\d{2}-\d{2}T/);
      expect(result).toMatch(/Author: \w+/);
    });

    test('13. should handle missing variables (empty string)', () => {
      const template = 'Title: {{title}}\nOptional: {{optional}}';
      const variables = { title: 'Test' };

      const result = engine.render(template, variables);

      expect(result).toBe('Title: Test\nOptional: ');
    });

    test('14. should render template from file', () => {
      const templatePath = path.join(tempDir, 'test-template.md');
      fs.writeFileSync(templatePath, '# {{title}}\n\n{{content}}');

      const variables = { title: 'Test PRD', content: 'PRD content here' };
      const result = engine.renderFile(templatePath, variables);

      expect(result).toBe('# Test PRD\n\nPRD content here');
    });
  });

  describe('Conditionals Processing', () => {
    test('15. should process conditionals {{#if}}...{{/if}}', () => {
      const template = '{{#if priority}}Priority: {{priority}}{{/if}}';
      const variables = { priority: 'P1' };

      const result = engine.render(template, variables);

      expect(result).toBe('Priority: P1');
    });

    test('16. should hide content when condition is falsy', () => {
      const template = 'Before\n{{#if missing}}Hidden content{{/if}}\nAfter';
      const variables = {};

      const result = engine.render(template, variables);

      expect(result).toBe('Before\n\nAfter');
    });

    test('17. should handle nested conditionals', () => {
      const template = '{{#if outer}}Outer: {{#if inner}}Inner{{/if}}{{/if}}';
      const variables = { outer: 'yes', inner: 'yes' };

      const result = engine.render(template, variables);

      expect(result).toBe('Outer: Inner');
    });
  });

  describe('Loops Processing', () => {
    test('18. should process loops {{#each}}...{{/each}}', () => {
      const template = '{{#each features}}- {{this}}\n{{/each}}';
      const variables = { features: ['Feature A', 'Feature B', 'Feature C'] };

      const result = engine.render(template, variables);

      expect(result).toBe('- Feature A\n- Feature B\n- Feature C\n');
    });

    test('19. should handle empty arrays in loops', () => {
      const template = 'Features:\n{{#each features}}- {{this}}\n{{/each}}Done';
      const variables = { features: [] };

      const result = engine.render(template, variables);

      expect(result).toBe('Features:\nDone');
    });

    test('20. should support object iteration in loops', () => {
      const template = '{{#each items}}- {{name}}: {{value}}\n{{/each}}';
      const variables = {
        items: [
          { name: 'Item 1', value: '100' },
          { name: 'Item 2', value: '200' }
        ]
      };

      const result = engine.render(template, variables);

      expect(result).toBe('- Item 1: 100\n- Item 2: 200\n');
    });
  });

  describe('Template Validation', () => {
    test('21. should validate template - valid', () => {
      const template = `---
id: {{id}}
title: {{title}}
type: {{type}}
---

# {{title}}`;

      const validation = engine.validate(template);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('22. should validate template - missing frontmatter', () => {
      const template = '# {{title}}\n\nNo frontmatter here';

      const validation = engine.validate(template);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Missing frontmatter');
    });

    test('23. should validate template - missing required variable', () => {
      const template = `---
id: {{id}}
---

# Missing title`;

      const validation = engine.validate(template);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Missing required variable: {{title}}');
    });
  });

  describe('Error Handling', () => {
    test('24. should create template directory if not exists', () => {
      const newDir = path.join(userDir, 'new-type');
      expect(fs.existsSync(newDir)).toBe(false);

      engine.ensureTemplateDir('new-type');

      expect(fs.existsSync(newDir)).toBe(true);
    });

    test('25. should handle template read errors gracefully', () => {
      const nonExistentPath = path.join(tempDir, 'non-existent.md');

      expect(() => {
        engine.renderFile(nonExistentPath, {});
      }).toThrow();
    });

    test('26. should handle malformed conditionals gracefully', () => {
      const template = '{{#if unclosed}No closing tag';
      const variables = { unclosed: 'yes' };

      // Should not crash, but may not render correctly
      expect(() => {
        engine.render(template, variables);
      }).not.toThrow();
    });

    test('27. should handle malformed loops gracefully', () => {
      const template = '{{#each items}}Unclosed loop';
      const variables = { items: ['a', 'b'] };

      // Should not crash
      expect(() => {
        engine.render(template, variables);
      }).not.toThrow();
    });

    test('28. should handle circular references in object loops', () => {
      const obj = { name: 'test' };
      obj.self = obj; // circular reference

      const template = '{{#each items}}- {{name}}\n{{/each}}';
      const variables = { items: [obj] };

      // Should not crash or infinite loop
      expect(() => {
        engine.render(template, variables);
      }).not.toThrow();
    });
  });

  describe('Complex Integration', () => {
    test('29. should handle complex template with all features', () => {
      const template = `---
id: {{id}}
title: {{title}}
created: {{timestamp}}
---

# {{title}}

{{#if description}}
## Description
{{description}}
{{/if}}

## Features
{{#each features}}
- {{this}}
{{/each}}

{{#if priority}}
Priority: {{priority}}
{{/if}}`;

      const variables = {
        title: 'Complex Feature',
        description: 'This is a complex feature',
        features: ['Auth', 'API', 'UI'],
        priority: 'P1'
      };

      const result = engine.render(template, variables);

      expect(result).toContain('# Complex Feature');
      expect(result).toContain('## Description');
      expect(result).toContain('This is a complex feature');
      expect(result).toContain('- Auth');
      expect(result).toContain('- API');
      expect(result).toContain('- UI');
      expect(result).toContain('Priority: P1');
    });

    test('30. should render complete PRD template from design doc', () => {
      const prdTemplate = `---
id: {{id}}
title: {{title}}
type: prd
status: draft
priority: {{priority}}
created: {{timestamp}}
author: {{author}}
---

# PRD: {{title}}

## Problem Statement
{{problem}}

## API Requirements
{{#if api_endpoint}}
- **Endpoint**: \`{{http_method}} {{api_endpoint}}\`
- **Auth**: {{auth_method}}
{{/if}}

## User Stories
{{#each user_stories}}
- As a {{role}}, I want to {{goal}}, so that {{benefit}}
{{/each}}

## Success Metrics
{{#if adoption_target}}
- **Adoption**: {{adoption_target}}% of users
{{/if}}`;

      const variables = {
        title: 'User Authentication API',
        priority: 'P0',
        problem: 'Users cannot securely authenticate',
        api_endpoint: '/api/auth/login',
        http_method: 'POST',
        auth_method: 'JWT',
        user_stories: [
          { role: 'user', goal: 'login securely', benefit: 'I can access protected resources' }
        ],
        adoption_target: '90'
      };

      const result = engine.render(prdTemplate, variables);

      expect(result).toContain('# PRD: User Authentication API');
      expect(result).toContain('Users cannot securely authenticate');
      expect(result).toContain('`POST /api/auth/login`');
      expect(result).toContain('- As a user, I want to login securely');
      expect(result).toContain('- **Adoption**: 90% of users');
    });
  });
});
