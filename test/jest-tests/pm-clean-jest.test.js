/**
 * Simplified tests for pm clean command
 */

const fs = require('fs');
const path = require('path');

// Mock modules
jest.mock('fs');

describe('pm clean', () => {
  let ProjectCleaner;
  let cleaner;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fs
    fs.existsSync = jest.fn().mockReturnValue(false);
    fs.readFileSync = jest.fn().mockReturnValue('{}');
    fs.writeFileSync = jest.fn();
    fs.mkdirSync = jest.fn();
    fs.readdirSync = jest.fn().mockReturnValue([]);
    fs.statSync = jest.fn().mockReturnValue({
      isFile: () => true,
      isDirectory: () => false,
      size: 1000,
      mtime: new Date()
    });
    fs.renameSync = jest.fn();
    fs.unlinkSync = jest.fn();
    fs.rmdirSync = jest.fn();

    // Mock console
    console.log = jest.fn();
    console.error = jest.fn();

    // Load module
    ProjectCleaner = require('../../autopm/.claude/scripts/pm/clean.js');
    cleaner = new ProjectCleaner();
  });

  describe('constructor', () => {
    test('should initialize with correct properties', () => {
      expect(cleaner.claudeDir).toBe('.claude');
      expect(cleaner.archiveDir).toBe(path.join('.claude', 'archive'));
    });
  });

  describe('ensureArchiveDir', () => {
    test('should create archive directories', () => {
      cleaner.ensureArchiveDir();

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('archive'),
        expect.objectContaining({ recursive: true })
      );
    });
  });

  describe('loadCompletedWork', () => {
    test('should load completed work', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        issues: [{ id: 'ISSUE-1' }],
        epics: [{ name: 'epic-1' }]
      }));

      const result = cleaner.loadCompletedWork();

      expect(result.issues).toHaveLength(1);
      expect(result.epics).toHaveLength(1);
    });

    test('should return empty when file missing', () => {
      fs.existsSync.mockReturnValue(false);

      const result = cleaner.loadCompletedWork();

      expect(result.issues).toHaveLength(0);
      expect(result.epics).toHaveLength(0);
    });
  });

  describe('calculateFreedSpace', () => {
    test('should calculate freed space', () => {
      const stats = {
        archivedIssues: 10,
        archivedEpics: 5,
        archivedPrds: 3,
        cleanedLogs: 2
      };

      const result = cleaner.calculateFreedSpace(stats);

      expect(result).toBeGreaterThan(0);
    });
  });

  describe('run', () => {
    test('should handle help flag', async () => {
      process.exit = jest.fn();

      await cleaner.run(['--help']);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    test('should parse dry-run flag', async () => {
      cleaner.cleanProject = jest.fn();

      await cleaner.run(['--dry-run']);

      expect(cleaner.cleanProject).toHaveBeenCalledWith(
        expect.objectContaining({ dryRun: true })
      );
    });
  });
});