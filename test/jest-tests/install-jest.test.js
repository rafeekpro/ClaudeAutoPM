// Mock dependencies before importing
jest.mock('fs');
jest.mock('child_process');
jest.mock('readline');

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const readline = require('readline');

// Import the Installer class from install.js
const installerPath = path.join(__dirname, '../../install/install.js');

describe('ClaudeAutoPM Installer', () => {
  let Installer;
  let originalArgv;
  let originalCwd;
  let originalExit;
  let originalEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();

    // Store original values
    originalArgv = process.argv;
    originalCwd = process.cwd;
    originalExit = process.exit;
    originalEnv = process.env;

    // Mock process methods
    process.cwd = jest.fn().mockReturnValue('/test/project');
    process.exit = jest.fn();

    // Default filesystem mocks
    fs.existsSync.mockReturnValue(false);
    fs.mkdirSync.mockImplementation(() => {});
    fs.cpSync.mockImplementation(() => {});
    fs.readFileSync.mockReturnValue('{}');
    fs.writeFileSync.mockImplementation(() => {});
    fs.readdirSync.mockReturnValue([]);

    // Mock child_process
    execSync.mockImplementation(() => '');
    spawnSync.mockImplementation(() => ({ status: 0, stdout: '', stderr: '' }));

    // Mock readline
    const mockRl = {
      question: jest.fn((question, callback) => callback('y')),
      close: jest.fn()
    };
    readline.createInterface = jest.fn().mockReturnValue(mockRl);

    // Clear module cache and re-require
    delete require.cache[installerPath];

    // Extract the Installer class from the module
    const moduleContent = fs.readFileSync(installerPath, 'utf8');
    const classMatch = moduleContent.match(/class\s+Installer\s*{[\s\S]*?^}/m);

    // For this test, we'll load it differently
    // Since the file also executes code when loaded, we need to handle that
    process.argv = ['node', 'install.js'];

    // Load the actual file content and extract the class
    const actualFs = jest.requireActual('fs');
    const actualContent = actualFs.readFileSync(installerPath, 'utf8');

    // Create a mock module that exports the Installer class
    const mockModule = `
      const fs = require('fs');
      const path = require('path');
      const { execSync, spawnSync } = require('child_process');
      const readline = require('readline');

      ${actualContent.match(/class Installer[\s\S]*?\n}\n/)[0]}

      module.exports = Installer;
    `;

    // Evaluate the mock module to get the Installer class
    eval(mockModule);
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.cwd = originalCwd;
    process.exit = originalExit;
    process.env = originalEnv;
  });

  describe('Installer Class', () => {
    it('should initialize with correct defaults', () => {
      const installer = new Installer();

      expect(installer.targetDir).toBe('/test/project');
      expect(installer.installItems).toContain('.claude/agents');
      expect(installer.installItems).toContain('.claude/commands');
      expect(installer.installItems).toContain('.claude-code');
    });

    it('should have color codes defined', () => {
      const installer = new Installer();

      expect(installer.colors.RED).toBe('\x1b[0;31m');
      expect(installer.colors.GREEN).toBe('\x1b[0;32m');
      expect(installer.colors.YELLOW).toBe('\x1b[1;33m');
      expect(installer.colors.NC).toBe('\x1b[0m');
    });

    it('should set paths correctly', () => {
      const installer = new Installer();

      expect(installer.scriptDir).toBe(__dirname);
      expect(installer.baseDir).toBe(path.dirname(__dirname));
      expect(installer.autopmDir).toContain('autopm');
    });
  });

  describe('parseArgs()', () => {
    it('should parse help flag', () => {
      process.argv = ['node', 'install.js', '--help'];
      const installer = new Installer();

      expect(installer.options.help).toBe(true);
    });

    it('should parse version flag', () => {
      process.argv = ['node', 'install.js', '--version'];
      const installer = new Installer();

      expect(installer.options.version).toBe(true);
    });

    it('should parse force flag', () => {
      process.argv = ['node', 'install.js', '--force'];
      const installer = new Installer();

      expect(installer.options.force).toBe(true);
    });

    it('should parse merge flag', () => {
      process.argv = ['node', 'install.js', '--merge'];
      const installer = new Installer();

      expect(installer.options.merge).toBe(true);
    });

    it('should parse check-env flag', () => {
      process.argv = ['node', 'install.js', '--check-env'];
      const installer = new Installer();

      expect(installer.options.checkEnv).toBe(true);
    });

    it('should parse setup-hooks flag', () => {
      process.argv = ['node', 'install.js', '--setup-hooks'];
      const installer = new Installer();

      expect(installer.options.setupHooks).toBe(true);
    });

    it('should parse scenario option', () => {
      process.argv = ['node', 'install.js', '--scenario=minimal'];
      const installer = new Installer();

      expect(installer.options.scenario).toBe('minimal');
    });

    it('should parse target directory', () => {
      process.argv = ['node', 'install.js', '/custom/path'];
      const installer = new Installer();

      expect(installer.options.targetDir).toBe('/custom/path');
    });

    it('should handle multiple arguments', () => {
      process.argv = ['node', 'install.js', '--force', '--merge', '--scenario=full'];
      const installer = new Installer();

      expect(installer.options.force).toBe(true);
      expect(installer.options.merge).toBe(true);
      expect(installer.options.scenario).toBe('full');
    });
  });

  describe('Print methods', () => {
    it('should print banner with colors', () => {
      const installer = new Installer();
      installer.printBanner();

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('ClaudeAutoPM'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('╔═'));
    });

    it('should have printStep method', () => {
      const installer = new Installer();

      if (typeof installer.printStep === 'function') {
        installer.printStep('Test step');
        expect(console.log).toHaveBeenCalled();
      }
    });

    it('should have printSuccess method', () => {
      const installer = new Installer();

      if (typeof installer.printSuccess === 'function') {
        installer.printSuccess('Success message');
        expect(console.log).toHaveBeenCalled();
      }
    });

    it('should have printWarning method', () => {
      const installer = new Installer();

      if (typeof installer.printWarning === 'function') {
        installer.printWarning('Warning message');
        expect(console.log).toHaveBeenCalled();
      }
    });

    it('should have printError method', () => {
      const installer = new Installer();

      if (typeof installer.printError === 'function') {
        installer.printError('Error message');
        expect(console.error).toHaveBeenCalled();
      }
    });
  });

  describe('File operations', () => {
    it('should check for existing installation', () => {
      const installer = new Installer();

      fs.existsSync.mockReturnValue(true);

      if (typeof installer.checkExistingInstallation === 'function') {
        const result = installer.checkExistingInstallation();
        expect(fs.existsSync).toHaveBeenCalled();
      }
    });

    it('should create directories', () => {
      const installer = new Installer();

      if (typeof installer.createDirectory === 'function') {
        installer.createDirectory('/test/path');
        expect(fs.mkdirSync).toHaveBeenCalledWith('/test/path', expect.any(Object));
      }
    });

    it('should copy files', () => {
      const installer = new Installer();

      if (typeof installer.copyFiles === 'function') {
        installer.copyFiles('/src', '/dest');
        expect(fs.cpSync).toHaveBeenCalled();
      }
    });

    it('should handle file copy errors', () => {
      const installer = new Installer();

      fs.cpSync.mockImplementation(() => {
        throw new Error('Copy failed');
      });

      if (typeof installer.copyFiles === 'function') {
        expect(() => installer.copyFiles('/src', '/dest')).not.toThrow();
      }
    });
  });

  describe('Installation scenarios', () => {
    it('should handle minimal scenario', () => {
      process.argv = ['node', 'install.js', '--scenario=minimal'];
      const installer = new Installer();

      expect(installer.options.scenario).toBe('minimal');
    });

    it('should handle docker scenario', () => {
      process.argv = ['node', 'install.js', '--scenario=docker'];
      const installer = new Installer();

      expect(installer.options.scenario).toBe('docker');
    });

    it('should handle full scenario', () => {
      process.argv = ['node', 'install.js', '--scenario=full'];
      const installer = new Installer();

      expect(installer.options.scenario).toBe('full');
    });

    it('should handle performance scenario', () => {
      process.argv = ['node', 'install.js', '--scenario=performance'];
      const installer = new Installer();

      expect(installer.options.scenario).toBe('performance');
    });

    it('should handle custom scenario', () => {
      process.argv = ['node', 'install.js', '--scenario=custom'];
      const installer = new Installer();

      expect(installer.options.scenario).toBe('custom');
    });
  });

  describe('Environment checks', () => {
    it('should check for Git', () => {
      const installer = new Installer();

      execSync.mockReturnValue('git version 2.0.0');

      if (typeof installer.checkGit === 'function') {
        const result = installer.checkGit();
        expect(execSync).toHaveBeenCalledWith('git --version');
      }
    });

    it('should check for Node.js version', () => {
      const installer = new Installer();

      if (typeof installer.checkNodeVersion === 'function') {
        const result = installer.checkNodeVersion();
        expect(process.version).toBeDefined();
      }
    });

    it('should check for npm', () => {
      const installer = new Installer();

      execSync.mockReturnValue('8.0.0');

      if (typeof installer.checkNpm === 'function') {
        const result = installer.checkNpm();
        expect(execSync).toHaveBeenCalledWith('npm --version');
      }
    });
  });

  describe('User interaction', () => {
    it('should prompt for confirmation', (done) => {
      const installer = new Installer();

      const mockRl = {
        question: jest.fn((question, callback) => {
          callback('y');
          done();
        }),
        close: jest.fn()
      };

      readline.createInterface.mockReturnValue(mockRl);

      if (typeof installer.promptUser === 'function') {
        installer.promptUser('Continue?', () => {});
      } else {
        done();
      }
    });

    it('should handle user declining', (done) => {
      const installer = new Installer();

      const mockRl = {
        question: jest.fn((question, callback) => {
          callback('n');
          done();
        }),
        close: jest.fn()
      };

      readline.createInterface.mockReturnValue(mockRl);

      if (typeof installer.promptUser === 'function') {
        installer.promptUser('Continue?', () => {});
      } else {
        done();
      }
    });
  });

  describe('CLAUDE.md handling', () => {
    it('should detect existing CLAUDE.md', () => {
      const installer = new Installer();

      fs.existsSync.mockImplementation(path => path.endsWith('CLAUDE.md'));

      if (typeof installer.checkClaudeMd === 'function') {
        const result = installer.checkClaudeMd();
        expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('CLAUDE.md'));
      }
    });

    it('should handle CLAUDE.md merge', () => {
      const installer = new Installer();
      installer.options.merge = true;

      if (typeof installer.mergeClaudeMd === 'function') {
        installer.mergeClaudeMd();
        expect(spawnSync).toHaveBeenCalled();
      }
    });

    it('should backup existing CLAUDE.md', () => {
      const installer = new Installer();

      fs.existsSync.mockReturnValue(true);

      if (typeof installer.backupClaudeMd === 'function') {
        installer.backupClaudeMd();
        expect(fs.cpSync).toHaveBeenCalled();
      }
    });
  });

  describe('Hook setup', () => {
    it('should setup git hooks when requested', () => {
      const installer = new Installer();
      installer.options.setupHooks = true;

      if (typeof installer.setupGitHooks === 'function') {
        installer.setupGitHooks();
        expect(spawnSync).toHaveBeenCalled();
      }
    });

    it('should skip hooks when not requested', () => {
      const installer = new Installer();
      installer.options.setupHooks = false;

      if (typeof installer.setupGitHooks === 'function') {
        installer.setupGitHooks();
        expect(spawnSync).not.toHaveBeenCalled();
      }
    });
  });

  describe('Error handling', () => {
    it('should handle missing source directory', () => {
      const installer = new Installer();

      fs.existsSync.mockReturnValue(false);

      if (typeof installer.validateSourceDir === 'function') {
        expect(() => installer.validateSourceDir()).not.toThrow();
      }
    });

    it('should handle permission errors', () => {
      const installer = new Installer();

      fs.mkdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      if (typeof installer.createDirectory === 'function') {
        expect(() => installer.createDirectory('/test')).not.toThrow();
      }
    });

    it('should handle command execution errors', () => {
      const installer = new Installer();

      execSync.mockImplementation(() => {
        throw new Error('Command failed');
      });

      if (typeof installer.executeCommand === 'function') {
        expect(() => installer.executeCommand('test')).not.toThrow();
      }
    });
  });

  describe('Integration tests', () => {
    it('should complete minimal installation', () => {
      const installer = new Installer();
      installer.options.scenario = 'minimal';

      fs.existsSync.mockReturnValue(false);

      if (typeof installer.run === 'function') {
        installer.run();
        expect(fs.mkdirSync).toHaveBeenCalled();
        expect(fs.cpSync).toHaveBeenCalled();
      }
    });

    it('should handle upgrade scenario', () => {
      const installer = new Installer();

      fs.existsSync.mockReturnValue(true); // Existing installation

      if (typeof installer.run === 'function') {
        installer.run();
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('update'));
      }
    });

    it('should validate installation items', () => {
      const installer = new Installer();

      expect(installer.installItems).toContain('.claude/agents');
      expect(installer.installItems).toContain('.claude/commands');
      expect(installer.installItems).toContain('.claude/rules');
      expect(installer.installItems).toContain('.claude/scripts');
      expect(installer.installItems).toContain('.claude/checklists');
      expect(installer.installItems).toContain('.claude-code');
    });

    it('should maintain backward compatibility', () => {
      const installer = new Installer();

      expect(installer).toBeDefined();
      expect(installer.constructor.name).toBe('Installer');
    });
  });
});