#!/usr/bin/env bash
# Basic validation tests for sync-to-obsidian.sh
# Runs without bats — just needs bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYNC_SCRIPT="${SCRIPT_DIR}/../scripts/obsidian/sync-to-obsidian.sh"

PASS=0
FAIL=0
SKIP=0

pass() { echo "  PASS: $1"; PASS=$((PASS + 1)); }
fail() { echo "  FAIL: $1"; FAIL=$((FAIL + 1)); }
skip() { echo "  SKIP: $1"; SKIP=$((SKIP + 1)); }

echo "=== sync-to-obsidian.sh basic tests ==="
echo ""

# ---- Test: script exists and is executable ----
if [[ -x "${SYNC_SCRIPT}" ]]; then
    pass "script is executable"
else
    fail "script is not executable"
fi

# ---- Test: --help exits 0 and prints usage ----
help_out=$("${SYNC_SCRIPT}" --help 2>&1) && help_rc=0 || help_rc=$?
if [[ $help_rc -eq 0 ]] && echo "${help_out}" | grep -qi "usage"; then
    pass "--help shows usage"
else
    fail "--help did not show usage (rc=${help_rc})"
fi

# ---- Test: unknown flag exits non-zero ----
if "${SYNC_SCRIPT}" --banana 2>&1; then
    fail "--banana should have failed"
else
    pass "unknown flag rejected"
fi

# ---- Test: missing config exits non-zero ----
TMP_DIR="$(mktemp -d)"
mkdir -p "${TMP_DIR}/.claude"
if "${SYNC_SCRIPT}" --project-root "${TMP_DIR}" 2>&1; then
    fail "should fail when config missing"
else
    pass "fails when config missing"
fi

# ---- Test: missing vault_path in config exits non-zero ----
cat > "${TMP_DIR}/.claude/config.json" <<EOF
{ "obsidian": { "vault_prefix": "x" } }
EOF
if "${SYNC_SCRIPT}" --project-root "${TMP_DIR}" 2>&1; then
    fail "should fail when vault_path missing"
else
    pass "fails when vault_path missing"
fi

# ---- Test: one-shot sync works end-to-end ----
VAULT_DIR="${TMP_DIR}/vault"
mkdir -p "${VAULT_DIR}"
mkdir -p "${TMP_DIR}/.claude/rules"
echo "# test" > "${TMP_DIR}/.claude/rules/example.md"
echo "# readme" > "${TMP_DIR}/README.md"
cat > "${TMP_DIR}/.claude/config.json" <<EOF
{ "obsidian": { "vault_path": "${VAULT_DIR}", "vault_prefix": "basic-test" } }
EOF

if command -v rsync &>/dev/null; then
    sync_out=$("${SYNC_SCRIPT}" --project-root "${TMP_DIR}" 2>&1) && sync_rc=0 || sync_rc=$?
    if [[ $sync_rc -eq 0 ]]; then
        pass "one-shot sync exits 0"
    else
        fail "one-shot sync exited ${sync_rc}"
    fi

    if [[ -f "${VAULT_DIR}/basic-test/rules/example.md" ]]; then
        pass "rules synced to vault"
    else
        fail "rules not found in vault"
    fi

    if [[ -f "${VAULT_DIR}/basic-test/README.md" ]]; then
        pass "root markdown synced to vault"
    else
        fail "root markdown not found in vault"
    fi
else
    skip "rsync not installed — skipping sync tests"
fi

# ---- Test: --check (dry-run) does not create files ----
VAULT_DIR2="${TMP_DIR}/vault2"
mkdir -p "${VAULT_DIR2}"
cat > "${TMP_DIR}/.claude/config.json" <<EOF
{ "obsidian": { "vault_path": "${VAULT_DIR2}", "vault_prefix": "dry-test" } }
EOF

if command -v rsync &>/dev/null; then
    "${SYNC_SCRIPT}" --check --project-root "${TMP_DIR}" >/dev/null 2>&1 || true
    if [[ ! -d "${VAULT_DIR2}/dry-test/rules" ]]; then
        pass "--check does not create files"
    else
        fail "--check created files (should be dry-run)"
    fi
else
    skip "rsync not installed — skipping dry-run test"
fi

# ---- Cleanup ----
rm -rf "${TMP_DIR}"

echo ""
echo "=== Results: ${PASS} passed, ${FAIL} failed, ${SKIP} skipped ==="

if [[ ${FAIL} -gt 0 ]]; then
    exit 1
fi
exit 0
