/**
 * Filesystem utility for cross-platform file operations
 * Wraps fs-extra with additional safety and logging
 */

const fs = require('fs-extra');
const path = require('path');
const { glob } = require('glob');

class FileSystem {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Check if a path exists
   */
  async exists(filepath) {
    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create directory with parents if needed
   */
  async ensureDir(dirPath) {
    try {
      await fs.ensureDir(dirPath);
      this.logger.debug(`Created directory: ${dirPath}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to create directory: ${dirPath}`, error);
      throw error;
    }
  }

  /**
   * Copy file or directory
   */
  async copy(src, dest, options = {}) {
    try {
      await fs.copy(src, dest, options);
      this.logger.debug(`Copied: ${src} → ${dest}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to copy: ${src} → ${dest}`, error);
      const newError = new Error(`Failed to copy: ${error.message}`);
      newError.code = error.code;
      newError.src = src;
      newError.dest = dest;
      throw newError;
    }
  }

  /**
   * Move file or directory
   */
  async move(src, dest, options = {}) {
    try {
      await fs.move(src, dest, options);
      this.logger.debug(`Moved: ${src} → ${dest}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to move: ${src} → ${dest}`, error);
      throw error;
    }
  }

  /**
   * Remove file or directory
   */
  async remove(filepath) {
    try {
      await fs.remove(filepath);
      this.logger.debug(`Removed: ${filepath}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to remove: ${filepath}`, error);
      throw error;
    }
  }

  /**
   * Read file content
   */
  async readFile(filepath, encoding = 'utf8') {
    try {
      const content = await fs.readFile(filepath, encoding);
      this.logger.debug(`Read file: ${filepath}`);
      return content;
    } catch (error) {
      this.logger.error(`Failed to read file: ${filepath}`, error);
      const newError = new Error(`Failed to read file: ${error.message}`);
      newError.code = error.code;
      newError.path = error.path;
      throw newError;
    }
  }

  /**
   * Write file content
   */
  async writeFile(filepath, content, options = {}) {
    try {
      await fs.writeFile(filepath, content, options);
      this.logger.debug(`Wrote file: ${filepath}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to write file: ${filepath}`, error);
      throw error;
    }
  }

  /**
   * Read JSON file
   */
  async readJson(filepath) {
    try {
      const data = await fs.readJson(filepath);
      this.logger.debug(`Read JSON: ${filepath}`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to read JSON: ${filepath}`, error);
      const newError = new Error(`Failed to read JSON: ${error.message}`);
      newError.code = error.code;
      newError.path = filepath;
      throw newError;
    }
  }

  /**
   * Write JSON file
   */
  async writeJson(filepath, data, options = { spaces: 2 }) {
    try {
      await fs.writeJson(filepath, data, options);
      this.logger.debug(`Wrote JSON: ${filepath}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to write JSON: ${filepath}`, error);
      throw error;
    }
  }

  /**
   * List directory contents
   */
  async listDir(dirPath, options = {}) {
    try {
      const items = await fs.readdir(dirPath, options);
      this.logger.debug(`Listed directory: ${dirPath}`);
      return items;
    } catch (error) {
      this.logger.error(`Failed to list directory: ${dirPath}`, error);
      const newError = new Error(`Failed to list directory: ${error.message}`);
      newError.code = error.code;
      newError.path = error.path;
      throw newError;
    }
  }

  /**
   * Find files using glob pattern
   */
  async findFiles(pattern, options = {}) {
    try {
      const files = await glob(pattern, options);
      this.logger.debug(`Found ${files.length} files matching: ${pattern}`);
      return files;
    } catch (error) {
      this.logger.error(`Failed to find files: ${pattern}`, error);
      const newError = new Error(`Failed to find files: ${error.message}`);
      newError.code = error.code;
      newError.pattern = pattern;
      throw newError;
    }
  }

  /**
   * Get file stats
   */
  async stat(filepath) {
    try {
      const stats = await fs.stat(filepath);
      this.logger.debug(`Got stats for: ${filepath}`);
      return stats;
    } catch (error) {
      this.logger.error(`Failed to get stats: ${filepath}`, error);
      const newError = new Error(`Failed to get stats: ${error.message}`);
      newError.code = error.code;
      newError.path = error.path;
      throw newError;
    }
  }

  /**
   * Check if path is a directory
   */
  async isDirectory(filepath) {
    try {
      const stats = await this.stat(filepath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Check if path is a file
   */
  async isFile(filepath) {
    try {
      const stats = await this.stat(filepath);
      return stats.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Create backup with timestamp
   */
  async backup(filepath) {
    if (!await this.exists(filepath)) {
      return null;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${filepath}.backup-${timestamp}`;

    try {
      await this.copy(filepath, backupPath);
      this.logger.info(`Created backup: ${backupPath}`);
      return backupPath;
    } catch (error) {
      this.logger.error(`Failed to create backup: ${filepath}`, error);
      throw error;
    }
  }

  /**
   * Set file permissions
   */
  async chmod(filepath, mode) {
    try {
      await fs.chmod(filepath, mode);
      this.logger.debug(`Changed permissions: ${filepath} to ${mode.toString(8)}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to change permissions: ${filepath}`, error);
      throw error;
    }
  }

  /**
   * Create symbolic link
   */
  async symlink(target, linkPath) {
    try {
      await fs.ensureSymlink(target, linkPath);
      this.logger.debug(`Created symlink: ${linkPath} → ${target}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to create symlink: ${linkPath}`, error);
      throw error;
    }
  }

  /**
   * Get absolute path
   */
  resolvePath(...paths) {
    return path.resolve(...paths);
  }

  /**
   * Get relative path
   */
  relativePath(from, to) {
    return path.relative(from, to);
  }

  /**
   * Join paths
   */
  joinPath(...paths) {
    return path.join(...paths);
  }

  /**
   * Get directory name
   */
  dirname(filepath) {
    return path.dirname(filepath);
  }

  /**
   * Get base name
   */
  basename(filepath, ext) {
    return path.basename(filepath, ext);
  }

  /**
   * Get extension
   */
  extname(filepath) {
    return path.extname(filepath);
  }
}

module.exports = FileSystem;