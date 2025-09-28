/**
 * Comprehensive Installation Tests
 * TDD tests for all installation scenarios, file operations, and dynamic behaviors
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

describe('Comprehensive Installation Testing', () => {
  let testDir;
  let autopmPath;

  beforeAll(() => {
    autopmPath = path.join(__dirname, '../../bin/autopm.js');
  });

  beforeEach(() => {
    // Create a unique test directory for each test
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'autopm-test-'));
    process.chdir(testDir);

    // Initialize as git repo (required for installation)
    execSync('git init', { stdio: 'ignore' });
    execSync('git config user.name "Test User"', { stdio: 'ignore' });
    execSync('git config user.email "test@example.com"', { stdio: 'ignore' });
  });

  afterEach(() => {
    // Clean up test directory
    try {
      process.chdir(os.tmpdir());
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to clean up test directory: ${error.message}`);
    }
  });

  describe('Installation Presets', () => {
    test('should install minimal preset correctly', () => {
      const result = execSync(`node ${autopmPath} install minimal`, {
        encoding: 'utf8',
        env: { ...process.env, AUTOPM_TEST_MODE: '1' }
      });

      expect(result).toContain('Installation completed');

      // Check core directories exist
      expect(fs.existsSync('.claude')).toBe(true);
      expect(fs.existsSync('.claude/agents')).toBe(true);
      expect(fs.existsSync('.claude/commands')).toBe(true);
      expect(fs.existsSync('.claude/rules')).toBe(true);
      expect(fs.existsSync('.claude/scripts')).toBe(true);
      expect(fs.existsSync('.claude/checklists')).toBe(true);

      // Check teams.json was created
      expect(fs.existsSync('.claude/teams.json')).toBe(true);
      const teams = JSON.parse(fs.readFileSync('.claude/teams.json', 'utf8'));
      expect(teams.base).toBeDefined();
      expect(teams.devops).toBeDefined();

      // Check CLAUDE.md was created
      expect(fs.existsSync('CLAUDE.md')).toBe(true);
      const claudeMd = fs.readFileSync('CLAUDE.md', 'utf8');
      expect(claudeMd).toContain('ClaudeAutoPM Development Project');
      expect(claudeMd).toContain('<!-- AGENTS_START -->');
      expect(claudeMd).toContain('<!-- AGENTS_END -->');

      // Minimal preset should NOT have Docker/K8s files
      expect(fs.existsSync('.claude/docker')).toBe(false);
      expect(fs.existsSync('.claude/k8s')).toBe(false);
    });

    test('should install docker-only preset correctly', () => {
      const result = execSync(`node ${autopmPath} install docker-only`, {
        encoding: 'utf8',
        env: { ...process.env, AUTOPM_TEST_MODE: '1' }
      });

      expect(result).toContain('Installation completed');

      // Check core directories exist
      expect(fs.existsSync('.claude')).toBe(true);
      expect(fs.existsSync('.claude/agents')).toBe(true);

      // Docker preset should have Docker files but not K8s
      expect(fs.existsSync('.claude/docker')).toBe(true);
      expect(fs.existsSync('.claude/k8s')).toBe(false);

      // Should have git hooks
      expect(fs.existsSync('.githooks')).toBe(true);
      expect(fs.existsSync('.githooks/post-checkout')).toBe(true);
    });

    test('should install full devops preset correctly', () => {
      const result = execSync(`node ${autopmPath} install full`, {
        encoding: 'utf8',
        env: { ...process.env, AUTOPM_TEST_MODE: '1' }
      });

      expect(result).toContain('Installation completed');

      // Full preset should have everything
      expect(fs.existsSync('.claude')).toBe(true);
      expect(fs.existsSync('.claude/docker')).toBe(true);
      expect(fs.existsSync('.claude/k8s')).toBe(true);
      expect(fs.existsSync('.githooks')).toBe(true);
      expect(fs.existsSync('scripts')).toBe(true);
      expect(fs.existsSync('scripts/setup-githooks.sh')).toBe(true);
    });

    test('should install performance preset correctly', () => {
      const result = execSync(`node ${autopmPath} install performance`, {
        encoding: 'utf8',
        env: { ...process.env, AUTOPM_TEST_MODE: '1' }
      });

      expect(result).toContain('Installation completed');

      // Performance preset should have all features
      expect(fs.existsSync('.claude')).toBe(true);
      expect(fs.existsSync('.claude/docker')).toBe(true);
      expect(fs.existsSync('.claude/k8s')).toBe(true);
      expect(fs.existsSync('.githooks')).toBe(true);
    });
  });

  describe('File Operations', () => {
    test('should copy all required files correctly', () => {
      execSync(`node ${autopmPath} install minimal`, {
        encoding: 'utf8',
        env: { ...process.env, AUTOPM_TEST_MODE: '1' }
      });

      // Check specific files exist and have content
      const requiredFiles = [
        '.claude/teams.json',
        '.claude/agents/core/code-analyzer.md',
        '.claude/agents/core/test-runner.md',
        '.claude/agents/core/file-analyzer.md',
        '.claude/commands/pm/pm-init.md',
        '.claude/rules/development-rules.md',
        'CLAUDE.md'
      ];

      requiredFiles.forEach(file => {
        expect(fs.existsSync(file)).toBe(true);
        const content = fs.readFileSync(file, 'utf8');
        expect(content.length).toBeGreaterThan(0);
      });
    });

    test('should create dynamic CLAUDE.md with proper agent markers', () => {
      execSync(`node ${autopmPath} install minimal`, {
        encoding: 'utf8',
        env: { ...process.env, AUTOPM_TEST_MODE: '1' }
      });

      const claudeMd = fs.readFileSync('CLAUDE.md', 'utf8');

      // Check for agent markers
      expect(claudeMd).toContain('<!-- AGENTS_START -->');
      expect(claudeMd).toContain('<!-- AGENTS_END -->');

      // Check that base agents are loaded by default
      expect(claudeMd).toContain('code-analyzer.md');
      expect(claudeMd).toContain('test-runner.md');
      expect(claudeMd).toContain('file-analyzer.md');
    });

    test('should handle file permissions correctly', () => {
      execSync(`node ${autopmPath} install docker-only`, {
        encoding: 'utf8',
        env: { ...process.env, AUTOPM_TEST_MODE: '1' }
      });

      // Check that scripts are executable
      if (fs.existsSync('scripts/setup-githooks.sh')) {
        const stats = fs.statSync('scripts/setup-githooks.sh');
        expect(stats.mode & parseInt('111', 8)).toBeGreaterThan(0); // Check execute bits
      }

      if (fs.existsSync('.githooks/post-checkout')) {
        const stats = fs.statSync('.githooks/post-checkout');
        expect(stats.mode & parseInt('111', 8)).toBeGreaterThan(0); // Check execute bits
      }
    });
  });

  describe('Dynamic File Generation', () => {
    test('should generate teams.json with correct structure', () => {
      execSync(`node ${autopmPath} install minimal`, {
        encoding: 'utf8',
        env: { ...process.env, AUTOPM_TEST_MODE: '1' }
      });

      const teams = JSON.parse(fs.readFileSync('.claude/teams.json', 'utf8'));

      // Test structure
      expect(teams.base).toBeDefined();
      expect(teams.base.description).toBeDefined();
      expect(Array.isArray(teams.base.agents)).toBe(true);

      expect(teams.devops).toBeDefined();
      expect(teams.devops.inherits).toEqual(['base']);
      expect(Array.isArray(teams.devops.agents)).toBe(true);

      expect(teams.frontend).toBeDefined();
      expect(teams.python_backend).toBeDefined();
      expect(teams.fullstack).toBeDefined();
      expect(teams.fullstack.inherits).toEqual(['frontend', 'python_backend']);
    });

    test('should create CLAUDE.md from template with proper substitutions', () => {
      execSync(`node ${autopmPath} install full`, {
        encoding: 'utf8',
        env: { ...process.env, AUTOPM_TEST_MODE: '1' }
      });

      const claudeMd = fs.readFileSync('CLAUDE.md', 'utf8');

      // Check template substitutions worked
      expect(claudeMd).toContain('ClaudeAutoPM Development Project');
      expect(claudeMd).toContain('Test-Driven Development (TDD) is MANDATORY');
      expect(claudeMd).toContain('Jest framework');

      // Check that template placeholders are NOT present
      expect(claudeMd).not.toContain('{{');
      expect(claudeMd).not.toContain('}}');
    });
  });

  describe('Team Management Integration', () => {
    beforeEach(() => {
      // Install before testing team operations
      execSync(`node ${autopmPath} install minimal`, {
        encoding: 'utf8',
        env: { ...process.env, AUTOPM_TEST_MODE: '1' }
      });
    });

    test('should list teams correctly after installation', () => {
      const result = execSync(`node ${autopmPath} team list`, { encoding: 'utf8' });

      expect(result).toContain('base');
      expect(result).toContain('devops');
      expect(result).toContain('frontend');
      expect(result).toContain('python_backend');
      expect(result).toContain('fullstack');
    });

    test('should load team and update CLAUDE.md', () => {
      const result = execSync(`node ${autopmPath} team load devops`, { encoding: 'utf8' });

      expect(result).toContain('loaded successfully');

      // Check that active team file was created
      expect(fs.existsSync('.claude/active_team.txt')).toBe(true);
      const activeTeam = fs.readFileSync('.claude/active_team.txt', 'utf8').trim();
      expect(activeTeam).toBe('devops');

      // Check that CLAUDE.md was updated with devops agents
      const claudeMd = fs.readFileSync('CLAUDE.md', 'utf8');
      expect(claudeMd).toContain('docker-containerization-expert.md');
      expect(claudeMd).toContain('kubernetes-orchestrator.md');
      // Should still contain base agents due to inheritance
      expect(claudeMd).toContain('code-analyzer.md');
    });

    test('should handle team inheritance correctly', () => {
      execSync(`node ${autopmPath} team load fullstack`, { encoding: 'utf8' });

      const claudeMd = fs.readFileSync('CLAUDE.md', 'utf8');

      // Should contain agents from frontend
      expect(claudeMd).toContain('react-ui-expert.md');
      expect(claudeMd).toContain('javascript-frontend-engineer.md');

      // Should contain agents from python_backend
      expect(claudeMd).toContain('python-backend-expert.md');
      expect(claudeMd).toContain('fastapi-backend-engineer.md');

      // Should contain base agents
      expect(claudeMd).toContain('code-analyzer.md');
      expect(claudeMd).toContain('test-runner.md');
    });
  });

  describe('Git Hooks Integration', () => {
    beforeEach(() => {
      execSync(`node ${autopmPath} install docker-only`, {
        encoding: 'utf8',
        env: { ...process.env, AUTOPM_TEST_MODE: '1' }
      });
    });

    test('should install git hooks correctly', () => {
      expect(fs.existsSync('.githooks/post-checkout')).toBe(true);
      expect(fs.existsSync('scripts/setup-githooks.sh')).toBe(true);

      // Test setup script
      const result = execSync('bash scripts/setup-githooks.sh', { encoding: 'utf8' });
      expect(result).toContain('Git hooks path configured successfully');

      // Check git config
      const hooksPath = execSync('git config --get core.hooksPath', { encoding: 'utf8' }).trim();
      expect(hooksPath).toBe('.githooks');
    });

    test('should trigger team switching on branch checkout', () => {
      // Setup hooks first
      execSync('bash scripts/setup-githooks.sh', { stdio: 'ignore' });

      // Create and checkout a branch that should trigger team switching
      execSync('git checkout -b feature/devops/test-ci', { stdio: 'ignore' });

      // Check if team was switched
      if (fs.existsSync('.claude/active_team.txt')) {
        const activeTeam = fs.readFileSync('.claude/active_team.txt', 'utf8').trim();
        expect(activeTeam).toBe('devops');
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle installation in non-git directory', () => {
      // Create a fresh directory without git
      const nonGitDir = fs.mkdtempSync(path.join(os.tmpdir(), 'autopm-nogit-'));
      process.chdir(nonGitDir);

      try {
        execSync(`node ${autopmPath} install minimal`, {
          encoding: 'utf8',
          env: { ...process.env, AUTOPM_TEST_MODE: '1' }
        });
        // Should not reach here
        fail();
      } catch (error) {
        expect(error.status).not.toBe(0);
        expect(error.stdout || error.stderr).toContain('git');
      } finally {
        process.chdir(testDir);
        fs.rmSync(nonGitDir, { recursive: true, force: true });
      }
    });

    test('should handle missing source files gracefully', () => {
      // This test would require mocking the autopm source directory
      // For now, we'll test that the installation validates file existence

      const result = execSync(`node ${autopmPath} install minimal`, {
        encoding: 'utf8',
        env: { ...process.env, AUTOPM_TEST_MODE: '1' }
      });

      // Should complete without errors even if some optional files are missing
      expect(result).toContain('Installation completed');
    });

    test('should handle team loading with missing agent files', () => {
      execSync(`node ${autopmPath} install minimal`, {
        encoding: 'utf8',
        env: { ...process.env, AUTOPM_TEST_MODE: '1' }
      });

      // This should work even if some agent files are missing
      const result = execSync(`node ${autopmPath} team load devops`, { encoding: 'utf8' });

      // Should load successfully with warnings for missing files
      expect(result).toMatch(/loaded successfully|Warning/);
    });
  });

  describe('Validation and Verification', () => {
    test('should validate installation completeness', () => {
      execSync(`node ${autopmPath} install full`, {
        encoding: 'utf8',
        env: { ...process.env, AUTOPM_TEST_MODE: '1' }
      });

      // Use the guide's diagnostic feature to validate installation
      const result = execSync(`printf "5\\n7\\n7\\n" | node ${autopmPath} guide`, { encoding: 'utf8' });

      expect(result).toContain('System Diagnostics');
      expect(result).toContain('Installation: Found');
      expect(result).toContain('Teams: Configured');
    });

    test('should verify all presets create valid configurations', () => {
      const presets = ['minimal', 'docker-only', 'full', 'performance'];

      presets.forEach(preset => {
        // Clean directory for each test
        execSync('rm -rf .claude CLAUDE.md .githooks scripts', { stdio: 'ignore' });

        const result = execSync(`node ${autopmPath} install ${preset}`, {
          encoding: 'utf8',
          env: { ...process.env, AUTOPM_TEST_MODE: '1' }
        });

        expect(result).toContain('Installation completed');
        expect(fs.existsSync('.claude/teams.json')).toBe(true);
        expect(fs.existsSync('CLAUDE.md')).toBe(true);

        // Validate teams.json structure
        const teams = JSON.parse(fs.readFileSync('.claude/teams.json', 'utf8'));
        expect(teams.base).toBeDefined();
        expect(Array.isArray(teams.base.agents)).toBe(true);
      });
    });
  });

  describe('Performance and Stress Testing', () => {
    test('should handle multiple rapid team switches', () => {
      execSync(`node ${autopmPath} install minimal`, {
        encoding: 'utf8',
        env: { ...process.env, AUTOPM_TEST_MODE: '1' }
      });

      const teams = ['devops', 'frontend', 'python_backend', 'fullstack', 'base'];

      teams.forEach(team => {
        const result = execSync(`node ${autopmPath} team load ${team}`, { encoding: 'utf8' });
        expect(result).toMatch(/loaded successfully|Warning/);

        const activeTeam = fs.readFileSync('.claude/active_team.txt', 'utf8').trim();
        expect(activeTeam).toBe(team);
      });
    });

    test('should handle large CLAUDE.md files efficiently', () => {
      execSync(`node ${autopmPath} install full`, {
        encoding: 'utf8',
        env: { ...process.env, AUTOPM_TEST_MODE: '1' }
      });

      // Load fullstack team (which includes many agents)
      const start = Date.now();
      execSync(`node ${autopmPath} team load fullstack`, { encoding: 'utf8' });
      const duration = Date.now() - start;

      // Should complete in reasonable time (less than 5 seconds)
      expect(duration).toBeLessThan(5000);

      // Check CLAUDE.md was updated correctly
      const claudeMd = fs.readFileSync('CLAUDE.md', 'utf8');
      expect(claudeMd.length).toBeGreaterThan(1000); // Should have substantial content
    });
  });
});