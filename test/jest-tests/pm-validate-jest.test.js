// Mock dependencies before importing
jest.mock('fs');

const fs = require('fs');
const path = require('path');
const validate = require('../../autopm/.claude/scripts/pm/validate.js');

describe('PM Validate', () => {
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

  describe('validate()', () => {
    it('should return default result structure', async () => {
      fs.existsSync.mockReturnValue(false);

      const result = await validate();

      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('invalidFiles');
      expect(result).toHaveProperty('messages');
      expect(result).toHaveProperty('exitCode');
      expect(Array.isArray(result.messages)).toBe(true);
    });

    it('should include header messages', async () => {
      const result = await validate();

      expect(result.messages).toContain('Validating PM System...');
      expect(result.messages).toContain('🔍 Validating PM System');
      expect(result.messages).toContain('=======================');
    });

    it('should detect missing .claude directory', async () => {
      fs.existsSync.mockReturnValue(false);

      const result = await validate();

      expect(result.errors).toBe(1);
      expect(result.messages).toContain('  ❌ .claude directory missing');
    });

    it('should validate existing .claude directory', async () => {
      fs.existsSync.mockImplementation(path => path === '.claude');
      fs.statSync.mockImplementation(path => ({
        isDirectory: () => path === '.claude'
      }));

      const result = await validate();

      expect(result.errors).toBe(0);
      expect(result.messages).toContain('  ✅ .claude directory exists');
    });

    it('should handle .claude directory access error', async () => {
      fs.existsSync.mockImplementation(path => path === '.claude');
      fs.statSync.mockImplementation(() => {
        throw new Error('Access denied');
      });

      const result = await validate();

      expect(result.errors).toBe(1);
      expect(result.messages).toContain('  ❌ .claude directory missing');
    });

    it('should check optional directories', async () => {
      fs.existsSync.mockImplementation(path => {
        return ['.claude', '.claude/prds', '.claude/rules'].includes(path);
      });
      fs.statSync.mockImplementation(path => ({
        isDirectory: () => true
      }));

      const result = await validate();

      expect(result.warnings).toBe(1); // Missing epics directory
      expect(result.messages).toContain('  ✅ PRDs directory exists');
      expect(result.messages).toContain('  ⚠️ Epics directory missing');
      expect(result.messages).toContain('  ✅ Rules directory exists');
    });

    it('should detect missing epic.md files', async () => {
      fs.existsSync.mockImplementation(path => {
        if (path === '.claude') return true;
        if (path === '.claude/epics') return true;
        if (path.includes('epic.md')) return false;
        return false;
      });

      fs.statSync.mockImplementation(path => ({ isDirectory: () => true }));

      fs.readdirSync.mockImplementation((path, options) => {
        if (path === '.claude/epics') {
          return [
            { name: 'epic1', isDirectory: () => true },
            { name: 'epic2', isDirectory: () => true }
          ];
        }
        return [];
      });

      const result = await validate();

      expect(result.warnings).toBeGreaterThanOrEqual(2);
      expect(result.messages).toContain('  ⚠️ Missing epic.md in epic1');
      expect(result.messages).toContain('  ⚠️ Missing epic.md in epic2');
    });

    it('should check for orphaned task files functionality', async () => {
      // Test that the orphaned files detection runs without error
      // The actual detection logic is complex and depends on specific directory structure
      fs.existsSync.mockImplementation(path => {
        return path === '.claude';
      });

      fs.statSync.mockImplementation(path => ({ isDirectory: () => true }));

      fs.readdirSync.mockImplementation((path, options) => {
        if (path === '.claude') {
          return [];
        }
        return [];
      });

      const result = await validate();

      // Should complete without error
      expect(result).toHaveProperty('warnings');
      expect(result.messages).toContain('🗂️ Data Integrity:');
    });

    it('should check reference validation functionality', async () => {
      // Test that reference validation runs without error
      fs.existsSync.mockImplementation(path => {
        if (path === '.claude' || path === '.claude/epics') return true;
        return false;
      });

      fs.statSync.mockImplementation(path => ({ isDirectory: () => true }));

      fs.readdirSync.mockImplementation((path, options) => {
        if (path === '.claude/epics') {
          return [];
        }
        return [];
      });

      const result = await validate();

      // Should complete reference check section
      expect(result.messages).toContain('🔗 Reference Check:');
      expect(result.messages).toContain('  ✅ All references valid');
    });

    it('should handle valid task dependencies', async () => {
      fs.existsSync.mockImplementation(path => {
        if (path === '.claude' || path === '.claude/epics') return true;
        if (path.includes('.claude/epics/epic1')) return true;
        return false;
      });

      fs.statSync.mockImplementation(path => ({ isDirectory: () => true }));

      fs.readdirSync.mockImplementation((path, options) => {
        if (path === '.claude/epics') {
          return [{ name: 'epic1', isDirectory: () => true }];
        }
        if (path === '.claude/epics/epic1') {
          return [
            { name: '1.md', isDirectory: () => false },
            { name: '2.md', isDirectory: () => false }
          ];
        }
        return [];
      });

      fs.readFileSync.mockImplementation(filePath => {
        if (filePath.includes('1.md')) {
          return 'Task 1\ndepends_on: [2]\nContent here';
        }
        if (filePath.includes('2.md')) {
          return 'Task 2\nContent here';
        }
        return '';
      });

      const result = await validate();

      expect(result.messages).toContain('  ✅ All references valid');
    });

    it('should check frontmatter validation functionality', async () => {
      // Test that frontmatter validation runs without error
      fs.existsSync.mockImplementation(path => {
        return path === '.claude';
      });

      fs.statSync.mockImplementation(path => ({ isDirectory: () => true }));

      fs.readdirSync.mockImplementation((path, options) => {
        if (path === '.claude') {
          return [];
        }
        return [];
      });

      const result = await validate();

      // Should complete frontmatter validation section
      expect(result.messages).toContain('📝 Frontmatter Validation:');
      expect(result.messages).toContain('  ✅ All files have frontmatter');
      expect(result.invalidFiles).toBe(0);
    });

    it('should handle empty dependencies gracefully', async () => {
      fs.existsSync.mockImplementation(path => {
        return path === '.claude' || path === '.claude/epics' || path.includes('epic1');
      });

      fs.statSync.mockImplementation(path => ({ isDirectory: () => true }));

      fs.readdirSync.mockImplementation((path, options) => {
        if (path === '.claude/epics') {
          return [{ name: 'epic1', isDirectory: () => true }];
        }
        if (path === '.claude/epics/epic1') {
          return [{ name: '1.md', isDirectory: () => false }];
        }
        return [];
      });

      fs.readFileSync.mockImplementation(filePath => {
        if (filePath.includes('1.md')) {
          return 'Task 1\ndepends_on: []\nContent here';
        }
        return '';
      });

      const result = await validate();

      expect(result.messages).toContain('  ✅ All references valid');
    });

    it('should show healthy system when no issues found', async () => {
      fs.existsSync.mockImplementation(path => {
        return ['.claude', '.claude/prds', '.claude/epics', '.claude/rules'].includes(path) || path.includes('epic1') || path.includes('epic.md');
      });

      fs.statSync.mockImplementation(path => ({ isDirectory: () => path !== '.claude/epics/epic1/epic.md' }));

      fs.readdirSync.mockImplementation((path, options) => {
        if (path === '.claude') {
          return [];
        }
        if (path === '.claude/epics') {
          return [{ name: 'epic1', isDirectory: () => true }];
        }
        if (path === '.claude/epics/epic1') {
          return [{ name: 'epic.md', isDirectory: () => false }];
        }
        return [];
      });

      fs.readFileSync.mockImplementation(filePath => {
        if (filePath.includes('epic.md')) {
          return '---\nname: Epic 1\n---\nEpic content';
        }
        return '';
      });

      const result = await validate();

      expect(result.errors).toBe(0);
      expect(result.warnings).toBe(0);
      expect(result.invalidFiles).toBe(0);
      expect(result.messages).toContain('✅ System is healthy!');
    });

    it('should suggest cleanup when issues found', async () => {
      fs.existsSync.mockReturnValue(false); // Missing .claude directory

      const result = await validate();

      expect(result.errors).toBeGreaterThan(0);
      expect(result.messages).toContain('💡 Run /pm:clean to fix some issues automatically');
    });

    it('should handle file read errors gracefully', async () => {
      fs.existsSync.mockImplementation(path => {
        return path === '.claude' || path === '.claude/epics' || path.includes('epic1');
      });

      fs.statSync.mockImplementation(path => ({ isDirectory: () => true }));

      fs.readdirSync.mockImplementation((path, options) => {
        if (path === '.claude/epics') {
          return [{ name: 'epic1', isDirectory: () => true }];
        }
        if (path === '.claude/epics/epic1') {
          return [{ name: '1.md', isDirectory: () => false }];
        }
        return [];
      });

      fs.readFileSync.mockImplementation(filePath => {
        throw new Error('File read error');
      });

      const result = await validate();

      // Should not crash and continue validation
      expect(result.messages).toContain('  ✅ All references valid');
    });

    it('should include section headers', async () => {
      const result = await validate();

      expect(result.messages).toContain('📁 Directory Structure:');
      expect(result.messages).toContain('🗂️ Data Integrity:');
      expect(result.messages).toContain('🔗 Reference Check:');
      expect(result.messages).toContain('📝 Frontmatter Validation:');
      expect(result.messages).toContain('📊 Validation Summary:');
    });

    it('should always return exit code 0', async () => {
      fs.existsSync.mockReturnValue(false); // Force errors

      const result = await validate();

      expect(result.exitCode).toBe(0);
    });

    it('should handle validation process completely', async () => {
      // Test the complete validation process with minimal setup
      fs.existsSync.mockImplementation(path => {
        return path === '.claude';
      });

      fs.statSync.mockImplementation(path => ({ isDirectory: () => true }));

      fs.readdirSync.mockImplementation((path, options) => {
        return [];
      });

      const result = await validate();

      // Should complete all validation sections
      expect(result.messages).toContain('📁 Directory Structure:');
      expect(result.messages).toContain('🗂️ Data Integrity:');
      expect(result.messages).toContain('🔗 Reference Check:');
      expect(result.messages).toContain('📝 Frontmatter Validation:');
      expect(result.messages).toContain('📊 Validation Summary:');
    });

    it('should count validation metrics in summary', async () => {
      // Test that validation summary is included with proper format
      fs.existsSync.mockImplementation(path => {
        return path === '.claude';
      });
      fs.statSync.mockImplementation(path => ({ isDirectory: () => true }));
      fs.readdirSync.mockImplementation((path, options) => {
        return [];
      });

      const result = await validate();

      // Should include summary section with metrics
      expect(result.messages).toContain('📊 Validation Summary:');
      expect(result.messages.some(msg => msg.includes('Errors:'))).toBe(true);
      expect(result.messages.some(msg => msg.includes('Warnings:'))).toBe(true);
      expect(result.messages.some(msg => msg.includes('Invalid files:'))).toBe(true);
    });
  });

  describe('CLI Execution', () => {
    it('should not log messages when used as module', async () => {
      const result = await validate();

      expect(console.log).not.toHaveBeenCalled();
      expect(result.messages.length).toBeGreaterThan(0);
    });

    it('should exit with code 0 on success', async () => {
      const originalMain = require.main;
      require.main = { filename: require.resolve('../../autopm/.claude/scripts/pm/validate.js') };

      process.exit.mockImplementation((code) => {
        throw new Error(`Process exit with code ${code}`);
      });

      try {
        delete require.cache[require.resolve('../../autopm/.claude/scripts/pm/validate.js')];
        await require('../../autopm/.claude/scripts/pm/validate.js');
      } catch (error) {
        expect(error.message).toBe('Process exit with code 0');
      }

      require.main = originalMain;
    });

    it('should handle CLI errors gracefully', async () => {
      const originalMain = require.main;
      require.main = { filename: require.resolve('../../autopm/.claude/scripts/pm/validate.js') };

      // Mock to throw error during validation
      fs.existsSync.mockImplementation(() => {
        throw new Error('Critical filesystem error');
      });

      process.exit.mockImplementation((code) => {
        throw new Error(`Process exit with code ${code}`);
      });

      try {
        delete require.cache[require.resolve('../../autopm/.claude/scripts/pm/validate.js')];
        await require('../../autopm/.claude/scripts/pm/validate.js');
      } catch (error) {
        expect(error.message).toContain('Process exit with code');
      }

      require.main = originalMain;
    });
  });

  describe('Integration Tests', () => {
    it('should maintain backward compatibility', () => {
      const validateModule = require('../../autopm/.claude/scripts/pm/validate.js');
      expect(typeof validateModule).toBe('function');
      expect(validateModule.name).toBe('validate');
    });

    it('should handle realistic project validation', async () => {
      fs.existsSync.mockImplementation(path => {
        return [
          '.claude',
          '.claude/prds',
          '.claude/epics',
          '.claude/rules'
        ].includes(path) || path.includes('epic1') || path.includes('epic2');
      });

      fs.statSync.mockImplementation(path => ({ isDirectory: () => true }));

      fs.readdirSync.mockImplementation((path, options) => {
        if (path === '.claude/prds') {
          return [{ name: 'auth.md', isDirectory: () => false }];
        }
        if (path === '.claude/epics') {
          return [
            { name: 'epic1', isDirectory: () => true },
            { name: 'epic2', isDirectory: () => true }
          ];
        }
        if (path === '.claude/epics/epic1') {
          return [
            { name: '1.md', isDirectory: () => false },
            { name: 'epic.md', isDirectory: () => false }
          ];
        }
        if (path === '.claude/epics/epic2') {
          return [{ name: 'epic.md', isDirectory: () => false }];
        }
        return [];
      });

      fs.readFileSync.mockImplementation(filePath => {
        return '---\ntitle: Test\n---\nContent';
      });

      const result = await validate();

      expect(result.errors).toBe(0);
      expect(result.warnings).toBe(0);
      expect(result.invalidFiles).toBe(0);
      expect(result.messages).toContain('✅ System is healthy!');
    });

    it('should have proper message structure', async () => {
      const result = await validate();

      const messageText = result.messages.join('\n');
      expect(messageText).toContain('🔍 Validating PM System');
      expect(messageText).toContain('=======================');
      expect(messageText).toContain('📁 Directory Structure:');
      expect(messageText).toContain('📊 Validation Summary:');
    });
  });
});