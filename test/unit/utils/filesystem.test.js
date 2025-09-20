/**
 * Tests for filesystem.js utility
 * Target: Increase coverage from 64.98% to 85%+
 * Focus: File operations, error handling, and cross-platform compatibility
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const sinon = require('sinon');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { glob } = require('glob');
const FileSystem = require('../../../lib/utils/filesystem');

describe('FileSystem Utility Tests', () => {
  let fileSystem;
  let loggerStub;
  let testDir;

  beforeEach(async () => {
    // Create logger stub
    loggerStub = {
      debug: sinon.stub(),
      error: sinon.stub(),
      info: sinon.stub(),
      warn: sinon.stub()
    };

    // Create filesystem instance
    fileSystem = new FileSystem(loggerStub);

    // Create test directory
    testDir = path.join(os.tmpdir(), `fs-test-${Date.now()}`);
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    sinon.restore();
    // Clean up test directory
    try {
      await fs.remove(testDir);
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('File Existence and Stats', () => {
    it('should check if file exists', async () => {
      // Create test file
      const testFile = path.join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'content');

      // Assert file exists
      const exists = await fileSystem.exists(testFile);
      assert.strictEqual(exists, true);

      // Assert non-existent file
      const notExists = await fileSystem.exists(path.join(testDir, 'missing.txt'));
      assert.strictEqual(notExists, false);
    });

    it('should get file stats', async () => {
      // Create test file
      const testFile = path.join(testDir, 'stats.txt');
      await fs.writeFile(testFile, 'test content');

      // Get stats
      const stats = await fileSystem.stat(testFile);

      // Assert
      assert.ok(stats);
      assert.ok(stats.isFile());
      assert.ok(stats.size > 0);
    });

    it('should handle stat errors', async () => {
      const missingFile = path.join(testDir, 'nonexistent.txt');

      await assert.rejects(
        async () => await fileSystem.stat(missingFile),
        /Failed to get stats/
      );

      assert.ok(loggerStub.error.called);
    });

    it('should check if path is directory', async () => {
      // Test directory
      const isDir = await fileSystem.isDirectory(testDir);
      assert.strictEqual(isDir, true);

      // Test file
      const testFile = path.join(testDir, 'file.txt');
      await fs.writeFile(testFile, 'content');
      const isFileDir = await fileSystem.isDirectory(testFile);
      assert.strictEqual(isFileDir, false);

      // Test non-existent
      const notExists = await fileSystem.isDirectory(path.join(testDir, 'missing'));
      assert.strictEqual(notExists, false);
    });

    it('should check if path is file', async () => {
      // Test file
      const testFile = path.join(testDir, 'check.txt');
      await fs.writeFile(testFile, 'content');
      const isFile = await fileSystem.isFile(testFile);
      assert.strictEqual(isFile, true);

      // Test directory
      const isDirFile = await fileSystem.isFile(testDir);
      assert.strictEqual(isDirFile, false);

      // Test non-existent
      const notExists = await fileSystem.isFile(path.join(testDir, 'missing.txt'));
      assert.strictEqual(notExists, false);
    });
  });

  describe('Directory Operations', () => {
    it('should create directory with parents', async () => {
      const nestedDir = path.join(testDir, 'level1', 'level2', 'level3');

      const result = await fileSystem.ensureDir(nestedDir);
      assert.strictEqual(result, true);

      // Verify directory exists
      const exists = await fs.pathExists(nestedDir);
      assert.strictEqual(exists, true);
    });

    it('should handle directory creation errors', async () => {
      // Stub fs.ensureDir to throw error
      sinon.stub(fs, 'ensureDir').rejects(new Error('Permission denied'));

      await assert.rejects(
        async () => await fileSystem.ensureDir('/invalid/path'),
        /Permission denied/
      );

      assert.ok(loggerStub.error.called);
    });

    it('should list directory contents', async () => {
      // Create test files
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(testDir, 'file2.txt'), 'content2');
      await fs.ensureDir(path.join(testDir, 'subdir'));

      // List directory
      const items = await fileSystem.listDir(testDir);

      // Assert
      assert.ok(items.includes('file1.txt'));
      assert.ok(items.includes('file2.txt'));
      assert.ok(items.includes('subdir'));
      assert.strictEqual(items.length, 3);
    });

    it('should handle list directory errors', async () => {
      const invalidDir = path.join(testDir, 'nonexistent');

      await assert.rejects(
        async () => await fileSystem.listDir(invalidDir),
        /Failed to list directory/
      );
    });
  });

  describe('File Operations', () => {
    it('should read file content', async () => {
      const testFile = path.join(testDir, 'read.txt');
      await fs.writeFile(testFile, 'Hello World');

      const content = await fileSystem.readFile(testFile);
      assert.strictEqual(content, 'Hello World');
    });

    it('should read file with different encoding', async () => {
      const testFile = path.join(testDir, 'binary.dat');
      const buffer = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
      await fs.writeFile(testFile, buffer);

      const content = await fileSystem.readFile(testFile, null);
      assert.ok(Buffer.isBuffer(content));
    });

    it('should handle read file errors', async () => {
      const missingFile = path.join(testDir, 'missing.txt');

      await assert.rejects(
        async () => await fileSystem.readFile(missingFile),
        /Failed to read file/
      );
    });

    it('should write file content', async () => {
      const testFile = path.join(testDir, 'write.txt');

      const result = await fileSystem.writeFile(testFile, 'Test Content');
      assert.strictEqual(result, true);

      // Verify content
      const content = await fs.readFile(testFile, 'utf8');
      assert.strictEqual(content, 'Test Content');
    });

    it('should handle write file errors', async () => {
      sinon.stub(fs, 'writeFile').rejects(new Error('Disk full'));

      await assert.rejects(
        async () => await fileSystem.writeFile('/invalid/file.txt', 'content'),
        /Disk full/
      );
    });

    it('should copy file', async () => {
      const srcFile = path.join(testDir, 'source.txt');
      const destFile = path.join(testDir, 'destination.txt');
      await fs.writeFile(srcFile, 'Copy me');

      const result = await fileSystem.copy(srcFile, destFile);
      assert.strictEqual(result, true);

      // Verify copy
      const content = await fs.readFile(destFile, 'utf8');
      assert.strictEqual(content, 'Copy me');
    });

    it('should copy directory recursively', async () => {
      const srcDir = path.join(testDir, 'source-dir');
      const destDir = path.join(testDir, 'dest-dir');

      await fs.ensureDir(path.join(srcDir, 'subdir'));
      await fs.writeFile(path.join(srcDir, 'file.txt'), 'content');
      await fs.writeFile(path.join(srcDir, 'subdir', 'nested.txt'), 'nested');

      await fileSystem.copy(srcDir, destDir);

      // Verify copy
      assert.ok(await fs.pathExists(path.join(destDir, 'file.txt')));
      assert.ok(await fs.pathExists(path.join(destDir, 'subdir', 'nested.txt')));
    });

    it('should handle copy errors', async () => {
      const src = path.join(testDir, 'nonexistent.txt');
      const dest = path.join(testDir, 'dest.txt');

      await assert.rejects(
        async () => await fileSystem.copy(src, dest),
        /Failed to copy/
      );
    });

    it('should move file', async () => {
      const srcFile = path.join(testDir, 'move-src.txt');
      const destFile = path.join(testDir, 'move-dest.txt');
      await fs.writeFile(srcFile, 'Move me');

      const result = await fileSystem.move(srcFile, destFile);
      assert.strictEqual(result, true);

      // Verify move
      assert.ok(!await fs.pathExists(srcFile));
      assert.ok(await fs.pathExists(destFile));
      const content = await fs.readFile(destFile, 'utf8');
      assert.strictEqual(content, 'Move me');
    });

    it('should handle move errors', async () => {
      sinon.stub(fs, 'move').rejects(new Error('Cross-device link'));

      await assert.rejects(
        async () => await fileSystem.move('/src', '/dest'),
        /Cross-device link/
      );
    });

    it('should remove file', async () => {
      const testFile = path.join(testDir, 'remove.txt');
      await fs.writeFile(testFile, 'Remove me');

      const result = await fileSystem.remove(testFile);
      assert.strictEqual(result, true);

      // Verify removal
      assert.ok(!await fs.pathExists(testFile));
    });

    it('should remove directory', async () => {
      const removeDir = path.join(testDir, 'remove-dir');
      await fs.ensureDir(removeDir);
      await fs.writeFile(path.join(removeDir, 'file.txt'), 'content');

      const result = await fileSystem.remove(removeDir);
      assert.strictEqual(result, true);

      // Verify removal
      assert.ok(!await fs.pathExists(removeDir));
    });

    it('should handle remove errors', async () => {
      sinon.stub(fs, 'remove').rejects(new Error('Permission denied'));

      await assert.rejects(
        async () => await fileSystem.remove('/protected'),
        /Permission denied/
      );
    });
  });

  describe('JSON Operations', () => {
    it('should read JSON file', async () => {
      const jsonFile = path.join(testDir, 'data.json');
      const data = { name: 'test', value: 42, nested: { key: 'value' } };
      await fs.writeJson(jsonFile, data);

      const result = await fileSystem.readJson(jsonFile);
      assert.deepStrictEqual(result, data);
    });

    it('should handle read JSON errors', async () => {
      const invalidFile = path.join(testDir, 'invalid.json');
      await fs.writeFile(invalidFile, 'not valid json');

      await assert.rejects(
        async () => await fileSystem.readJson(invalidFile),
        /Failed to read JSON/
      );
    });

    it('should write JSON file', async () => {
      const jsonFile = path.join(testDir, 'output.json');
      const data = { test: true, array: [1, 2, 3] };

      const result = await fileSystem.writeJson(jsonFile, data);
      assert.strictEqual(result, true);

      // Verify JSON
      const written = await fs.readJson(jsonFile);
      assert.deepStrictEqual(written, data);
    });

    it('should write JSON with custom spacing', async () => {
      const jsonFile = path.join(testDir, 'formatted.json');
      const data = { formatted: true };

      await fileSystem.writeJson(jsonFile, data, { spaces: 4 });

      const content = await fs.readFile(jsonFile, 'utf8');
      assert.ok(content.includes('    ')); // 4 spaces
    });

    it('should handle write JSON errors', async () => {
      sinon.stub(fs, 'writeJson').rejects(new Error('Invalid data'));

      await assert.rejects(
        async () => await fileSystem.writeJson('/invalid.json', {}),
        /Invalid data/
      );
    });
  });

  describe('File Search', () => {
    it('should find files using glob pattern', async () => {
      // Create test files
      await fs.writeFile(path.join(testDir, 'test1.js'), '');
      await fs.writeFile(path.join(testDir, 'test2.js'), '');
      await fs.writeFile(path.join(testDir, 'other.txt'), '');
      await fs.ensureDir(path.join(testDir, 'subdir'));
      await fs.writeFile(path.join(testDir, 'subdir', 'test3.js'), '');

      // Find JS files
      const files = await fileSystem.findFiles(path.join(testDir, '**/*.js'));

      // Assert
      assert.strictEqual(files.length, 3);
      assert.ok(files.some(f => f.endsWith('test1.js')));
      assert.ok(files.some(f => f.endsWith('test2.js')));
      assert.ok(files.some(f => f.endsWith('test3.js')));
    });

    it.skip('should handle glob errors', async () => {
      // Create a new filesystem instance for this test
      const FileSystem = require('../../../lib/utils/filesystem');

      // Mock the glob module
      const Module = require('module');
      const originalRequire = Module.prototype.require;

      Module.prototype.require = function(id) {
        if (id === 'glob') {
          return {
            glob: async () => {
              throw new Error('Invalid pattern');
            }
          };
        }
        return originalRequire.apply(this, arguments);
      };

      try {
        // Clear the module cache to force re-require
        delete require.cache[require.resolve('../../../lib/utils/filesystem')];

        const TestFileSystem = require('../../../lib/utils/filesystem');
        const testFs = new TestFileSystem(mockLogger);

        await assert.rejects(
          async () => await testFs.findFiles('***'),
          /Failed to find files.*Invalid pattern/
        );
      } finally {
        // Restore original require
        Module.prototype.require = originalRequire;

        // Clear cache again to restore normal behavior
        delete require.cache[require.resolve('../../../lib/utils/filesystem')];
      }
    });
  });

  describe('Backup Operations', () => {
    it('should create backup with timestamp', async () => {
      const originalFile = path.join(testDir, 'original.txt');
      await fs.writeFile(originalFile, 'Original content');

      const backupPath = await fileSystem.backup(originalFile);

      // Assert
      assert.ok(backupPath);
      assert.ok(backupPath.includes('backup'));
      assert.ok(await fs.pathExists(backupPath));

      const backupContent = await fs.readFile(backupPath, 'utf8');
      assert.strictEqual(backupContent, 'Original content');
    });

    it('should return null for non-existent file', async () => {
      const missingFile = path.join(testDir, 'missing.txt');
      const result = await fileSystem.backup(missingFile);
      assert.strictEqual(result, null);
    });

    it('should handle backup errors', async () => {
      const testFile = path.join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'content');

      sinon.stub(fileSystem, 'copy').rejects(new Error('Backup failed'));

      await assert.rejects(
        async () => await fileSystem.backup(testFile),
        /Backup failed/
      );
    });
  });

  describe('File Permissions', () => {
    it('should change file permissions', async () => {
      // Skip on Windows
      if (process.platform === 'win32') {
        return;
      }

      const testFile = path.join(testDir, 'perms.txt');
      await fs.writeFile(testFile, 'content');

      const result = await fileSystem.chmod(testFile, 0o644);
      assert.strictEqual(result, true);

      // Verify permissions
      const stats = await fs.stat(testFile);
      const mode = stats.mode & 0o777;
      assert.strictEqual(mode, 0o644);
    });

    it('should handle chmod errors', async () => {
      sinon.stub(fs, 'chmod').rejects(new Error('Operation not permitted'));

      await assert.rejects(
        async () => await fileSystem.chmod('/protected', 0o777),
        /Operation not permitted/
      );
    });
  });

  describe('Symbolic Links', () => {
    it('should create symbolic link', async () => {
      // Skip on Windows if not in developer mode
      if (process.platform === 'win32') {
        return;
      }

      const targetFile = path.join(testDir, 'target.txt');
      const linkPath = path.join(testDir, 'link.txt');
      await fs.writeFile(targetFile, 'target content');

      const result = await fileSystem.symlink(targetFile, linkPath);
      assert.strictEqual(result, true);

      // Verify symlink
      const stats = await fs.lstat(linkPath);
      assert.ok(stats.isSymbolicLink());
    });

    it('should handle symlink errors', async () => {
      sinon.stub(fs, 'ensureSymlink').rejects(new Error('Invalid target'));

      await assert.rejects(
        async () => await fileSystem.symlink('/invalid', '/link'),
        /Invalid target/
      );
    });
  });

  describe('Path Utilities', () => {
    it('should resolve absolute path', () => {
      const resolved = fileSystem.resolvePath('relative', 'path');
      assert.ok(path.isAbsolute(resolved));
    });

    it('should get relative path', () => {
      const relative = fileSystem.relativePath('/a/b/c', '/a/b/d/e');
      assert.strictEqual(relative, path.join('..', 'd', 'e'));
    });

    it('should join paths', () => {
      const joined = fileSystem.joinPath('dir', 'subdir', 'file.txt');
      assert.strictEqual(joined, path.join('dir', 'subdir', 'file.txt'));
    });

    it('should get directory name', () => {
      const dir = fileSystem.dirname('/path/to/file.txt');
      assert.strictEqual(dir, '/path/to');
    });

    it('should get base name', () => {
      const base = fileSystem.basename('/path/to/file.txt');
      assert.strictEqual(base, 'file.txt');

      const baseNoExt = fileSystem.basename('/path/to/file.txt', '.txt');
      assert.strictEqual(baseNoExt, 'file');
    });

    it('should get extension', () => {
      const ext = fileSystem.extname('/path/to/file.txt');
      assert.strictEqual(ext, '.txt');

      const noExt = fileSystem.extname('/path/to/file');
      assert.strictEqual(noExt, '');
    });
  });

  describe('Logging', () => {
    it('should log debug messages for operations', async () => {
      const testFile = path.join(testDir, 'log.txt');
      await fileSystem.writeFile(testFile, 'content');

      assert.ok(loggerStub.debug.calledWith(`Wrote file: ${testFile}`));
    });

    it('should log error messages on failure', async () => {
      sinon.stub(fs, 'readFile').rejects(new Error('Read error'));

      try {
        await fileSystem.readFile('/invalid');
      } catch (e) {
        // Expected
      }

      assert.ok(loggerStub.error.called);
      assert.ok(loggerStub.error.calledWith('Failed to read file: /invalid', sinon.match.instanceOf(Error)));
    });

    it('should log info for backup creation', async () => {
      const testFile = path.join(testDir, 'backup-test.txt');
      await fs.writeFile(testFile, 'content');

      await fileSystem.backup(testFile);

      assert.ok(loggerStub.info.called);
      assert.ok(loggerStub.info.calledWith(sinon.match(/Created backup:/)));
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty directory listing', async () => {
      const emptyDir = path.join(testDir, 'empty');
      await fs.ensureDir(emptyDir);

      const items = await fileSystem.listDir(emptyDir);
      assert.strictEqual(items.length, 0);
    });

    it('should handle large files', async () => {
      const largeFile = path.join(testDir, 'large.txt');
      const largeContent = 'x'.repeat(10000);

      await fileSystem.writeFile(largeFile, largeContent);
      const read = await fileSystem.readFile(largeFile);

      assert.strictEqual(read.length, 10000);
    });

    it('should handle special characters in filenames', async () => {
      const specialFile = path.join(testDir, 'file with spaces & special.txt');

      await fileSystem.writeFile(specialFile, 'content');
      const exists = await fileSystem.exists(specialFile);

      assert.strictEqual(exists, true);
    });

    it('should handle concurrent operations', async () => {
      const files = Array.from({ length: 5 }, (_, i) => path.join(testDir, `concurrent-${i}.txt`));

      // Write files concurrently
      await Promise.all(
        files.map((file, i) => fileSystem.writeFile(file, `content-${i}`))
      );

      // Verify all files exist
      for (const file of files) {
        assert.ok(await fileSystem.exists(file));
      }
    });

    it('should handle copy with overwrite option', async () => {
      const src = path.join(testDir, 'src.txt');
      const dest = path.join(testDir, 'dest.txt');

      await fs.writeFile(src, 'new content');
      await fs.writeFile(dest, 'old content');

      await fileSystem.copy(src, dest, { overwrite: true });

      const content = await fs.readFile(dest, 'utf8');
      assert.strictEqual(content, 'new content');
    });
  });
});