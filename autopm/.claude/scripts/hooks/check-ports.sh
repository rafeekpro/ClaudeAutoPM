#!/bin/bash

# Port Conflict Detection Script
# Checks docker-compose.yml for port conflicts

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔌 Port Conflict Detection"
echo "=========================="
echo ""

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${YELLOW}⚠️  No docker-compose.yml found${NC}"
    echo "Skipping port check"
    exit 0
fi

echo "Scanning docker-compose.yml..."
echo ""

# Extract all port mappings
# Format: "host:container" -> extract host port
HOST_PORTS=$(grep -E "^\s+-[0-9]+:[0-9]+" docker-compose.yml | sed 's/.*-\([0-9]*\):.*/\1/')

if [ -z "$HOST_PORTS" ]; then
    echo -e "${YELLOW}⚠️  No port mappings found${NC}"
    exit 0
fi

# Sort ports for display
SORTED_PORTS=$(echo "$HOST_PORTS" | sort -n)

echo "Found ports:"
echo "$SORTED_PORTS" | while read port; do
    echo "  • $port"
done
echo ""

ERRORS=0

# Check 1: System ports (below 50000)
echo "🔍 Checking for system ports (< 50000)..."
SYSTEM_PORTS=$(echo "$HOST_PORTS" | awk '$1 < 50000')

if [ -n "$SYSTEM_PORTS" ]; then
    echo -e "${RED}❌ System ports found!${NC}"
    echo "$SYSTEM_PORTS" | while read port; do
        echo "  • Port $port - may conflict with system services"
    done
    echo ""
    echo "💡 Problem:"
    echo "   Ports below 50000 may conflict with:"
    echo "   - System services (80, 443, 22, etc.)"
    echo "   - Other applications (3000, 8000, etc.)"
    echo "   - Databases (5432, 3306, 27017, etc.)"
    echo ""
    echo "✅ Solution:"
    echo "   Use 5xxxx range for all project ports:"
    echo "   - 50000 for main entry (nginx)"
    echo "   - 50001 for backend API"
    echo "   - 50002 for frontend"
    echo "   - 50003 for PostgreSQL"
    echo "   - 50004 for Redis"
    echo ""
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ No system ports${NC}"
fi
echo ""

# Check 2: Duplicate ports
echo "🔍 Checking for duplicate ports..."
DUPLICATES=$(echo "$HOST_PORTS" | sort | uniq -d)

if [ -n "$DUPLICATES" ]; then
    echo -e "${RED}❌ Duplicate ports found!${NC}"
    echo "$DUPLICATES" | while read port; do
        COUNT=$(echo "$HOST_PORTS" | grep -c "^$port$")
        echo "  • Port $port used $COUNT times"
    done
    echo ""
    echo "💡 Problem:"
    echo "   Multiple services trying to use the same host port"
    echo ""
    echo "✅ Solution:"
    echo "   Each service needs a unique host port in 5xxxx range"
    echo ""
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ No duplicate ports${NC}"
fi
echo ""

# Check 3: Reserved ports (well-known services)
echo "🔍 Checking for reserved ports..."
RESERVED_PORTS="22 80 443 3306 5432 6379 27017"
FOUND_RESERVED=""

for reserved in $RESERVED_PORTS; do
    if echo "$HOST_PORTS" | grep -q "^$reserved$"; then
        FOUND_RESERVED="$FOUND_RESERVED $reserved"
    fi
done

if [ -n "$FOUND_RESERVED" ]; then
    echo -e "${YELLOW}⚠️  Reserved ports found:${NC}"
    for port in $FOUND_RESERVED; do
        SERVICE_NAME=""
        case $port in
            22) SERVICE_NAME="SSH" ;;
            80) SERVICE_NAME="HTTP" ;;
            443) SERVICE_NAME="HTTPS" ;;
            3306) SERVICE_NAME="MySQL" ;;
            5432) SERVICE_NAME="PostgreSQL" ;;
            6379) SERVICE_NAME="Redis" ;;
            27017) SERVICE_NAME="MongoDB" ;;
        esac
        echo "  • Port $port ($SERVICE_NAME)"
    done
    echo ""
    echo "💡 Problem:"
    echo "   These ports are commonly used by system services"
    echo ""
    echo "✅ Solution:"
    echo "   Map to 5xxxx range instead"
    echo "   Example: Change '5432:5432' to '50003:5432'"
    echo ""
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ No reserved ports${NC}"
fi
echo ""

# Final result
if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ Port validation failed!${NC}"
    echo "Found $ERRORS issue(s) that must be fixed"
    echo ""
    echo "🚫 Commit blocked - fix port conflicts first"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ All ports validated successfully!${NC}"
    echo ""
    echo "Port configuration:"
    echo "  • Using 5xxxx range (no conflicts)"
    echo "  • No duplicate ports"
    echo "  • No system ports"
    echo "  • No reserved ports"
    echo ""
    exit 0
fi
