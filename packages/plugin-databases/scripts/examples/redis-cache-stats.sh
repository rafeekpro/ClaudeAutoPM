#!/usr/bin/env bash
# Redis cache statistics and performance analysis
# Usage: ./redis-cache-stats.sh [host] [port]

set -euo pipefail

REDIS_HOST="${1:-localhost}"
REDIS_PORT="${2:-6379}"

echo "📊 Analyzing Redis cache performance..."
echo "Host: $REDIS_HOST:$REDIS_PORT"

# Check connection
if ! redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" PING > /dev/null 2>&1; then
    echo "❌ Cannot connect to Redis at $REDIS_HOST:$REDIS_PORT"
    exit 1
fi

# Get memory stats
echo ""
echo "💾 Memory Statistics:"
redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" INFO memory | grep -E "used_memory_human|used_memory_peak_human|mem_fragmentation_ratio|maxmemory_policy"

# Get keyspace stats
echo ""
echo "🔑 Keyspace Statistics:"
redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" INFO keyspace

# Get hit/miss ratio
echo ""
echo "🎯 Cache Hit/Miss Ratio:"
redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" INFO stats | grep -E "keyspace_hits|keyspace_misses" | while read -r line; do
    echo "  $line"
done

# Calculate hit rate
HITS=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" INFO stats | grep "keyspace_hits:" | cut -d: -f2 | tr -d '\r')
MISSES=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" INFO stats | grep "keyspace_misses:" | cut -d: -f2 | tr -d '\r')

if [ -n "$HITS" ] && [ -n "$MISSES" ]; then
    TOTAL=$((HITS + MISSES))
    if [ "$TOTAL" -gt 0 ]; then
        HIT_RATE=$(awk "BEGIN {printf \"%.2f\", ($HITS / $TOTAL) * 100}")
        echo "  Hit Rate: $HIT_RATE%"

        if (( $(echo "$HIT_RATE < 80" | bc -l) )); then
            echo "  ⚠️  Hit rate below 80% - consider reviewing cache strategy"
        else
            echo "  ✅ Hit rate is healthy (>80%)"
        fi
    fi
fi

# Check persistence configuration
echo ""
echo "💿 Persistence Configuration:"
redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" CONFIG GET save | tail -1
redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" CONFIG GET appendonly | tail -1

# Check for slow log entries
echo ""
echo "🐌 Recent Slow Log Entries:"
SLOW_COUNT=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" SLOWLOG LEN)
if [ "$SLOW_COUNT" -gt 0 ]; then
    echo "  Found $SLOW_COUNT slow log entries"
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" SLOWLOG GET 5
else
    echo "  ✅ No slow log entries"
fi

# Check connected clients
echo ""
echo "👥 Connected Clients:"
redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" INFO clients | grep "connected_clients:"

# Sample key distribution by data type
echo ""
echo "📦 Key Distribution by Type:"
for type in string list set zset hash stream; do
    count=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" --scan --pattern "*" | \
            xargs -I{} redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" TYPE {} | \
            grep -c "^$type$" || echo "0")
    if [ "$count" -gt 0 ]; then
        echo "  $type: $count"
    fi
done

echo ""
echo "📋 Best practices from Context7 (/websites/redis_io):"
echo "  ✓ Client-side caching with placeholder pattern for race condition prevention"
echo "  ✓ Use appropriate data structures:"
echo "    - Hash: For objects with multiple fields"
echo "    - Set: For unique collections, membership tests"
echo "    - Sorted Set: For ranked/scored data, leaderboards"
echo "    - List: For queues, stacks, recent items"
echo "    - String: For simple key-value, counters"
echo "  ✓ Configure persistence: AOF for durability, RDB for snapshots"
echo "  ✓ Set expiration (TTL) on cached items"
echo "  ✓ Monitor memory usage and implement eviction policies"
echo "  ✓ Use pipelining for multiple commands"
echo "  ✓ Avoid KEYS in production (use SCAN instead)"
echo "  ✓ Target cache hit rate > 80%"

echo ""
echo "💡 Cache Strategy Recommendations:"
if [ -n "$HIT_RATE" ]; then
    if (( $(echo "$HIT_RATE < 80" | bc -l) )); then
        echo "  1. Review TTL settings - may be too short"
        echo "  2. Analyze cache miss patterns"
        echo "  3. Consider warming cache on startup"
        echo "  4. Implement write-through caching where appropriate"
    fi
fi

MEMORY_POLICY=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" CONFIG GET maxmemory-policy | tail -1)
if [ "$MEMORY_POLICY" = "noeviction" ]; then
    echo "  ⚠️  Eviction policy is 'noeviction' - consider using LRU or LFU"
fi

echo ""
echo "✅ Redis cache analysis complete"
