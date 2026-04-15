#!/usr/bin/env bash
#
# sync-to-obsidian.sh — Unidirectional sync: project -> Obsidian vault
#
# Usage:
#   sync-to-obsidian.sh [OPTIONS]
#
# Options:
#   --check        Dry-run mode (show what would be synced)
#   --watch        Continuous sync on file changes
#   --safe-mode    Omit --delete from rsync (never remove vault files)
#   --project-root DIR   Override project root (default: auto-detect)
#   -h, --help     Show this help message
#
# Configuration:
#   Reads vault settings from .claude/config.json:
#     { "obsidian": { "vault_path": "/path", "vault_prefix": "name" } }

set -euo pipefail

# ─── Constants ───────────────────────────────────────────────────────

readonly SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"
readonly SCRIPT_VERSION="1.0.0"

readonly RSYNC_EXCLUDES=(
    ".git/"
    "node_modules/"
    "*.png"
    "*.jpg"
    "*.gif"
    "*.mp4"
    "__pycache__/"
    ".env"
)

# Directories under .claude/ that get synced (mapped to visible vault paths)
readonly CLAUDE_SYNC_DIRS=(
    "agents"
    "commands"
    "rules"
    "epics"
    "prds"
)

# ─── Globals (set by parse_args / parse_config) ─────────────────────

MODE_CHECK=false
MODE_WATCH=false
MODE_SAFE=false
PROJECT_ROOT=""
VAULT_PATH=""
VAULT_PREFIX=""
WATCHER_PID=""

# ─── Output helpers ──────────────────────────────────────────────────

sync_log()  { echo "[sync]  $*"; }
watch_log() { echo "[watch] $*"; }
err()       { echo "[error] $*" >&2; }

# ─── Usage / help ────────────────────────────────────────────────────

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} [OPTIONS]

Sync project markdown to an Obsidian vault (unidirectional: project -> vault).

Options:
  --check          Dry-run: show what would be synced (rsync --dry-run)
  --watch          Continuous sync on file changes
  --safe-mode      Omit --delete from rsync (never remove vault files)
  --project-root DIR  Override project root directory
  -h, --help       Show this help message
  -v, --version    Show version

Modes can be combined: --watch --safe-mode

Configuration (.claude/config.json):
  {
    "obsidian": {
      "vault_path": "/path/to/vault",
      "vault_prefix": "my-project",
      "watch": false
    }
  }
EOF
}

# ─── Argument parsing ────────────────────────────────────────────────

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --check)
                MODE_CHECK=true
                shift
                ;;
            --watch)
                MODE_WATCH=true
                shift
                ;;
            --safe-mode)
                MODE_SAFE=true
                shift
                ;;
            --project-root)
                if [[ -z "${2:-}" ]]; then
                    err "--project-root requires a directory argument"
                    exit 1
                fi
                PROJECT_ROOT="$2"
                shift 2
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            -v|--version)
                echo "${SCRIPT_NAME} ${SCRIPT_VERSION}"
                exit 0
                ;;
            --source-only)
                # Used by test harness to source functions without running
                return 1
                ;;
            *)
                err "Unknown option: $1"
                echo ""
                usage
                exit 1
                ;;
        esac
    done
}

# ─── Project root detection ─────────────────────────────────────────

find_project_root() {
    if [[ -n "${PROJECT_ROOT}" ]]; then
        echo "${PROJECT_ROOT}"
        return 0
    fi

    # Walk up from script location looking for .claude/config.json
    local dir
    dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    while [[ "${dir}" != "/" ]]; do
        if [[ -f "${dir}/.claude/config.json" ]]; then
            echo "${dir}"
            return 0
        fi
        dir="$(dirname "${dir}")"
    done

    err "Could not find project root (no .claude/config.json found)"
    exit 1
}

# ─── JSON parsing (node or python3, no jq dependency) ────────────────

json_extract() {
    local file="$1"
    local key_path="$2"  # e.g. "obsidian.vault_path"

    # Try node first, then python3
    if command -v node &>/dev/null; then
        node -e "
            const fs = require('fs');
            try {
                const cfg = JSON.parse(fs.readFileSync('${file}', 'utf8'));
                const keys = '${key_path}'.split('.');
                let val = cfg;
                for (const k of keys) { val = val && val[k]; }
                if (val !== undefined && val !== null) process.stdout.write(String(val));
                else process.exit(1);
            } catch(e) { process.exit(1); }
        " 2>/dev/null
    elif command -v python3 &>/dev/null; then
        python3 -c "
import json, sys
try:
    cfg = json.load(open('${file}'))
    keys = '${key_path}'.split('.')
    val = cfg
    for k in keys:
        val = val[k]
    if val is not None:
        sys.stdout.write(str(val))
    else:
        sys.exit(1)
except Exception:
    sys.exit(1)
" 2>/dev/null
    else
        err "Neither node nor python3 found. One is required to parse config."
        exit 1
    fi
}

# ─── Config loading ─────────────────────────────────────────────────

parse_config() {
    local root="$1"
    local config_file="${root}/.claude/config.json"

    if [[ ! -f "${config_file}" ]]; then
        err "Config not found: ${config_file}"
        err "Run the Obsidian setup wizard or add obsidian settings to .claude/config.json"
        exit 1
    fi

    VAULT_PATH="$(json_extract "${config_file}" "obsidian.vault_path" || true)"
    if [[ -z "${VAULT_PATH}" ]]; then
        err "obsidian.vault_path not set in ${config_file}"
        err "Add: { \"obsidian\": { \"vault_path\": \"/path/to/vault\" } }"
        exit 1
    fi

    VAULT_PREFIX="$(json_extract "${config_file}" "obsidian.vault_prefix" || true)"
    if [[ -z "${VAULT_PREFIX}" ]]; then
        # Default to directory name
        VAULT_PREFIX="$(basename "${root}")"
    fi

    # Check watch config (can be overridden by --watch flag)
    if [[ "${MODE_WATCH}" == "false" ]]; then
        local cfg_watch
        cfg_watch="$(json_extract "${config_file}" "obsidian.watch" || echo "false")"
        if [[ "${cfg_watch}" == "true" ]]; then
            MODE_WATCH=true
        fi
    fi

    # Validate vault path exists
    if [[ ! -d "${VAULT_PATH}" ]]; then
        err "Vault path does not exist: ${VAULT_PATH}"
        err "Create it or update obsidian.vault_path in .claude/config.json"
        exit 1
    fi

    # Validate vault path is writable
    if [[ ! -w "${VAULT_PATH}" ]]; then
        err "Vault path is not writable: ${VAULT_PATH}"
        exit 1
    fi
}

# ─── OS detection ────────────────────────────────────────────────────

detect_os() {
    local uname_out
    uname_out="$(uname -s)"
    case "${uname_out}" in
        Linux)
            if [[ -f /proc/version ]] && grep -qi microsoft /proc/version 2>/dev/null; then
                echo "wsl"
            else
                echo "linux"
            fi
            ;;
        Darwin)
            echo "darwin"
            ;;
        *)
            echo "linux"  # best-effort fallback
            ;;
    esac
}

# ─── Dependency checks ──────────────────────────────────────────────

check_rsync() {
    if ! command -v rsync &>/dev/null; then
        err "rsync is required but not found"
        err "Install: sudo apt install rsync  (Linux)  /  brew install rsync  (macOS)"
        exit 1
    fi
}

check_watch_tool() {
    local os="$1"
    case "${os}" in
        linux|wsl)
            if ! command -v inotifywait &>/dev/null; then
                err "inotifywait is required for --watch mode on Linux/WSL"
                err "Install: sudo apt install inotify-tools"
                exit 1
            fi
            ;;
        darwin)
            if ! command -v fswatch &>/dev/null; then
                err "fswatch is required for --watch mode on macOS"
                err "Install: brew install fswatch"
                exit 1
            fi
            ;;
    esac
}

# ─── Build rsync arguments ──────────────────────────────────────────

build_rsync_args() {
    local -a args=( -av )

    # Excludes must come before the include/exclude filter chain
    for excl in "${RSYNC_EXCLUDES[@]}"; do
        args+=( --exclude="${excl}" )
    done

    # Include only markdown files (and directories for traversal)
    args+=( --include="*/" --include="*.md" --exclude="*" )

    if [[ "${MODE_CHECK}" == "true" ]]; then
        args+=( --dry-run )
    fi

    if [[ "${MODE_SAFE}" == "false" ]]; then
        args+=( --delete )
    fi

    echo "${args[@]}"
}

# ─── Sync a single source dir to vault ───────────────────────────────

sync_dir() {
    local src="$1"
    local dest="$2"
    local label="$3"

    if [[ ! -d "${src}" ]]; then
        return 0  # Skip non-existent optional dirs silently
    fi

    sync_log "Syncing ${label} -> ${dest}"

    # Ensure trailing slashes for rsync
    local src_slash="${src%/}/"
    local dest_slash="${dest%/}/"

    # Only create destination in non-dry-run mode
    if [[ "${MODE_CHECK}" == "false" ]]; then
        mkdir -p "${dest_slash}" 2>/dev/null || true
    fi

    local -a rsync_args
    read -ra rsync_args <<< "$(build_rsync_args)"

    rsync "${rsync_args[@]}" "${src_slash}" "${dest_slash}" 2>&1 | \
        grep -v "^$" | grep -v "^sending" | grep -v "^sent " | \
        grep -v "^total " | grep -v "^$" || true
}

# ─── Sync root-level markdown files ─────────────────────────────────

sync_root_markdown() {
    local root="$1"
    local dest="$2"

    # Collect root .md files
    local -a md_files=()
    while IFS= read -r -d '' f; do
        md_files+=("$f")
    done < <(find "${root}" -maxdepth 1 -name "*.md" -type f -print0 2>/dev/null)

    if [[ ${#md_files[@]} -eq 0 ]]; then
        return 0
    fi

    sync_log "Syncing root *.md -> ${dest}"

    if [[ "${MODE_CHECK}" == "true" ]]; then
        for f in "${md_files[@]}"; do
            echo "  $(basename "$f") (dry-run)"
        done
        return 0
    fi

    mkdir -p "${dest}" 2>/dev/null || true
    for f in "${md_files[@]}"; do
        cp -u "$f" "${dest}/" 2>/dev/null || cp "$f" "${dest}/"
    done
}

# ─── Count synced files ─────────────────────────────────────────────

count_vault_files() {
    local dest="$1"
    if [[ -d "${dest}" ]]; then
        find "${dest}" -type f -name "*.md" 2>/dev/null | wc -l | tr -d ' '
    else
        echo "0"
    fi
}

# ─── Main sync operation ────────────────────────────────────────────

run_sync() {
    local root="$1"
    local vault_dest="${VAULT_PATH}/${VAULT_PREFIX}"

    if [[ "${MODE_CHECK}" == "true" ]]; then
        sync_log "Dry-run mode: showing what would be synced"
    fi
    if [[ "${MODE_SAFE}" == "true" ]]; then
        sync_log "Safe mode: will not delete files in vault"
    fi

    sync_log "Starting sync: ${root} -> ${vault_dest}"

    # Sync .claude/* subdirectories to visible vault paths
    for dir_name in "${CLAUDE_SYNC_DIRS[@]}"; do
        local src="${root}/.claude/${dir_name}"
        local dest="${vault_dest}/${dir_name}"
        sync_dir "${src}" "${dest}" ".claude/${dir_name}/"
    done

    # Sync issues/ if it exists
    sync_dir "${root}/issues" "${vault_dest}/issues" "issues/"

    # Sync root markdown files
    sync_root_markdown "${root}" "${vault_dest}"

    local file_count
    if [[ "${MODE_CHECK}" == "false" ]]; then
        file_count="$(count_vault_files "${vault_dest}")"
        sync_log "Done: ${file_count} files synced"
    else
        sync_log "Done: dry-run complete (no files changed)"
    fi
}

# ─── Watch mode ──────────────────────────────────────────────────────

start_watch() {
    local root="$1"
    local os
    os="$(detect_os)"

    check_watch_tool "${os}"

    watch_log "Watching for changes... (Ctrl+C to stop)"

    case "${os}" in
        linux|wsl)
            watch_inotify "${root}"
            ;;
        darwin)
            watch_fswatch "${root}"
            ;;
    esac
}

watch_inotify() {
    local root="$1"
    local -a watch_paths=()

    # Build list of directories to watch
    for dir_name in "${CLAUDE_SYNC_DIRS[@]}"; do
        local d="${root}/.claude/${dir_name}"
        [[ -d "${d}" ]] && watch_paths+=("${d}")
    done
    [[ -d "${root}/issues" ]] && watch_paths+=("${root}/issues")
    watch_paths+=("${root}")  # root .md files

    while true; do
        inotifywait -r -e modify,create,delete,move \
            --include '\.md$' \
            "${watch_paths[@]}" 2>/dev/null || true

        watch_log "Change detected, syncing..."
        run_sync "${root}" || true
    done
}

watch_fswatch() {
    local root="$1"
    local -a watch_paths=()

    for dir_name in "${CLAUDE_SYNC_DIRS[@]}"; do
        local d="${root}/.claude/${dir_name}"
        [[ -d "${d}" ]] && watch_paths+=("${d}")
    done
    [[ -d "${root}/issues" ]] && watch_paths+=("${root}/issues")
    watch_paths+=("${root}")

    fswatch --include='\.md$' --exclude='.*' -r "${watch_paths[@]}" | \
    while read -r _event; do
        watch_log "Change detected, syncing..."
        run_sync "${root}" || true
    done
}

# ─── Signal handling / cleanup ───────────────────────────────────────

cleanup() {
    if [[ -n "${WATCHER_PID}" ]] && kill -0 "${WATCHER_PID}" 2>/dev/null; then
        kill "${WATCHER_PID}" 2>/dev/null || true
        wait "${WATCHER_PID}" 2>/dev/null || true
    fi
    # Clean up any temp files
    rm -f /tmp/sync-to-obsidian-*.tmp 2>/dev/null || true
}

trap cleanup EXIT INT TERM

# ─── Entry point ─────────────────────────────────────────────────────

main() {
    parse_args "$@" || return 0  # --source-only returns 1

    check_rsync

    local root
    root="$(find_project_root)"

    parse_config "${root}"

    # Initial sync
    run_sync "${root}"

    # Enter watch mode if requested
    if [[ "${MODE_WATCH}" == "true" ]]; then
        start_watch "${root}"
    fi
}

# Run main only when executed directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
