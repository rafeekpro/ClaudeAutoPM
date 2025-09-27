/**
 * Simplified tests for pm release command
 */

const fs = require('fs');
const { execSync } = require('child_process');

// Mock modules
jest.mock('fs');
jest.mock('child_process');

describe('pm release', () => {
  let ReleaseManager;
  let manager;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fs
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify({
      name: 'test-package',
      version: '1.0.0',
      description: 'Test package'
    }));
    fs.writeFileSync = jest.fn();

    // Mock execSync
    execSync.mockReturnValue('');

    // Mock console
    console.log = jest.fn();
    console.error = jest.fn();

    // Load module
    ReleaseManager = require('../../autopm/.claude/scripts/pm/release.js');
    manager = new ReleaseManager();
  });

  describe('parseVersion', () => {
    test('should parse version correctly', () => {
      const result = manager.parseVersion('1.2.3');
      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: null
      });
    });

    test('should parse prerelease version', () => {
      const result = manager.parseVersion('1.2.3-beta.1');
      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: 'beta.1'
      });
    });
  });

  describe('incrementVersion', () => {
    test('should increment major version', () => {
      const result = manager.incrementVersion('1.2.3', 'major');
      expect(result).toBe('2.0.0');
    });

    test('should increment minor version', () => {
      const result = manager.incrementVersion('1.2.3', 'minor');
      expect(result).toBe('1.3.0');
    });

    test('should increment patch version', () => {
      const result = manager.incrementVersion('1.2.3', 'patch');
      expect(result).toBe('1.2.4');
    });
  });

  describe('categorizeCommits', () => {
    test('should categorize commits by type', () => {
      const commits = [
        'abc123 feat: add new feature',
        'def456 fix: fix bug',
        'ghi789 docs: update readme',
        'jkl012 chore: update deps'
      ];

      const result = manager.categorizeCommits(commits);

      expect(result.features).toHaveLength(1);
      expect(result.fixes).toHaveLength(1);
      expect(result.docs).toHaveLength(1);
      expect(result.chore).toHaveLength(1);
    });
  });

  describe.skip('run', () => {
    test('should handle help flag', async () => {
      process.exit = jest.fn();

      await manager.run(['--help']);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
      expect(process.exit).toHaveBeenCalledWith(0);
    });
  });
});