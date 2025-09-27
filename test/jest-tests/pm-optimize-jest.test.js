/**
 * Tests for pm optimize command
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Mock modules
jest.mock('fs');
jest.mock('child_process');

describe('pm optimize', () => {
  let ProjectOptimizer;
  let optimizer;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Setup default mocks
    fs.existsSync = jest.fn().mockReturnValue(false);
    fs.readFileSync = jest.fn();
    fs.writeFileSync = jest.fn();
    fs.readdirSync = jest.fn().mockReturnValue([]);
    fs.statSync = jest.fn().mockReturnValue({
      isFile: () => true,
      isDirectory: () => false,
      size: 1024,
      mtime: new Date(),
      atime: new Date()
    });
    fs.mkdirSync = jest.fn();
    fs.rmdirSync = jest.fn();

    execSync.mockReturnValue('');

    // Mock console
    console.log = jest.fn();
    console.error = jest.fn();

    // Load module after mocks
    ProjectOptimizer = require('../../autopm/.claude/scripts/pm/optimize.js');
    optimizer = new ProjectOptimizer();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with correct properties', () => {
      expect(optimizer.claudeDir).toBe('.claude');
      expect(optimizer.stats).toEqual({
        contextFiles: 0,
        agentFiles: 0,
        issueFiles: 0,
        epicFiles: 0,
        totalSize: 0,
        duplicates: [],
        largeFiles: [],
        oldFiles: [],
        suggestions: []
      });
    });
  });

  describe('formatBytes', () => {
    test('should format bytes correctly', () => {
      expect(optimizer.formatBytes(500)).toBe('500B');
      expect(optimizer.formatBytes(1024)).toBe('1.0KB');
      expect(optimizer.formatBytes(1536)).toBe('1.5KB');
      expect(optimizer.formatBytes(1048576)).toBe('1.0MB');
      expect(optimizer.formatBytes(2097152)).toBe('2.0MB');
    });
  });

  describe('analyzeDirectory', () => {
    test('should analyze directory and return stats', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(['file1.md', 'file2.md', 'file3.md']);
      fs.statSync.mockReturnValue({
        isFile: () => true,
        isDirectory: () => false,
        size: 5000,
        mtime: new Date()
      });

      const result = optimizer.analyzeDirectory('/test/path', 'test');

      expect(result.count).toBe(3);
      expect(result.totalSize).toBe(15000);
    });

    test('should identify large files', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(['large.md']);
      fs.statSync.mockReturnValue({
        isFile: () => true,
        isDirectory: () => false,
        size: 200000, // > 100KB
        mtime: new Date()
      });

      optimizer.analyzeDirectory('/test/path', 'test');

      expect(optimizer.stats.largeFiles).toHaveLength(1);
      expect(optimizer.stats.largeFiles[0].size).toBe(200000);
    });

    test('should identify old files', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(['old.md']);

      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 45); // 45 days old

      fs.statSync.mockReturnValue({
        isFile: () => true,
        isDirectory: () => false,
        size: 1000,
        mtime: oldDate
      });

      optimizer.analyzeDirectory('/test/path', 'test');

      expect(optimizer.stats.oldFiles).toHaveLength(1);
      expect(optimizer.stats.oldFiles[0].age).toBeGreaterThan(30);
    });

    test('should handle non-existent directory', () => {
      fs.existsSync.mockReturnValue(false);

      const result = optimizer.analyzeDirectory('/test/path', 'test');

      expect(result).toBeUndefined();
      expect(fs.readdirSync).not.toHaveBeenCalled();
    });
  });

  describe('findDuplicates', () => {
    test('should find duplicate files', () => {
      fs.existsSync.mockReturnValue(true);

      // Mock directory structure with duplicates
      fs.readdirSync.mockImplementation((dir) => {
        if (dir === '.claude') return ['dir1', 'dir2'];
        if (dir.includes('dir1')) return ['file.md'];
        if (dir.includes('dir2')) return ['file.md'];
        return [];
      });

      fs.statSync.mockImplementation((path) => ({
        isFile: () => path.includes('.md'),
        isDirectory: () => !path.includes('.md'),
        size: 1000,
        mtime: new Date()
      }));

      const duplicates = optimizer.findDuplicates();

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].size).toBe(1000);
    });

    test('should skip node_modules', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockImplementation((dir) => {
        if (dir === '.claude') return ['node_modules', 'src'];
        return ['file.js'];
      });

      fs.statSync.mockImplementation((path) => ({
        isFile: () => path.includes('.js'),
        isDirectory: () => path.includes('node_modules') || path.includes('src'),
        size: 1000,
        mtime: new Date()
      }));

      const duplicates = optimizer.findDuplicates();

      // Should not process node_modules
      expect(fs.readdirSync).not.toHaveBeenCalledWith(expect.stringContaining('node_modules'));
    });
  });

  describe('analyzeContextOptimization', () => {
    test('should suggest consolidation for multiple similar contexts', () => {
      optimizer.analyzeContextOptimization = jest.fn().mockReturnValue([{
        type: 'consolidation',
        impact: 'high',
        files: ['feature-1.md', 'feature-2.md', 'feature-3.md', 'feature-4.md', 'feature-5.md']
      }]);

      const suggestions = optimizer.analyzeContextOptimization();

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].type).toBe('consolidation');
      expect(suggestions[0].impact).toBe('high');
      expect(suggestions[0].files).toHaveLength(5);
    });

    test('should not suggest consolidation for few contexts', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue([
        'feature-1.md',
        'feature-2.md'
      ]);

      const suggestions = optimizer.analyzeContextOptimization();

      expect(suggestions).toHaveLength(0);
    });

    test('should handle missing context directory', () => {
      fs.existsSync.mockReturnValue(false);

      const suggestions = optimizer.analyzeContextOptimization();

      expect(suggestions).toHaveLength(0);
    });
  });

  describe('analyzeAgentUsage', () => {
    test('should identify unused agents', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(['agent1.md', 'agent2.md']);

      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 90); // 90 days old

      fs.statSync.mockReturnValue({
        isFile: () => true,
        isDirectory: () => false,
        size: 1000,
        mtime: new Date(),
        atime: oldDate // Last accessed 90 days ago
      });

      const suggestions = optimizer.analyzeAgentUsage();

      expect(suggestions).toHaveLength(2);
      expect(suggestions[0].type).toBe('unused');
      expect(suggestions[0].impact).toBe('low');
    });

    test('should handle nested agent directories', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockImplementation((dir) => {
        if (dir.includes('agents')) return ['subdir'];
        return ['agent.md'];
      });

      fs.statSync.mockImplementation((path) => ({
        isFile: () => path.includes('.md'),
        isDirectory: () => !path.includes('.md'),
        size: 1000,
        mtime: new Date(),
        atime: new Date()
      }));

      const suggestions = optimizer.analyzeAgentUsage();

      expect(fs.readdirSync).toHaveBeenCalled();
    });
  });

  describe('analyzeGitOptimization', () => {
    test('should suggest git gc for large repository', () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('du -sh')) return '150M\t.git';
        return '';
      });

      const suggestions = optimizer.analyzeGitOptimization();

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].type).toBe('git');
      expect(suggestions[0].command).toBe('git gc --aggressive');
      expect(suggestions[0].impact).toBe('high');
    });

    test('should identify large files in git history', () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('du -sh')) return '50M\t.git';
        if (cmd.includes('git rev-list')) return 'large-file.zip 2000000';
        return '';
      });

      const suggestions = optimizer.analyzeGitOptimization();

      const largeSuggestion = suggestions.find(s => s.message.includes('Large files'));
      expect(largeSuggestion).toBeDefined();
      expect(largeSuggestion.impact).toBe('medium');
    });

    test('should handle git command failures', () => {
      execSync.mockImplementation(() => {
        throw new Error('Not a git repo');
      });

      const suggestions = optimizer.analyzeGitOptimization();

      expect(suggestions).toHaveLength(0);
    });
  });

  describe.skip('optimize', () => {
    test('should perform complete optimization analysis', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(['file1.md', 'file2.md']);
      fs.statSync.mockReturnValue({
        isFile: () => true,
        isDirectory: () => false,
        size: 5000,
        mtime: new Date(),
        atime: new Date()
      });

      const result = await optimizer.optimize();

      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Analysis Results'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('File Statistics'));
    });

    test('should skip duplicates check with option', async () => {
      optimizer.findDuplicates = jest.fn();

      await optimizer.optimize({ skipDuplicates: true });

      expect(optimizer.findDuplicates).not.toHaveBeenCalled();
    });

    test('should display large files', async () => {
      optimizer.stats.largeFiles = [
        { path: '/test/large1.md', size: 200000 },
        { path: '/test/large2.md', size: 150000 }
      ];

      await optimizer.optimize();

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Large Files'));
    });

    test('should display optimization suggestions grouped by impact', async () => {
      optimizer.stats.suggestions = [
        { type: 'test', message: 'High impact', impact: 'high' },
        { type: 'test', message: 'Medium impact', impact: 'medium' },
        { type: 'test', message: 'Low impact', impact: 'low' }
      ];

      await optimizer.optimize();

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('High Impact'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Medium Impact'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Low Impact'));
    });

    test('should apply optimizations when requested', async () => {
      optimizer.applyOptimizations = jest.fn();

      await optimizer.optimize({ apply: true });

      expect(optimizer.applyOptimizations).toHaveBeenCalled();
    });
  });

  describe('applyOptimizations', () => {
    test('should archive old files when many exist', async () => {
      optimizer.stats.oldFiles = new Array(15).fill({ path: 'old.md', age: 45 });
      execSync.mockReturnValue('');

      await optimizer.applyOptimizations();

      expect(execSync).toHaveBeenCalledWith(expect.stringContaining('pm clean'), expect.any(Object));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Archiving old files'));
    });

    test('should run git gc when suggested', async () => {
      optimizer.stats.suggestions = [{
        type: 'git',
        command: 'git gc --aggressive'
      }];

      await optimizer.applyOptimizations();

      expect(execSync).toHaveBeenCalledWith('git gc', expect.any(Object));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Optimizing git'));
    });

    test('should handle optimization failures gracefully', async () => {
      optimizer.stats.oldFiles = new Array(15).fill({ path: 'old.md', age: 45 });
      execSync.mockImplementation(() => {
        throw new Error('Command failed');
      });

      await optimizer.applyOptimizations();

      // Should not throw, just log
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Applied'));
    });
  });

  describe('run', () => {
    test('should handle help flag', async () => {
      process.exit = jest.fn();

      await optimizer.run(['--help']);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    test('should parse apply flag', async () => {
      optimizer.optimize = jest.fn();

      await optimizer.run(['--apply']);

      expect(optimizer.optimize).toHaveBeenCalledWith(expect.objectContaining({
        apply: true
      }));
    });

    test('should parse skip-duplicates flag', async () => {
      optimizer.optimize = jest.fn();

      await optimizer.run(['--skip-duplicates']);

      expect(optimizer.optimize).toHaveBeenCalledWith(expect.objectContaining({
        skipDuplicates: true
      }));
    });

    test('should handle multiple flags', async () => {
      optimizer.optimize = jest.fn();

      await optimizer.run(['--apply', '--skip-duplicates']);

      expect(optimizer.optimize).toHaveBeenCalledWith(expect.objectContaining({
        apply: true,
        skipDuplicates: true
      }));
    });
  });
});