#!/usr/bin/env bash
# BigQuery cost analysis and optimization checker
# Usage: ./bigquery-cost-analyze.sh [project-id] [dataset]

set -euo pipefail

PROJECT_ID="${1:-}"
DATASET="${2:-}"

if [ -z "$PROJECT_ID" ]; then
    echo "Usage: $0 <project-id> [dataset]"
    exit 1
fi

echo "💰 Analyzing BigQuery costs and optimization opportunities..."
echo "Project: $PROJECT_ID"
if [ -n "$DATASET" ]; then
    echo "Dataset: $DATASET"
fi

# Check if bq CLI is installed
if ! command -v bq &> /dev/null; then
    echo "❌ bq CLI not found. Please install Google Cloud SDK."
    exit 1
fi

# Get storage costs
echo ""
echo "📊 Storage Analysis:"
if [ -n "$DATASET" ]; then
    QUERY="
    SELECT
        table_schema as dataset,
        table_name,
        ROUND(total_logical_bytes / POW(10, 9), 2) as logical_gb,
        ROUND(total_physical_bytes / POW(10, 9), 2) as physical_gb,
        ROUND(long_term_logical_bytes / POW(10, 9), 2) as long_term_gb,
        CASE
            WHEN total_rows > 0 THEN ROUND(total_physical_bytes / total_rows, 2)
            ELSE 0
        END as bytes_per_row
    FROM \`region-us\`.INFORMATION_SCHEMA.TABLE_STORAGE
    WHERE table_schema = '$DATASET'
    ORDER BY total_physical_bytes DESC
    LIMIT 10;
    "
else
    QUERY="
    SELECT
        table_schema as dataset,
        SUM(total_physical_bytes) / POW(10, 9) as total_physical_gb,
        SUM(long_term_physical_bytes) / POW(10, 9) as long_term_gb
    FROM \`region-us\`.INFORMATION_SCHEMA.TABLE_STORAGE
    GROUP BY table_schema
    ORDER BY total_physical_gb DESC
    LIMIT 10;
    "
fi

bq query --use_legacy_sql=false --format=prettyjson "$QUERY" 2>/dev/null | head -50

# Check for partitioning and clustering
echo ""
echo "🗂️  Partitioning and Clustering Status:"
if [ -n "$DATASET" ]; then
    PARTITION_QUERY="
    SELECT
        table_name,
        CASE
            WHEN is_partitioning_column = 'YES' THEN 'Partitioned'
            ELSE 'Not Partitioned'
        END as partition_status,
        CASE
            WHEN clustering_ordinal_position IS NOT NULL THEN 'Clustered'
            ELSE 'Not Clustered'
        END as cluster_status
    FROM \`$PROJECT_ID.$DATASET.INFORMATION_SCHEMA.COLUMNS\`
    WHERE table_name NOT LIKE '%INFORMATION_SCHEMA%'
    GROUP BY table_name, partition_status, cluster_status
    ORDER BY table_name;
    "
    bq query --use_legacy_sql=false --format=prettyjson "$PARTITION_QUERY" 2>/dev/null | head -50
fi

# Check recent query costs
echo ""
echo "💸 Most Expensive Queries (Last 7 Days):"
EXPENSIVE_QUERY="
SELECT
    user_email,
    query,
    ROUND(total_bytes_processed / POW(10, 9), 2) as gb_processed,
    ROUND(total_slot_ms / 1000, 2) as slot_seconds,
    TIMESTAMP_DIFF(end_time, start_time, MILLISECOND) as duration_ms
FROM \`$PROJECT_ID.region-us.INFORMATION_SCHEMA.JOBS_BY_PROJECT\`
WHERE creation_time > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
    AND job_type = 'QUERY'
    AND state = 'DONE'
    AND total_bytes_processed > 0
ORDER BY total_bytes_processed DESC
LIMIT 5;
"
bq query --use_legacy_sql=false --format=prettyjson "$EXPENSIVE_QUERY" 2>/dev/null | head -100

echo ""
echo "📋 Best practices from Context7 (/websites/cloud_google-bigquery):"
echo ""
echo "🗂️  Partitioning:"
echo "  ✓ Partition tables by DATE or TIMESTAMP for time-series data"
echo "  ✓ Use PARTITION BY DATE(timestamp_column) for daily partitions"
echo "  ✓ Set partition_expiration_days to automatically remove old data"
echo "  ✓ Use require_partition_filter=TRUE to enforce partition filtering"
echo ""
echo "Example:"
echo "  CREATE TABLE dataset.events ("
echo "    event_id INT64,"
echo "    event_timestamp TIMESTAMP"
echo "  )"
echo "  PARTITION BY DATE(event_timestamp)"
echo "  OPTIONS (partition_expiration_days=365);"
echo ""
echo "🎯 Clustering:"
echo "  ✓ Cluster by columns frequently used in WHERE and GROUP BY"
echo "  ✓ Order clustering columns by cardinality (low to high)"
echo "  ✓ Up to 4 clustering columns supported"
echo "  ✓ Clustering improves query performance and reduces costs"
echo ""
echo "Example:"
echo "  CREATE TABLE dataset.events ("
echo "    event_timestamp TIMESTAMP,"
echo "    user_id STRING,"
echo "    event_type STRING"
echo "  )"
echo "  PARTITION BY DATE(event_timestamp)"
echo "  CLUSTER BY user_id, event_type;"
echo ""
echo "💰 Cost Optimization:"
echo "  ✓ Use _PARTITIONTIME for partition pruning in WHERE clauses"
echo "  ✓ Avoid SELECT * - specify only needed columns"
echo "  ✓ Use LIMIT for exploratory queries"
echo "  ✓ Preview data with table preview (free)"
echo "  ✓ Use materialized views for repeated aggregations"
echo "  ✓ Monitor INFORMATION_SCHEMA.TABLE_STORAGE for storage costs"
echo "  ✓ Long-term storage (90+ days) is 50% cheaper"
echo ""
echo "🚀 Query Optimization:"
echo "  ✓ Place _PARTITIONTIME on left side of comparisons"
echo "  ✓ Use constant expressions for partition pruning"
echo "  ✓ Combine filters with AND for multiple partition columns"
echo "  ✓ Use ORDER BY + LIMIT for search queries on partitioned tables"
echo ""
echo "Example optimized query:"
echo "  SELECT event_type, COUNT(*) as total"
echo "  FROM dataset.events"
echo "  WHERE DATE(event_timestamp) BETWEEN '2024-01-01' AND '2024-01-31'"
echo "    AND user_id = 'user123'"
echo "  GROUP BY event_type;"

echo ""
echo "✅ BigQuery cost analysis complete"
