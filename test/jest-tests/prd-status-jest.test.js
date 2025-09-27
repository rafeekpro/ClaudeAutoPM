// Mock dependencies before importing
jest.mock('fs');
jest.mock('path');

const fs = require('fs');
const path = require('path');
const PRDStatus = require('../../autopm/.claude/scripts/pm/prd-status.js');

describe('PRDStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    process.exit = jest.fn();
    process.cwd = jest.fn().mockReturnValue('/mock/project');

    // Mock path.join
    path.join.mockImplementation((...args) => args.join('/'));
    path.basename.mockImplementation((filePath, ext) => {
      const name = filePath.split('/').pop();
      return ext ? name.replace(ext, '') : name;
    });
  });

  describe('Constructor', () => {
    it('should initialize with correct prds directory path', () => {
      const status = new PRDStatus();
      expect(status.prdsDir).toBe('/mock/project/.claude/prds');
    });
  });

  describe('getPRDFiles()', () => {
    it('should return empty array when prds directory does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      const status = new PRDStatus();

      const result = status.getPRDFiles();

      expect(result).toEqual([]);
      expect(fs.existsSync).toHaveBeenCalledWith('/mock/project/.claude/prds');
    });

    it('should return filtered markdown files from prds directory', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue([
        'feature1.md',
        'feature2.md',
        'not-a-prd.txt',
        'feature3.md'
      ]);

      const status = new PRDStatus();
      const result = status.getPRDFiles();

      expect(result).toEqual([
        '/mock/project/.claude/prds/feature1.md',
        '/mock/project/.claude/prds/feature2.md',
        '/mock/project/.claude/prds/feature3.md'
      ]);
      expect(fs.readdirSync).toHaveBeenCalledWith('/mock/project/.claude/prds');
    });

    it('should handle empty prds directory', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue([]);

      const status = new PRDStatus();
      const result = status.getPRDFiles();

      expect(result).toEqual([]);
    });
  });

  describe('extractStatus()', () => {
    it('should extract status from file content', () => {
      const fileContent = `# Feature PRD
status: in-progress
name: User Authentication

Content here...`;

      fs.readFileSync.mockReturnValue(fileContent);
      const status = new PRDStatus();

      const result = status.extractStatus('/path/to/file.md');

      expect(result).toBe('in-progress');
      expect(fs.readFileSync).toHaveBeenCalledWith('/path/to/file.md', 'utf-8');
    });

    it('should return "backlog" when no status found', () => {
      const fileContent = `# Feature PRD
name: User Authentication

Content without status...`;

      fs.readFileSync.mockReturnValue(fileContent);
      const status = new PRDStatus();

      const result = status.extractStatus('/path/to/file.md');

      expect(result).toBe('backlog');
    });

    it('should handle file read errors gracefully', () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const status = new PRDStatus();
      const result = status.extractStatus('/path/to/missing.md');

      expect(result).toBe('backlog');
    });

    it('should handle various status formats', () => {
      const testCases = [
        { content: 'status: completed', expected: 'completed' },
        { content: 'status:   active  ', expected: 'active' },
        { content: 'status: draft\nother content', expected: 'draft' },
        { content: 'no status here', expected: 'backlog' }
      ];

      const status = new PRDStatus();

      testCases.forEach(({ content, expected }) => {
        fs.readFileSync.mockReturnValue(content);
        expect(status.extractStatus('/test.md')).toBe(expected);
      });
    });
  });

  describe('extractName()', () => {
    it('should extract name from file content', () => {
      const fileContent = `# Feature PRD
name: User Authentication System
status: in-progress

Content here...`;

      fs.readFileSync.mockReturnValue(fileContent);
      const status = new PRDStatus();

      const result = status.extractName('/path/to/user-auth.md');

      expect(result).toBe('User Authentication System');
    });

    it('should fall back to filename when no name found', () => {
      const fileContent = `# Feature PRD
status: in-progress

Content without name...`;

      fs.readFileSync.mockReturnValue(fileContent);
      path.basename.mockReturnValue('feature-name');

      const status = new PRDStatus();
      const result = status.extractName('/path/to/feature-name.md');

      expect(result).toBe('feature-name');
      expect(path.basename).toHaveBeenCalledWith('/path/to/feature-name.md', '.md');
    });

    it('should handle file read errors gracefully', () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });
      path.basename.mockReturnValue('fallback-name');

      const status = new PRDStatus();
      const result = status.extractName('/path/to/missing.md');

      expect(result).toBe('fallback-name');
    });
  });

  describe('categorizeStatus()', () => {
    const status = new PRDStatus();

    it('should categorize backlog statuses', () => {
      expect(status.categorizeStatus('backlog')).toBe('backlog');
      expect(status.categorizeStatus('draft')).toBe('backlog');
      expect(status.categorizeStatus('')).toBe('backlog');
      expect(status.categorizeStatus('BACKLOG')).toBe('backlog');
    });

    it('should categorize in-progress statuses', () => {
      expect(status.categorizeStatus('in-progress')).toBe('in_progress');
      expect(status.categorizeStatus('active')).toBe('in_progress');
      expect(status.categorizeStatus('IN-PROGRESS')).toBe('in_progress');
      expect(status.categorizeStatus('ACTIVE')).toBe('in_progress');
    });

    it('should categorize implemented statuses', () => {
      expect(status.categorizeStatus('implemented')).toBe('implemented');
      expect(status.categorizeStatus('completed')).toBe('implemented');
      expect(status.categorizeStatus('done')).toBe('implemented');
      expect(status.categorizeStatus('IMPLEMENTED')).toBe('implemented');
    });

    it('should default to backlog for unknown statuses', () => {
      expect(status.categorizeStatus('unknown')).toBe('backlog');
      expect(status.categorizeStatus('pending')).toBe('backlog');
      expect(status.categorizeStatus('review')).toBe('backlog');
    });
  });

  describe('drawBar()', () => {
    const status = new PRDStatus();

    it('should draw progress bar correctly', () => {
      expect(status.drawBar(5, 10, 10)).toBe('█████');
      expect(status.drawBar(2, 4, 8)).toBe('████');
      expect(status.drawBar(0, 10, 5)).toBe('');
      expect(status.drawBar(10, 10, 20)).toBe('████████████████████');
    });

    it('should handle edge cases', () => {
      expect(status.drawBar(0, 0, 10)).toBe('');
      expect(status.drawBar(1, 1, 1)).toBe('█');
      expect(status.drawBar(3, 3, 0)).toBe('');
    });

    it('should round correctly', () => {
      expect(status.drawBar(1, 3, 6)).toBe('██'); // 1/3 * 6 = 2
      expect(status.drawBar(2, 3, 6)).toBe('████'); // 2/3 * 6 = 4
    });
  });

  describe('run()', () => {
    it('should display message when no PRD directory exists', () => {
      const status = new PRDStatus();
      status.getPRDFiles = jest.fn().mockReturnValue([]);
      fs.existsSync.mockReturnValue(false);

      status.run();

      expect(console.log).toHaveBeenCalledWith('📄 PRD Status Report');
      expect(console.log).toHaveBeenCalledWith('No PRD directory found.');
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it('should display message when PRD directory exists but no PRDs found', () => {
      const status = new PRDStatus();
      status.getPRDFiles = jest.fn().mockReturnValue([]);
      fs.existsSync.mockReturnValue(true);

      status.run();

      expect(console.log).toHaveBeenCalledWith('No PRDs found.');
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it('should display PRD status report with distribution', () => {
      const mockPRDs = [
        '/path/prd1.md',
        '/path/prd2.md',
        '/path/prd3.md'
      ];

      const status = new PRDStatus();
      status.getPRDFiles = jest.fn().mockReturnValue(mockPRDs);
      status.extractStatus = jest.fn()
        .mockReturnValueOnce('backlog')
        .mockReturnValueOnce('in-progress')
        .mockReturnValueOnce('completed');
      status.extractName = jest.fn()
        .mockReturnValueOnce('Feature 1')
        .mockReturnValueOnce('Feature 2')
        .mockReturnValueOnce('Feature 3');
      status.categorizeStatus = jest.fn()
        .mockReturnValueOnce('backlog')
        .mockReturnValueOnce('in_progress')
        .mockReturnValueOnce('implemented');
      status.drawBar = jest.fn()
        .mockReturnValueOnce('█')
        .mockReturnValueOnce('█')
        .mockReturnValueOnce('█');

      fs.statSync = jest.fn().mockReturnValue({
        mtime: new Date('2024-01-15T10:00:00Z')
      });

      status.run();

      expect(console.log).toHaveBeenCalledWith('📄 PRD Status Report');
      expect(console.log).toHaveBeenCalledWith('📊 Distribution:');
      expect(console.log).toHaveBeenCalledWith('  Backlog:     1   [█]');
      expect(console.log).toHaveBeenCalledWith('  In Progress: 1   [█]');
      expect(console.log).toHaveBeenCalledWith('  Implemented: 1   [█]');
      expect(console.log).toHaveBeenCalledWith('  Total PRDs: 3');
      expect(console.log).toHaveBeenCalledWith('📅 Recent PRDs (last 5 modified):');
      expect(console.log).toHaveBeenCalledWith('💡 Next Actions:');
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it('should show recent PRDs sorted by modification time', () => {
      const mockPRDs = ['/prd1.md', '/prd2.md'];
      const status = new PRDStatus();
      status.getPRDFiles = jest.fn().mockReturnValue(mockPRDs);
      status.extractStatus = jest.fn().mockReturnValue('backlog');
      status.extractName = jest.fn()
        .mockReturnValueOnce('Newer Feature')
        .mockReturnValueOnce('Older Feature');
      status.categorizeStatus = jest.fn().mockReturnValue('backlog');
      status.drawBar = jest.fn().mockReturnValue('█');

      fs.statSync = jest.fn()
        .mockReturnValueOnce({ mtime: new Date('2024-01-20') })
        .mockReturnValueOnce({ mtime: new Date('2024-01-10') });

      status.run();

      expect(console.log).toHaveBeenCalledWith('  • Newer Feature');
      expect(console.log).toHaveBeenCalledWith('  • Older Feature');
    });

    it('should provide relevant next actions based on PRD status counts', () => {
      const mockPRDs = ['/prd1.md', '/prd2.md'];
      const status = new PRDStatus();
      status.getPRDFiles = jest.fn().mockReturnValue(mockPRDs);
      status.extractStatus = jest.fn()
        .mockReturnValueOnce('backlog')
        .mockReturnValueOnce('in-progress');
      status.extractName = jest.fn()
        .mockReturnValueOnce('Feature 1')
        .mockReturnValueOnce('Feature 2');
      status.categorizeStatus = jest.fn()
        .mockReturnValueOnce('backlog')
        .mockReturnValueOnce('in_progress');
      status.drawBar = jest.fn().mockReturnValue('█');

      fs.statSync = jest.fn().mockReturnValue({
        mtime: new Date('2024-01-15')
      });

      status.run();

      expect(console.log).toHaveBeenCalledWith('  • Parse backlog PRDs to epics: /pm:prd-parse <name>');
      expect(console.log).toHaveBeenCalledWith('  • Check progress on active PRDs: /pm:epic-status <name>');
    });

    it('should limit recent PRDs to 5 items', () => {
      const mockPRDs = Array.from({ length: 7 }, (_, i) => `/prd${i + 1}.md`);
      const status = new PRDStatus();
      status.getPRDFiles = jest.fn().mockReturnValue(mockPRDs);
      status.extractStatus = jest.fn().mockReturnValue('backlog');
      status.extractName = jest.fn().mockImplementation((_, i) => `Feature ${i + 1}`);
      status.categorizeStatus = jest.fn().mockReturnValue('backlog');
      status.drawBar = jest.fn().mockReturnValue('█');

      fs.statSync = jest.fn().mockImplementation((_, i) => ({
        mtime: new Date(`2024-01-${10 + i}`)
      }));

      status.run();

      // Should show only 5 recent PRDs, not all 7
      const recentPRDLogs = console.log.mock.calls.filter(call =>
        call[0] && call[0].includes('  • Feature')
      );
      expect(recentPRDLogs).toHaveLength(5);
    });
  });

  describe('Integration Tests', () => {
    it('should maintain backward compatibility', () => {
      const PRDStatusClass = require('../../autopm/.claude/scripts/pm/prd-status.js');
      expect(typeof PRDStatusClass).toBe('function');
      expect(PRDStatusClass.prototype).toHaveProperty('getPRDFiles');
      expect(PRDStatusClass.prototype).toHaveProperty('extractStatus');
      expect(PRDStatusClass.prototype).toHaveProperty('extractName');
      expect(PRDStatusClass.prototype).toHaveProperty('categorizeStatus');
      expect(PRDStatusClass.prototype).toHaveProperty('drawBar');
      expect(PRDStatusClass.prototype).toHaveProperty('run');
    });

    it('should handle realistic PRD workflow', () => {
      const mockPRDs = [
        '/project/.claude/prds/user-auth.md',
        '/project/.claude/prds/payment-system.md',
        '/project/.claude/prds/dashboard.md'
      ];

      const status = new PRDStatus();
      status.getPRDFiles = jest.fn().mockReturnValue(mockPRDs);

      // Simulate realistic file contents
      fs.readFileSync = jest.fn()
        .mockReturnValueOnce('name: User Authentication\nstatus: in-progress\n\nContent...')
        .mockReturnValueOnce('name: Payment System\nstatus: completed\n\nContent...')
        .mockReturnValueOnce('name: Dashboard\nstatus: backlog\n\nContent...')
        .mockReturnValueOnce('name: User Authentication\nstatus: in-progress\n\nContent...')
        .mockReturnValueOnce('name: Payment System\nstatus: completed\n\nContent...')
        .mockReturnValueOnce('name: Dashboard\nstatus: backlog\n\nContent...');

      fs.statSync = jest.fn()
        .mockReturnValueOnce({ mtime: new Date('2024-01-20') })
        .mockReturnValueOnce({ mtime: new Date('2024-01-18') })
        .mockReturnValueOnce({ mtime: new Date('2024-01-15') });

      status.run();

      expect(console.log).toHaveBeenCalledWith('  Total PRDs: 3');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('  Backlog:     1   ['));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('  In Progress: 1   ['));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('  Implemented: 1   ['));
      expect(console.log).toHaveBeenCalledWith('  • User Authentication');
      expect(console.log).toHaveBeenCalledWith('  • Payment System');
      expect(console.log).toHaveBeenCalledWith('  • Dashboard');
      expect(process.exit).toHaveBeenCalledWith(0);
    });
  });
});