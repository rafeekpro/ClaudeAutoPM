#!/usr/bin/env bash
# Azure Cosmos DB RU/s optimization and partition analysis
# Usage: ./cosmosdb-ru-optimize.sh [resource-group] [account-name] [database] [container]

set -euo pipefail

RESOURCE_GROUP="${1:-}"
ACCOUNT_NAME="${2:-}"
DATABASE="${3:-}"
CONTAINER="${4:-}"

if [ -z "$RESOURCE_GROUP" ] || [ -z "$ACCOUNT_NAME" ] || [ -z "$DATABASE" ] || [ -z "$CONTAINER" ]; then
    echo "Usage: $0 <resource-group> <account-name> <database> <container>"
    exit 1
fi

echo "🔍 Analyzing Azure Cosmos DB RU/s and partition distribution..."
echo "Resource Group: $RESOURCE_GROUP"
echo "Account: $ACCOUNT_NAME"
echo "Database: $DATABASE"
echo "Container: $CONTAINER"

# Check if az CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Please install Azure CLI."
    exit 1
fi

# Get current throughput
echo ""
echo "📊 Current Throughput Configuration:"
az cosmosdb sql container throughput show \
    --resource-group "$RESOURCE_GROUP" \
    --account-name "$ACCOUNT_NAME" \
    --database-name "$DATABASE" \
    --name "$CONTAINER" \
    --query "{throughput: resource.throughput, autoscale: resource.autoscaleSettings}" \
    --output table 2>/dev/null || echo "  ℹ️  Using database-level shared throughput"

# Get container properties
echo ""
echo "🗂️  Container Properties:"
az cosmosdb sql container show \
    --resource-group "$RESOURCE_GROUP" \
    --account-name "$ACCOUNT_NAME" \
    --database-name "$DATABASE" \
    --name "$CONTAINER" \
    --query "{partitionKey: resource.partitionKey.paths[0], ttl: resource.defaultTtl, indexingPolicy: resource.indexingPolicy.indexingMode}" \
    --output table

# Check for partition distribution (requires connection)
echo ""
echo "⚖️  Partition Distribution Analysis:"
echo "  ℹ️  Use Azure Portal Metrics or Application Insights for detailed partition metrics"
echo "  📊 Recommended checks:"
echo "    - Normalized RU Consumption (should be balanced across partitions)"
echo "    - Storage per partition (should be evenly distributed)"
echo "    - Hot partition detection (> 50% RU consumption on single partition)"

# Get consistency level
echo ""
echo "🎯 Consistency Level:"
az cosmosdb show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$ACCOUNT_NAME" \
    --query "consistencyPolicy.defaultConsistencyLevel" \
    --output tsv

echo ""
echo "📋 Best practices from Context7 (/websites/learn_microsoft-en-us-azure-cosmos-db):"
echo ""
echo "🔑 Partition Key Selection:"
echo "  ✓ Choose high-cardinality partition key (many distinct values)"
echo "  ✓ Distribute read and write operations evenly"
echo "  ✓ Avoid hot partitions (single partition handling most traffic)"
echo "  ✓ Common patterns:"
echo "    - User ID for user-centric applications"
echo "    - Tenant ID for multi-tenant applications"
echo "    - Date + ID composite for time-series data"
echo ""
echo "⚖️  Consistency Levels (by use case):"
echo "  • Strong: Financial transactions, inventory systems"
echo "  • Bounded Staleness: Social media feeds, leaderboards"
echo "  • Session: Shopping carts, user preferences (MOST COMMON)"
echo "  • Consistent Prefix: Live scores, news feeds"
echo "  • Eventual: Analytics, telemetry, logs"
echo ""
echo "💰 RU/s Optimization:"
echo "  ✓ Use autoscale for unpredictable workloads"
echo "  ✓ Use manual throughput for consistent workloads"
echo "  ✓ Monitor normalized RU consumption (should be 70-85%)"
echo "  ✓ Distribute throughput evenly across partitions"
echo ""
echo "Example: Evenly distribute RU/s across partitions:"
echo "  az cosmosdb sql container redistribute-partition-throughput \\"
echo "    --resource-group '$RESOURCE_GROUP' \\"
echo "    --account-name '$ACCOUNT_NAME' \\"
echo "    --database-name '$DATABASE' \\"
echo "    --name '$CONTAINER' \\"
echo "    --evenly-distribute"
echo ""
echo "🕒 TTL (Time-to-Live):"
echo "  ✓ Set defaultTtl for automatic data expiration"
echo "  ✓ Per-item TTL for granular control"
echo "  ✓ Reduces storage costs and improves query performance"
echo ""
echo "Example: Enable TTL on container:"
echo "  az cosmosdb sql container update \\"
echo "    --resource-group '$RESOURCE_GROUP' \\"
echo "    --account-name '$ACCOUNT_NAME' \\"
echo "    --database-name '$DATABASE' \\"
echo "    --name '$CONTAINER' \\"
echo "    --ttl 86400  # 24 hours"
echo ""
echo "📊 Query Optimization:"
echo "  ✓ Include partition key in WHERE clause when possible"
echo "  ✓ Use composite indexes for multi-property queries"
echo "  ✓ Limit result set size with TOP"
echo "  ✓ Use OFFSET/LIMIT for pagination"
echo "  ✓ Avoid cross-partition queries when possible"
echo ""
echo "Example optimized query:"
echo "  SELECT * FROM c"
echo "  WHERE c.userId = 'user123'  -- Partition key"
echo "    AND c.timestamp > '2024-01-01'"
echo "  ORDER BY c.timestamp DESC"
echo "  OFFSET 0 LIMIT 20"
echo ""
echo "🌍 Global Distribution:"
echo "  ✓ Enable multi-region writes for low latency globally"
echo "  ✓ Use Session consistency for global applications"
echo "  ✓ Configure read regions based on user distribution"
echo "  ✓ Monitor cross-region replication lag"
echo ""
echo "💡 Cost Optimization Tips:"
echo "  1. Right-size RU/s based on actual usage (monitor normalized RU consumption)"
echo "  2. Use shared database throughput for small containers"
echo "  3. Implement TTL to automatically remove old data"
echo "  4. Use serverless for development/test environments"
echo "  5. Archive cold data to Azure Blob Storage"
echo "  6. Optimize indexing policy (exclude unused properties)"

# Check if container uses composite indexes
echo ""
echo "🔍 Checking Indexing Policy:"
az cosmosdb sql container show \
    --resource-group "$RESOURCE_GROUP" \
    --account-name "$ACCOUNT_NAME" \
    --database-name "$DATABASE" \
    --name "$CONTAINER" \
    --query "resource.indexingPolicy" \
    --output json 2>/dev/null | head -30

echo ""
echo "✅ Cosmos DB RU/s optimization analysis complete"
echo ""
echo "📌 Next Steps:"
echo "  1. Review partition distribution in Azure Portal Metrics"
echo "  2. Check for hot partitions (> 50% normalized RU consumption)"
echo "  3. Verify consistency level matches application requirements"
echo "  4. Implement TTL if not already configured"
echo "  5. Consider autoscale for variable workloads"
echo "  6. Monitor query RU charges and optimize high-cost queries"
