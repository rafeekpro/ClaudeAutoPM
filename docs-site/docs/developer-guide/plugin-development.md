---
title: Plugin Development
description: Guide to creating ClaudeAutoPM plugins with plugin.json, agents, commands, and hooks
---

# Plugin Development

Plugins are the primary extension mechanism for ClaudeAutoPM. They package agents, commands, rules, hooks, and scripts into installable modules that extend the framework's capabilities.

## Plugin Structure

A complete plugin follows this directory structure:

```
packages/plugin-example/
├── package.json          # npm package configuration
├── plugin.json           # Plugin manifest (required)
├── README.md             # Plugin documentation
├── agents/               # Agent definitions
│   └── category/
│       └── agent-name.md
├── commands/             # Command definitions
│   └── command-name.md
├── rules/                # Rule definitions
│   └── rule-name.md
├── hooks/                # Hook implementations
│   ├── hook-name.js
│   └── hook-name.sh
└── scripts/              # Utility scripts
    └── lib/
        └── utility.sh
```

## The plugin.json Manifest

The `plugin.json` file defines your plugin's contents and metadata. It uses Schema v2.0:

```json
{
  "name": "@claudeautopm/plugin-example",
  "version": "1.0.0",
  "displayName": "Example Plugin",
  "description": "An example plugin demonstrating all features",
  "schemaVersion": "2.0",
  "metadata": {
    "category": "Example",
    "author": "Your Name",
    "license": "MIT",
    "homepage": "https://github.com/your-repo",
    "keywords": ["example", "demo", "tutorial"],
    "size": "5 KB (gzipped)",
    "required": false
  },
  "agents": [],
  "commands": [],
  "rules": [],
  "hooks": [],
  "scripts": [],
  "dependencies": {
    "required": [],
    "optional": []
  },
  "features": {},
  "installation": {
    "message": "Installing example plugin...",
    "postInstall": []
  },
  "compatibleWith": ">=3.0.0"
}
```

## Defining Agents

Agents are AI specialists with defined expertise. Add them to the `agents` array:

```json
{
  "agents": [
    {
      "name": "example-expert",
      "file": "agents/category/example-expert.md",
      "category": "example",
      "description": "Expert in example domain",
      "version": "1.0.0",
      "tags": ["example", "demo", "tutorial"]
    }
  ]
}
```

Create the corresponding agent file:

```markdown
---
name: example-expert
description: Expert in example domain. Use for demo and tutorial tasks.
tools: Glob, Grep, LS, Read, Edit, Write, Bash, Task, Agent
model: inherit
color: green
---

# Example Expert

You are a senior specialist in example domain.

## Test-Driven Development (TDD) Methodology

**MANDATORY**: Follow strict TDD principles:
1. Write failing tests FIRST
2. Red-Green-Refactor cycle
3. 100% coverage for new code

## Documentation Queries

**Documentation Queries:**
- `mcp://context7/example/patterns` - Example patterns
- `mcp://context7/example/best-practices` - Best practices

## Core Expertise

### Domain Mastery
- **Skill 1**: Description of capability
- **Skill 2**: Description of capability

## Development Patterns

[Include specific patterns and code examples]

## Self-Verification Protocol

Before delivering any solution, verify:
- [ ] Documentation from Context7 consulted
- [ ] Tests written and passing
- [ ] Best practices followed
```

## Defining Commands

Commands are user-invokable actions. Add them to the `commands` array:

```json
{
  "commands": [
    {
      "name": "example-action",
      "file": "commands/example-action.md",
      "description": "Perform an example action",
      "category": "example",
      "tags": ["example", "demo"]
    }
  ]
}
```

Create the command file:

```markdown
---
allowed-tools: Bash, Read, Write, LS
---

# Example Action

Perform an example action with specified parameters.

## Usage

```
/example:action [name] [--flag]
```

## Quick Check

```bash
# Verify prerequisites
test -d .claude || echo "Missing .claude directory. Run: autopm init"
```

## Instructions

### 1. Validate Input

Check that required arguments are provided:
- `name`: Required - the target name
- `--flag`: Optional - enable extra behavior

### 2. Execute Action

[Step-by-step instructions for Claude]

### 3. Error Handling

**Common Issues:**
- **Missing file**: "File not found" - Create it first
- **Permission denied**: Check write permissions

## Output

```
Example action complete
  - Result 1: [detail]
  - Result 2: [detail]
Next: /example:next-action
```

## Examples

```bash
# Basic usage
/example:action my-name

# With flag
/example:action my-name --flag
```

$ARGUMENTS
```

## Defining Rules

Rules enforce mandatory behaviors. Add them to the `rules` array:

```json
{
  "rules": [
    {
      "name": "example-rule",
      "file": "rules/example-rule.md",
      "priority": "medium",
      "description": "Enforce example behavior",
      "tags": ["example", "enforcement"]
    }
  ]
}
```

Priority levels:
- `critical` - Must always be followed
- `high` - Important for quality
- `medium` - Standard practice
- `low` - Nice to have

Create the rule file:

```markdown
# Example Rule

> **CRITICAL**: One-line summary of rule importance

## MANDATORY BEHAVIORS

1. Always do this
2. Always check that
3. Always verify this

## PROHIBITED ACTIONS

- Never do this
- Avoid that pattern
- Do not use this approach

## PATTERNS

### Good Pattern

```javascript
// Correct approach
const result = doItRight();
```

### Bad Pattern

```javascript
// Wrong approach - DO NOT USE
const result = doItWrong();
```

## ENFORCEMENT

- How violations are detected
- How to fix violations
- Prevention strategies

## EXAMPLES

[Practical examples of rule application]
```

## Defining Hooks

Hooks intercept operations for enforcement. Add them to the `hooks` array:

```json
{
  "hooks": [
    {
      "name": "pre-example-check",
      "file": "hooks/pre-example-check.js",
      "type": "pre-command",
      "description": "Check conditions before example commands",
      "blocking": true,
      "tags": ["example", "validation"]
    },
    {
      "name": "example-enforcer",
      "files": [
        "hooks/example-enforcer.js",
        "hooks/example-enforcer.sh"
      ],
      "type": "pre-tool",
      "description": "Enforce example patterns",
      "blocking": true,
      "dual": true,
      "tags": ["example", "enforcement"]
    }
  ]
}
```

Hook types:
- `pre-command` - Runs before command execution
- `pre-agent` - Runs before agent invocation
- `pre-tool` - Runs before tool usage
- `wrapper` - Wraps operation execution
- `testing` - Used for hook validation
- `documentation` - Non-blocking documentation

Create a JavaScript hook:

```javascript
#!/usr/bin/env node

/**
 * Hook: pre-example-check.js
 * Purpose: Validate conditions before example commands
 */

class ExampleHookEnforcer {
  constructor() {
    this.toolName = process.argv[2] || '';
    this.toolParams = process.argv[3] || '';

    try {
      this.parsedParams = JSON.parse(this.toolParams);
    } catch {
      this.parsedParams = {};
    }
  }

  blockWithMessage(reason, suggestion, example) {
    console.log(`BLOCKED: ${reason}`);
    console.log(`INSTEAD: ${suggestion}`);
    console.log('');
    console.log('Example:');
    console.log(`  ${example}`);
    process.exit(1);
  }

  check() {
    // Implement validation logic
    if (this.toolName === 'Bash') {
      const command = this.parsedParams.command || '';

      // Example: Block certain patterns
      if (command.includes('dangerous-command')) {
        this.blockWithMessage(
          'Dangerous command detected',
          'Use safe alternative',
          'safe-command --with-flags'
        );
      }
    }
  }

  run() {
    this.check();
    process.exit(0); // Allow if no blocks
  }
}

const enforcer = new ExampleHookEnforcer();
enforcer.run();
```

Create a shell hook (for dual-language support):

```bash
#!/usr/bin/env bash

# Hook: example-enforcer.sh
# Purpose: Enforce example patterns (shell version)

set -euo pipefail

TOOL_NAME="${1:-}"
TOOL_PARAMS="${2:-}"

# Parse parameters
command=""
if [[ -n "$TOOL_PARAMS" ]]; then
  command=$(echo "$TOOL_PARAMS" | jq -r '.command // ""' 2>/dev/null || echo "")
fi

# Check for violations
if [[ "$command" == *"dangerous-command"* ]]; then
  echo "BLOCKED: Dangerous command detected"
  echo "INSTEAD: Use safe alternative"
  exit 1
fi

exit 0
```

## Defining Scripts

Scripts provide utility functions. Add them to the `scripts` array:

```json
{
  "scripts": [
    {
      "name": "lib/example-utils",
      "file": "scripts/lib/example-utils.sh",
      "description": "Example utility functions",
      "type": "library",
      "exported": true,
      "tags": ["utilities", "example"]
    },
    {
      "name": "example-tools",
      "subdirectory": "scripts/example/",
      "files": [
        "tool1.sh",
        "tool2.sh",
        "tool3.sh"
      ],
      "description": "Example tool collection",
      "type": "utility",
      "tags": ["tools", "example"]
    }
  ]
}
```

Script types:
- `library` - Sourced by other scripts
- `utility` - Standalone executable

Create a library script:

```bash
#!/usr/bin/env bash

# Script: example-utils.sh
# Description: Example utility functions
# Version: 1.0.0

# Source guard
[[ -n "${EXAMPLE_UTILS_SOURCED:-}" ]] && return
readonly EXAMPLE_UTILS_SOURCED=1

# Configuration
readonly EXAMPLE_CONFIG_DIR="${EXAMPLE_CONFIG_DIR:-$HOME/.example}"

# Functions

# Log message with timestamp
example_log() {
  local level="${1:-INFO}"
  shift
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] [$level] $*"
}

# Check if required tool exists
example_require() {
  local tool="$1"
  if ! command -v "$tool" &> /dev/null; then
    example_log "ERROR" "Required tool not found: $tool"
    return 1
  fi
  return 0
}

# Safe file read with fallback
example_read_file() {
  local file="$1"
  local default="${2:-}"

  if [[ -f "$file" ]]; then
    cat "$file"
  else
    echo "$default"
  fi
}

# Export functions
export -f example_log
export -f example_require
export -f example_read_file
```

## Package.json Configuration

Your plugin needs a proper `package.json`:

```json
{
  "name": "@claudeautopm/plugin-example",
  "version": "1.0.0",
  "description": "Example plugin for ClaudeAutoPM",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "test": "jest",
    "validate": "node -e \"import('./plugin.json', { with: { type: 'json' } })\""
  },
  "keywords": [
    "claude",
    "autopm",
    "plugin",
    "example"
  ],
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/rafeekpro/ClaudeAutoPM.git",
    "directory": "packages/plugin-example"
  },
  "publishConfig": {
    "access": "public"
  },
  "files": [
    "agents/",
    "commands/",
    "rules/",
    "hooks/",
    "scripts/",
    "plugin.json",
    "README.md"
  ],
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## Plugin Dependencies

Specify plugin dependencies:

```json
{
  "dependencies": {
    "required": [
      "@claudeautopm/plugin-core"
    ],
    "optional": [
      "@claudeautopm/plugin-testing"
    ]
  }
}
```

## Feature Flags

Define toggleable features:

```json
{
  "features": {
    "example_feature": {
      "enabled": true,
      "description": "Enable example feature"
    },
    "advanced_mode": {
      "enabled": false,
      "description": "Enable advanced mode"
    }
  }
}
```

## Installation Hooks

Add post-install actions:

```json
{
  "installation": {
    "message": "Installing example plugin...",
    "postInstall": [
      "echo 'Example plugin installed successfully!'",
      "mkdir -p .example-config"
    ]
  }
}
```

## Version Compatibility

Specify compatible ClaudeAutoPM versions:

```json
{
  "compatibleWith": ">=3.0.0"
}
```

Supported formats:
- `>=3.0.0` - Version 3.0.0 or higher
- `^3.0.0` - Compatible with 3.x.x
- `3.0.0` - Exact version only

## Testing Your Plugin

### Validate plugin.json

```bash
cd packages/plugin-example
npm run validate
```

### Test Installation

```bash
# From project root
npm run test:install

# Or manually
node bin/autopm.js plugin install plugin-example
```

### Test Agents

```bash
# Test agent functionality
node bin/autopm.js plugin info plugin-example
```

## Publishing Your Plugin

### Prepare for Publication

1. Update version in `package.json` and `plugin.json`
2. Run all tests
3. Update README.md
4. Verify all files are included

### Publish to npm

```bash
cd packages/plugin-example
npm publish --access public
```

## Complete Example: plugin-example

Here is a complete minimal plugin:

**packages/plugin-example/plugin.json:**

```json
{
  "name": "@claudeautopm/plugin-example",
  "version": "1.0.0",
  "displayName": "Example Plugin",
  "description": "A minimal example plugin",
  "schemaVersion": "2.0",
  "metadata": {
    "category": "Examples",
    "author": "ClaudeAutoPM Team",
    "license": "MIT",
    "keywords": ["example", "minimal"]
  },
  "agents": [
    {
      "name": "example-agent",
      "file": "agents/example/example-agent.md",
      "category": "example",
      "description": "A minimal example agent",
      "version": "1.0.0",
      "tags": ["example"]
    }
  ],
  "commands": [
    {
      "name": "example-hello",
      "file": "commands/example-hello.md",
      "description": "Say hello",
      "category": "example",
      "tags": ["example"]
    }
  ],
  "rules": [],
  "hooks": [],
  "scripts": [],
  "dependencies": {
    "required": [],
    "optional": []
  },
  "compatibleWith": ">=3.0.0"
}
```

## Best Practices

1. **Follow naming conventions** - Use kebab-case for files, consistent prefixes
2. **Include TDD in agents** - All agents must have TDD methodology section
3. **Add Documentation Queries** - Every agent needs Context7 queries
4. **Keep plugins focused** - One domain per plugin
5. **Test thoroughly** - Write tests for all functionality
6. **Document everything** - Clear README and inline comments
7. **Version carefully** - Follow semantic versioning

## Next Steps

- [Agent Development](./agent-development.md) - Detailed agent creation guide
- [Command Development](./command-development.md) - Creating commands
- [Testing](./testing.md) - Testing your plugin
