#!/bin/bash
# Logging Utility Library
# Provides consistent logging across all scripts

set -euo pipefail

# Colors for output (only define if not already defined)
if [[ -z "${RED:-}" ]]; then
    readonly RED='\033[0;31m'
    readonly GREEN='\033[0;32m'
    readonly YELLOW='\033[1;33m'
    readonly BLUE='\033[0;34m'
    readonly PURPLE='\033[0;35m'
    readonly CYAN='\033[0;36m'
    readonly WHITE='\033[1;37m'
    readonly NC='\033[0m' # No Color
fi

# Log levels (only define if not already defined)
if [[ -z "${LOG_LEVEL_DEBUG:-}" ]]; then
    readonly LOG_LEVEL_DEBUG=0
    readonly LOG_LEVEL_INFO=1
    readonly LOG_LEVEL_WARNING=2
    readonly LOG_LEVEL_ERROR=3
    readonly LOG_LEVEL_SUCCESS=4
fi

# Default log level (can be overridden by AUTOPM_LOG_LEVEL env var)
LOG_LEVEL=${AUTOPM_LOG_LEVEL:-$LOG_LEVEL_INFO}

# Get current timestamp in ISO format
get_timestamp() {
    date -u +"%Y-%m-%dT%H:%M:%SZ"
}

# Generic log function
_log() {
    local level="$1"
    local color="$2"
    local prefix="$3"
    local message="$4"

    if [[ "$level" -ge "$LOG_LEVEL" ]]; then
        local timestamp
        timestamp=$(get_timestamp)

        if [[ -t 1 ]]; then
            # Terminal output - use colors
            echo -e "${color}[${timestamp}] ${prefix}${NC} ${message}" >&2
        else
            # Non-terminal output - no colors
            echo "[${timestamp}] ${prefix} ${message}" >&2
        fi
    fi
}

# Log debug message
log_debug() {
    _log "$LOG_LEVEL_DEBUG" "$CYAN" "DEBUG" "$*"
}

# Log info message
log_info() {
    _log "$LOG_LEVEL_INFO" "$BLUE" "INFO " "$*"
}

# Log warning message
log_warning() {
    _log "$LOG_LEVEL_WARNING" "$YELLOW" "WARN " "$*"
}

# Log error message
log_error() {
    _log "$LOG_LEVEL_ERROR" "$RED" "ERROR" "$*"
}

# Log success message
log_success() {
    _log "$LOG_LEVEL_SUCCESS" "$GREEN" "OK   " "$*"
}

# Log function entry (for debugging)
log_function_entry() {
    local function_name="$1"
    shift
    log_debug "ENTER: ${function_name}($*)"
}

# Log function exit (for debugging)
log_function_exit() {
    local function_name="$1"
    local exit_code="${2:-0}"
    log_debug "EXIT:  ${function_name} (code: ${exit_code})"
}

# Progress indicator for long operations
show_progress() {
    local message="$1"
    local delay="${2:-0.1}"

    echo -n "$message"
    while true; do
        for char in '|' '/' '-' '\'; do
            echo -ne "\r$message $char"
            sleep "$delay"
        done
    done
}

# Stop progress indicator
stop_progress() {
    echo -e "\r$1 ✓"
}

# Print separator line
print_separator() {
    local char="${1:--}"
    local length="${2:-50}"

    printf "%*s\n" "$length" | tr ' ' "$char"
}

# Print section header
print_section() {
    local title="$1"
    local color="${2:-$WHITE}"

    echo
    print_separator "="
    echo -e "${color}${title}${NC}"
    print_separator "="
    echo
}

# Print banner with script name
print_banner() {
    local script_name="$1"
    local version="${2:-}"

    print_section "🚀 ClaudeAutoPM - ${script_name}" "$CYAN"

    if [[ -n "$version" ]]; then
        echo -e "${BLUE}Version: ${version}${NC}"
        echo
    fi
}

# Error handling wrapper
with_error_handling() {
    local operation="$1"
    shift

    log_info "Starting: $operation"

    if "$@"; then
        log_success "Completed: $operation"
        return 0
    else
        local exit_code=$?
        log_error "Failed: $operation (exit code: $exit_code)"
        return $exit_code
    fi
}

# Confirmation prompt
confirm() {
    local message="$1"
    local default="${2:-n}"

    local prompt="$message"
    if [[ "$default" == "y" ]]; then
        prompt="$prompt [Y/n]: "
    else
        prompt="$prompt [y/N]: "
    fi

    echo -n "$prompt"
    read -r response

    case "$response" in
        [Yy]|[Yy][Ee][Ss])
            return 0
            ;;
        [Nn]|[Nn][Oo])
            return 1
            ;;
        "")
            if [[ "$default" == "y" ]]; then
                return 0
            else
                return 1
            fi
            ;;
        *)
            echo "Please answer yes or no."
            confirm "$message" "$default"
            ;;
    esac
}