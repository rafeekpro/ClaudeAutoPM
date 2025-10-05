# --local Flag Usage Examples

This document demonstrates how to use the `--local` flag with PM commands.

## Installation

The `--local` flag is automatically available after installing the cli-parser library:

```javascript
const { parsePMCommand } = require('./.claude/lib/cli-parser');
```

## Command Line Usage

### Basic Commands

```bash
# Create a PRD in local mode (no GitHub sync)
/pm:prd-new user-authentication --local

# List PRDs from local directory only
/pm:prd-list --local

# Show a local PRD
/pm:prd-show PRD-001 --local

# Decompose epic locally
/pm:epic-decompose authentication --local
```

### Using Short Alias

```bash
# -l is equivalent to --local
/pm:prd-new payment-integration -l
/pm:epic-decompose checkout-flow -l
```

### Combined with Other Flags

```bash
# Local mode + verbose output
/pm:epic-decompose api-gateway --local --verbose

# Local mode + JSON output
/pm:prd-list --local --output json

# Local mode + force operation
/pm:task-create database-migration --local --force
```

## Programmatic Usage

### Basic Parsing

```javascript
const { parsePMCommand } = require('./.claude/lib/cli-parser');

// Parse command with --local flag
const args = ['prd-new', 'user-profile', '--local'];
const parsed = parsePMCommand(args);

console.log(parsed);
// Output:
// {
//   _: ['prd-new', 'user-profile'],
//   local: true,
//   mode: 'local',
//   github: false,
//   azure: false
// }
```

### Mode-Based Logic

```javascript
const { parsePMCommand } = require('./.claude/lib/cli-parser');

const parsed = parsePMCommand(process.argv);

if (parsed.mode === 'local') {
  console.log('📂 Working in local mode - files will not sync to remote');
  // Create files locally only
  createLocalPRD(parsed._[1]);
} else {
  console.log('🌐 Working in remote mode - syncing to ' + parsed.mode);
  // Create files and sync to GitHub/Azure
  createAndSyncPRD(parsed._[1], parsed.mode);
}
```

### Error Handling

```javascript
const { parsePMCommand } = require('./.claude/lib/cli-parser');

try {
  // This will throw an error - can't use both --local and --github
  const parsed = parsePMCommand(['prd-new', 'test', '--local', '--github']);
} catch (error) {
  console.error('Error:', error.message);
  // Output: Error: Cannot use both --local and remote provider (--github or --azure)
}
```

### Reading Default Provider

```javascript
const { getDefaultProvider } = require('./.claude/lib/cli-parser');

// Reads from .claude/config.json
const defaultProvider = getDefaultProvider();
console.log('Default provider:', defaultProvider);
// Output: Default provider: github (or azure, depending on config)
```

## Configuration Integration

The `--local` flag respects your project configuration:

### .claude/config.json

```json
{
  "provider": "github",
  "execution": "adaptive"
}
```

### Behavior

```javascript
// Without --local, uses provider from config
const args1 = ['prd-new', 'feature'];
const parsed1 = parsePMCommand(args1);
console.log(parsed1.mode); // "github" (from config)

// With --local, overrides config
const args2 = ['prd-new', 'feature', '--local'];
const parsed2 = parsePMCommand(args2);
console.log(parsed2.mode); // "local" (overrides config)
```

## Workflow Examples

### Offline Development Workflow

```bash
# Work completely offline
/pm:prd-new mobile-app --local
/pm:epic-decompose mobile-app --local
/pm:task-create setup-project --local

# Later, when online, sync manually
# (TASK-005 will implement sync commands)
```

### Mixed Mode Workflow

```bash
# Create some items locally
/pm:prd-new experimental-feature --local

# Create others with remote sync
/pm:prd-new production-feature  # Uses config provider (github/azure)

# Review both
/pm:prd-list --local           # Shows only local PRDs
/pm:prd-list                   # Shows synced PRDs
```

### Team Collaboration Workflow

```bash
# Individual developer works locally
/pm:epic-decompose team-feature --local

# Review and refine locally
/pm:epic-show team-feature --local

# When ready, sync to team repository
# (Future: /pm:local-sync team-feature)
```

## Help Text

Get help on the --local flag:

```javascript
const { getHelpText } = require('./.claude/lib/cli-parser');

getHelpText().then(helpText => {
  console.log(helpText);
});
```

Output:
```
Options:
      --help     Show help                                             [boolean]
      --version  Show version number                                   [boolean]
  -l, --local    Use local mode (offline, no GitHub/Azure)
                                                        [boolean] [default: false]
      --github   Use GitHub provider                  [boolean] [default: false]
      --azure    Use Azure DevOps provider            [boolean] [default: false]
  -v, --verbose  Enable verbose output                [boolean] [default: false]
  -f, --force    Force operation                      [boolean] [default: false]
  -o, --output   Output format (json, text)   [string] [choices: "json", "text"]
```

## Common Patterns

### Check if Local Mode is Active

```javascript
const { parsePMCommand } = require('./.claude/lib/cli-parser');

function isLocalMode(args) {
  const parsed = parsePMCommand(args);
  return parsed.mode === 'local';
}

if (isLocalMode(process.argv)) {
  console.log('Operating in local mode');
}
```

### Conditional Sync

```javascript
const { parsePMCommand } = require('./.claude/lib/cli-parser');

function savePRD(content, args) {
  const parsed = parsePMCommand(args);

  // Always save locally
  fs.writeFileSync('.claude/prds/prd-001.md', content);

  // Only sync if not in local mode
  if (parsed.mode !== 'local') {
    syncToProvider(parsed.mode, content);
  }
}
```

### Validate Provider Compatibility

```javascript
const { parsePMCommand } = require('./.claude/lib/cli-parser');

function validateProvider(args) {
  const parsed = parsePMCommand(args);

  if (parsed.local && (parsed.github || parsed.azure)) {
    throw new Error('Cannot use --local with remote provider');
  }

  return parsed.mode;
}
```

## Testing

Run the test suite:

```bash
npm test -- test/local-mode/local-flag.test.js
```

Check coverage:

```bash
npm test -- --coverage --collectCoverageFrom='autopm/.claude/lib/cli-parser.js' test/local-mode/local-flag.test.js
```

## Next Steps

- **TASK-004:** Integrate cli-parser into PM command scripts
- **TASK-005:** Add local-sync commands for manual synchronization
- **Documentation:** Update README with local mode workflows
