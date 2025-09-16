/**
 * Shell command execution utility
 * Wraps execa for safe cross-platform command execution
 */

const { execa } = require('execa');
const which = require('which');

class Shell {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Execute a command
   */
  async exec(command, args = [], options = {}) {
    try {
      this.logger.debug(`Executing: ${command} ${args.join(' ')}`);

      const result = await execa(command, args, {
        ...options,
        preferLocal: true,
        reject: false
      });

      if (result.exitCode !== 0) {
        throw new Error(`Command failed with exit code ${result.exitCode}: ${result.stderr}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to execute: ${command}`, error);
      throw error;
    }
  }

  /**
   * Execute command and return stdout
   */
  async execOutput(command, args = [], options = {}) {
    const result = await this.exec(command, args, options);
    return result.stdout;
  }

  /**
   * Check if command exists
   */
  async commandExists(command) {
    try {
      await which(command);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Execute git command
   */
  async git(args, options = {}) {
    return this.exec('git', args, options);
  }

  /**
   * Execute npm command
   */
  async npm(args, options = {}) {
    return this.exec('npm', args, options);
  }

  /**
   * Execute node command
   */
  async node(args, options = {}) {
    return this.exec('node', args, options);
  }

  /**
   * Get current git branch
   */
  async getCurrentBranch() {
    try {
      const branch = await this.execOutput('git', ['branch', '--show-current']);
      return branch.trim();
    } catch {
      return null;
    }
  }

  /**
   * Check if in git repository
   */
  async isGitRepo() {
    try {
      await this.exec('git', ['rev-parse', '--git-dir']);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get git remote URL
   */
  async getGitRemote(remote = 'origin') {
    try {
      const url = await this.execOutput('git', ['remote', 'get-url', remote]);
      return url.trim();
    } catch {
      return null;
    }
  }

  /**
   * Run command with live output
   */
  async execInteractive(command, args = [], options = {}) {
    this.logger.debug(`Executing interactive: ${command} ${args.join(' ')}`);

    return execa(command, args, {
      ...options,
      preferLocal: true,
      stdio: 'inherit'
    });
  }

  /**
   * Execute shell script content
   */
  async execScript(script, options = {}) {
    const shell = process.platform === 'win32' ? 'powershell' : 'bash';
    return this.exec(shell, ['-c', script], options);
  }

  /**
   * Get environment variable
   */
  getEnv(key, defaultValue = '') {
    return process.env[key] || defaultValue;
  }

  /**
   * Set environment variable
   */
  setEnv(key, value) {
    process.env[key] = value;
  }

  /**
   * Check if running in CI
   */
  isCI() {
    return process.env.CI === 'true' || process.env.CONTINUOUS_INTEGRATION === 'true';
  }

  /**
   * Get platform
   */
  getPlatform() {
    return process.platform;
  }

  /**
   * Check if Windows
   */
  isWindows() {
    return process.platform === 'win32';
  }

  /**
   * Check if macOS
   */
  isMacOS() {
    return process.platform === 'darwin';
  }

  /**
   * Check if Linux
   */
  isLinux() {
    return process.platform === 'linux';
  }

  /**
   * Execute with timeout
   */
  async execWithTimeout(command, args = [], timeout = 30000, options = {}) {
    return this.exec(command, args, {
      ...options,
      timeout
    });
  }

  /**
   * Execute and parse JSON output
   */
  async execJson(command, args = [], options = {}) {
    const output = await this.execOutput(command, args, options);
    try {
      return JSON.parse(output);
    } catch (error) {
      this.logger.error(`Failed to parse JSON output from: ${command}`, error);
      throw error;
    }
  }

  /**
   * Check GitHub CLI availability
   */
  async hasGitHubCLI() {
    return this.commandExists('gh');
  }

  /**
   * Check Azure CLI availability
   */
  async hasAzureCLI() {
    return this.commandExists('az');
  }

  /**
   * Check Docker availability
   */
  async hasDocker() {
    return this.commandExists('docker');
  }

  /**
   * Check kubectl availability
   */
  async hasKubectl() {
    return this.commandExists('kubectl');
  }
}

module.exports = Shell;