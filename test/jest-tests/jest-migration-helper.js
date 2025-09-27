/**
 * Jest Migration Helper
 * Utilities for testing bash to Node.js migration
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

class MigrationTestHelper {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..');
    this.scriptsPath = path.join(this.projectRoot, 'autopm', '.claude', 'scripts');
  }

  /**
   * Run bash version of a script
   */
  async runBashVersion(scriptName, args = [], options = {}) {
    const scriptPath = this.findScript(scriptName, '.sh');
    return this.executeCommand('bash', [scriptPath, ...args], options);
  }

  /**
   * Run Node.js version of a script
   */
  async runNodeVersion(scriptName, args = [], options = {}) {
    const scriptPath = this.findScript(scriptName, '.js');
    return this.executeCommand('node', [scriptPath, ...args], options);
  }

  /**
   * Find script by name and extension
   */
  findScript(scriptName, extension) {
    // Remove extension if provided in scriptName
    const baseName = scriptName.replace(/\.(sh|js)$/, '');

    // Search in multiple locations
    const searchPaths = [
      path.join(this.scriptsPath, baseName + extension),
      path.join(this.scriptsPath, 'pm', baseName + extension),
      path.join(this.scriptsPath, 'mcp', baseName + extension),
    ];

    for (const scriptPath of searchPaths) {
      if (fs.existsSync(scriptPath)) {
        return scriptPath;
      }
    }

    throw new Error(`Script not found: ${baseName}${extension} in ${searchPaths.join(', ')}`);
  }

  /**
   * Execute a command and capture output
   */
  async executeCommand(command, args, options = {}) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const child = spawn(command, args, {
        cwd: options.cwd || this.projectRoot,
        env: { ...process.env, ...options.env },
        timeout: options.timeout || 10000
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          exitCode: code,
          stdout,
          stderr,
          duration: Date.now() - startTime
        });
      });

      child.on('error', (error) => {
        resolve({
          exitCode: -1,
          stdout,
          stderr: error.message,
          duration: Date.now() - startTime
        });
      });

      // Send input if provided
      if (options.input) {
        child.stdin.write(options.input);
        child.stdin.end();
      }
    });
  }

  /**
   * Compare outputs of bash and Node versions
   */
  async compareBashVsNode(scriptName, args = [], options = {}) {
    const [bashResult, nodeResult] = await Promise.all([
      this.runBashVersion(scriptName, args, options),
      this.runNodeVersion(scriptName, args, options)
    ]);

    const diff = require('jest-diff').diff(bashResult.stdout, nodeResult.stdout, {
      expand: false,
      contextLines: 3
    });

    return {
      bash: bashResult,
      node: nodeResult,
      identical: bashResult.stdout === nodeResult.stdout && bashResult.exitCode === nodeResult.exitCode,
      diff
    };
  }

  /**
   * Create a test repository for git operations
   */
  async createTestRepository() {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'autopm-test-repo-'));

    // Initialize git repo
    execSync('git init', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });

    return {
      path: tempDir,
      async createFile(filename, content = 'test content') {
        const filePath = path.join(tempDir, filename);
        await fs.ensureDir(path.dirname(filePath));
        await fs.writeFile(filePath, content);
        return filePath;
      },
      async stageFile(filename) {
        execSync(`git add ${filename}`, { cwd: tempDir });
      },
      async commit(message) {
        execSync(`git commit -m "${message}"`, { cwd: tempDir });
      },
      async cleanup() {
        await fs.remove(tempDir);
      }
    };
  }

  /**
   * Create a test project structure
   */
  async createTestProject() {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'autopm-test-project-'));

    // Create basic project structure
    await fs.ensureDir(path.join(tempDir, '.claude', 'epics'));
    await fs.ensureDir(path.join(tempDir, '.claude', 'scripts'));
    await fs.ensureDir(path.join(tempDir, '.claude', 'agents'));

    return {
      path: tempDir,
      async cleanup() {
        await fs.remove(tempDir);
      }
    };
  }

  /**
   * Run a script and capture output
   */
  async runScript(scriptName, args = [], options = {}) {
    // Prefer Node.js version if it exists
    try {
      return await this.runNodeVersion(scriptName, args, options);
    } catch (e) {
      // Fall back to bash version
      return await this.runBashVersion(scriptName, args, options);
    }
  }
}

// Export singleton instance
module.exports = new MigrationTestHelper();

// Also export class for custom instances
module.exports.MigrationTestHelper = MigrationTestHelper;