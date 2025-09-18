#!/bin/zsh
# Azure DevOps CLI Zsh Completion
# Installation: source this file in your .zshrc

_azure_completion() {
    local -a commands subcommands

    commands=(
        'active-work:Show active work items'
        'blocked:View blocked items'
        'daily:Daily workflow automation'
        'dashboard:Project status overview'
        'feature-list:List all features/epics'
        'feature-show:Show feature details'
        'feature-status:Show feature progress'
        'help:Display help information'
        'next-task:Get task recommendation'
        'search:Search work items'
        'setup:Initial configuration'
        'sprint-report:Generate sprint report'
        'sync:Sync with Azure DevOps'
        'us-list:List user stories'
        'us-status:Show story progress'
        'validate:Validate work items'
    )

    # Main completion
    if (( CURRENT == 2 )); then
        _describe 'azure commands' commands
        return
    fi

    # Sub-command specific completions
    case "${words[2]}" in
        sync)
            _arguments \
                '--quick[Sync recent changes only]' \
                '--full[Full synchronization]'
            ;;

        us-list)
            _arguments \
                '--sprint=[Filter by sprint]:sprint:(current)' \
                '--status=[Filter by status]:status:(active new closed)' \
                '--assigned-to=[Filter by assignee]:assignee:(me)'
            ;;

        us-status)
            # Suggest story IDs from cache
            local story_ids
            if [[ -d ".claude/azure/cache/stories" ]]; then
                story_ids=(${(f)"$(ls .claude/azure/cache/stories/*.json 2>/dev/null | xargs -n1 basename | sed 's/.json//')"})
                _arguments "1:story id:(${story_ids})"
            fi
            ;;

        feature-show|feature-status)
            # Suggest feature IDs from cache
            local feature_ids
            if [[ -d ".claude/azure/cache/features" ]]; then
                feature_ids=(${(f)"$(ls .claude/azure/cache/features/*.json 2>/dev/null | xargs -n1 basename | sed 's/.json//')"})
                _arguments "1:feature id:(${feature_ids})"
            fi
            ;;

        search)
            _arguments \
                '1:search term:' \
                '--type=[Filter by type]:type:(task story bug feature)' \
                '--state=[Filter by state]:state:(active closed)'
            ;;

        sprint-report)
            _arguments \
                '1:sprint:(current)' \
                '--save[Save report to file]' \
                '--format=[Output format]:format:(html markdown)'
            ;;

        daily)
            _arguments \
                '--standup[Show standup report]' \
                '--next[Get next task]' \
                '--active[Show active work]'
            ;;

        next-task)
            _arguments \
                '--user=[Filter by user]:user:(me)'
            ;;

        help)
            _arguments "1:command:(${commands[@]%:*})"
            ;;
    esac
}

# Register completions
compdef _azure_completion azure

# Also register for direct script execution
for script in setup daily sync us-list us-status feature-list feature-show feature-status sprint-report next-task search blocked validate active-work dashboard; do
    compdef _azure_completion ${script}.sh
done

# Aliases for quick access
alias az-daily='./autopm/.claude/scripts/azure/daily.sh'
alias az-next='./autopm/.claude/scripts/azure/next-task.sh'
alias az-sync='./autopm/.claude/scripts/azure/sync.sh --quick'
alias az-us='./autopm/.claude/scripts/azure/us-list.sh'
alias az-tasks='./autopm/.claude/scripts/azure/active-work.sh'
alias az-blocked='./autopm/.claude/scripts/azure/blocked.sh'
alias az-sprint='./autopm/.claude/scripts/azure/sprint-report.sh current'
alias az-dash='./autopm/.claude/scripts/azure/dashboard.sh'
alias az-features='./autopm/.claude/scripts/azure/feature-list.sh'
alias az-search='./autopm/.claude/scripts/azure/search.sh'