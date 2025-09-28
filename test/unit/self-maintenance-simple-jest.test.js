/**
 * Simplified unit tests for SelfMaintenance - Jest version
 * Migrated from Node.js test to Jest
 */

const path = require('path');
const fs = require('fs');

// Mock fs module
jest.mock('fs');
jest.mock('child_process');

// Import the class after mocking
const { execSync, spawnSync } = require('child_process');
const SelfMaintenance = require('../../scripts/self-maintenance.js');

describe('SelfMaintenance - Simple Jest Tests', () => {
  let maintenance;
  let consoleLogSpy;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock console
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    // Default fs mocks
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue([]);
    fs.statSync.mockReturnValue({ isDirectory: () => false });
    fs.readFileSync.mockReturnValue('{"version": "1.0.0"}');
    fs.writeFileSync.mockImplementation(() => {});

    // Mock child_process
    execSync.mockReturnValue(Buffer.from(''));
    spawnSync.mockReturnValue({ status: 0, stdout: '', stderr: '' });

    // Create instance
    maintenance = new SelfMaintenance();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('Constructor', () => {
    test('should initialize with default values', () => {
      expect(maintenance.projectRoot).toBeDefined();
      expect(maintenance.agentsDir).toBeDefined();
      expect(maintenance.DEFAULT_INSTALL_OPTION).toBe('3');
    });

    test('should initialize metrics', () => {
      expect(typeof maintenance.metrics.totalAgents).toBe('number');
      expect(typeof maintenance.metrics.activeAgents).toBe('number');
      expect(typeof maintenance.metrics.deprecatedAgents).toBe('number');
      expect(typeof maintenance.metrics.consolidatedAgents).toBe('number');
    });

    test('should have scenario mapping', () => {
      expect(maintenance.SCENARIO_MAP).toBeDefined();
      expect(maintenance.SCENARIO_MAP.minimal).toBe('1');
      expect(maintenance.SCENARIO_MAP.docker).toBe('2');
      expect(maintenance.SCENARIO_MAP.full).toBe('3');
      expect(maintenance.SCENARIO_MAP.performance).toBe('4');
    });
  });

  describe('countFiles() method', () => {
    test('should count files with specific extension', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(['file1.md', 'file2.md', 'file3.txt']);
      fs.statSync.mockImplementation(filePath => ({
        isDirectory: () => false,
        isFile: () => true
      }));

      const count = maintenance.countFiles('/test/dir', '.md');
      expect(count).toBe(2);
    });

    test('should handle directories recursively', () => {
      fs.existsSync.mockReturnValue(true);
      let callCount = 0;
      fs.readdirSync.mockImplementation(dir => {
        callCount++;
        if (callCount > 2) return []; // Prevent infinite recursion
        if (dir.includes('subdir')) {
          return ['nested.md'];
        }
        return ['file.md', 'subdir'];
      });
      fs.statSync.mockImplementation(filePath => ({
        isDirectory: () => filePath.endsWith('subdir'),
        isFile: () => filePath.endsWith('.md')
      }));

      const count = maintenance.countFiles('/test/dir', '.md');
      expect(count).toBe(2); // file.md + nested.md
    });

    test('should return 0 for non-existent directory', () => {
      fs.existsSync.mockReturnValue(false);

      const count = maintenance.countFiles('/non/existent', '.md');
      expect(count).toBe(0);
    });
  });

  describe('countInFiles() method', () => {
    test('should count pattern occurrences in files', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(['file1.md', 'file2.md']);
      fs.statSync.mockReturnValue({ isDirectory: () => false, isFile: () => true });
      fs.readFileSync.mockReturnValue('test pattern test pattern test');

      const count = maintenance.countInFiles('/test/dir', /test/g);
      expect(count).toBe(6); // 3 matches per file * 2 files
    });

    test('should handle files without matches', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(['file1.md']);
      fs.statSync.mockReturnValue({ isDirectory: () => false, isFile: () => true });
      fs.readFileSync.mockReturnValue('no matches here');

      const count = maintenance.countInFiles('/test/dir', /test/g);
      expect(count).toBe(0);
    });
  });

  describe.skip('detectDuplicates() method', () => {
    test('should detect duplicate agents', () => {
      const registryContent = `
# Agent Registry

## agent-one
Path: /path/to/agent-one.md

## agent-two
Path: /path/to/agent-two.md

## agent-one
Path: /path/to/duplicate-agent-one.md
      `;

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(registryContent);

      const duplicates = maintenance.detectDuplicates();
      expect(duplicates).toContain('agent-one');
      expect(duplicates).not.toContain('agent-two');
    });

    test('should return empty array when no duplicates', () => {
      const registryContent = `
## agent-one
## agent-two
## agent-three
      `;

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(registryContent);

      const duplicates = maintenance.detectDuplicates();
      expect(duplicates).toEqual([]);
    });
  });

  describe('Scenario validation', () => {
    test('should validate known scenarios', () => {
      expect(maintenance.SCENARIO_MAP['minimal']).toBe('1');
      expect(maintenance.SCENARIO_MAP['docker']).toBe('2');
      expect(maintenance.SCENARIO_MAP['full']).toBe('3');
      expect(maintenance.SCENARIO_MAP['performance']).toBe('4');
      // custom scenario was removed in newer versions
      // expect(maintenance.SCENARIO_MAP['custom']).toBe('5');
    });

    test('should handle invalid scenario', () => {
      const scenario = maintenance.SCENARIO_MAP['invalid'];
      expect(scenario).toBeUndefined();
    });
  });
});