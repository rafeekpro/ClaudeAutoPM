---
allowed-tools: Bash
---

# quality-gate

Run a full quality check before creating a PR. Auto-detects project language.

## Usage

```
/quality-gate [--python|--node|--go]
```

## Steps

### 1. Detect language

```bash
# Override flags: --python, --node, --go
if echo "$ARGUMENTS" | grep -q "\-\-python"; then
  LANG="python"
elif echo "$ARGUMENTS" | grep -q "\-\-node"; then
  LANG="node"
elif echo "$ARGUMENTS" | grep -q "\-\-go"; then
  LANG="go"
elif [ -f "package.json" ]; then
  LANG="node"
elif [ -f "pyproject.toml" ] || [ -f "requirements.txt" ]; then
  LANG="python"
elif [ -f "go.mod" ]; then
  LANG="go"
else
  echo "❌ Cannot detect project type. Pass --python, --node, or --go."
  exit 1
fi
echo "Language: $LANG"
```

### 2. Run checks

**Node.js:**

```bash
if [ "$LANG" = "node" ]; then
  GATE_FAILED=0

  # Lint
  npm run lint && LINT_STATUS="✅ lint — clean" || { LINT_STATUS="❌ lint — failed"; GATE_FAILED=1; }

  # Tests + coverage
  npm run test:coverage -- --coverageReporters=json-summary 2>/dev/null
  TEST_EXIT=$?
  if [ $TEST_EXIT -eq 0 ]; then
    TEST_STATUS="✅ tests — passed"
  else
    TEST_STATUS="❌ tests — failed"
    GATE_FAILED=1
  fi

  # Coverage thresholds: lines >= 80%, branches >= 75%, functions >= 80%, statements >= 80%
  if [ -f "coverage/coverage-summary.json" ]; then
    LINES=$(node -e "const c=require('./coverage/coverage-summary.json').total; console.log(c.lines.pct)")
    BRANCHES=$(node -e "const c=require('./coverage/coverage-summary.json').total; console.log(c.branches.pct)")
    FUNCTIONS=$(node -e "const c=require('./coverage/coverage-summary.json').total; console.log(c.functions.pct)")
    STATEMENTS=$(node -e "const c=require('./coverage/coverage-summary.json').total; console.log(c.statements.pct)")
    node -e "process.exit(parseFloat('$LINES')>=80&&parseFloat('$BRANCHES')>=75&&parseFloat('$FUNCTIONS')>=80&&parseFloat('$STATEMENTS')>=80?0:1)" \
      && COV_STATUS="✅ coverage — lines:${LINES}% branches:${BRANCHES}% functions:${FUNCTIONS}% statements:${STATEMENTS}%" \
      || { COV_STATUS="❌ coverage — below threshold (need lines>=80% branches>=75% functions>=80% statements>=80%)"; GATE_FAILED=1; }
  else
    COV_STATUS="⚠️ coverage — no summary found"
  fi
fi
```

**Python:**

```bash
if [ "$LANG" = "python" ]; then
  GATE_FAILED=0
  ruff check . && LINT_STATUS="✅ ruff — clean" || { LINT_STATUS="❌ ruff — failed"; GATE_FAILED=1; }
  black --check . && FMT_STATUS="✅ black — clean" || { FMT_STATUS="❌ black — failed"; GATE_FAILED=1; }
  mypy . && TYPE_STATUS="✅ mypy — clean" || { TYPE_STATUS="❌ mypy — failed"; GATE_FAILED=1; }
  pytest --tb=short -q && TEST_STATUS="✅ tests — passed" || { TEST_STATUS="❌ tests — failed"; GATE_FAILED=1; }
  pytest --cov --cov-fail-under=80 -q && COV_STATUS="✅ coverage — >= 80%" || { COV_STATUS="❌ coverage — below 80%"; GATE_FAILED=1; }
fi
```

**Go:**

```bash
if [ "$LANG" = "go" ]; then
  GATE_FAILED=0
  go vet ./... && LINT_STATUS="✅ go vet — clean" || { LINT_STATUS="❌ go vet — failed"; GATE_FAILED=1; }
  go test ./... && TEST_STATUS="✅ tests — passed" || { TEST_STATUS="❌ tests — failed"; GATE_FAILED=1; }
  go test -cover ./... | grep -E "coverage: [0-9]+" && COV_STATUS="✅ coverage — ok" || COV_STATUS="⚠️ coverage — check output"
fi
```

### 3. Report

```
QUALITY GATE
$LINT_STATUS
$TEST_STATUS
$COV_STATUS

Gate: PASSED — ready for PR
```

Or on failure:

```
QUALITY GATE
$LINT_STATUS
$TEST_STATUS
$COV_STATUS

Gate: BLOCKED — fix failures before PR
```

```bash
if [ "$GATE_FAILED" -eq 0 ]; then
  echo ""
  echo "Gate: PASSED — ready for PR"
else
  echo ""
  echo "Gate: BLOCKED — fix failures before PR"
  exit 1
fi
```
