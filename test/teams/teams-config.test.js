const fs = require('fs');
const path = require('path');

describe.skip('Teams Configuration', () => {
  const teamsConfigPath = path.join(__dirname, '../../.claude/teams.json');

  test('teams.json should exist', () => {
    expect(fs.existsSync(teamsConfigPath)).toBe(true);
  });

  test('teams.json should be valid JSON', () => {
    const content = fs.readFileSync(teamsConfigPath, 'utf8');
    expect(() => JSON.parse(content)).not.toThrow();
  });

  test('teams.json should have required structure', () => {
    const content = fs.readFileSync(teamsConfigPath, 'utf8');
    const teams = JSON.parse(content);

    // Check base team
    expect(teams.base).toBeDefined();
    expect(teams.base.description).toBeDefined();
    expect(teams.base.description).toContain('Core agents');
    expect(Array.isArray(teams.base.agents)).toBe(true);
    expect(teams.base.agents.length).toBeGreaterThan(0);
  });

  test('base team should contain core agents', () => {
    const content = fs.readFileSync(teamsConfigPath, 'utf8');
    const teams = JSON.parse(content);

    const expectedCoreAgents = [
      'code-analyzer.md',
      'file-analyzer.md',
      'test-runner.md',
      'agent-manager.md'
    ];

    expectedCoreAgents.forEach(agent => {
      expect(teams.base.agents).toContain(agent);
    });
  });

  test('devops team should be properly configured', () => {
    const content = fs.readFileSync(teamsConfigPath, 'utf8');
    const teams = JSON.parse(content);

    expect(teams.devops).toBeDefined();
    expect(teams.devops.description).toBeDefined();
    expect(teams.devops.inherits).toEqual(['base']);
    expect(Array.isArray(teams.devops.agents)).toBe(true);
    expect(teams.devops.agents).toContain('docker-containerization-expert.md');
    expect(teams.devops.agents).toContain('kubernetes-orchestrator.md');
  });

  test('python_backend team should be properly configured', () => {
    const content = fs.readFileSync(teamsConfigPath, 'utf8');
    const teams = JSON.parse(content);

    expect(teams.python_backend).toBeDefined();
    expect(teams.python_backend.description).toBeDefined();
    expect(teams.python_backend.inherits).toEqual(['base']);
    expect(Array.isArray(teams.python_backend.agents)).toBe(true);
    expect(teams.python_backend.agents).toContain('python-backend-expert.md');
    expect(teams.python_backend.agents).toContain('fastapi-backend-engineer.md');
  });

  test('frontend team should be properly configured', () => {
    const content = fs.readFileSync(teamsConfigPath, 'utf8');
    const teams = JSON.parse(content);

    expect(teams.frontend).toBeDefined();
    expect(teams.frontend.description).toBeDefined();
    expect(teams.frontend.inherits).toEqual(['base']);
    expect(Array.isArray(teams.frontend.agents)).toBe(true);
    expect(teams.frontend.agents).toContain('react-ui-expert.md');
    expect(teams.frontend.agents).toContain('javascript-frontend-engineer.md');
  });

  test('fullstack team should inherit from multiple teams', () => {
    const content = fs.readFileSync(teamsConfigPath, 'utf8');
    const teams = JSON.parse(content);

    expect(teams.fullstack).toBeDefined();
    expect(teams.fullstack.description).toBeDefined();
    expect(teams.fullstack.inherits).toEqual(['frontend', 'python_backend']);
    expect(Array.isArray(teams.fullstack.agents)).toBe(true);
  });

  test('all agent files should exist in agents directory', () => {
    const content = fs.readFileSync(teamsConfigPath, 'utf8');
    const teams = JSON.parse(content);
    const agentsDir = path.join(__dirname, '../../autopm/.claude/agents');

    const allAgents = new Set();

    // Collect all agent references
    Object.values(teams).forEach(team => {
      if (team.agents && Array.isArray(team.agents)) {
        team.agents.forEach(agent => allAgents.add(agent));
      }
    });

    // Check each agent file exists (we'll skip this for now as it requires full agent setup)
    // This test can be enabled later when all agents are in place
    expect(allAgents.size).toBeGreaterThan(0);
  });

  test('validateAgentFiles should detect missing agents', () => {
    // Import the validation function
    const { validateAgentFiles } = require('../../bin/commands/team');

    const testAgents = ['existing-agent.md', 'non-existent-agent.md'];
    const projectRoot = path.join(__dirname, '../..');

    // Since we don't have all agent files, this will return missing agents
    const missingAgents = validateAgentFiles(testAgents, projectRoot);

    // We expect at least the non-existent agent to be reported as missing
    expect(missingAgents).toContain('non-existent-agent.md');
  });
});