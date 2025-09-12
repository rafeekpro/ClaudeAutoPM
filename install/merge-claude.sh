#!/bin/bash

# ============================================
# CLAUDE.md Merge Helper Script
# ============================================
# Standalone script for merging existing CLAUDE.md 
# with updated CLAUDE_BASIC.md
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Print with color
print_msg() {
    local color=$1
    local msg=$2
    echo -e "${color}${msg}${NC}"
}

print_banner() {
    echo -e "${CYAN}${BOLD}"
    echo "╔══════════════════════════════════════════════╗"
    echo "║           CLAUDE.md Merge Helper             ║"
    echo "║         Generate AI Merge Prompts           ║"
    echo "╚══════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Generate comprehensive merge prompt
generate_merge_prompt() {
    local existing_claude="$1"
    local new_basic="$2"
    local output_file="${3:-}"
    
    local prompt="# 🤖 AI-Assisted CLAUDE.md Merge Instructions

You are an expert in Claude Code configuration and project automation. Your task is to intelligently merge two CLAUDE.md configuration files while preserving user customizations and integrating framework updates.

## 📋 Merge Context

**Scenario**: User has an existing CLAUDE.md with custom configurations and needs to integrate updates from the ClaudeAutoPM framework's CLAUDE_BASIC.md.

**Goal**: Create a unified CLAUDE.md that:
- ✅ Preserves ALL user customizations and preferences
- ✅ Integrates new framework features and capabilities  
- ✅ Maintains consistency and organization
- ✅ Updates outdated references and patterns
- ✅ Removes duplications while keeping best of both

## 📄 Source Files

### File A: Current CLAUDE.md (User's Configuration)
\`\`\`markdown
$(cat "$existing_claude")
\`\`\`

### File B: New CLAUDE_BASIC.md (Framework Updates)
\`\`\`markdown
$(cat "$new_basic")
\`\`\`

## 🎯 Merge Strategy & Rules

### 1. **User Preferences (Highest Priority)**
- Keep ALL user tone/behavior customizations
- Preserve user-specific rules and workflows
- Maintain custom agent configurations
- Keep project-specific sections intact

### 2. **Framework Integration (High Priority)**
- Add new agents from CLAUDE_BASIC.md that don't exist in current CLAUDE.md
- Update agent descriptions with latest capabilities
- Integrate new rule files and documentation paths
- Add new command categories and patterns

### 3. **Content Organization (Medium Priority)**
- Use CLAUDE_BASIC.md structure as template if it's more organized
- Merge similar sections intelligently
- Remove duplicate information
- Maintain logical flow and readability

### 4. **Technical Updates (Medium Priority)**
- Update file paths that have changed
- Refresh outdated version numbers or URLs
- Update command syntax if improved
- Merge tool lists and capabilities

### 5. **Documentation Sync (Lower Priority)**
- Update documentation references
- Refresh example patterns
- Update version information
- Merge changelog information

## 🔧 Specific Merge Instructions

### Section-by-Section Guidance:

1. **Header & Description**: Keep user's if customized, otherwise use CLAUDE_BASIC.md
2. **Rules Directory**: Merge both lists, removing duplicates
3. **Agent Documentation**: Combine all agents, update descriptions from CLAUDE_BASIC.md
4. **Command Documentation**: Merge command categories and examples
5. **Agent Usage Examples**: Combine examples, prefer more detailed ones
6. **TDD Pipeline**: Use CLAUDE_BASIC.md version if more comprehensive
7. **Error Handling**: Merge best practices from both
8. **Tone and Behavior**: ALWAYS preserve user customizations
9. **Absolute Rules**: Merge and deduplicate
10. **Quick Reference**: Combine checklists and rules

### Agent Registry Merging:
- For agents in both files: Use CLAUDE_BASIC.md description but keep user customizations
- For user-only agents: Keep completely
- For framework-only agents: Add to user's configuration
- Update decision matrices and selection guides

### Rule File References:
- Merge all rule file references
- Remove duplicates by filename
- Update paths if changed in framework
- Keep user-specific rules

## 📤 Output Requirements

**Format**: Provide ONLY the merged CLAUDE.md content
**Structure**: Follow CLAUDE_BASIC.md organization but with user content preserved
**Style**: Maintain consistency with user's existing style preferences
**Comments**: Add brief comments where significant changes were made

### Quality Checks:
- ✅ No duplicate sections or rules
- ✅ All user customizations preserved
- ✅ All new framework features included
- ✅ Consistent formatting and structure
- ✅ Valid markdown syntax
- ✅ Logical content organization

### Change Documentation:
Add a brief comment section at the end listing major changes:
\`\`\`
<!-- MERGE NOTES:
- Added X new agents from framework
- Updated Y agent descriptions
- Merged Z rule categories
- Preserved user customizations in sections: A, B, C
-->
\`\`\`

## 🚨 Critical Requirements

1. **NEVER remove user customizations** - When in doubt, keep both versions
2. **Preserve user tone and behavior** - This is sacred, never override
3. **Add, don't subtract** - Better to have more content than lose something important
4. **Document significant changes** - Help user understand what was modified
5. **Maintain functionality** - Ensure all references and paths work correctly

## 💡 AI Assistant Instructions

You are merging these files for a developer who values both their custom setup AND wants the latest framework capabilities. Be conservative with changes to user content and aggressive with adding new framework features. When conflicts arise, favor preserving user intent while still providing framework benefits.

Think of this as upgrading their configuration, not replacing it.

---

**Please provide the merged CLAUDE.md content now:**"

    if [ -n "$output_file" ]; then
        echo "$prompt" > "$output_file"
        print_msg "$GREEN" "✅ Comprehensive merge prompt saved to: $output_file"
        echo ""
        print_msg "$CYAN" "📋 Next steps:"
        echo "   1. Copy the prompt content"
        echo "   2. Paste into your AI assistant (Claude, ChatGPT, etc.)"
        echo "   3. Review the merged output carefully"
        echo "   4. Save the result as your new CLAUDE.md"
        echo "   5. Test the configuration"
    else
        echo "$prompt"
    fi
}

# Show usage
show_usage() {
    echo "Usage: $0 <existing_claude.md> <new_claude_basic.md> [output_file]"
    echo ""
    echo "Arguments:"
    echo "  existing_claude.md    Path to your current CLAUDE.md"
    echo "  new_claude_basic.md   Path to the new CLAUDE_BASIC.md from framework"
    echo "  output_file           Optional: File to save merge prompt to"
    echo ""
    echo "Examples:"
    echo "  $0 CLAUDE.md .claude/CLAUDE_BASIC.md"
    echo "  $0 CLAUDE.md .claude/CLAUDE_BASIC.md merge_prompt.md"
    echo "  $0 ~/project/CLAUDE.md ~/.autopm/.claude/CLAUDE_BASIC.md ~/merge.md"
}

# Interactive mode
interactive_mode() {
    echo ""
    print_msg "$CYAN" "🔍 Interactive Mode - Let's find your files"
    echo ""
    
    # Find existing CLAUDE.md
    local existing_claude=""
    if [ -f "CLAUDE.md" ]; then
        existing_claude="CLAUDE.md"
        print_msg "$GREEN" "✅ Found CLAUDE.md in current directory"
    else
        read -p "$(echo -e ${CYAN}📂 Path to your existing CLAUDE.md: ${NC})" existing_claude
        if [ ! -f "$existing_claude" ]; then
            print_msg "$RED" "❌ File not found: $existing_claude"
            exit 1
        fi
    fi
    
    # Find CLAUDE_BASIC.md
    local new_basic=""
    local candidates=(".claude/CLAUDE_BASIC.md" "../.claude/CLAUDE_BASIC.md" "~/.autopm/.claude/CLAUDE_BASIC.md")
    
    for candidate in "${candidates[@]}"; do
        if [ -f "$candidate" ]; then
            new_basic="$candidate"
            print_msg "$GREEN" "✅ Found CLAUDE_BASIC.md at: $candidate"
            break
        fi
    done
    
    if [ -z "$new_basic" ]; then
        read -p "$(echo -e ${CYAN}📂 Path to new CLAUDE_BASIC.md: ${NC})" new_basic
        if [ ! -f "$new_basic" ]; then
            print_msg "$RED" "❌ File not found: $new_basic"
            exit 1
        fi
    fi
    
    # Ask for output preference
    echo ""
    print_msg "$CYAN" "📤 How would you like the merge prompt?"
    echo "   1) Print to console"
    echo "   2) Save to file"
    echo "   3) Both"
    
    read -p "$(echo -e ${CYAN}Select [1-3]: ${NC})" choice
    
    case "$choice" in
        1)
            echo ""
            print_msg "$CYAN" "════════════════════════════════════════════════"
            generate_merge_prompt "$existing_claude" "$new_basic"
            print_msg "$CYAN" "════════════════════════════════════════════════"
            ;;
        2)
            local output_file="claude_merge_prompt_$(date +%Y%m%d_%H%M%S).md"
            generate_merge_prompt "$existing_claude" "$new_basic" "$output_file"
            ;;
        3)
            local output_file="claude_merge_prompt_$(date +%Y%m%d_%H%M%S).md"
            echo ""
            print_msg "$CYAN" "════════════════════════════════════════════════"
            generate_merge_prompt "$existing_claude" "$new_basic"
            print_msg "$CYAN" "════════════════════════════════════════════════"
            generate_merge_prompt "$existing_claude" "$new_basic" "$output_file"
            ;;
        *)
            print_msg "$YELLOW" "⚠️ Invalid choice, printing to console"
            generate_merge_prompt "$existing_claude" "$new_basic"
            ;;
    esac
}

# Main function
main() {
    print_banner
    
    # Check arguments
    if [ $# -eq 0 ]; then
        interactive_mode
        exit 0
    fi
    
    if [ $# -lt 2 ]; then
        show_usage
        exit 1
    fi
    
    local existing_claude="$1"
    local new_basic="$2"
    local output_file="${3:-}"
    
    # Validate files
    if [ ! -f "$existing_claude" ]; then
        print_msg "$RED" "❌ File not found: $existing_claude"
        exit 1
    fi
    
    if [ ! -f "$new_basic" ]; then
        print_msg "$RED" "❌ File not found: $new_basic"
        exit 1
    fi
    
    print_msg "$BLUE" "📂 Existing CLAUDE.md: $existing_claude"
    print_msg "$BLUE" "📂 New CLAUDE_BASIC.md: $new_basic"
    
    if [ -n "$output_file" ]; then
        print_msg "$BLUE" "📄 Output file: $output_file"
        generate_merge_prompt "$existing_claude" "$new_basic" "$output_file"
    else
        echo ""
        print_msg "$CYAN" "════════════════════════════════════════════════"
        generate_merge_prompt "$existing_claude" "$new_basic"
        print_msg "$CYAN" "════════════════════════════════════════════════"
    fi
}

# Run main
main "$@"