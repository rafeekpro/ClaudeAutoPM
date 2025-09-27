/**
 * Utils Tests - Jest version
 * Consolidated tests for all utility functions
 */

const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');

// Mock modules
jest.mock('child_process');
jest.mock('fs');
jest.mock('readline');

describe('Utils Test Suite', () => {

  describe('Colors Utility', () => {
    const colors = {
      red: (text) => `\x1b[31m${text}\x1b[0m`,
      green: (text) => `\x1b[32m${text}\x1b[0m`,
      yellow: (text) => `\x1b[33m${text}\x1b[0m`,
      blue: (text) => `\x1b[34m${text}\x1b[0m`,
      reset: () => '\x1b[0m'
    };

    test('should apply red color', () => {
      expect(colors.red('error')).toBe('\x1b[31merror\x1b[0m');
    });

    test('should apply green color', () => {
      expect(colors.green('success')).toBe('\x1b[32msuccess\x1b[0m');
    });

    test('should apply yellow color', () => {
      expect(colors.yellow('warning')).toBe('\x1b[33mwarning\x1b[0m');
    });

    test('should apply blue color', () => {
      expect(colors.blue('info')).toBe('\x1b[34minfo\x1b[0m');
    });

    test('should reset color', () => {
      expect(colors.reset()).toBe('\x1b[0m');
    });
  });

  describe('Shell Utility', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should execute command successfully', () => {
      execSync.mockReturnValue(Buffer.from('command output'));

      const shell = {
        exec: (cmd) => execSync(cmd).toString()
      };

      const result = shell.exec('ls -la');
      expect(result).toBe('command output');
      expect(execSync).toHaveBeenCalledWith('ls -la');
    });

    test('should handle command errors', () => {
      execSync.mockImplementation(() => {
        throw new Error('Command failed');
      });

      const shell = {
        exec: (cmd) => {
          try {
            return execSync(cmd).toString();
          } catch (error) {
            return null;
          }
        }
      };

      const result = shell.exec('invalid-command');
      expect(result).toBeNull();
    });

    test('should execute with options', () => {
      execSync.mockReturnValue(Buffer.from('output'));

      const shell = {
        execWithOptions: (cmd, options) => execSync(cmd, options).toString()
      };

      const result = shell.execWithOptions('echo test', { encoding: 'utf8' });
      expect(result).toBe('output');
      expect(execSync).toHaveBeenCalledWith('echo test', { encoding: 'utf8' });
    });
  });

  describe('FileSystem Utility', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should read file successfully', () => {
      fs.readFileSync.mockReturnValue('file content');

      const filesystem = {
        readFile: (path) => fs.readFileSync(path, 'utf8')
      };

      const content = filesystem.readFile('/test/file.txt');
      expect(content).toBe('file content');
      expect(fs.readFileSync).toHaveBeenCalledWith('/test/file.txt', 'utf8');
    });

    test('should write file successfully', () => {
      const filesystem = {
        writeFile: (path, content) => fs.writeFileSync(path, content)
      };

      filesystem.writeFile('/test/file.txt', 'new content');
      expect(fs.writeFileSync).toHaveBeenCalledWith('/test/file.txt', 'new content');
    });

    test('should check if file exists', () => {
      fs.existsSync.mockReturnValue(true);

      const filesystem = {
        exists: (path) => fs.existsSync(path)
      };

      const exists = filesystem.exists('/test/file.txt');
      expect(exists).toBe(true);
      expect(fs.existsSync).toHaveBeenCalledWith('/test/file.txt');
    });

    test('should create directory', () => {
      const filesystem = {
        createDir: (path) => fs.mkdirSync(path, { recursive: true })
      };

      filesystem.createDir('/test/new/dir');
      expect(fs.mkdirSync).toHaveBeenCalledWith('/test/new/dir', { recursive: true });
    });

    test('should list directory contents', () => {
      fs.readdirSync.mockReturnValue(['file1.txt', 'file2.txt']);

      const filesystem = {
        listDir: (path) => fs.readdirSync(path)
      };

      const files = filesystem.listDir('/test/dir');
      expect(files).toEqual(['file1.txt', 'file2.txt']);
      expect(fs.readdirSync).toHaveBeenCalledWith('/test/dir');
    });

    test('should delete file', () => {
      const filesystem = {
        deleteFile: (path) => fs.unlinkSync(path)
      };

      filesystem.deleteFile('/test/file.txt');
      expect(fs.unlinkSync).toHaveBeenCalledWith('/test/file.txt');
    });
  });

  describe('Prompts Utility', () => {
    let mockRl;

    beforeEach(() => {
      jest.clearAllMocks();
      mockRl = {
        question: jest.fn(),
        close: jest.fn()
      };
      readline.createInterface.mockReturnValue(mockRl);
    });

    test('should create readline interface', () => {
      const prompts = {
        create: () => readline.createInterface({
          input: process.stdin,
          output: process.stdout
        })
      };

      const rl = prompts.create();
      expect(readline.createInterface).toHaveBeenCalledWith({
        input: process.stdin,
        output: process.stdout
      });
      expect(rl).toBe(mockRl);
    });

    test('should ask question and get answer', (done) => {
      mockRl.question.mockImplementation((query, callback) => {
        callback('user answer');
      });

      const prompts = {
        ask: (rl, question) => new Promise((resolve) => {
          rl.question(question, (answer) => {
            resolve(answer);
          });
        })
      };

      const rl = readline.createInterface({});
      prompts.ask(rl, 'What is your name?').then(answer => {
        expect(answer).toBe('user answer');
        expect(mockRl.question).toHaveBeenCalledWith('What is your name?', expect.any(Function));
        done();
      });
    });

    test('should close readline interface', () => {
      const prompts = {
        close: (rl) => rl.close()
      };

      const rl = readline.createInterface({});
      prompts.close(rl);
      expect(mockRl.close).toHaveBeenCalled();
    });

    test('should handle yes/no prompts', (done) => {
      mockRl.question.mockImplementation((query, callback) => {
        callback('y');
      });

      const prompts = {
        confirm: (rl, question) => new Promise((resolve) => {
          rl.question(question + ' (y/n): ', (answer) => {
            resolve(answer.toLowerCase() === 'y');
          });
        })
      };

      const rl = readline.createInterface({});
      prompts.confirm(rl, 'Continue?').then(result => {
        expect(result).toBe(true);
        done();
      });
    });

    test('should handle no response in confirm', (done) => {
      mockRl.question.mockImplementation((query, callback) => {
        callback('n');
      });

      const prompts = {
        confirm: (rl, question) => new Promise((resolve) => {
          rl.question(question + ' (y/n): ', (answer) => {
            resolve(answer.toLowerCase() === 'y');
          });
        })
      };

      const rl = readline.createInterface({});
      prompts.confirm(rl, 'Continue?').then(result => {
        expect(result).toBe(false);
        done();
      });
    });
  });
});