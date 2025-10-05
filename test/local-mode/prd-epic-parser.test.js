/**
 * TASK-005: PRD-to-Epic Parser Tests (TDD RED Phase)
 *
 * Tests for parsing PRD markdown to Epic structure
 * Following strict TDD: Write tests FIRST, then implement
 */

const fs = require('fs').promises;
const path = require('path');
const {
  parseLocalPRD,
  extractSections,
  parseUserStories,
  buildEpicBody,
  generateEpicId,
  slugify
} = require('../../autopm/.claude/scripts/pm-prd-parse-local');
const { createLocalPRD } = require('../../autopm/.claude/scripts/pm-prd-new-local');
const { parseFrontmatter } = require('../../autopm/.claude/lib/frontmatter');

describe('PRD-to-Epic Parser', () => {
  const testDir = path.join(__dirname, '../../.claude');
  const prdsDir = path.join(testDir, 'prds');
  const epicsDir = path.join(testDir, 'epics');

  beforeAll(async () => {
    // Create test directories
    await fs.mkdir(prdsDir, { recursive: true });
    await fs.mkdir(epicsDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test files
    try {
      const files = await fs.readdir(prdsDir);
      for (const file of files) {
        await fs.unlink(path.join(prdsDir, file));
      }
    } catch (err) {
      // Ignore if directory doesn't exist
    }

    try {
      const dirs = await fs.readdir(epicsDir);
      for (const dir of dirs) {
        const epicDir = path.join(epicsDir, dir);
        const stats = await fs.stat(epicDir);
        if (stats.isDirectory()) {
          const files = await fs.readdir(epicDir);
          for (const file of files) {
            await fs.unlink(path.join(epicDir, file));
          }
          await fs.rmdir(epicDir);
        }
      }
    } catch (err) {
      // Ignore if directory doesn't exist
    }
  });

  describe('slugify()', () => {
    test('converts text to slug format', () => {
      expect(slugify('User Authentication System')).toBe('user-authentication-system');
    });

    test('handles special characters', () => {
      expect(slugify('API v2.0 (New & Improved!)')).toBe('api-v20-new-improved');
    });

    test('handles multiple spaces', () => {
      expect(slugify('Multiple   Spaces   Here')).toBe('multiple-spaces-here');
    });

    test('handles consecutive hyphens', () => {
      expect(slugify('Already-Has---Hyphens')).toBe('already-has-hyphens');
    });

    test('handles empty string', () => {
      expect(slugify('')).toBe('');
    });
  });

  describe('generateEpicId()', () => {
    test('generates epic ID from PRD ID', () => {
      expect(generateEpicId('prd-347')).toBe('epic-347');
    });

    test('handles different PRD ID formats', () => {
      expect(generateEpicId('prd-001')).toBe('epic-001');
      expect(generateEpicId('prd-999')).toBe('epic-999');
    });
  });

  describe('parseUserStories()', () => {
    test('parses single user story', () => {
      const text = 'As a user, I want to login, so that I can access my account.';
      const stories = parseUserStories(text);

      expect(stories).toHaveLength(1);
      expect(stories[0].raw).toContain('As a user');
    });

    test('parses multiple user stories', () => {
      const text = `As a user, I want to login.

As an admin, I want to manage users.`;
      const stories = parseUserStories(text);

      expect(stories).toHaveLength(2);
      expect(stories[0].raw).toContain('As a user');
      expect(stories[1].raw).toContain('As an admin');
    });

    test('handles bold markdown in user stories', () => {
      const text = '**As a user**, I want to login.';
      const stories = parseUserStories(text);

      expect(stories).toHaveLength(1);
      expect(stories[0].raw).toContain('**As a user**');
    });

    test('handles multi-line user stories', () => {
      const text = `As a user,
I want to login,
So that I can access my account.`;
      const stories = parseUserStories(text);

      expect(stories).toHaveLength(1);
      expect(stories[0].raw).toContain('As a user');
      expect(stories[0].raw).toContain('I want to login');
      expect(stories[0].raw).toContain('So that I can access');
    });

    test('handles empty text', () => {
      const stories = parseUserStories('');
      expect(stories).toEqual([]);
    });

    test('handles text without user stories', () => {
      const text = 'This is just regular text without user stories.';
      const stories = parseUserStories(text);
      expect(stories).toEqual([]);
    });
  });

  describe('extractSections()', () => {
    test('extracts overview section', () => {
      const markdown = `## Overview

This is the project overview.

## Goals

Project goals here.`;

      const sections = extractSections(markdown);
      expect(sections.overview).toContain('This is the project overview');
    });

    test('extracts goals section', () => {
      const markdown = `## Goals

- Goal 1
- Goal 2

## Requirements

Requirements here.`;

      const sections = extractSections(markdown);
      expect(sections.goals).toContain('Goal 1');
      expect(sections.goals).toContain('Goal 2');
    });

    test('extracts user stories section', () => {
      const markdown = `## User Stories

As a user, I want to login.

As an admin, I want to manage users.`;

      const sections = extractSections(markdown);
      expect(sections.userStories).toHaveLength(2);
    });

    test('extracts requirements section', () => {
      const markdown = `## Requirements

- Node.js 16+
- PostgreSQL database`;

      const sections = extractSections(markdown);
      expect(sections.requirements).toContain('Node.js 16+');
      expect(sections.requirements).toContain('PostgreSQL');
    });

    test('extracts timeline section', () => {
      const markdown = `## Timeline

- Week 1: Setup
- Week 2: Implementation`;

      const sections = extractSections(markdown);
      expect(sections.timeline).toContain('Week 1');
    });

    test('handles alternative section names', () => {
      const markdown = `## Summary

Project summary.

## Objectives

Project objectives.`;

      const sections = extractSections(markdown);
      expect(sections.overview).toContain('Project summary');
      expect(sections.goals).toContain('Project objectives');
    });

    test('handles nested headings (###)', () => {
      const markdown = `## Overview

### Background

This is background info.

### Context

This is context.`;

      const sections = extractSections(markdown);
      expect(sections.overview).toContain('Background');
      expect(sections.overview).toContain('Context');
    });

    test('preserves markdown formatting', () => {
      const markdown = `## Overview

**Bold text** and *italic text*.

- List item 1
- List item 2

\`code snippet\``;

      const sections = extractSections(markdown);
      expect(sections.overview).toContain('**Bold text**');
      expect(sections.overview).toContain('*italic text*');
      expect(sections.overview).toContain('- List item');
      expect(sections.overview).toContain('`code snippet`');
    });

    test('handles empty sections', () => {
      const markdown = `## Overview

## Goals`;

      const sections = extractSections(markdown);
      expect(sections.overview).toBe('');
      expect(sections.goals).toBe('');
    });

    test('handles missing sections gracefully', () => {
      const markdown = `## Some Other Section

Content here.`;

      const sections = extractSections(markdown);
      expect(sections).toHaveProperty('overview');
      expect(sections).toHaveProperty('goals');
      expect(sections).toHaveProperty('userStories');
    });
  });

  describe('buildEpicBody()', () => {
    test('builds epic body with all sections', () => {
      const sections = {
        overview: 'Project overview',
        goals: 'Project goals',
        userStories: [
          { raw: 'As a user, I want to login.' }
        ],
        requirements: 'Node.js 16+',
        timeline: 'Week 1: Setup'
      };

      const prdMeta = {
        title: 'User Authentication',
        id: 'prd-347'
      };

      const body = buildEpicBody(sections, prdMeta);

      expect(body).toContain('Epic: User Authentication');
      expect(body).toContain('Project overview');
      expect(body).toContain('Project goals');
      expect(body).toContain('As a user, I want to login');
      expect(body).toContain('Week 1: Setup');
    });

    test('handles missing sections with defaults', () => {
      const sections = {
        overview: '',
        goals: '',
        userStories: [],
        requirements: '',
        timeline: ''
      };

      const prdMeta = {
        title: 'Test Feature',
        id: 'prd-001'
      };

      const body = buildEpicBody(sections, prdMeta);

      expect(body).toContain('To be defined');
      expect(body).toContain('Epic: Test Feature');
    });

    test('includes multiple user stories', () => {
      const sections = {
        overview: 'Overview',
        goals: 'Goals',
        userStories: [
          { raw: 'Story 1' },
          { raw: 'Story 2' },
          { raw: 'Story 3' }
        ],
        requirements: '',
        timeline: ''
      };

      const prdMeta = {
        title: 'Feature',
        id: 'prd-002'
      };

      const body = buildEpicBody(sections, prdMeta);

      expect(body).toContain('1. Story 1');
      expect(body).toContain('2. Story 2');
      expect(body).toContain('3. Story 3');
    });

    test('includes PRD reference', () => {
      const sections = {
        overview: 'Overview',
        goals: 'Goals',
        userStories: [],
        requirements: '',
        timeline: ''
      };

      const prdMeta = {
        title: 'User Authentication System',
        id: 'prd-347'
      };

      const body = buildEpicBody(sections, prdMeta);

      expect(body).toContain('.claude/prds/');
      expect(body).toContain('user-authentication-system');
    });
  });

  describe('parseLocalPRD() - Integration', () => {
    test('parses PRD and creates epic structure', async () => {
      // Create test PRD with body content
      const prdBody = `## Overview

This is a test feature.

## Goals

- Implement feature X
- Test feature Y

## User Stories

As a user, I want to use feature X.

As an admin, I want to configure feature X.

## Requirements

- Node.js 16+
- Database`;

      const prd = await createLocalPRD('Test Feature', {
        author: 'Test Author',
        priority: 'high'
      });

      // Update PRD with body content (use the actual filepath from creation)
      const prdPath = prd.filepath;
      const currentContent = await fs.readFile(prdPath, 'utf8');
      const { frontmatter } = parseFrontmatter(currentContent);
      const updatedContent = `---
id: ${frontmatter.id}
title: ${frontmatter.title}
created: ${frontmatter.created}
createdAt: ${frontmatter.createdAt}
author: ${frontmatter.author}
status: ${frontmatter.status}
priority: ${frontmatter.priority}
version: ${frontmatter.version}
---

${prdBody}`;
      await fs.writeFile(prdPath, updatedContent);

      // Parse PRD to Epic
      const epic = await parseLocalPRD(prd.id);

      // Verify epic structure (ID is generated from PRD ID)
      const expectedEpicId = generateEpicId(prd.id);
      expect(epic.epicId).toBe(expectedEpicId);
      expect(epic.frontmatter.prd_id).toBe(prd.id);
      expect(epic.frontmatter.title).toContain('Test Feature');
      expect(epic.frontmatter.status).toBe('planning');
      expect(epic.frontmatter.tasks_total).toBe(0);

      // Verify sections
      expect(epic.sections.overview).toContain('test feature');
      expect(epic.sections.goals).toContain('Implement feature X');
      expect(epic.sections.userStories).toHaveLength(2);
      expect(epic.sections.requirements).toContain('Node.js 16+');
    });

    test('creates epic directory with correct structure', async () => {
      const prd = await createLocalPRD('Directory Test', {
        author: 'Test',
        priority: 'medium'
      });

      // Update with body
      const prdPath = prd.filepath;
      const currentContent = await fs.readFile(prdPath, 'utf8');
      const { frontmatter } = parseFrontmatter(currentContent);
      const updatedContent = `---
id: ${frontmatter.id}
title: ${frontmatter.title}
created: ${frontmatter.created}
createdAt: ${frontmatter.createdAt}
author: ${frontmatter.author}
status: ${frontmatter.status}
priority: ${frontmatter.priority}
version: ${frontmatter.version}
---

## Overview

Test`;
      await fs.writeFile(prdPath, updatedContent);

      const epic = await parseLocalPRD(prd.id);

      // Verify directory exists
      const dirExists = await fs.access(epic.epicDir).then(() => true).catch(() => false);
      expect(dirExists).toBe(true);

      // Verify epic.md exists
      const fileExists = await fs.access(epic.epicPath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      // Verify directory name format
      expect(path.basename(epic.epicDir)).toMatch(/^epic-\d+-directory-test$/);
    });

    test('generates valid epic.md content', async () => {
      const prd = await createLocalPRD('Content Test', {
        author: 'Test',
        priority: 'low'
      });

      const prdPath = prd.filepath;
      const currentContent = await fs.readFile(prdPath, 'utf8');
      const { frontmatter: prdFrontmatter } = parseFrontmatter(currentContent);
      const updatedContent = `---
id: ${prdFrontmatter.id}
title: ${prdFrontmatter.title}
created: ${prdFrontmatter.created}
createdAt: ${prdFrontmatter.createdAt}
author: ${prdFrontmatter.author}
status: ${prdFrontmatter.status}
priority: ${prdFrontmatter.priority}
version: ${prdFrontmatter.version}
---

## Overview
Test overview
## Goals
Test goals`;
      await fs.writeFile(prdPath, updatedContent);

      const epic = await parseLocalPRD(prd.id);

      // Read epic.md
      const epicContent = await fs.readFile(epic.epicPath, 'utf8');
      const { frontmatter: epicFrontmatter, body } = parseFrontmatter(epicContent);

      // Verify frontmatter
      expect(epicFrontmatter.id).toBe(epic.epicId);
      expect(epicFrontmatter.prd_id).toBe(prd.id);
      expect(epicFrontmatter.status).toBe('planning');

      // Verify body structure
      expect(body).toContain('# Epic: Content Test');
      expect(body).toContain('## Overview');
      expect(body).toContain('## Technical Architecture');
      expect(body).toContain('## Implementation Tasks');
    });

    test('handles PRD without user stories', async () => {
      const prd = await createLocalPRD('No Stories', {
        author: 'Test',
        priority: 'medium'
      });

      const prdPath = prd.filepath;
      const currentContent = await fs.readFile(prdPath, 'utf8');
      const { frontmatter } = parseFrontmatter(currentContent);
      const updatedContent = `---
id: ${frontmatter.id}
title: ${frontmatter.title}
created: ${frontmatter.created}
createdAt: ${frontmatter.createdAt}
author: ${frontmatter.author}
status: ${frontmatter.status}
priority: ${frontmatter.priority}
version: ${frontmatter.version}
---

## Overview
Just an overview`;
      await fs.writeFile(prdPath, updatedContent);

      const epic = await parseLocalPRD(prd.id);

      expect(epic.sections.userStories).toEqual([]);

      const epicContent = await fs.readFile(epic.epicPath, 'utf8');
      expect(epicContent).toContain('To be defined');
    });

    test('handles malformed PRD sections gracefully', async () => {
      const prd = await createLocalPRD('Malformed', {
        author: 'Test',
        priority: 'low'
      });

      const prdPath = prd.filepath;
      const currentContent = await fs.readFile(prdPath, 'utf8');
      const { frontmatter } = parseFrontmatter(currentContent);
      const updatedContent = `---
id: ${frontmatter.id}
title: ${frontmatter.title}
created: ${frontmatter.created}
createdAt: ${frontmatter.createdAt}
author: ${frontmatter.author}
status: ${frontmatter.status}
priority: ${frontmatter.priority}
version: ${frontmatter.version}
---

Random content without proper sections

Some more random text`;
      await fs.writeFile(prdPath, updatedContent);

      const epic = await parseLocalPRD(prd.id);

      // Should still create epic with defaults
      expect(epic.epicId).toBeTruthy();
      expect(epic.epicPath).toBeTruthy();
    });

    test('generates unique epic IDs from PRD IDs', async () => {
      const prd1 = await createLocalPRD('Feature 1', {
        author: 'Test',
        priority: 'high'
      });

      const prd2 = await createLocalPRD('Feature 2', {
        author: 'Test',
        priority: 'high'
      });

      const epic1 = await parseLocalPRD(prd1.id);
      const epic2 = await parseLocalPRD(prd2.id);

      // Verify unique IDs
      expect(epic1.epicId).not.toBe(epic2.epicId);
      expect(epic1.epicId).toBe(generateEpicId(prd1.id));
      expect(epic2.epicId).toBe(generateEpicId(prd2.id));
    });

    test('preserves markdown formatting in epic', async () => {
      const prd = await createLocalPRD('Formatting Test', {
        author: 'Test',
        priority: 'medium'
      });

      const prdPath = prd.filepath;
      const currentContent = await fs.readFile(prdPath, 'utf8');
      const { frontmatter } = parseFrontmatter(currentContent);
      const updatedContent = `---
id: ${frontmatter.id}
title: ${frontmatter.title}
created: ${frontmatter.created}
createdAt: ${frontmatter.createdAt}
author: ${frontmatter.author}
status: ${frontmatter.status}
priority: ${frontmatter.priority}
version: ${frontmatter.version}
---

## Overview

**Bold text** and *italic text*

- List item 1
- List item 2

\`code snippet\``;
      await fs.writeFile(prdPath, updatedContent);

      const epic = await parseLocalPRD(prd.id);

      // Verify extracted sections preserve formatting
      expect(epic.sections.overview).toContain('**Bold text**');
      expect(epic.sections.overview).toContain('*italic text*');
      expect(epic.sections.overview).toContain('- List item');
      expect(epic.sections.overview).toContain('`code snippet`');

      // Verify epic content includes formatted text
      const epicContent = await fs.readFile(epic.epicPath, 'utf8');
      expect(epicContent).toContain('Epic: Formatting Test');
    });

    test('links PRD ID in epic frontmatter', async () => {
      const prd = await createLocalPRD('Link Test', {
        author: 'Test',
        priority: 'high'
      });

      const epic = await parseLocalPRD(prd.id);

      expect(epic.frontmatter.prd_id).toBe(prd.id);

      const epicContent = await fs.readFile(epic.epicPath, 'utf8');
      const { frontmatter } = parseFrontmatter(epicContent);

      expect(frontmatter.prd_id).toBe(prd.id);
    });

    test('throws error for non-existent PRD', async () => {
      await expect(parseLocalPRD('prd-999999')).rejects.toThrow();
    });
  });
});
