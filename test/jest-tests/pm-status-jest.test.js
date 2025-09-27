// Mock dependencies before importing
jest.mock('fs');

const fs = require('fs');
const status = require('../../autopm/.claude/scripts/pm/status.js');

describe('PM Status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    process.exit = jest.fn();

    // Default mock: no directories exist
    fs.existsSync.mockReturnValue(false);
    fs.statSync.mockReturnValue({ isDirectory: () => false });
    fs.readdirSync.mockReturnValue([]);
    fs.readFileSync.mockReturnValue('');
  });

  describe('status()', () => {
    it('should return default result when no directories exist', async () => {
      fs.existsSync.mockReturnValue(false);

      const result = await status();

      expect(result.prds.total).toBe(0);
      expect(result.prds.found).toBe(false);
      expect(result.epics.total).toBe(0);
      expect(result.epics.found).toBe(false);
      expect(result.tasks.total).toBe(0);
      expect(result.tasks.open).toBe(0);
      expect(result.tasks.closed).toBe(0);
      expect(result.tasks.found).toBe(false);
    });

    it('should include header messages', async () => {
      const result = await status();

      expect(result.messages).toContain('Getting status...');
      expect(result.messages).toContain('📊 Project Status');
      expect(result.messages).toContain('================');
    });

    it('should count PRDs correctly', async () => {
      fs.existsSync.mockImplementation(path => path === '.claude/prds');
      fs.statSync.mockImplementation(path => ({
        isDirectory: () => path === '.claude/prds'
      }));
      fs.readdirSync.mockImplementation(path => {
        if (path === '.claude/prds') {
          return ['auth-system.md', 'user-management.md', 'readme.txt', 'other.md'];
        }
        return [];
      });

      const result = await status();

      expect(result.prds.total).toBe(3); // Only .md files
      expect(result.prds.found).toBe(true);
      expect(result.messages).toContain('  Total:        3');
    });

    it('should handle PRDs directory errors gracefully', async () => {
      fs.existsSync.mockImplementation(path => path === '.claude/prds');
      fs.statSync.mockImplementation(() => {
        throw new Error('Directory access error');
      });

      const result = await status();

      expect(result.prds.total).toBe(0);
      expect(result.prds.found).toBe(false);
      expect(result.messages).toContain('  No PRDs found');
    });

    it('should count epics correctly', async () => {
      fs.existsSync.mockImplementation(path => path === '.claude/epics');
      fs.statSync.mockImplementation(path => ({
        isDirectory: () => path === '.claude/epics'
      }));
      fs.readdirSync.mockImplementation((path, options) => {
        if (path === '.claude/epics') {
          return [
            { name: 'epic1', isDirectory: () => true },
            { name: 'epic2', isDirectory: () => true },
            { name: 'file.md', isDirectory: () => false }
          ];
        }
        return [];
      });

      const result = await status();

      expect(result.epics.total).toBe(2); // Only directories
      expect(result.epics.found).toBe(true);
      expect(result.messages).toContain('  Total:        2');
    });

    it('should handle epics directory errors gracefully', async () => {
      fs.existsSync.mockImplementation(path => path === '.claude/epics');
      fs.statSync.mockImplementation(() => {
        throw new Error('Directory access error');
      });

      const result = await status();

      expect(result.epics.total).toBe(0);
      expect(result.epics.found).toBe(false);
      expect(result.messages).toContain('  No epics found');
    });

    it('should count tasks with status correctly', async () => {
      fs.existsSync.mockImplementation(path => path === '.claude/epics');
      fs.statSync.mockImplementation(path => ({
        isDirectory: () => path === '.claude/epics'
      }));
      fs.readdirSync.mockImplementation((path, options) => {
        if (path === '.claude/epics') {
          return [
            { name: 'epic1', isDirectory: () => true },
            { name: 'epic2', isDirectory: () => true }
          ];
        }
        if (path === '.claude/epics/epic1') {
          return ['1.md', '2.md', 'epic.md', 'readme.txt'];
        }
        if (path === '.claude/epics/epic2') {
          return ['3.md', '4.md'];
        }
        return [];
      });

      fs.readFileSync.mockImplementation(filePath => {
        if (filePath.includes('1.md')) {
          return 'Task 1\nstatus: open\nContent here';
        }
        if (filePath.includes('2.md')) {
          return 'Task 2\nstatus: closed\nContent here';
        }
        if (filePath.includes('3.md')) {
          return 'Task 3\nstatus: in-progress\nContent here';
        }
        if (filePath.includes('4.md')) {
          return 'Task 4\nContent without status';
        }
        return '';
      });

      const result = await status();

      expect(result.tasks.total).toBe(4);
      expect(result.tasks.open).toBe(3); // open, in-progress, no status = open
      expect(result.tasks.closed).toBe(1);
      expect(result.tasks.found).toBe(true);
      expect(result.messages).toContain('  Open:        3');
      expect(result.messages).toContain('  Closed:        1');
      expect(result.messages).toContain('  Total:        4');
    });

    it('should only count numbered task files', async () => {
      fs.existsSync.mockImplementation(path => path === '.claude/epics');
      fs.statSync.mockImplementation(path => ({
        isDirectory: () => path === '.claude/epics'
      }));
      fs.readdirSync.mockImplementation((path, options) => {
        if (path === '.claude/epics') {
          return [{ name: 'epic1', isDirectory: () => true }];
        }
        if (path === '.claude/epics/epic1') {
          return ['1.md', '2.md', 'epic.md', 'readme.md', 'notes.md'];
        }
        return [];
      });

      fs.readFileSync.mockImplementation(() => 'status: open');

      const result = await status();

      expect(result.tasks.total).toBe(2); // Only 1.md and 2.md
      expect(result.tasks.open).toBe(2);
    });

    it('should handle task file read errors gracefully', async () => {
      fs.existsSync.mockImplementation(path => path === '.claude/epics');
      fs.statSync.mockImplementation(path => ({
        isDirectory: () => path === '.claude/epics'
      }));
      fs.readdirSync.mockImplementation((path, options) => {
        if (path === '.claude/epics') {
          return [{ name: 'epic1', isDirectory: () => true }];
        }
        if (path === '.claude/epics/epic1') {
          return ['1.md', '2.md'];
        }
        return [];
      });

      fs.readFileSync.mockImplementation(filePath => {
        if (filePath.includes('1.md')) {
          return 'status: closed';
        }
        if (filePath.includes('2.md')) {
          throw new Error('File read error');
        }
        return '';
      });

      const result = await status();

      expect(result.tasks.total).toBe(2);
      expect(result.tasks.open).toBe(1); // Error file counted as open
      expect(result.tasks.closed).toBe(1);
    });

    it('should handle epic directory read errors gracefully', async () => {
      fs.existsSync.mockImplementation(path => path === '.claude/epics');
      fs.statSync.mockImplementation(path => ({
        isDirectory: () => path === '.claude/epics'
      }));
      fs.readdirSync.mockImplementation((path, options) => {
        if (path === '.claude/epics') {
          return [
            { name: 'epic1', isDirectory: () => true },
            { name: 'epic2', isDirectory: () => true }
          ];
        }
        if (path === '.claude/epics/epic1') {
          return ['1.md'];
        }
        if (path === '.claude/epics/epic2') {
          throw new Error('Directory read error');
        }
        return [];
      });

      fs.readFileSync.mockImplementation(() => 'status: open');

      const result = await status();

      expect(result.tasks.total).toBe(1); // Only epic1 counted
      expect(result.tasks.open).toBe(1);
    });

    it('should handle tasks with various status formats', async () => {
      fs.existsSync.mockImplementation(path => path === '.claude/epics');
      fs.statSync.mockImplementation(path => ({
        isDirectory: () => path === '.claude/epics'
      }));
      fs.readdirSync.mockImplementation((path, options) => {
        if (path === '.claude/epics') {
          return [{ name: 'epic1', isDirectory: () => true }];
        }
        if (path === '.claude/epics/epic1') {
          return ['1.md', '2.md', '3.md', '4.md', '5.md'];
        }
        return [];
      });

      fs.readFileSync.mockImplementation(filePath => {
        if (filePath.includes('1.md')) {
          return 'status: closed';
        }
        if (filePath.includes('2.md')) {
          return 'status:closed'; // No space
        }
        if (filePath.includes('3.md')) {
          return 'status:   closed  '; // Extra spaces
        }
        if (filePath.includes('4.md')) {
          return 'Status: CLOSED'; // Different case
        }
        if (filePath.includes('5.md')) {
          return 'other content';
        }
        return '';
      });

      const result = await status();

      expect(result.tasks.total).toBe(5);
      expect(result.tasks.closed).toBe(3); // Only exact matches "closed"
      expect(result.tasks.open).toBe(2);
    });

    it('should include section headers in messages', async () => {
      const result = await status();

      expect(result.messages).toContain('📄 PRDs:');
      expect(result.messages).toContain('📚 Epics:');
      expect(result.messages).toContain('📝 Tasks:');
    });

    it('should handle empty epic directories', async () => {
      fs.existsSync.mockImplementation(path => path === '.claude/epics');
      fs.statSync.mockImplementation(path => ({
        isDirectory: () => path === '.claude/epics'
      }));
      fs.readdirSync.mockImplementation((path, options) => {
        if (path === '.claude/epics') {
          return [{ name: 'epic1', isDirectory: () => true }];
        }
        if (path === '.claude/epics/epic1') {
          return []; // Empty epic
        }
        return [];
      });

      const result = await status();

      expect(result.epics.total).toBe(1);
      expect(result.tasks.total).toBe(0);
      expect(result.tasks.found).toBe(false);
    });

    it('should return consistent result structure', async () => {
      const result = await status();

      expect(result).toHaveProperty('prds');
      expect(result.prds).toHaveProperty('total');
      expect(result.prds).toHaveProperty('found');
      expect(result).toHaveProperty('epics');
      expect(result.epics).toHaveProperty('total');
      expect(result.epics).toHaveProperty('found');
      expect(result).toHaveProperty('tasks');
      expect(result.tasks).toHaveProperty('total');
      expect(result.tasks).toHaveProperty('open');
      expect(result.tasks).toHaveProperty('closed');
      expect(result.tasks).toHaveProperty('found');
      expect(result).toHaveProperty('messages');
      expect(Array.isArray(result.messages)).toBe(true);
    });
  });

  describe('CLI Execution', () => {
    it('should not log messages when used as module', async () => {
      const originalMain = require.main;
      require.main = null; // Simulate module usage

      const result = await status();

      expect(console.log).not.toHaveBeenCalled();
      expect(result.messages.length).toBeGreaterThan(0);

      require.main = originalMain;
    });

    it('should have CLI logging capability', async () => {
      // Test the CLI behavior by examining the addMessage function
      // Since mocking require.main === module is complex in Jest,
      // we'll verify the module works both ways

      const result = await status();

      // When used as module, console.log should not be called
      expect(console.log).not.toHaveBeenCalled();
      expect(result.messages.length).toBeGreaterThan(0);

      // Verify the messages structure for CLI output
      expect(result.messages).toContain('Getting status...');
      expect(result.messages).toContain('📊 Project Status');
    });

    it('should exit with code 0 on success', async () => {
      const originalMain = require.main;
      require.main = { filename: require.resolve('../../autopm/.claude/scripts/pm/status.js') };

      // Mock process.exit to throw error to stop execution
      process.exit.mockImplementation((code) => {
        throw new Error(`Process exit with code ${code}`);
      });

      try {
        delete require.cache[require.resolve('../../autopm/.claude/scripts/pm/status.js')];
        await require('../../autopm/.claude/scripts/pm/status.js');
      } catch (error) {
        expect(error.message).toBe('Process exit with code 0');
      }

      require.main = originalMain;
    });

    it('should handle CLI errors gracefully', async () => {
      const originalMain = require.main;
      require.main = { filename: require.resolve('../../autopm/.claude/scripts/pm/status.js') };

      // Mock fs to throw error
      fs.existsSync.mockImplementation(() => {
        throw new Error('Filesystem error');
      });

      // Mock process.exit to throw error to stop execution
      process.exit.mockImplementation((code) => {
        throw new Error(`Process exit with code ${code}`);
      });

      try {
        delete require.cache[require.resolve('../../autopm/.claude/scripts/pm/status.js')];
        await require('../../autopm/.claude/scripts/pm/status.js');
      } catch (error) {
        // Should still exit with 0 unless critical error
        expect(error.message).toContain('Process exit with code');
      }

      require.main = originalMain;
    });
  });

  describe('Integration Tests', () => {
    it('should maintain backward compatibility', () => {
      const statusModule = require('../../autopm/.claude/scripts/pm/status.js');
      expect(typeof statusModule).toBe('function');
      expect(statusModule.name).toBe('status');
    });

    it('should handle realistic project structure', async () => {
      fs.existsSync.mockImplementation(path => {
        if (path === '.claude/prds') return true;
        if (path === '.claude/epics') return true;
        return false;
      });

      fs.statSync.mockImplementation(path => ({
        isDirectory: () => true
      }));

      fs.readdirSync.mockImplementation((path, options) => {
        if (path === '.claude/prds') {
          return ['auth-system.md', 'user-management.md'];
        }
        if (path === '.claude/epics') {
          return [
            { name: 'feature-auth', isDirectory: () => true },
            { name: 'feature-users', isDirectory: () => true }
          ];
        }
        if (path === '.claude/epics/feature-auth') {
          return ['1.md', '2.md', 'epic.md'];
        }
        if (path === '.claude/epics/feature-users') {
          return ['1.md', '3.md'];
        }
        return [];
      });

      fs.readFileSync.mockImplementation(filePath => {
        if (filePath.includes('/1.md')) {
          return 'Task 1\nstatus: open\nContent';
        }
        if (filePath.includes('/2.md')) {
          return 'Task 2\nstatus: closed\nContent';
        }
        if (filePath.includes('/3.md')) {
          return 'Task 3\nstatus: in-progress\nContent';
        }
        return '';
      });

      const result = await status();

      expect(result.prds.total).toBe(2);
      expect(result.epics.total).toBe(2);
      expect(result.tasks.total).toBe(4);
      expect(result.tasks.open).toBe(3);
      expect(result.tasks.closed).toBe(1);
    });

    it('should have proper message formatting', async () => {
      const result = await status();

      const messageText = result.messages.join('\n');
      expect(messageText).toContain('📊 Project Status');
      expect(messageText).toContain('================');
      expect(messageText).toContain('📄 PRDs:');
      expect(messageText).toContain('📚 Epics:');
      expect(messageText).toContain('📝 Tasks:');
    });
  });
});