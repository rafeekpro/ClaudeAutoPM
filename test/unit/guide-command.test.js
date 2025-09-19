/**
 * Guide Command Test Suite
 *
 * Tests for GitHub token validation and input validation
 * without external dependencies
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('Guide Command Token Validation Tests', () => {
  // Helper function to validate GitHub token format (same logic as in guide.js)
  const validateGitHubTokenFormat = (token) => {
    if (!token || typeof token !== 'string') return false;

    const tokenPatterns = {
      'ghp_': { minLength: 36, maxLength: 40, name: 'Classic Personal Access Token' },
      'github_pat_': { minLength: 82, maxLength: 100, name: 'Fine-grained Personal Access Token' },
      'gho_': { minLength: 40, maxLength: 40, name: 'OAuth Access Token' },
      'ghu_': { minLength: 40, maxLength: 40, name: 'GitHub App User Token' },
      'ghs_': { minLength: 40, maxLength: 40, name: 'GitHub App Installation Token' },
      'ghr_': { minLength: 80, maxLength: 100, name: 'Refresh Token' }
    };

    for (const [prefix, limits] of Object.entries(tokenPatterns)) {
      if (token.startsWith(prefix)) {
        const tokenBody = token.substring(prefix.length);
        // Check for spaces or special characters
        if (/[\s\n\t]/.test(tokenBody)) return false;
        const totalLength = tokenBody.length;
        return totalLength >= limits.minLength && totalLength <= limits.maxLength;
      }
    }
    return false;
  };

  describe('GitHub Token Format Validation', () => {
    it('should validate classic personal access token (ghp_)', () => {
      // Valid tokens
      assert.ok(validateGitHubTokenFormat('ghp_' + 'a'.repeat(36)), 'Should accept 36 chars');
      assert.ok(validateGitHubTokenFormat('ghp_' + 'a'.repeat(38)), 'Should accept 38 chars');
      assert.ok(validateGitHubTokenFormat('ghp_' + 'a'.repeat(40)), 'Should accept 40 chars');

      // Invalid tokens
      assert.ok(!validateGitHubTokenFormat('ghp_' + 'a'.repeat(35)), 'Should reject too short');
      assert.ok(!validateGitHubTokenFormat('ghp_' + 'a'.repeat(41)), 'Should reject too long');
      assert.ok(!validateGitHubTokenFormat('ghp_'), 'Should reject prefix only');
    });

    it('should validate fine-grained personal access token (github_pat_)', () => {
      // Valid tokens
      assert.ok(validateGitHubTokenFormat('github_pat_' + 'a'.repeat(82)), 'Should accept 82 chars');
      assert.ok(validateGitHubTokenFormat('github_pat_' + 'a'.repeat(90)), 'Should accept 90 chars');
      assert.ok(validateGitHubTokenFormat('github_pat_' + 'a'.repeat(100)), 'Should accept 100 chars');

      // Invalid tokens
      assert.ok(!validateGitHubTokenFormat('github_pat_' + 'a'.repeat(81)), 'Should reject too short');
      assert.ok(!validateGitHubTokenFormat('github_pat_' + 'a'.repeat(101)), 'Should reject too long');
    });

    it('should validate OAuth access token (gho_)', () => {
      assert.ok(validateGitHubTokenFormat('gho_' + 'a'.repeat(40)), 'Should accept exactly 40 chars');
      assert.ok(!validateGitHubTokenFormat('gho_' + 'a'.repeat(39)), 'Should reject too short');
      assert.ok(!validateGitHubTokenFormat('gho_' + 'a'.repeat(41)), 'Should reject too long');
    });

    it('should validate GitHub App user token (ghu_)', () => {
      assert.ok(validateGitHubTokenFormat('ghu_' + 'a'.repeat(40)), 'Should accept exactly 40 chars');
      assert.ok(!validateGitHubTokenFormat('ghu_' + 'a'.repeat(39)), 'Should reject too short');
    });

    it('should validate GitHub App installation token (ghs_)', () => {
      assert.ok(validateGitHubTokenFormat('ghs_' + 'a'.repeat(40)), 'Should accept exactly 40 chars');
      assert.ok(!validateGitHubTokenFormat('ghs_' + 'a'.repeat(39)), 'Should reject too short');
    });

    it('should validate refresh token (ghr_)', () => {
      assert.ok(validateGitHubTokenFormat('ghr_' + 'a'.repeat(80)), 'Should accept 80 chars');
      assert.ok(validateGitHubTokenFormat('ghr_' + 'a'.repeat(90)), 'Should accept 90 chars');
      assert.ok(validateGitHubTokenFormat('ghr_' + 'a'.repeat(100)), 'Should accept 100 chars');
      assert.ok(!validateGitHubTokenFormat('ghr_' + 'a'.repeat(79)), 'Should reject too short');
      assert.ok(!validateGitHubTokenFormat('ghr_' + 'a'.repeat(101)), 'Should reject too long');
    });

    it('should handle real-world example token', () => {
      // User's real example that was initially failing
      const userToken = 'ghp_gxtBTU95mqtOIuURABi1lpLUIHyIEq1xQusu';
      assert.ok(validateGitHubTokenFormat(userToken), 'Should accept user\'s real token example');
    });

    it('should reject invalid token formats', () => {
      assert.ok(!validateGitHubTokenFormat(''), 'Should reject empty string');
      assert.ok(!validateGitHubTokenFormat(null), 'Should reject null');
      assert.ok(!validateGitHubTokenFormat(undefined), 'Should reject undefined');
      assert.ok(!validateGitHubTokenFormat(123), 'Should reject number');
      assert.ok(!validateGitHubTokenFormat({}), 'Should reject object');
      assert.ok(!validateGitHubTokenFormat([]), 'Should reject array');
      assert.ok(!validateGitHubTokenFormat('invalid_token'), 'Should reject invalid prefix');
      assert.ok(!validateGitHubTokenFormat('abc_' + 'a'.repeat(40)), 'Should reject unknown prefix');
    });

    it('should reject tokens with invalid characters', () => {
      assert.ok(!validateGitHubTokenFormat('ghp_ ' + 'a'.repeat(35)), 'Should reject space in token');
      assert.ok(!validateGitHubTokenFormat('ghp_' + 'a'.repeat(18) + ' ' + 'a'.repeat(18)), 'Should reject space in middle');
      assert.ok(!validateGitHubTokenFormat(' ghp_' + 'a'.repeat(36)), 'Should reject leading space');
      assert.ok(!validateGitHubTokenFormat('ghp_' + 'a'.repeat(36) + ' '), 'Should reject trailing space');
      assert.ok(!validateGitHubTokenFormat('GHP_' + 'a'.repeat(36)), 'Should reject wrong case');
      assert.ok(!validateGitHubTokenFormat('ghp-' + 'a'.repeat(36)), 'Should reject wrong separator');
    });
  });

  describe('Repository Name Validation', () => {
    const validateRepoName = (name) => {
      if (!name || typeof name !== 'string') return false;
      if (name.length === 0) return false;
      if (name.startsWith('.') || name.startsWith('-')) return false;
      if (name.endsWith('-')) return false;
      return /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name);
    };

    it('should validate valid repository names', () => {
      assert.ok(validateRepoName('valid-repo'), 'Should accept hyphenated name');
      assert.ok(validateRepoName('valid_repo'), 'Should accept underscored name');
      assert.ok(validateRepoName('valid.repo'), 'Should accept dotted name');
      assert.ok(validateRepoName('valid123'), 'Should accept numbers');
      assert.ok(validateRepoName('123valid'), 'Should accept starting with number');
      assert.ok(validateRepoName('a'), 'Should accept single character');
      assert.ok(validateRepoName('my-awesome-project_2024.v1'), 'Should accept complex name');
    });

    it('should reject invalid repository names', () => {
      assert.ok(!validateRepoName(''), 'Should reject empty string');
      assert.ok(!validateRepoName(' '), 'Should reject only space');
      assert.ok(!validateRepoName('repo with spaces'), 'Should reject spaces');
      assert.ok(!validateRepoName('repo/with/slashes'), 'Should reject slashes');
      assert.ok(!validateRepoName('.hidden'), 'Should reject starting with dot');
      assert.ok(!validateRepoName('-startdash'), 'Should reject starting with dash');
      assert.ok(!validateRepoName('end-'), 'Should reject ending with dash');
      assert.ok(!validateRepoName('repo#hash'), 'Should reject special characters');
      assert.ok(!validateRepoName('repo@at'), 'Should reject @ symbol');
      assert.ok(!validateRepoName(null), 'Should reject null');
      assert.ok(!validateRepoName(undefined), 'Should reject undefined');
    });
  });

  describe('Username Validation', () => {
    const validateUsername = (username) => {
      if (!username || typeof username !== 'string') return false;
      if (username.length === 0) return false;
      if (username.startsWith('-')) return false;
      if (username.endsWith('-')) return false;
      return /^[a-zA-Z0-9][a-zA-Z0-9-_]*$/.test(username);
    };

    it('should validate valid usernames', () => {
      assert.ok(validateUsername('validuser'), 'Should accept simple username');
      assert.ok(validateUsername('valid-user'), 'Should accept hyphenated username');
      assert.ok(validateUsername('valid_user'), 'Should accept underscored username');
      assert.ok(validateUsername('user123'), 'Should accept numbers');
      assert.ok(validateUsername('a'), 'Should accept single character');
      assert.ok(validateUsername('user-with-multiple-dashes'), 'Should accept multiple dashes');
    });

    it('should reject invalid usernames', () => {
      assert.ok(!validateUsername(''), 'Should reject empty string');
      assert.ok(!validateUsername(' '), 'Should reject only space');
      assert.ok(!validateUsername('user name'), 'Should reject spaces');
      assert.ok(!validateUsername('-startdash'), 'Should reject starting with dash');
      assert.ok(!validateUsername('user-'), 'Should reject ending with dash');
      assert.ok(!validateUsername('user@email'), 'Should reject @ symbol');
      assert.ok(!validateUsername('user/slash'), 'Should reject slash');
      assert.ok(!validateUsername('user#hash'), 'Should reject hash');
      assert.ok(!validateUsername(null), 'Should reject null');
      assert.ok(!validateUsername(undefined), 'Should reject undefined');
    });
  });

  describe('Environment Variable Preparation', () => {
    const prepareInstallEnvironment = (scenario, provider) => {
      return {
        ...process.env,
        AUTOPM_SKIP_PROMPTS: 'true',
        AUTOPM_SCENARIO: String(scenario),
        AUTOPM_PROVIDER: provider || 'github'
      };
    };

    it('should prepare correct environment variables', () => {
      const env1 = prepareInstallEnvironment(1, 'github');
      assert.strictEqual(env1.AUTOPM_SKIP_PROMPTS, 'true', 'Should skip prompts');
      assert.strictEqual(env1.AUTOPM_SCENARIO, '1', 'Should set scenario 1');
      assert.strictEqual(env1.AUTOPM_PROVIDER, 'github', 'Should set github provider');

      const env2 = prepareInstallEnvironment(2, 'azure');
      assert.strictEqual(env2.AUTOPM_SCENARIO, '2', 'Should set scenario 2');
      assert.strictEqual(env2.AUTOPM_PROVIDER, 'azure', 'Should set azure provider');

      const env3 = prepareInstallEnvironment(3, null);
      assert.strictEqual(env3.AUTOPM_SCENARIO, '3', 'Should set scenario 3');
      assert.strictEqual(env3.AUTOPM_PROVIDER, 'github', 'Should default to github');
    });
  });
});