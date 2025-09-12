#!/bin/bash

# Hook wymuszający używanie agentów zamiast bezpośrednich operacji
# Użycie: ustaw jako tool-use-hook w konfiguracji Claude Code

TOOL_NAME="$1"
TOOL_PARAMS="$2"

# Funkcja do wyświetlania komunikatu blokady
block_with_message() {
    echo "❌ BLOCKED: $1"
    echo "✅ INSTEAD: Use the $2 agent via Task tool"
    echo ""
    echo "Example:"
    echo "  Task: $3"
    exit 1
}

# Sprawdzanie używania Bash dla operacji które powinny używać agentów
if [[ "$TOOL_NAME" == "Bash" ]]; then
    
    # Blokuj bezpośrednie grep/find - powinien używać code-analyzer
    if echo "$TOOL_PARAMS" | grep -qE "(grep|rg|find|ag)\s+.*\.(py|js|ts|jsx|tsx)"; then
        block_with_message \
            "Direct code search detected" \
            "code-analyzer" \
            "Search for [pattern] in codebase"
    fi
    
    # Blokuj bezpośrednie uruchamianie testów - powinien używać test-runner
    if echo "$TOOL_PARAMS" | grep -qE "(pytest|npm test|yarn test|jest|vitest)"; then
        block_with_message \
            "Direct test execution detected" \
            "test-runner" \
            "Run and analyze test results"
    fi
    
    # Blokuj bezpośrednie czytanie logów - powinien używać file-analyzer
    if echo "$TOOL_PARAMS" | grep -qE "(cat|head|tail|less).*\.(log|txt|out)"; then
        block_with_message \
            "Direct log reading detected" \
            "file-analyzer" \
            "Analyze and summarize [log file]"
    fi
fi

# Sprawdzanie używania Read dla dużych plików
if [[ "$TOOL_NAME" == "Read" ]]; then
    FILE_PATH=$(echo "$TOOL_PARAMS" | jq -r '.file_path' 2>/dev/null)
    
    # Jeśli plik jest większy niż 1000 linii, wymuszaj file-analyzer
    if [[ -f "$FILE_PATH" ]]; then
        LINE_COUNT=$(wc -l < "$FILE_PATH")
        if [[ $LINE_COUNT -gt 1000 ]]; then
            block_with_message \
                "Reading large file directly (${LINE_COUNT} lines)" \
                "file-analyzer" \
                "Summarize contents of ${FILE_PATH}"
        fi
    fi
fi

# Sprawdzanie używania Grep dla złożonych wyszukiwań
if [[ "$TOOL_NAME" == "Grep" ]]; then
    PATTERN=$(echo "$TOOL_PARAMS" | jq -r '.pattern' 2>/dev/null)
    
    # Jeśli wzorzec jest złożony lub szuka w wielu plikach, użyj code-analyzer
    if echo "$PATTERN" | grep -qE "(\.\*|\+|\{|\[)"; then
        echo "⚠️  SUGGESTION: For complex searches, consider using code-analyzer agent"
        echo "   It provides better context and analysis of results"
        # Nie blokujemy, tylko sugerujemy
    fi
fi

# Dozwolone - przepuszczamy
exit 0