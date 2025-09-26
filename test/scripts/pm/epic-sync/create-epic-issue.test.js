const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Create Epic Issue Script', () => {
  const scriptPath = path.join(__dirname, '../../../../autopm/.claude/scripts/pm/epic-sync/create-epic-issue.sh');
  let tempDir;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'epic-issue-test-'));
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('script should be executable', () => {
    expect(fs.existsSync(scriptPath)).toBe(true);

    const stats = fs.statSync(scriptPath);
    expect(stats.mode & 0o111).not.toBe(0);
  });

  test('script should show usage when called without arguments', () => {
    try {
      execSync(`${scriptPath}`, { encoding: 'utf8', stdio: 'pipe' });
      fail('Script should have exited with error');
    } catch (error) {
      expect(error.status).toBe(1);
      // Usage message might be in stderr, check both
      const output = (error.stdout || '') + (error.stderr || '');
      expect(output).toMatch(/Usage:|epic_name/);
    }
  });

  test('script should validate epic name format', () => {
    try {
      execSync(`${scriptPath} "invalid name with spaces"`, {
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, AUTOPM_LOG_LEVEL: '3' }
      });
      fail('Script should have rejected invalid epic name');
    } catch (error) {
      expect(error.status).toBe(1);
    }
  });

  test('script should handle missing epic directory', () => {
    try {
      execSync(`${scriptPath} nonexistent-epic`, {
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, AUTOPM_LOG_LEVEL: '3' }
      });
      fail('Script should have failed for missing epic');
    } catch (error) {
      expect(error.status).toBe(1);
    }
  });

  test('awk processing logic should work correctly', () => {
    // Create test epic content
    const testContent = `# Epic Title

## Description
This is a test epic.

## Tasks Created
- [ ] Task 1
- [ ] Task 2

Total tasks: 2
Parallel tasks: 1
Sequential tasks: 1

## Next Steps
Continue with implementation.`;

    const inputFile = path.join(tempDir, 'input.md');
    const outputFile = path.join(tempDir, 'output.md');
    fs.writeFileSync(inputFile, testContent);

    // Run the awk processing logic directly
    const awkScript = `
      awk -v total_tasks="3" \\
          -v parallel_tasks="2" \\
          -v sequential_tasks="1" \\
          -v total_effort="8" '
          /^## Tasks Created/ {
              in_tasks=1
              next
          }
          /^## / && in_tasks {
              in_tasks=0
              print "## Stats"
              print ""
              print "Total tasks: " total_tasks
              print "Parallel tasks: " parallel_tasks " (can be worked on simultaneously)"
              print "Sequential tasks: " sequential_tasks " (have dependencies)"
              if (total_effort) print "Estimated total effort: " total_effort " hours"
              print ""
          }
          /^Total tasks:/ && in_tasks { next }
          /^Parallel tasks:/ && in_tasks { next }
          /^Sequential tasks:/ && in_tasks { next }
          /^Estimated total effort:/ && in_tasks { next }
          !in_tasks { print }
          END {
              if (in_tasks) {
                  print "## Stats"
                  print ""
                  print "Total tasks: " total_tasks
                  print "Parallel tasks: " parallel_tasks " (can be worked on simultaneously)"
                  print "Sequential tasks: " sequential_tasks " (have dependencies)"
                  if (total_effort) print "Estimated total effort: " total_effort " hours"
              }
          }
      ' "${inputFile}" > "${outputFile}"
    `;

    execSync(awkScript, { shell: '/bin/bash' });
    const result = fs.readFileSync(outputFile, 'utf8');

    expect(result).toContain('## Stats');
    expect(result).toContain('Total tasks: 3');
    expect(result).toContain('Parallel tasks: 2 (can be worked on simultaneously)');
    expect(result).toContain('Sequential tasks: 1 (have dependencies)');
    expect(result).toContain('Estimated total effort: 8 hours');
    expect(result).toContain('## Next Steps');
    expect(result).not.toContain('## Tasks Created');
  });

  test('epic type determination should work correctly', () => {
    // Test bug detection
    const bugContent = `# Epic: Fix Authentication Issue

This epic addresses critical security bugs in the authentication system.
We need to fix the login error and patch the vulnerability.`;

    const bugFile = path.join(tempDir, 'bug-epic.md');
    fs.writeFileSync(bugFile, bugContent);

    const bugResult = execSync(`
      if grep -qi "bug\\|fix\\|issue\\|problem\\|error\\|hotfix\\|patch" "${bugFile}"; then
        echo "bug"
      else
        echo "feature"
      fi
    `, { encoding: 'utf8', shell: '/bin/bash' }).trim();

    expect(bugResult).toBe('bug');

    // Test feature detection
    const featureContent = `# Epic: New User Dashboard

This epic implements a new user dashboard with analytics and reporting capabilities.`;

    const featureFile = path.join(tempDir, 'feature-epic.md');
    fs.writeFileSync(featureFile, featureContent);

    const featureResult = execSync(`
      if grep -qi "bug\\|fix\\|issue\\|problem\\|error\\|hotfix\\|patch" "${featureFile}"; then
        echo "bug"
      else
        echo "feature"
      fi
    `, { encoding: 'utf8', shell: '/bin/bash' }).trim();

    expect(featureResult).toBe('feature');
  });

  test('script dependencies should be correctly structured', () => {
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');

    // Check that script loads all required libraries
    expect(scriptContent).toMatch(/source.*logging-utils\.sh/);
    expect(scriptContent).toMatch(/source.*github-utils\.sh/);
    expect(scriptContent).toMatch(/source.*frontmatter-utils\.sh/);
    expect(scriptContent).toMatch(/source.*validation-utils\.sh/);

    // Check that main functions are defined
    expect(scriptContent).toMatch(/^main\(\s*\)\s*{/m);
    expect(scriptContent).toMatch(/^process_epic_content\(/m);
    expect(scriptContent).toMatch(/^determine_epic_type\(/m);
    expect(scriptContent).toMatch(/^create_epic_github_issue\(/m);

    // Check error handling
    expect(scriptContent).toMatch(/trap.*handle_error.*ERR/);
    expect(scriptContent).toMatch(/set -euo pipefail/);
  });
});