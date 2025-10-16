#!/usr/bin/env bash
# MongoDB sharded collection index consistency check
# Usage: ./mongodb-shard-check.sh [database] [collection]

set -euo pipefail

DB_NAME="${1:-test}"
COLLECTION="${2:-users}"

echo "🔍 Checking MongoDB sharded collection index consistency..."
echo "Database: $DB_NAME"
echo "Collection: $COLLECTION"

# Create temporary JavaScript file for aggregation pipeline
TEMP_JS=$(mktemp)
cat > "$TEMP_JS" << 'EOJS'
const pipeline = [
    // Get indexes and the shards that they belong to
    {$indexStats: {}},
    // Attach a list of all shards which reported indexes
    {$group: {_id: null, indexDoc: {$push: "$$ROOT"}, allShards: {$addToSet: "$shard"}}},
    // Unwind the generated array back
    {$unwind: "$indexDoc"},
    // Group by index name
    {
        $group: {
            "_id": "$indexDoc.name",
            "shards": {$push: "$indexDoc.shard"},
            "specs": {$push: {$objectToArray: {$ifNull: ["$indexDoc.spec", {}]}}},
            "allShards": {$first: "$allShards"}
        }
    },
    // Compute which indexes are not present on all shards
    {
        $project: {
            missingFromShards: {$setDifference: ["$allShards", "$shards"]},
            inconsistentProperties: {
                 $setDifference: [
                     {$reduce: {
                         input: "$specs",
                         initialValue: {$arrayElemAt: ["$specs", 0]},
                         in: {$setUnion: ["$$value", "$$this"]}}},
                     {$reduce: {
                         input: "$specs",
                         initialValue: {$arrayElemAt: ["$specs", 0]},
                         in: {$setIntersection: ["$$value", "$$this"]}}}
                 ]
             }
        }
    },
    // Only return inconsistencies
    {
        $match: {
            $expr: {$or: [
                {$gt: [{$size: "$missingFromShards"}, 0]},
                {$gt: [{$size: "$inconsistentProperties"}, 0]}
            ]}
        }
    },
    // Output relevant fields
    {$project: {_id: 0, indexName: "$$ROOT._id", inconsistentProperties: 1, missingFromShards: 1}}
];

const result = db.getSiblingDB("$DB_NAME").getCollection("$COLLECTION").aggregate(pipeline);

print("\n📊 Index Inconsistency Report:");
print("================================\n");

let found = false;
result.forEach(doc => {
    found = true;
    print("Index: " + doc.indexName);
    if (doc.missingFromShards && doc.missingFromShards.length > 0) {
        print("  ⚠️  Missing from shards: " + doc.missingFromShards.join(", "));
    }
    if (doc.inconsistentProperties && doc.inconsistentProperties.length > 0) {
        print("  ⚠️  Inconsistent properties detected");
    }
    print("");
});

if (!found) {
    print("✅ No index inconsistencies found - all indexes are consistent across shards\n");
}
EOJS

# Replace variables in the JavaScript file
sed -i '' "s/\$DB_NAME/$DB_NAME/g" "$TEMP_JS"
sed -i '' "s/\$COLLECTION/$COLLECTION/g" "$TEMP_JS"

# Execute the aggregation
mongosh --quiet --file "$TEMP_JS"

# Cleanup
rm "$TEMP_JS"

echo ""
echo "📊 Checking shard distribution..."
mongosh --quiet --eval "
db.getSiblingDB('$DB_NAME').getCollection('$COLLECTION').aggregate([
    {\$collStats:{}},
    {\$group: {_id: '\$ns', shard_list: {\$addToSet: '\$shard'}}}
]).forEach(doc => {
    print('Collection: ' + doc._id);
    print('Shards: ' + doc.shard_list.join(', '));
});
"

echo ""
echo "📋 Best practices from Context7 (/mongodb/docs):"
echo "  ✓ Compound indexes should match query filter order"
echo "  ✓ Use \$indexStats to detect inconsistencies in sharded collections"
echo "  ✓ Verify indexes exist on all shards for sharded collections"
echo "  ✓ Use aggregation pipelines for complex queries"
echo "  ✓ Monitor index usage with explain('executionStats')"
echo "  ✓ Create indexes on frequently queried fields"
echo "  ✓ Avoid creating too many indexes (impacts write performance)"

echo ""
echo "✅ MongoDB shard check complete"
