/**
 * Interactive Guide Tests
 * Tests for the new interactive guide functionality
 */

const { execSync } = require('child_process');
const path = require('path');

describe('Interactive Guide', () => {
  const autopmPath = path.join(__dirname, '../../bin/autopm.js');

  test('should show help for guide command', () => {
    const result = execSync(`node ${autopmPath} guide --help`, { encoding: 'utf8' });

    expect(result).toContain('Interactive ClaudeAutoPM setup and usage guide');
    expect(result).toContain('Start interactive setup guide');
    expect(result).toContain('quickstart');
    expect(result).toContain('install');
    expect(result).toContain('config');
  });

  test('should start interactive guide by default', () => {
    // Test that the interactive guide loads without errors
    // We pipe "7" (exit option) to exit immediately
    const result = execSync(`echo "7" | node ${autopmPath} guide`, { encoding: 'utf8' });

    expect(result).toContain('Welcome to ClaudeAutoPM');
    expect(result).toContain('What would you like to do?');
    expect(result).toContain('📦 Install ClaudeAutoPM in this project');
    expect(result).toContain('🔧 Configure existing installation');
    expect(result).toContain('🤖 Learn about agent teams');
    expect(result).toContain('📋 Start your first PM workflow');
    expect(result).toContain('🆘 Troubleshoot installation issues');
    expect(result).toContain('📚 View complete documentation');
    expect(result).toContain('🚪 Exit guide');
    expect(result).toContain('Thank you for using ClaudeAutoPM!');
  });

  test('should generate legacy documentation when specific action provided', () => {
    const result = execSync(`node ${autopmPath} guide config`, { encoding: 'utf8' });

    expect(result).toContain('ClaudeAutoPM Documentation Generator');
    expect(result).toContain('Generating Configuration Guide');
    expect(result).toContain('Configuration guide created: docs/CONFIG.md');
  });

  test('should handle install guide generation', () => {
    const result = execSync(`node ${autopmPath} guide install --platform docker`, { encoding: 'utf8' });

    expect(result).toContain('ClaudeAutoPM Documentation Generator');
    expect(result).toContain('Generating Installation Guide for docker');
    expect(result).toContain('Installation guide created: docs/INSTALL.md');
    expect(result).toContain('Platform: docker');
  });

  test('should handle FAQ generation', () => {
    const result = execSync(`node ${autopmPath} guide faq`, { encoding: 'utf8' });

    expect(result).toContain('ClaudeAutoPM Documentation Generator');
    expect(result).toContain('Generating FAQ Document');
    expect(result).toContain('FAQ created: docs/FAQ.md');
  });

  test('should detect existing installation correctly', () => {
    // Since we're running in the AUTOPM project directory, it should detect existing installation
    // We use printf to properly format the input for the interactive guide
    const result = execSync(`printf "1\\n\\n" | node ${autopmPath} guide`, { encoding: 'utf8' });

    expect(result).toContain('Already Installed');
    expect(result).toContain('ClaudeAutoPM is already installed in this project');
    expect(result).toContain('Found existing .claude directory');
  });

  test('interactive guide class should be importable', () => {
    const InteractiveGuide = require('../../lib/guide/interactive-guide');
    expect(InteractiveGuide).toBeDefined();
    expect(typeof InteractiveGuide).toBe('function');

    const guide = new InteractiveGuide();
    expect(guide).toBeDefined();
    expect(typeof guide.createFrame).toBe('function');
    expect(typeof guide.createStepFrame).toBe('function');
    expect(typeof guide.isInstalled).toBe('function');
    expect(typeof guide.checkRequirements).toBe('function');
  });

  test('frame creation should work correctly', () => {
    const InteractiveGuide = require('../../lib/guide/interactive-guide');
    const guide = new InteractiveGuide();

    const frame = guide.createFrame('Test content', 'Test Title');

    expect(frame).toContain('┌');
    expect(frame).toContain('┐');
    expect(frame).toContain('└');
    expect(frame).toContain('┘');
    expect(frame).toContain('Test Title');
    expect(frame).toContain('Test content');
  });

  test('step frame creation should work correctly', () => {
    const InteractiveGuide = require('../../lib/guide/interactive-guide');
    const guide = new InteractiveGuide();

    const stepFrame = guide.createStepFrame(
      1,
      'Test Step',
      'Step instructions',
      ['command1', 'command2']
    );

    expect(stepFrame).toContain('STEP 1: Test Step');
    expect(stepFrame).toContain('Step instructions');
    expect(stepFrame).toContain('Commands to run:');
    expect(stepFrame).toContain('$ command1');
    expect(stepFrame).toContain('$ command2');
  });

  test('installation detection should work', () => {
    const InteractiveGuide = require('../../lib/guide/interactive-guide');
    const guide = new InteractiveGuide();

    // Should detect installation in AUTOPM project directory
    const isInstalled = guide.isInstalled();
    expect(isInstalled).toBe(true);
  });

  test('requirements check should work', () => {
    const InteractiveGuide = require('../../lib/guide/interactive-guide');
    const guide = new InteractiveGuide();

    const requirements = guide.checkRequirements();
    expect(Array.isArray(requirements)).toBe(true);
    expect(requirements.length).toBeGreaterThan(0);

    // Should check for Node.js, npm, and Git
    const hasNodeCheck = requirements.some(req => req.includes('Node.js'));
    const hasNpmCheck = requirements.some(req => req.includes('npm'));
    const hasGitCheck = requirements.some(req => req.includes('Git'));

    expect(hasNodeCheck).toBe(true);
    expect(hasNpmCheck).toBe(true);
    expect(hasGitCheck).toBe(true);
  });
});