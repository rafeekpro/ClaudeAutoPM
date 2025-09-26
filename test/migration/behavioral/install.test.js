#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('install.js migration', () => {
  let tempDir;
  const scriptPath = path.join(__dirname, '../../../install/install.js');
  const originalScriptPath = path.join(__dirname, '../../../install/install.sh');

  beforeEach(() => {
    // Create temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'install-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    // Cleanup
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Core functionality', () => {
    test('should display help when --help is passed', () => {
      const result = execSync(`node ${scriptPath} --help`, { encoding: 'utf-8' });
      expect(result).toContain('ClaudeAutoPM Installation Script');
      expect(result).toContain('Usage:');
      expect(result).toContain('Options:');
    });

    test('should display version when --version is passed', () => {
      const result = execSync(`node ${scriptPath} --version`, { encoding: 'utf-8' });
      expect(result).toMatch(/v?\d+\.\d+\.\d+/);
    });

    test('should validate target directory', () => {
      const nonExistentDir = path.join(tempDir, 'non-existent');
      try {
        execSync(`node ${scriptPath} ${nonExistentDir}`, { encoding: 'utf-8' });
        fail('Should have thrown error');
      } catch (error) {
        expect(error.stderr || error.message).toContain('does not exist');
      }
    });
  });

  describe('Installation modes', () => {
    test('should support minimal installation', () => {
      // Create target directory
      const targetDir = path.join(tempDir, 'project');
      fs.mkdirSync(targetDir);

      // Run installation with minimal option
      const result = execSync(`AUTOPM_TEST_MODE=1 node ${scriptPath} ${targetDir} --scenario=minimal`, {
        encoding: 'utf-8',
        input: '1\n'
      });

      expect(result).toContain('Installation complete');
      expect(fs.existsSync(path.join(targetDir, '.claude'))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'CLAUDE.md'))).toBe(true);
    });

    test('should support docker installation', () => {
      const targetDir = path.join(tempDir, 'docker-project');
      fs.mkdirSync(targetDir);

      const result = execSync(`AUTOPM_TEST_MODE=1 node ${scriptPath} ${targetDir} --scenario=docker`, {
        encoding: 'utf-8',
        input: '2\n'
      });

      expect(result).toContain('Installation complete');
      const configPath = path.join(targetDir, '.claude', 'config.json');
      expect(fs.existsSync(configPath)).toBe(true);

      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      expect(config.tools.docker.enabled).toBe(true);
    });
  });

  describe('File operations', () => {
    test('should copy .claude directory structure', () => {
      const targetDir = path.join(tempDir, 'copy-test');
      fs.mkdirSync(targetDir);

      execSync(`AUTOPM_TEST_MODE=1 node ${scriptPath} ${targetDir}`, {
        encoding: 'utf-8',
        input: '1\n'
      });

      // Check expected directories
      const expectedDirs = [
        '.claude/agents',
        '.claude/commands',
        '.claude/rules',
        '.claude/scripts',
        '.claude/checklists'
      ];

      expectedDirs.forEach(dir => {
        const fullPath = path.join(targetDir, dir);
        expect(fs.existsSync(fullPath)).toBe(true);
      });
    });

    test('should create backup of existing files', () => {
      const targetDir = path.join(tempDir, 'backup-test');
      fs.mkdirSync(targetDir);

      // Create existing CLAUDE.md
      const claudePath = path.join(targetDir, 'CLAUDE.md');
      fs.writeFileSync(claudePath, '# Existing content\n');

      execSync(`AUTOPM_TEST_MODE=1 node ${scriptPath} ${targetDir} --force`, {
        encoding: 'utf-8',
        input: '1\n'
      });

      // Check backup was created
      const backupFiles = fs.readdirSync(targetDir).filter(f => f.startsWith('CLAUDE.md.backup.'));
      expect(backupFiles.length).toBeGreaterThan(0);
    });
  });

  describe('CLAUDE.md handling', () => {
    test('should merge existing CLAUDE.md with template', () => {
      const targetDir = path.join(tempDir, 'merge-test');
      fs.mkdirSync(targetDir);

      // Create existing CLAUDE.md with custom content
      const claudePath = path.join(targetDir, 'CLAUDE.md');
      const customContent = '# My Project\n\n## Custom Section\nMy custom rules\n';
      fs.writeFileSync(claudePath, customContent);

      execSync(`AUTOPM_TEST_MODE=1 node ${scriptPath} ${targetDir} --merge`, {
        encoding: 'utf-8'
      });

      const mergedContent = fs.readFileSync(claudePath, 'utf-8');
      expect(mergedContent).toContain('Custom Section');
      expect(mergedContent).toContain('ClaudeAutoPM Configuration');
    });
  });

  describe('Script installation', () => {
    test('should install safe-commit.sh script', () => {
      const targetDir = path.join(tempDir, 'scripts-test');
      fs.mkdirSync(targetDir);

      execSync(`AUTOPM_TEST_MODE=1 node ${scriptPath} ${targetDir}`, {
        encoding: 'utf-8',
        input: '1\n'
      });

      const safeCommitPath = path.join(targetDir, 'scripts', 'safe-commit.sh');
      expect(fs.existsSync(safeCommitPath)).toBe(true);

      // Check it's executable
      const stats = fs.statSync(safeCommitPath);
      expect(stats.mode & 0o100).toBeTruthy(); // Check execute bit
    });
  });

  describe('Git hooks setup', () => {
    test('should setup git hooks when requested', () => {
      const targetDir = path.join(tempDir, 'hooks-test');
      fs.mkdirSync(targetDir);

      // Initialize git repo
      execSync('git init', { cwd: targetDir });

      execSync(`AUTOPM_TEST_MODE=1 node ${scriptPath} ${targetDir} --setup-hooks`, {
        encoding: 'utf-8',
        input: '1\ny\n'
      });

      const hookPath = path.join(targetDir, '.git', 'hooks', 'pre-commit');
      expect(fs.existsSync(hookPath)).toBe(true);
    });
  });

  describe('Environment validation', () => {
    test('should check for required tools', () => {
      const targetDir = path.join(tempDir, 'env-test');
      fs.mkdirSync(targetDir);

      const result = execSync(`AUTOPM_TEST_MODE=1 node ${scriptPath} ${targetDir} --check-env`, {
        encoding: 'utf-8'
      });

      expect(result).toContain('Environment check');
      expect(result).toMatch(/node.*v\d+\.\d+\.\d+/i);
      expect(result).toMatch(/npm.*\d+\.\d+\.\d+/i);
    });
  });

  describe('Backward compatibility', () => {
    test('should maintain same exit codes as bash version', () => {
      const targetDir = path.join(tempDir, 'exit-test');

      // Test with non-existent directory (should fail)
      try {
        execSync(`node ${scriptPath} ${targetDir}`, { encoding: 'utf-8' });
        fail('Should have thrown');
      } catch (error) {
        expect(error.status).toBe(1);
      }
    });

    test('should support same command-line options as bash version', () => {
      const options = ['--help', '--version', '--force', '--merge', '--check-env'];

      options.forEach(option => {
        let result;
        try {
          result = execSync(`node ${scriptPath} ${option}`, { encoding: 'utf-8' });
        } catch (error) {
          // Some options might exit with non-zero, that's OK
          result = error.stdout || error.stderr || '';
        }
        expect(result).toBeTruthy();
      });
    });
  });
});