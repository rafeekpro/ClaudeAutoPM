# Plugin Schema v2.0 Specification

**Version**: 2.0.0
**Status**: Current Standard
**Created**: 2025-01-16
**Last Updated**: 2025-01-16

## Overview

Plugin Schema v2.0 extends the original schema to support **multi-resource plugins** including commands, rules, hooks, and scripts in addition to agents.

### Context7-Verified Patterns

This schema design follows patterns from:
- **npm package.json** (`/websites/npmjs`) - files array, resource packaging
- **Egg.js plugin system** (`/eggjs/egg`) - plugin metadata, dependencies, structured resources
- **VS Code extensions** (`/microsoft/vscode-vsce`) - extension packaging, resource management

## Complete Schema

```json
{
  "name": "@claudeautopm/plugin-name",
  "version": "2.0.0",
  "schemaVersion": "2.0",
  "displayName": "Plugin Display Name",
  "description": "Plugin description",
  "category": "category-name",

  "metadata": {
    "category": "Category Name",
    "author": "Author Name",
    "license": "MIT",
    "homepage": "https://github.com/user/repo",
    "repository": {
      "type": "git",
      "url": "git+https://github.com/user/repo.git",
      "directory": "packages/plugin-name"
    },
    "size": "~15 KB (gzipped)",
    "required": false,
    "tags": ["tag1", "tag2"]
  },

  "agents": [
    {
      "name": "agent-name",
      "file": "agents/agent-name.md",
      "category": "category",
      "description": "Agent description",
      "version": "2.0.0",
      "tags": ["tag1", "tag2"],
      "mcp": [],
      "context7": ["/org/project"]
    }
  ],

  "commands": [
    {
      "name": "command-name",
      "file": "commands/command-name.md",
      "description": "Command description",
      "category": "category",
      "tags": ["tag1", "tag2"],
      "context7": ["/org/project"]
    }
  ],

  "rules": [
    {
      "name": "rule-name",
      "file": "rules/rule-name.md",
      "priority": "critical|high|medium|low",
      "description": "Rule description",
      "tags": ["tag1", "tag2"]
    }
  ],

  "hooks": [
    {
      "name": "hook-name",
      "file": "hooks/hook-name.js",
      "type": "pre-command|pre-agent|pre-tool|wrapper|documentation|testing",
      "description": "Hook description",
      "blocking": true,
      "tags": ["tag1", "tag2"]
    },
    {
      "name": "dual-hook-name",
      "files": ["hooks/hook.js", "hooks/hook.sh"],
      "type": "pre-tool",
      "description": "Dual-language hook",
      "blocking": true,
      "dual": true,
      "tags": ["tag1", "tag2"]
    }
  ],

  "scripts": [
    {
      "name": "lib/script-name",
      "file": "scripts/lib/script-name.sh",
      "description": "Script description",
      "type": "library|utility",
      "exported": true,
      "tags": ["tag1", "tag2"]
    },
    {
      "name": "script-collection",
      "subdirectory": "scripts/collection/",
      "files": ["file1.sh", "file2.sh", "file3.sh"],
      "description": "Collection description",
      "type": "utility",
      "tags": ["tag1", "tag2"]
    }
  ],

  "features": {
    "feature_name": {
      "enabled": true,
      "description": "Feature description"
    }
  },

  "dependencies": {
    "required": [],
    "optional": []
  },

  "peerPlugins": ["@claudeautopm/plugin-core"],

  "mcpServers": {
    "recommended": ["context7"],
    "optional": []
  },

  "keywords": ["keyword1", "keyword2"],

  "installation": {
    "message": "Custom installation message",
    "postInstall": ["command1", "command2"]
  },

  "compatibleWith": ">=3.0.0"
}
```

## Field Definitions

### Root Fields

#### Required Fields

- **name** (string, required): npm package name with @claudeautopm scope
- **version** (string, required): semver version (e.g., "2.0.0")
- **schemaVersion** (string, required): Plugin schema version (current: "2.0")
- **displayName** (string, required): Human-readable plugin name
- **description** (string, required): Brief plugin description
- **category** (string, required): Plugin category (lowercase-with-dashes)

#### Optional Root Fields

- **metadata** (object): Extended metadata
- **agents** (array): Agent definitions
- **commands** (array): Command definitions
- **rules** (array): Rule definitions
- **hooks** (array): Hook definitions
- **scripts** (array): Script definitions
- **features** (object): Feature flags
- **dependencies** (object): Plugin dependencies
- **peerPlugins** (array): Required peer plugins
- **mcpServers** (object): MCP server recommendations
- **keywords** (array): Search keywords
- **installation** (object): Installation configuration
- **compatibleWith** (string): Framework version compatibility

### Metadata Object

```json
{
  "metadata": {
    "category": "Human-Readable Category",
    "author": "Author Name or Organization",
    "license": "MIT",
    "homepage": "https://...",
    "repository": {
      "type": "git",
      "url": "git+https://...",
      "directory": "packages/plugin-name"
    },
    "size": "~15 KB (gzipped)",
    "required": false,
    "tags": ["tag1", "tag2", "tag3"]
  }
}
```

### Agent Definition

```json
{
  "name": "agent-name",
  "file": "agents/agent-name.md",
  "category": "category",
  "description": "Agent description",
  "version": "2.0.0",
  "tags": ["tag1", "tag2"],
  "mcp": [],
  "context7": [
    "/org/project",
    "/org/another-project"
  ]
}
```

**Fields**:
- `name`: Agent identifier (kebab-case)
- `file`: Path to agent markdown file (relative to plugin root)
- `category`: Agent category
- `description`: Brief description
- `version`: Agent version
- `tags`: Search/filter tags
- `mcp`: MCP server names (optional)
- `context7`: Context7 library IDs for documentation

**Installation Target**: `.claude/agents/{category}/{filename}`

### Command Definition

```json
{
  "name": "command-name",
  "file": "commands/command-name.md",
  "description": "Command description",
  "category": "category",
  "tags": ["tag1", "tag2"],
  "context7": ["/org/project"]
}
```

**Fields**:
- `name`: Command identifier (kebab-case)
- `file`: Path to command markdown file
- `description`: Command purpose
- `category`: Command category
- `tags`: Search/filter tags
- `context7`: Context7 library IDs

**Installation Target**: `.claude/commands/{filename}`

### Rule Definition

```json
{
  "name": "rule-name",
  "file": "rules/rule-name.md",
  "priority": "critical",
  "description": "Rule description",
  "tags": ["tag1", "tag2"]
}
```

**Fields**:
- `name`: Rule identifier (kebab-case with dots)
- `file`: Path to rule markdown file
- `priority`: One of: "critical", "high", "medium", "low"
- `description`: Rule purpose
- `tags`: Search/filter tags

**Installation Target**: `.claude/rules/{filename}`

**Priority Levels**:
- **critical**: Must be enforced (e.g., TDD, Context7, security)
- **high**: Should be enforced (e.g., agent coordination, pipelines)
- **medium**: Recommended practices
- **low**: Optional utilities

### Hook Definition

**Single-File Hook**:
```json
{
  "name": "hook-name",
  "file": "hooks/hook-name.js",
  "type": "pre-command",
  "description": "Hook description",
  "blocking": true,
  "tags": ["tag1", "tag2"]
}
```

**Dual-Language Hook** (JavaScript + Shell):
```json
{
  "name": "hook-name",
  "files": ["hooks/hook-name.js", "hooks/hook-name.sh"],
  "type": "pre-tool",
  "description": "Hook description",
  "blocking": true,
  "dual": true,
  "tags": ["tag1", "tag2"]
}
```

**Fields**:
- `name`: Hook identifier
- `file`: Single file path (for single-file hooks)
- `files`: Array of file paths (for dual-language hooks)
- `type`: Hook type (see below)
- `description`: Hook purpose
- `blocking`: Whether hook can block execution
- `dual`: True if hook has multiple implementations (JS + Shell)
- `tags`: Search/filter tags

**Hook Types**:
- **pre-command**: Execute before command invocation
- **pre-agent**: Execute before agent invocation
- **pre-tool**: Execute before tool usage
- **wrapper**: Wrapper script for enforcement
- **documentation**: Documentation/reminder text
- **testing**: Testing utilities

**Installation Target**: `.claude/hooks/{filename(s)}`

### Script Definition

**Single Script**:
```json
{
  "name": "lib/script-name",
  "file": "scripts/lib/script-name.sh",
  "description": "Script description",
  "type": "library",
  "exported": true,
  "tags": ["utilities", "helpers"]
}
```

**Script Collection** (Subdirectory):
```json
{
  "name": "mcp",
  "subdirectory": "scripts/mcp/",
  "files": ["add.sh", "enable.sh", "disable.sh", "list.sh", "sync.sh"],
  "description": "MCP server management scripts",
  "type": "utility",
  "tags": ["mcp", "management"]
}
```

**Fields**:
- `name`: Script identifier
- `file`: Single file path (for single scripts)
- `subdirectory`: Directory path (for collections)
- `files`: Array of filenames (for collections)
- `description`: Script purpose
- `type`: "library" or "utility"
- `exported`: Whether script exports functions for sourcing
- `tags`: Search/filter tags

**Installation Target**:
- Single: `scripts/{path/filename}`
- Collection: `scripts/{subdirectory}/{files}`

### Features Object

```json
{
  "features": {
    "feature_name": {
      "enabled": true,
      "description": "Feature description"
    },
    "experimental_feature": {
      "enabled": false,
      "description": "Experimental feature (opt-in)"
    }
  }
}
```

Feature flags for plugin capabilities. Users can enable/disable features as needed.

### Dependencies

```json
{
  "dependencies": {
    "required": ["@claudeautopm/plugin-other"],
    "optional": ["@claudeautopm/plugin-optional"]
  }
}
```

- **required**: Plugins that must be installed
- **optional**: Plugins that enhance functionality if installed

### MCP Servers

```json
{
  "mcpServers": {
    "recommended": ["context7", "aws"],
    "optional": ["github", "gitlab"]
  }
}
```

MCP servers that enhance plugin functionality:
- **recommended**: Should be installed for best experience
- **optional**: Provide additional features

### Installation Configuration

```json
{
  "installation": {
    "message": "Installing ML plugin with 10 specialist agents...",
    "postInstall": [
      "npm install -g tensorflowjs",
      "python3 -m pip install torch"
    ]
  }
}
```

- **message**: Display during installation
- **postInstall**: Commands to run after installation (optional)

## Resource Installation Logic

### Agent Installation

```javascript
// Source: plugin-package/agents/agent-name.md
// Target: .claude/agents/{category}/agent-name.md

const agent = {
  name: "tensorflow-keras-expert",
  file: "agents/tensorflow-keras-expert.md",
  category: "ml"
};

// Installs to: .claude/agents/ml/tensorflow-keras-expert.md
```

### Command Installation

```javascript
// Source: plugin-package/commands/command-name.md
// Target: .claude/commands/command-name.md

const command = {
  name: "epic-decompose",
  file: "commands/epic-decompose.md"
};

// Installs to: .claude/commands/epic-decompose.md
```

### Rule Installation

```javascript
// Source: plugin-package/rules/rule-name.md
// Target: .claude/rules/rule-name.md

const rule = {
  name: "tdd.enforcement",
  file: "rules/tdd.enforcement.md",
  priority: "critical"
};

// Installs to: .claude/rules/tdd.enforcement.md
```

### Hook Installation

```javascript
// Single-file hook
const hook = {
  name: "pre-command-context7",
  file: "hooks/pre-command-context7.js"
};
// Installs to: .claude/hooks/pre-command-context7.js

// Dual-language hook
const dualHook = {
  name: "enforce-agents",
  files: ["hooks/enforce-agents.js", "hooks/enforce-agents.sh"],
  dual: true
};
// Installs to:
//   .claude/hooks/enforce-agents.js
//   .claude/hooks/enforce-agents.sh
```

### Script Installation

```javascript
// Single script
const script = {
  name: "lib/datetime-utils",
  file: "scripts/lib/datetime-utils.sh"
};
// Installs to: scripts/lib/datetime-utils.sh

// Script collection
const collection = {
  name: "mcp",
  subdirectory: "scripts/mcp/",
  files: ["add.sh", "enable.sh", "disable.sh", "list.sh", "sync.sh"]
};
// Installs to:
//   scripts/mcp/add.sh
//   scripts/mcp/enable.sh
//   scripts/mcp/disable.sh
//   scripts/mcp/list.sh
//   scripts/mcp/sync.sh
```

## Validation Rules

### Schema Validation

```javascript
function validatePluginSchema(plugin) {
  // Required fields
  assert(plugin.name, 'name is required');
  assert(plugin.version, 'version is required');
  assert(plugin.schemaVersion === '2.0', 'schemaVersion must be 2.0');
  assert(plugin.displayName, 'displayName is required');
  assert(plugin.description, 'description is required');
  assert(plugin.category, 'category is required');

  // Validate agents
  if (plugin.agents) {
    for (const agent of plugin.agents) {
      assert(agent.name, 'agent.name is required');
      assert(agent.file, 'agent.file is required');
      assert(agent.category, 'agent.category is required');
      assert(fs.existsSync(path.join(pluginPath, agent.file)),
        `Agent file not found: ${agent.file}`);
    }
  }

  // Validate commands
  if (plugin.commands) {
    for (const command of plugin.commands) {
      assert(command.name, 'command.name is required');
      assert(command.file, 'command.file is required');
      assert(fs.existsSync(path.join(pluginPath, command.file)),
        `Command file not found: ${command.file}`);
    }
  }

  // Validate rules
  if (plugin.rules) {
    const validPriorities = ['critical', 'high', 'medium', 'low'];
    for (const rule of plugin.rules) {
      assert(rule.name, 'rule.name is required');
      assert(rule.file, 'rule.file is required');
      assert(rule.priority, 'rule.priority is required');
      assert(validPriorities.includes(rule.priority),
        `Invalid rule priority: ${rule.priority}`);
      assert(fs.existsSync(path.join(pluginPath, rule.file)),
        `Rule file not found: ${rule.file}`);
    }
  }

  // Validate hooks
  if (plugin.hooks) {
    const validTypes = ['pre-command', 'pre-agent', 'pre-tool', 'wrapper', 'documentation', 'testing'];
    for (const hook of plugin.hooks) {
      assert(hook.name, 'hook.name is required');
      assert(hook.type, 'hook.type is required');
      assert(validTypes.includes(hook.type),
        `Invalid hook type: ${hook.type}`);

      if (hook.dual && hook.files) {
        for (const file of hook.files) {
          assert(fs.existsSync(path.join(pluginPath, file)),
            `Hook file not found: ${file}`);
        }
      } else if (hook.file) {
        assert(fs.existsSync(path.join(pluginPath, hook.file)),
          `Hook file not found: ${hook.file}`);
      }
    }
  }

  // Validate scripts
  if (plugin.scripts) {
    for (const script of plugin.scripts) {
      assert(script.name, 'script.name is required');

      if (script.subdirectory && script.files) {
        for (const file of script.files) {
          const filePath = path.join(pluginPath, script.subdirectory, file);
          assert(fs.existsSync(filePath),
            `Script file not found: ${script.subdirectory}${file}`);
        }
      } else if (script.file) {
        assert(fs.existsSync(path.join(pluginPath, script.file)),
          `Script file not found: ${script.file}`);
      }
    }
  }

  return true;
}
```

## Migration from v1.0 to v2.0

### Breaking Changes
None - v2.0 is backward compatible with v1.0.

### New Features
- ✅ Commands support
- ✅ Rules support
- ✅ Hooks support
- ✅ Scripts support
- ✅ Dual-language hooks (JS + Shell)
- ✅ Script collections (subdirectories)
- ✅ Enhanced metadata
- ✅ Installation configuration

### Migration Steps

1. **Update schemaVersion**:
   ```json
   {
     "schemaVersion": "2.0"  // was "1.0"
   }
   ```

2. **Add empty resource arrays** (if not using):
   ```json
   {
     "commands": [],
     "rules": [],
     "hooks": [],
     "scripts": []
   }
   ```

3. **Add resources** (if plugin has them):
   ```json
   {
     "commands": [{
       "name": "my-command",
       "file": "commands/my-command.md",
       "description": "My command",
       "category": "utility",
       "tags": ["helper"]
     }]
   }
   ```

4. **Update PluginManager** to handle new resources (see Week 4 implementation)

## Examples

### Minimal Plugin (Agents Only)

```json
{
  "name": "@claudeautopm/plugin-simple",
  "version": "1.0.0",
  "schemaVersion": "2.0",
  "displayName": "Simple Plugin",
  "description": "A simple plugin with just agents",
  "category": "utility",
  "metadata": {
    "category": "Utilities",
    "author": "Author Name",
    "license": "MIT"
  },
  "agents": [
    {
      "name": "helper-agent",
      "file": "agents/helper-agent.md",
      "category": "utility",
      "description": "Helper agent",
      "version": "1.0.0",
      "tags": ["utility"]
    }
  ],
  "commands": [],
  "rules": [],
  "hooks": [],
  "scripts": [],
  "peerPlugins": ["@claudeautopm/plugin-core"],
  "compatibleWith": ">=3.0.0"
}
```

### Full-Featured Plugin

See `plugin-core/plugin.json` for a complete example with all resource types.

## Best Practices

### Naming Conventions

- **Agents**: `{domain}-{role}.md` (e.g., `aws-cloud-architect.md`)
- **Commands**: `{action}-{noun}.md` (e.g., `epic-decompose.md`)
- **Rules**: `{category}.{name}.md` (e.g., `tdd.enforcement.md`)
- **Hooks**: `{type}-{target}.{ext}` (e.g., `pre-command-context7.js`)
- **Scripts**: `{name}.{ext}` or `lib/{name}.{ext}` (e.g., `lib/datetime-utils.sh`)

### File Organization

```
plugin-package/
├── plugin.json
├── package.json
├── README.md
├── LICENSE
├── agents/
│   ├── category1/
│   │   └── agent1.md
│   └── category2/
│       └── agent2.md
├── commands/
│   ├── command1.md
│   └── command2.md
├── rules/
│   ├── rule1.md
│   └── rule2.md
├── hooks/
│   ├── hook1.js
│   ├── hook1.sh  # dual-language
│   └── hook2.js
├── scripts/
│   ├── lib/
│   │   ├── utils1.sh
│   │   └── utils2.sh
│   └── mcp/
│       ├── add.sh
│       └── enable.sh
└── test/
    ├── agents/
    ├── commands/
    └── installation/
```

### Context7 Integration

Always include Context7 library IDs for documentation verification:

```json
{
  "agents": [
    {
      "name": "tensorflow-expert",
      "context7": [
        "/tensorflow/tensorflow",
        "/tensorflow/docs"
      ]
    }
  ],
  "commands": [
    {
      "name": "ml-train",
      "context7": [
        "/mlflow/mlflow"
      ]
    }
  ]
}
```

### Version Compatibility

Specify framework compatibility clearly:

```json
{
  "compatibleWith": ">=3.0.0",
  "peerPlugins": [
    "@claudeautopm/plugin-core"
  ]
}
```

### Feature Flags

Use features for opt-in capabilities:

```json
{
  "features": {
    "auto_deployment": {
      "enabled": false,
      "description": "Automatic deployment after training (experimental)"
    },
    "distributed_training": {
      "enabled": true,
      "description": "Multi-GPU training support"
    }
  }
}
```

## Related Documentation

- [Plugin Implementation Plan](/docs/PLUGIN-IMPLEMENTATION-PLAN.md)
- [Plugin User Guide](/docs/PLUGIN-USER-GUIDE.md) (future)
- [Plugin Developer Guide](/docs/PLUGIN-DEVELOPER-GUIDE.md) (future)
- [Migration Guide v2→v3](/docs/MIGRATION-V2-TO-V3.md) (future)

## Changelog

### v2.0.0 (2025-01-16)
- ✅ Added commands support
- ✅ Added rules support
- ✅ Added hooks support (single and dual-language)
- ✅ Added scripts support (single and collections)
- ✅ Added installation configuration
- ✅ Added enhanced metadata
- ✅ Full backward compatibility with v1.0

### v1.0.0 (2025-01-15)
- Initial schema with agents only
