#!/bin/bash
# GitHub Operations Utility Library
# Provides reusable functions for GitHub CLI operations

set -euo pipefail

# Load dependencies
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/logging-utils.sh"

# Check if GitHub CLI is authenticated
check_gh_auth() {
    log_debug "Checking GitHub CLI authentication"

    if ! command -v gh >/dev/null 2>&1; then
        log_error "GitHub CLI (gh) is not installed"
        echo "❌ GitHub CLI not found. Install: https://cli.github.com/"
        exit 1
    fi

    if ! gh auth status >/dev/null 2>&1; then
        log_error "GitHub CLI not authenticated"
        echo "❌ GitHub CLI not authenticated. Run: gh auth login"
        exit 1
    fi

    log_debug "GitHub CLI authentication verified"
    return 0
}

# Check repository protection against template repos
check_repo_protection() {
    log_debug "Checking repository protection"

    local remote_url
    remote_url=$(git remote get-url origin 2>/dev/null || echo "")

    if [[ "$remote_url" == *"rlagowski/autopm"* ]] || [[ "$remote_url" == *"rafeekpro/ClaudeAutoPM"* ]]; then
        log_error "Attempting to sync with template repository: $remote_url"
        echo "❌ ERROR: Cannot sync to AutoPM template repository!"
        echo ""
        echo "This repository is a template for others to use."
        echo "You should NOT create issues or PRs here."
        echo ""
        echo "To fix this:"
        echo "1. Fork this repository to your own GitHub account"
        echo "2. Update your remote origin:"
        echo "   git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
        echo ""
        echo "Current remote: $remote_url"
        exit 1
    fi

    if [[ -z "$remote_url" ]]; then
        log_warning "No remote origin found"
        echo "⚠️ No remote origin configured. This may be a local-only repository."
    fi

    log_debug "Repository protection check passed"
    return 0
}

# Create GitHub issue with proper error handling
create_github_issue() {
    local title="$1"
    local body_file="$2"
    local labels="$3"

    log_info "Creating GitHub issue: $title"

    # Validate inputs
    if [[ -z "$title" ]]; then
        log_error "Issue title cannot be empty"
        return 1
    fi

    if [[ ! -f "$body_file" ]]; then
        log_error "Issue body file not found: $body_file"
        return 1
    fi

    # Check authentication
    check_gh_auth

    # Create issue
    local issue_number
    if ! issue_output=$(gh issue create \
        --title "$title" \
        --body-file "$body_file" \
        --label "$labels" \
        --json number 2>/dev/null); then
        log_error "Failed to create GitHub issue"
        return 1
    fi

    # Extract just the number from JSON output
    local issue_number
    issue_number=$(echo "$issue_output" | grep -o '"number":[0-9]*' | cut -d: -f2)

    log_success "Created GitHub issue #$issue_number"
    echo "$issue_number"
}

# Create GitHub sub-issue (if gh-sub-issue extension available)
create_github_subissue() {
    local parent_issue="$1"
    local title="$2"
    local body_file="$3"
    local labels="$4"

    log_info "Creating GitHub sub-issue under #$parent_issue: $title"

    # Check if gh-sub-issue extension is available
    if gh extension list | grep -q "yahsan2/gh-sub-issue"; then
        local issue_number
        if ! issue_number=$(gh sub-issue create \
            --parent "$parent_issue" \
            --title "$title" \
            --body-file "$body_file" \
            --label "$labels" \
            --json number -q .number 2>/dev/null); then
            log_error "Failed to create GitHub sub-issue"
            return 1
        fi

        log_success "Created GitHub sub-issue #$issue_number"
        echo "$issue_number"
    else
        log_debug "gh-sub-issue extension not available, using regular issue"
        # Fallback to regular issue creation
        create_github_issue "$title" "$body_file" "$labels"
    fi
}

# Post comment to GitHub issue
post_github_comment() {
    local issue_number="$1"
    local comment_file="$2"

    log_info "Posting comment to GitHub issue #$issue_number"

    # Validate inputs
    if [[ -z "$issue_number" ]] || [[ "$issue_number" =~ ^[0-9]+$ ]]; then
        if [[ -z "$issue_number" ]]; then
            log_error "Issue number cannot be empty"
            return 1
        fi
    fi

    if [[ ! -f "$comment_file" ]]; then
        log_error "Comment file not found: $comment_file"
        return 1
    fi

    # Check file size (GitHub limit: 65,536 characters)
    local file_size
    file_size=$(wc -c < "$comment_file")
    if [[ "$file_size" -gt 65536 ]]; then
        log_warning "Comment file exceeds GitHub limit (${file_size}/65536 chars)"
        echo "⚠️ Comment truncated due to size. Full details in local files."
        # Truncate file
        head -c 65000 "$comment_file" > "${comment_file}.truncated"
        echo -e "\n\n---\n*Comment truncated due to size limit*" >> "${comment_file}.truncated"
        comment_file="${comment_file}.truncated"
    fi

    # Check authentication and post comment
    check_gh_auth

    if ! gh issue comment "$issue_number" --body-file "$comment_file" >/dev/null 2>&1; then
        log_error "Failed to post comment to issue #$issue_number"
        return 1
    fi

    log_success "Posted comment to GitHub issue #$issue_number"
    return 0
}

# Get repository information
get_repo_info() {
    check_gh_auth

    local repo_info
    if ! repo_info=$(gh repo view --json nameWithOwner,url -q '{nameWithOwner: .nameWithOwner, url: .url}' 2>/dev/null); then
        log_error "Failed to get repository information"
        return 1
    fi

    echo "$repo_info"
}

# Check if issue exists and get its state
check_issue_exists() {
    local issue_number="$1"

    log_debug "Checking if issue #$issue_number exists"

    check_gh_auth

    local issue_state
    if ! issue_state=$(gh issue view "$issue_number" --json state -q .state 2>/dev/null); then
        log_debug "Issue #$issue_number not found"
        return 1
    fi

    log_debug "Issue #$issue_number exists with state: $issue_state"
    echo "$issue_state"
    return 0
}

# Utility function to validate issue number format
validate_issue_number() {
    local issue_number="$1"

    if [[ ! "$issue_number" =~ ^[0-9]+$ ]]; then
        log_error "Invalid issue number format: $issue_number"
        return 1
    fi

    return 0
}