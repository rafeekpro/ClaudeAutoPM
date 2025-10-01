# Changelog

All notable changes to the ClaudeAutoPM framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.13.13] - 2025-10-01

### 🐛 Critical Bug Fix: MCP Server Definition Files

**Fixed incorrect package names in MCP server definition files**

The v1.13.10 and v1.13.11 releases fixed package names in `mcp-servers.json` but forgot to update the individual server definition files in `autopm/.claude/mcp/`. This caused servers to fail validation and not appear in `autopm mcp list`.

### 🎯 What Was Fixed

**Fixed Files:**
- `autopm/.claude/mcp/context7.md`: `@context7/mcp-server` → `@upstash/context7-mcp`
- `autopm/.claude/mcp/context7.md`: `@context7/mcp-server` → `@upstash/context7-mcp`
- `autopm/.claude/mcp/context7.md`: Added missing `https://` to URL defaults
- `autopm/.claude/mcp/playwright-mcp.md`: `@playwright/mcp-server` → `@playwright/mcp`

### 📊 Impact

**Before v1.13.13:**
- `autopm mcp list` showed only context7 servers
- playwright-mcp didn't appear in list
- Server validation failed silently

**After v1.13.13:**
- All servers appear in `autopm mcp list`
- All package names are correct and consistent
- Server validation works properly

### 🔄 Upgrade

```bash
npm install -g claude-autopm@latest
```

## [1.13.12] - 2025-10-01

### ✨ Enhancement: Post-Configuration Guidance

**Added comprehensive next steps after MCP configuration commands**

Users now receive clear, actionable guidance after running:
- `autopm mcp enable <server>`
- `autopm mcp add`
- `autopm mcp sync`

### 🎯 What Changed

**New `showNextSteps()` method in MCPHandler:**
- Shows step-by-step instructions after configuration
- Lists required environment variables with examples
- Provides API key sources and documentation links
- Reminds users to restart Claude Code and verify servers

### 📋 Example Output

**After `autopm mcp enable context7`:**
```
✅ Server 'context7' enabled

📋 Next Steps:

1. Run sync to update configuration:
   autopm mcp sync

2. Configure required environment variables in .claude/.env:
   CONTEXT7_API_KEY=ctx7_1234567890abcdef
   CONTEXT7_WORKSPACE=my-workspace-id

3. Restart Claude Code to load the server

4. Verify server status:
   /mcp (in Claude Code)

💡 API Key Information:
   → Sign up at https://context7.com and get API key from dashboard
```

**After `autopm mcp sync`:**
```
✅ Configuration synced...

📋 Next Steps:

1. Restart Claude Code to load the updated configuration

2. Verify servers are running:
   /mcp (in Claude Code)

⚠️  Some servers require environment variables:

   ❌ CONTEXT7_API_KEY

3. Configure missing variables in .claude/.env

4. Check configuration:
   autopm mcp check
```

### 🎁 User Experience Improvement

**Before v1.13.12:**
- Commands completed silently
- No guidance on what to do next
- Users left confused about how to proceed

**After v1.13.12:**
- Clear step-by-step instructions
- Environment variable examples
- Links to credential sources
- Verification commands

### 🔄 Impact

This addresses user feedback: *"po dodaniu konfiguracji autopm mcp nie mialem zadnej informacji na temat uruchomienia sync ani innych krokow"*

## [1.13.11] - 2025-10-01

### 🐛 Bug Fix: Corrected Playwright MCP Package Name

**Fixed incorrect Playwright MCP package name**
- Changed from non-existent `@playwright/mcp-server` to actual `@playwright/mcp`
- **Impact: Playwright MCP server can now start in Claude Code**

### 🗑️ Breaking Change: Removed Deprecated GitHub MCP

**Removed deprecated GitHub MCP server from default configuration**
- `@modelcontextprotocol/server-github` is deprecated by maintainers
- GitHub now provides official server via Copilot API with HTTP transport
- **Impact: Users need to manually add GitHub MCP if needed**

### 🎯 What Changed

**autopm/.claude/mcp-servers.json:**
```json
// Playwright - Fixed:
"args": ["@playwright/mcp"]  // ✅ Was: @playwright/mcp-server

// GitHub - Removed (deprecated)
// Use: claude mcp add --transport http github ...
```

**package.json:**
```json
"optionalDependencies": {
  "@upstash/context7-mcp": "^1.0.0",
  "@playwright/mcp": "^0.0.40"
}
```

### 📊 Default MCP Servers

**After v1.13.11:**
- ✅ `context7` - Documentation (@upstash/context7-mcp)
- ✅ `context7` - Codebase analysis (@upstash/context7-mcp)
- ✅ `playwright-mcp` - Browser automation (@playwright/mcp)
- ❌ `github-mcp` - REMOVED (deprecated)

### 📖 Adding GitHub MCP Manually

**New official GitHub MCP (via Copilot API):**
```bash
claude mcp add --transport http github \
  https://api.githubcopilot.com/mcp \
  -H "Authorization: Bearer $GITHUB_PAT"
```

See: https://github.com/github/github-mcp-server

### 🔄 Migration

**For existing projects:**
```bash
cd your-project
autopm mcp sync  # Updates with correct packages
```

## [1.13.10] - 2025-10-01

### 🐛 Critical Bug Fix

**Fixed Incorrect Context7 MCP Package Name**
- Changed from non-existent `@context7/mcp-server` to actual `@upstash/context7-mcp`
- **Impact: MCP servers can now actually start in Claude Code**

### 🎯 What Was Wrong

The MCP configuration was using a **non-existent npm package**:
- ❌ `@context7/mcp-server` - doesn't exist on npm
- ✅ `@upstash/context7-mcp` - real package

This caused ALL Context7 MCP servers to fail with "✘ failed" in Claude Code.

### 🔧 Files Changed

**autopm/.claude/mcp-servers.json:**
```json
// Before:
"args": ["@context7/mcp-server"]  // ❌ 404 Not Found

// After:
"args": ["@upstash/context7-mcp"]  // ✅ Works
```

**package.json:**
```json
"optionalDependencies": {
  "@upstash/context7-mcp": "^1.0.0"  // Updated
}
```

### 📊 Impact

**Before (v1.13.9):**
```
Claude Code MCP:
❯ 1. context7    ✘ failed
  2. context7        ✘ failed
```

**After (v1.13.10):**
```
Claude Code MCP:
❯ 1. context7    ✓ running
  2. context7        ✓ running
```

### 🚨 Breaking Change

If you manually installed `@context7/mcp-server` (which would fail), you'll need to:
```bash
npm uninstall @context7/mcp-server
npm install @upstash/context7-mcp
```

But most users didn't install anything (because the package didn't exist), so this is just a fix.

### 🎯 User Action Required

**For existing projects:**
```bash
cd your-project
autopm mcp sync  # Updates .mcp.json with correct package
```

Or manually update `.mcp.json`:
```json
{
  "mcpServers": {
    "context7": {
      "args": ["@upstash/context7-mcp"]  // Change this
    }
  }
}
```

### 🔍 How This Happened

The Context7 MCP server is maintained by Upstash, but the configuration examples used an incorrect namespace. The package search revealed:
- ✅ `@upstash/context7-mcp` - Official package (v1.0.20)
- ❌ `@context7/mcp-server` - Never existed

## [1.13.9] - 2025-10-01

### 🎨 UX Improvement

**Enhanced Configuration Display (`autopm config show`)**
- Fixed confusing MCP status messages
- Added helpful configuration instructions
- Shows exact steps to fix missing settings
- **Impact: Users now know exactly how to configure AutoPM**

### 🎯 What Changed

**`bin/commands/config.js`:**
- Fixed MCP status display - now shows "X active", "X configured", or "Not configured"
- Checks both `config.mcp.activeServers` and `.claude/mcp-servers.json`
- Added "Configuration Issues" section with actionable solutions
- Shows exactly how to set GitHub owner, repo, and token
- Shows how to set Azure organization, project, and PAT
- Fixed execution strategy display when it's an object
- Made `padRight()` safer by converting all inputs to strings

### 📊 Before vs After

**Before (v1.13.8):**
```
│ MCP:             ❌ Disabled             │
```
*User confused: "I have servers configured!"*

**After (v1.13.9):**
```
│ MCP:             ⚠️  2 configured       │
```
```
📋 Configuration Issues:

⚠️  GitHub token not set
   → Add to .claude/.env: GITHUB_TOKEN=ghp_your_token_here

ℹ️  2 MCP server(s) configured but not active
   → Run: autopm mcp list  (then: autopm mcp enable <server>)
```

### 🎯 User Impact

✅ Clear MCP status (active vs configured vs missing)
✅ Actionable instructions for every missing setting
✅ Shows exact commands to run
✅ Shows where to add tokens (.claude/.env)
✅ No more confusion about configuration state

### 🔧 Technical Details

**MCP Status Logic:**
1. If `config.mcp.activeServers` exists → show "X active" ✅
2. Else check `.claude/mcp-servers.json` → show "X configured" ⚠️
3. Else → show "Not configured" ❌

**Configuration Issues:**
- Detects missing provider, owner, repo, tokens
- Shows platform-specific instructions (GitHub vs Azure)
- Different icon per issue type (⚠️ for problems, ℹ️ for info)

## [1.13.8] - 2025-10-01

### ✨ Feature

**Automatic MCP Integration During Installation**
- Installation now automatically creates `.mcp.json` for Claude Code
- No manual `autopm mcp sync` needed after install
- **Impact: MCP servers work in Claude Code immediately after installation**

### 🎯 What Changed

**`install/install.js`:**
- Added `.claude/mcp-servers.json` to `installItems` (now copied during install)
- Added `setupMCPIntegration()` method called after framework installation
- Automatically creates `.mcp.json` when `mcp-servers.json` exists
- Shows helpful tip if no servers are activated

### 📊 Installation Flow

**Before (v1.13.7):**
```
1. autopm install
2. autopm mcp enable context7  ← Manual step
3. autopm mcp sync                  ← Manual step
4. Restart Claude Code              ← Manual step
```

**After (v1.13.8):**
```
1. autopm install                   ← Creates .mcp.json automatically!
2. autopm mcp enable context7  (optional - to activate)
3. Restart Claude Code
```

### 🎯 User Impact

- ✅ `.mcp.json` created automatically during installation
- ✅ 4 MCP servers configured out of the box (context7, context7, github-mcp, playwright-mcp)
- ✅ No extra commands needed for Claude Code integration
- ✅ Helpful tip shown if servers need activation
- ✅ Works for both fresh installs and updates

### 📖 Files Copied

During installation, these MCP files are now installed:
- `.claude/mcp/` - Server definitions (10 markdown files)
- `.claude/mcp-servers.json` - Complete server configuration
- `.mcp.json` - Claude Code format (auto-generated)

### 💡 Post-Installation

Users can now:
- See servers immediately in Claude Code `/mcp` command
- Run `autopm mcp enable <server>` to activate specific servers
- Run `autopm mcp check` to see environment requirements
- Edit `.claude/.env` to add API keys

## [1.13.7] - 2025-10-01

### 🔧 Critical Fix

**Claude Code MCP Integration**
- Fixed `autopm mcp sync` to create `.mcp.json` in project root
- Claude Code expects MCP config in `.mcp.json`, not `.claude/mcp-servers.json`
- **Impact: Claude Code `/mcp` command now correctly discovers MCP servers**

### 🎯 What Changed

**`scripts/mcp-handler.js`:**
- Modified `sync()` to write two files:
  1. `.claude/mcp-servers.json` - AutoPM internal format (with contextPools, documentationSources)
  2. `.mcp.json` - Claude Code format (mcpServers only)
- Added console output showing both file locations
- Uses `this.projectRoot` to write `.mcp.json` at project root

### 📊 File Structure

**Before (v1.13.6):**
```
project/
  .claude/
    mcp-servers.json    ✅ Created
  .mcp.json             ❌ Missing (Claude Code couldn't find servers)
```

**After (v1.13.7):**
```
project/
  .claude/
    mcp-servers.json    ✅ Created (AutoPM format)
  .mcp.json             ✅ Created (Claude Code format)
```

### 🎯 User Impact

- ✅ Claude Code `/mcp` command shows configured servers
- ✅ MCP servers discoverable by Claude Code
- ✅ Automatic sync to both file formats
- ✅ No manual configuration needed
- ✅ Works across all projects after running `autopm mcp sync`

### 📖 Documentation

Claude Code expects MCP configuration in:
- **Project scope**: `.mcp.json` at project root
- **Local scope**: User-specific Claude Code settings
- **User scope**: Global Claude Code settings

AutoPM now correctly creates project-scoped configuration.

## [1.13.6] - 2025-10-01

### 🐛 Bug Fix

**MCP Environment Variable Format**
- Fixed `autopm mcp sync` copying metadata objects instead of simple strings
- Claude Code expects `"VAR": "value"` not `"VAR": {default: "value"}`
- Added `_convertEnvMetadataToStrings()` to convert registry metadata to Claude Code format
- **Impact: Claude Code `/mcp` command now works correctly**

### 🔧 Technical Changes

**`scripts/mcp-handler.js`:**
- Added `_convertEnvMetadataToStrings(envObj)` helper method
- Converts env metadata objects to simple string format
- Handles three cases:
  1. Already string → keep unchanged
  2. Metadata with literal default → use literal value
  3. Metadata with empty default → use `${VAR:-}` format
- Modified `sync()` to use conversion before writing

### 📊 Format Conversion

**Before (v1.13.5):**
```json
"env": {
  "CONTEXT7_API_KEY": {              // ❌ Object
    "default": "",
    "description": "Your Context7 API key",
    "required": true
  }
}
```

**After (v1.13.6):**
```json
"env": {
  "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY:-}",  // ✅ String
  "CONTEXT7_MODE": "documentation"                // ✅ Literal
}
```

### 🎯 User Impact

- ✅ Claude Code can parse MCP configurations
- ✅ `/mcp` command shows servers correctly
- ✅ Backward compatible with existing formats
- ✅ Preserves literal defaults from registry
- ✅ MCP servers now work in Claude Code interface

## [1.13.5] - 2025-10-01

### 🚨 Critical Bug Fix

**MCP Sync Data Loss Bug**
- Fixed critical bug in `autopm mcp sync` that deleted all MCP server configurations
- Previously: Running sync with no active servers would wipe entire `mcp-servers.json`
- Now: Preserves all existing servers, only updates active ones
- Impact: **Safe to run `autopm mcp sync` anytime without data loss**

### 🔧 Technical Changes

**`scripts/mcp-handler.js`:**
- `sync()` now reads existing `mcp-servers.json` before modifying
- Preserves all servers, updates only those in `activeServers` list
- When no active servers: preserves existing instead of wiping file
- Better logging: shows both active count and total servers count

**`.claude/config.json`:**
- Added `mcp.activeServers` section for Claude Code integration
- Enables `/mcp` command in Claude Code to see configured servers
- Without this section, Claude Code shows "No MCP servers configured"

### 📊 Behavior Change

**Before:**
```bash
$ autopm mcp sync  # with empty activeServers
ℹ️ No active servers to sync
# Result: ALL servers deleted from mcp-servers.json ❌
```

**After:**
```bash
$ autopm mcp sync  # with empty activeServers
ℹ️ No active servers in config.json
💡 Preserving existing servers in mcp-servers.json
📊 Existing servers: 4
# Result: All servers preserved ✅
```

### 🎯 User Impact

- ✅ No more data loss when syncing
- ✅ Claude Code `/mcp` command now works
- ✅ Safe to run `autopm mcp sync` anytime
- ✅ All existing servers preserved automatically

### 🔄 Recovery for Affected Users

If you lost your MCP configuration, restore it:
```bash
# Restore from git
git checkout .claude/mcp-servers.json

# Or re-enable servers
autopm mcp enable context7
autopm mcp enable github-mcp
```

## [1.13.4] - 2025-10-01

### ✨ User Experience Enhancements

**Next Steps Guidance After PRD Creation**
- Added comprehensive next steps display after `/pm:prd-new` command
- Shows 5 clear options to prevent users from getting lost:
  1. **Quick Start** - `/pm:epic-oneshot` for simple features (< 10 tasks)
  2. **Split into Epics** - `/pm:prd-split` for complex features (15+ tasks)
  3. **Step-by-Step Workflow** - Full control over parse → decompose → sync
  4. **Review & Edit First** - Refine PRD before processing
  5. **Check Status** - View PRD progress anytime
- Includes decision guidance based on feature complexity
- Visual formatting with emojis and clear separators

**Enhanced MCP Configuration Diagnostics**
- Improved `autopm mcp check` output with categorized environment variables
- **REQUIRED vs OPTIONAL** indicators for all env vars
- Descriptions for each environment variable
- Ready-to-copy example `.env` configuration
- Direct links to get API keys and credentials
- Step-by-step fix instructions with numbered steps
- Shows where to get credentials for each MCP server

### 🔧 Code Quality Improvements

- Extracted `_hasNonEmptyDefault(envDef)` helper method
- Eliminated duplicate logic in MCP configuration checks
- More robust handling: converts to string, trims whitespace
- Handles edge cases: null, undefined, whitespace-only strings
- Improved maintainability following DRY principle

### 📝 Technical Changes

- `autopm/.claude/scripts/pm/prd-new.js`: Added `showNextSteps()` method (+48 lines)
- `scripts/mcp-handler.js`: Enhanced `check()` with detailed diagnostics (+133 lines)
- `autopm/.claude/mcp/context7.md`: Structured env metadata with objects
- All 21 MCP check tests still passing ✅

### 🎯 Addresses User Feedback

- ✅ Users no longer get lost after creating PRDs
- ✅ MCP configuration errors are now self-explanatory
- ✅ Clear guidance on what to do next at each step
- ✅ No more guessing where to get API keys

## [1.13.3] - 2025-10-01

### ✅ Added
- **Comprehensive Test Coverage** (61 new tests, 100% pass rate)
  - `test/jest-tests/mcp-check-jest.test.js` - 21 tests for MCP configuration validation
  - `test/jest-tests/post-install-check-jest.test.js` - 40 tests for post-installation validation
  - Full coverage for `MCPHandler.check()` and `checkRequiredServers()` methods
  - Complete coverage for `PostInstallChecker` class and all validation methods
  - Integration tests for various configuration scenarios
  - Error handling tests for edge cases

### 📚 Documentation
- **README.md Enhancements**
  - Added `autopm mcp check` to MCP commands documentation
  - Added section 4.6 "Verify Installation & Configuration" with `autopm validate` examples
  - Added comprehensive "Splitting Large PRDs into Multiple Epics" guide
    - Complete workflow example with progress tracking
    - 4 criteria for when to split PRDs
    - 5 best practices for managing split epics
  - Example output showing Essential and Optional components validation
  - Actionable next steps for incomplete configurations

### 🎯 Quality Improvements
- Zero test failures - all 61 new tests passing
- Better developer experience with clear test coverage
- Improved user guidance for complex project management workflows
- Enhanced documentation for post-installation validation

## [1.13.2] - 2025-10-01

### 🐛 Fixed
- **MCP Command Argument Parsing**
  - Fixed `autopm mcp enable <server-name>` not accepting server name as positional argument
  - Changed command signature from `mcp <action> [options]` to `mcp <action> [name]`
  - Added proper positional argument handling for server and agent names
  - All MCP commands now correctly parse server/agent names from command line
  - Maintains backward compatibility with `--server` and `--agent` flags

### 🛠️ Enhanced
- **Post-Installation Validation**
  - Added automatic configuration check after `autopm install`
  - New `autopm validate` command for comprehensive setup verification
  - Visual status display shows Essential and Optional components
  - Actionable next steps when configuration is incomplete
  - Checks: `.claude` directory, config file, provider setup, MCP servers, git hooks, Node.js version

## [1.13.1] - 2025-10-01

### 📚 Documentation
- **Visual Walkthrough Enhancements**
  - Improved video presentation with expandable sections in README
  - Added 6 demo GIF files showcasing complete workflow
  - Fixed video file naming and paths for better compatibility
  - Interactive collapsible sections for each workflow step

## [1.13.0] - 2025-09-30

### ✨ Added
- **MCP Configuration Check Command** (`autopm mcp check`)
  - Quick validation of MCP server configuration
  - Analyzes which agents require MCP servers
  - Verifies required servers are enabled
  - Checks environment variables are configured
  - Provides actionable recommendations for issues
  - Complements existing `diagnose` command with fast health check

### 🛠️ Enhanced
- **Enhanced MCP Diagnostics**
  - `autopm mcp diagnose` now includes MCP server requirements section
  - Shows disabled servers that are used by agents
  - Displays missing environment variables
  - Provides quick fix recommendations
- **Performance Improvements**
  - Added environment status caching to reduce file I/O operations
  - Optimized MCP server validation checks
  - Extracted helper methods for better code reusability

### 📚 Documentation
- **MCP Command Documentation Updates**
  - Added comprehensive documentation for `autopm mcp check`
  - Updated MCP workflow examples with new check command
  - Enhanced troubleshooting guide with quick check instructions
  - Updated MCP_SETUP_GUIDE.md with validation workflow

## [1.12.3] - 2025-09-30

### 📚 Documentation
- **Comprehensive Documentation Overhaul**
  - Complete rewrite of README.md with v1.12.2 features section
  - Complete rewrite of docs/INSTALL.md (400 lines)
    - System requirements and platform-specific instructions (macOS, Linux, Windows)
    - Installation presets explained in detail with recommendations
    - Update process with version detection feature
    - Comprehensive troubleshooting section with common errors
  - Complete rewrite of docs/QUICKSTART.md (444 lines)
    - 5-minute quick start guide with interactive and manual paths
    - First workflow examples and basic commands reference
    - Agent teams setup and automatic team switching
    - Common workflows (daily development, feature development, team collaboration)
    - Pro tips and troubleshooting section
  - Complete rewrite of docs/CONFIG.md (364 lines)
    - Complete configuration reference with environment variables
    - Configuration commands reference (view, set, switch, validate)
    - Execution strategies explained in detail
    - Provider-specific settings for GitHub and Azure DevOps
    - Advanced configuration topics (MCP servers, git hooks, custom strategies)
  - Complete rewrite of docs/FAQ.md (375 lines)
    - General, installation, and usage questions
    - Configuration and troubleshooting sections
    - Advanced topics, performance, and migration guidance
    - Complete provider comparison and setup instructions

### 🛠️ Enhanced
- **Version Tracking in Configuration**
  - Config files now include version and installed timestamp
  - Enables `autopm update` to recognize current installed version
  - Prevents unnecessary updates when already on latest version

## [1.12.2] - 2025-09-30

### 🛠️ Enhanced
- **Smart Tool Detection During Installation**
  - Installer now automatically detects Docker and kubectl availability
  - Installation options are filtered based on available tools
  - Clear visual feedback showing which tools are installed/missing
  - Installation links provided for missing tools
  - Prevents users from selecting scenarios requiring unavailable tools
  - Default scenario automatically adjusts based on detected tools

### 🐛 Fixed
- **Command Format in PM Scripts**
  - Fixed incorrect command format `pm ...` to proper slash command format `/pm:...`
  - Updated all PM scripts: prd-new, prd-parse, epic-split, epic-edit, epic-close, epic-start
  - Consistent command format across all user-facing messages and help text
- **Configuration Files**
  - Added https:// protocol to Context7 URLs in mcp-servers.json
  - Removed broken references to non-existent tdd-enforcement.md file
- **UI Fixes**
  - Fixed installation completion box - corrected bottom-right corner character (╗ → ╝)

## [1.11.8] - 2025-09-29


## [1.11.5] - 2025-09-29


## [1.10.0] - 2025-01-29

### ✨ Added
- **Full Azure DevOps Hierarchy Support** - Complete Epic → User Story → Task implementation
  - Automatic parent-child work item linking
  - Provider abstraction layer for GitHub/Azure DevOps parity
  - `config` command for provider management and switching
  - Intelligent epic decomposition based on provider (3-level for Azure, 2-level for GitHub)

### 🛠️ Enhanced
- **Provider Configuration Management**
  - `autopm config show` - Display current provider configuration
  - `autopm config set <key> <value>` - Configure provider settings
  - `autopm config switch <provider>` - Quick switch between GitHub and Azure DevOps
  - `autopm config validate` - Validate provider configuration
  - Support for nested configuration (e.g., `azure.organization`, `github.repo`)

### 🏗️ Internal
- Implemented TDD approach with comprehensive test coverage
- Created provider abstraction layer for extensibility
- Added Azure DevOps client wrapper
- Enhanced epic syncing with provider-specific hierarchy

## [1.9.2] - 2025-09-27

### 🔒 Security
- **Fixed autopm guide security vulnerability** - Guide command was executing installation without user consent
- Added comprehensive security tests to prevent regression

### 🛠️ Fixed
- **CLAUDE.md template generation** - Fixed broken template system during installation
- Template system now uses intelligent addon composition based on configuration
- Resolved issue where short fallback templates were used instead of rich content

### 📚 Enhanced
- **Dependency updates** - Updated execa from 8.0.1 to 9.6.0 for better compatibility
- Improved template system with scenario-based addon selection

## [1.9.1] - 2025-09-27

### 🔒 Security
- **Removed vulnerable 'git' package** - Resolved 2 high severity vulnerabilities
- Cleaned up unnecessary dependencies from peerDependencies

### 🚀 Performance
- Updated dependencies for better security and compatibility

## [1.9.0] - 2025-09-27

### 🎯 Major Feature Release - Complete PM Command Suite

This release represents a massive expansion of project management capabilities, bringing ClaudeAutoPM to feature parity with industry-leading PM tools.

### ✨ Added - 17 New PM Commands

#### **PRD & Epic Management**
- **`pm:prd-new`** - Create new Product Requirements Documents with intelligent wizard
- **`pm:prd-parse`** - Convert PRDs into executable epics with technical breakdown
- **`pm:epic-close`** - Close completed epics with automatic task completion
- **`pm:epic-edit`** - Edit epic details with interactive prompts

#### **Issue Lifecycle Management**
- **`pm:issue-start`** - Start work on issues with automatic branch creation
- **`pm:issue-show`** - Display detailed issue information and progress
- **`pm:issue-close`** - Close completed issues with completion tracking
- **`pm:issue-edit`** - Edit issue details interactively

#### **Pull Request Workflow**
- **`pm:pr-create`** - Create PRs with auto-generated descriptions from work items
- **`pm:pr-list`** - List and filter pull requests with advanced options

#### **Context Management**
- **`pm:context-create`** - Create development context files for features
- **`pm:context-update`** - Update context with progress and findings
- **`pm:context-prime`** - Load context for AI assistance sessions

#### **Project Maintenance**
- **`pm:optimize`** - Analyze and optimize project structure for efficiency
- **`pm:clean`** - Archive completed work and clean project workspace
- **`pm:sync`** - Comprehensive synchronization across GitHub/Azure DevOps
- **`pm:release`** - Create versioned releases with automated changelog generation

### 🏗️ Architecture Improvements

#### **Node.js Migration Complete (96% Coverage)**
- Successfully migrated 49 bash scripts to Node.js (12,000+ lines of code)
- 100% backward compatibility maintained through wrapper pattern
- Dramatically improved cross-platform compatibility
- Removed external dependencies (jq, specific bash versions)

#### **Comprehensive Testing Suite**
- **94 new tests** covering all new PM commands
- Unit tests for individual command components
- Integration tests for complete PM workflows
- Security tests preventing regression of vulnerabilities
- Test coverage improved while adding thousands of lines of new code

### 🔧 Enhanced CLI System

#### **Professional Command Structure**
- All commands follow consistent `resource-action` pattern
- Comprehensive help system with examples
- Support for both CLI and AI assistant usage patterns
- Advanced option parsing with validation

#### **Provider Integration**
- Automatic detection of GitHub vs Azure DevOps projects
- Provider-specific optimizations and workflows
- Unified API across different project management backends

### 📚 Documentation Overhaul

#### **Complete Command Documentation**
- **COMMANDS.md** - Comprehensive reference for all 96+ commands
- Detailed usage examples and option descriptions
- Workflow guides for common development patterns
- Integration instructions for different providers

#### **Updated Project Documentation**
- Refreshed README.md with current capabilities
- Updated CONTRIBUTING.md with TDD methodology requirements
- Comprehensive changelog with migration guidance

### 🚀 Performance & Quality

#### **Code Quality Improvements**
- Followed strict TDD methodology for all new features
- Comprehensive error handling and user feedback
- Consistent coding patterns across all commands
- Modular architecture for maintainability

#### **Developer Experience**
- Rich command-line interfaces with progress indicators
- Intelligent defaults and validation
- Clear error messages with actionable guidance
- Support for both interactive and non-interactive usage

### 🔍 Command Analysis & Optimization

Based on comprehensive analysis of existing PM tools, this release addresses:
- **24 missing commands** identified through industry comparison
- **Command reference validation** - all referenced commands now implemented
- **Workflow gaps** - complete PM lifecycle now supported
- **Integration points** - seamless provider synchronization

### 📊 Statistics
- **17 new PM commands** added
- **94 new tests** written
- **12,000+ lines** of Node.js code
- **96% bash-to-Node.js migration** complete
- **100% feature parity** maintained
- **Zero breaking changes** for existing users

### 🎯 Migration Notes
- All existing workflows continue to work unchanged
- New commands available immediately after update
- Enhanced functionality available through both CLI and AI assistant
- Comprehensive testing ensures stability and reliability

## [1.5.15] - 2025-09-19

### Added
- Comprehensive GitHub PAT format validation for all token types
- Live token validation by connecting to GitHub API
- Automatic username mismatch detection and correction
- Token scope and permission validation
- Enhanced error reporting with specific troubleshooting steps

### Improved
- GitHub setup flow now asks for username first
- Repository name suggestions based on current directory
- Better error messages with actionable solutions
- Azure DevOps configuration follows same improved flow
- Clear preview of repository/project URLs before creation

### Security
- Validates token authenticity before use
- Detects revoked or invalid tokens immediately
- Checks for required permissions (repo scope)
- Clears invalid tokens automatically

## [1.5.14] - 2025-09-19

### Fixed
- Token validation improvements and error handling

## [1.5.13] - 2025-09-19

### Fixed
- Repository creation error reporting

## [1.5.12] - 2025-09-19

### Fixed
- GitHub configuration user flow improvements

## [1.5.11] - 2025-09-19

### Fixed
- Email validator implementation

## [1.5.10] - 2025-09-19

### Added
- Comprehensive token acquisition guides for GitHub and Azure DevOps
- Step-by-step instructions for getting Personal Access Tokens
- GitHub repository creation with automatic `gh repo create` integration
- Azure DevOps project creation instructions
- Token validation with optional entry (can skip and add later)

### Improved
- Token entry is now optional - users can add it later to `.claude/.env`
- Clear instructions on where to find and create tokens
- Repository verification and creation workflow for GitHub
- Better error handling when gh CLI is not installed
- Links to token creation pages for both providers

### Features
- GitHub: Auto-create repository if it doesn't exist (with gh CLI)
- GitHub: Set up git remote automatically after repo creation
- Azure: Clear instructions for manual project creation
- Both: Token scopes clearly specified (repo, workflow for GitHub; Work Items, Code for Azure)

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
