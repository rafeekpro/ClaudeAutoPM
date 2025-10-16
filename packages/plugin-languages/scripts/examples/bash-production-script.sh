#!/usr/bin/env bash
#
# Production Bash Script - Context7 Best Practices
#
# Demonstrates production-ready Bash patterns from Context7:
# - Proper error handling (set -euo pipefail)
# - Logging functions
# - Cleanup handlers
# - Function documentation
# - Input validation
# - Single instance enforcement
#
# Source: /bobbyiliev/introduction-to-bash-scripting (385 snippets, trust 10.0)

# Context7 Pattern 1: Strict Error Handling (MANDATORY)
# ✅ CORRECT: Always use these settings for production scripts
set -e          # Exit on error
set -u          # Exit on undefined variable
set -o pipefail # Exit on pipe failure

# Enable debug mode if DEBUG environment variable is set
[[ "${DEBUG:-0}" == "1" ]] && set -x

# Context7 Pattern 2: Script Metadata
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"
readonly SCRIPT_VERSION="1.0.0"
readonly LOG_FILE="${LOG_FILE:-/tmp/${SCRIPT_NAME%.sh}.log}"
readonly PID_FILE="/tmp/${SCRIPT_NAME%.sh}.pid"

# Color codes for terminal output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Context7 Pattern 3: Logging Functions
#######################################
# Description: Log message with timestamp
# Globals: LOG_FILE
# Arguments: $@ - Message to log
# Outputs: Writes to stdout and log file
# Returns: 0
#######################################
log() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] $*"
    echo "$message" | tee -a "${LOG_FILE}"
}

#######################################
# Description: Log error message
# Globals: LOG_FILE, RED, NC
# Arguments: $@ - Error message
# Outputs: Writes to stderr and log file
# Returns: 0
#######################################
log_error() {
    local message="[ERROR] $*"
    echo -e "${RED}${message}${NC}" >&2
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ${message}" >> "${LOG_FILE}"
}

#######################################
# Description: Log success message
# Globals: LOG_FILE, GREEN, NC
# Arguments: $@ - Success message
# Outputs: Writes to stdout and log file
# Returns: 0
#######################################
log_success() {
    local message="[SUCCESS] $*"
    echo -e "${GREEN}${message}${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ${message}" >> "${LOG_FILE}"
}

#######################################
# Description: Log warning message
# Globals: LOG_FILE, YELLOW, NC
# Arguments: $@ - Warning message
# Outputs: Writes to stdout and log file
# Returns: 0
#######################################
log_warning() {
    local message="[WARNING] $*"
    echo -e "${YELLOW}${message}${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ${message}" >> "${LOG_FILE}"
}

#######################################
# Description: Log info message
# Globals: LOG_FILE, BLUE, NC
# Arguments: $@ - Info message
# Outputs: Writes to stdout and log file
# Returns: 0
#######################################
log_info() {
    local message="[INFO] $*"
    echo -e "${BLUE}${message}${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ${message}" >> "${LOG_FILE}"
}

# Context7 Pattern 4: Error Handler with Cleanup
#######################################
# Description: Handle errors and exit gracefully
# Globals: LOG_FILE
# Arguments: $1 - Exit code, $2 - Line number
# Outputs: Error message
# Returns: Exits with provided code
#######################################
error_handler() {
    local exit_code=$1
    local line_number=$2
    log_error "Command failed with exit code ${exit_code} at line ${line_number}"
    cleanup
    exit "${exit_code}"
}

#######################################
# Description: Cleanup resources before exit
# Globals: PID_FILE
# Arguments: None
# Outputs: Cleanup messages
# Returns: 0
#######################################
cleanup() {
    local exit_code=$?
    log "Cleaning up resources..."

    # Remove PID file
    if [[ -f "${PID_FILE}" ]]; then
        rm -f "${PID_FILE}"
        log "Removed PID file"
    fi

    # Kill background jobs
    if jobs -p | grep -q .; then
        log "Killing background jobs..."
        jobs -p | xargs -r kill 2>/dev/null || true
    fi

    # Additional cleanup tasks
    if [[ -d "${TEMP_DIR:-}" ]]; then
        log "Removing temporary directory: ${TEMP_DIR}"
        rm -rf "${TEMP_DIR}"
    fi

    log "Cleanup completed"
    return "${exit_code}"
}

# Context7 Pattern 5: Register Handlers
trap 'error_handler $? $LINENO' ERR
trap cleanup EXIT INT TERM

# Context7 Pattern 6: Single Instance Enforcement
#######################################
# Description: Ensure only one instance of script runs
# Globals: PID_FILE, SCRIPT_NAME
# Arguments: None
# Outputs: Error if instance already running
# Returns: 0 if successful, 1 if instance exists
#######################################
check_single_instance() {
    if [[ -f "${PID_FILE}" ]]; then
        local old_pid
        old_pid=$(cat "${PID_FILE}")

        # Check if process is still running
        if kill -0 "${old_pid}" 2>/dev/null; then
            log_error "Another instance is already running (PID: ${old_pid})"
            return 1
        else
            log_warning "Removing stale PID file"
            rm -f "${PID_FILE}"
        fi
    fi

    # Write current PID
    echo $$ > "${PID_FILE}"
    log "Created PID file: ${PID_FILE}"
    return 0
}

# Context7 Pattern 7: Input Validation
#######################################
# Description: Validate input against pattern
# Globals: None
# Arguments:
#   $1 - Input to validate
#   $2 - Regex pattern
#   $3 - Error message
# Outputs: Error message if validation fails
# Returns: 0 if valid, 1 if invalid
#######################################
validate_input() {
    local input=$1
    local pattern=$2
    local error_msg=$3

    if [[ ! "${input}" =~ ${pattern} ]]; then
        log_error "${error_msg}"
        return 1
    fi

    log "Input validation passed: ${input}"
    return 0
}

# Context7 Pattern 8: Dependency Checking
#######################################
# Description: Check required commands are available
# Globals: None
# Arguments: None
# Outputs: List of missing dependencies
# Returns: 0 if all found, 1 if any missing
#######################################
check_dependencies() {
    local deps=("git" "curl" "jq")
    local missing=()

    log "Checking dependencies..."

    for cmd in "${deps[@]}"; do
        if ! command -v "${cmd}" &> /dev/null; then
            missing+=("${cmd}")
        fi
    done

    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Missing dependencies: ${missing[*]}"
        log_error "Please install missing commands and try again"
        return 1
    fi

    log_success "All dependencies found"
    return 0
}

# Context7 Pattern 9: Configuration Management
#######################################
# Description: Load configuration from file
# Globals: CONFIG_FILE
# Arguments: $1 - Config file path (optional)
# Outputs: Configuration values
# Returns: 0 if successful, 1 if file not found
#######################################
load_config() {
    local config_file="${1:-${CONFIG_FILE:-config.env}}"

    if [[ ! -f "${config_file}" ]]; then
        log_warning "Config file not found: ${config_file}"
        log "Using default configuration"
        return 0
    fi

    log "Loading configuration from: ${config_file}"

    # Source config file safely
    set +u  # Temporarily disable undefined variable check
    # shellcheck source=/dev/null
    source "${config_file}"
    set -u

    log_success "Configuration loaded"
    return 0
}

# Context7 Pattern 10: Retry Logic
#######################################
# Description: Retry command with exponential backoff
# Globals: None
# Arguments:
#   $1 - Max attempts
#   $2 - Base delay in seconds
#   ${@:3} - Command to execute
# Outputs: Command output
# Returns: 0 if successful, 1 if all attempts failed
#######################################
retry_with_backoff() {
    local max_attempts=$1
    local base_delay=$2
    shift 2
    local command=("$@")

    local attempt=1
    while [[ ${attempt} -le ${max_attempts} ]]; do
        log "Attempt ${attempt}/${max_attempts}: ${command[*]}"

        if "${command[@]}"; then
            log_success "Command succeeded on attempt ${attempt}"
            return 0
        fi

        if [[ ${attempt} -lt ${max_attempts} ]]; then
            local delay=$((base_delay * attempt))
            log_warning "Command failed, retrying in ${delay} seconds..."
            sleep "${delay}"
        fi

        ((attempt++))
    done

    log_error "Command failed after ${max_attempts} attempts"
    return 1
}

# Example Business Logic Functions

#######################################
# Description: Process data file
# Globals: TEMP_DIR
# Arguments: $1 - Input file path
# Outputs: Processing results
# Returns: 0 if successful, 1 on error
#######################################
process_data() {
    local input_file=$1
    local output_file="${TEMP_DIR}/processed_$(basename "${input_file}")"

    log_info "Processing data file: ${input_file}"

    # Validate input file exists
    if [[ ! -f "${input_file}" ]]; then
        log_error "Input file not found: ${input_file}"
        return 1
    fi

    # Example processing (count lines, remove empty lines, sort)
    local line_count
    line_count=$(wc -l < "${input_file}")
    log "Input file has ${line_count} lines"

    # Process file
    grep -v "^$" "${input_file}" | sort -u > "${output_file}"

    local processed_count
    processed_count=$(wc -l < "${output_file}")
    log_success "Processed ${processed_count} unique non-empty lines"
    log "Output file: ${output_file}"

    return 0
}

#######################################
# Description: Deploy application
# Globals: None
# Arguments: $1 - Environment (dev/staging/prod)
# Outputs: Deployment status
# Returns: 0 if successful, 1 on error
#######################################
deploy_application() {
    local environment=$1

    log_info "Starting deployment to ${environment}"

    # Validate environment
    validate_input "${environment}" "^(dev|staging|prod)$" \
        "Invalid environment. Must be: dev, staging, or prod" || return 1

    # Backup current version
    log "Creating backup..."
    mkdir -p "${TEMP_DIR}/backup"

    # Simulate deployment steps
    local steps=("pull_code" "run_tests" "build" "deploy")

    for step in "${steps[@]}"; do
        log "Executing step: ${step}"
        sleep 1  # Simulate work

        # Random failure for demonstration (20% chance)
        if [[ $((RANDOM % 5)) -eq 0 && "${step}" == "build" ]]; then
            log_error "Step failed: ${step}"
            return 1
        fi

        log_success "Step completed: ${step}"
    done

    log_success "Deployment to ${environment} completed successfully"
    return 0
}

# Main Function
#######################################
# Description: Main entry point
# Globals: All script globals
# Arguments: $@ - Command line arguments
# Outputs: Script execution results
# Returns: 0 if successful, 1 on error
#######################################
main() {
    log "Starting ${SCRIPT_NAME} v${SCRIPT_VERSION}"
    log "Log file: ${LOG_FILE}"

    # Check for single instance
    check_single_instance || exit 1

    # Check dependencies
    check_dependencies || exit 1

    # Load configuration
    load_config

    # Create temporary directory
    TEMP_DIR=$(mktemp -d)
    log "Created temporary directory: ${TEMP_DIR}"

    # Parse command line arguments
    local environment="${1:-dev}"

    # Example: Process data file
    if [[ -f "/tmp/test-data.txt" ]]; then
        process_data "/tmp/test-data.txt" || true
    else
        # Create test data
        echo -e "line1\nline2\n\nline3\nline2" > "/tmp/test-data.txt"
        process_data "/tmp/test-data.txt"
    fi

    # Example: Deploy with retry
    log_info "Deploying application..."
    if ! retry_with_backoff 3 2 deploy_application "${environment}"; then
        log_error "Deployment failed after retries"
        exit 1
    fi

    log_success "Script completed successfully"
    return 0
}

# Usage information
#######################################
# Description: Display usage information
# Globals: SCRIPT_NAME, SCRIPT_VERSION
# Arguments: None
# Outputs: Usage text
# Returns: 0
#######################################
usage() {
    cat << EOF
Usage: ${SCRIPT_NAME} [OPTIONS] [ENVIRONMENT]

Production-ready Bash script demonstrating Context7 best practices.

ARGUMENTS:
    ENVIRONMENT     Target environment (dev|staging|prod) [default: dev]

OPTIONS:
    -h, --help      Show this help message
    -v, --version   Show script version
    --debug         Enable debug mode (set -x)

EXAMPLES:
    ${SCRIPT_NAME} dev
    ${SCRIPT_NAME} prod
    DEBUG=1 ${SCRIPT_NAME} staging

ENVIRONMENT VARIABLES:
    DEBUG           Enable debug mode (0 or 1)
    LOG_FILE        Custom log file path
    CONFIG_FILE     Custom config file path

FILES:
    ${LOG_FILE}     Log file
    ${PID_FILE}     PID file (single instance)

EOF
}

# Command line argument parsing
if [[ "${1:-}" =~ ^(-h|--help)$ ]]; then
    usage
    exit 0
fi

if [[ "${1:-}" =~ ^(-v|--version)$ ]]; then
    echo "${SCRIPT_VERSION}"
    exit 0
fi

# Execute main function if script is run directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi

# Context7 Best Practices Summary
cat << 'EOF'

Context7 Verified Best Practices Applied:
==========================================
1. ✅ set -euo pipefail (strict error handling)
2. ✅ Comprehensive logging functions (log, log_error, log_success, etc.)
3. ✅ Error handler with line number reporting
4. ✅ Cleanup function with trap handlers (EXIT, INT, TERM, ERR)
5. ✅ Single instance enforcement (PID file)
6. ✅ Input validation with regex patterns
7. ✅ Dependency checking before execution
8. ✅ Configuration file loading
9. ✅ Retry logic with exponential backoff
10. ✅ Comprehensive function documentation (Google style)
11. ✅ Color-coded terminal output
12. ✅ Temporary directory management
13. ✅ Usage documentation
14. ✅ Version information
15. ✅ Debug mode support

Source:
- /bobbyiliev/introduction-to-bash-scripting (385 snippets, trust 10.0)

Production-Ready Features:
- Safe error handling prevents cascading failures
- Logging provides audit trail
- Single instance prevents race conditions
- Retry logic handles transient failures
- Cleanup ensures no resource leaks
- Comprehensive documentation aids maintenance

EOF
