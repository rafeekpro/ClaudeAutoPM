#!/bin/bash
# Create Task Issues Script
# Creates GitHub issues for all tasks in an epic with parallel execution support

set -euo pipefail

# Load libraries
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../../lib/logging-utils.sh"
source "${SCRIPT_DIR}/../../lib/github-utils.sh"
source "${SCRIPT_DIR}/../../lib/frontmatter-utils.sh"
source "${SCRIPT_DIR}/../../lib/validation-utils.sh"

# Script configuration
readonly EPIC_NAME="${1:-}"
readonly EPIC_NUMBER="${2:-}"
readonly PARALLEL_THRESHOLD="${AUTOPM_PARALLEL_THRESHOLD:-5}"

# Global variables
declare -g use_subissues=false
declare -g temp_dir=""
declare -g mapping_file=""

# Main function
main() {
    print_banner "Task Issues Creator" "1.0.0"

    # Validate inputs
    log_info "Validating inputs: epic=$EPIC_NAME, epic_number=$EPIC_NUMBER"
    validate_inputs || exit 1

    # Setup workspace
    setup_workspace

    # Check GitHub capabilities
    check_github_capabilities

    # Get task files and determine strategy
    local task_files
    readarray -t task_files < <(find ".claude/epics/$EPIC_NAME" -name '[0-9][0-9][0-9].md' -type f | sort)
    local task_count=${#task_files[@]}

    log_info "Found $task_count task files"

    if [[ $task_count -eq 0 ]]; then
        log_error "No task files found in epic directory"
        echo "❌ No tasks to sync. Run: /pm:epic-decompose $EPIC_NAME"
        exit 1
    fi

    # Create issues based on count
    if [[ $task_count -lt $PARALLEL_THRESHOLD ]]; then
        log_info "Using sequential creation for $task_count tasks"
        create_tasks_sequential "${task_files[@]}"
    else
        log_info "Using parallel creation for $task_count tasks"
        create_tasks_parallel "${task_files[@]}"
    fi

    # Output results
    display_results "$task_count"

    # Return mapping file path for further processing
    echo "$mapping_file"
}

# Validate script inputs
validate_inputs() {
    log_function_entry "validate_inputs"

    validate_epic_name "$EPIC_NAME" || return 1
    validate_issue_number "$EPIC_NUMBER" || return 1
    validate_epic_structure "$EPIC_NAME" || return 1
    validate_github_auth || return 1

    log_function_exit "validate_inputs"
    return 0
}

# Setup temporary workspace
setup_workspace() {
    log_function_entry "setup_workspace"

    temp_dir="/tmp/task-issues-$$"
    mapping_file="$temp_dir/task-mapping.txt"

    log_info "Creating workspace: $temp_dir"
    mkdir -p "$temp_dir"

    # Initialize mapping file
    > "$mapping_file"

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

# Check GitHub capabilities (sub-issues extension)
check_github_capabilities() {
    log_function_entry "check_github_capabilities"

    if gh extension list | grep -q "yahsan2/gh-sub-issue"; then
        use_subissues=true
        log_info "gh-sub-issue extension detected - using sub-issues"
    else
        use_subissues=false
        log_warning "gh-sub-issue extension not available - using regular issues"
    fi

    log_function_exit "check_github_capabilities"
}

# Create tasks sequentially (for small batches)
create_tasks_sequential() {
    local task_files=("$@")

    log_function_entry "create_tasks_sequential" "${#task_files[@]} tasks"

    local labels="task,epic:$EPIC_NAME"
    local processed=0

    for task_file in "${task_files[@]}"; do
        [[ -f "$task_file" ]] || continue

        log_info "Processing task file: $(basename "$task_file")"

        # Extract task name from frontmatter
        local task_name
        task_name=$(get_frontmatter_field "$task_file" "name")

        if [[ -z "$task_name" ]]; then
            log_error "No task name found in $task_file"
            continue
        fi

        # Strip frontmatter for issue body
        local task_body_file="$temp_dir/task-body-$(basename "$task_file")"
        strip_frontmatter "$task_file" "$task_body_file"

        # Create issue
        local task_number
        if [[ "$use_subissues" == "true" ]]; then
            task_number=$(create_github_subissue "$EPIC_NUMBER" "$task_name" "$task_body_file" "$labels")
        else
            task_number=$(create_github_issue "$task_name" "$task_body_file" "$labels")
        fi

        if [[ -n "$task_number" ]]; then
            # Record mapping
            echo "$task_file:$task_number" >> "$mapping_file"
            processed=$((processed + 1))
            log_success "Created task issue #$task_number: $task_name"
        else
            log_error "Failed to create issue for $task_file"
        fi
    done

    log_info "Sequential creation completed: $processed/$# tasks created"
    log_function_exit "create_tasks_sequential"
}

# Create tasks in parallel (for large batches)
create_tasks_parallel() {
    local task_files=("$@")

    log_function_entry "create_tasks_parallel" "${#task_files[@]} tasks"

    local batch_size=4
    local batches=()
    local batch_count=0

    # Split tasks into batches
    for ((i=0; i<${#task_files[@]}; i+=batch_size)); do
        local batch=("${task_files[@]:$i:$batch_size}")
        batches+=("$(printf '%s\n' "${batch[@]}")")
        batch_count=$((batch_count + 1))
    done

    log_info "Split into $batch_count batches of up to $batch_size tasks each"

    # Process batches in parallel using background jobs
    local pids=()
    local batch_mapping_files=()

    for ((b=0; b<batch_count; b++)); do
        local batch_mapping="$temp_dir/batch-$b-mapping.txt"
        batch_mapping_files+=("$batch_mapping")

        # Create batch in background
        (
            log_info "Starting batch $((b+1))/$batch_count"
            process_task_batch "$b" "$batch_mapping" <<< "${batches[$b]}"
        ) &

        pids+=($!)
    done

    # Wait for all batches to complete
    log_info "Waiting for $batch_count parallel batches to complete..."
    local failed_batches=0

    for ((p=0; p<${#pids[@]}; p++)); do
        if wait "${pids[$p]}"; then
            log_success "Batch $((p+1)) completed successfully"
        else
            log_error "Batch $((p+1)) failed"
            failed_batches=$((failed_batches + 1))
        fi
    done

    # Consolidate results
    log_info "Consolidating results from $batch_count batches"
    for batch_mapping in "${batch_mapping_files[@]}"; do
        if [[ -f "$batch_mapping" ]]; then
            cat "$batch_mapping" >> "$mapping_file"
        fi
    done

    local total_created
    total_created=$(wc -l < "$mapping_file" 2>/dev/null || echo 0)

    if [[ $failed_batches -gt 0 ]]; then
        log_warning "Parallel creation completed with $failed_batches failed batches"
        log_warning "Created $total_created/${#task_files[@]} task issues"
    else
        log_success "Parallel creation completed successfully"
        log_success "Created $total_created/${#task_files[@]} task issues"
    fi

    log_function_exit "create_tasks_parallel"
}

# Process a single batch of tasks
process_task_batch() {
    local batch_number="$1"
    local batch_mapping_file="$2"
    local labels="task,epic:$EPIC_NAME"

    # Read task files from stdin
    local task_files=()
    while IFS= read -r task_file; do
        [[ -n "$task_file" ]] && task_files+=("$task_file")
    done

    log_debug "Batch $batch_number processing ${#task_files[@]} tasks"

    > "$batch_mapping_file"  # Initialize batch mapping file

    for task_file in "${task_files[@]}"; do
        [[ -f "$task_file" ]] || continue

        # Extract task name
        local task_name
        task_name=$(get_frontmatter_field "$task_file" "name")

        if [[ -z "$task_name" ]]; then
            log_error "No task name in $task_file"
            continue
        fi

        # Strip frontmatter
        local task_body_file="$temp_dir/batch-$batch_number-$(basename "$task_file")"
        strip_frontmatter "$task_file" "$task_body_file"

        # Create issue
        local task_number
        if [[ "$use_subissues" == "true" ]]; then
            task_number=$(create_github_subissue "$EPIC_NUMBER" "$task_name" "$task_body_file" "$labels")
        else
            task_number=$(create_github_issue "$task_name" "$task_body_file" "$labels")
        fi

        if [[ -n "$task_number" ]]; then
            echo "$task_file:$task_number" >> "$batch_mapping_file"
            log_debug "Batch $batch_number: Created #$task_number for $(basename "$task_file")"
        else
            log_error "Batch $batch_number: Failed to create issue for $(basename "$task_file")"
        fi
    done

    log_debug "Batch $batch_number completed"
}

# Display creation results
display_results() {
    local task_count="$1"
    local created_count
    created_count=$(wc -l < "$mapping_file" 2>/dev/null || echo 0)

    print_section "✅ Task Issues Creation Results"

    echo "Epic: $EPIC_NAME (Issue #$EPIC_NUMBER)"
    echo "Strategy: $([[ $task_count -lt $PARALLEL_THRESHOLD ]] && echo "Sequential" || echo "Parallel")"
    echo "Sub-issues: $([[ "$use_subissues" == "true" ]] && echo "Enabled" || echo "Disabled")"
    echo "Created: $created_count/$task_count task issues"

    if [[ $created_count -gt 0 ]]; then
        echo ""
        echo "Task mappings:"
        while IFS=: read -r task_file issue_number; do
            local task_name
            task_name=$(basename "$task_file" .md)
            echo "  #$issue_number: $task_name"
        done < "$mapping_file"
    fi

    if [[ $created_count -lt $task_count ]]; then
        echo ""
        echo "⚠️  Some issues failed to create. Check logs for details."
    fi
}

# Error handling
handle_error() {
    local exit_code=$?
    log_error "Script failed with exit code: $exit_code"
    log_error "Task issues creation failed for epic: $EPIC_NAME"
    exit "$exit_code"
}

# Set up error handling
trap handle_error ERR

# Validate arguments
if [[ $# -lt 2 ]]; then
    echo "Usage: $0 <epic_name> <epic_issue_number>"
    echo ""
    echo "Creates GitHub issues for all tasks in the specified epic."
    echo ""
    echo "Arguments:"
    echo "  epic_name           Name of the epic directory"
    echo "  epic_issue_number   GitHub issue number of the parent epic"
    echo ""
    echo "Environment Variables:"
    echo "  AUTOPM_PARALLEL_THRESHOLD   Minimum tasks for parallel execution (default: 5)"
    echo ""
    echo "Examples:"
    echo "  $0 authentication 123"
    echo "  AUTOPM_PARALLEL_THRESHOLD=3 $0 user-dashboard 456"
    echo ""
    exit 1
fi

# Run main function
main "$@"