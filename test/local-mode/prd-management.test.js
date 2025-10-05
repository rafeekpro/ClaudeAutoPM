/**
 * Test Suite: Local PRD Management Commands
 *
 * Tests for TASK-004: Local PRD management functionality
 * - /pm:prd-new --local
 * - /pm:prd-list --local
 * - /pm:prd-show --local
 * - /pm:prd-update --local
 *
 * TDD RED Phase: Write failing tests first
 */

const fs = require('fs').promises;
const path = require('path');
const { createLocalPRD, createPRDTemplate, generatePRDId } = require('../../autopm/.claude/scripts/pm-prd-new-local');
const { listLocalPRDs } = require('../../autopm/.claude/scripts/pm-prd-list-local');
const { showLocalPRD } = require('../../autopm/.claude/scripts/pm-prd-show-local');
const { updateLocalPRD } = require('../../autopm/.claude/scripts/pm-prd-update-local');
const { parseFrontmatter } = require('../../autopm/.claude/lib/frontmatter');

describe('Local PRD Management', () => {
  const testDir = path.join(__dirname, 'test-workspace-prd');
  const prdsDir = path.join(testDir, '.claude', 'prds');
  let originalCwd;

  beforeEach(async () => {
    // Setup test directory structure
    await fs.mkdir(prdsDir, { recursive: true });
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(async () => {
    // Restore original working directory before cleanup
    process.chdir(originalCwd);
    // Cleanup
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('createLocalPRD', () => {
    test('should create PRD file in .claude/prds/', async () => {
      const result = await createLocalPRD('User Authentication');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('filepath');
      expect(result).toHaveProperty('frontmatter');

      const exists = await fs.access(result.filepath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    test('should generate valid frontmatter with required fields', async () => {
      const result = await createLocalPRD('Payment Gateway');

      expect(result.frontmatter).toMatchObject({
        id: expect.any(String),
        title: 'Payment Gateway',
        created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        author: 'ClaudeAutoPM',
        status: 'draft',
        priority: 'medium',
        version: '1.0'
      });
    });

    test('should use correct filename format', async () => {
      const result = await createLocalPRD('User Authentication');

      expect(result.filepath).toMatch(/prd-\d{3}-user-authentication\.md$/);
    });

    test('should generate unique ID if not provided', async () => {
      const result1 = await createLocalPRD('Feature One');
      const result2 = await createLocalPRD('Feature Two');

      expect(result1.frontmatter.id).not.toBe(result2.frontmatter.id);
      expect(result1.frontmatter.id).toMatch(/^prd-\d{3}$/);
      expect(result2.frontmatter.id).toMatch(/^prd-\d{3}$/);
    });

    test('should accept custom ID in options', async () => {
      const result = await createLocalPRD('Custom ID Test', { id: 'prd-custom-001' });

      expect(result.frontmatter.id).toBe('prd-custom-001');
    });

    test('should accept custom author in options', async () => {
      const result = await createLocalPRD('Test', { author: 'John Doe' });

      expect(result.frontmatter.author).toBe('John Doe');
    });

    test('should accept custom priority in options', async () => {
      const result = await createLocalPRD('Test', { priority: 'high' });

      expect(result.frontmatter.priority).toBe('high');
    });

    test('should include template sections in body', async () => {
      const result = await createLocalPRD('Dashboard Feature');

      const content = await fs.readFile(result.filepath, 'utf8');
      const { body } = parseFrontmatter(content);

      expect(body).toContain('# Product Requirements Document: Dashboard Feature');
      expect(body).toContain('## 1. Executive Summary');
      expect(body).toContain('## 2. Background');
      expect(body).toContain('## 3. User Stories');
      expect(body).toContain('## 4. Functional Requirements');
      expect(body).toContain('## 5. Non-Functional Requirements');
      expect(body).toContain('## 6. Out of Scope');
      expect(body).toContain('## 7. Timeline');
    });

    test('should allow duplicate names, producing different IDs and files', async () => {
      const result1 = await createLocalPRD('Duplicate Test');
      const result2 = await createLocalPRD('Duplicate Test');

      expect(result1.frontmatter.id).not.toBe(result2.frontmatter.id);
      expect(result1.filepath).not.toBe(result2.filepath);

      // Check both files exist
      await expect(fs.access(result1.filepath)).resolves.toBeUndefined();
      await expect(fs.access(result2.filepath)).resolves.toBeUndefined();
    });

    test('should handle names with special characters', async () => {
      const result = await createLocalPRD('User\'s & Admin\'s Dashboard!');

      expect(result.filepath).toMatch(/prd-\d{3}-users-admins-dashboard\.md$/);
    });

    test('should handle names with multiple spaces', async () => {
      const result = await createLocalPRD('Feature   With    Spaces');

      expect(result.filepath).toMatch(/prd-\d{3}-feature-with-spaces\.md$/);
    });

    test('should validate required name parameter', async () => {
      await expect(createLocalPRD('')).rejects.toThrow(/name is required/i);
      await expect(createLocalPRD(null)).rejects.toThrow(/name is required/i);
      await expect(createLocalPRD(undefined)).rejects.toThrow(/name is required/i);
    });
  });

  describe('listLocalPRDs', () => {
    beforeEach(async () => {
      // Create sample PRDs
      await createLocalPRD('Feature A', { priority: 'high' });
      await createLocalPRD('Feature B', { priority: 'medium' });
      await createLocalPRD('Feature C', { priority: 'low' });
    });

    test('should list all local PRDs', async () => {
      const prds = await listLocalPRDs();

      expect(prds).toHaveLength(3);
      expect(prds[0]).toHaveProperty('id');
      expect(prds[0]).toHaveProperty('title');
      expect(prds[0]).toHaveProperty('status');
      expect(prds[0]).toHaveProperty('filename');
    });

    test('should sort PRDs by creation date (newest first)', async () => {
      // Create with delays to ensure different timestamps
      await createLocalPRD('Old Feature');
      await new Promise(resolve => setTimeout(resolve, 100));
      await createLocalPRD('New Feature');

      const prds = await listLocalPRDs();

      expect(prds[0].title).toBe('New Feature');
    });

    test('should filter by status', async () => {
      // Update one PRD to different status
      const allPrds = await listLocalPRDs();
      expect(allPrds).toHaveLength(3); // Verify we have 3 PRDs initially

      await updateLocalPRD(allPrds[0].id, 'status', 'approved');

      const approved = await listLocalPRDs({ status: 'approved' });
      const drafts = await listLocalPRDs({ status: 'draft' });

      expect(approved).toHaveLength(1); // 1 updated to approved
      expect(drafts).toHaveLength(2); // 2 remaining as drafts (3 - 1 = 2)
    });

    test('should return empty array if no PRDs exist', async () => {
      // Clear all PRDs
      const files = await fs.readdir(prdsDir);
      for (const file of files) {
        await fs.unlink(path.join(prdsDir, file));
      }

      const prds = await listLocalPRDs();
      expect(prds).toEqual([]);
    });

    test('should ignore non-markdown files', async () => {
      await fs.writeFile(path.join(prdsDir, 'readme.txt'), 'test');
      await fs.writeFile(path.join(prdsDir, 'config.json'), '{}');

      const prds = await listLocalPRDs();

      expect(prds).toHaveLength(3); // Only the 3 .md files
    });
  });

  describe('showLocalPRD', () => {
    let testPRDId;

    beforeEach(async () => {
      const result = await createLocalPRD('Test PRD');
      testPRDId = result.frontmatter.id;
    });

    test('should display PRD content by ID', async () => {
      const prd = await showLocalPRD(testPRDId);

      expect(prd).toHaveProperty('filepath');
      expect(prd).toHaveProperty('filename');
      expect(prd).toHaveProperty('frontmatter');
      expect(prd).toHaveProperty('body');
      expect(prd).toHaveProperty('content');
    });

    test('should return correct frontmatter', async () => {
      const prd = await showLocalPRD(testPRDId);

      expect(prd.frontmatter).toMatchObject({
        id: testPRDId,
        title: 'Test PRD',
        status: 'draft'
      });
    });

    test('should return body content', async () => {
      const prd = await showLocalPRD(testPRDId);

      expect(prd.body).toContain('# Product Requirements Document: Test PRD');
      expect(prd.body).toContain('## 1. Executive Summary');
    });

    test('should throw error if PRD not found', async () => {
      await expect(
        showLocalPRD('prd-nonexistent')
      ).rejects.toThrow(/PRD not found: prd-nonexistent/);
    });

    test('should handle multiple PRDs and find correct one', async () => {
      await createLocalPRD('Another PRD');
      await createLocalPRD('Yet Another PRD');

      const prd = await showLocalPRD(testPRDId);

      expect(prd.frontmatter.id).toBe(testPRDId);
      expect(prd.frontmatter.title).toBe('Test PRD');
    });
  });

  describe('updateLocalPRD', () => {
    let testPRDId;

    beforeEach(async () => {
      const result = await createLocalPRD('Updatable PRD');
      testPRDId = result.frontmatter.id;
    });

    test('should update frontmatter field', async () => {
      await updateLocalPRD(testPRDId, 'status', 'approved');

      const prd = await showLocalPRD(testPRDId);
      expect(prd.frontmatter.status).toBe('approved');
    });

    test('should update priority', async () => {
      await updateLocalPRD(testPRDId, 'priority', 'critical');

      const prd = await showLocalPRD(testPRDId);
      expect(prd.frontmatter.priority).toBe('critical');
    });

    test('should update version', async () => {
      await updateLocalPRD(testPRDId, 'version', '2.0');

      const prd = await showLocalPRD(testPRDId);
      expect(prd.frontmatter.version).toBe('2.0');
    });

    test('should preserve body content when updating frontmatter', async () => {
      const originalPRD = await showLocalPRD(testPRDId);
      const originalBody = originalPRD.body;

      await updateLocalPRD(testPRDId, 'status', 'reviewed');

      const updatedPRD = await showLocalPRD(testPRDId);
      expect(updatedPRD.body).toBe(originalBody);
    });

    test('should throw error if PRD not found', async () => {
      await expect(
        updateLocalPRD('prd-nonexistent', 'status', 'approved')
      ).rejects.toThrow(/PRD not found/);
    });

    test('should validate required parameters', async () => {
      await expect(
        updateLocalPRD(testPRDId, '', 'value')
      ).rejects.toThrow(/field is required/i);

      await expect(
        updateLocalPRD('', 'status', 'value')
      ).rejects.toThrow(/id is required/i);
    });

    test('should handle updating non-existent field (add new field)', async () => {
      await updateLocalPRD(testPRDId, 'customField', 'customValue');

      const prd = await showLocalPRD(testPRDId);
      expect(prd.frontmatter.customField).toBe('customValue');
    });
  });

  describe('createPRDTemplate', () => {
    test('should generate template with correct title', () => {
      const template = createPRDTemplate('My Feature');

      expect(template).toContain('# Product Requirements Document: My Feature');
    });

    test('should include all required sections', () => {
      const template = createPRDTemplate('Test');

      const requiredSections = [
        '## 1. Executive Summary',
        '### Overview',
        '### Business Value',
        '### Success Metrics',
        '## 2. Background',
        '### Problem Statement',
        '### Current State',
        '### Goals and Objectives',
        '## 3. User Stories',
        '## 4. Functional Requirements',
        '## 5. Non-Functional Requirements',
        '## 6. Out of Scope',
        '## 7. Timeline'
      ];

      requiredSections.forEach(section => {
        expect(template).toContain(section);
      });
    });
  });

  describe('generatePRDId', () => {
    test('should generate ID in format prd-XXX', () => {
      const id = generatePRDId();

      expect(id).toMatch(/^prd-\d{3}$/);
    });

    test('should generate unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 10; i++) {
        ids.add(generatePRDId());
      }

      // Should have multiple unique IDs (allowing for possible collisions)
      expect(ids.size).toBeGreaterThan(1);
    });
  });

  describe('Integration with frontmatter utilities', () => {
    test('should work with parseFrontmatter from TASK-002', async () => {
      const result = await createLocalPRD('Integration Test');
      const content = await fs.readFile(result.filepath, 'utf8');

      const { frontmatter, body } = parseFrontmatter(content);

      expect(frontmatter.id).toBe(result.frontmatter.id);
      expect(frontmatter.title).toBe('Integration Test');
      expect(body).toContain('# Product Requirements Document');
    });

    test('should maintain frontmatter format after update', async () => {
      const result = await createLocalPRD('Format Test');
      await updateLocalPRD(result.frontmatter.id, 'status', 'approved');

      const content = await fs.readFile(result.filepath, 'utf8');

      // Should start with ---
      expect(content).toMatch(/^---\n/);
      // Should have closing ---
      expect(content).toMatch(/\n---\n/);
    });
  });

  describe('Edge Cases', () => {
    test('should handle PRD with no frontmatter (corrupt file)', async () => {
      // Create some valid PRDs first
      await createLocalPRD('Valid PRD 1');
      await createLocalPRD('Valid PRD 2');

      // Add a corrupt file without frontmatter
      const corruptFile = path.join(prdsDir, 'corrupt.md');
      await fs.writeFile(corruptFile, '# Just a markdown file\nNo frontmatter here.');

      const prds = await listLocalPRDs();

      // Should skip files without valid frontmatter
      // All returned PRDs should have essential frontmatter fields
      expect(prds.every(p => p.id && p.title && p.status)).toBe(true);
      // Should only return the valid PRDs (corrupt file excluded)
      expect(prds).toHaveLength(2);
    });

    test('should handle concurrent PRD creation', async () => {
      const promises = [
        createLocalPRD('Concurrent 1'),
        createLocalPRD('Concurrent 2'),
        createLocalPRD('Concurrent 3')
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);

      // All should have unique IDs
      const ids = results.map(r => r.frontmatter.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });

    test('should handle very long PRD names', async () => {
      const longName = 'A'.repeat(200);
      const result = await createLocalPRD(longName);

      expect(result.filepath).toBeTruthy();
      // Filename should be sanitized but still work
      const exists = await fs.access(result.filepath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });
});
