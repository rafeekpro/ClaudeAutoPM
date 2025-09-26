const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Create Task Issues Script', () => {
  const scriptPath = path.join(__dirname, '../../../../autopm/.claude/scripts/pm/epic-sync/create-task-issues.sh');
  let tempDir;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'task-issues-test-'));
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('script should be executable', () => {
    expect(fs.existsSync(scriptPath)).toBe(true);

    const stats = fs.statSync(scriptPath);
    expect(stats.mode & 0o111).not.toBe(0);
  });

  test('script should show usage when called with insufficient arguments', () => {
    try {
      execSync(`${scriptPath}`, { encoding: 'utf8', stdio: 'pipe' });
      fail('Script should have exited with error');
    } catch (error) {
      expect(error.status).toBe(1);
      const output = (error.stdout || '') + (error.stderr || '');
      expect(output).toMatch(/Usage:|epic_name|epic_issue_number/);
    }
  });

  test('script should validate epic name format', () => {
    try {
      execSync(`${scriptPath} "invalid epic" 123`, {
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, AUTOPM_LOG_LEVEL: '3' }
      });
      fail('Script should have rejected invalid epic name');
    } catch (error) {
      expect(error.status).toBe(1);
    }
  });

  test('script should validate issue number format', () => {
    try {
      execSync(`${scriptPath} valid-epic abc`, {
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, AUTOPM_LOG_LEVEL: '3' }
      });
      fail('Script should have rejected invalid issue number');
    } catch (error) {
      expect(error.status).toBe(1);
    }
  });

  test('parallel threshold logic should work correctly', () => {
    // Test batch calculation logic
    const testScript = `
      # Test the batch splitting logic
      task_count=13
      batch_size=4

      echo "Total tasks: $task_count"
      echo "Batch size: $batch_size"

      # Calculate number of batches
      batches=$(( (task_count + batch_size - 1) / batch_size ))
      echo "Expected batches: $batches"

      # Simulate the loop
      for ((i=0; i<task_count; i+=batch_size)); do
        end=$((i + batch_size - 1))
        if [[ $end -ge $task_count ]]; then
          end=$((task_count - 1))
        fi
        echo "Batch: tasks $i to $end"
      done
    `;

    const result = execSync(testScript, { encoding: 'utf8', shell: '/bin/bash' });

    expect(result).toContain('Total tasks: 13');
    expect(result).toContain('Expected batches: 4');
    expect(result).toContain('Batch: tasks 0 to 3');
    expect(result).toContain('Batch: tasks 4 to 7');
    expect(result).toContain('Batch: tasks 8 to 11');
    expect(result).toContain('Batch: tasks 12 to 12');
  });

  test('frontmatter extraction should work correctly', () => {
    // Create test task file
    const taskContent = `---
name: Implement User Authentication
status: ready
priority: high
effort: 8
parallel: true
depends_on: []
---

# User Authentication Implementation

## Acceptance Criteria
1. Users can register with email/password
2. Users can login securely
3. JWT tokens are properly managed

## Technical Requirements
- Use bcrypt for password hashing
- Implement JWT token refresh
- Add rate limiting for login attempts`;

    const taskFile = path.join(tempDir, 'test-task.md');
    fs.writeFileSync(taskFile, taskContent);

    // Test name extraction (simulates get_frontmatter_field)
    const nameResult = execSync(`
      grep '^name:' "${taskFile}" | sed 's/^name: *//'
    `, { encoding: 'utf8', shell: '/bin/bash' }).trim();

    expect(nameResult).toBe('Implement User Authentication');

    // Test frontmatter stripping (simulates strip_frontmatter)
    const bodyResult = execSync(`
      sed '1,/^---$/d; 1,/^---$/d' "${taskFile}"
    `, { encoding: 'utf8', shell: '/bin/bash' });

    expect(bodyResult).toContain('# User Authentication Implementation');
    expect(bodyResult).toContain('## Acceptance Criteria');
    expect(bodyResult).not.toContain('name: Implement User Authentication');
    expect(bodyResult).not.toContain('status: ready');
  });

  test('task file discovery should work correctly', () => {
    // Create mock epic directory structure
    const epicDir = path.join(tempDir, 'test-epic');
    fs.mkdirSync(epicDir, { recursive: true });

    // Create numbered task files
    const taskFiles = ['001.md', '002.md', '003.md', 'epic.md', 'notes.md'];

    taskFiles.forEach(filename => {
      const content = filename.startsWith('00')
        ? `---\nname: Task ${filename}\n---\n\n# Task content`
        : `# ${filename} content`;
      fs.writeFileSync(path.join(epicDir, filename), content);
    });

    // Test task file discovery
    const discoveryResult = execSync(`
      find "${epicDir}" -name '[0-9][0-9][0-9].md' -type f | sort
    `, { encoding: 'utf8', shell: '/bin/bash' });

    const foundFiles = discoveryResult.trim().split('\n');
    expect(foundFiles).toHaveLength(3);
    expect(foundFiles[0]).toContain('001.md');
    expect(foundFiles[1]).toContain('002.md');
    expect(foundFiles[2]).toContain('003.md');

    // Should not include epic.md or notes.md
    expect(discoveryResult).not.toContain('epic.md');
    expect(discoveryResult).not.toContain('notes.md');
  });

  test('gh-sub-issue detection logic should work', () => {
    // Test the gh extension detection logic
    const testScript = `
      # Mock gh extension list command
      gh() {
        if [[ "$1" == "extension" && "$2" == "list" ]]; then
          echo "yahsan2/gh-sub-issue v1.0.0"
          echo "other/extension v2.0.0"
        fi
      }
      export -f gh

      if gh extension list | grep -q "yahsan2/gh-sub-issue"; then
        echo "SUBISSUES_AVAILABLE"
      else
        echo "SUBISSUES_NOT_AVAILABLE"
      fi
    `;

    const result = execSync(testScript, { encoding: 'utf8', shell: '/bin/bash' });
    expect(result.trim()).toBe('SUBISSUES_AVAILABLE');

    // Test when extension is not available
    const testScript2 = `
      gh() {
        if [[ "$1" == "extension" && "$2" == "list" ]]; then
          echo "other/extension v2.0.0"
        fi
      }
      export -f gh

      if gh extension list | grep -q "yahsan2/gh-sub-issue"; then
        echo "SUBISSUES_AVAILABLE"
      else
        echo "SUBISSUES_NOT_AVAILABLE"
      fi
    `;

    const result2 = execSync(testScript2, { encoding: 'utf8', shell: '/bin/bash' });
    expect(result2.trim()).toBe('SUBISSUES_NOT_AVAILABLE');
  });

  test('mapping file format should be correct', () => {
    // Test mapping file creation and format
    const mappingContent = `/path/to/001.md:123
/path/to/002.md:124
/path/to/003.md:125`;

    const mappingFile = path.join(tempDir, 'test-mapping.txt');
    fs.writeFileSync(mappingFile, mappingContent);

    // Test mapping file parsing
    const parseResult = execSync(`
      while IFS=: read -r task_file issue_number; do
        task_name=$(basename "$task_file" .md)
        echo "Task: $task_name -> Issue: #$issue_number"
      done < "${mappingFile}"
    `, { encoding: 'utf8', shell: '/bin/bash' });

    expect(parseResult).toContain('Task: 001 -> Issue: #123');
    expect(parseResult).toContain('Task: 002 -> Issue: #124');
    expect(parseResult).toContain('Task: 003 -> Issue: #125');
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
    expect(scriptContent).toMatch(/^create_tasks_sequential\(/m);
    expect(scriptContent).toMatch(/^create_tasks_parallel\(/m);
    expect(scriptContent).toMatch(/^process_task_batch\(/m);

    // Check configuration and error handling
    expect(scriptContent).toMatch(/readonly EPIC_NAME/);
    expect(scriptContent).toMatch(/readonly EPIC_NUMBER/);
    expect(scriptContent).toMatch(/AUTOPM_PARALLEL_THRESHOLD/);
    expect(scriptContent).toMatch(/trap.*handle_error.*ERR/);
    expect(scriptContent).toMatch(/set -euo pipefail/);
  });

  test('environment variable handling should work', () => {
    // Test custom parallel threshold
    const testScript = `
      THRESHOLD=\${AUTOPM_PARALLEL_THRESHOLD:-5}
      echo "Default threshold: \$THRESHOLD"

      AUTOPM_PARALLEL_THRESHOLD=3
      THRESHOLD=\${AUTOPM_PARALLEL_THRESHOLD:-5}
      echo "Custom threshold: \$THRESHOLD"
    `;

    const result = execSync(testScript, { encoding: 'utf8', shell: '/bin/bash' });
    expect(result).toContain('Default threshold: 5');
    expect(result).toContain('Custom threshold: 3');
  });
});