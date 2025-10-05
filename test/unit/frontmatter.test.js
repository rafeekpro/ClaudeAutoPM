/**
 * Frontmatter Utilities Tests
 * Test-Driven Development: RED phase
 *
 * These tests define the expected behavior BEFORE implementation
 */

const fs = require('fs').promises;
const path = require('path');
const {
  parseFrontmatter,
  stringifyFrontmatter,
  updateFrontmatter,
  validateFrontmatter,
  stripBody
} = require('../../autopm/.claude/lib/frontmatter.js');

const TEST_DIR = path.join(process.cwd(), 'test', 'unit', 'tmp');

describe('Frontmatter Utilities', () => {
  beforeEach(async () => {
    // Create test directory
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore errors
    }
  });

  describe('parseFrontmatter()', () => {
    test('should extract YAML frontmatter and body from markdown', () => {
      const content = `---
id: task-001
title: Test Task
status: pending
---
This is the body content.

With multiple paragraphs.`;

      const result = parseFrontmatter(content);

      expect(result).toEqual({
        frontmatter: {
          id: 'task-001',
          title: 'Test Task',
          status: 'pending'
        },
        body: 'This is the body content.\n\nWith multiple paragraphs.'
      });
    });

    test('should handle content without frontmatter gracefully', () => {
      const content = 'Just plain markdown content';

      const result = parseFrontmatter(content);

      expect(result).toEqual({
        frontmatter: {},
        body: 'Just plain markdown content'
      });
    });

    test('should handle empty frontmatter', () => {
      const content = `---
---
Body content only`;

      const result = parseFrontmatter(content);

      expect(result).toEqual({
        frontmatter: {},
        body: 'Body content only'
      });
    });

    test('should handle malformed frontmatter delimiters', () => {
      const content = `---
id: task-001
title: Missing closing delimiter
Body content`;

      const result = parseFrontmatter(content);

      // Should treat as body-only content when malformed
      expect(result.frontmatter).toEqual({});
      expect(result.body).toContain('---');
    });

    test('should throw error on invalid YAML syntax', () => {
      const content = `---
id: task-001
title: [unclosed bracket
status: pending
---
Body`;

      expect(() => parseFrontmatter(content)).toThrow();
    });

    test('should handle nested frontmatter fields', () => {
      const content = `---
id: task-001
providers:
  github:
    owner: rafeekpro
    repo: ClaudeAutoPM
metadata:
  created: 2025-10-05
  tags:
    - urgent
    - backend
---
Body content`;

      const result = parseFrontmatter(content);

      expect(result.frontmatter.providers.github.owner).toBe('rafeekpro');
      expect(result.frontmatter.providers.github.repo).toBe('ClaudeAutoPM');
      expect(result.frontmatter.metadata.tags).toEqual(['urgent', 'backend']);
    });

    test('should preserve whitespace in body', () => {
      const content = `---
id: task-001
---

  Indented content
    More indentation

Regular content`;

      const result = parseFrontmatter(content);

      expect(result.body).toBe('\n  Indented content\n    More indentation\n\nRegular content');
    });

    test('should handle body with code blocks containing ---', () => {
      const content = `---
id: task-001
---
Example:
\`\`\`
---
title: Example
---
\`\`\``;

      const result = parseFrontmatter(content);

      expect(result.frontmatter.id).toBe('task-001');
      expect(result.body).toContain('```');
      expect(result.body).toContain('title: Example');
    });
  });

  describe('stringifyFrontmatter()', () => {
    test('should create markdown with frontmatter from object', () => {
      const data = {
        id: 'task-001',
        title: 'Test Task',
        status: 'pending'
      };
      const body = 'This is the body content.';

      const result = stringifyFrontmatter(data, body);

      expect(result).toBe(`---
id: task-001
title: Test Task
status: pending
---
This is the body content.`);
    });

    test('should handle nested objects in frontmatter', () => {
      const data = {
        id: 'task-001',
        providers: {
          github: {
            owner: 'rafeekpro',
            repo: 'ClaudeAutoPM'
          }
        }
      };
      const body = 'Body';

      const result = stringifyFrontmatter(data, body);

      expect(result).toContain('providers:');
      expect(result).toContain('github:');
      expect(result).toContain('owner: rafeekpro');
      expect(result).toContain('repo: ClaudeAutoPM');
    });

    test('should handle arrays in frontmatter', () => {
      const data = {
        id: 'task-001',
        tags: ['urgent', 'backend', 'api']
      };
      const body = 'Body';

      const result = stringifyFrontmatter(data, body);

      expect(result).toContain('tags:');
      expect(result).toContain('- urgent');
      expect(result).toContain('- backend');
      expect(result).toContain('- api');
    });

    test('should handle empty frontmatter', () => {
      const data = {};
      const body = 'Just body content';

      const result = stringifyFrontmatter(data, body);

      expect(result).toBe(`---
---
Just body content`);
    });

    test('should handle empty body', () => {
      const data = { id: 'task-001' };
      const body = '';

      const result = stringifyFrontmatter(data, body);

      expect(result).toBe(`---
id: task-001
---
`);
    });

    test('should preserve multi-line body content', () => {
      const data = { id: 'task-001' };
      const body = `Line 1

Line 2

Line 3`;

      const result = stringifyFrontmatter(data, body);

      expect(result).toContain('Line 1\n\nLine 2\n\nLine 3');
    });
  });

  describe('updateFrontmatter()', () => {
    test('should update specific fields in existing file', async () => {
      const filePath = path.join(TEST_DIR, 'test.md');
      const initial = `---
id: task-001
title: Original Title
status: pending
---
Body content`;

      await fs.writeFile(filePath, initial, 'utf8');

      await updateFrontmatter(filePath, {
        status: 'in_progress',
        assignee: 'john-doe'
      });

      const updated = await fs.readFile(filePath, 'utf8');
      const result = parseFrontmatter(updated);

      expect(result.frontmatter.id).toBe('task-001');
      expect(result.frontmatter.title).toBe('Original Title');
      expect(result.frontmatter.status).toBe('in_progress');
      expect(result.frontmatter.assignee).toBe('john-doe');
      expect(result.body).toBe('Body content');
    });

    test('should preserve markdown body when updating frontmatter', async () => {
      const filePath = path.join(TEST_DIR, 'preserve.md');
      const initial = `---
id: task-001
---
# Header

Paragraph with **bold** and *italic*.

- List item 1
- List item 2

\`\`\`javascript
const code = 'example';
\`\`\``;

      await fs.writeFile(filePath, initial, 'utf8');

      await updateFrontmatter(filePath, { status: 'done' });

      const updated = await fs.readFile(filePath, 'utf8');
      const result = parseFrontmatter(updated);

      expect(result.body).toContain('# Header');
      expect(result.body).toContain('**bold**');
      expect(result.body).toContain('- List item 1');
      expect(result.body).toContain('```javascript');
      expect(result.body).toContain("const code = 'example';");
    });

    test('should update nested frontmatter fields', async () => {
      const filePath = path.join(TEST_DIR, 'nested.md');
      const initial = `---
id: task-001
providers:
  github:
    owner: rafeekpro
    repo: ClaudeAutoPM
---
Body`;

      await fs.writeFile(filePath, initial, 'utf8');

      await updateFrontmatter(filePath, {
        'providers.github.branch': 'main',
        'providers.github.issue': 42
      });

      const updated = await fs.readFile(filePath, 'utf8');
      const result = parseFrontmatter(updated);

      expect(result.frontmatter.providers.github.owner).toBe('rafeekpro');
      expect(result.frontmatter.providers.github.branch).toBe('main');
      expect(result.frontmatter.providers.github.issue).toBe(42);
    });

    test('should create frontmatter if file has none', async () => {
      const filePath = path.join(TEST_DIR, 'no-frontmatter.md');
      const initial = 'Just plain markdown';

      await fs.writeFile(filePath, initial, 'utf8');

      await updateFrontmatter(filePath, {
        id: 'task-001',
        title: 'New Task'
      });

      const updated = await fs.readFile(filePath, 'utf8');
      const result = parseFrontmatter(updated);

      expect(result.frontmatter.id).toBe('task-001');
      expect(result.frontmatter.title).toBe('New Task');
      expect(result.body).toBe('Just plain markdown');
    });

    test('should throw error if file does not exist', async () => {
      const filePath = path.join(TEST_DIR, 'nonexistent.md');

      await expect(
        updateFrontmatter(filePath, { status: 'done' })
      ).rejects.toThrow();
    });
  });

  describe('validateFrontmatter()', () => {
    test('should validate PRD schema', () => {
      const data = {
        id: 'prd-001',
        title: 'Product Requirements Document',
        created: '2025-10-05',
        author: 'john-doe',
        status: 'draft',
        priority: 'high',
        version: '1.0.0'
      };

      const schema = {
        required: ['id', 'title', 'created', 'author', 'status', 'priority', 'version'],
        fields: {
          id: { type: 'string', pattern: /^prd-\d+$/ },
          title: { type: 'string' },
          created: { type: 'string' },
          author: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'review', 'approved'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          version: { type: 'string', pattern: /^\d+\.\d+\.\d+$/ }
        }
      };

      const result = validateFrontmatter(data, schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should validate Epic schema', () => {
      const data = {
        id: 'epic-001',
        prd_id: 'prd-001',
        title: 'Epic Title',
        created: '2025-10-05',
        status: 'in_progress',
        github_issue: 42,
        tasks_total: 5
      };

      const schema = {
        required: ['id', 'prd_id', 'title', 'created', 'status'],
        fields: {
          id: { type: 'string', pattern: /^epic-\d+$/ },
          prd_id: { type: 'string', pattern: /^prd-\d+$/ },
          title: { type: 'string' },
          created: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
          github_issue: { type: 'number' },
          tasks_total: { type: 'number' }
        }
      };

      const result = validateFrontmatter(data, schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should validate Task schema', () => {
      const data = {
        id: 'task-001',
        epic_id: 'epic-001',
        title: 'Task Title',
        created: '2025-10-05',
        status: 'pending',
        depends_on: ['task-000'],
        estimated_effort: '2h'
      };

      const schema = {
        required: ['id', 'epic_id', 'title', 'created', 'status'],
        fields: {
          id: { type: 'string', pattern: /^task-\d+$/ },
          epic_id: { type: 'string', pattern: /^epic-\d+$/ },
          title: { type: 'string' },
          created: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'blocked'] },
          depends_on: { type: 'array' },
          estimated_effort: { type: 'string' }
        }
      };

      const result = validateFrontmatter(data, schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should return errors for missing required fields', () => {
      const data = {
        id: 'task-001',
        title: 'Task Title'
        // Missing: created, status
      };

      const schema = {
        required: ['id', 'title', 'created', 'status'],
        fields: {
          id: { type: 'string' },
          title: { type: 'string' },
          created: { type: 'string' },
          status: { type: 'string' }
        }
      };

      const result = validateFrontmatter(data, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: created');
      expect(result.errors).toContain('Missing required field: status');
    });

    test('should return errors for invalid field types', () => {
      const data = {
        id: 'task-001',
        title: 123, // Should be string
        created: '2025-10-05',
        status: 'pending',
        tasks_total: '5' // Should be number
      };

      const schema = {
        required: ['id', 'title', 'created', 'status'],
        fields: {
          id: { type: 'string' },
          title: { type: 'string' },
          created: { type: 'string' },
          status: { type: 'string' },
          tasks_total: { type: 'number' }
        }
      };

      const result = validateFrontmatter(data, schema);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('title'))).toBe(true);
      expect(result.errors.some(e => e.includes('tasks_total'))).toBe(true);
    });

    test('should return errors for invalid enum values', () => {
      const data = {
        id: 'task-001',
        title: 'Task',
        created: '2025-10-05',
        status: 'invalid_status'
      };

      const schema = {
        required: ['id', 'title', 'created', 'status'],
        fields: {
          id: { type: 'string' },
          title: { type: 'string' },
          created: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] }
        }
      };

      const result = validateFrontmatter(data, schema);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('status') && e.includes('enum'))).toBe(true);
    });

    test('should return errors for invalid pattern match', () => {
      const data = {
        id: 'invalid-id',
        title: 'Task',
        created: '2025-10-05',
        status: 'pending'
      };

      const schema = {
        required: ['id', 'title', 'created', 'status'],
        fields: {
          id: { type: 'string', pattern: /^task-\d+$/ },
          title: { type: 'string' },
          created: { type: 'string' },
          status: { type: 'string' }
        }
      };

      const result = validateFrontmatter(data, schema);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('id') && e.includes('pattern'))).toBe(true);
    });
  });

  describe('stripBody()', () => {
    test('should return only body content, removing frontmatter', () => {
      const content = `---
id: task-001
title: Test Task
status: pending
---
This is the body content.

With multiple paragraphs.`;

      const result = stripBody(content);

      expect(result).toBe('This is the body content.\n\nWith multiple paragraphs.');
    });

    test('should return entire content if no frontmatter', () => {
      const content = 'Just plain markdown content';

      const result = stripBody(content);

      expect(result).toBe('Just plain markdown content');
    });

    test('should handle empty body', () => {
      const content = `---
id: task-001
---
`;

      const result = stripBody(content);

      expect(result).toBe('');
    });

    test('should handle nested frontmatter', () => {
      const content = `---
id: task-001
providers:
  github:
    owner: rafeekpro
---
Body content only`;

      const result = stripBody(content);

      expect(result).toBe('Body content only');
    });
  });

  describe('Round-trip integrity', () => {
    test('should maintain data integrity through parse -> stringify -> parse', () => {
      const original = `---
id: task-001
title: Test Task
status: pending
metadata:
  created: 2025-10-05
  tags:
    - urgent
    - backend
---
This is the body content.

With multiple paragraphs.`;

      const parsed1 = parseFrontmatter(original);
      const stringified = stringifyFrontmatter(parsed1.frontmatter, parsed1.body);
      const parsed2 = parseFrontmatter(stringified);

      expect(parsed2.frontmatter).toEqual(parsed1.frontmatter);
      expect(parsed2.body).toBe(parsed1.body);
    });
  });
});
