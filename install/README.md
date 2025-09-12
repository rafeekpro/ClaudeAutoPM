# 🚀 AUTOPM Installation Scripts

This directory contains installation and configuration scripts for the **AUTOPM (Autonomous Project Management)** framework.

## 📁 Contents

| File | Description |
|------|-------------|
| `install.sh` | Main installation script for AUTOPM framework |
| `merge-claude.sh` | Helper script for merging CLAUDE.md configurations |
| `README.md` | This documentation file |

## 🎯 Quick Start

### Fresh Installation

```bash
# Clone or download AUTOPM, then run:
cd AUTOPM
./install/install.sh

# Or install to specific directory:
./install/install.sh /path/to/your/project
```

### Update Existing Installation

```bash
# Run installer in project with existing AUTOPM:
./install/install.sh

# It will automatically detect existing installation and offer update
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
REPO_URL="https://github.com/your-fork/AUTOPM.git"

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

## 📖 Related Documentation

- [`PLAYBOOK.md`](../PLAYBOOK.md) - AUTOPM usage guide
- [`COMMIT_CHECKLIST.md`](../COMMIT_CHECKLIST.md) - Quality standards
- [`.claude/CLAUDE.md`](../.claude/CLAUDE.md) - Complete configuration
- [`.claude/rules/`](../.claude/rules/) - Development rules

## 🎉 Post-Installation

After successful installation:

1. **Review `CLAUDE.md`** - Customize for your project
2. **Setup `.env`** - Copy `.claude/.env.example` → `.claude/.env`
3. **Add API keys** - Fill in your service credentials
4. **Read `PLAYBOOK.md`** - Learn AUTOPM workflows
5. **Explore `.claude/rules/`** - Understand development standards

---

**Ready to install?** Run `./install.sh` and let AUTOPM transform your development workflow! 🚀
