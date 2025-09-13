# Changelog

All notable changes to the ClaudeAutoPM framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-09-13

### Added

- 📡 **MCP Server Management System** - Complete system for managing Model Context Protocol servers
  - New `autopm mcp` CLI commands (list, add, enable, disable, sync, validate, info)
  - Server definitions in Markdown with YAML frontmatter
  - Automatic generation of `.claude/mcp-servers.json`
  - 6 pre-configured servers (context7, playwright, github, filesystem, sqlite)
  - New `@mcp-manager` agent for server lifecycle management
  - Comprehensive MCP Management Guide documentation

- 🤖 **Self-Maintenance System** - Framework now uses its own capabilities for maintenance
  - PM commands for project maintenance (validate, optimize, health, release)
  - Framework agents used for self-maintenance
  - Agent configuration verification tools
  - Self-maintenance documentation and guides

- 🔧 **Agent Ecosystem Optimization (Phase 1)**
  - Consolidated UI frameworks into `react-ui-expert`
  - Consolidated Python backends into `python-backend-expert`
  - Consolidated Docker agents into `docker-containerization-expert`
  - Consolidated E2E testing into `e2e-test-engineer`
  - Reduced agent count from 50+ to ~35 (30% reduction)

### Changed

- 📚 Updated README with MCP management section
- 🔄 Enhanced installer to copy MCP directory
- 📦 Added `js-yaml` dependency for YAML parsing
- 🎯 Improved agent registry with new consolidated agents

### Fixed

- 🐛 DevOps workflow inconsistency (hybrid workflow support)
- 📝 Agent registry validation issues

## [1.0.2] - 2024-01-13

### Added

- 🔒 Protection for user customizations during updates (.github, .claude-code folders)
- 📋 Detailed file listings during installation/updates with icons and progress
- 🛠️ Smart creation of missing files from templates (COMMIT_CHECKLIST.md)
- 📄 Verbose output showing which files are being installed/updated

### Fixed

- ⚠️ No more "skipping" missing source files - creates them from templates instead
- 🔄 Installer now preserves GitHub workflows and Claude Code settings during updates
- 📊 Better user experience with detailed progress reporting

## [1.0.1] - 2024-01-13

### Changed

- 🔄 Updated all package name references from `@autopm/framework` to `claude-autopm`
- 📝 Added CCPM inspiration acknowledgment to README files
- 🛠️ Fixed GitHub workflow installation examples
- 📋 Fixed markdown formatting issues

## [1.0.0] - 2024-01-XX

### Added

- 🎉 Initial release of ClaudeAutoPM framework
- 📦 NPM package with global CLI installation (`claude-autopm`)
- 🚀 Complete installation system with `autopm install` command
- 🤖 AI-powered CLAUDE.md merge helper with `autopm merge`
- 🎯 Project initialization with `autopm init <project-name>`
- 📁 Complete framework structure:
  - `.claude/` - Claude Code configuration and rules
  - `.claude-code/` - Claude Code specific settings
  - `.github/` - GitHub workflows and templates
  - `scripts/` - Project automation scripts
  - `PLAYBOOK.md` - Usage guidelines
  - `COMMIT_CHECKLIST.md` - Quality assurance checklist

### Features

#### 🔧 Installation System

- **Smart detection** of existing installations vs fresh installs
- **Automatic backups** with timestamp (`autopm_backup_YYYYMMDD_HHMMSS/`)
- **File change detection** - only updates modified files
- **Cross-platform support** - Windows (Git Bash/WSL), macOS, Linux
- **Error handling** with graceful failures and rollback information

#### 🤖 CLAUDE.md Management

- **Automatic migration** from `CLAUDE_BASIC.md` to `CLAUDE.md`
- **Conflict detection** when both files exist
- **AI merge prompts** for intelligent configuration combining
- **Preservation of user customizations** with framework updates integration

#### 📋 CLI Commands

```bash
autopm install [path]     # Install to directory
autopm update [path]      # Update existing installation  
autopm merge              # Generate merge prompts
autopm init <name>        # Create new project
autopm --version          # Show version info
autopm --help            # Show usage guide
```

#### 🛡️ Safety Features

- Non-destructive updates with confirmation prompts
- Comprehensive backup system before any changes
- Dependency validation (Git, Node.js)
- Cross-platform compatibility checks
- Detailed error messages and troubleshooting guides

#### 🎨 Developer Experience

- **Colorized output** with clear status indicators
- **Interactive prompts** for user decisions
- **Progress feedback** during operations
- **Verbose mode** for debugging (`--verbose`)
- **Comprehensive help system** with examples

### Technical

#### 🏗️ Architecture

- **Modular design** with separate install and merge scripts
- **Node.js CLI wrapper** around battle-tested Bash scripts
- **NPM package structure** with proper bin entries
- **GitHub Actions** for automated publishing
- **Semantic versioning** with changelog maintenance

#### 🔌 Integrations

- **MCP (Model Context Protocol)** server configurations
- **Context7** integration for documentation and codebase context
- **Playwright MCP** for browser automation testing
- **GitHub MCP** for repository operations
- **Multi-cloud support** (AWS, Azure, GCP) for infrastructure agents

#### 📦 Package Management

- **Scoped package**: `claude-autopm`
- **Multiple binary entries**: `autopm`, `autopm-install`, `autopm-merge`
- **Optional dependencies** for MCP servers
- **Peer dependencies** validation
- **Global installation preferred** with `preferGlobal: true`

### Documentation

- 📖 Complete installation guide in `install/README.md`
- 🎯 Usage examples and troubleshooting
- 🎨 ASCII art banners and professional CLI presentation
- 📋 Comprehensive error handling documentation
- 🔄 Migration guides for existing ClaudeAutoPM installations

### Dependencies

#### Required

- Node.js >= 16.0.0
- NPM >= 8.0.0
- Git (system dependency)

#### Optional

- `@context7/mcp-server` - Documentation context management
- `@playwright/mcp-server` - Browser automation testing
- `@modelcontextprotocol/server-github` - GitHub integration

#### Development

- `markdownlint-cli` - Markdown linting
- `prettier` - Code formatting

## [Unreleased]

### Planned Features

- 🔄 Auto-update mechanism for framework components
- 🎨 Custom templates and project scaffolding
- 📊 Usage analytics and improvement suggestions
- 🔌 Plugin system for custom agents and rules
- 🌐 Web interface for project management
- 🐳 Docker integration for containerized development

---

## Release Process

1. Update version in `package.json`
2. Update this changelog with new features
3. Create git tag: `git tag -a v1.0.0 -m "Release v1.0.0"`
4. Push tag: `git push origin v1.0.0`
5. GitHub Actions will automatically publish to NPM
6. GitHub Release will be created automatically

## Installation

### Global Installation (Recommended)

```bash
npm install -g claude-autopm
autopm --help
```

### Use with npx (No Installation)

```bash
npx claude-autopm install
npx claude-autopm merge
```

### Local Development

```bash
git clone https://github.com/rla/ClaudeAutoPM.git
cd ClaudeAutoPM
npm install
npm link
autopm --version
```
