---
allowed-tools: Bash, Read
---

# Session Health

Check context window usage and give an actionable recommendation. Output is under 15 lines.

## Instructions

### Step 1 — Read config thresholds

Read thresholds from `.claude/config.json` under the `sessionHealth` key (defaults: green < 60%, yellow 60–85%, red > 85%).

```bash
CONFIG_FILE=".claude/config.json"
GREEN_THRESHOLD=60
YELLOW_THRESHOLD=85

if [ -f "$CONFIG_FILE" ]; then
  T_GREEN=$(python3 -c "
import json
try:
  cfg = json.load(open('$CONFIG_FILE'))
  print(cfg.get('sessionHealth', {}).get('green', 60))
except Exception:
  print(60)
" 2>/dev/null)
  T_YELLOW=$(python3 -c "
import json
try:
  cfg = json.load(open('$CONFIG_FILE'))
  print(cfg.get('sessionHealth', {}).get('yellow', 85))
except Exception:
  print(85)
" 2>/dev/null)
  [ -n "$T_GREEN" ] && GREEN_THRESHOLD=$T_GREEN
  [ -n "$T_YELLOW" ] && YELLOW_THRESHOLD=$T_YELLOW
fi
```

### Step 2 — Find latest session transcript

The transcript lives at `~/.claude/projects/<cwd-encoded>/`. If the directory is
absent or empty, treat usage as 0% (fresh session → green).

```bash
CWD_ENCODED=$(pwd | sed 's|/|-|g; s|^-||')
TRANSCRIPT_DIR="$HOME/.claude/projects/$CWD_ENCODED"

WORDS=0
TOOL_CALLS=0
SUBAGENTS=0
DURATION="unknown"
PCT=0

if [ ! -d "$TRANSCRIPT_DIR" ]; then
  PCT=0
else
  LATEST=$(ls -t "$TRANSCRIPT_DIR"/*.jsonl 2>/dev/null | head -1)
  if [ -n "$LATEST" ]; then
    WORDS=$(wc -w < "$LATEST" 2>/dev/null || echo 0)
    TOOL_CALLS=$(grep -c '"type":"tool_use"' "$LATEST" 2>/dev/null || echo 0)
    SUBAGENTS=$(grep -c '"subagent"' "$LATEST" 2>/dev/null || echo 0)
    FIRST_TS=$(head -1 "$LATEST" | python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('timestamp',''))" 2>/dev/null)
    LAST_TS=$(tail -1 "$LATEST" | python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('timestamp',''))" 2>/dev/null)
    if [ -n "$FIRST_TS" ] && [ -n "$LAST_TS" ]; then
      DURATION=$(python3 -c "
from datetime import datetime
try:
  a = datetime.fromisoformat('$FIRST_TS'.replace('Z',''))
  b = datetime.fromisoformat('$LAST_TS'.replace('Z',''))
  print(str(int((b-a).total_seconds()/60)) + ' minutes')
except Exception:
  print('unknown')
" 2>/dev/null || echo "unknown")
    fi
    # Approximate tokens: word count × 1.3; assume 200k context window
    TOKENS=$(echo "$WORDS * 13 / 10" | bc 2>/dev/null || echo 0)
    PCT=$(echo "$TOKENS * 100 / 200000" | bc 2>/dev/null || echo 0)
  fi
fi
```

### Step 3 — Score health (green / yellow / red)

```bash
if [ "$PCT" -gt "$YELLOW_THRESHOLD" ]; then
  STATUS="red"
  ICON="🔴"
  ADVICE="compact now"
elif [ "$PCT" -ge "$GREEN_THRESHOLD" ]; then
  STATUS="yellow"
  ICON="🟡"
  ADVICE="consider compacting soon"
else
  STATUS="green"
  ICON="🟢"
  ADVICE="no action needed"
fi
```

### Step 4 — Print report (under 15 lines)

```bash
echo "SESSION HEALTH"
echo ""
echo "Context usage: ~${PCT}% ($STATUS) $ICON"
echo "Duration:      ${DURATION}"
echo "Tool calls:    ${TOOL_CALLS}"
echo "Subagents:     ${SUBAGENTS}"
echo ""

if [ "$STATUS" != "green" ]; then
  echo "⚠️  Recommendation: $ADVICE"
  echo ""
  echo "Before compacting, run:"
  echo "  /wrap-session   → persist memories + CLAUDE.md"
  echo "  /handoff        → generate context primer"
  echo "  /compact        → compress"
else
  echo "✅ $ADVICE"
fi
```
