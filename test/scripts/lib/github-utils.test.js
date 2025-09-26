const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('GitHub Utils Library', () => {
  const scriptPath = path.join(__dirname, '../../../autopm/.claude/scripts/lib/github-utils.sh');

  beforeAll(() => {
    // Ensure script exists before testing
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  describe('check_gh_auth function', () => {
    test('should detect when GitHub CLI is not authenticated', () => {
      const testScript = `
        export AUTOPM_LOG_LEVEL=3  # ERROR level only

        # Create minimal logging-utils.sh
        cat > /tmp/logging-utils.sh << 'EOF'
#!/bin/bash
log_debug() { :; }
log_info() { :; }
log_error() { echo "ERROR: $*" >&2; }
log_success() { :; }
EOF

        # Source github-utils with mocked dependencies
        SCRIPT_DIR="/tmp" source ${scriptPath}

        # Mock gh command to fail
        gh() {
          if [[ "$1" == "auth" && "$2" == "status" ]]; then
            return 1
          fi
          return 0
        }
        export -f gh

        # Test function
        if check_gh_auth 2>/dev/null; then
          echo "UNEXPECTED_SUCCESS"
        else
          echo "AUTH_FAILED"
        fi
      `;

      const result = execSync(testScript, { encoding: 'utf8', shell: '/bin/bash' }).trim();
      expect(result).toContain('AUTH_FAILED');
    });

    test('should pass when GitHub CLI is authenticated', () => {
      const testScript = `
        export AUTOPM_LOG_LEVEL=3  # ERROR level only

        # Create minimal logging-utils.sh
        cat > /tmp/logging-utils.sh << 'EOF'
#!/bin/bash
log_debug() { :; }
log_info() { :; }
log_error() { :; }
log_success() { :; }
EOF

        # Source github-utils with mocked dependencies
        SCRIPT_DIR="/tmp" source ${scriptPath}

        # Mock gh command to succeed
        gh() {
          if [[ "$1" == "auth" && "$2" == "status" ]]; then
            return 0
          fi
          return 0
        }
        command() {
          if [[ "$2" == "gh" ]]; then
            return 0
          fi
          return 1
        }
        export -f gh command

        # Test function
        if check_gh_auth 2>/dev/null; then
          echo "AUTH_OK"
        else
          echo "AUTH_FAILED"
        fi
      `;

      const result = execSync(testScript, { encoding: 'utf8', shell: '/bin/bash' }).trim();
      expect(result).toContain('AUTH_OK');
    });
  });

  describe('check_repo_protection function', () => {
    test('should detect AutoPM template repository', () => {
      const testScript = `
        export AUTOPM_LOG_LEVEL=3

        # Create minimal logging-utils.sh
        cat > /tmp/logging-utils.sh << 'EOF'
#!/bin/bash
log_debug() { :; }
log_error() { echo "ERROR: $*" >&2; }
EOF

        # Source with mocked dependencies
        SCRIPT_DIR="/tmp" source ${scriptPath}

        # Mock git remote to return template repo
        git() {
          if [[ "$1" == "remote" && "$2" == "get-url" ]]; then
            echo "https://github.com/rlagowski/autopm.git"
          fi
        }
        export -f git

        # Test function
        if check_repo_protection 2>/dev/null; then
          echo "UNEXPECTED_SUCCESS"
        else
          echo "TEMPLATE_DETECTED"
        fi
      `;

      const result = execSync(testScript, { encoding: 'utf8', shell: '/bin/bash' }).trim();
      expect(result).toContain('TEMPLATE_DETECTED');
    });

    test('should allow non-template repositories', () => {
      const testScript = `
        export AUTOPM_LOG_LEVEL=3

        # Create minimal logging-utils.sh
        cat > /tmp/logging-utils.sh << 'EOF'
#!/bin/bash
log_debug() { :; }
log_warning() { :; }
EOF

        # Source with mocked dependencies
        SCRIPT_DIR="/tmp" source ${scriptPath}

        # Mock git remote to return user repo
        git() {
          if [[ "$1" == "remote" && "$2" == "get-url" ]]; then
            echo "https://github.com/user/project.git"
          fi
        }
        export -f git

        # Test function
        if check_repo_protection 2>/dev/null; then
          echo "REPO_OK"
        else
          echo "REPO_FAILED"
        fi
      `;

      const result = execSync(testScript, { encoding: 'utf8', shell: '/bin/bash' }).trim();
      expect(result).toContain('REPO_OK');
    });
  });

  describe('create_github_issue function', () => {
    test('should create issue with proper parameters', () => {
      const testScript = `
        export AUTOPM_LOG_LEVEL=3

        # Create minimal logging-utils.sh
        cat > /tmp/logging-utils.sh << 'EOF'
#!/bin/bash
log_debug() { :; }
log_info() { :; }
log_error() { :; }
log_success() { :; }
log_function_entry() { :; }
log_function_exit() { :; }
EOF

        # Source with mocked dependencies
        SCRIPT_DIR="/tmp" source ${scriptPath}

        # Mock check_gh_auth to succeed
        check_gh_auth() { return 0; }

        # Mock gh command to return JSON
        gh() {
          if [[ "$1" == "issue" && "$2" == "create" ]]; then
            echo '{"number": 123}'
          fi
        }
        export -f check_gh_auth gh

        # Create test body file
        echo "Test issue body" > /tmp/test-body.md

        # Test function
        result=$(create_github_issue "Test Title" "/tmp/test-body.md" "test,epic" 2>/dev/null)
        echo "ISSUE_NUMBER:$result"

        # Cleanup
        rm -f /tmp/test-body.md
      `;

      const result = execSync(testScript, { encoding: 'utf8', shell: '/bin/bash' }).trim();
      expect(result).toContain('ISSUE_NUMBER:123');
    });
  });
});