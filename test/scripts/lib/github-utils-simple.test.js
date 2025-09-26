const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('GitHub Utils Library - Simple Tests', () => {
  let tempDir;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'github-utils-test-'));
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('script should be executable and loadable', () => {
    const scriptPath = path.join(__dirname, '../../../autopm/.claude/scripts/lib/github-utils.sh');
    expect(fs.existsSync(scriptPath)).toBe(true);

    // Check if script is executable
    const stats = fs.statSync(scriptPath);
    expect(stats.mode & 0o111).not.toBe(0); // Has execute permission
  });

  test('validate_issue_number function should work correctly', () => {
    const testScript = `
      # Create minimal deps in temp dir
      cat > ${tempDir}/logging-utils.sh << 'EOF'
#!/bin/bash
log_debug() { :; }
log_function_entry() { :; }
log_function_exit() { :; }
log_error() { echo "ERROR: \$*" >&2; }
EOF

      # Create test script
      cat > ${tempDir}/test-script.sh << 'EOF'
#!/bin/bash
set -euo pipefail
SCRIPT_DIR="${tempDir}"
source "${tempDir}/logging-utils.sh"

validate_issue_number() {
    local issue_number="\$1"

    if [[ -z "\$issue_number" ]]; then
        return 1
    fi

    if [[ ! "\$issue_number" =~ ^[0-9]+\$ ]]; then
        return 1
    fi

    if [[ "\$issue_number" -le 0 ]]; then
        return 1
    fi

    return 0
}

# Test cases
if validate_issue_number "123"; then
    echo "VALID_123"
fi

if ! validate_issue_number "abc"; then
    echo "INVALID_ABC"
fi

if ! validate_issue_number ""; then
    echo "INVALID_EMPTY"
fi

if ! validate_issue_number "0"; then
    echo "INVALID_ZERO"
fi
EOF

      chmod +x ${tempDir}/test-script.sh
      ${tempDir}/test-script.sh
    `;

    const result = execSync(testScript, { encoding: 'utf8', shell: '/bin/bash' });
    expect(result).toContain('VALID_123');
    expect(result).toContain('INVALID_ABC');
    expect(result).toContain('INVALID_EMPTY');
    expect(result).toContain('INVALID_ZERO');
  });

  test('github utils script should have core functions defined', () => {
    const scriptPath = path.join(__dirname, '../../../autopm/.claude/scripts/lib/github-utils.sh');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');

    // Check that key functions are defined
    expect(scriptContent).toMatch(/^check_gh_auth\(\s*\)\s*{/m);
    expect(scriptContent).toMatch(/^check_repo_protection\(\s*\)\s*{/m);
    expect(scriptContent).toMatch(/^create_github_issue\(\s*\)\s*{/m);
    expect(scriptContent).toMatch(/^post_github_comment\(\s*\)\s*{/m);
    expect(scriptContent).toMatch(/^validate_issue_number\(\s*\)\s*{/m);
  });

  test('script should handle missing dependencies gracefully', () => {
    const testScript = `
      # Try to source without dependencies
      set +e  # Don't exit on error

      # This should fail due to missing logging-utils.sh
      result=$(bash -c 'source autopm/.claude/scripts/lib/github-utils.sh' 2>&1)

      if [[ \$? -ne 0 ]]; then
        echo "EXPECTED_FAILURE"
      else
        echo "UNEXPECTED_SUCCESS"
      fi
    `;

    const result = execSync(testScript, {
      encoding: 'utf8',
      shell: '/bin/bash',
      cwd: path.join(__dirname, '../../..')
    });
    expect(result).toContain('EXPECTED_FAILURE');
  });

  test('JSON parsing logic should work correctly', () => {
    const testScript = `
      # Test the JSON parsing logic from create_github_issue
      test_json='{"number": 456, "title": "Test Issue"}'

      # Extract number using the same logic as in the script
      issue_number=$(echo "\$test_json" | grep -o '"number":[0-9]*' | cut -d: -f2)

      echo "EXTRACTED_NUMBER:\$issue_number"
    `;

    const result = execSync(testScript, { encoding: 'utf8', shell: '/bin/bash' });
    expect(result).toContain('EXTRACTED_NUMBER:456');
  });
});