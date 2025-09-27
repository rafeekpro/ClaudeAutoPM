/**
 * Tests for pm prd-parse command
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Mock modules
jest.mock('fs');
jest.mock('child_process');

describe('pm prd-parse', () => {
  let PrdParser;
  let parser;
  const mockPrdsDir = path.join('.claude', 'prds');
  const mockEpicsDir = path.join('.claude', 'epics');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Setup default mocks
    fs.existsSync = jest.fn();
    fs.readFileSync = jest.fn();
    fs.writeFileSync = jest.fn();
    fs.mkdirSync = jest.fn();
    fs.readdirSync = jest.fn();

    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();

    // Load module after mocks are set
    PrdParser = require('../../autopm/.claude/scripts/pm/prd-parse.js');
    parser = new PrdParser();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with correct directories', () => {
      expect(parser.prdsDir).toBe(mockPrdsDir);
      expect(parser.epicsDir).toBe(mockEpicsDir);
    });
  });

  describe('parseFrontmatter', () => {
    test('should parse valid frontmatter', () => {
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

    test('should return null for content without frontmatter', () => {
      const content = '# Just markdown content';
      const result = parser.parseFrontmatter(content);
      expect(result).toBeNull();
    });

    test('should handle frontmatter with colons in values', () => {
      const content = `---
name: feature
url: https://example.com:8080
---`;

      const result = parser.parseFrontmatter(content);
      expect(result.url).toBe('https://example.com:8080');
    });
  });

  describe.skip('extractPrdContent', () => {
    test('should extract sections from PRD content', () => {
      const content = `---
name: test
---

## Executive Summary
This is the vision of the project

## Target Users
Developers and teams

## Key Features
- Feature 1
- Feature 2
- Feature 3

## Technical Requirements
Need database and API

## Success Metrics
100% uptime required

## Timeline
Q1 2024`;

      const sections = parser.extractPrdContent(content);

      expect(sections.vision).toContain('vision of the project');
      expect(sections.users).toContain('Developers and teams');
      expect(sections.features).toHaveLength(3);
      expect(sections.features[0]).toBe('Feature 1');
      expect(sections.technical).toContain('database and API');
      expect(sections.metrics).toContain('100% uptime');
      expect(sections.timeline).toContain('Q1 2024');
    });

    test('should handle missing sections', () => {
      const content = `---
name: test
---

## Some Other Section
Content here`;

      const sections = parser.extractPrdContent(content);

      expect(sections.vision).toBe('');
      expect(sections.features).toHaveLength(0);
      expect(sections.requirements).toHaveLength(0);
    });
  });

  describe('generateTechnicalApproach', () => {
    test('should analyze features and generate technical approach', () => {
      const prdSections = {
        features: [
          'User interface for dashboard',
          'API for data processing',
          'Database storage for user data',
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

      expect(approach.frontend).toContainEqual(expect.stringContaining('User interface'));
      expect(approach.backend).toContainEqual(expect.stringContaining('API'));
      expect(approach.data).toContainEqual(expect.stringContaining('Database storage'));
      expect(approach.security).toContainEqual(expect.stringContaining('Authentication'));
    });

    test('should provide defaults when no specific features detected', () => {
      const prdSections = {
        features: ['Generic feature'],
        vision: '',
        problem: '',
        users: '',
        requirements: [],
        metrics: '',
        technical: '',
        timeline: ''
      };

      const approach = parser.generateTechnicalApproach(prdSections);

      expect(approach.frontend).toContainEqual('User interface components');
      expect(approach.backend).toContainEqual('API endpoints and business logic');
      expect(approach.data).toContainEqual('Data persistence layer');
    });
  });

  describe('generateTasks', () => {
    test('should generate tasks based on technical approach', () => {
      const prdSections = {
        features: ['UI component'],
        vision: '',
        problem: '',
        users: '',
        requirements: [],
        metrics: '',
        technical: '',
        timeline: ''
      };

      const technicalApproach = {
        frontend: ['Component for UI'],
        backend: ['Service for processing'],
        data: ['Database models'],
        infrastructure: [],
        security: []
      };

      const tasks = parser.generateTasks(prdSections, technicalApproach);

      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks[0].id).toBe('TASK-1');
      expect(tasks[0].title).toContain('setup');

      const frontendTask = tasks.find(t => t.type === 'frontend');
      expect(frontendTask).toBeDefined();
      expect(frontendTask.title).toContain('UI');

      const backendTask = tasks.find(t => t.type === 'backend');
      expect(backendTask).toBeDefined();

      const testingTask = tasks.find(t => t.type === 'testing');
      expect(testingTask).toBeDefined();
    });

    test('should always include setup and deployment tasks', () => {
      const prdSections = {
        features: [],
        vision: '',
        problem: '',
        users: '',
        requirements: [],
        metrics: '',
        technical: '',
        timeline: ''
      };

      const technicalApproach = {
        frontend: [],
        backend: [],
        data: [],
        infrastructure: [],
        security: []
      };

      const tasks = parser.generateTasks(prdSections, technicalApproach);

      const setupTask = tasks.find(t => t.type === 'setup');
      const deploymentTask = tasks.find(t => t.type === 'deployment');

      expect(setupTask).toBeDefined();
      expect(deploymentTask).toBeDefined();
    });
  });

  describe('calculateTotalEffort', () => {
    test('should calculate total effort correctly', () => {
      const tasks = [
        { id: 'T1', title: 'Task 1', effort: '2h', type: 'setup' },
        { id: 'T2', title: 'Task 2', effort: '1d', type: 'backend' },
        { id: 'T3', title: 'Task 3', effort: '2d', type: 'frontend' }
      ];

      const total = parser.calculateTotalEffort(tasks);
      expect(total).toBe('3d 2h');
    });

    test('should handle weeks in effort', () => {
      const tasks = [
        { id: 'T1', title: 'Task 1', effort: '1w', type: 'setup' },
        { id: 'T2', title: 'Task 2', effort: '2d', type: 'backend' }
      ];

      const total = parser.calculateTotalEffort(tasks);
      expect(total).toBe('1w 2d');
    });
  });

  describe('parseEffort', () => {
    test('should parse hours correctly', () => {
      expect(parser.parseEffort('4h')).toBe(4);
      expect(parser.parseEffort('10h')).toBe(10);
    });

    test('should parse days correctly', () => {
      expect(parser.parseEffort('1d')).toBe(8);
      expect(parser.parseEffort('3d')).toBe(24);
    });

    test('should parse weeks correctly', () => {
      expect(parser.parseEffort('1w')).toBe(40);
      expect(parser.parseEffort('2w')).toBe(80);
    });

    test('should default to 1 day for unknown format', () => {
      expect(parser.parseEffort('unknown')).toBe(8);
      expect(parser.parseEffort('')).toBe(8);
    });
  });

  describe('formatEffort', () => {
    test('should format hours', () => {
      expect(parser.formatEffort(4)).toBe('4h');
      expect(parser.formatEffort(7)).toBe('7h');
    });

    test('should format days', () => {
      expect(parser.formatEffort(8)).toBe('1d');
      expect(parser.formatEffort(16)).toBe('2d');
      expect(parser.formatEffort(12)).toBe('1d 4h');
    });

    test('should format weeks', () => {
      expect(parser.formatEffort(40)).toBe('1w 0d');
      expect(parser.formatEffort(48)).toBe('1w 1d');
      expect(parser.formatEffort(80)).toBe('2w 0d');
    });
  });

  describe.skip('parsePrd', () => {
    test('should successfully parse PRD and create epic', async () => {
      const mockPrdContent = `---
name: test-feature
priority: P1
description: Test feature
---

## Executive Summary
Vision statement

## Key Features
- Feature 1
- Feature 2`;

      fs.existsSync.mockImplementation((path) => {
        if (path.includes('test-feature.md')) return true;
        if (path.includes('epic.md')) return false;
        return false;
      });

      fs.readFileSync.mockReturnValue(mockPrdContent);

      const result = await parser.parsePrd('test-feature');

      expect(result).toBe(true);
      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();

      const epicContent = fs.writeFileSync.mock.calls[0][1];
      expect(epicContent).toContain('Epic: test-feature');
      expect(epicContent).toContain('Vision statement');
      expect(epicContent).toContain('TASK-1');
    });

    test('should fail when PRD does not exist', async () => {
      fs.existsSync.mockReturnValue(false);

      const result = await parser.parsePrd('non-existent');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('PRD not found'));
    });

    test('should fail when epic already exists without overwrite', async () => {
      fs.existsSync.mockReturnValue(true);

      const result = await parser.parsePrd('existing-feature');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('already exists'));
    });

    test('should overwrite existing epic with overwrite option', async () => {
      const mockPrdContent = `---
name: test-feature
priority: P1
---

## Content`;

      fs.existsSync.mockImplementation((path) => {
        return true; // Everything exists
      });

      fs.readFileSync.mockReturnValue(mockPrdContent);

      const result = await parser.parsePrd('test-feature', { overwrite: true });

      expect(result).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test('should handle PRD without frontmatter', async () => {
      const mockPrdContent = '# Just content without frontmatter';

      fs.existsSync.mockImplementation((path) => {
        if (path.includes('.md')) return true;
        return false;
      });

      fs.readFileSync.mockReturnValue(mockPrdContent);

      const result = await parser.parsePrd('test-feature');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('❌ Invalid PRD frontmatter');
    });
  });

  describe('generateEpicContent', () => {
    test('should generate complete epic content', () => {
      const frontmatter = {
        priority: 'P1',
        description: 'Test description'
      };

      const prdSections = {
        vision: 'Product vision',
        features: ['Feature 1'],
        metrics: 'Success metrics',
        problem: '',
        users: '',
        requirements: [],
        technical: '',
        timeline: ''
      };

      const technicalApproach = {
        frontend: ['UI Component'],
        backend: ['API Service'],
        data: ['Database'],
        security: ['Auth system'],
        infrastructure: []
      };

      const tasks = [
        { id: 'TASK-1', title: 'Setup', type: 'setup', effort: '2h' }
      ];

      const content = parser.generateEpicContent(
        'test-feature',
        frontmatter,
        prdSections,
        technicalApproach,
        tasks
      );

      expect(content).toContain('name: test-feature');
      expect(content).toContain('priority: P1');
      expect(content).toContain('Product vision');
      expect(content).toContain('UI Component');
      expect(content).toContain('API Service');
      expect(content).toContain('Auth system');
      expect(content).toContain('TASK-1: Setup');
      expect(content).toContain('Success metrics');
    });
  });

  describe.skip('run', () => {
    test('should handle missing feature name', async () => {
      process.exit = jest.fn();
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(['feature1.md', 'feature2.md']);

      await parser.run([]);

      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Feature name required'));
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    test('should parse with overwrite flag', async () => {
      process.exit = jest.fn();
      parser.parsePrd = jest.fn().mockResolvedValue(true);

      await parser.run(['test-feature', '--overwrite']);

      expect(parser.parsePrd).toHaveBeenCalledWith('test-feature', { overwrite: true });
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    test('should list available PRDs when no name provided', async () => {
      process.exit = jest.fn();
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(['prd1.md', 'prd2.md', 'readme.txt']);

      await parser.run([]);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Available PRDs:'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('prd1'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('prd2'));
    });
  });
});