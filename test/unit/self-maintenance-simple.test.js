/**
 * Simplified unit tests for SelfMaintenance
 * Focuses on testing pure functions without IO operations
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');

// Import the class directly
const SelfMaintenance = require('../../scripts/self-maintenance.js');

describe('SelfMaintenance - Simple Tests', () => {
  describe('Constructor', () => {
    it('should initialize with default values', () => {
      const maintenance = new SelfMaintenance();

      assert.ok(maintenance.projectRoot, 'Should have project root');
      assert.ok(maintenance.agentsDir, 'Should have agents directory');
      assert.equal(maintenance.DEFAULT_INSTALL_OPTION, '3', 'Default should be Full DevOps');
    });

    it('should initialize metrics', () => {
      const maintenance = new SelfMaintenance();

      assert.equal(typeof maintenance.metrics.totalAgents, 'number', 'Should have totalAgents metric');
      assert.equal(typeof maintenance.metrics.activeAgents, 'number', 'Should have activeAgents metric');
    });
  });

  describe('countFiles() - with mocks', () => {
    it('should count files correctly', () => {
      const maintenance = new SelfMaintenance();
      const fs = require('fs');

      // Save originals
      const originalExistsSync = fs.existsSync;
      const originalReaddirSync = fs.readdirSync;
      const originalStatSync = fs.statSync;

      // Mock filesystem
      fs.existsSync = () => true;
      fs.readdirSync = (dir) => {
        // Return different results to avoid infinite recursion
        if (dir.includes('dir1')) {
          return []; // dir1 is empty
        }
        return ['file1.js', 'file2.ts', 'file3.js', 'dir1'];
      };
      fs.statSync = (path) => ({
        isDirectory: () => path.includes('dir1'),
        isFile: () => !path.includes('dir1')
      });

      try {
        const count = maintenance.countFiles('/test', ['.js']);
        assert.equal(count, 2, 'Should count 2 JS files');
      } finally {
        // Restore
        fs.existsSync = originalExistsSync;
        fs.readdirSync = originalReaddirSync;
        fs.statSync = originalStatSync;
      }
    });

    it('should handle non-existent directories', () => {
      const maintenance = new SelfMaintenance();
      const fs = require('fs');

      const originalExistsSync = fs.existsSync;
      fs.existsSync = () => false;

      try {
        const count = maintenance.countFiles('/non-existent', ['.js']);
        assert.equal(count, 0, 'Should return 0 for non-existent directory');
      } finally {
        fs.existsSync = originalExistsSync;
      }
    });
  });

  describe('countInFiles() - with mocks', () => {
    it('should count pattern occurrences', () => {
      const maintenance = new SelfMaintenance();
      const fs = require('fs');

      const originalExistsSync = fs.existsSync;
      const originalReaddirSync = fs.readdirSync;
      const originalStatSync = fs.statSync;
      const originalReadFileSync = fs.readFileSync;

      fs.existsSync = () => true;
      fs.readdirSync = () => ['file1.md'];  // Changed to .md file
      fs.statSync = () => ({
        isDirectory: () => false,
        isFile: () => true
      });
      fs.readFileSync = () => 'TODO: fix this\nTODO: and this\nNot a todo';

      try {
        const count = maintenance.countInFiles('/test', 'TODO');
        assert.equal(count, 2, 'Should find 2 TODOs');
      } finally {
        fs.existsSync = originalExistsSync;
        fs.readdirSync = originalReaddirSync;
        fs.statSync = originalStatSync;
        fs.readFileSync = originalReadFileSync;
      }
    });
  });

  describe('SCENARIO_MAP', () => {
    it('should have correct scenario mappings', () => {
      const maintenance = new SelfMaintenance();

      assert.equal(maintenance.SCENARIO_MAP.minimal, '1', 'Minimal should be 1');
      assert.equal(maintenance.SCENARIO_MAP.docker, '2', 'Docker should be 2');
      assert.equal(maintenance.SCENARIO_MAP.full, '3', 'Full should be 3');
      assert.equal(maintenance.SCENARIO_MAP.performance, '4', 'Performance should be 4');
    });
  });

  describe('calculateMetrics()', () => {
    it('should calculate context efficiency', () => {
      const maintenance = new SelfMaintenance();
      const fs = require('fs');

      // Mock filesystem to return predictable agent count
      const originalExistsSync = fs.existsSync;
      const originalReaddirSync = fs.readdirSync;
      const originalStatSync = fs.statSync;

      fs.existsSync = () => true;
      fs.readdirSync = () => ['agent1.md', 'agent2.md'];
      fs.statSync = () => ({
        isDirectory: () => false,
        isFile: () => true
      });

      // Capture console output
      const originalLog = console.log;
      const outputs = [];
      console.log = (...args) => outputs.push(args.join(' '));

      try {
        maintenance.metrics.activeAgents = 25;
        const metrics = maintenance.calculateMetrics();

        assert.equal(typeof metrics.contextEfficiency, 'number',
          'Should calculate context efficiency');
        assert.ok(metrics.contextEfficiency >= 0 && metrics.contextEfficiency <= 100,
          'Context efficiency should be between 0 and 100');
      } finally {
        fs.existsSync = originalExistsSync;
        fs.readdirSync = originalReaddirSync;
        fs.statSync = originalStatSync;
        console.log = originalLog;
      }
    });
  });
});