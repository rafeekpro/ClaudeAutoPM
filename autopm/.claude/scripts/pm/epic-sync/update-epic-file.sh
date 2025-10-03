#!/bin/bash
# Update Epic File Script
# Updates epic.md with GitHub URL, timestamp, and real task IDs

set -euo pipefail

# Load libraries
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../../lib/logging-utils.sh"
source "${SCRIPT_DIR}/../../lib/github-utils.sh"
source "${SCRIPT_DIR}/../../lib/frontmatter-utils.sh"
source "${SCRIPT_DIR}/../../lib/validation-utils.sh"
source "${SCRIPT_DIR}/../../lib/datetime-utils.sh"

# Script configuration
readonly EPIC_NAME="${1:-}"
readonly EPIC_ISSUE_NUMBER="${2:-}"

# Global variables
declare -g temp_dir=""
declare -g epic_file=""

# Main function
main() {
    print_banner "Epic File Updater" "1.0.0"

    # Validate inputs
    log_info "Validating inputs: epic=$EPIC_NAME, epic_issue=$EPIC_ISSUE_NUMBER"
    validate_inputs || exit 1

    # Setup workspace
    setup_workspace

    # Update epic frontmatter
    with_error_handling "Update epic frontmatter" \
        update_epic_frontmatter

    # Update Tasks Created section
    with_error_handling "Update Tasks Created section" \
        update_tasks_created_section

    # Create GitHub mapping file
    with_error_handling "Create GitHub mapping file" \
        create_github_mapping_file

    # Display results
    display_results

    log_success "Epic file update completed successfully"
}

# Validate script inputs
validate_inputs() {
    log_function_entry "validate_inputs"

    validate_epic_name "$EPIC_NAME" || return 1
    validate_issue_number "$EPIC_ISSUE_NUMBER" || return 1
    validate_epic_structure "$EPIC_NAME" || return 1
    validate_github_auth || return 1

    epic_file=".claude/epics/$EPIC_NAME/epic.md"
    validate_file_exists "$epic_file" "Epic file" || return 1

    log_function_exit "validate_inputs"
    return 0
}

# Setup temporary workspace
setup_workspace() {
    log_function_entry "setup_workspace"

    temp_dir="/tmp/update-epic-$$"

    log_info "Creating workspace: $temp_dir"
    mkdir -p "$temp_dir"

    # Cleanup on exit
    trap "cleanup_workspace" EXIT

    log_function_exit "setup_workspace"
}

# Cleanup workspace
cleanup_workspace() {
    if [[ -n "$temp_dir" ]] && [[ -d "$temp_dir" ]]; then
        log_debug "Cleaning up workspace: $temp_dir"
        rm -rf "$temp_dir"
    fi
}

# Update epic frontmatter with GitHub URL and timestamp
update_epic_frontmatter() {
    log_function_entry "update_epic_frontmatter"

    # Get repository info
    local repo_info
    repo_info=$(get_repo_info)
    local repo_name
    repo_name=$(echo "$repo_info" | grep -o '"nameWithOwner":"[^"]*"' | cut -d'"' -f4)

    local epic_url="https://github.com/$repo_name/issues/$EPIC_ISSUE_NUMBER"
    local current_datetime
    current_datetime=$(get_current_datetime)

    log_info "Updating epic frontmatter"
    log_debug "Repository: $repo_name"
    log_debug "Epic URL: $epic_url"
    log_debug "Timestamp: $current_datetime"

    # Update frontmatter fields
    update_frontmatter_field "$epic_file" "github" "$epic_url"
    update_frontmatter_field "$epic_file" "updated" "$current_datetime"

    log_success "Epic frontmatter updated"
    log_function_exit "update_epic_frontmatter"
}

# Update the Tasks Created section with real issue numbers
update_tasks_created_section() {
    log_function_entry "update_tasks_created_section"

    local epic_dir=".claude/epics/$EPIC_NAME"
    local tasks_section_file="$temp_dir/tasks-section.md"

    # Create new Tasks Created section
    cat > "$tasks_section_file" << 'EOF'
## Tasks Created
EOF

    local task_count=0

    # Add each task with its real issue number
    local task_files=()
    readarray -t task_files < <(find "$epic_dir" -name '[0-9]*.md' -type f | sort -n)

    for task_file in "${task_files[@]}"; do
        [[ -f "$task_file" ]] || continue

        # Get issue number (filename without .md)
        local issue_num
        issue_num=$(basename "$task_file" .md)

        # Get task name from frontmatter
        local task_name
        task_name=$(get_frontmatter_field "$task_file" "name" 2>/dev/null || echo "Unknown Task")

        # Get parallel status
        local parallel
        parallel=$(get_frontmatter_field "$task_file" "parallel" 2>/dev/null || echo "false")

        # Add to tasks section
        echo "- [ ] #${issue_num} - ${task_name} (parallel: ${parallel})" >> "$tasks_section_file"
        task_count=$((task_count + 1))
        log_debug "Added task: #$issue_num - $task_name"
    done

    # Calculate and add summary statistics
    local parallel_count sequential_count
    parallel_count=$(grep -l '^parallel: true' "$epic_dir"/[0-9]*.md 2>/dev/null | wc -l || echo 0)
    sequential_count=$((task_count - parallel_count))

    cat >> "$tasks_section_file" << EOF

Total tasks: ${task_count}
Parallel tasks: ${parallel_count}
Sequential tasks: ${sequential_count}
EOF

    log_info "Generated tasks section: $task_count tasks ($parallel_count parallel, $sequential_count sequential)"

    # Replace the Tasks Created section in epic.md
    replace_tasks_created_section "$tasks_section_file"

    log_success "Tasks Created section updated"
    log_function_exit "update_tasks_created_section"
}

# Replace the Tasks Created section in epic.md
replace_tasks_created_section() {
    local tasks_section_file="$1"

    log_function_entry "replace_tasks_created_section"

    # Create backup
    local backup_file="$epic_file.backup"
    cp "$epic_file" "$backup_file"

    # Use awk to replace the section
    awk -v tasks_file="$tasks_section_file" '
        /^## Tasks Created/ {
            skip=1
            while ((getline line < tasks_file) > 0) print line
            close(tasks_file)
            next
        }
        /^## / && !/^## Tasks Created/ {
            skip=0
        }
        !skip && !/^## Tasks Created/ {
            print
        }
    ' "$backup_file" > "$epic_file"

    # Clean up backup
    rm "$backup_file"

    log_debug "Replaced Tasks Created section using awk"
    log_function_exit "replace_tasks_created_section"
}

# Create GitHub mapping file for reference
create_github_mapping_file() {
    log_function_entry "create_github_mapping_file"

    local epic_dir=".claude/epics/$EPIC_NAME"
    local mapping_file="$epic_dir/github-mapping.md"

    # Get repository info
    local repo_info
    repo_info=$(get_repo_info)
    local repo_name
    repo_name=$(echo "$repo_info" | grep -o '"nameWithOwner":"[^"]*"' | cut -d'"' -f4)

    # Create mapping file
    cat > "$mapping_file" << EOF
# GitHub Issue Mapping

Epic: #${EPIC_ISSUE_NUMBER} - https://github.com/${repo_name}/issues/${EPIC_ISSUE_NUMBER}

Tasks:
EOF

    # Add each task mapping
    local task_files=()
    readarray -t task_files < <(find "$epic_dir" -name '[0-9]*.md' -type f | sort -n)

    for task_file in "${task_files[@]}"; do
        [[ -f "$task_file" ]] || continue

        local issue_num
        issue_num=$(basename "$task_file" .md)

        local task_name
        task_name=$(get_frontmatter_field "$task_file" "name" 2>/dev/null || echo "Unknown Task")

        echo "- #${issue_num}: ${task_name} - https://github.com/${repo_name}/issues/${issue_num}" >> "$mapping_file"
    done

    # Add sync timestamp
    local current_datetime
    current_datetime=$(get_current_datetime)

    cat >> "$mapping_file" << EOF

Synced: ${current_datetime}
EOF

    log_info "Created GitHub mapping file: $mapping_file"
    log_function_exit "create_github_mapping_file"
}

# Display update results
display_results() {
    local epic_dir=".claude/epics/$EPIC_NAME"

    print_section "✅ Epic File Update Results"

    echo "Epic: $EPIC_NAME"
    echo "GitHub Issue: #$EPIC_ISSUE_NUMBER"

    # Show updated frontmatter
    local epic_url github_field updated_field
    github_field=$(get_frontmatter_field "$epic_file" "github" 2>/dev/null || echo "")
    updated_field=$(get_frontmatter_field "$epic_file" "updated" 2>/dev/null || echo "")

    echo ""
    echo "Frontmatter Updates:"
    echo "  GitHub URL: $github_field"
    echo "  Updated: $updated_field"

    # Show tasks summary
    local task_files=()
    readarray -t task_files < <(find "$epic_dir" -name '[0-9]*.md' -type f | sort -n)

    local task_count=${#task_files[@]}
    local parallel_count
    parallel_count=$(grep -l '^parallel: true' "$epic_dir"/[0-9]*.md 2>/dev/null | wc -l || echo 0)
    local sequential_count=$((task_count - parallel_count))

    echo ""
    echo "Tasks Summary:"
    echo "  Total tasks: $task_count"
    echo "  Parallel tasks: $parallel_count"
    echo "  Sequential tasks: $sequential_count"

    # Show created files
    echo ""
    echo "Files Updated:"
    echo "  ✅ $epic_file"
    echo "  ✅ $epic_dir/github-mapping.md"

    echo ""
    echo "✅ Epic file synchronized with GitHub"
    echo "✅ All task references updated with real issue numbers"
    echo "✅ Frontmatter updated with GitHub URL and timestamp"
}

# Validate epic structure after update
validate_epic_structure_post_update() {
    log_function_entry "validate_epic_structure_post_update"

    # Check that Tasks Created section exists and is properly formatted
    if ! grep -q "^## Tasks Created" "$epic_file"; then
        log_error "Tasks Created section not found after update"
        return 1
    fi

    # Check that frontmatter has GitHub URL
    local github_url
    github_url=$(get_frontmatter_field "$epic_file" "github" 2>/dev/null || echo "")

    if [[ -z "$github_url" ]]; then
        log_error "GitHub URL not found in epic frontmatter"
        return 1
    fi

    # Validate GitHub URL format
    if [[ ! "$github_url" =~ ^https://github\.com/.*/issues/[0-9]+$ ]]; then
        log_error "Invalid GitHub URL format: $github_url"
        return 1
    fi

    log_debug "Epic structure validation passed"
    log_function_exit "validate_epic_structure_post_update"
    return 0
}

# Error handling
handle_error() {
    local exit_code=$?
    log_error "Script failed with exit code: $exit_code"
    log_error "Epic file update failed for: $EPIC_NAME"
    exit "$exit_code"
}

# Set up error handling
trap handle_error ERR

# Validate arguments
if [[ $# -ne 2 ]]; then
    echo "Usage: $0 <epic_name> <epic_issue_number>"
    echo ""
    echo "Updates epic.md file with GitHub URL, timestamp, and real task IDs."
    echo ""
    echo "Arguments:"
    echo "  epic_name           Name of the epic directory"
    echo "  epic_issue_number   GitHub issue number of the epic"
    echo ""
    echo "This script will:"
    echo "  1. Update epic frontmatter with GitHub URL and timestamp"
    echo "  2. Update Tasks Created section with real issue numbers"
    echo "  3. Create github-mapping.md file for reference"
    echo ""
    echo "Examples:"
    echo "  $0 authentication 123"
    echo "  $0 user-dashboard 456"
    echo ""
    exit 1
fi

# Run main function
main "$@"