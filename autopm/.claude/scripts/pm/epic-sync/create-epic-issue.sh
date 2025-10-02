#!/bin/bash
# Create Epic Issue Script
# Extracts content from epic.md, processes it, and creates GitHub issue

set -euo pipefail

# Load libraries
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../../lib/logging-utils.sh"
source "${SCRIPT_DIR}/../../lib/github-utils.sh"
source "${SCRIPT_DIR}/../../lib/frontmatter-utils.sh"
source "${SCRIPT_DIR}/../../lib/validation-utils.sh"

# Script configuration
readonly EPIC_NAME="${1:-}"

# Main function
main() {
    print_banner "Epic Issue Creator" "1.0.0"

    # Validate inputs
    log_info "Validating epic: $EPIC_NAME"
    validate_epic_name "$EPIC_NAME" || exit 1
    validate_epic_structure "$EPIC_NAME" || exit 1

    # Check GitHub authentication and repo protection
    validate_github_auth || exit 1
    check_repo_protection || exit 1

    local epic_file=".claude/epics/$EPIC_NAME/epic.md"
    local temp_dir="/tmp/epic-sync-$$"

    log_info "Creating temporary workspace: $temp_dir"
    mkdir -p "$temp_dir"

    # Ensure cleanup on exit
    trap "rm -rf '$temp_dir'" EXIT

    # Process epic content
    with_error_handling "Strip frontmatter from epic" \
        strip_frontmatter "$epic_file" "$temp_dir/epic-body-raw.md"

    with_error_handling "Process epic content and stats" \
        process_epic_content "$temp_dir/epic-body-raw.md" "$temp_dir/epic-body.md"

    with_error_handling "Determine epic type" \
        epic_type=$(determine_epic_type "$temp_dir/epic-body.md")

    with_error_handling "Create GitHub epic issue" \
        issue_number=$(create_epic_github_issue "$temp_dir/epic-body.md" "$epic_type")

    # Output result
    local repo_info
    repo_info=$(get_repo_info)
    local repo_name
    repo_name=$(echo "$repo_info" | grep -o '"nameWithOwner":"[^"]*"' | cut -d'"' -f4)

    log_success "Epic issue created successfully!"
    echo "Epic Issue: #${issue_number}"
    echo "URL: https://github.com/${repo_name}/issues/${issue_number}"
    echo "$issue_number"  # For script consumption
}

# Process epic content and replace Tasks Created section with Stats
process_epic_content() {
    local input_file="$1"
    local output_file="$2"

    log_function_entry "process_epic_content" "$input_file" "$output_file"

    # Count tasks in epic directory
    local epic_dir=".claude/epics/$EPIC_NAME"
    local total_tasks parallel_tasks sequential_tasks total_effort

    total_tasks=$(find "$epic_dir" -name '[0-9][0-9][0-9].md' -type f | wc -l)
    parallel_tasks=$(grep -l '^parallel: true' "$epic_dir"/[0-9][0-9][0-9].md 2>/dev/null | wc -l || echo 0)
    sequential_tasks=$((total_tasks - parallel_tasks))

    # Try to calculate total effort from task files
    total_effort=$(calculate_total_effort "$epic_dir")

    # Process content with awk to replace Tasks Created section
    awk -v total_tasks="$total_tasks" \
        -v parallel_tasks="$parallel_tasks" \
        -v sequential_tasks="$sequential_tasks" \
        -v total_effort="$total_effort" '
        /^## Tasks Created/ {
            in_tasks=1
            next
        }
        /^## / && in_tasks {
            in_tasks=0
            # Add Stats section
            print "## Stats"
            print ""
            print "Total tasks: " total_tasks
            print "Parallel tasks: " parallel_tasks " (can be worked on simultaneously)"
            print "Sequential tasks: " sequential_tasks " (have dependencies)"
            if (total_effort) print "Estimated total effort: " total_effort " hours"
            print ""
        }
        /^Total tasks:/ && in_tasks { next }
        /^Parallel tasks:/ && in_tasks { next }
        /^Sequential tasks:/ && in_tasks { next }
        /^Estimated total effort:/ && in_tasks { next }
        !in_tasks { print }
        END {
            # If we were still in tasks section at EOF, add stats
            if (in_tasks) {
                print "## Stats"
                print ""
                print "Total tasks: " total_tasks
                print "Parallel tasks: " parallel_tasks " (can be worked on simultaneously)"
                print "Sequential tasks: " sequential_tasks " (have dependencies)"
                if (total_effort) print "Estimated total effort: " total_effort " hours"
            }
        }
    ' "$input_file" > "$output_file"

    log_debug "Processed epic content with stats: $total_tasks total, $parallel_tasks parallel"
    log_function_exit "process_epic_content"
}

# Calculate total effort from task files
calculate_total_effort() {
    local epic_dir="$1"
    local total_effort=0

    for task_file in "$epic_dir"/[0-9][0-9][0-9].md; do
        [[ -f "$task_file" ]] || continue

        local effort
        effort=$(get_frontmatter_field "$task_file" "effort" 2>/dev/null || echo "")

        if [[ "$effort" =~ ^[0-9]+$ ]]; then
            total_effort=$((total_effort + effort))
        fi
    done

    if [[ "$total_effort" -gt 0 ]]; then
        echo "$total_effort"
    fi
}

# Determine epic type from content
determine_epic_type() {
    local content_file="$1"

    log_function_entry "determine_epic_type" "$content_file"

    if grep -qi "bug\|fix\|issue\|problem\|error\|hotfix\|patch" "$content_file"; then
        echo "bug"
    else
        echo "feature"
    fi

    log_function_exit "determine_epic_type"
}

# Create GitHub epic issue with proper labels
create_epic_github_issue() {
    local body_file="$1"
    local epic_type="$2"

    log_function_entry "create_epic_github_issue" "$body_file" "$epic_type"

    local title="Epic: $EPIC_NAME"
    local labels="epic,epic:$EPIC_NAME,$epic_type"

    local issue_number
    issue_number=$(create_github_issue "$title" "$body_file" "$labels")

    log_function_exit "create_epic_github_issue" 0
    echo "$issue_number"
}

# Error handling
handle_error() {
    local exit_code=$?
    log_error "Script failed with exit code: $exit_code"
    log_error "Epic issue creation failed for: $EPIC_NAME"
    exit "$exit_code"
}

# Set up error handling
trap handle_error ERR

# Validate arguments
if [[ $# -ne 1 ]]; then
    echo "Usage: $0 <epic_name>"
    echo ""
    echo "Creates a GitHub issue for the specified epic."
    echo ""
    echo "Example:"
    echo "  $0 authentication"
    echo ""
    exit 1
fi

# Run main function
main "$@"