/**
 * TASK-006: Phase 1 Integration Tests
 *
 * Comprehensive integration testing for all Phase 1 components:
 * - TASK-001: setup-local-mode.js (Directory structure)
 * - TASK-002: frontmatter.js (YAML parsing)
 * - TASK-003: cli-parser.js (CLI flags)
 * - TASK-004: PRD management (new, list, show, update)
 * - TASK-005: pm-prd-parse-local.js (PRD → Epic parser)
 *
 * Tests 30 scenarios covering:
 * - End-to-End Workflows (10 tests)
 * - Component Integration (8 tests)
 * - Error Handling & Edge Cases (7 tests)
 * - Performance & Reliability (5 tests)
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const os = require('os');

// Import all Phase 1 components
const { setupLocalDirectories } = require('../../autopm/.claude/scripts/setup-local-mode');
const { createLocalPRD } = require('../../autopm/.claude/scripts/pm-prd-new-local');
const { listLocalPRDs } = require('../../autopm/.claude/scripts/pm-prd-list-local');
const { showLocalPRD } = require('../../autopm/.claude/scripts/pm-prd-show-local');
const { updateLocalPRD, updateMultipleFields } = require('../../autopm/.claude/scripts/pm-prd-update-local');
const { parseLocalPRD } = require('../../autopm/.claude/scripts/pm-prd-parse-local');
const { parseFrontmatter, stringifyFrontmatter } = require('../../autopm/.claude/lib/frontmatter');
const { parsePMCommand } = require('../../autopm/.claude/lib/cli-parser');

describe('Phase 1 Integration Tests', () => {
  let tempDir;
  let originalCwd;

  beforeEach(async () => {
    tempDir = fsSync.mkdtempSync(path.join(os.tmpdir(), 'phase1-integration-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    if (tempDir && fsSync.existsSync(tempDir)) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('End-to-End Workflow', () => {
    it('should complete full workflow: Setup → PRD → Epic', async () => {
      // 1. Setup
      await setupLocalDirectories();
      expect(fsSync.existsSync(path.join(tempDir, '.claude', 'prds'))).toBe(true);
      expect(fsSync.existsSync(path.join(tempDir, '.claude', 'epics'))).toBe(true);

      // 2. Create PRD
      const prd = await createLocalPRD('User Authentication', {
        author: 'Test Team',
        priority: 'high'
      });
      expect(prd.id).toBeTruthy();
      expect(prd.filepath).toBeTruthy();
      expect(prd.frontmatter.title).toBe('User Authentication');

      // 3. Parse PRD → Epic
      const epic = await parseLocalPRD(prd.id);
      expect(epic.frontmatter.prd_id).toBe(prd.id);
      expect(fsSync.existsSync(epic.epicPath)).toBe(true);

      // 4. Verify Epic content
      const epicContent = await fs.readFile(epic.epicPath, 'utf8');
      const { frontmatter: epicMeta } = parseFrontmatter(epicContent);
      expect(epicMeta.status).toBe('planning');
      expect(epicMeta.prd_id).toBe(prd.id);
    });

    it('should handle multiple PRDs and list them correctly', async () => {
      await setupLocalDirectories();

      // Create 3 PRDs
      await createLocalPRD('Feature A', { priority: 'high' });
      await createLocalPRD('Feature B', { priority: 'medium' });
      await createLocalPRD('Feature C', { priority: 'low' });

      // List all
      const prds = await listLocalPRDs();
      expect(prds).toHaveLength(3);

      // Verify all titles present
      const titles = prds.map(p => p.title);
      expect(titles).toContain('Feature A');
      expect(titles).toContain('Feature B');
      expect(titles).toContain('Feature C');
    });

    it('should handle PRD update → Parse → Epic reflects changes', async () => {
      await setupLocalDirectories();

      // Create PRD
      const prd = await createLocalPRD('Initial Feature');

      // Update PRD status
      await updateLocalPRD(prd.id, 'status', 'approved');

      // Verify update
      const updated = await showLocalPRD(prd.id);
      expect(updated.frontmatter.status).toBe('approved');

      // Parse to Epic
      const epic = await parseLocalPRD(prd.id);
      expect(epic.frontmatter.prd_id).toBe(prd.id);
      expect(fsSync.existsSync(epic.epicPath)).toBe(true);
    });

    it('should parse complex PRD with all sections', async () => {
      await setupLocalDirectories();

      // Create complex PRD manually
      const complexPRD = `---
id: prd-999
title: Complex Feature
created: 2025-10-05
createdAt: 2025-10-05T10:00:00.000Z
author: Test
status: draft
priority: high
version: 1.0
---

# Product Requirements Document: Complex Feature

## 1. Executive Summary

### Overview
This is a comprehensive feature with multiple sections and detailed requirements.

### Business Value
High value feature providing significant ROI.

## 2. Goals and Objectives

- Goal 1: Improve UX
- Goal 2: Increase performance
- Goal 3: Reduce costs

## 3. User Stories

As a user, I want to authenticate quickly
So that I can access my account

As an admin, I want to manage users
So that I can control access

## 4. Functional Requirements

- REQ-1: Must support OAuth
- REQ-2: Must have 2FA
- REQ-3: Must log all access attempts

## 5. Timeline

- Week 1: Design
- Week 2: Implementation
- Week 3: Testing
`;

      const prdPath = path.join(tempDir, '.claude', 'prds', 'complex-feature.md');
      await fs.writeFile(prdPath, complexPRD);

      // Parse it
      const epic = await parseLocalPRD('prd-999');

      // Verify all sections extracted
      expect(epic.sections.overview).toContain('comprehensive');
      expect(epic.sections.goals).toContain('Goal 1');
      expect(epic.sections.userStories).toHaveLength(2);
      expect(epic.sections.requirements).toContain('REQ-1');
      expect(epic.sections.timeline).toContain('Week 1');
    });

    it('should handle concurrent PRD creation operations', async () => {
      await setupLocalDirectories();

      // Create multiple PRDs concurrently
      const promises = [
        createLocalPRD('Concurrent Feature 1'),
        createLocalPRD('Concurrent Feature 2'),
        createLocalPRD('Concurrent Feature 3')
      ];

      const results = await Promise.all(promises);

      // Verify all created
      expect(results).toHaveLength(3);
      results.forEach(prd => {
        expect(prd.id).toBeTruthy();
        expect(fsSync.existsSync(prd.filepath)).toBe(true);
      });

      // Verify unique IDs
      const ids = results.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });

    it('should handle idempotent setup (run multiple times safely)', async () => {
      // Run setup first time
      await setupLocalDirectories();
      const prdsDir1 = path.join(tempDir, '.claude', 'prds');
      expect(fsSync.existsSync(prdsDir1)).toBe(true);

      // Create a PRD
      await createLocalPRD('Test Feature');
      const files1 = await fs.readdir(prdsDir1);
      expect(files1).toHaveLength(1);

      // Run setup again
      await setupLocalDirectories();

      // Verify directory still exists and PRD not deleted
      const prdsDir2 = path.join(tempDir, '.claude', 'prds');
      expect(fsSync.existsSync(prdsDir2)).toBe(true);
      const files2 = await fs.readdir(prdsDir2);
      expect(files2).toHaveLength(1);
    });

    it('should create correct epic directory structure', async () => {
      await setupLocalDirectories();

      const prd = await createLocalPRD('Directory Test Feature');
      const epic = await parseLocalPRD(prd.id);

      // Verify epic directory structure
      expect(fsSync.existsSync(epic.epicDir)).toBe(true);
      expect(fsSync.existsSync(epic.epicPath)).toBe(true);
      expect(epic.epicDir).toContain(epic.epicId);

      // Verify epic.md exists in the directory
      const dirContents = await fs.readdir(epic.epicDir);
      expect(dirContents).toContain('epic.md');
    });

    it('should correctly link PRD ↔ Epic IDs in frontmatter', async () => {
      await setupLocalDirectories();

      const prd = await createLocalPRD('Linking Test');
      const epic = await parseLocalPRD(prd.id);

      // Verify Epic references PRD
      expect(epic.frontmatter.prd_id).toBe(prd.id);

      // Verify Epic ID derived from PRD ID
      const prdNum = prd.id.replace('prd-', '');
      const expectedEpicId = `epic-${prdNum}`;
      expect(epic.epicId).toBe(expectedEpicId);
    });

    it('should extract user stories correctly', async () => {
      await setupLocalDirectories();

      const prdWithStories = `---
id: prd-777
title: Story Test
created: 2025-10-05
createdAt: 2025-10-05T10:00:00.000Z
author: Test
status: draft
priority: medium
version: 1.0
---

# Product Requirements Document: Story Test

## 3. User Stories

As a developer, I want to write tests
So that I can ensure code quality

As a user, I want to see error messages
So that I can fix issues quickly

As an admin, I want to view logs
So that I can debug problems
`;

      const prdPath = path.join(tempDir, '.claude', 'prds', 'story-test.md');
      await fs.writeFile(prdPath, prdWithStories);

      const epic = await parseLocalPRD('prd-777');

      // Verify 3 user stories extracted
      expect(epic.sections.userStories).toHaveLength(3);
      expect(epic.sections.userStories[0].raw).toContain('developer');
      expect(epic.sections.userStories[1].raw).toContain('user');
      expect(epic.sections.userStories[2].raw).toContain('admin');
    });

    it('should preserve all PRD sections in Epic', async () => {
      await setupLocalDirectories();

      const prd = await createLocalPRD('Section Preservation Test');
      const epic = await parseLocalPRD(prd.id);

      // Verify Epic body contains standard sections
      const epicContent = await fs.readFile(epic.epicPath, 'utf8');
      const { body } = parseFrontmatter(epicContent);

      expect(body).toContain('## Overview');
      expect(body).toContain('## Technical Architecture');
      expect(body).toContain('### Goals');
      expect(body).toContain('### User Stories');
      expect(body).toContain('## Implementation Tasks');
      expect(body).toContain('## Timeline');
      expect(body).toContain('## Related Documents');
    });
  });

  describe('Component Integration', () => {
    it('should integrate Frontmatter + PRD creation correctly', async () => {
      await setupLocalDirectories();

      const prd = await createLocalPRD('Frontmatter Test', {
        author: 'Integration Tester',
        priority: 'critical'
      });

      // Verify frontmatter is valid YAML
      const content = await fs.readFile(prd.filepath, 'utf8');
      const { frontmatter } = parseFrontmatter(content);

      expect(frontmatter.id).toBe(prd.id);
      expect(frontmatter.title).toBe('Frontmatter Test');
      expect(frontmatter.author).toBe('Integration Tester');
      expect(frontmatter.priority).toBe('critical');
      expect(frontmatter.status).toBe('draft');
    });

    it('should integrate Frontmatter + Epic parsing correctly', async () => {
      await setupLocalDirectories();

      const prd = await createLocalPRD('Epic Parse Test');
      const epic = await parseLocalPRD(prd.id);

      // Verify Epic has valid frontmatter
      const epicContent = await fs.readFile(epic.epicPath, 'utf8');
      const { frontmatter } = parseFrontmatter(epicContent);

      expect(frontmatter.id).toBe(epic.epicId);
      expect(frontmatter.prd_id).toBe(prd.id);
      expect(frontmatter.status).toBe('planning');
      expect(frontmatter.tasks_total).toBe(0);
      expect(frontmatter.tasks_completed).toBe(0);
    });

    it('should integrate CLI parser + PRD commands with --local flag', async () => {
      // Parse command with --local flag
      const argv = parsePMCommand(['prd-new', 'Test Feature', '--local']);

      expect(argv.local).toBe(true);
      expect(argv.mode).toBe('local');
      expect(argv._).toContain('prd-new');
    });

    it('should ensure directories exist before PRD creation', async () => {
      // Create PRD WITHOUT setup (should auto-create directories)
      const prd = await createLocalPRD('Auto Directory Test');

      // Verify directories were created
      expect(fsSync.existsSync(path.join(tempDir, '.claude', 'prds'))).toBe(true);
      expect(fsSync.existsSync(prd.filepath)).toBe(true);
    });

    it('should chain PRD show + Epic parse operations', async () => {
      await setupLocalDirectories();

      const prd = await createLocalPRD('Chain Test');

      // Show PRD
      const shown = await showLocalPRD(prd.id);
      expect(shown.frontmatter.id).toBe(prd.id);

      // Parse same PRD to Epic
      const epic = await parseLocalPRD(prd.id);
      expect(epic.frontmatter.prd_id).toBe(prd.id);
    });

    it('should chain List + Update + Show commands', async () => {
      await setupLocalDirectories();

      await createLocalPRD('Chain Feature');

      // List
      const prds = await listLocalPRDs();
      expect(prds).toHaveLength(1);
      const prdId = prds[0].id;

      // Update
      await updateLocalPRD(prdId, 'status', 'approved');

      // Show
      const shown = await showLocalPRD(prdId);
      expect(shown.frontmatter.status).toBe('approved');
    });

    it('should integrate markdown parsing + frontmatter operations', async () => {
      await setupLocalDirectories();

      // Create PRD with custom content
      const prd = await createLocalPRD('Markdown Test');

      // Update content via frontmatter
      const content = await fs.readFile(prd.filepath, 'utf8');
      const { frontmatter, body } = parseFrontmatter(content);

      frontmatter.status = 'in-review';
      const updated = stringifyFrontmatter(frontmatter, body);
      await fs.writeFile(prd.filepath, updated);

      // Verify update
      const shown = await showLocalPRD(prd.id);
      expect(shown.frontmatter.status).toBe('in-review');
    });

    it('should ensure all utilities work together seamlessly', async () => {
      // Setup
      await setupLocalDirectories();

      // CLI parsing
      const argv = parsePMCommand(['prd-new', 'Seamless Test', '--local']);
      expect(argv.mode).toBe('local');

      // Create PRD
      const prd = await createLocalPRD('Seamless Test');

      // Frontmatter validation
      const content = await fs.readFile(prd.filepath, 'utf8');
      const { frontmatter } = parseFrontmatter(content);
      expect(frontmatter.id).toBeTruthy();

      // Update via utility
      await updateMultipleFields(prd.id, { status: 'approved', priority: 'high' });

      // List and verify
      const prds = await listLocalPRDs();
      expect(prds[0].status).toBe('approved');

      // Parse to Epic
      const epic = await parseLocalPRD(prd.id);
      expect(epic.epicPath).toBeTruthy();
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should error when parsing non-existent PRD', async () => {
      await setupLocalDirectories();

      await expect(parseLocalPRD('prd-nonexistent'))
        .rejects
        .toThrow(/PRD not found/);
    });

    it('should auto-create directories when creating PRD without setup', async () => {
      // Don't run setup
      const prd = await createLocalPRD('Auto Create Test');

      // Verify directories created automatically
      expect(fsSync.existsSync(path.join(tempDir, '.claude', 'prds'))).toBe(true);
      expect(fsSync.existsSync(prd.filepath)).toBe(true);
    });

    it('should handle malformed PRD markdown gracefully', async () => {
      await setupLocalDirectories();

      // Create PRD with invalid frontmatter
      const invalidPRD = `---
id: prd-bad
title: Bad PRD
invalid yaml here: [unclosed
---

Body content
`;

      const prdPath = path.join(tempDir, '.claude', 'prds', 'bad-prd.md');
      await fs.writeFile(prdPath, invalidPRD);

      // List should skip invalid PRDs
      const prds = await listLocalPRDs();
      expect(prds).toHaveLength(0);
    });

    it('should handle empty PRD sections with defaults', async () => {
      await setupLocalDirectories();

      const minimalPRD = `---
id: prd-minimal
title: Minimal PRD
created: 2025-10-05
createdAt: 2025-10-05T10:00:00.000Z
author: Test
status: draft
priority: low
version: 1.0
---

# Product Requirements Document: Minimal PRD

No sections here.
`;

      const prdPath = path.join(tempDir, '.claude', 'prds', 'minimal-prd.md');
      await fs.writeFile(prdPath, minimalPRD);

      const epic = await parseLocalPRD('prd-minimal');

      // Should still create epic with default content
      expect(epic.epicPath).toBeTruthy();
      expect(epic.sections.userStories).toHaveLength(0);
    });

    it('should prevent duplicate PRD names with unique IDs', async () => {
      await setupLocalDirectories();

      // Create two PRDs with same name
      const prd1 = await createLocalPRD('Duplicate Name');
      const prd2 = await createLocalPRD('Duplicate Name');

      // Should have different IDs
      expect(prd1.id).not.toBe(prd2.id);

      // Both should exist
      const prds = await listLocalPRDs();
      expect(prds).toHaveLength(2);
    });

    it('should create basic epic from minimal PRD', async () => {
      await setupLocalDirectories();

      const prd = await createLocalPRD('Minimal Feature');
      const epic = await parseLocalPRD(prd.id);

      // Epic should be created even with minimal PRD
      expect(fsSync.existsSync(epic.epicPath)).toBe(true);
      expect(epic.frontmatter.status).toBe('planning');
      expect(epic.sections.userStories).toHaveLength(0);
    });

    it('should sanitize long PRD names for filenames', async () => {
      await setupLocalDirectories();

      const longName = 'A'.repeat(300) + ' Feature With Special Chars !@#$%';
      const prd = await createLocalPRD(longName);

      // Verify filename is sanitized
      const filename = path.basename(prd.filepath);
      expect(filename.length).toBeLessThan(300);
      expect(filename).toMatch(/\.md$/);
      expect(filename).not.toContain('!');
      expect(filename).not.toContain('@');
    });
  });

  describe('Performance & Reliability', () => {
    it('should complete setup in <1s', async () => {
      const start = Date.now();
      await setupLocalDirectories();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
    });

    it('should create PRD in <500ms', async () => {
      await setupLocalDirectories();

      const start = Date.now();
      await createLocalPRD('Quick Test');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
    });

    it('should parse PRD to Epic in <2s', async () => {
      await setupLocalDirectories();

      const prd = await createLocalPRD('Parse Test');

      const start = Date.now();
      await parseLocalPRD(prd.id);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000);
    });

    it('should list 100 PRDs in <3s', async () => {
      await setupLocalDirectories();

      // Create 100 PRDs
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(createLocalPRD(`Feature ${i}`));
      }
      await Promise.all(promises);

      const start = Date.now();
      const prds = await listLocalPRDs();
      const duration = Date.now() - start;

      expect(prds).toHaveLength(100);
      expect(duration).toBeLessThan(3000);
    });

    it('should handle concurrent 10 PRD creations successfully', async () => {
      await setupLocalDirectories();

      // Create 10 PRDs concurrently
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(createLocalPRD(`Concurrent ${i}`));
      }

      const results = await Promise.all(promises);

      // All should succeed
      expect(results).toHaveLength(10);

      // All should have unique IDs
      const ids = results.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);

      // All files should exist
      results.forEach(prd => {
        expect(fsSync.existsSync(prd.filepath)).toBe(true);
      });
    });
  });
});
