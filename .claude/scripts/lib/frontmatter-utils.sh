#!/bin/bash
# Frontmatter Utility Library
# Provides functions for YAML frontmatter manipulation in markdown files

set -euo pipefail

# Load dependencies
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/logging-utils.sh"
source "${SCRIPT_DIR}/datetime-utils.sh"

# Update or add a field in frontmatter
update_frontmatter_field() {
    local file_path="$1"
    local field_name="$2"
    local field_value="$3"

    log_function_entry "update_frontmatter_field" "$file_path" "$field_name" "$field_value"

    if [[ ! -f "$file_path" ]]; then
        log_error "File not found: $file_path"
        return 1
    fi

    # Create backup
    cp "$file_path" "${file_path}.bak"

    # Check if field exists
    if grep -q "^${field_name}:" "$file_path"; then
        # Update existing field
        sed -i.tmp "/^${field_name}:/c\\${field_name}: ${field_value}" "$file_path"
        rm -f "${file_path}.tmp"
        log_debug "Updated existing field: $field_name"
    else
        # Add new field after the first line of frontmatter (after opening ---)
        awk -v field="${field_name}: ${field_value}" '
            /^---$/ && NR==1 { print; print field; next }
            { print }
        ' "$file_path" > "${file_path}.tmp" && mv "${file_path}.tmp" "$file_path"
        log_debug "Added new field: $field_name"
    fi

    # Remove backup if operation successful
    rm -f "${file_path}.bak"

    log_function_exit "update_frontmatter_field"
    return 0
}

# Get a field value from frontmatter
get_frontmatter_field() {
    local file_path="$1"
    local field_name="$2"

    log_function_entry "get_frontmatter_field" "$file_path" "$field_name"

    if [[ ! -f "$file_path" ]]; then
        log_error "File not found: $file_path"
        log_function_exit "get_frontmatter_field" 1
        return 1
    fi

    local field_value
    field_value=$(grep "^${field_name}:" "$file_path" | sed "s/^${field_name}: *//" | head -1)

    log_debug "Retrieved field $field_name: '$field_value'"
    log_function_exit "get_frontmatter_field"

    echo "$field_value"
    return 0
}

# Strip frontmatter from file and output content only
strip_frontmatter() {
    local input_file="$1"
    local output_file="$2"

    log_function_entry "strip_frontmatter" "$input_file" "$output_file"

    if [[ ! -f "$input_file" ]]; then
        log_error "Input file not found: $input_file"
        return 1
    fi

    # Remove frontmatter (everything between first two --- lines)
    sed '1,/^---$/d; 1,/^---$/d' "$input_file" > "$output_file"

    log_debug "Stripped frontmatter from $input_file to $output_file"
    log_function_exit "strip_frontmatter"
    return 0
}

# Update multiple frontmatter fields with current timestamp
update_frontmatter_with_timestamp() {
    local file_path="$1"
    shift
    local current_timestamp
    current_timestamp=$(get_current_datetime)

    log_function_entry "update_frontmatter_with_timestamp" "$file_path" "$*"

    # Update each field=value pair provided
    while [[ $# -gt 0 ]]; do
        local field_assignment="$1"
        local field_name="${field_assignment%%=*}"
        local field_value="${field_assignment#*=}"

        # Special handling for timestamp fields
        if [[ "$field_value" == "NOW" ]]; then
            field_value="$current_timestamp"
        fi

        update_frontmatter_field "$file_path" "$field_name" "$field_value"
        shift
    done

    # Always update the 'updated' field with current timestamp
    update_frontmatter_field "$file_path" "updated" "$current_timestamp"

    log_function_exit "update_frontmatter_with_timestamp"
    return 0
}

# Validate frontmatter structure
validate_frontmatter() {
    local file_path="$1"

    log_function_entry "validate_frontmatter" "$file_path"

    if [[ ! -f "$file_path" ]]; then
        log_error "File not found: $file_path"
        return 1
    fi

    # Check if file starts with frontmatter
    if ! head -1 "$file_path" | grep -q "^---$"; then
        log_error "File does not start with frontmatter: $file_path"
        return 1
    fi

    # Check if frontmatter is properly closed
    if ! sed -n '2,/^---$/p' "$file_path" | tail -1 | grep -q "^---$"; then
        log_error "Frontmatter not properly closed: $file_path"
        return 1
    fi

    log_debug "Frontmatter validation passed: $file_path"
    log_function_exit "validate_frontmatter"
    return 0
}

# Extract frontmatter only (without content)
extract_frontmatter() {
    local input_file="$1"
    local output_file="$2"

    log_function_entry "extract_frontmatter" "$input_file" "$output_file"

    if [[ ! -f "$input_file" ]]; then
        log_error "Input file not found: $input_file"
        return 1
    fi

    # Extract everything from first --- to second ---
    sed -n '1,/^---$/p; /^---$/q' "$input_file" > "$output_file"

    log_debug "Extracted frontmatter from $input_file to $output_file"
    log_function_exit "extract_frontmatter"
    return 0
}

# Get all frontmatter fields as key=value pairs
get_all_frontmatter_fields() {
    local file_path="$1"

    log_function_entry "get_all_frontmatter_fields" "$file_path"

    if [[ ! -f "$file_path" ]]; then
        log_error "File not found: $file_path"
        return 1
    fi

    # Extract frontmatter and parse key-value pairs
    sed -n '2,/^---$/p' "$file_path" | sed '/^---$/d' | grep -E "^[^:]+:" | while IFS=': ' read -r key value; do
        echo "${key}=${value}"
    done

    log_function_exit "get_all_frontmatter_fields"
    return 0
}

# Calculate completion percentage for epic based on task statuses
calculate_epic_progress() {
    local epic_dir="$1"

    log_function_entry "calculate_epic_progress" "$epic_dir"

    if [[ ! -d "$epic_dir" ]]; then
        log_error "Epic directory not found: $epic_dir"
        return 1
    fi

    local total_tasks=0
    local completed_tasks=0

    # Count all task files (numbered .md files)
    for task_file in "$epic_dir"/[0-9]*.md; do
        [[ -f "$task_file" ]] || continue
        total_tasks=$((total_tasks + 1))

        # Check if task is completed
        local status
        status=$(get_frontmatter_field "$task_file" "status" 2>/dev/null || echo "open")
        if [[ "$status" == "closed" || "$status" == "completed" ]]; then
            completed_tasks=$((completed_tasks + 1))
        fi
    done

    if [[ "$total_tasks" -eq 0 ]]; then
        echo "0"
        log_function_exit "calculate_epic_progress"
        return 0
    fi

    # Calculate percentage
    local progress
    progress=$(( (completed_tasks * 100) / total_tasks ))

    log_debug "Epic progress: $completed_tasks/$total_tasks = $progress%"
    log_function_exit "calculate_epic_progress"

    echo "$progress"
    return 0
}

# Update epic progress based on task completion
update_epic_progress() {
    local epic_file="$1"
    local epic_dir="$(dirname "$epic_file")"

    log_function_entry "update_epic_progress" "$epic_file"

    local current_progress
    current_progress=$(calculate_epic_progress "$epic_dir")

    # Update epic frontmatter with calculated progress
    update_frontmatter_field "$epic_file" "progress" "${current_progress}%"

    # Update status based on progress
    if [[ "$current_progress" -eq 100 ]]; then
        update_frontmatter_field "$epic_file" "status" "completed"
    elif [[ "$current_progress" -gt 0 ]]; then
        update_frontmatter_field "$epic_file" "status" "in-progress"
    fi

    log_success "Updated epic progress to ${current_progress}%"
    log_function_exit "update_epic_progress"
    return 0
}