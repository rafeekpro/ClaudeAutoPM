# Database Operations Pipeline

> **CRITICAL**: Database operations require specialized workflows for safety and performance.

## 1. DATABASE MIGRATION PIPELINE

**Trigger**: Any schema change or migration
**Sequence**:

```
1. postgresql-expert/mongodb-expert → Analyze current schema
2. Query Context7 for migration best practices
3. Write migration with rollback plan
4. test-runner → Test migration on dev database
5. Create backup verification test
6. Document migration in changelog
7. Never run migrations without rollback plan
```

**Context7 Best Practices**:
- PostgreSQL: Use transactional DDL when possible
- MongoDB: Test on replica set before production
- Always verify index creation doesn't block writes

## 2. QUERY OPTIMIZATION PIPELINE

**Trigger**: Slow query or performance issue
**Sequence**:

```
1. postgresql-expert → Analyze query plan (EXPLAIN ANALYZE)
2. Query Context7 for optimization patterns
3. Identify missing indexes or inefficient operations
4. Write performance test (must show improvement)
5. Implement optimization
6. test-runner → Verify no functionality regression
7. Document optimization in CLAUDE.md
```

**PostgreSQL Optimization** (Context7: /websites/postgresql):
```sql
-- Use EXPLAIN ANALYZE to identify bottlenecks
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 123;

-- Optimize with appropriate index
CREATE INDEX idx_orders_customer_id ON orders(customer_id);

-- Verify improvement
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 123;
```

**MongoDB Optimization** (Context7: /mongodb/docs):
```javascript
// Use explain() for aggregation pipelines
db.collection.aggregate([
  {$match: {status: "active"}},
  {$group: {_id: "$category", total: {$sum: 1}}}
]).explain("executionStats");

// Create compound index in query order
db.collection.createIndex({status: 1, category: 1});
```

**Redis Optimization** (Context7: /websites/redis_io):
- Use SCAN instead of KEYS for production
- Implement pipeline for multiple commands
- Use appropriate data structures (Hash vs String)

## 3. DATA WAREHOUSE PIPELINE

**Trigger**: BigQuery/CosmosDB implementation
**Sequence**:

```
1. bigquery-expert/cosmosdb-expert → Design schema
2. Query Context7 for partitioning/clustering best practices
3. Create partitioning/sharding strategy
4. Implement ETL/ELT pipeline
5. test-runner → Validate data integrity
6. Monitor costs and performance
```

**BigQuery Best Practices** (Context7: /websites/cloud_google-bigquery):
```sql
-- Partition by date, cluster by filter columns
CREATE TABLE analytics.events (
  event_id INT64,
  event_timestamp TIMESTAMP,
  user_id STRING,
  event_type STRING
)
PARTITION BY DATE(event_timestamp)
CLUSTER BY user_id, event_type
OPTIONS (
  partition_expiration_days=365,
  require_partition_filter=TRUE
);

-- Optimize queries with partition pruning
SELECT event_type, COUNT(*) as total
FROM analytics.events
WHERE DATE(event_timestamp) BETWEEN '2024-01-01' AND '2024-01-31'
  AND user_id = 'user123'
GROUP BY event_type;
```

**Cosmos DB Best Practices** (Context7: /websites/learn_microsoft-en-us-azure-cosmos-db):
- Choose partition key for even distribution (avoid hot partitions)
- Use Session consistency for most scenarios
- Implement TTL for automatic data cleanup
- Monitor and optimize RU/s consumption

## 4. CACHE IMPLEMENTATION PIPELINE

**Trigger**: Redis caching requirement
**Sequence**:

```
1. redis-expert → Design cache strategy
2. Query Context7 for caching patterns
3. Implement cache invalidation logic
4. Write cache hit/miss tests
5. test-runner → Verify cache behavior
6. Monitor memory usage and hit rates
```

**Redis Caching Patterns** (Context7: /websites/redis_io):
```redis
# Client-side caching with placeholder pattern
SET cache:user:1234 "caching-in-progress"
# Compute expensive operation
SET cache:user:1234 "{\"name\":\"Alice\",\"role\":\"admin\"}"
EXPIRE cache:user:1234 3600

# Cache aside pattern
GET cache:product:456
# If miss, query database and set cache
SET cache:product:456 '{"name":"Widget","price":29.99}'
EXPIRE cache:product:456 1800
```

**Cache Invalidation Strategies**:
- **Write-through**: Update cache immediately on write
- **Write-behind**: Queue writes, update cache async
- **TTL-based**: Set expiration on all cached items
- **Event-based**: Invalidate on database change events

## 5. DATABASE BACKUP PIPELINE

**Trigger**: Backup strategy implementation
**Sequence**:

```
1. Database expert → Design backup strategy
2. Query Context7 for backup best practices
3. Implement automated backup script
4. Write restore verification test
5. test-runner → Test backup and restore
6. Document recovery procedures
7. Schedule regular backup drills
```

**Backup Strategies by Database**:

### PostgreSQL
```bash
# Full backup with custom format (allows selective restore)
pg_dump -Fc -d mydatabase -f backup.dump

# Point-in-time recovery setup
# Enable WAL archiving in postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backup/wal/%f'
```

### MongoDB
```bash
# Consistent backup with oplog
mongodump --oplog --gzip --out /backup/mongodb/

# Verify backup integrity
mongorestore --dry-run --gzip --dir /backup/mongodb/
```

### Redis
```bash
# Manual snapshot
redis-cli BGSAVE

# Configure automatic snapshots
save 900 1      # After 900s if ≥1 key changed
save 300 10     # After 300s if ≥10 keys changed
save 60 10000   # After 60s if ≥10000 keys changed
```

### BigQuery
```sql
-- Create snapshot for time travel
CREATE SNAPSHOT TABLE mydataset.events_snapshot
CLONE mydataset.events;

-- Query historical data (up to 7 days)
SELECT * FROM mydataset.events
FOR SYSTEM_TIME AS OF TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY);
```

### Cosmos DB
- Automatic continuous backups with configurable retention
- Manual backup triggers for critical operations
- Cross-region geo-redundant backups

## 6. INDEX MANAGEMENT PIPELINE

**Trigger**: New query patterns or performance degradation
**Sequence**:

```
1. Database expert → Analyze query patterns
2. Query Context7 for indexing strategies
3. Identify missing or unused indexes
4. Create index with minimal lock strategy
5. test-runner → Verify performance improvement
6. Monitor index usage statistics
```

**PostgreSQL Index Management** (Context7: /websites/postgresql):
```sql
-- Create index concurrently (no table lock)
CREATE INDEX CONCURRENTLY idx_users_created_at ON users(created_at);

-- Identify unused indexes
SELECT
  schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Drop unused index
DROP INDEX CONCURRENTLY idx_old_unused;
```

**MongoDB Index Management** (Context7: /mongodb/docs):
```javascript
// Find index inconsistencies in sharded collections
db.collection.aggregate([
  {$indexStats: {}},
  {$group: {
    _id: "$name",
    shards: {$push: "$shard"},
    specs: {$push: {$objectToArray: {$ifNull: ["$spec", {}]}}}
  }},
  {$project: {
    missingFromShards: {$setDifference: ["$allShards", "$shards"]}
  }}
]);
```

## Pipeline Requirements

### NEVER ALLOWED

- ❌ Running migrations without backups
- ❌ Deploying unindexed queries to production
- ❌ Skipping rollback plan creation
- ❌ Ignoring query performance analysis
- ❌ Using SELECT * in production code
- ❌ Creating indexes without CONCURRENTLY (PostgreSQL)
- ❌ Modifying production schemas without testing

### ALWAYS REQUIRED

- ✅ Test migrations on dev first
- ✅ EXPLAIN ANALYZE for new queries
- ✅ Monitor query performance continuously
- ✅ Document schema changes in changelog
- ✅ Verify backup restoration regularly
- ✅ Use Context7 for best practice validation
- ✅ Implement connection pooling
- ✅ Set query timeouts
- ✅ Monitor database metrics

## Success Metrics

### Performance
- Query response time < 100ms for OLTP
- Query response time < 5s for OLAP
- Index hit ratio > 95% (PostgreSQL)
- Cache hit rate > 80% (Redis)

### Reliability
- Zero data loss during migrations
- Successful backup restoration test (monthly)
- Migration rollback success rate = 100%
- Replication lag < 1s

### Cost Optimization
- BigQuery: Queries stay within budget
- Cosmos DB: RU/s utilization 70-85%
- Unused index removal (quarterly review)
- Storage growth within projections

## Context7 Integration

All database operations should query Context7 for:
- Latest best practices for specific database versions
- Performance optimization techniques
- Security hardening guidelines
- Disaster recovery procedures

Example Context7 queries:
- `/websites/postgresql` - PostgreSQL indexing and optimization
- `/mongodb/docs` - MongoDB aggregation and sharding
- `/websites/redis_io` - Redis data structures and caching
- `/websites/cloud_google-bigquery` - BigQuery partitioning and clustering
- `/websites/learn_microsoft-en-us-azure-cosmos-db` - Cosmos DB consistency and partitioning
