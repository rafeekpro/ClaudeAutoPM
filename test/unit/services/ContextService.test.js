/**
 * ContextService Tests
 *
 * Comprehensive test suite for ContextService following TDD methodology.
 * Tests are written FIRST before implementation.
 *
 * Test Coverage:
 * - Constructor (2 tests)
 * - createContext() (5 tests)
 * - primeContext() (4 tests)
 * - updateContext() (3 tests)
 * - getContext() (2 tests)
 * - listContexts() (2 tests)
 * - validateContext() (3 tests)
 * - mergeContexts() (2 tests)
 * - analyzeContextUsage() (2 tests)
 *
 * Total: 25 tests targeting 90%+ coverage
 */

const ContextService = require('../../../lib/services/ContextService');
const fs = require('fs-extra');
const path = require('path');

// Test fixtures directory
const TEST_DIR = path.join(__dirname, '../../fixtures/context-test');
const TEMPLATES_DIR = path.join(TEST_DIR, 'templates');
const CONTEXTS_DIR = path.join(TEST_DIR, 'contexts');

describe('ContextService', () => {
  let contextService;

  beforeEach(async () => {
    // Clean up test directory
    await fs.remove(TEST_DIR);
    await fs.ensureDir(TEMPLATES_DIR);
    await fs.ensureDir(CONTEXTS_DIR);

    // Create instance with test paths
    contextService = new ContextService({
      templatesPath: TEMPLATES_DIR,
      contextPath: CONTEXTS_DIR
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await fs.remove(TEST_DIR);
  });

  // ==========================================
  // CONSTRUCTOR TESTS (2 tests)
  // ==========================================

  describe('Constructor', () => {
    it('should create instance with default options', () => {
      const service = new ContextService();

      expect(service).toBeDefined();
      expect(service.templatesPath).toContain('.claude/templates/context-templates');
      expect(service.contextPath).toContain('.claude/context');
    });

    it('should create instance with custom paths', () => {
      const customTemplates = '/custom/templates';
      const customContext = '/custom/context';

      const service = new ContextService({
        templatesPath: customTemplates,
        contextPath: customContext
      });

      expect(service.templatesPath).toBe(customTemplates);
      expect(service.contextPath).toBe(customContext);
    });
  });

  // ==========================================
  // createContext() TESTS (5 tests)
  // ==========================================

  describe('createContext()', () => {
    it('should create project-brief context from template', async () => {
      // Create a project-brief template
      const template = `---
type: {{type}}
name: {{name}}
created: {{created}}
---

# Project Brief: {{name}}

## Overview
{{description}}
`;

      await fs.writeFile(
        path.join(TEMPLATES_DIR, 'project-brief.md'),
        template
      );

      const result = await contextService.createContext('project-brief', {
        name: 'Test Project',
        description: 'A test project brief'
      });

      expect(result).toBeDefined();
      expect(result.path).toContain('test-project');
      expect(result.content).toContain('Test Project');
      expect(result.created).toBeDefined();
      expect(result.type).toBe('project-brief');
      expect(await fs.pathExists(result.path)).toBe(true);
    });

    it('should create progress context', async () => {
      const template = `---
type: {{type}}
name: {{name}}
---

# Progress Report

## Current Status
{{status}}
`;

      await fs.writeFile(
        path.join(TEMPLATES_DIR, 'progress.md'),
        template
      );

      const result = await contextService.createContext('progress', {
        name: 'Weekly Progress',
        status: 'In progress'
      });

      expect(result).toBeDefined();
      expect(result.type).toBe('progress');
      expect(result.content).toContain('Weekly Progress');
    });

    it('should create tech-context', async () => {
      const template = `---
type: tech-context
name: {{name}}
---

# Technical Context

## Stack
{{stack}}
`;

      await fs.writeFile(
        path.join(TEMPLATES_DIR, 'tech-context.md'),
        template
      );

      const result = await contextService.createContext('tech-context', {
        name: 'Backend Stack',
        stack: 'Node.js, Express, PostgreSQL'
      });

      expect(result).toBeDefined();
      expect(result.type).toBe('tech-context');
    });

    it('should use custom template when provided', async () => {
      const customTemplate = `---
custom: true
---
# Custom Template
{{customField}}
`;

      await fs.writeFile(
        path.join(TEMPLATES_DIR, 'custom.md'),
        customTemplate
      );

      const result = await contextService.createContext('custom', {
        name: 'Custom Context',
        customField: 'Custom value'
      });

      expect(result.content).toContain('Custom value');
      expect(result.content).toContain('custom: true');
    });

    it('should throw error for invalid type', async () => {
      await expect(
        contextService.createContext('invalid-type-that-does-not-exist', {
          name: 'Test'
        })
      ).rejects.toThrow(/template not found/i);
    });
  });

  // ==========================================
  // primeContext() TESTS (4 tests)
  // ==========================================

  describe('primeContext()', () => {
    it('should generate complete snapshot with epics and issues', async () => {
      // Create mock epics directory
      const epicsDir = path.join(TEST_DIR, 'epics');
      await fs.ensureDir(epicsDir);

      await fs.writeFile(
        path.join(epicsDir, 'epic-001.md'),
        `---
id: EPIC-001
title: Test Epic
status: in-progress
---
# Epic content
`
      );

      // Create mock issues directory
      const issuesDir = path.join(TEST_DIR, 'issues');
      await fs.ensureDir(issuesDir);

      await fs.writeFile(
        path.join(issuesDir, '123.md'),
        `---
id: 123
title: Test Issue
status: open
---
# Issue content
`
      );

      contextService = new ContextService({
        templatesPath: TEMPLATES_DIR,
        contextPath: CONTEXTS_DIR,
        epicsPath: epicsDir,
        issuesPath: issuesDir
      });

      const result = await contextService.primeContext({
        includeGit: false
      });

      expect(result).toBeDefined();
      expect(result.contexts).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.contexts.epics).toHaveLength(1);
      expect(result.contexts.issues).toHaveLength(1);
    });

    it('should handle empty project gracefully', async () => {
      const result = await contextService.primeContext({
        includeGit: false
      });

      expect(result).toBeDefined();
      expect(result.contexts).toBeDefined();
      expect(result.summary).toContain('empty');
    });

    it('should include git info when requested', async () => {
      const result = await contextService.primeContext({
        includeGit: true
      });

      expect(result).toBeDefined();
      expect(result.git).toBeDefined();
    });

    it('should write to custom output location', async () => {
      const customOutput = path.join(TEST_DIR, 'custom-output.md');

      const result = await contextService.primeContext({
        includeGit: false,
        output: customOutput
      });

      expect(result).toBeDefined();
      expect(await fs.pathExists(customOutput)).toBe(true);
    });
  });

  // ==========================================
  // updateContext() TESTS (3 tests)
  // ==========================================

  describe('updateContext()', () => {
    it('should update context in append mode', async () => {
      // Create initial context
      const contextPath = path.join(CONTEXTS_DIR, 'test-context.md');
      await fs.writeFile(contextPath, '# Original Content\n');

      const result = await contextService.updateContext('test-context', {
        mode: 'append',
        content: '\n## New Section\nNew content here'
      });

      expect(result).toBeDefined();
      expect(result.updated).toBe(true);

      const updatedContent = await fs.readFile(contextPath, 'utf8');
      expect(updatedContent).toContain('Original Content');
      expect(updatedContent).toContain('New Section');
    });

    it('should update context in replace mode', async () => {
      // Create initial context
      const contextPath = path.join(CONTEXTS_DIR, 'test-context.md');
      await fs.writeFile(contextPath, '# Original Content\n');

      const result = await contextService.updateContext('test-context', {
        mode: 'replace',
        content: '# Completely New Content\n'
      });

      expect(result).toBeDefined();
      expect(result.updated).toBe(true);

      const updatedContent = await fs.readFile(contextPath, 'utf8');
      expect(updatedContent).not.toContain('Original Content');
      expect(updatedContent).toContain('Completely New Content');
    });

    it('should throw error if context not found', async () => {
      await expect(
        contextService.updateContext('non-existent', {
          content: 'New content'
        })
      ).rejects.toThrow(/not found/i);
    });
  });

  // ==========================================
  // getContext() TESTS (2 tests)
  // ==========================================

  describe('getContext()', () => {
    it('should read existing context file', async () => {
      const contextPath = path.join(CONTEXTS_DIR, 'test.md');
      const content = `---
type: test
created: 2025-01-01
---
# Test Context
`;

      await fs.writeFile(contextPath, content);

      const result = await contextService.getContext('test');

      expect(result).toBeDefined();
      expect(result.type).toBe('test');
      expect(result.content).toContain('Test Context');
      expect(result.metadata).toBeDefined();
      expect(result.updated).toBeDefined();
    });

    it('should throw error if context not found', async () => {
      await expect(
        contextService.getContext('non-existent')
      ).rejects.toThrow(/not found/i);
    });
  });

  // ==========================================
  // listContexts() TESTS (2 tests)
  // ==========================================

  describe('listContexts()', () => {
    it('should list all contexts grouped by type', async () => {
      // Create multiple contexts
      await fs.writeFile(
        path.join(CONTEXTS_DIR, 'brief-1.md'),
        '---\ntype: project-brief\n---\n# Brief 1'
      );

      await fs.writeFile(
        path.join(CONTEXTS_DIR, 'brief-2.md'),
        '---\ntype: project-brief\n---\n# Brief 2'
      );

      await fs.writeFile(
        path.join(CONTEXTS_DIR, 'progress-1.md'),
        '---\ntype: progress\n---\n# Progress 1'
      );

      const result = await contextService.listContexts();

      expect(result).toBeDefined();
      expect(result.contexts).toHaveLength(3);
      expect(result.byType).toBeDefined();
      expect(result.byType['project-brief']).toHaveLength(2);
      expect(result.byType['progress']).toHaveLength(1);
    });

    it('should return empty list when no contexts exist', async () => {
      const result = await contextService.listContexts();

      expect(result).toBeDefined();
      expect(result.contexts).toHaveLength(0);
      expect(result.byType).toEqual({});
    });
  });

  // ==========================================
  // validateContext() TESTS (3 tests)
  // ==========================================

  describe('validateContext()', () => {
    it('should validate correct structure', async () => {
      const validContext = `---
type: project-brief
name: Test Project
created: 2025-01-01
---
# Test Project
`;

      const result = await contextService.validateContext(
        'project-brief',
        validContext
      );

      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', async () => {
      const invalidContext = `---
type: project-brief
---
# Missing name and created
`;

      const result = await contextService.validateContext(
        'project-brief',
        invalidContext
      );

      expect(result).toBeDefined();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect invalid format', async () => {
      const invalidContext = 'No frontmatter at all';

      const result = await contextService.validateContext(
        'project-brief',
        invalidContext
      );

      expect(result).toBeDefined();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing frontmatter');
    });
  });

  // ==========================================
  // mergeContexts() TESTS (2 tests)
  // ==========================================

  describe('mergeContexts()', () => {
    it('should merge multiple contexts', async () => {
      const contexts = [
        {
          type: 'brief',
          content: '# Brief 1\n## Section A'
        },
        {
          type: 'brief',
          content: '# Brief 2\n## Section B'
        }
      ];

      const result = await contextService.mergeContexts(contexts);

      expect(result).toBeDefined();
      expect(result.merged).toContain('Section A');
      expect(result.merged).toContain('Section B');
      expect(result.sources).toHaveLength(2);
    });

    it('should deduplicate content when merging', async () => {
      const contexts = [
        {
          type: 'brief',
          content: '# Brief\n## Common Section\nShared content'
        },
        {
          type: 'brief',
          content: '# Brief\n## Common Section\nShared content'
        }
      ];

      const result = await contextService.mergeContexts(contexts);

      expect(result).toBeDefined();
      expect(result.merged).toBeDefined();
      // Should not contain duplicate sections
      const commonSections = (result.merged.match(/## Common Section/g) || []).length;
      expect(commonSections).toBe(1);
    });
  });

  // ==========================================
  // analyzeContextUsage() TESTS (2 tests)
  // ==========================================

  describe('analyzeContextUsage()', () => {
    it('should calculate statistics for contexts', async () => {
      // Create contexts with known sizes
      await fs.writeFile(
        path.join(CONTEXTS_DIR, 'small.md'),
        '---\ntype: test\n---\n# Small'
      );

      await fs.writeFile(
        path.join(CONTEXTS_DIR, 'large.md'),
        '---\ntype: test\n---\n' + '# Large\n'.repeat(100)
      );

      const result = await contextService.analyzeContextUsage();

      expect(result).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.stats.totalContexts).toBe(2);
      expect(result.stats.totalSize).toBeGreaterThan(0);
      expect(result.stats.averageSize).toBeGreaterThan(0);
    });

    it('should generate optimization recommendations', async () => {
      // Create large context (>50KB to trigger large file warning)
      const largeContextPath = path.join(CONTEXTS_DIR, 'large.md');
      await fs.writeFile(
        largeContextPath,
        '---\ntype: test\ncreated: 2020-01-01\n---\n' + 'x'.repeat(60000)
      );

      const result = await contextService.analyzeContextUsage();

      expect(result).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      // Should have recommendation for large file (file size mtime is recent, not old)
      expect(result.recommendations.some(r => r.includes('KB') && r.includes('splitting'))).toBe(true);
    });
  });
});
