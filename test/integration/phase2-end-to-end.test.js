/**
 * Phase 2 Integration Tests: End-to-End Workflow
 * Complete workflow test: PRD → Epic → Tasks → Completion
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

describe('Phase 2: End-to-End Workflow (Integration)', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    originalCwd = process.cwd();
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'phase2-e2e-'));
    process.chdir(testDir);

    // Setup local mode structure
    await fs.mkdir('.claude/prds', { recursive: true });
    await fs.mkdir('.claude/epics', { recursive: true });
    await fs.mkdir('.claude/context', { recursive: true });
    await fs.mkdir('.claude/logs', { recursive: true });
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('Complete Product Development Cycle', () => {
    test('should complete full cycle: PRD → Epic → Tasks → Completion', async () => {
      // STEP 1: Create PRD
      const prdContent = `---
id: prd-001
title: User Authentication Feature
status: active
priority: high
created: 2025-01-01
---

# User Authentication Feature

## Overview
Implement secure user authentication system.

## User Stories

**As a** user
**I want** to securely log in to the application
**So that** I can access my personal data

**As a** user
**I want** to register a new account
**So that** I can start using the application

**As an** administrator
**I want** to manage user accounts
**So that** I can maintain system security
`;

      await fs.writeFile('.claude/prds/prd-001-auth-feature.md', prdContent);

      // STEP 2: Parse PRD to create Epics
      const { parseLocalPRD } = require('../../autopm/.claude/scripts/pm-prd-parse-local');
      const parseResult = await parseLocalPRD('prd-001');

      expect(parseResult.epicId).toBeDefined();
      expect(parseResult.epicPath).toBeDefined();

      // STEP 3: Verify Epic created
      const { listLocalEpics } = require('../../autopm/.claude/scripts/pm-epic-list-local');
      const epics = await listLocalEpics();
      expect(epics.length).toBeGreaterThan(0);

      const firstEpic = epics[0];
      expect(firstEpic.prd_id).toBe('prd-001');

      // STEP 4: Show Epic details
      const { showLocalEpic } = require('../../autopm/.claude/scripts/pm-epic-show-local');
      const epicDetails = await showLocalEpic(firstEpic.id);
      expect(epicDetails.frontmatter.id).toBe(firstEpic.id);
      expect(epicDetails.frontmatter.status).toBe('planning');

      // STEP 5: Update Epic to in_progress
      const { updateLocalEpic } = require('../../autopm/.claude/scripts/pm-epic-update-local');
      await updateLocalEpic(firstEpic.id, { status: 'in_progress' });

      // STEP 6: Create Tasks manually (simulating decomposition)
      const epicDir = path.dirname(epicDetails.path);
      const task1 = `---
id: task-${firstEpic.id}-001
epic_id: ${firstEpic.id}
title: Implement login API endpoint
status: pending
priority: high
estimated_hours: 6
created: 2025-01-01
dependencies: []
---

# Implement login API endpoint

## Acceptance Criteria
- [ ] POST /api/login endpoint created
- [ ] Password validation implemented
- [ ] JWT token generation working
`;

      const task2 = `---
id: task-${firstEpic.id}-002
epic_id: ${firstEpic.id}
title: Create login UI component
status: pending
priority: high
estimated_hours: 4
created: 2025-01-01
dependencies: [`task-${firstEpic.id}-001`]
---

# Create login UI component

## Acceptance Criteria
- [ ] Login form created
- [ ] Form validation implemented
- [ ] Error handling added
`;

      await fs.writeFile(path.join(epicDir, 'task-001.md'), task1);
      await fs.writeFile(path.join(epicDir, 'task-002.md'), task2);

      // Update epic with task count
      await updateLocalEpic(firstEpic.id, {
        tasks_total: 2,
        tasks_completed: 0
      });

      // STEP 7: Work on tasks
      const { updateLocalTask } = require('../../autopm/.claude/scripts/pm-task-update-local');

      // Start Task 1
      await updateLocalTask(firstEpic.id, 'task-001', { status: 'in_progress' });

      // Complete Task 1
      await updateLocalTask(firstEpic.id, 'task-001', { status: 'completed' });
      await updateLocalEpic(firstEpic.id, { tasks_completed: 1 });

      // Verify progress
      let updatedEpic = await showLocalEpic(firstEpic.id);
      expect(updatedEpic.frontmatter.tasks_completed).toBe(1);
      expect(updatedEpic.frontmatter.tasks_total).toBe(2);

      // Start and complete Task 2
      await updateLocalTask(firstEpic.id, 'task-002', { status: 'in_progress' });
      await updateLocalTask(firstEpic.id, 'task-002', { status: 'completed' });
      await updateLocalEpic(firstEpic.id, { tasks_completed: 2 });

      // STEP 8: Mark Epic as completed
      await updateLocalEpic(firstEpic.id, { status: 'completed' });

      // STEP 9: Verify final state
      updatedEpic = await showLocalEpic(firstEpic.id);
      expect(updatedEpic.frontmatter.status).toBe('completed');
      expect(updatedEpic.frontmatter.tasks_completed).toBe(2);
      expect(updatedEpic.frontmatter.tasks_total).toBe(2);

      // Calculate completion percentage
      const completion = (updatedEpic.frontmatter.tasks_completed / updatedEpic.frontmatter.tasks_total) * 100;
      expect(completion).toBe(100);
    });
  });

  describe('Data Integrity Throughout Cycle', () => {
    test('should maintain data integrity across all operations', async () => {
      // Create PRD
      const prdId = 'prd-100';
      const prdContent = `---
id: ${prdId}
title: Integrity Test
status: active
priority: high
created: 2025-01-01
---

# Integrity Test

## User Stories

**As a** tester
**I want** to verify data integrity
**So that** the system is reliable
`;

      await fs.writeFile('.claude/prds/prd-100-integrity.md', prdContent);

      // Create Epic
      const epicId = 'epic-100';
      await fs.mkdir(`.claude/epics/${epicId}-integrity`, { recursive: true });
      const epicContent = `---
id: ${epicId}
prd_id: ${prdId}
title: Integrity Test Epic
status: pending
priority: high
created: 2025-01-01
user_stories:
  - story-001
---

# Integrity Test Epic
`;

      await fs.writeFile(`.claude/epics/${epicId}-integrity/epic.md`, epicContent);

      // Verify relationships
      const { showLocalEpic } = require('../../autopm/.claude/scripts/pm-epic-show-local');
      const epic = await showLocalEpic(epicId);
      expect(epic.frontmatter.prd_id).toBe(prdId);

      // Verify PRD exists
      const prdExists = await fs.stat('.claude/prds/prd-100-integrity.md').catch(() => null);
      expect(prdExists).not.toBeNull();

      // Multiple updates should not corrupt data
      const { updateLocalEpic } = require('../../autopm/.claude/scripts/pm-epic-update-local');

      for (let i = 0; i < 5; i++) {
        await updateLocalEpic(epicId, {
          status: i % 2 === 0 ? 'in_progress' : 'pending',
          tasks_completed: i
        });
      }

      // Verify data still valid
      const finalEpic = await showLocalEpic(epicId);
      expect(finalEpic.frontmatter.id).toBe(epicId);
      expect(finalEpic.frontmatter.prd_id).toBe(prdId);
      expect(finalEpic.frontmatter.title).toBe('Integrity Test Epic');
    });
  });

  describe('Performance Tests', () => {
    test('should handle large number of items efficiently', async () => {
      const startTime = Date.now();

      // Create 50 PRDs
      for (let i = 1; i <= 50; i++) {
        const prdId = `prd-${String(i).padStart(3, '0')}`;
        const content = `---
id: ${prdId}
title: PRD ${i}
status: active
priority: medium
created: 2025-01-01
---

# PRD ${i}

## User Stories

**As a** user
**I want** feature ${i}
**So that** I can test performance
`;
        await fs.writeFile(`.claude/prds/${prdId}-test.md`, content);
      }

      // Create 20 Epics
      for (let i = 1; i <= 20; i++) {
        const epicId = `epic-${String(i).padStart(3, '0')}`;
        await fs.mkdir(`.claude/epics/${epicId}-test`, { recursive: true });
        const content = `---
id: ${epicId}
prd_id: prd-001
title: Epic ${i}
status: pending
priority: medium
created: 2025-01-01
---

# Epic ${i}
`;
        await fs.writeFile(`.claude/epics/${epicId}-test/epic.md`, content);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (< threshold, default 5 seconds)
      const PERFORMANCE_THRESHOLD_MS = process.env.E2E_PERFORMANCE_THRESHOLD_MS
        ? parseInt(process.env.E2E_PERFORMANCE_THRESHOLD_MS, 10)
        : 5000;
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);

      // Verify all items created
      const { listLocalEpics } = require('../../autopm/.claude/scripts/pm-epic-list-local');
      const epics = await listLocalEpics();
      expect(epics.length).toBe(20);
    });
  });
});
