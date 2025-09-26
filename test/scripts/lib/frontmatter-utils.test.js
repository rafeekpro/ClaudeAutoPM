const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Frontmatter Utils Library', () => {
  const scriptPath = path.join(__dirname, '../../../autopm/.claude/scripts/lib/frontmatter-utils.sh');
  let tempDir;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'frontmatter-test-'));
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    // Ensure script exists before testing
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  describe('update_frontmatter_field function', () => {
    test('should update existing field in frontmatter', () => {
      const testFile = path.join(tempDir, 'test.md');
      const content = `---
name: Test Task
status: open
created: 2024-01-01T00:00:00Z
---

# Test Content
Some markdown content here.`;

      fs.writeFileSync(testFile, content);

      const testScript = `
        source ${scriptPath}
        update_frontmatter_field "${testFile}" "status" "closed"
        grep "^status:" "${testFile}"
      `;

      const result = execSync(testScript, { encoding: 'utf8' }).trim();
      expect(result).toBe('status: closed');
    });

    test('should add new field if not exists', () => {
      const testFile = path.join(tempDir, 'test2.md');
      const content = `---
name: Test Task
status: open
---

# Test Content`;

      fs.writeFileSync(testFile, content);

      const testScript = `
        source ${scriptPath}
        update_frontmatter_field "${testFile}" "github" "https://github.com/user/repo/issues/123"
        grep "^github:" "${testFile}"
      `;

      const result = execSync(testScript, { encoding: 'utf8' }).trim();
      expect(result).toBe('github: https://github.com/user/repo/issues/123');
    });
  });

  describe('get_frontmatter_field function', () => {
    test('should extract field value from frontmatter', () => {
      const testFile = path.join(tempDir, 'test3.md');
      const content = `---
name: Test Epic
status: in-progress
progress: 45%
---

# Epic Content`;

      fs.writeFileSync(testFile, content);

      const testScript = `
        source ${scriptPath}
        get_frontmatter_field "${testFile}" "progress"
      `;

      const result = execSync(testScript, { encoding: 'utf8' }).trim();
      expect(result).toBe('45%');
    });

    test('should return empty string for non-existent field', () => {
      const testFile = path.join(tempDir, 'test4.md');
      const content = `---
name: Test Epic
status: open
---

# Content`;

      fs.writeFileSync(testFile, content);

      const testScript = `
        source ${scriptPath}
        result=$(get_frontmatter_field "${testFile}" "nonexistent")
        echo "RESULT:${result}:END"
      `;

      const result = execSync(testScript, { encoding: 'utf8' }).trim();
      expect(result).toBe('RESULT::END');
    });
  });

  describe('strip_frontmatter function', () => {
    test('should remove frontmatter and return content only', () => {
      const testFile = path.join(tempDir, 'test5.md');
      const outputFile = path.join(tempDir, 'output.md');
      const content = `---
name: Test Task
status: open
created: 2024-01-01T00:00:00Z
---

# Main Content

This is the actual content without frontmatter.`;

      fs.writeFileSync(testFile, content);

      const testScript = `
        source ${scriptPath}
        strip_frontmatter "${testFile}" "${outputFile}"
        cat "${outputFile}"
      `;

      const result = execSync(testScript, { encoding: 'utf8' }).trim();
      expect(result).toBe(`# Main Content

This is the actual content without frontmatter.`);
    });
  });
});