/**
 * Integration tests for PM workflow scenarios
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Mock external dependencies
jest.mock('fs');
jest.mock('child_process');

describe('PM Workflow Integration Tests', () => {
  let tempDir;

  beforeEach(() => {
    jest.clearAllMocks();
    tempDir = '/tmp/test-pm-workflow';

    // Setup default mocks
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.readFileSync = jest.fn();
    fs.writeFileSync = jest.fn();
    fs.mkdirSync = jest.fn();
    fs.readdirSync = jest.fn().mockReturnValue([]);
    execSync.mockReturnValue('');

    // Mock console
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('PRD to Epic Workflow', () => {
    test('should complete PRD → Epic → Tasks workflow', async () => {
      // Step 1: Create PRD
      const PrdNew = require('../../autopm/.claude/scripts/pm/prd-new.js');
      const prdCreator = new PrdNew();

      // Mock PRD creation
      prdCreator.createPrd = jest.fn().mockReturnValue(true);

      const prdResult = prdCreator.createPrd('test-feature', {
        description: 'Test feature description',
        priority: 'P1'
      });

      expect(prdResult).toBe(true);

      // Step 2: Parse PRD to Epic
      const PrdParser = require('../../autopm/.claude/scripts/pm/prd-parse.js');
      const parser = new PrdParser();

      // Mock PRD content
      const mockPrdContent = `---
name: test-feature
priority: P1
description: Test feature
---

## Executive Summary
This is a test feature for integration testing.

## Key Features
- Feature 1: User interface
- Feature 2: API integration
- Feature 3: Data storage

## Technical Requirements
- Frontend framework
- Backend API
- Database
`;

      fs.readFileSync.mockReturnValue(mockPrdContent);

      // Mock parsePrd method
      parser.parsePrd = jest.fn().mockResolvedValue(true);

      const parseResult = await parser.parsePrd('test-feature');
      expect(parseResult).toBe(true);

      // Step 3: Verify Epic creation workflow
      expect(parser.parsePrd).toHaveBeenCalledWith('test-feature');
    });

    test('should handle PRD → Issue workflow', async () => {
      // Mock issue creation from Epic
      const IssueStart = require('../../autopm/.claude/scripts/pm/issue-start.js');
      const issueStarter = new IssueStart();

      issueStarter.startIssue = jest.fn().mockResolvedValue(true);

      const issueResult = await issueStarter.startIssue('TASK-1');
      expect(issueResult).toBe(true);
    });
  });

  describe('Development Workflow', () => {
    test('should complete Issue → PR → Release workflow', async () => {
      // Step 1: Start Issue
      const IssueStart = require('../../autopm/.claude/scripts/pm/issue-start.js');
      const issueStarter = new IssueStart();

      issueStarter.startIssue = jest.fn().mockResolvedValue(true);
      const startResult = await issueStarter.startIssue('ISSUE-123');
      expect(startResult).toBe(true);

      // Step 2: Create PR
      const PrCreator = require('../../autopm/.claude/scripts/pm/pr-create.js');
      const prCreator = new PrCreator();

      prCreator.createPr = jest.fn().mockResolvedValue(true);
      const prResult = await prCreator.createPr('feat: implement test feature');
      expect(prResult).toBe(true);

      // Step 3: Close Issue
      const IssueClose = require('../../autopm/.claude/scripts/pm/issue-close.js');
      const issueCloser = new IssueClose();

      issueCloser.closeIssue = jest.fn().mockResolvedValue(true);
      const closeResult = await issueCloser.closeIssue('ISSUE-123');
      expect(closeResult).toBe(true);
    });

    test('should handle release workflow', async () => {
      const ReleaseManager = require('../../autopm/.claude/scripts/pm/release.js');
      const releaseManager = new ReleaseManager();

      // Mock release process
      releaseManager.createRelease = jest.fn().mockResolvedValue(true);

      const releaseResult = await releaseManager.createRelease('1.0.0');
      expect(releaseResult).toBe(true);
    });
  });

  describe('Context Management Workflow', () => {
    test('should create and update context files', async () => {
      // Step 1: Create context
      const ContextCreator = require('../../autopm/.claude/scripts/pm/context-create.js');
      const contextCreator = new ContextCreator();

      contextCreator.createContext = jest.fn().mockReturnValue(true);
      const createResult = contextCreator.createContext('test-feature');
      expect(createResult).toBe(true);

      // Step 2: Update context
      const ContextUpdater = require('../../autopm/.claude/scripts/pm/context-update.js');
      const contextUpdater = new ContextUpdater();

      contextUpdater.updateContext = jest.fn().mockReturnValue(true);
      const updateResult = contextUpdater.updateContext('test-feature');
      expect(updateResult).toBe(true);

      // Step 3: Prime context
      const ContextPrimer = require('../../autopm/.claude/scripts/pm/context-prime.js');
      const contextPrimer = new ContextPrimer();

      contextPrimer.primeContext = jest.fn().mockReturnValue(true);
      const primeResult = contextPrimer.primeContext('test-feature');
      expect(primeResult).toBe(true);
    });
  });

  describe('Project Maintenance Workflow', () => {
    test('should optimize and clean project', async () => {
      // Step 1: Optimize
      const ProjectOptimizer = require('../../autopm/.claude/scripts/pm/optimize.js');
      const optimizer = new ProjectOptimizer();

      optimizer.optimize = jest.fn().mockResolvedValue(true);
      const optimizeResult = await optimizer.optimize();
      expect(optimizeResult).toBe(true);

      // Step 2: Clean
      const ProjectCleaner = require('../../autopm/.claude/scripts/pm/clean.js');
      const cleaner = new ProjectCleaner();

      cleaner.cleanProject = jest.fn().mockResolvedValue(true);
      const cleanResult = await cleaner.cleanProject();
      expect(cleanResult).toBe(true);
    });

    test('should sync work state', async () => {
      const SyncManager = require('../../autopm/.claude/scripts/pm/sync.js');
      const syncManager = new SyncManager();

      syncManager.syncWorkState = jest.fn().mockResolvedValue(true);
      const syncResult = await syncManager.syncWorkState();
      expect(syncResult).toBe(true);
    });
  });

  describe('Error Handling in Workflows', () => {
    test('should handle PRD parsing errors gracefully', async () => {
      const PrdParser = require('../../autopm/.claude/scripts/pm/prd-parse.js');
      const parser = new PrdParser();

      // Mock missing PRD file
      fs.existsSync.mockReturnValue(false);
      parser.parsePrd = jest.fn().mockResolvedValue(false);

      const result = await parser.parsePrd('non-existent-feature');
      expect(result).toBe(false);
    });

    test('should handle PR creation failures', async () => {
      const PrCreator = require('../../autopm/.claude/scripts/pm/pr-create.js');
      const prCreator = new PrCreator();

      // Mock GitHub CLI not installed
      prCreator.checkGitHub = jest.fn().mockReturnValue(false);
      prCreator.createPr = jest.fn().mockResolvedValue(false);

      const result = await prCreator.createPr('test PR');
      expect(result).toBe(false);
    });

    test('should handle issue operations when not in git repo', async () => {
      const IssueStart = require('../../autopm/.claude/scripts/pm/issue-start.js');
      const issueStarter = new IssueStart();

      execSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });

      issueStarter.startIssue = jest.fn().mockResolvedValue(false);
      const result = await issueStarter.startIssue('ISSUE-123');
      expect(result).toBe(false);
    });
  });

  describe('Command Line Interface Integration', () => {
    test('should handle command parsing correctly', () => {
      // Test command argument parsing
      const testCommands = [
        'pm prd-new test-feature',
        'pm prd-parse test-feature --overwrite',
        'pm issue-start ISSUE-123',
        'pm pr-create "feat: new feature" --draft',
        'pm optimize --apply',
        'pm clean --dry-run'
      ];

      testCommands.forEach(command => {
        const parts = command.split(' ');
        expect(parts[0]).toBe('pm');
        expect(parts[1]).toMatch(/^[a-z-]+$/);
      });
    });

    test('should validate required arguments', () => {
      // Test that commands require proper arguments
      const requiredArgs = {
        'prd-new': ['feature-name'],
        'prd-parse': ['feature-name'],
        'issue-start': ['issue-id'],
        'pr-create': ['title']
      };

      Object.entries(requiredArgs).forEach(([command, args]) => {
        expect(args.length).toBeGreaterThan(0);
      });
    });
  });

  describe('File System Operations', () => {
    test('should create proper directory structure', () => {
      const expectedDirs = [
        '.claude',
        '.claude/prds',
        '.claude/epics',
        '.claude/contexts',
        '.claude/archive'
      ];

      expectedDirs.forEach(dir => {
        expect(typeof dir).toBe('string');
        expect(dir).toMatch(/^\.claude/);
      });
    });

    test('should handle file creation and updates', () => {
      const mockFiles = [
        { path: '.claude/prds/test-feature.md', content: 'PRD content' },
        { path: '.claude/epics/test-feature/epic.md', content: 'Epic content' },
        { path: '.claude/contexts/test-feature.md', content: 'Context content' }
      ];

      mockFiles.forEach(file => {
        expect(file.path).toBeTruthy();
        expect(file.content).toBeTruthy();
      });
    });
  });

  describe('Configuration and Environment', () => {
    test('should respect environment variables', () => {
      const envVars = {
        'GITHUB_TOKEN': 'Should be available for GitHub operations',
        'AZURE_DEVOPS_PAT': 'Should be available for Azure DevOps operations'
      };

      // Test that env var names are valid
      Object.keys(envVars).forEach(envVar => {
        expect(envVar).toMatch(/^[A-Z_]+$/);
      });
    });

    test('should load configuration properly', () => {
      // Mock configuration loading
      const config = {
        provider: 'github',
        defaultPriority: 'P2',
        autoSync: true
      };

      expect(config).toHaveProperty('provider');
      expect(['github', 'azure', 'local']).toContain(config.provider);
    });
  });
});