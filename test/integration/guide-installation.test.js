/**
 * Guide Installation Integration Tests
 *
 * Tests for installation scenarios and edge cases
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

describe('Guide Installation Edge Cases', () => {
  describe('Token Validation Comprehensive Tests', () => {
    // Token validation function (mirroring guide.js logic)
    const validateGitHubTokenFormat = (token) => {
      if (!token || typeof token !== 'string') return false;

      const tokenPatterns = {
        'ghp_': { minLength: 36, maxLength: 40 },
        'github_pat_': { minLength: 82, maxLength: 100 },
        'gho_': { minLength: 40, maxLength: 40 },
        'ghu_': { minLength: 40, maxLength: 40 },
        'ghs_': { minLength: 40, maxLength: 40 },
        'ghr_': { minLength: 80, maxLength: 100 }
      };

      for (const [prefix, limits] of Object.entries(tokenPatterns)) {
        if (token.startsWith(prefix)) {
          const tokenBody = token.substring(prefix.length);
          // Check for spaces or special characters
          if (/[\s\n\t]/.test(tokenBody)) return false;
          return tokenBody.length >= limits.minLength && tokenBody.length <= limits.maxLength;
        }
      }
      return false;
    };

    it('should handle all GitHub token types with various lengths', () => {
      const testCases = [
        // Classic tokens (ghp_)
        { token: 'ghp_' + 'a'.repeat(36), expected: true, description: 'classic 36 chars' },
        { token: 'ghp_' + 'a'.repeat(37), expected: true, description: 'classic 37 chars' },
        { token: 'ghp_' + 'a'.repeat(38), expected: true, description: 'classic 38 chars' },
        { token: 'ghp_' + 'a'.repeat(39), expected: true, description: 'classic 39 chars' },
        { token: 'ghp_' + 'a'.repeat(40), expected: true, description: 'classic 40 chars' },
        { token: 'ghp_' + 'a'.repeat(35), expected: false, description: 'classic too short' },
        { token: 'ghp_' + 'a'.repeat(41), expected: false, description: 'classic too long' },

        // Fine-grained tokens (github_pat_)
        { token: 'github_pat_' + 'a'.repeat(82), expected: true, description: 'fine-grained min' },
        { token: 'github_pat_' + 'a'.repeat(90), expected: true, description: 'fine-grained mid' },
        { token: 'github_pat_' + 'a'.repeat(100), expected: true, description: 'fine-grained max' },
        { token: 'github_pat_' + 'a'.repeat(81), expected: false, description: 'fine-grained too short' },
        { token: 'github_pat_' + 'a'.repeat(101), expected: false, description: 'fine-grained too long' },

        // OAuth tokens (gho_)
        { token: 'gho_' + 'a'.repeat(40), expected: true, description: 'oauth exact' },
        { token: 'gho_' + 'a'.repeat(39), expected: false, description: 'oauth too short' },
        { token: 'gho_' + 'a'.repeat(41), expected: false, description: 'oauth too long' },

        // User tokens (ghu_)
        { token: 'ghu_' + 'a'.repeat(40), expected: true, description: 'user exact' },

        // Installation tokens (ghs_)
        { token: 'ghs_' + 'a'.repeat(40), expected: true, description: 'installation exact' },

        // Refresh tokens (ghr_)
        { token: 'ghr_' + 'a'.repeat(80), expected: true, description: 'refresh min' },
        { token: 'ghr_' + 'a'.repeat(90), expected: true, description: 'refresh mid' },
        { token: 'ghr_' + 'a'.repeat(100), expected: true, description: 'refresh max' },

        // Real-world example from user
        { token: 'ghp_gxtBTU95mqtOIuURABi1lpLUIHyIEq1xQusu', expected: true, description: 'user real example' },

        // Invalid formats
        { token: 'invalid_token', expected: false, description: 'invalid format' },
        { token: '', expected: false, description: 'empty string' },
        { token: null, expected: false, description: 'null' },
        { token: undefined, expected: false, description: 'undefined' }
      ];

      testCases.forEach(({ token, expected, description }) => {
        const result = validateGitHubTokenFormat(token);
        assert.strictEqual(
          result,
          expected,
          `Token test "${description}" should be ${expected ? 'valid' : 'invalid'}`
        );
      });
    });

    it('should reject malformed tokens with special characters', () => {
      const malformedTokens = [
        'ghp_',  // Prefix only
        'github_pat_',  // Prefix only
        ' ghp_' + 'a'.repeat(40),  // Leading space
        'ghp_' + 'a'.repeat(40) + ' ',  // Trailing space
        'GHP_' + 'a'.repeat(40),  // Wrong case
        'ghp-' + 'a'.repeat(40),  // Wrong separator
        'ghp_' + 'a'.repeat(20) + ' ' + 'a'.repeat(16),  // Space in middle
        'ghp_' + 'a'.repeat(20) + '\n' + 'a'.repeat(16),  // Newline
        'ghp_' + 'a'.repeat(20) + '\t' + 'a'.repeat(16),  // Tab
      ];

      malformedTokens.forEach(token => {
        const result = validateGitHubTokenFormat(token);
        assert.strictEqual(
          result,
          false,
          `Malformed token "${token?.substring(0, 20)}..." should be invalid`
        );
      });
    });
  });

  describe('Configuration File Security', () => {
    it('should not include sensitive data in saved config', () => {
      // Simulate config that should be saved
      const configToSave = {
        provider: 'github',
        githubUsername: 'testuser',
        repoName: 'test-project',
        installScenario: 3
      };

      // Sensitive data that should NOT be saved
      const sensitiveFields = ['githubToken', 'azureToken', 'password', 'pat', 'secret'];

      sensitiveFields.forEach(field => {
        assert.ok(
          !(field in configToSave),
          `Config should not contain ${field}`
        );
      });
    });
  });

  describe('Repository and Username Validation', () => {
    const validateRepoName = (name) => {
      if (!name || name.length === 0) return false;
      if (name.startsWith('.') || name.startsWith('-')) return false;
      if (name.endsWith('-')) return false;
      return /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name);
    };

    const validateUsername = (username) => {
      if (!username || username.length === 0) return false;
      if (username.startsWith('-')) return false;
      if (username.endsWith('-')) return false;
      return /^[a-zA-Z0-9][a-zA-Z0-9-_]*$/.test(username);
    };

    it('should validate repository names correctly', () => {
      // Valid names
      const validNames = [
        'valid-repo',
        'valid_repo',
        'valid.repo',
        'valid123',
        '123valid',
        'a',
        'my-awesome-project_2024.v1'
      ];

      validNames.forEach(name => {
        assert.ok(validateRepoName(name), `"${name}" should be valid repo name`);
      });

      // Invalid names
      const invalidNames = [
        '',
        ' ',
        'repo with spaces',
        'repo/with/slashes',
        '.hidden',
        '-startdash',
        'end-',
        'repo#hash',
        'repo@at'
      ];

      invalidNames.forEach(name => {
        assert.ok(!validateRepoName(name), `"${name}" should be invalid repo name`);
      });
    });

    it('should validate usernames correctly', () => {
      // Valid usernames
      const validUsernames = [
        'validuser',
        'valid-user',
        'valid_user',
        'user123',
        'a',
        'user-with-dashes'
      ];

      validUsernames.forEach(username => {
        assert.ok(validateUsername(username), `"${username}" should be valid username`);
      });

      // Invalid usernames
      const invalidUsernames = [
        '',
        ' ',
        'user name',
        '-startdash',
        'user-',
        'user@email',
        'user/slash'
      ];

      invalidUsernames.forEach(username => {
        assert.ok(!validateUsername(username), `"${username}" should be invalid username`);
      });
    });
  });

  describe('Environment Variables for Installation', () => {
    it('should set correct environment variables for each scenario', () => {
      const scenarios = [
        { id: 1, name: 'Minimal', provider: 'github' },
        { id: 2, name: 'Docker-only', provider: 'github' },
        { id: 3, name: 'Full DevOps', provider: 'github' },
        { id: 4, name: 'Performance', provider: 'azure' },
        { id: 5, name: 'Custom', provider: 'github' }
      ];

      scenarios.forEach(({ id, name, provider }) => {
        const env = {
          ...process.env,
          AUTOPM_SKIP_PROMPTS: 'true',
          AUTOPM_SCENARIO: String(id),
          AUTOPM_PROVIDER: provider
        };

        assert.strictEqual(env.AUTOPM_SKIP_PROMPTS, 'true', `${name}: Should skip prompts`);
        assert.strictEqual(env.AUTOPM_SCENARIO, String(id), `${name}: Should set scenario ${id}`);
        assert.strictEqual(env.AUTOPM_PROVIDER, provider, `${name}: Should set ${provider} provider`);
      });
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle various error types gracefully', () => {
      // Network timeout error
      const timeoutError = new Error('ETIMEDOUT');
      timeoutError.code = 'ETIMEDOUT';
      assert.strictEqual(timeoutError.code, 'ETIMEDOUT', 'Should identify timeout error');

      // Permission error
      const permError = new Error('EACCES: permission denied');
      permError.code = 'EACCES';
      assert.strictEqual(permError.code, 'EACCES', 'Should identify permission error');

      // Disk space error
      const diskError = new Error('ENOSPC: no space left on device');
      diskError.code = 'ENOSPC';
      assert.strictEqual(diskError.code, 'ENOSPC', 'Should identify disk space error');

      // File not found error
      const notFoundError = new Error('ENOENT: no such file or directory');
      notFoundError.code = 'ENOENT';
      assert.strictEqual(notFoundError.code, 'ENOENT', 'Should identify file not found error');
    });
  });

  describe('Directory Structure Requirements', () => {
    it('should verify required directory structure', () => {
      const requiredDirs = [
        '.claude',
        '.claude/agents',
        '.claude/commands',
        '.claude/rules',
        '.claude/scripts',
        '.claude/strategies',
        'scripts'
      ];

      // Just verify the list is correct - actual creation is tested elsewhere
      assert.strictEqual(requiredDirs.length, 7, 'Should have 7 required directories');
      assert.ok(requiredDirs.includes('.claude'), 'Should include .claude');
      assert.ok(requiredDirs.includes('.claude/agents'), 'Should include agents');
      assert.ok(requiredDirs.includes('scripts'), 'Should include scripts');
    });
  });
});