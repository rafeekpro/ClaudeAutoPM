const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Team Command CLI', () => {
  const projectRoot = path.join(__dirname, '../..');
  const teamsConfigPath = path.join(projectRoot, '.claude/teams.json');
  const activeTeamPath = path.join(projectRoot, '.claude/active_team.txt');
  const claudeMdPath = path.join(projectRoot, 'CLAUDE.md');
  const claudeMdBackupPath = path.join(projectRoot, 'CLAUDE.md.backup');

  // Helper to run CLI commands
  const runCommand = (cmd) => {
    try {
      const result = execSync(`node ${path.join(projectRoot, 'bin/autopm.js')} ${cmd}`, {
        cwd: projectRoot,
        encoding: 'utf8'
      });
      return { success: true, output: result };
    } catch (error) {
      return { success: false, output: error.message || error.stderr || error.stdout };
    }
  };

  beforeAll(() => {
    // Backup CLAUDE.md if it exists
    if (fs.existsSync(claudeMdPath)) {
      fs.copyFileSync(claudeMdPath, claudeMdBackupPath);
    }
  });

  afterAll(() => {
    // Restore CLAUDE.md if backup exists
    if (fs.existsSync(claudeMdBackupPath)) {
      fs.copyFileSync(claudeMdBackupPath, claudeMdPath);
      fs.unlinkSync(claudeMdBackupPath);
    }
    // Clean up active team file
    if (fs.existsSync(activeTeamPath)) {
      fs.unlinkSync(activeTeamPath);
    }
  });

  describe('team list command', () => {
    test('should list all available teams', () => {
      const result = runCommand('team list');

      expect(result.success).toBe(true);
      expect(result.output).toContain('base');
      expect(result.output).toContain('devops');
      expect(result.output).toContain('python_backend');
      expect(result.output).toContain('frontend');
      expect(result.output).toContain('fullstack');
    });

    test('should display team descriptions', () => {
      const result = runCommand('team list');

      expect(result.success).toBe(true);
      expect(result.output).toContain('Podstawowi agenci dostępni we wszystkich zespołach');
      expect(result.output).toContain('Zespół do zadań związanych z CI/CD');
      expect(result.output).toContain('Zespół specjalizujący się w tworzeniu backendu');
    });
  });

  describe('team current command', () => {
    test('should show no team when none is active', () => {
      // Remove active team file if exists
      if (fs.existsSync(activeTeamPath)) {
        fs.unlinkSync(activeTeamPath);
      }

      const result = runCommand('team current');

      expect(result.success).toBe(true);
      expect(result.output.toLowerCase()).toMatch(/no team|none|not set/i);
    });

    test('should show active team when one is loaded', () => {
      // Set an active team
      fs.writeFileSync(activeTeamPath, 'devops');

      const result = runCommand('team current');

      expect(result.success).toBe(true);
      expect(result.output).toContain('devops');
    });
  });

  describe('team load command', () => {
    test('should load devops team successfully', () => {
      const result = runCommand('team load devops');

      expect(result.success).toBe(true);
      expect(result.output.toLowerCase()).toContain('devops');
      expect(result.output.toLowerCase()).toMatch(/loaded|activated|set/i);

      // Check active team file
      expect(fs.existsSync(activeTeamPath)).toBe(true);
      const activeTeam = fs.readFileSync(activeTeamPath, 'utf8').trim();
      expect(activeTeam).toBe('devops');
    });

    test('should update CLAUDE.md with team agents', () => {
      const result = runCommand('team load frontend');

      expect(result.success).toBe(true);

      // Check CLAUDE.md contains frontend agents
      const claudeMd = fs.readFileSync(claudeMdPath, 'utf8');
      expect(claudeMd).toContain('react-ui-expert.md');
      expect(claudeMd).toContain('javascript-frontend-engineer.md');
      // Should also contain base agents due to inheritance
      expect(claudeMd).toContain('code-analyzer.md');
      expect(claudeMd).toContain('file-analyzer.md');
    });

    test('should handle inheritance correctly for fullstack team', () => {
      const result = runCommand('team load fullstack');

      expect(result.success).toBe(true);

      const claudeMd = fs.readFileSync(claudeMdPath, 'utf8');
      // Should contain agents from frontend
      expect(claudeMd).toContain('react-ui-expert.md');
      // Should contain agents from python_backend
      expect(claudeMd).toContain('python-backend-expert.md');
      // Should contain base agents
      expect(claudeMd).toContain('code-analyzer.md');
    });

    test('should handle non-existent team with error', () => {
      const result = runCommand('team load nonexistent');

      expect(result.success).toBe(false);
      expect(result.output.toLowerCase()).toMatch(/not found|does not exist|invalid/i);
    });

    test('should handle missing teams.json gracefully', () => {
      // Temporarily rename teams.json
      const tempPath = teamsConfigPath + '.temp';
      if (fs.existsSync(teamsConfigPath)) {
        fs.renameSync(teamsConfigPath, tempPath);
      }

      const result = runCommand('team list');

      expect(result.success).toBe(false);
      expect(result.output.toLowerCase()).toMatch(/not found|missing|error/i);

      // Restore teams.json
      if (fs.existsSync(tempPath)) {
        fs.renameSync(tempPath, teamsConfigPath);
      }
    });
  });

  describe('team agents resolution', () => {
    test('should resolve all agents including inherited ones', () => {
      const teamsConfig = JSON.parse(fs.readFileSync(teamsConfigPath, 'utf8'));

      // Simulate agent resolution logic
      const resolveAgents = (teamName, config, resolved = new Set()) => {
        const team = config[teamName];
        if (!team) return [];

        const agents = new Set();

        // Add direct agents
        if (team.agents) {
          team.agents.forEach(a => agents.add(a));
        }

        // Add inherited agents
        if (team.inherits) {
          team.inherits.forEach(parent => {
            if (!resolved.has(parent)) {
              resolved.add(parent);
              resolveAgents(parent, config, resolved).forEach(a => agents.add(a));
            }
          });
        }

        return Array.from(agents);
      };

      // Test base team
      const baseAgents = resolveAgents('base', teamsConfig);
      expect(baseAgents).toContain('code-analyzer.md');
      expect(baseAgents).toContain('file-analyzer.md');
      expect(baseAgents).toContain('test-runner.md');
      expect(baseAgents).toContain('agent-manager.md');

      // Test devops team (should include base + devops agents)
      const devopsAgents = resolveAgents('devops', teamsConfig);
      expect(devopsAgents.length).toBeGreaterThan(baseAgents.length);
      expect(devopsAgents).toContain('docker-containerization-expert.md');
      expect(devopsAgents).toContain('code-analyzer.md'); // from base

      // Test fullstack team (should include frontend + python_backend + base)
      const fullstackAgents = resolveAgents('fullstack', teamsConfig);
      expect(fullstackAgents).toContain('react-ui-expert.md'); // from frontend
      expect(fullstackAgents).toContain('python-backend-expert.md'); // from python_backend
      expect(fullstackAgents).toContain('code-analyzer.md'); // from base
    });
  });
});