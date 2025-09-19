# Changelog

All notable changes to the ClaudeAutoPM framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.9] - 2025-09-19

### Fixed
- Added Azure DevOps support for PRD workflow in `autopm guide`
- Provider-specific next steps for GitHub vs Azure
- Azure CLI commands for creating work items

### Added
- Azure-specific commands after PRD creation (`/pm:azure-sync`, `/pm:azure-next`)
- Azure work item creation instructions with `az boards` CLI
- Proper routing based on selected provider (GitHub or Azure)

## [1.5.8] - 2025-09-19

### Added
- Complete PRD (Product Requirements Document) creation workflow in `autopm guide`
- Full ClaudeAutoPM workflow explanation showing 5-phase process
- Option to create first PRD with guided wizard
- Automatic PRD file generation with template structure
- GitHub issue creation for PRD tracking
- Choice between full PRD workflow or simple task creation

### Changed
- Guide now offers structured workflow options: PRD creation, simple task, or skip
- Enhanced onboarding with complete workflow understanding

### Features
- PRD wizard collects: feature name, project type, description, user story
- Generated PRD includes: requirements, success criteria, timeline, next steps
- Clear instructions for continuing with /pm:prd-parse, /pm:epic-decompose, /pm:epic-sync

## [1.5.7] - 2025-09-19

### Added
- Detailed explanations for each installation scenario in `autopm guide`
- Comparison table showing complexity, speed, features for each scenario
- Clear recommendations for which projects suit each installation type
- Visual indicators (stars, colors) to help users choose the right option

### Improved
- Installation scenario selection now includes comprehensive guidance
- Each scenario lists specific use cases and project types
- Better user experience with clear visual hierarchy

## [1.5.6] - 2025-09-19

### Fixed
- Complete reorder of `autopm guide` workflow for better user experience
- New logical flow: choose folder → set project details → select provider → setup git → install framework

### Changed
- Project location selection now comes first (can create new folder or use current)
- Project name and description collected before provider selection
- Installation scenario selection added to framework setup
- Better separation of concerns in guide workflow

### Added
- Interactive folder selection with directory creation option
- Project description field for better context
- Installation scenario choice during framework setup

## [1.5.5] - 2025-09-19

### Fixed
- Fixed `autopm guide` workflow order - provider selection now comes before git initialization
- Git repository setup is now only required for GitHub provider (optional for Azure DevOps)
- More logical flow: choose provider → setup git (if needed) → install framework → configure

### Changed
- Improved guide workflow to be more intuitive and user-friendly
- Provider-specific git requirements are now properly handled

## [1.5.4] - 2025-09-19

### Added
- CLAUDE.md generation in `autopm guide` with comprehensive project context
- Project-specific Claude instructions tailored to the chosen configuration
- Automatic project folder creation during guide setup

### Fixed
- GitHub issue creation now uses `gh` CLI and actually creates issues
- Configuration properly saved to `.claude/config.json` and `.claude/.env`
- Project folder creation and navigation during guide

## [1.5.3] - 2025-09-19

### Added
- Complete setup workflow in `autopm guide` including:
  - Project folder creation
  - Git repository initialization
  - Automatic `autopm install` execution
  - GitHub issue creation with gh CLI
  - Configuration persistence
  - Reset option for reconfiguration

### Fixed
- ESM/CJS compatibility issues with chalk and inquirer
- Guide now properly saves configuration to files
- Framework installation integrated into guide workflow

## [1.5.2] - 2025-09-19

### Fixed
- Added missing `src/` directory to npm package files
- Resolved `ENOENT` error during npm installation
- Included all necessary source files in published package

## [1.5.1] - 2025-09-19

### Added
- Interactive setup guide (`autopm guide`) for new users
- Streamlined onboarding with provider detection
- Step-by-step configuration wizard

### Fixed
- Module compatibility issues
- Installation path resolution

## [1.5.0] - 2025-09-19

### Added
- Complete TDD implementation with comprehensive command infrastructure
- Full migration from legacy implementation
- Enhanced testing coverage

### Fixed
- Test isolation and cleanup of obsolete files
- Command execution reliability

## [1.3.0] - 2025-09-16

### 🚀 Major Release - Bash to Node.js Migration (Phase 3 Complete)

This release marks a significant milestone with the complete migration of all P0 critical scripts from Bash to Node.js, providing enhanced cross-platform compatibility, better error handling, and improved maintainability.

### Added

#### Node.js Script Migration

- **New Node.js implementations** of critical installation and setup scripts
  - `bin/node/install.js` - Complete framework installer (600+ lines)
  - `bin/node/setup-env.js` - Environment configuration manager (350+ lines)
  - `bin/node/merge-claude.js` - CLAUDE.md merge helper (280+ lines)
- **6 new utility modules** for shared functionality
  - `lib/utils/logger.js` - Cross-platform logging with color support
  - `lib/utils/colors.js` - Custom color module (chalk replacement)
  - `lib/utils/filesystem.js` - File operations wrapper
  - `lib/utils/shell.js` - Command execution utilities
  - `lib/utils/config.js` - Configuration management
  - `lib/utils/prompts.js` - Interactive CLI prompts
- **Comprehensive test suites**
  - 47 unit tests with 100% pass rate
  - 6 integration tests for staging validation
  - New staging environment test runner

#### Enhanced Features

- **Cross-platform compatibility** - Windows, macOS, and Linux support
- **Better error handling** with stack traces and recovery mechanisms
- **Non-interactive mode** for CI/CD automation
- **Secure credential handling** with 0600 permissions on Unix
- **Token validation** with regex patterns for GitHub tokens
- **Backup and rollback** capabilities for safer installations
- **Progress indicators** for long-running operations

### Changed

- **Performance improvements** - Average 150ms execution time (faster than Bash)
- **Modular architecture** - Reusable utilities across all scripts
- **Dependencies updated** - Added required Node.js packages for migration

### Fixed

- Color module infinite recursion issue
- Test failures in silent mode
- Staging test return value handling
- Cross-platform path handling

### Migration Statistics

- **2,274 lines** of Bash code migrated
- **~2,500 lines** of new Node.js code
- **100% feature parity** maintained
- **100% test coverage** for critical paths

## [1.2.0] - 2025-09-14

### 🎉 Major Release - Architecture & Performance Update

This release introduces groundbreaking improvements in architecture, performance, and developer experience.

### Added

#### Unified Provider Architecture

- **Breaking Change**: New command structure `/pm:resource:action` replacing `/pm:resource-action`
- Automatic provider routing based on configuration
- Support for GitHub, Azure DevOps with more providers coming
- Provider-agnostic commands work across all platforms

#### Performance Optimizations (40% Faster)

- Intelligent caching system reduces API calls by 80%
- Request batching for bulk operations (60% faster)
- Exponential backoff for rate limiting
- Module preloading for 95% faster command execution
- Memory usage reduced by 31%

#### Self-Maintenance System Rewrite

- Complete Node.js implementation replacing all bash scripts
- Cross-platform compatibility (Windows, macOS, Linux)
- New commands: `pm:health`, `pm:validate`, `pm:optimize`, `pm:metrics`, `pm:test-install`
- Built-in performance benchmarking tools in `scripts/benchmarks/`

#### Enhanced Testing (94.3% Coverage)

- Comprehensive E2E test suite (`test/e2e/`)
- Performance benchmark tests
- Quick installation tests
- Azure DevOps integration tests with proper mocking

#### Documentation Overhaul

- Complete documentation audit and update
- New Migration Guide (`docs/MIGRATION-GUIDE.md`)
- New Performance Guide (`docs/PERFORMANCE-GUIDE.md`)
- Updated Provider Strategy documentation
- Refreshed wiki with new features

### Changed

- Command structure from hyphen to colon separator (e.g., `issue-show` → `issue:show`)
- Configuration structure now uses `projectManagement` wrapper
- Self-maintenance scripts from bash to Node.js
- Test coverage increased from 80.6% to 94.3%
- Documentation completely updated for v1.2.0 features

### Fixed

- Azure DevOps PR create test failures
- Regression test snapshot issues
- Installation test problems
- Provider detection edge cases
- Memory leaks in long-running operations

### Performance Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Command Latency | 350ms | 210ms | 40% faster |
| API Calls (repeated) | 100% | 20% | 80% reduction |
| Memory Usage | 45MB | 31MB | 31% less |
| Module Load Time | 45ms | 2ms | 95% faster |

### Migration Notes

See [MIGRATION-GUIDE.md](docs/MIGRATION-GUIDE.md) for detailed upgrade instructions from v1.1.0.

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
npx autopm install
npx autopm merge
```

### Local Development

```bash
git clone https://github.com/rla/ClaudeAutoPM.git
cd ClaudeAutoPM
npm install
npm link
autopm --version
```
