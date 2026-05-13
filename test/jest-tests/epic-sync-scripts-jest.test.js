const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

/**
 * Jest Tests for epic-sync shell scripts
 * Tests for Bug #1-#5 fixes in create-epic-issue.sh and create-task-issues.sh
 */

const SCRIPTS_DIR = path.join(__dirname, '..', '..', 'packages', 'plugin-pm', 'scripts', 'pm', 'epic-sync');

describe('epic-sync shell scripts', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'epic-sync-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Bug #1: stdout contamination', () => {
    test('create-epic-issue.sh should only output issue number on stdout', () => {
      const script = fs.readFileSync(
        path.join(SCRIPTS_DIR, 'create-epic-issue.sh'),
        'utf8'
      );

      // All echo statements except the final return value should redirect to stderr
      const lines = script.split('\n');
      const echoLines = lines.filter(line => {
        const trimmed = line.trim();
        // Match echo statements that are NOT the final return value
        return trimmed.startsWith('echo ') && !trimmed.startsWith('echo "$');
      });

      const stdoutEchos = echoLines.filter(line => {
        const trimmed = line.trim();
        // Should redirect to stderr (>&2) unless it's the final value output
        return !trimmed.includes('>&2') && !trimmed.startsWith('echo "$');
      });

      expect(stdoutEchos).toEqual([]);
    });

    test('create-task-issues.sh should only output mapping file path on stdout', () => {
      const script = fs.readFileSync(
        path.join(SCRIPTS_DIR, 'create-task-issues.sh'),
        'utf8'
      );

      const lines = script.split('\n');
      const echoLines = lines.filter(line => {
        const trimmed = line.trim();
        return trimmed.startsWith('echo ') && !trimmed.startsWith('echo "$');
      });

      const stdoutEchos = echoLines.filter(line => {
        const trimmed = line.trim();
        return !trimmed.includes('>&2') && !trimmed.startsWith('echo "$');
      });

      expect(stdoutEchos).toEqual([]);
    });
  });

  describe('Bug #2: grep pattern for gh CLI output', () => {
    test('create-epic-issue.sh should extract issue number from URL format', () => {
      const script = fs.readFileSync(
        path.join(SCRIPTS_DIR, 'create-epic-issue.sh'),
        'utf8'
      );

      // Should NOT use grep -o '#[0-9]\+' which only matches old gh format
      expect(script).not.toMatch(/grep -o '#\[0-9\]/);

      // Should NOT merge stderr into stdout with 2>&1 on gh issue create
      expect(script).not.toMatch(/gh issue create[\s\S]*?2>&1\s*\|\s*grep/);
    });

    test('create-task-issues.sh should extract issue number from URL format', () => {
      const script = fs.readFileSync(
        path.join(SCRIPTS_DIR, 'create-task-issues.sh'),
        'utf8'
      );

      // Should NOT use grep -o '#[0-9]\+' which only matches old gh format
      expect(script).not.toMatch(/grep -o '#\[0-9\]/);

      // Should NOT merge stderr into stdout with 2>&1 on gh issue create
      expect(script).not.toMatch(/gh issue create[\s\S]*?2>&1\s*\|\s*grep/);
    });

    test('URL-based extraction pattern correctly extracts issue number', () => {
      // Simulate what the fixed grep does
      const ghOutput = 'https://github.com/user/repo/issues/42';
      const result = execSync(
        `echo "${ghOutput}" | grep -o '[0-9]\\+$'`,
        { encoding: 'utf8' }
      ).trim();

      expect(result).toBe('42');
    });
  });

  describe('Bug #3: awk frontmatter stripping with --- horizontal rules', () => {
    test('should preserve content after --- horizontal rules in markdown body', () => {
      // Create a test file with frontmatter AND a --- horizontal rule in body
      const testFile = path.join(tempDir, 'test-task.md');
      fs.writeFileSync(testFile, `---
name: test-task
status: open
---

# Test Task

Some content here.

---

## More Content After HR

This should NOT be dropped.

Final paragraph.
`);

      const script = fs.readFileSync(
        path.join(SCRIPTS_DIR, 'create-epic-issue.sh'),
        'utf8'
      );

      // Extract the awk command used for stripping frontmatter
      const awkMatch = script.match(/awk '([^']+)'/);
      expect(awkMatch).not.toBeNull();

      // Run the awk command from the script against the test file
      const result = execSync(
        `awk '${awkMatch[1]}' "${testFile}"`,
        { encoding: 'utf8' }
      );

      // Content after the horizontal rule MUST be preserved
      expect(result).toContain('More Content After HR');
      expect(result).toContain('This should NOT be dropped');
      expect(result).toContain('Final paragraph');
    });

    test('should strip frontmatter correctly for simple files', () => {
      const testFile = path.join(tempDir, 'simple.md');
      fs.writeFileSync(testFile, `---
name: simple
---

# Simple Task

Just content, no horizontal rules.
`);

      const script = fs.readFileSync(
        path.join(SCRIPTS_DIR, 'create-epic-issue.sh'),
        'utf8'
      );

      const awkMatch = script.match(/awk '([^']+)'/);
      const result = execSync(
        `awk '${awkMatch[1]}' "${testFile}"`,
        { encoding: 'utf8' }
      );

      expect(result).toContain('Simple Task');
      expect(result).toContain('Just content');
      expect(result).not.toContain('name: simple');
    });
  });

  describe('Bug #4: --body-file usage', () => {
    test('create-epic-issue.sh should use --body-file instead of --body', () => {
      const script = fs.readFileSync(
        path.join(SCRIPTS_DIR, 'create-epic-issue.sh'),
        'utf8'
      );

      // Should use --body-file for gh issue create
      expect(script).toContain('--body-file');
      // Should NOT use --body "$var" for the main issue creation
      // (--body-file in comment creation is fine, we check the main create)
      const mainCreateBlock = script.split('gh issue create')[1]?.split('\n').slice(0, 10).join('\n') || '';
      expect(mainCreateBlock).not.toMatch(/--body "\$/);
    });

    test('create-task-issues.sh should use --body-file instead of --body', () => {
      const script = fs.readFileSync(
        path.join(SCRIPTS_DIR, 'create-task-issues.sh'),
        'utf8'
      );

      // The main gh issue create should use --body-file
      expect(script).toContain('--body-file');
    });

    test('should use mktemp for temp files, not hardcoded paths', () => {
      const epicScript = fs.readFileSync(
        path.join(SCRIPTS_DIR, 'create-epic-issue.sh'),
        'utf8'
      );
      const taskScript = fs.readFileSync(
        path.join(SCRIPTS_DIR, 'create-task-issues.sh'),
        'utf8'
      );

      // Should NOT use hardcoded /tmp paths
      expect(epicScript).not.toMatch(/\/tmp\/epic-doc-comment\.md/);
      expect(taskScript).not.toMatch(/\/tmp\/task-doc-comment\.md/);

      // Should use mktemp
      expect(epicScript).toContain('mktemp');
      expect(taskScript).toContain('mktemp');
    });
  });

  describe('Bug #6: comma-separated labels in --label flag', () => {
    test('create-task-issues.sh should use separate --label flags', () => {
      const script = fs.readFileSync(
        path.join(SCRIPTS_DIR, 'create-task-issues.sh'),
        'utf8'
      );

      // Must NOT contain comma-separated labels in a single --label flag
      expect(script).not.toMatch(/--label\s+"[^"]*,[^"]*"/);
      // Must have separate --label "task" and --label "epic:
      expect(script).toMatch(/--label\s+"task"/);
      expect(script).toMatch(/--label\s+"epic:/);
    });

    test('create-epic-issue.sh should use separate --label flags', () => {
      const script = fs.readFileSync(
        path.join(SCRIPTS_DIR, 'create-epic-issue.sh'),
        'utf8'
      );

      // Must NOT contain comma-separated labels in a single --label flag
      expect(script).not.toMatch(/--label\s+"[^"]*,[^"]*"/);
      // Must NOT pass $labels as a single --label (which contained comma-separated values)
      expect(script).not.toMatch(/--label\s+"\$\{?labels\}?"/);
    });

    test('github-utils.sh create_github_issue should use build_label_flags', () => {
      const script = fs.readFileSync(
        path.join(__dirname, '..', '..', '.claude', 'scripts', 'lib', 'github-utils.sh'),
        'utf8'
      );

      // Should have a build_label_flags function
      expect(script).toContain('build_label_flags()');
      // create_github_issue should NOT use --label "$labels" directly
      expect(script).not.toMatch(/gh issue create[\s\S]*?--label "\$\{?labels\}?"/);
      // Should use "${label_flags[@]}" instead
      expect(script).toContain('"${label_flags[@]}"');
    });

    test('github-utils.sh create_github_subissue should use build_label_flags', () => {
      const script = fs.readFileSync(
        path.join(__dirname, '..', '..', '.claude', 'scripts', 'lib', 'github-utils.sh'),
        'utf8'
      );

      // The sub-issue create block should NOT use --label "$labels"
      const subissueBlock = script.split('create_github_subissue')[1] || '';
      expect(subissueBlock).not.toMatch(/--label "\$\{?labels\}?"/);
      // Should use label_flags
      expect(subissueBlock).toContain('label_flags');
    });

    test('no comma-separated labels in any epic-sync script', () => {
      const scriptFiles = fs.readdirSync(SCRIPTS_DIR)
        .filter(f => f.endsWith('.sh'));

      for (const file of scriptFiles) {
        const content = fs.readFileSync(path.join(SCRIPTS_DIR, file), 'utf8');
        const commaLabelMatches = content.match(/--label\s+"[^"]*,[^"]*"/g);
        expect(commaLabelMatches).toBeNull();
      }
    });
  });

  describe('Bug #5: title fallback', () => {
    test('create-task-issues.sh should have separate fallback for empty title', () => {
      const script = fs.readFileSync(
        path.join(SCRIPTS_DIR, 'create-task-issues.sh'),
        'utf8'
      );

      // Should have an explicit check for empty title with fallback
      expect(script).toMatch(/if \[\[ -z "\$task_title" \]\]/);
    });

    test('title extraction should work for file with heading', () => {
      const testFile = path.join(tempDir, 'with-heading.md');
      fs.writeFileSync(testFile, `---
name: test
---

# My Task Title

Content here.
`);

      // Simulate the fixed title extraction
      const result = execSync(
        `content=$(awk 'BEGIN{p=0; done=0} /^---$/ && !done {p++; if(p==2) done=1; next} p>=2{print}' "${testFile}"); title=$(echo "$content" | grep -m1 "^#" | sed 's/^# *//'); if [ -z "$title" ]; then title="Fallback"; fi; echo "$title"`,
        { encoding: 'utf8' }
      ).trim();

      expect(result).toBe('My Task Title');
    });

    test('title extraction should use fallback for file without heading', () => {
      const testFile = path.join(tempDir, 'no-heading.md');
      fs.writeFileSync(testFile, `---
name: test
---

Just content, no heading.
`);

      const result = execSync(
        `content=$(awk 'BEGIN{p=0; done=0} /^---$/ && !done {p++; if(p==2) done=1; next} p>=2{print}' "${testFile}"); title=$(echo "$content" | grep -m1 "^#" | sed 's/^# *//' || true); if [ -z "$title" ]; then title="Task fallback"; fi; echo "$title"`,
        { encoding: 'utf8' }
      ).trim();

      expect(result).toBe('Task fallback');
    });
  });
});
