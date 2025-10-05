/**
 * Test Suite: --local Flag Support for PM Commands
 *
 * Tests the implementation of --local flag across all PM commands
 * following yargs best practices from Context7 documentation.
 */

const { parsePMCommand } = require('../../autopm/.claude/lib/cli-parser');
const fs = require('fs');
const path = require('path');

describe('--local Flag Support', () => {
  describe('Flag Recognition', () => {
    test('should recognize --local flag', () => {
      const args = ['prd-new', 'test-prd', '--local'];
      const parsed = parsePMCommand(args);

      expect(parsed.local).toBe(true);
      expect(parsed.mode).toBe('local');
    });

    test('should recognize -l alias', () => {
      const args = ['prd-new', 'test-prd', '-l'];
      const parsed = parsePMCommand(args);

      expect(parsed.local).toBe(true);
      expect(parsed.mode).toBe('local');
    });

    test('should default to false when --local not provided', () => {
      const args = ['prd-new', 'test-prd'];
      const parsed = parsePMCommand(args);

      expect(parsed.local).toBe(false);
    });
  });

  describe('Mode Determination', () => {
    test('--local sets mode to "local"', () => {
      const args = ['epic-decompose', 'feature-123', '--local'];
      const parsed = parsePMCommand(args);

      expect(parsed.mode).toBe('local');
    });

    test('without --local, mode reads from config (github)', () => {
      const args = ['prd-list'];
      const parsed = parsePMCommand(args);

      // Should read from .claude/config.json
      expect(['github', 'azure']).toContain(parsed.mode);
    });

    test('--no-local explicitly sets remote mode', () => {
      const args = ['prd-new', 'test', '--no-local'];
      const parsed = parsePMCommand(args);

      expect(parsed.local).toBe(false);
      expect(parsed.mode).not.toBe('local');
    });
  });

  describe('Command Compatibility', () => {
    const commands = [
      ['prd-new', 'test-prd'],
      ['prd-list'],
      ['prd-show', 'PRD-001'],
      ['epic-decompose', 'feature-auth'],
      ['issue-create', 'bug-fix'],
      ['epic-list'],
      ['task-create', 'implement-auth']
    ];

    test.each(commands)('works with %s command', (...cmdArgs) => {
      const argsWithLocal = [...cmdArgs, '--local'];
      const parsed = parsePMCommand(argsWithLocal);

      expect(parsed.local).toBe(true);
      expect(parsed.mode).toBe('local');
      expect(parsed._).toContain(cmdArgs[0]); // Command name preserved
    });

    test.each(commands)('%s works without --local flag', (...cmdArgs) => {
      const parsed = parsePMCommand(cmdArgs);

      expect(parsed.local).toBe(false);
      expect(parsed._).toContain(cmdArgs[0]);
    });
  });

  describe('Error Handling', () => {
    test('throws error if both --local and --github specified', () => {
      const args = ['prd-new', 'test', '--local', '--github'];

      expect(() => parsePMCommand(args)).toThrow(/cannot use both --local and remote provider/i);
    });

    test('throws error if both --local and --azure specified', () => {
      const args = ['epic-decompose', 'feat', '--local', '--azure'];

      expect(() => parsePMCommand(args)).toThrow(/cannot use both --local and remote provider/i);
    });

    test('allows --local with other non-conflicting flags', () => {
      const args = ['prd-new', 'test', '--local', '--verbose', '--force'];
      const parsed = parsePMCommand(args);

      expect(parsed.local).toBe(true);
      expect(parsed.verbose).toBe(true);
      expect(parsed.force).toBe(true);
    });
  });

  describe('Help Text', () => {
    test('--help includes --local flag description', async () => {
      const { getHelpText } = require('../../autopm/.claude/lib/cli-parser');

      const helpText = await getHelpText();

      expect(helpText).toMatch(/-l, --local/);  // Yargs shows alias first
      expect(helpText).toMatch(/local mode.*offline/i);
      expect(helpText).toMatch(/no GitHub\/Azure/i);
    });
  });

  describe('Yargs Integration', () => {
    test('uses yargs .boolean() method', () => {
      // Verify implementation uses yargs boolean type by testing behavior
      const args = ['prd-new', 'test', '--local'];
      const parsed = parsePMCommand(args);

      // Boolean flags should be true/false, not strings
      expect(typeof parsed.local).toBe('boolean');
      expect(parsed.local).toBe(true);
    });

    test('uses yargs alias feature', () => {
      // Verify alias works by testing -l
      const args = ['prd-new', 'test', '-l'];
      const parsed = parsePMCommand(args);

      expect(parsed.local).toBe(true);
    });
  });

  describe('Config Integration', () => {
    test('reads mode from .claude/config.json when --local not set', () => {
      const args = ['prd-new', 'test'];
      const parsed = parsePMCommand(args);

      // Mode should be set to a valid provider (github, azure, or local)
      expect(['github', 'azure', 'local']).toContain(parsed.mode);
      expect(parsed.mode).toBeTruthy();
    });
  });

  describe('Backward Compatibility', () => {
    test('existing workflows work without --local', () => {
      const args = ['prd-new', 'my-feature', '--github'];
      const parsed = parsePMCommand(args);

      expect(parsed.local).toBe(false);
      expect(parsed.github).toBe(true);
      expect(parsed._[1]).toBe('my-feature');
    });

    test('preserves all other command arguments', () => {
      const args = [
        'epic-decompose',
        'user-authentication',
        '--local',
        '--output', 'json',
        '--verbose'
      ];

      const parsed = parsePMCommand(args);

      expect(parsed._[0]).toBe('epic-decompose');
      expect(parsed._[1]).toBe('user-authentication');
      expect(parsed.local).toBe(true);
      expect(parsed.output).toBe('json');
      expect(parsed.verbose).toBe(true);
    });
  });
});

describe('CLI Parser Edge Cases', () => {
  test('handles empty arguments gracefully', () => {
    const args = [];
    const parsed = parsePMCommand(args);

    expect(parsed.local).toBe(false);
  });

  test('handles only --local flag', () => {
    const args = ['--local'];
    const parsed = parsePMCommand(args);

    expect(parsed.local).toBe(true);
    expect(parsed.mode).toBe('local');
  });

  test('proper case --local flag works correctly', () => {
    const args = ['prd-new', 'test', '--local'];
    const parsed = parsePMCommand(args);

    expect(parsed.local).toBe(true);
    expect(parsed.mode).toBe('local');
  });
});
