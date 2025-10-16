#!/bin/bash
# DateTime Utility Library
# Provides consistent datetime operations across all scripts

set -euo pipefail

# Load dependencies
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/logging-utils.sh"

# Get current datetime in ISO 8601 format (UTC)
get_current_datetime() {
    date -u +"%Y-%m-%dT%H:%M:%SZ"
}

# Get current date only (YYYY-MM-DD)
get_current_date() {
    date -u +"%Y-%m-%d"
}

# Get current timestamp (Unix epoch)
get_current_timestamp() {
    date +%s
}

# Convert ISO datetime to Unix timestamp
datetime_to_timestamp() {
    local iso_datetime="$1"

    log_function_entry "datetime_to_timestamp" "$iso_datetime"

    local timestamp
    if command -v gdate >/dev/null 2>&1; then
        # macOS with GNU date installed
        timestamp=$(gdate -d "$iso_datetime" +%s 2>/dev/null)
    else
        # Linux date or BSD date
        timestamp=$(date -d "$iso_datetime" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$iso_datetime" +%s 2>/dev/null)
    fi

    if [[ -z "$timestamp" ]]; then
        log_error "Failed to parse datetime: $iso_datetime"
        return 1
    fi

    log_function_exit "datetime_to_timestamp"
    echo "$timestamp"
    return 0
}

# Convert Unix timestamp to ISO datetime
timestamp_to_datetime() {
    local timestamp="$1"

    log_function_entry "timestamp_to_datetime" "$timestamp"

    local iso_datetime
    iso_datetime=$(date -u -d "@$timestamp" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -r "$timestamp" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null)

    if [[ -z "$iso_datetime" ]]; then
        log_error "Failed to convert timestamp: $timestamp"
        return 1
    fi

    log_function_exit "timestamp_to_datetime"
    echo "$iso_datetime"
    return 0
}

# Calculate time difference in seconds between two ISO datetimes
datetime_diff_seconds() {
    local datetime1="$1"
    local datetime2="$2"

    log_function_entry "datetime_diff_seconds" "$datetime1" "$datetime2"

    local timestamp1 timestamp2
    timestamp1=$(datetime_to_timestamp "$datetime1") || return 1
    timestamp2=$(datetime_to_timestamp "$datetime2") || return 1

    local diff
    diff=$((timestamp2 - timestamp1))

    log_function_exit "datetime_diff_seconds"
    echo "$diff"
    return 0
}

# Calculate time difference in minutes
datetime_diff_minutes() {
    local datetime1="$1"
    local datetime2="$2"

    local diff_seconds
    diff_seconds=$(datetime_diff_seconds "$datetime1" "$datetime2") || return 1

    local diff_minutes
    diff_minutes=$((diff_seconds / 60))

    echo "$diff_minutes"
    return 0
}

# Calculate time difference in hours
datetime_diff_hours() {
    local datetime1="$1"
    local datetime2="$2"

    local diff_seconds
    diff_seconds=$(datetime_diff_seconds "$datetime1" "$datetime2") || return 1

    local diff_hours
    diff_hours=$((diff_seconds / 3600))

    echo "$diff_hours"
    return 0
}

# Calculate time difference in days
datetime_diff_days() {
    local datetime1="$1"
    local datetime2="$2"

    local diff_seconds
    diff_seconds=$(datetime_diff_seconds "$datetime1" "$datetime2") || return 1

    local diff_days
    diff_days=$((diff_seconds / 86400))

    echo "$diff_days"
    return 0
}

# Check if datetime1 is before datetime2
datetime_is_before() {
    local datetime1="$1"
    local datetime2="$2"

    local diff
    diff=$(datetime_diff_seconds "$datetime1" "$datetime2") || return 1

    [[ "$diff" -gt 0 ]]
}

# Check if datetime1 is after datetime2
datetime_is_after() {
    local datetime1="$1"
    local datetime2="$2"

    local diff
    diff=$(datetime_diff_seconds "$datetime1" "$datetime2") || return 1

    [[ "$diff" -lt 0 ]]
}

# Format time duration in human-readable format
format_duration() {
    local seconds="$1"

    log_function_entry "format_duration" "$seconds"

    if [[ "$seconds" -lt 60 ]]; then
        echo "${seconds}s"
    elif [[ "$seconds" -lt 3600 ]]; then
        local minutes=$((seconds / 60))
        local remaining_seconds=$((seconds % 60))
        if [[ "$remaining_seconds" -eq 0 ]]; then
            echo "${minutes}m"
        else
            echo "${minutes}m ${remaining_seconds}s"
        fi
    elif [[ "$seconds" -lt 86400 ]]; then
        local hours=$((seconds / 3600))
        local remaining_minutes=$(((seconds % 3600) / 60))
        if [[ "$remaining_minutes" -eq 0 ]]; then
            echo "${hours}h"
        else
            echo "${hours}h ${remaining_minutes}m"
        fi
    else
        local days=$((seconds / 86400))
        local remaining_hours=$(((seconds % 86400) / 3600))
        if [[ "$remaining_hours" -eq 0 ]]; then
            echo "${days}d"
        else
            echo "${days}d ${remaining_hours}h"
        fi
    fi

    log_function_exit "format_duration"
}

# Get human-readable time ago (e.g., "2 hours ago")
time_ago() {
    local past_datetime="$1"
    local current_datetime="${2:-$(get_current_datetime)}"

    log_function_entry "time_ago" "$past_datetime" "$current_datetime"

    local diff_seconds
    diff_seconds=$(datetime_diff_seconds "$past_datetime" "$current_datetime") || return 1

    if [[ "$diff_seconds" -lt 0 ]]; then
        echo "in the future"
        return 0
    fi

    local duration
    duration=$(format_duration "$diff_seconds")

    echo "$duration ago"
    log_function_exit "time_ago"
}

# Validate ISO datetime format
validate_datetime() {
    local datetime="$1"

    log_function_entry "validate_datetime" "$datetime"

    # Check basic format: YYYY-MM-DDTHH:MM:SSZ
    if [[ ! "$datetime" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]]; then
        log_error "Invalid datetime format: $datetime (expected: YYYY-MM-DDTHH:MM:SSZ)"
        return 1
    fi

    # Try to parse it to validate
    local timestamp
    timestamp=$(datetime_to_timestamp "$datetime") || return 1

    log_debug "Datetime validation passed: $datetime"
    log_function_exit "validate_datetime"
    return 0
}

# Get datetime for timezone
get_datetime_in_timezone() {
    local timezone="$1"

    log_function_entry "get_datetime_in_timezone" "$timezone"

    local datetime
    if command -v gdate >/dev/null 2>&1; then
        # macOS with GNU date
        datetime=$(TZ="$timezone" gdate +"%Y-%m-%dT%H:%M:%S%z")
    else
        # Linux date
        datetime=$(TZ="$timezone" date +"%Y-%m-%dT%H:%M:%S%z")
    fi

    log_function_exit "get_datetime_in_timezone"
    echo "$datetime"
    return 0
}