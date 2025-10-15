# Plugin Architecture

> **Version**: 2.8.0+
> **Status**: Production Ready
> **Research**: Context7-driven (unplugin, npm workspaces)

## Overview

ClaudeAutoPM uses a plugin-based architecture to organize specialized AI agents into thematic packages. Each plugin is a standalone npm package containing agents focused on specific technologies or domains.

## Architecture Principles

### Context7 Research Foundation

The plugin system is built on best practices from:

1. **unplugin** (`/unjs/unplugin`)
   - Trust Score: 9.7/10
   - Code Snippets: 12
   - Pattern: Factory-based plugin instantiation
   - Features: Hook system, unified plugin interface

2. **npm workspaces** (`/websites/npmjs`)
   - Trust Score: 7.5/10
   - Code Snippets: 1174
   - Pattern: Monorepo with scoped packages
   - Features: Peer dependencies, workspace linking

### Design Patterns

```
┌─────────────────────────────────────────────────────┐
│                  PluginManager                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  Factory Pattern (unplugin-inspired)         │   │
│  │  - createPlugin()                            │   │
│  │  - loadPlugin()                              │   │
│  │  - registerAgents()                          │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Registry Pattern (npm-inspired)             │   │
│  │  - ~/.claudeautopm/plugins/registry.json     │   │
│  │  - installed[], enabled[]                    │   │
│  │  - version tracking                          │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Observer Pattern (EventEmitter)             │   │
│  │  - init:start, init:complete                 │   │
│  │  - discover:found, load:complete             │   │
│  │  - install:agent, hook:registered            │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Plugin Structure

### Standard Plugin Layout

```
@claudeautopm/plugin-{name}/
├── agents/                     # Agent definition files
│   ├── {agent-1}.md
│   ├── {agent-2}.md
│   └── README.md              # Optional category overview
├── package.json               # npm package metadata
├── plugin.json                # Plugin metadata & agent registry
├── README.md                  # Plugin documentation
└── .npmignore                 # Files to exclude from npm
```

### plugin.json Schema

```json
{
  "name": "@claudeautopm/plugin-{name}",
  "version": "1.0.0",
  "displayName": "Human Readable Name",
  "description": "Brief description of plugin purpose",
  "category": "{name}",
  "agents": [
    {
      "name": "agent-name",
      "file": "agents/agent-name.md",
      "description": "Agent description",
      "tags": ["tag1", "tag2"]
    }
  ],
  "keywords": ["keyword1", "keyword2"],
  "mcpServers": ["server1", "server2"],
  "compatibleWith": ">=2.8.0"
}
```

### package.json Requirements

```json
{
  "name": "@claudeautopm/plugin-{name}",
  "version": "1.0.0",
  "description": "Plugin description",
  "keywords": ["claudeautopm", "plugin", "{category}"],
  "author": {
    "name": "ClaudeAutoPM Team",
    "email": "autopm@example.com"
  },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/rafeekpro/ClaudeAutoPM.git",
    "directory": "packages/plugin-{name}"
  },
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  },
  "files": [
    "agents/",
    "plugin.json",
    "README.md"
  ],
  "peerDependencies": {
    "claude-autopm": ">=2.8.0"
  }
}
```

## Official Plugins

### Available Plugins (v1.0.0)

| Plugin | Agents | Category | Description |
|--------|--------|----------|-------------|
| **plugin-cloud** | 8 | Cloud Providers | AWS, Azure, GCP, Terraform, Kubernetes |
| **plugin-devops** | 7 | DevOps & CI/CD | Docker, GitHub Actions, Azure DevOps, SSH |
| **plugin-frameworks** | 6 | Web Frameworks | React, Vue, Tailwind CSS, UX Design |
| **plugin-databases** | 5 | Data Storage | PostgreSQL, MongoDB, Redis, BigQuery, Cosmos DB |
| **plugin-languages** | 5 | Programming | JavaScript, TypeScript, Python, Node.js, Bash |
| **plugin-data** | 3 | Data Engineering | Airflow, Kedro, LangGraph workflows |
| **plugin-testing** | 1 | QA & Testing | Frontend testing, E2E, accessibility |

**Total**: 7 plugins, 35 specialized agents

## Installation & Usage

### Installing Plugins

```bash
# Method 1: Install plugin package globally
npm install -g @claudeautopm/plugin-cloud

# Method 2: Install locally to project
npm install @claudeautopm/plugin-cloud

# Install plugin agents to .claude/agents/
autopm plugin install cloud
```

### Using Plugins

#### In CLAUDE.md

```markdown
## Active Team Agents

<!-- Load specific agents from plugin -->
- @include .claude/agents/cloud/aws-cloud-architect.md
- @include .claude/agents/cloud/terraform-infrastructure-expert.md
```

#### Via Team Loading

```bash
# Load entire category
autopm team load cloud

# Load multiple categories
autopm team load fullstack  # Includes multiple plugins
```

### Plugin Management Commands

```bash
# List installed plugins
autopm plugin list

# Search for plugins
autopm plugin search docker

# Get plugin info
autopm plugin info cloud

# Install plugin
autopm plugin install cloud

# Uninstall plugin
autopm plugin uninstall cloud

# Enable/disable plugin
autopm plugin enable cloud
autopm plugin disable cloud
```

## PluginManager API

### Core Methods

```javascript
const PluginManager = require('claude-autopm/lib/plugins/PluginManager');

const manager = new PluginManager({
  pluginDir: './node_modules',
  agentDir: './.claude/agents',
  scopePrefix: '@claudeautopm',
  minCoreVersion: '2.8.0'
});

// Initialize and discover plugins
await manager.initialize();

// Discovery
await manager.discoverPlugins();
await manager.validatePlugins();

// Plugin lifecycle
await manager.loadPlugin('@claudeautopm/plugin-cloud');
await manager.installPlugin('@claudeautopm/plugin-cloud');
await manager.uninstallPlugin('@claudeautopm/plugin-cloud');

// Queries
const plugins = manager.listPlugins({ category: 'cloud' });
const agents = manager.listAgents({ tags: ['aws'] });
await manager.searchPlugins('docker');
await manager.getPluginInfo('plugin-cloud');

// State management
manager.enablePlugin('plugin-cloud');
manager.disablePlugin('plugin-cloud');
manager.isInstalled('plugin-cloud');
manager.isEnabled('plugin-cloud');

// Extensibility
manager.registerHook('onLoad', async (plugin, data) => {
  console.log(`Plugin ${plugin.name} loaded`);
});

// Statistics
const stats = manager.getStats();
// {
//   totalPlugins: 7,
//   loadedPlugins: 3,
//   totalAgents: 35,
//   compatiblePlugins: 7,
//   categories: ['cloud', 'devops', ...]
// }
```

### Event System

```javascript
// Listen to plugin lifecycle events
manager.on('init:complete', ({ pluginCount, agentCount }) => {
  console.log(`Initialized ${pluginCount} plugins, ${agentCount} agents`);
});

manager.on('discover:found', ({ name, metadata }) => {
  console.log(`Found plugin: ${name}`);
});

manager.on('load:complete', ({ name, agentCount }) => {
  console.log(`Loaded ${agentCount} agents from ${name}`);
});

manager.on('install:agent', ({ agent, path }) => {
  console.log(`Installed ${agent} to ${path}`);
});

manager.on('hook:registered', ({ hookName }) => {
  console.log(`Hook registered: ${hookName}`);
});
```

## Creating Custom Plugins

### Step 1: Plugin Scaffolding

```bash
# Create plugin directory
mkdir -p packages/plugin-mytech
cd packages/plugin-mytech

# Create structure
mkdir agents
touch package.json plugin.json README.md .npmignore
```

### Step 2: Define Agents

Create agent files in `agents/` directory:

```markdown
<!-- agents/my-agent.md -->
# My Technology Expert

**Purpose**: Specialized agent for MyTech development

**Documentation Queries:**
- `mcp://context7/mytech/core` - Core concepts
- `mcp://context7/mytech/patterns` - Design patterns

**Core Capabilities:**
- Feature A implementation
- Feature B optimization
- Best practices for MyTech

**Example Usage:**
[Examples here]
```

### Step 3: plugin.json

```json
{
  "name": "@claudeautopm/plugin-mytech",
  "version": "1.0.0",
  "displayName": "MyTech Specialists",
  "description": "Agents for MyTech development",
  "category": "mytech",
  "agents": [
    {
      "name": "my-agent",
      "file": "agents/my-agent.md",
      "description": "MyTech specialist",
      "tags": ["mytech", "backend"]
    }
  ],
  "keywords": ["mytech", "development"],
  "mcpServers": ["mytech-docs"],
  "compatibleWith": ">=2.8.0"
}
```

### Step 4: package.json

```json
{
  "name": "@claudeautopm/plugin-mytech",
  "version": "1.0.0",
  "description": "MyTech development agents",
  "keywords": ["claudeautopm", "plugin", "mytech"],
  "author": "Your Name",
  "license": "MIT",
  "publishConfig": {
    "access": "public"
  },
  "files": ["agents/", "plugin.json", "README.md"],
  "peerDependencies": {
    "claude-autopm": ">=2.8.0"
  }
}
```

### Step 5: Testing

```bash
# Test locally
npm link
cd /path/to/test-project
npm link @claudeautopm/plugin-mytech

# Install agents
autopm plugin install mytech

# Verify
ls .claude/agents/mytech/
```

### Step 6: Publishing

```bash
# Login to npm (first time)
npm login

# Publish
npm publish --access public

# Verify
npm view @claudeautopm/plugin-mytech
```

## Version Compatibility

### Peer Dependency Resolution

Plugins declare compatibility with core versions:

```json
{
  "compatibleWith": ">=2.8.0"
}
```

PluginManager validates compatibility during initialization:

```javascript
// In PluginManager
async validatePlugins() {
  const coreVersion = this.getCoreVersion(); // e.g., "2.8.1"

  for (const [name, plugin] of this.plugins.entries()) {
    if (!this.isCompatible(coreVersion, plugin.metadata.compatibleWith)) {
      plugin.compatible = false;
      plugin.incompatibilityReason =
        `Requires ${plugin.metadata.compatibleWith}, found ${coreVersion}`;
    }
  }
}
```

### Supported Version Ranges

- `>=2.8.0` - Version 2.8.0 or higher
- `^2.8.0` - Compatible with 2.x.x (future)
- `~2.8.0` - Compatible with 2.8.x (future)

## Registry & State Management

### Registry Location

```
~/.claudeautopm/plugins/registry.json
```

### Registry Schema

```json
{
  "version": "1.0.0",
  "installed": [
    "plugin-cloud",
    "plugin-devops"
  ],
  "enabled": [
    "plugin-cloud"
  ],
  "lastUpdate": "2025-01-15T12:00:00.000Z"
}
```

### State Transitions

```
[Discovered] → [Validated] → [Loaded] → [Installed] → [Enabled]
                    ↓                         ↓
              [Incompatible]            [Disabled]
```

## Hook System

### Available Hooks

```javascript
// Plugin lifecycle
manager.registerHook('onLoad', async (plugin, data) => {
  // Called when plugin is loaded
});

manager.registerHook('onInstall', async (plugin, data) => {
  // Called when plugin is installed
});

manager.registerHook('onUninstall', async (plugin, data) => {
  // Called when plugin is uninstalled
});

// Custom hooks
manager.registerHook('beforeAgentRegister', async (plugin, data) => {
  // Called before each agent registration
});
```

### Hook Execution

Hooks are executed in registration order:

```javascript
async executePluginHooks(plugin, hookName, data = {}) {
  const hooks = this.hooks.get(hookName) || [];

  for (const hook of hooks) {
    try {
      await hook(plugin, data);
    } catch (error) {
      this.emit('hook:error', { hookName, plugin: plugin.name, error });
    }
  }
}
```

## Best Practices

### Plugin Development

1. **Focus on Cohesion**: Group related agents together
2. **Document Thoroughly**: Complete README with examples
3. **Use Context7**: Always include Documentation Queries in agents
4. **Tag Appropriately**: Use descriptive, searchable tags
5. **Version Carefully**: Follow semver, test compatibility
6. **Test Locally**: Use `npm link` before publishing

### Agent Organization

```
Good: plugin-cloud (AWS, Azure, GCP - all cloud providers)
Bad:  plugin-aws-and-docker (mixed concerns)

Good: plugin-databases (all database technologies)
Bad:  plugin-postgres-only (too narrow, unless many agents)
```

### Metadata Quality

```json
// ✅ Good
{
  "name": "aws-cloud-architect",
  "description": "AWS cloud architecture and design patterns",
  "tags": ["aws", "cloud", "architecture", "vpc", "ec2"]
}

// ❌ Poor
{
  "name": "aws",
  "description": "aws stuff",
  "tags": ["cloud"]
}
```

## Troubleshooting

### Plugin Not Discovered

```bash
# Check if package is installed
npm list -g @claudeautopm/plugin-cloud

# Check node_modules structure
ls -la node_modules/@claudeautopm/

# Verify plugin.json exists
cat node_modules/@claudeautopm/plugin-cloud/plugin.json
```

### Compatibility Issues

```bash
# Check core version
autopm --version

# Check plugin compatibility
autopm plugin info cloud

# View detailed error
autopm plugin install cloud --verbose
```

### Agent Files Not Copied

```bash
# Check source files exist
ls node_modules/@claudeautopm/plugin-cloud/agents/

# Check target directory
ls .claude/agents/cloud/

# Reinstall
autopm plugin uninstall cloud
autopm plugin install cloud
```

## Migration Guide

### From Monolithic to Plugins

If you have agents in `.claude/agents/` from before plugin architecture:

```bash
# Backup existing agents
cp -r .claude/agents .claude/agents.backup

# Install plugins to restore functionality
autopm plugin install cloud
autopm plugin install devops
autopm plugin install databases

# Compare
diff -r .claude/agents.backup .claude/agents

# Remove backup once verified
rm -rf .claude/agents.backup
```

### Updating CLAUDE.md

```markdown
<!-- Before -->
- @include .claude/agents/aws-cloud-architect.md

<!-- After (with plugins) -->
- @include .claude/agents/cloud/aws-cloud-architect.md
```

## Performance Considerations

### Plugin Discovery

- Discovery scans `node_modules/@claudeautopm/plugin-*`
- Cached in memory after `initialize()`
- Runs once per PluginManager instance
- ~10-50ms for 10 plugins

### Agent Loading

- Lazy loading: agents loaded on-demand
- File copying during `install` (one-time)
- No performance impact on Claude execution

### Registry I/O

- Read once on PluginManager construction
- Written only on state changes (install/enable)
- JSON file ~1KB for 10 plugins

## Future Enhancements

### Planned Features

- [ ] Plugin dependencies (`"requires": ["plugin-cloud"]`)
- [ ] Plugin configuration schemas
- [ ] Agent templates within plugins
- [ ] Dynamic agent generation
- [ ] Plugin marketplace/registry
- [ ] Auto-updates for plugins
- [ ] Plugin sandboxing/isolation

### Community Plugins

Future support for third-party plugins:

```json
{
  "name": "@community/plugin-rust",
  "publisher": "rust-community",
  "verified": true
}
```

## Resources

- [Plugin Development Guide](./PLUGIN-DEVELOPMENT-GUIDE.md) (coming soon)
- [Official Plugins](../packages/)
- [PluginManager Source](../lib/plugins/PluginManager.js)
- [Example Plugin](../packages/plugin-cloud/)
- [Context7 Research](./CONTEXT7-RESEARCH.md) (coming soon)

## Support

- **Issues**: [GitHub Issues](https://github.com/rafeekpro/ClaudeAutoPM/issues)
- **Discussions**: [GitHub Discussions](https://github.com/rafeekpro/ClaudeAutoPM/discussions)
- **Email**: autopm@example.com

---

**Last Updated**: January 2025
**Version**: 2.8.0
**Status**: ✅ Production Ready
