#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('merge-claude.js migration', () => {
  let tempDir;
  const scriptPath = path.join(__dirname, '../../../install/merge-claude.js');

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-test-'));
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
      expect(result).toContain('CLAUDE.md Merge Helper');
      expect(result).toContain('Usage:');
    });

    test('should validate required files', () => {
      try {
        execSync(`node ${scriptPath} non-existent.md template.md`, { encoding: 'utf-8' });
        fail('Should have thrown');
      } catch (error) {
        expect(error.stderr || error.message).toContain('does not exist');
      }
    });
  });

  describe('Merge operations', () => {
    test('should generate merge prompt', () => {
      const existingPath = path.join(tempDir, 'existing.md');
      const templatePath = path.join(tempDir, 'template.md');
      const outputPath = path.join(tempDir, 'merge-prompt.md');

      fs.writeFileSync(existingPath, '# Existing\nCustom content\n');
      fs.writeFileSync(templatePath, '# Template\nNew features\n');

      execSync(`node ${scriptPath} ${existingPath} ${templatePath} --prompt ${outputPath}`, {
        encoding: 'utf-8'
      });

      expect(fs.existsSync(outputPath)).toBe(true);
      const content = fs.readFileSync(outputPath, 'utf-8');
      expect(content).toContain('AI-Assisted CLAUDE.md Merge');
      expect(content).toContain('Custom content');
      expect(content).toContain('New features');
    });

    test('should perform simple merge', () => {
      const existingPath = path.join(tempDir, 'existing.md');
      const templatePath = path.join(tempDir, 'template.md');
      const outputPath = path.join(tempDir, 'merged.md');

      fs.writeFileSync(existingPath, '# Project\n## Custom Section\nUser content\n');
      fs.writeFileSync(templatePath, '# Project\n## Framework Section\nFramework features\n');

      execSync(`node ${scriptPath} ${existingPath} ${templatePath} --output ${outputPath}`, {
        encoding: 'utf-8'
      });

      const merged = fs.readFileSync(outputPath, 'utf-8');
      expect(merged).toContain('Custom Section');
      expect(merged).toContain('Framework Section');
    });

    test('should preserve user customizations', () => {
      const existingPath = path.join(tempDir, 'existing.md');
      const templatePath = path.join(tempDir, 'template.md');
      const outputPath = path.join(tempDir, 'merged.md');

      const existingContent = `# CLAUDE.md
## User Preferences
- Custom tone: friendly
- Special rules: my rules

## Agents
- custom-agent.md
`;

      const templateContent = `# CLAUDE.md
## Framework Configuration
- New feature: enabled

## Agents
- framework-agent.md
`;

      fs.writeFileSync(existingPath, existingContent);
      fs.writeFileSync(templatePath, templateContent);

      execSync(`node ${scriptPath} ${existingPath} ${templatePath} --output ${outputPath}`, {
        encoding: 'utf-8'
      });

      const merged = fs.readFileSync(outputPath, 'utf-8');
      expect(merged).toContain('Custom tone: friendly');
      expect(merged).toContain('Special rules: my rules');
      expect(merged).toContain('New feature: enabled');
      expect(merged).toContain('custom-agent.md');
      expect(merged).toContain('framework-agent.md');
    });

    test('should handle conflicts intelligently', () => {
      const existingPath = path.join(tempDir, 'existing.md');
      const templatePath = path.join(tempDir, 'template.md');
      const outputPath = path.join(tempDir, 'merged.md');

      const existingContent = `# CLAUDE.md
## Version
1.0.0

## Settings
debug: true
`;

      const templateContent = `# CLAUDE.md
## Version
2.0.0

## Settings
debug: false
verbose: true
`;

      fs.writeFileSync(existingPath, existingContent);
      fs.writeFileSync(templatePath, templateContent);

      execSync(`node ${scriptPath} ${existingPath} ${templatePath} --output ${outputPath} --prefer-existing`, {
        encoding: 'utf-8'
      });

      const merged = fs.readFileSync(outputPath, 'utf-8');
      expect(merged).toContain('2.0.0'); // Should update version
      expect(merged).toContain('debug: true'); // Should keep user preference
      expect(merged).toContain('verbose: true'); // Should add new setting
    });
  });

  describe('Backup and safety', () => {
    test('should create backup of existing file', () => {
      const existingPath = path.join(tempDir, 'CLAUDE.md');
      const templatePath = path.join(tempDir, 'template.md');

      fs.writeFileSync(existingPath, '# Original content\n');
      fs.writeFileSync(templatePath, '# Template\n');

      execSync(`node ${scriptPath} ${existingPath} ${templatePath} --in-place`, {
        encoding: 'utf-8'
      });

      const backups = fs.readdirSync(tempDir).filter(f => f.startsWith('CLAUDE.md.backup'));
      expect(backups.length).toBeGreaterThan(0);
    });

    test('should validate markdown syntax', () => {
      const existingPath = path.join(tempDir, 'existing.md');
      const templatePath = path.join(tempDir, 'template.md');

      fs.writeFileSync(existingPath, '# Valid markdown\n- Item 1\n- Item 2\n');
      fs.writeFileSync(templatePath, '# Template\n## Section\n');

      const result = execSync(`node ${scriptPath} ${existingPath} ${templatePath} --validate`, {
        encoding: 'utf-8'
      });

      expect(result).toContain('Valid markdown');
    });
  });

  describe('Interactive mode', () => {
    test('should show diff preview', () => {
      const existingPath = path.join(tempDir, 'existing.md');
      const templatePath = path.join(tempDir, 'template.md');

      fs.writeFileSync(existingPath, '# Existing\nLine 1\n');
      fs.writeFileSync(templatePath, '# Template\nLine 2\n');

      const result = execSync(`node ${scriptPath} ${existingPath} ${templatePath} --diff`, {
        encoding: 'utf-8'
      });

      expect(result).toContain('Existing');
      expect(result).toContain('Template');
    });
  });

  describe('Backward compatibility', () => {
    test('should support same command-line options as bash version', () => {
      const existingPath = path.join(tempDir, 'existing.md');
      const templatePath = path.join(tempDir, 'template.md');

      fs.writeFileSync(existingPath, '# Test\n');
      fs.writeFileSync(templatePath, '# Template\n');

      // Test that script accepts the arguments
      const result = execSync(`node ${scriptPath} ${existingPath} ${templatePath}`, {
        encoding: 'utf-8'
      });

      expect(result).toBeTruthy();
    });
  });
});