# Rule: Database Management Strategy

This document outlines the required strategy for managing databases across all project environments, incorporating Context7-verified best practices for PostgreSQL, MongoDB, Redis, BigQuery, and Cosmos DB.

| Environment         | Tool / Service                  | Lifecycle / Purpose                 | Data Source                               | Persistence               |
| ------------------- | ------------------------------- | ----------------------------------- | ----------------------------------------- | ------------------------- |
| **Local (Dev)** | `docker-compose`                | Long-running, per-developer         | Migrations + Developer Seeds              | **Yes** (Named Volume)    |
| **CI/CD (Tests)** | `kubectl run`                   | **Ephemeral**, per-PR/commit        | Migrations + Test Seeds                   | **No** (Clean for every run) |
| **Staging** | Managed Cloud DB (e.g., RDS)    | Long-running, shared by team        | Sanitized/Anonymized Production Dump      | **Yes** (Persistent)      |
| **Production** | Managed Cloud DB (High-Availability) | Long-running, critical user data    | Live User Data                            | **Yes** (HA + Backups)    |

## Key Principles

### 1. Local Development
- Use a named Docker volume to persist data between `docker compose up/down` cycles
- PostgreSQL: Use official image with version pinning
- MongoDB: Use named volumes for `/data/db`
- Redis: Use AOF (Append-Only File) for persistence in dev

### 2. CI/CD Testing
- Database MUST be created from scratch for every test run
- DO NOT use persistent volumes in CI for perfect isolation
- Use lightweight containers for speed (Alpine-based images)
- Implement health checks before running tests

### 3. Staging Environment
- Schema must be an exact mirror of production
- Data should be a recent, anonymized copy of production data
- Use automated refresh scripts for staging data
- Test backup/restore procedures regularly

### 4. Production Best Practices

#### PostgreSQL (Context7: /websites/postgresql)
- Use B-tree indexes for equality and range queries
- Implement partial indexes for filtered queries
- Use `EXPLAIN ANALYZE` for query optimization
- Monitor `pg_stat_user_indexes` for index usage

#### MongoDB (Context7: /mongodb/docs)
- Implement proper sharding strategies for scale
- Use aggregation pipeline for complex queries
- Monitor index inconsistencies with `$indexStats`
- Use compound indexes in query filter order

#### Redis (Context7: /websites/redis_io)
- Implement client-side caching patterns
- Use appropriate data structures (Hash, Set, Sorted Set)
- Configure AOF + RDB for persistence
- Monitor memory usage and implement eviction policies

#### Azure Cosmos DB (Context7: /websites/learn_microsoft-en-us-azure-cosmos-db)
- Choose appropriate consistency level (Session for most cases)
- Design partition keys for even distribution
- Use TTL for automatic data expiration
- Monitor RU/s consumption and optimize queries

#### BigQuery (Context7: /websites/cloud_google-bigquery)
- Partition tables by date/timestamp for query performance
- Cluster tables by commonly filtered columns
- Use `_PARTITIONTIME` for efficient partition pruning
- Monitor costs with `INFORMATION_SCHEMA.TABLE_STORAGE`

### 5. Migration Strategy
- All schema changes MUST be handled by migration tools:
  - PostgreSQL: Alembic, Flyway, or native migrations
  - MongoDB: migrate-mongo or custom scripts
  - BigQuery: Declarative schema with version control
- No manual `ALTER TABLE` or schema modifications
- Always include rollback procedures

### 6. Backup and Recovery
- **PostgreSQL**: pg_dump with custom format, point-in-time recovery
- **MongoDB**: mongodump with --oplog for consistency
- **Redis**: RDB snapshots + AOF for durability
- **Cosmos DB**: Automatic backups with configurable retention
- **BigQuery**: Table snapshots and time travel queries

### 7. Performance Monitoring
- Track slow queries across all database systems
- Monitor connection pool utilization
- Implement alerting for query timeout
- Use database-specific monitoring tools:
  - PostgreSQL: pg_stat_statements
  - MongoDB: Database Profiler
  - Redis: INFO command, redis-cli --stat
  - BigQuery: Query execution details
  - Cosmos DB: Request unit metrics

## Context7-Verified Patterns

### PostgreSQL Indexing
```sql
-- B-tree for equality and range
CREATE INDEX idx_users_email ON users(email);

-- Partial index for filtered queries
CREATE INDEX idx_orders_pending ON orders(order_date)
WHERE status = 'pending';

-- Covering index with INCLUDE
CREATE INDEX idx_orders_customer ON orders(customer_id)
INCLUDE (order_date, amount);
```

### MongoDB Aggregation
```javascript
// Check for index inconsistencies in sharded collections
db.collection.aggregate([
  {$indexStats: {}},
  {$group: {_id: null, indexDoc: {$push: "$$ROOT"}, allShards: {$addToSet: "$shard"}}}
]);
```

### Redis Caching Pattern
```redis
# Client-side caching with placeholder
SET foo "caching-in-progress"
GET foo
# Replace with actual value after computation
```

### BigQuery Partitioning
```sql
CREATE TABLE my_table (
  id INT64,
  event_timestamp TIMESTAMP,
  category STRING
)
PARTITION BY DATE(event_timestamp)
CLUSTER BY category;
```

### Cosmos DB Partitioning
```json
{
  "partitionKey": {
    "paths": ["/userId"],
    "kind": "Hash"
  }
}
```

## Compliance

All database operations must follow these strategies. Deviations require architectural review and documentation in CLAUDE.md.
