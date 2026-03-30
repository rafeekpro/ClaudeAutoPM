const fs = require('fs');
const path = require('path');
const os = require('os');
const { readTemplate, generateMarkdown, validateContent, resolveTemplatePath } = require('../../autopm/.claude/lib/template-reader');

const TEMPLATES_DIR = path.join(__dirname, '..', '..', 'autopm', '.claude', 'templates');

describe('readTemplate', () => {
  test('reads issue.xml template', () => {
    const tpl = readTemplate(path.join(TEMPLATES_DIR, 'issue.xml'));
    expect(tpl.id).toBe('issue');
    expect(tpl.version).toBe('1.0');
    expect(tpl.frontmatter.length).toBeGreaterThanOrEqual(5);
    expect(tpl.sections.length).toBeGreaterThanOrEqual(3);
  });

  test('reads prd.xml template', () => {
    const tpl = readTemplate(path.join(TEMPLATES_DIR, 'prd.xml'));
    expect(tpl.id).toBe('prd');
    expect(tpl.frontmatter.find(f => f.name === 'priority').values).toBe('P0,P1,P2,P3');
  });

  test('reads epic.xml template', () => {
    const tpl = readTemplate(path.join(TEMPLATES_DIR, 'epic.xml'));
    expect(tpl.id).toBe('epic');
    expect(tpl.frontmatter.find(f => f.name === 'progress').type).toBe('int');
  });

  test('reads task.xml template', () => {
    const tpl = readTemplate(path.join(TEMPLATES_DIR, 'task.xml'));
    expect(tpl.id).toBe('task');
    expect(tpl.sections.find(s => s.name === 'description').required).toBe(true);
  });

  test('throws for missing template', () => {
    expect(() => readTemplate('/nonexistent/path.xml')).toThrow('Template not found');
  });

  test('parses frontmatter fields with all attributes', () => {
    const tpl = readTemplate(path.join(TEMPLATES_DIR, 'issue.xml'));
    const status = tpl.frontmatter.find(f => f.name === 'status');
    expect(status.type).toBe('enum');
    expect(status.values).toBe('open,in_progress,closed');
    expect(status.default).toBe('open');
  });

  test('parses required and optional sections', () => {
    const tpl = readTemplate(path.join(TEMPLATES_DIR, 'issue.xml'));
    const goal = tpl.sections.find(s => s.name === 'goal');
    const constraints = tpl.sections.find(s => s.name === 'constraints');
    expect(goal.required).toBe(true);
    expect(constraints.required).toBe(false);
  });

  test('parses section placeholders', () => {
    const tpl = readTemplate(path.join(TEMPLATES_DIR, 'issue.xml'));
    const goal = tpl.sections.find(s => s.name === 'goal');
    expect(goal.placeholder).toBe('One sentence: WHAT and WHY');
  });
});

describe('generateMarkdown', () => {
  test('generates markdown with frontmatter from issue template', () => {
    const tpl = readTemplate(path.join(TEMPLATES_DIR, 'issue.xml'));
    const md = generateMarkdown(tpl, {
      number: 1,
      name: 'Fix login bug',
      labels: ['bug'],
      goal: 'Fix the login authentication failure',
      'acceptance-criteria': '- [ ] Login works with valid credentials'
    });

    expect(md).toContain('---');
    expect(md).toContain('number: 1');
    expect(md).toContain('name: Fix login bug');
    expect(md).toContain('status: open');
    expect(md).toContain('- bug');
    expect(md).toContain('## Goal');
    expect(md).toContain('Fix the login authentication failure');
    expect(md).toContain('## Acceptance Criteria');
  });

  test('auto-fills datetime fields', () => {
    const tpl = readTemplate(path.join(TEMPLATES_DIR, 'issue.xml'));
    const md = generateMarkdown(tpl, { name: 'Test' });

    // created and updated should have ISO datetime
    const dateMatch = md.match(/created: (\S+)/);
    expect(dateMatch).not.toBeNull();
    expect(dateMatch[1]).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('uses defaults for missing optional fields', () => {
    const tpl = readTemplate(path.join(TEMPLATES_DIR, 'prd.xml'));
    const md = generateMarkdown(tpl, { name: 'Feature X' });

    expect(md).toContain('status: draft');
    expect(md).toContain('priority: P2');
  });

  test('generates all required sections with placeholders', () => {
    const tpl = readTemplate(path.join(TEMPLATES_DIR, 'epic.xml'));
    const md = generateMarkdown(tpl, { name: 'Auth Epic' });

    expect(md).toContain('## Overview');
    expect(md).toContain('## Tasks');
  });

  test('uses provided section content over placeholder', () => {
    const tpl = readTemplate(path.join(TEMPLATES_DIR, 'task.xml'));
    const md = generateMarkdown(tpl, {
      name: 'Implement login',
      description: 'Build the login endpoint with JWT',
      'acceptance-criteria': '- [ ] POST /login returns token'
    });

    expect(md).toContain('Build the login endpoint with JWT');
    expect(md).toContain('- [ ] POST /login returns token');
  });
});

describe('validateContent', () => {
  test('valid issue content passes', () => {
    const tpl = readTemplate(path.join(TEMPLATES_DIR, 'issue.xml'));
    const content = `---\nname: Test\nstatus: open\n---\n\n## Goal\nFix bug\n\n## Acceptance Criteria\n- [ ] Done\n\n## Affected Files\n- src/app.js\n`;

    const result = validateContent(tpl, content);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test('missing required field fails', () => {
    const tpl = readTemplate(path.join(TEMPLATES_DIR, 'issue.xml'));
    const content = `---\nstatus: open\n---\n\n## Goal\nFix\n`;

    const result = validateContent(tpl, content);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: name');
  });

  test('missing required section fails', () => {
    const tpl = readTemplate(path.join(TEMPLATES_DIR, 'issue.xml'));
    const content = `---\nname: Test\n---\n\n## Goal\nFix\n`;

    const result = validateContent(tpl, content);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Acceptance Criteria'))).toBe(true);
  });
});

describe('validateContent with validation rules', () => {
  test('fails when goal section is empty', () => {
    const tpl = readTemplate(path.join(TEMPLATES_DIR, 'issue.xml'));
    const content = `---\nname: Test\nstatus: open\n---\n\n## Goal\n\n## Acceptance Criteria\n- [ ] Done\n\n## Affected Files\n- src/app.js\n`;

    const result = validateContent(tpl, content);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('goal must be non-empty'))).toBe(true);
  });

  test('fails when no checkbox present', () => {
    const tpl = readTemplate(path.join(TEMPLATES_DIR, 'issue.xml'));
    const content = `---\nname: Test\nstatus: open\n---\n\n## Goal\nFix bug\n\n## Acceptance Criteria\nNo checkboxes here\n\n## Affected Files\n- src/app.js\n`;

    const result = validateContent(tpl, content);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('checkbox'))).toBe(true);
  });

  test('passes with valid content and checkboxes', () => {
    const tpl = readTemplate(path.join(TEMPLATES_DIR, 'issue.xml'));
    const content = `---\nname: Test\nstatus: open\n---\n\n## Goal\nFix the bug\n\n## Acceptance Criteria\n- [ ] Done\n\n## Affected Files\n- src/app.js\n`;

    const result = validateContent(tpl, content);
    expect(result.valid).toBe(true);
  });
});

describe('template-based issue creation', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'issue-create-'));
    const templatesDir = path.join(tempDir, '.claude', 'templates');
    fs.mkdirSync(templatesDir, { recursive: true });
    fs.copyFileSync(
      path.join(TEMPLATES_DIR, 'issue.xml'),
      path.join(templatesDir, 'issue.xml')
    );
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('issue-create uses template structure', async () => {
    const { execute } = require('../../autopm/.claude/providers/local/issue-create');
    const result = await execute({ title: 'Test Issue' }, { basePath: tempDir });

    expect(result.success).toBe(true);
    const content = fs.readFileSync(result.issue.path, 'utf8');
    expect(content).toContain('## Goal');
    expect(content).toContain('## Acceptance Criteria');
    expect(content).toContain('## Affected Files');
  });
});

describe('resolveTemplatePath', () => {
  test('resolves to .claude/templates/', () => {
    const p = resolveTemplatePath('issue.xml', '/tmp/project');
    expect(p).toBe('/tmp/project/.claude/templates/issue.xml');
  });
});
