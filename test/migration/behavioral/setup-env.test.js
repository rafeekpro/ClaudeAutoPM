#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('setup-env.js migration', () => {
  let tempDir;
  const scriptPath = path.join(__dirname, '../../../install/setup-env.js');

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-env-test-'));
    // Create .claude directory structure
    fs.mkdirSync(path.join(tempDir, '.claude'), { recursive: true });
    // Create example env file
    const exampleEnv = `# Example .env file
CONTEXT7_API_KEY=
GITHUB_TOKEN=
`;
    fs.writeFileSync(path.join(tempDir, '.claude', '.env.example'), exampleEnv);
    process.chdir(tempDir);
  });

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Core functionality', () => {
    test('should display help when --help is passed', () => {
      const result = execSync(`node ${scriptPath} --help`, { encoding: 'utf-8' });
      expect(result).toContain('ClaudeAutoPM .env Setup');
      expect(result).toContain('Usage:');
    });

    test('should validate ClaudeAutoPM installation', () => {
      const nonExistentDir = path.join(tempDir, 'non-existent');
      fs.mkdirSync(nonExistentDir);

      try {
        execSync(`node ${scriptPath} ${nonExistentDir}`, { encoding: 'utf-8' });
        fail('Should have thrown');
      } catch (error) {
        expect(error.stderr || error.message).toContain('ClaudeAutoPM not found');
      }
    });
  });

  describe('Environment file creation', () => {
    test('should create .env file with default values', () => {
      const envPath = path.join(tempDir, '.claude', '.env');

      // Run with all defaults (non-interactive)
      execSync(`node ${scriptPath} ${tempDir} --non-interactive`, {
        encoding: 'utf-8'
      });

      expect(fs.existsSync(envPath)).toBe(true);
      const content = fs.readFileSync(envPath, 'utf-8');
      expect(content).toContain('MCP (Model Context Protocol) Configuration');
      expect(content).toContain('CONTEXT7_API_KEY=');
      expect(content).toContain('GITHUB_TOKEN=');
    });

    test('should backup existing .env file', () => {
      const envPath = path.join(tempDir, '.claude', '.env');
      fs.writeFileSync(envPath, '# Existing config\n');

      execSync(`node ${scriptPath} ${tempDir} --non-interactive --force`, {
        encoding: 'utf-8'
      });

      const backups = fs.readdirSync(path.join(tempDir, '.claude'))
        .filter(f => f.startsWith('.env.backup'));
      expect(backups.length).toBeGreaterThan(0);
    });

    test('should set secure permissions on .env file', () => {
      const envPath = path.join(tempDir, '.claude', '.env');

      execSync(`node ${scriptPath} ${tempDir} --non-interactive`, {
        encoding: 'utf-8'
      });

      const stats = fs.statSync(envPath);
      // Check that only owner has read/write permissions
      if (process.platform !== 'win32') {
        expect(stats.mode & 0o777).toBe(0o600);
      }
    });
  });

  describe('Configuration options', () => {
    test('should accept configuration via command line', () => {
      const envPath = path.join(tempDir, '.claude', '.env');

      execSync(`node ${scriptPath} ${tempDir} --non-interactive --github-token=test123 --context7-key=key456`, {
        encoding: 'utf-8'
      });

      const content = fs.readFileSync(envPath, 'utf-8');
      expect(content).toContain('GITHUB_TOKEN=test123');
      expect(content).toContain('CONTEXT7_API_KEY=key456');
    });

    test('should validate input formats', () => {
      try {
        execSync(`node ${scriptPath} ${tempDir} --non-interactive --validate --email=invalid`, {
          encoding: 'utf-8'
        });
        fail('Should have thrown');
      } catch (error) {
        expect(error.stderr || error.message).toContain('Invalid email');
      }
    });
  });

  describe('Template processing', () => {
    test('should use .env.example as template', () => {
      const envPath = path.join(tempDir, '.claude', '.env');
      const examplePath = path.join(tempDir, '.claude', '.env.example');

      // Add custom content to example
      fs.appendFileSync(examplePath, 'CUSTOM_VAR=default\n');

      execSync(`node ${scriptPath} ${tempDir} --non-interactive`, {
        encoding: 'utf-8'
      });

      const content = fs.readFileSync(envPath, 'utf-8');
      expect(content).toContain('CUSTOM_VAR=');
    });
  });

  describe('Backward compatibility', () => {
    test('should support same command-line interface as bash version', () => {
      const result = execSync(`node ${scriptPath} ${tempDir} --non-interactive`, {
        encoding: 'utf-8'
      });

      expect(result).toContain('.env file created');
    });
  });
});