#!/usr/bin/env bash
# PostgreSQL index analysis and optimization
# Usage: ./postgres-index-analyze.sh [database-name]

set -euo pipefail

DB_NAME="${1:-postgres}"

echo "🔍 Analyzing PostgreSQL indexes for database: $DB_NAME"

# Check for unused indexes
echo ""
echo "📊 Checking for unused indexes..."
psql -d "$DB_NAME" -c "
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 10;
"

# Check index hit ratio
echo ""
echo "📈 Checking index hit ratio..."
psql -d "$DB_NAME" -c "
SELECT
    sum(idx_blks_hit) - sum(idx_blks_read) as idx_hit,
    sum(idx_blks_hit) + sum(idx_blks_read) as idx_read,
    CASE WHEN (sum(idx_blks_hit) + sum(idx_blks_read)) = 0 THEN 0
         ELSE round(100.0 * sum(idx_blks_hit) / (sum(idx_blks_hit) + sum(idx_blks_read)), 2)
    END as hit_ratio
FROM pg_statio_user_indexes;
"

# Show largest tables without indexes
echo ""
echo "⚠️  Large tables without indexes..."
psql -d "$DB_NAME" -c "
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    n_tup_ins + n_tup_upd + n_tup_del as modifications
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT DISTINCT tablename
    FROM pg_indexes
    WHERE schemaname = 'public'
  )
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
"

# Check for missing indexes on foreign keys
echo ""
echo "🔑 Checking for missing indexes on foreign keys..."
psql -d "$DB_NAME" -c "
SELECT
    tc.table_schema,
    tc.table_name,
    kcu.column_name,
    pg_size_pretty(pg_total_relation_size(tc.table_schema||'.'||tc.table_name)) as table_size
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = tc.table_schema
      AND tablename = tc.table_name
      AND indexdef LIKE '%'||kcu.column_name||'%'
  )
ORDER BY pg_total_relation_size(tc.table_schema||'.'||tc.table_name) DESC
LIMIT 10;
"

echo ""
echo "📋 Best practices from Context7 (/websites/postgresql):"
echo "  ✓ B-tree indexes for equality and range queries"
echo "  ✓ Partial indexes for filtered queries (WHERE clause)"
echo "  ✓ Covering indexes with INCLUDE clause (avoid heap lookups)"
echo "  ✓ CREATE INDEX CONCURRENTLY to avoid table locks"
echo "  ✓ Use EXPLAIN ANALYZE to verify index usage"
echo "  ✓ Monitor pg_stat_user_indexes for index effectiveness"
echo "  ✓ Drop unused indexes to reduce write overhead"

echo ""
echo "✅ PostgreSQL index analysis complete"
