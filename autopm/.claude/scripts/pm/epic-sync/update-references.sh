#!/bin/bash
# Update References Script
# Updates task dependencies and renames files to use GitHub issue numbers

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
readonly TASK_MAPPING_FILE="${2:-}"

# Global variables
declare -g temp_dir=""
declare -g id_mapping_file=""

# Main function
main() {
    print_banner "Task References Updater" "1.0.0"

    # Validate inputs
    log_info "Validating inputs: epic=$EPIC_NAME, mapping_file=$TASK_MAPPING_FILE"
    validate_inputs || exit 1

    # Setup workspace
    setup_workspace

    # Build ID mapping from old numbers to new issue numbers
    with_error_handling "Build ID mapping" \
        build_id_mapping

    # Process each task file: update references and rename
    with_error_handling "Update task files and references" \
        update_task_files

    # Display results
    display_results

    log_success "Task references update completed successfully"
}

# Validate script inputs
validate_inputs() {
    log_function_entry "validate_inputs"

    validate_epic_name "$EPIC_NAME" || return 1
    validate_file_exists "$TASK_MAPPING_FILE" "Task mapping file" || return 1
    validate_epic_structure "$EPIC_NAME" || return 1
    validate_github_auth || return 1

    log_function_exit "validate_inputs"
    return 0
}

# Setup temporary workspace
setup_workspace() {
    log_function_entry "setup_workspace"

    temp_dir="/tmp/update-refs-$$"
    id_mapping_file="$temp_dir/id-mapping.txt"

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

# Build mapping from old task numbers to new issue IDs
build_id_mapping() {
    log_function_entry "build_id_mapping"

    > "$id_mapping_file"  # Initialize mapping file

    local mapping_count=0

    # Read task mapping file and extract old/new number pairs
    while IFS=: read -r task_file task_number; do
        # Skip empty lines
        [[ -n "$task_file" && -n "$task_number" ]] || continue

        # Extract old number from filename (e.g., 001 from 001.md)
        local old_num
        old_num=$(basename "$task_file" .md)

        # Validate that it's a numbered task file
        if [[ "$old_num" =~ ^[0-9]{3}$ ]]; then
            echo "$old_num:$task_number" >> "$id_mapping_file"
            mapping_count=$((mapping_count + 1))
            log_debug "Mapped $old_num → $task_number"
        else
            log_warning "Skipping non-numbered file: $task_file"
        fi
    done < "$TASK_MAPPING_FILE"

    log_info "Built ID mapping with $mapping_count entries"

    if [[ $mapping_count -eq 0 ]]; then
        log_error "No valid task mappings found"
        return 1
    fi

    log_function_exit "build_id_mapping"
    return 0
}

# Update task files with new references and rename them
update_task_files() {
    log_function_entry "update_task_files"

    local updated_count=0
    local skipped_count=0

    # Get repository info for GitHub URLs
    local repo_info
    repo_info=$(get_repo_info)
    local repo_name
    repo_name=$(echo "$repo_info" | grep -o '"nameWithOwner":"[^"]*"' | cut -d'"' -f4)

    log_info "Repository: $repo_name"

    # Process each task file from the mapping
    while IFS=: read -r task_file task_number; do
        # Skip empty lines
        [[ -n "$task_file" && -n "$task_number" ]] || continue

        if [[ ! -f "$task_file" ]]; then
            log_warning "Task file not found: $task_file"
            skipped_count=$((skipped_count + 1))
            continue
        fi

        log_info "Processing: $(basename "$task_file") → #$task_number"

        # Update file with new references and frontmatter
        if update_single_task_file "$task_file" "$task_number" "$repo_name"; then
            updated_count=$((updated_count + 1))
        else
            log_error "Failed to update: $task_file"
            skipped_count=$((skipped_count + 1))
        fi

    done < "$TASK_MAPPING_FILE"

    log_info "Updated $updated_count files, skipped $skipped_count files"
    log_function_exit "update_task_files"
}

# Update a single task file with new references
update_single_task_file() {
    local task_file="$1"
    local task_number="$2"
    local repo_name="$3"

    log_function_entry "update_single_task_file" "$(basename "$task_file")" "$task_number"

    local epic_dir
    epic_dir=$(dirname "$task_file")
    local new_filename="${task_number}.md"
    local new_filepath="$epic_dir/$new_filename"

    # Read the original file content
    local content
    content=$(cat "$task_file")

    # Update dependencies and conflicts references
    while IFS=: read -r old_num new_num; do
        # Update references in arrays like [001, 002] and individual references
        # Use word boundaries to avoid partial matches
        content=$(echo "$content" | sed "s/\\b$old_num\\b/$new_num/g")
    done < "$id_mapping_file"

    # Write updated content to new file
    echo "$content" > "$new_filepath"

    # Update frontmatter with GitHub URL and timestamp
    local github_url="https://github.com/$repo_name/issues/$task_number"
    local current_datetime
    current_datetime=$(get_current_datetime)

    # Use frontmatter utilities to update fields
    update_frontmatter_field "$new_filepath" "github" "$github_url"
    update_frontmatter_field "$new_filepath" "updated" "$current_datetime"

    # Remove old file if it's different from new file
    if [[ "$task_file" != "$new_filepath" ]]; then
        rm "$task_file"
        log_debug "Renamed: $(basename "$task_file") → $(basename "$new_filepath")"
    else
        log_debug "Updated in place: $(basename "$task_file")"
    fi

    log_function_exit "update_single_task_file"
    return 0
}

# Display update results
display_results() {
    local epic_dir=".claude/epics/$EPIC_NAME"

    print_section "✅ Task References Update Results"

    echo "Epic: $EPIC_NAME"
    echo "Updated files:"

    # List all numbered task files (now with issue numbers)
    local task_files=()
    readarray -t task_files < <(find "$epic_dir" -name '[0-9]*.md' -type f | sort -n)

    for task_file in "${task_files[@]}"; do
        local issue_number
        issue_number=$(basename "$task_file" .md)

        local task_name
        task_name=$(get_frontmatter_field "$task_file" "name" 2>/dev/null || echo "Unknown")

        local github_url
        github_url=$(get_frontmatter_field "$task_file" "github" 2>/dev/null || echo "")

        echo "  #$issue_number: $task_name"
        if [[ -n "$github_url" ]]; then
            echo "    → $github_url"
        fi
    done

    echo ""
    echo "✅ All task files updated with GitHub issue numbers"
    echo "✅ All dependency references updated"
    echo "✅ Frontmatter updated with GitHub URLs"

    # Check for any remaining old-format files
    local old_files=()
    readarray -t old_files < <(find "$epic_dir" -name '[0-9][0-9][0-9].md' -type f 2>/dev/null || true)

    if [[ ${#old_files[@]} -gt 0 ]]; then
        echo ""
        echo "⚠️  Warning: Found old-format files that weren't processed:"
        printf "   - %s\n" "${old_files[@]}"
    fi
}

# Validate dependency references in a task file
validate_task_dependencies() {
    local task_file="$1"

    log_function_entry "validate_task_dependencies" "$(basename "$task_file")"

    # Extract depends_on and conflicts_with arrays
    local depends_on
    local conflicts_with

    depends_on=$(get_frontmatter_field "$task_file" "depends_on" 2>/dev/null || echo "")
    conflicts_with=$(get_frontmatter_field "$task_file" "conflicts_with" 2>/dev/null || echo "")

    # Check if references are still in old format (3-digit numbers)
    local has_old_refs=false

    if [[ "$depends_on" =~ [0-9]{3} ]]; then
        log_warning "$(basename "$task_file"): depends_on still has old references: $depends_on"
        has_old_refs=true
    fi

    if [[ "$conflicts_with" =~ [0-9]{3} ]]; then
        log_warning "$(basename "$task_file"): conflicts_with still has old references: $conflicts_with"
        has_old_refs=true
    fi

    if [[ "$has_old_refs" == "true" ]]; then
        log_function_exit "validate_task_dependencies" 1
        return 1
    fi

    log_debug "Task dependencies validated: $(basename "$task_file")"
    log_function_exit "validate_task_dependencies"
    return 0
}

# Error handling
handle_error() {
    local exit_code=$?
    log_error "Script failed with exit code: $exit_code"
    log_error "Task references update failed for epic: $EPIC_NAME"
    exit "$exit_code"
}

# Set up error handling
trap handle_error ERR

# Validate arguments
if [[ $# -ne 2 ]]; then
    echo "Usage: $0 <epic_name> <task_mapping_file>"
    echo ""
    echo "Updates task file references and renames files to use GitHub issue numbers."
    echo ""
    echo "Arguments:"
    echo "  epic_name           Name of the epic directory"
    echo "  task_mapping_file   File containing task_file:issue_number mappings"
    echo ""
    echo "The mapping file should contain lines in the format:"
    echo "  /path/to/001.md:123"
    echo "  /path/to/002.md:124"
    echo ""
    echo "Examples:"
    echo "  $0 authentication /tmp/task-mapping.txt"
    echo "  $0 user-dashboard ./epic-mappings.txt"
    echo ""
    exit 1
fi

# Run main function
main "$@"