# 🚀 ClaudeAutoPM Installation Scripts

This directory contains installation and configuration scripts for the **ClaudeAutoPM (Autonomous Project Management)** framework.

## 📁 Contents

| File | Description |
|------|-------------|
| `install.sh` | Main installation script for ClaudeAutoPM framework |
| `update.sh` | Update existing installation to latest framework version |
| `merge-claude.sh` | Helper script for merging CLAUDE.md configurations |
| `README.md` | This documentation file |

## 🎯 Quick Start

### Fresh Installation

```bash
# Clone or download ClaudeAutoPM, then run:
cd ClaudeAutoPM
./install/install.sh

# Or install to specific directory:
./install/install.sh /path/to/your/project
```

### Update Existing Installation

**Recommended method (via CLI):**
```bash
# Update to latest framework version (recommended)
autopm update

# Force update with options
autopm update --force --no-backup
```

**Manual method (direct script):**
```bash
# Run update script directly
./install/update.sh

# Or use installer (legacy method)
./install/install.sh
```

## 📋 Installation Script (`install.sh`)

### What It Does

✅ **Installs/Updates Core Components:**

- `.claude/` - Claude Code configuration and rules
- `.claude-code/` - Claude Code specific settings  
- `.github/` - GitHub workflows and templates
- `scripts/` - Project automation scripts
- `PLAYBOOK.md` - Usage guidelines
- `COMMIT_CHECKLIST.md` - Quality assurance checklist
- `LICENSE` - License file

✅ **Handles CLAUDE.md Migration:**

- Copies `.claude/CLAUDE_BASIC.md` → `CLAUDE.md` (new installations)
- Detects conflicts with existing `CLAUDE.md`
- Offers intelligent merge prompts for combining configurations

✅ **Smart Update Logic:**

- Creates automatic backups during updates
- Only updates changed files
- Preserves user customizations
- Handles version synchronization

### Usage Examples

```bash
# Interactive installation in current directory
./install/install.sh

# Install to specific project
./install/install.sh ~/my-project

# The script will guide you through the process
```

### Installation Modes

#### 🆕 Fresh Installation

- Copies all framework files
- Creates `CLAUDE.md` from `CLAUDE_BASIC.md`
- Sets up complete project structure

#### 🔄 Update/Sync Mode

- Detects existing installation
- Creates automatic backup
- Updates only changed files
- Offers merge assistance for `CLAUDE.md`

## 🔄 Update Script (`update.sh`)

### What It Does

**Smart Framework Updates** that preserve your work:

✅ **Version Management:**
- Detects current and new framework versions
- Only updates when necessary (unless forced)
- Shows clear before/after version information

✅ **Data Protection:**
- Creates automatic backup before updating
- Preserves all configuration files (`config.json`, `.env.local`, etc.)
- Protects project data (`epics/`, `prds/` directories)
- Maintains custom settings and team configurations

✅ **Framework Updates:**
- Updates all framework components (`agents/`, `commands/`, `rules/`, etc.)
- Installs new features and capabilities
- Fixes bugs and security issues
- Updates documentation and examples

### Usage

```bash
# Standard update (recommended)
autopm update

# Force update regardless of version
autopm update --force

# Update without backup (not recommended)
autopm update --no-backup

# Update without preserving config (fresh start)
autopm update --no-preserve-config
```

### Safety Features

🛡️ **Automatic Backup** - Creates timestamped backup before any changes
🔒 **Config Preservation** - Keeps your settings and customizations
📁 **Data Protection** - Never touches your epics, PRDs, or project files
⚡ **Quick Rollback** - Easy to restore from backup if needed

### What Gets Updated

**Framework Components (Updated):**
- `agents/` - Latest agent definitions and capabilities
- `commands/` - New PM commands and improvements
- `scripts/` - Bug fixes and performance improvements
- `rules/` - Updated development patterns
- `templates/` - New project templates

**Your Data (Preserved):**
- `config.json` - Your provider and settings
- `epics/` - All your epic files and tasks
- `prds/` - All your product requirements
- `teams.json` - Your team configurations
- `.env.local` - Your environment variables

## 🤖 Merge Helper (`merge-claude.sh`)

### What It Does

Generates comprehensive AI prompts for intelligently merging:

- Your existing `CLAUDE.md` (with customizations)
- New `CLAUDE_BASIC.md` (framework updates)

### Usage

```bash
# Interactive mode (auto-discovers files)
./install/merge-claude.sh

# Explicit file paths
./install/merge-claude.sh CLAUDE.md .claude/CLAUDE_BASIC.md

# Save prompt to file
./install/merge-claude.sh CLAUDE.md .claude/CLAUDE_BASIC.md merge_prompt.md
```

### Output Options

1. **Console Output**: Print merge prompt to terminal
2. **File Output**: Save prompt to file for later use
3. **Both**: Print and save simultaneously

### Merge Strategy

The generated prompt instructs AI to:

🎯 **Preserve** (Highest Priority):

- All user customizations and preferences
- Custom rules and workflows  
- Project-specific configurations
- User's tone and behavior settings

🎯 **Integrate** (High Priority):

- New framework agents and capabilities
- Updated documentation paths
- New rule files and commands
- Enhanced patterns and examples

🎯 **Optimize** (Medium Priority):

- Remove duplications
- Update outdated references
- Improve organization and structure
- Merge similar sections intelligently

## 🔧 Installation Process Flow

```
flowchart TD
    A[Run install.sh] --> B{Existing Installation?}
    
    B -->|No| C[Fresh Installation]
    C --> D[Copy all framework files]
    D --> E[Create CLAUDE.md from CLAUDE_BASIC.md]
    E --> F[Setup complete]
    
    B -->|Yes| G[Update Mode]
    G --> H[Create backup]
    H --> I[Update changed files]
    I --> J{CLAUDE_BASIC.md changed?}
    
    J -->|No| K[Update complete]
    J -->|Yes| L[Offer merge assistance]
    L --> M{User wants merge prompt?}
    
    M -->|No| K
    M -->|Yes| N[Generate merge prompt]
    N --> O{Output preference?}
    
    O --> P[Console/File/Both]
    P --> K
```

## 📋 File Change Detection

The installer uses intelligent file comparison to:

- ✅ **Skip unchanged files** - Faster updates
- ✅ **Update only modified files** - Preserve customizations  
- ✅ **Detect CLAUDE_BASIC.md changes** - Trigger merge assistance
- ✅ **Create backups before changes** - Safety first

## 🛡️ Safety Features

### Automatic Backups

```bash
# Backups created at:
.autopm_backup_YYYYMMDD_HHMMSS/
├── .claude/
├── .github/
├── scripts/
├── CLAUDE.md
└── ... (other existing files)
```

### Non-Destructive Updates

- Never overwrites existing files without confirmation
- Preserves user customizations in all scenarios
- Creates restore points before major changes
- Offers rollback information

### Error Handling

- Validates all file paths before operations
- Checks dependencies (git, diff)
- Graceful failure with helpful error messages
- Cleanup of temporary files on exit

## 🎨 Customization

### Environment Variables

```bash
# Custom repository URL
REPO_URL="https://github.com/your-fork/ClaudeAutoPM.git"

# Custom temporary directory
TEMP_DIR="/tmp/my_autopm_install"
```

### Extending Installation

The installer is modular and can be extended:

```bash
# Add custom install items
INSTALL_ITEMS+=(
    "custom-folder"
    "my-config.yaml"
)
```

## 🔍 Troubleshooting

### Common Issues

**Permission denied:**

```bash
chmod +x install/install.sh
chmod +x install/merge-claude.sh
```

**Missing dependencies:**

```bash
# Install git and standard utilities
sudo apt-get install git diffutils  # Ubuntu/Debian
brew install git                    # macOS
```

**Backup location:**

```bash
# Backups are created with timestamp
ls -la .autopm_backup_*
```

### Getting Help

1. **Check logs**: Installation provides detailed output
2. **Review backups**: All changes are backed up
3. **Manual merge**: Use `merge-claude.sh` separately
4. **Reset**: Delete `.autopm_backup_*` and re-run

## 🗂️ Shared Scripts Architecture (Source of Truth)

Shared scripts exist in three locations in this repository:

| Location | Role |
|----------|------|
| `packages/plugin-core/scripts/` | **Single source of truth** — edit scripts ONLY here |
| `autopm/.claude/scripts/` | Installer payload — copied into user projects by `autopm install` (generated, do not edit) |
| `.claude/scripts/` | This repo's own installed copy — consumer (generated, do not edit) |

The two consumer trees are refreshed from plugin-core by an automated sync.
Files that exist only in a consumer tree (e.g. the payload's `pm/*.js`
command implementations) are not managed by the sync and live where they are.

### Sync Commands

```bash
npm run sync:scripts        # copy plugin-core/scripts → both consumer trees
npm run sync:scripts:check  # report divergence without writing (CI uses this)
```

The `Scripts Sync Check` workflow (`.github/workflows/scripts-sync-check.yml`)
fails any PR where a consumer copy diverges (content, mode, or missing file)
from plugin-core, and runs `bash -n` over every `.sh` file in all three trees.

### Adding a New Shared Script

1. Create the script under `packages/plugin-core/scripts/` (use the correct
   subdirectory: `lib/`, `mcp/`, `config/`, `hooks/`, or root). Make `.sh`
   files executable (`chmod +x`).
2. Register it in `packages/plugin-core/plugin.json` under `scripts`.
3. Run `npm run sync:scripts` and commit all three copies together.
4. Never edit the copies in `autopm/.claude/scripts/` or `.claude/scripts/`
   directly — the CI check will reject the PR.

### Repo-Only Scripts

Repo maintenance scripts in `scripts/` at the repository root (build, CI,
migration tooling) are not part of the framework payload and are maintained
independently.

## 📖 Related Documentation

- [`PLAYBOOK.md`](../PLAYBOOK.md) - ClaudeAutoPM usage guide
- [`COMMIT_CHECKLIST.md`](../COMMIT_CHECKLIST.md) - Quality standards
- [`.claude/CLAUDE.md`](../.claude/CLAUDE.md) - Complete configuration
- [`.claude/rules/`](../.claude/rules/) - Development rules

## 🎉 Post-Installation

After successful installation:

1. **Review `CLAUDE.md`** - Customize for your project
2. **Setup `.env`** - Copy `.claude/.env.example` → `.claude/.env`
3. **Add API keys** - Fill in your service credentials
4. **Read `PLAYBOOK.md`** - Learn ClaudeAutoPM workflows
5. **Explore `.claude/rules/`** - Understand development standards

---

**Ready to install?** Run `./install.sh` and let ClaudeAutoPM transform your development workflow! 🚀
