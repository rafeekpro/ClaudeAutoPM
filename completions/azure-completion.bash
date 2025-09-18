#!/bin/bash
# Azure DevOps CLI Bash Completion
# Installation: source this file in your .bashrc or .bash_profile

_azure_completion() {
    local cur prev commands
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"

    # Main commands
    commands="active-work blocked daily dashboard feature-list feature-show feature-status help next-task search setup sprint-report sync us-list us-status validate"

    # Sub-command options
    case "${prev}" in
        sync|sync.sh)
            COMPREPLY=( $(compgen -W "--quick --full" -- ${cur}) )
            return 0
            ;;

        us-list|us-list.sh)
            COMPREPLY=( $(compgen -W "--sprint=current --sprint= --status=active --status=new --status=closed --assigned-to=me --assigned-to=" -- ${cur}) )
            return 0
            ;;

        us-status|us-status.sh)
            # Suggest work item IDs from cache if available
            if [ -d ".claude/azure/cache/stories" ]; then
                local story_ids=$(ls .claude/azure/cache/stories/*.json 2>/dev/null | xargs -n1 basename | sed 's/.json//')
                COMPREPLY=( $(compgen -W "${story_ids}" -- ${cur}) )
            fi
            return 0
            ;;

        feature-show|feature-show.sh|feature-status|feature-status.sh)
            # Suggest feature IDs from cache
            if [ -d ".claude/azure/cache/features" ]; then
                local feature_ids=$(ls .claude/azure/cache/features/*.json 2>/dev/null | xargs -n1 basename | sed 's/.json//')
                COMPREPLY=( $(compgen -W "${feature_ids}" -- ${cur}) )
            fi
            return 0
            ;;

        search|search.sh)
            COMPREPLY=( $(compgen -W "--type=task --type=story --type=bug --type=feature --state=active --state=closed" -- ${cur}) )
            return 0
            ;;

        sprint-report|sprint-report.sh)
            COMPREPLY=( $(compgen -W "current --save --format=html --format=markdown" -- ${cur}) )
            return 0
            ;;

        daily|daily.sh)
            COMPREPLY=( $(compgen -W "--standup --next --active" -- ${cur}) )
            return 0
            ;;

        next-task|next-task.sh)
            COMPREPLY=( $(compgen -W "--user=me --user=" -- ${cur}) )
            return 0
            ;;

        help|help.sh)
            COMPREPLY=( $(compgen -W "${commands}" -- ${cur}) )
            return 0
            ;;
    esac

    # Complete script names
    if [[ ${cur} == *.sh ]]; then
        local scripts=$(ls autopm/.claude/scripts/azure/*.sh 2>/dev/null | xargs -n1 basename)
        COMPREPLY=( $(compgen -W "${scripts}" -- ${cur}) )
        return 0
    fi

    # Default to command list
    COMPREPLY=( $(compgen -W "${commands}" -- ${cur}) )
}

# Register completions for azure scripts
complete -F _azure_completion azure
complete -F _azure_completion ./setup.sh
complete -F _azure_completion ./daily.sh
complete -F _azure_completion ./sync.sh
complete -F _azure_completion ./us-list.sh
complete -F _azure_completion ./us-status.sh
complete -F _azure_completion ./feature-list.sh
complete -F _azure_completion ./feature-show.sh
complete -F _azure_completion ./feature-status.sh
complete -F _azure_completion ./sprint-report.sh
complete -F _azure_completion ./next-task.sh
complete -F _azure_completion ./search.sh
complete -F _azure_completion ./blocked.sh
complete -F _azure_completion ./validate.sh
complete -F _azure_completion ./active-work.sh
complete -F _azure_completion ./dashboard.sh

# Alias for quick access
alias az-daily='./autopm/.claude/scripts/azure/daily.sh'
alias az-next='./autopm/.claude/scripts/azure/next-task.sh'
alias az-sync='./autopm/.claude/scripts/azure/sync.sh --quick'
alias az-us='./autopm/.claude/scripts/azure/us-list.sh'
alias az-tasks='./autopm/.claude/scripts/azure/active-work.sh'
alias az-blocked='./autopm/.claude/scripts/azure/blocked.sh'
alias az-sprint='./autopm/.claude/scripts/azure/sprint-report.sh current'
alias az-dash='./autopm/.claude/scripts/azure/dashboard.sh'