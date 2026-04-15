#!/usr/bin/env bats
# Tests for sync-to-obsidian.sh
# Requires: bats-core (https://github.com/bats-core/bats-core)

SCRIPT_DIR="$(cd "$(dirname "${BATS_TEST_FILENAME}")" && pwd)"
SYNC_SCRIPT="${SCRIPT_DIR}/../scripts/obsidian/sync-to-obsidian.sh"

setup() {
    export TEST_DIR
    TEST_DIR="$(mktemp -d)"

    # Create a fake project root with .claude/config.json
    export FAKE_PROJECT="${TEST_DIR}/project"
    mkdir -p "${FAKE_PROJECT}/.claude"

    # Create a fake vault
    export FAKE_VAULT="${TEST_DIR}/vault"
    mkdir -p "${FAKE_VAULT}"

    # Write a valid config
    cat > "${FAKE_PROJECT}/.claude/config.json" <<CONF
{
  "obsidian": {
    "vault_path": "${FAKE_VAULT}",
    "vault_prefix": "test-project",
    "watch": false
  }
}
CONF

    # Create some source directories with content
    mkdir -p "${FAKE_PROJECT}/.claude/agents"
    mkdir -p "${FAKE_PROJECT}/.claude/rules"
    mkdir -p "${FAKE_PROJECT}/.claude/commands"
    echo "# Agent doc" > "${FAKE_PROJECT}/.claude/agents/test-agent.md"
    echo "# Rule doc" > "${FAKE_PROJECT}/.claude/rules/test-rule.md"
    echo "# README" > "${FAKE_PROJECT}/README.md"
}

teardown() {
    rm -rf "${TEST_DIR}"
}

# ---------- Help / Usage ----------

@test "shows help with --help flag" {
    run "${SYNC_SCRIPT}" --help
    [ "$status" -eq 0 ]
    [[ "$output" =~ "Usage" ]] || [[ "$output" =~ "usage" ]]
}

@test "shows help with -h flag" {
    run "${SYNC_SCRIPT}" -h
    [ "$status" -eq 0 ]
    [[ "$output" =~ "Usage" ]] || [[ "$output" =~ "usage" ]]
}

# ---------- Missing dependencies ----------

@test "fails with clear error when rsync is missing" {
    # Create a wrapper that shadows rsync with a failing command
    local fake_bin="${TEST_DIR}/fake_bin"
    mkdir -p "${fake_bin}"
    # Create a fake 'rsync' that always fails to be found
    # by hiding real rsync behind a PATH that lacks it
    cat > "${fake_bin}/rsync" <<'WRAPPER'
#!/bin/bash
exit 127
WRAPPER
    # Don't make it executable so 'command -v rsync' fails
    # Instead, use PATH without the real rsync location
    local clean_path="${fake_bin}"
    # We need bash and basic tools but not rsync
    for p in /usr/bin /bin /usr/local/bin; do
        if [[ -d "$p" ]] && [[ ! -x "$p/rsync" ]]; then
            clean_path="${clean_path}:${p}"
        fi
    done
    # If rsync is in all standard paths, just test the error message content
    # by checking the script's check_rsync function behavior
    if command -v rsync &>/dev/null; then
        skip "rsync is installed; cannot easily hide it from PATH in bats"
    fi
    run env PATH="${clean_path}" "${SYNC_SCRIPT}" --project-root "${FAKE_PROJECT}"
    [ "$status" -ne 0 ]
    [[ "$output" =~ "rsync" ]]
}

# ---------- Config validation ----------

@test "fails when no config file exists" {
    rm "${FAKE_PROJECT}/.claude/config.json"
    run "${SYNC_SCRIPT}" --project-root "${FAKE_PROJECT}"
    [ "$status" -ne 0 ]
    [[ "$output" =~ "config" ]] || [[ "$output" =~ "not found" ]]
}

@test "fails when vault_path is not set in config" {
    cat > "${FAKE_PROJECT}/.claude/config.json" <<CONF
{
  "obsidian": {
    "vault_prefix": "test-project"
  }
}
CONF
    run "${SYNC_SCRIPT}" --project-root "${FAKE_PROJECT}"
    [ "$status" -ne 0 ]
    [[ "$output" =~ "vault_path" ]] || [[ "$output" =~ "vault" ]]
}

@test "fails when obsidian key is missing from config" {
    cat > "${FAKE_PROJECT}/.claude/config.json" <<CONF
{
  "version": "1.0.0"
}
CONF
    run "${SYNC_SCRIPT}" --project-root "${FAKE_PROJECT}"
    [ "$status" -ne 0 ]
    [[ "$output" =~ "obsidian" ]] || [[ "$output" =~ "vault" ]]
}

@test "fails when vault path does not exist" {
    rm -rf "${FAKE_VAULT}"
    run "${SYNC_SCRIPT}" --project-root "${FAKE_PROJECT}"
    [ "$status" -ne 0 ]
    [[ "$output" =~ "exist" ]] || [[ "$output" =~ "not found" ]] || [[ "$output" =~ "vault" ]]
}

# ---------- Flag handling ----------

@test "handles --check flag (dry-run mode)" {
    run "${SYNC_SCRIPT}" --check --project-root "${FAKE_PROJECT}"
    [ "$status" -eq 0 ]
    [[ "$output" =~ "dry" ]] || [[ "$output" =~ "Dry" ]] || [[ "$output" =~ "check" ]]
}

@test "handles --safe-mode flag (no --delete)" {
    run "${SYNC_SCRIPT}" --safe-mode --project-root "${FAKE_PROJECT}"
    [ "$status" -eq 0 ]
    [[ "$output" =~ "safe" ]] || [[ "$output" =~ "Safe" ]]
}

@test "rejects unknown flags gracefully" {
    run "${SYNC_SCRIPT}" --banana
    [ "$status" -ne 0 ]
    [[ "$output" =~ "unknown" ]] || [[ "$output" =~ "Unknown" ]] || [[ "$output" =~ "Usage" ]] || [[ "$output" =~ "usage" ]]
}

# ---------- OS detection ----------

@test "detect_os function returns linux, darwin, or wsl" {
    # Source the script to get access to functions
    source "${SYNC_SCRIPT}" --source-only 2>/dev/null || true

    if type detect_os &>/dev/null; then
        run detect_os
        [ "$status" -eq 0 ]
        [[ "$output" =~ ^(linux|darwin|wsl)$ ]]
    else
        skip "detect_os not exported as standalone function"
    fi
}

# ---------- Config parsing ----------

@test "config parsing extracts vault_path correctly" {
    run "${SYNC_SCRIPT}" --check --project-root "${FAKE_PROJECT}"
    [ "$status" -eq 0 ]
    [[ "$output" =~ "${FAKE_VAULT}" ]]
}

@test "config parsing extracts vault_prefix correctly" {
    run "${SYNC_SCRIPT}" --check --project-root "${FAKE_PROJECT}"
    [ "$status" -eq 0 ]
    [[ "$output" =~ "test-project" ]]
}

# ---------- Sync behavior ----------

@test "one-shot sync copies markdown files to vault" {
    run "${SYNC_SCRIPT}" --project-root "${FAKE_PROJECT}"
    [ "$status" -eq 0 ]

    # Verify files landed in the vault under the prefix
    [ -d "${FAKE_VAULT}/test-project" ]
    [ -f "${FAKE_VAULT}/test-project/agents/test-agent.md" ]
    [ -f "${FAKE_VAULT}/test-project/rules/test-rule.md" ]
}

@test "one-shot sync copies root markdown files" {
    run "${SYNC_SCRIPT}" --project-root "${FAKE_PROJECT}"
    [ "$status" -eq 0 ]

    [ -f "${FAKE_VAULT}/test-project/README.md" ]
}

@test "sync excludes binary files" {
    # Create files that should be excluded
    touch "${FAKE_PROJECT}/image.png"
    touch "${FAKE_PROJECT}/photo.jpg"

    run "${SYNC_SCRIPT}" --project-root "${FAKE_PROJECT}"
    [ "$status" -eq 0 ]

    [ ! -f "${FAKE_VAULT}/test-project/image.png" ]
    [ ! -f "${FAKE_VAULT}/test-project/photo.jpg" ]
}

@test "sync skips non-existent optional directories without error" {
    # .claude/prds/ and issues/ don't exist in our fake project
    run "${SYNC_SCRIPT}" --project-root "${FAKE_PROJECT}"
    [ "$status" -eq 0 ]
}

@test "dry-run mode does not create files" {
    run "${SYNC_SCRIPT}" --check --project-root "${FAKE_PROJECT}"
    [ "$status" -eq 0 ]

    # Vault prefix directory should NOT have been created (dry-run)
    [ ! -d "${FAKE_VAULT}/test-project/agents" ]
}

@test "safe-mode sync does not delete extra files in vault" {
    # Pre-populate vault with a file that is NOT in the source
    mkdir -p "${FAKE_VAULT}/test-project/agents"
    echo "extra" > "${FAKE_VAULT}/test-project/agents/extra-file.md"

    run "${SYNC_SCRIPT}" --safe-mode --project-root "${FAKE_PROJECT}"
    [ "$status" -eq 0 ]

    # The extra file should still be there (safe-mode = no --delete)
    [ -f "${FAKE_VAULT}/test-project/agents/extra-file.md" ]
}

@test "default mode deletes extra files in vault" {
    # Pre-populate vault with a file that is NOT in the source
    mkdir -p "${FAKE_VAULT}/test-project/agents"
    echo "extra" > "${FAKE_VAULT}/test-project/agents/extra-file.md"

    run "${SYNC_SCRIPT}" --project-root "${FAKE_PROJECT}"
    [ "$status" -eq 0 ]

    # The extra file should be gone (default = --delete)
    [ ! -f "${FAKE_VAULT}/test-project/agents/extra-file.md" ]
}

# ---------- Combined modes ----------

@test "combined --check --safe-mode works" {
    run "${SYNC_SCRIPT}" --check --safe-mode --project-root "${FAKE_PROJECT}"
    [ "$status" -eq 0 ]
}

# ---------- Output format ----------

@test "output includes [sync] prefix" {
    run "${SYNC_SCRIPT}" --project-root "${FAKE_PROJECT}"
    [ "$status" -eq 0 ]
    [[ "$output" =~ "[sync]" ]]
}

@test "output reports files synced" {
    run "${SYNC_SCRIPT}" --project-root "${FAKE_PROJECT}"
    [ "$status" -eq 0 ]
    [[ "$output" =~ "synced" ]] || [[ "$output" =~ "Done" ]] || [[ "$output" =~ "done" ]]
}
