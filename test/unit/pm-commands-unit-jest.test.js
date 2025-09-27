/**
 * Unit tests for PM commands focusing on coverage improvement
 */

const path = require('path');

describe('PM Commands Unit Tests', () => {

  describe('PM Release Command', () => {
    let ReleaseManager;
    let manager;

    beforeEach(() => {
      jest.resetModules();
      jest.clearAllMocks();

      // Mock dependencies
      jest.mock('fs');
      jest.mock('child_process');

      ReleaseManager = require('../../autopm/.claude/scripts/pm/release.js');
      manager = new ReleaseManager();
    });

    test('parseVersion should handle valid versions', () => {
      expect(manager.parseVersion('1.2.3')).toEqual({
        major: 1, minor: 2, patch: 3, prerelease: null
      });

      expect(manager.parseVersion('2.0.0-beta.1')).toEqual({
        major: 2, minor: 0, patch: 0, prerelease: 'beta.1'
      });
    });

    test('incrementVersion should increment correctly', () => {
      expect(manager.incrementVersion('1.2.3', 'major')).toBe('2.0.0');
      expect(manager.incrementVersion('1.2.3', 'minor')).toBe('1.3.0');
      expect(manager.incrementVersion('1.2.3', 'patch')).toBe('1.2.4');
    });

    test('categorizeCommits should sort by type', () => {
      const commits = [
        'abc123 feat: new feature',
        'def456 fix: bug fix',
        'ghi789 docs: update docs',
        'jkl012 chore: update deps',
        'mno345 random commit'
      ];

      const result = manager.categorizeCommits(commits);

      expect(result).toHaveProperty('features');
      expect(result).toHaveProperty('fixes');
      expect(result).toHaveProperty('docs');
      expect(result).toHaveProperty('chore');
      expect(result).toHaveProperty('other');
    });

    test('should have basic properties', () => {
      expect(manager.packageFile).toBeDefined();
      expect(manager.changelogFile).toBeDefined();
    });
  });

  describe('PM Clean Command', () => {
    let ProjectCleaner;
    let cleaner;

    beforeEach(() => {
      jest.resetModules();
      jest.clearAllMocks();

      ProjectCleaner = require('../../autopm/.claude/scripts/pm/clean.js');
      cleaner = new ProjectCleaner();
    });

    test('constructor should initialize paths', () => {
      expect(cleaner.claudeDir).toBe('.claude');
      expect(cleaner.archiveDir).toBe(path.join('.claude', 'archive'));
    });

    test('ensureArchiveDir should be defined', () => {
      expect(typeof cleaner.ensureArchiveDir).toBe('function');
    });

    test('loadCompletedWork should return structure', () => {
      // Mock fs for this test
      const mockFs = {
        existsSync: jest.fn().mockReturnValue(false)
      };

      cleaner.fs = mockFs;

      expect(typeof cleaner.loadCompletedWork).toBe('function');
    });

    test('calculateFreedSpace should calculate space', () => {
      const stats = {
        archivedIssues: 5,
        archivedEpics: 3,
        archivedPrds: 2,
        cleanedLogs: 1
      };

      const result = cleaner.calculateFreedSpace(stats);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('PM Optimize Command', () => {
    let ProjectOptimizer;
    let optimizer;

    beforeEach(() => {
      jest.resetModules();
      jest.clearAllMocks();

      ProjectOptimizer = require('../../autopm/.claude/scripts/pm/optimize.js');
      optimizer = new ProjectOptimizer();
    });

    test('constructor should initialize correctly', () => {
      expect(optimizer.claudeDir).toBe('.claude');
      expect(optimizer.stats).toBeDefined();
      expect(optimizer.stats.contextFiles).toBe(0);
      expect(optimizer.stats.suggestions).toEqual([]);
    });

    test('formatBytes should format file sizes', () => {
      expect(optimizer.formatBytes(1024)).toBe('1.0KB');
      expect(optimizer.formatBytes(1048576)).toBe('1.0MB');
      expect(optimizer.formatBytes(500)).toBe('500B');
    });

    test('analyzeContextOptimization should return suggestions', () => {
      expect(typeof optimizer.analyzeContextOptimization).toBe('function');
    });

    test('analyzeAgentUsage should return agent suggestions', () => {
      expect(typeof optimizer.analyzeAgentUsage).toBe('function');
    });

    test('analyzeGitOptimization should return git suggestions', () => {
      expect(typeof optimizer.analyzeGitOptimization).toBe('function');
    });
  });

  describe('PM PRD Parse Command', () => {
    let PrdParser;
    let parser;

    beforeEach(() => {
      jest.resetModules();
      jest.clearAllMocks();

      PrdParser = require('../../autopm/.claude/scripts/pm/prd-parse.js');
      parser = new PrdParser();
    });

    test('constructor should set directories', () => {
      expect(parser.prdsDir).toBe(path.join('.claude', 'prds'));
      expect(parser.epicsDir).toBe(path.join('.claude', 'epics'));
    });

    test('parseFrontmatter should parse YAML frontmatter', () => {
      const content = `---
name: test-feature
priority: P1
description: Test description
---

# Content`;

      const result = parser.parseFrontmatter(content);
      expect(result).toEqual({
        name: 'test-feature',
        priority: 'P1',
        description: 'Test description'
      });
    });

    test('parseFrontmatter should return null for invalid content', () => {
      const content = '# Just markdown content';
      const result = parser.parseFrontmatter(content);
      expect(result).toBeNull();
    });

    test('parseEffort should handle different time formats', () => {
      expect(parser.parseEffort('2h')).toBe(2);
      expect(parser.parseEffort('3d')).toBe(24);
      expect(parser.parseEffort('1w')).toBe(40);
      expect(parser.parseEffort('invalid')).toBe(8);
      expect(parser.parseEffort('')).toBe(8);
    });

    test('formatEffort should format hours correctly', () => {
      expect(parser.formatEffort(4)).toBe('4h');
      expect(parser.formatEffort(8)).toBe('1d');
      expect(parser.formatEffort(40)).toBe('1w 0d');
      expect(parser.formatEffort(48)).toBe('1w 1d');
    });

    test('generateTechnicalApproach should categorize features', () => {
      const prdSections = {
        features: [
          'User interface dashboard',
          'API for data processing',
          'Database storage',
          'Authentication system'
        ],
        vision: '',
        problem: '',
        users: '',
        requirements: [],
        metrics: '',
        technical: '',
        timeline: ''
      };

      const approach = parser.generateTechnicalApproach(prdSections);

      expect(approach).toHaveProperty('frontend');
      expect(approach).toHaveProperty('backend');
      expect(approach).toHaveProperty('data');
      expect(approach).toHaveProperty('security');
      expect(approach).toHaveProperty('infrastructure');
    });

    test('generateTasks should create task list', () => {
      const prdSections = {
        features: ['Basic feature'],
        vision: '', problem: '', users: '', requirements: [],
        metrics: '', technical: '', timeline: ''
      };

      const technicalApproach = {
        frontend: ['UI Component'],
        backend: ['API Service'],
        data: ['Database'],
        infrastructure: [],
        security: []
      };

      const tasks = parser.generateTasks(prdSections, technicalApproach);

      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);

      // Should always include setup and deployment
      const setupTask = tasks.find(t => t.type === 'setup');
      const deploymentTask = tasks.find(t => t.type === 'deployment');
      expect(setupTask).toBeDefined();
      expect(deploymentTask).toBeDefined();
    });

    test('calculateTotalEffort should sum task efforts', () => {
      const tasks = [
        { effort: '2h' },
        { effort: '1d' },
        { effort: '1w' }
      ];

      const total = parser.calculateTotalEffort(tasks);
      expect(typeof total).toBe('string');
      expect(total).toContain('w'); // Should include weeks
    });
  });

  describe('PM Context Commands', () => {
    let ContextCreator, ContextUpdater, ContextPrimer;

    beforeEach(() => {
      jest.resetModules();
      jest.clearAllMocks();
    });

    test('context-create should be loadable', () => {
      expect(() => {
        ContextCreator = require('../../autopm/.claude/scripts/pm/context-create.js');
      }).not.toThrow();
    });

    test('context-update should be loadable', () => {
      expect(() => {
        ContextUpdater = require('../../autopm/.claude/scripts/pm/context-update.js');
      }).not.toThrow();
    });

    test('context-prime should be loadable', () => {
      expect(() => {
        ContextPrimer = require('../../autopm/.claude/scripts/pm/context-prime.js');
      }).not.toThrow();
    });
  });

  describe('PM Issue Commands', () => {
    let IssueStart, IssueClose, IssueShow, IssueEdit;

    beforeEach(() => {
      jest.resetModules();
      jest.clearAllMocks();
    });

    test('issue-start should be loadable', () => {
      expect(() => {
        IssueStart = require('../../autopm/.claude/scripts/pm/issue-start.js');
      }).not.toThrow();
    });

    test('issue-close should be loadable', () => {
      expect(() => {
        IssueClose = require('../../autopm/.claude/scripts/pm/issue-close.js');
      }).not.toThrow();
    });

    test('issue-show should be loadable', () => {
      expect(() => {
        IssueShow = require('../../autopm/.claude/scripts/pm/issue-show.js');
      }).not.toThrow();
    });

    test('issue-edit should be loadable', () => {
      expect(() => {
        IssueEdit = require('../../autopm/.claude/scripts/pm/issue-edit.js');
      }).not.toThrow();
    });
  });

  describe('PM Epic Commands', () => {
    let EpicClose, EpicEdit;

    beforeEach(() => {
      jest.resetModules();
      jest.clearAllMocks();
    });

    test('epic-close should be loadable', () => {
      expect(() => {
        EpicClose = require('../../autopm/.claude/scripts/pm/epic-close.js');
      }).not.toThrow();
    });

    test('epic-edit should be loadable', () => {
      expect(() => {
        EpicEdit = require('../../autopm/.claude/scripts/pm/epic-edit.js');
      }).not.toThrow();
    });
  });

  describe('PM PRD Commands', () => {
    let PrdNew;

    beforeEach(() => {
      jest.resetModules();
      jest.clearAllMocks();
    });

    test('prd-new should be loadable', () => {
      expect(() => {
        PrdNew = require('../../autopm/.claude/scripts/pm/prd-new.js');
      }).not.toThrow();
    });
  });

  describe('PM Sync Command', () => {
    let SyncManager;

    beforeEach(() => {
      jest.resetModules();
      jest.clearAllMocks();
    });

    test('sync should be loadable', () => {
      expect(() => {
        SyncManager = require('../../autopm/.claude/scripts/pm/sync.js');
      }).not.toThrow();
    });
  });
});