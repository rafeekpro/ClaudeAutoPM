---
name: sqlite-mcp
command: npx
args: ["@modelcontextprotocol/server-sqlite"]
env:
  SQLITE_DATABASE: "${SQLITE_DATABASE:-./database.db}"
  SQLITE_READONLY: "${SQLITE_READONLY:-false}"
envFile: .claude/.env
description: SQLite database server for local data operations
category: database
status: active
version: ">=1.0.0"
---

# SQLite MCP Server

## Description

The SQLite MCP Server provides database operations through the Model Context Protocol, enabling SQL queries, schema management, and data manipulation for SQLite databases. Perfect for local development, testing, and lightweight data storage needs.

## Features

- **SQL Operations**: Full SQL query support
- **Schema Management**: Create, alter, drop tables
- **Transaction Support**: ACID compliance
- **Query Builder**: Programmatic query construction
- **Migration Support**: Database versioning
- **Backup/Restore**: Database backup operations
- **Performance**: Query optimization and indexing

## Configuration

### Environment Variables

- `SQLITE_DATABASE`: Path to SQLite database file
- `SQLITE_READONLY`: Enable read-only mode (true/false)
- `SQLITE_WAL_MODE`: Enable Write-Ahead Logging (true/false)
- `SQLITE_FOREIGN_KEYS`: Enable foreign key constraints (true/false)
- `SQLITE_BUSY_TIMEOUT`: Busy timeout in milliseconds

## Usage Examples

### Basic Setup

```bash
# Enable the server
autopm mcp enable sqlite-mcp

# Configure database path
echo "SQLITE_DATABASE=./project.db" >> .claude/.env

# Sync configuration
autopm mcp sync
```

### Memory Database

```bash
# For testing with in-memory database
echo "SQLITE_DATABASE=:memory:" >> .claude/.env
```

### Read-Only Access

```bash
# For safe data exploration
echo "SQLITE_READONLY=true" >> .claude/.env
echo "SQLITE_DATABASE=/data/production.db" >> .claude/.env
```

## MCP Commands

### Query Operations

```javascript
// Execute query
sqlite.query({
  sql: "SELECT * FROM users WHERE active = ?",
  params: [true]
})

// Insert data
sqlite.insert({
  table: "users",
  data: {
    name: "John Doe",
    email: "john@example.com",
    active: true
  }
})

// Update data
sqlite.update({
  table: "users",
  data: { active: false },
  where: { id: 123 }
})

// Delete data
sqlite.delete({
  table: "users",
  where: { id: 123 }
})
```

### Schema Operations

```javascript
// Create table
sqlite.createTable({
  name: "users",
  columns: {
    id: "INTEGER PRIMARY KEY AUTOINCREMENT",
    name: "TEXT NOT NULL",
    email: "TEXT UNIQUE",
    created_at: "DATETIME DEFAULT CURRENT_TIMESTAMP"
  }
})

// Add index
sqlite.createIndex({
  name: "idx_users_email",
  table: "users",
  columns: ["email"],
  unique: true
})

// Get schema
sqlite.getSchema({ table: "users" })
```

### Transaction Operations

```javascript
// Begin transaction
sqlite.beginTransaction()

// Execute multiple operations
sqlite.query({ sql: "INSERT INTO users ..." })
sqlite.query({ sql: "UPDATE products ..." })

// Commit or rollback
sqlite.commit()
// or
sqlite.rollback()
```

## Common Use Cases

### Project Database

```sql
-- Tasks table
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK(status IN ('pending', 'in_progress', 'completed')),
  priority INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updated_at
CREATE TRIGGER update_tasks_timestamp
AFTER UPDATE ON tasks
BEGIN
  UPDATE tasks SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;
```

### Analytics Database

```sql
-- Events table
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  user_id INTEGER,
  metadata JSON,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Aggregation view
CREATE VIEW daily_events AS
SELECT
  DATE(timestamp) as date,
  event_type,
  COUNT(*) as count
FROM events
GROUP BY DATE(timestamp), event_type;
```

## Query Builder

```javascript
// Select with conditions
sqlite.select({
  table: "users",
  columns: ["id", "name", "email"],
  where: { active: true },
  orderBy: { created_at: "DESC" },
  limit: 10
})

// Join query
sqlite.join({
  tables: ["users u", "orders o"],
  on: "u.id = o.user_id",
  where: { "u.active": true },
  select: ["u.name", "COUNT(o.id) as order_count"],
  groupBy: ["u.id"]
})
```

## Migration System

```javascript
// Create migration
sqlite.migrate({
  version: "001",
  up: `
    CREATE TABLE settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `,
  down: `DROP TABLE settings;`
})

// Check migration status
sqlite.getMigrationStatus()

// Run migrations
sqlite.runMigrations()
```

## Performance Optimization

### Indexing Strategy

```sql
-- Single column index
CREATE INDEX idx_users_email ON users(email);

-- Composite index
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);

-- Partial index
CREATE INDEX idx_active_users ON users(email) WHERE active = 1;
```

### Query Optimization

```javascript
// Analyze query plan
sqlite.explain({
  sql: "SELECT * FROM users WHERE email = ?"
})

// Vacuum database
sqlite.vacuum()

// Analyze statistics
sqlite.analyze()
```

## Backup and Restore

```javascript
// Backup database
sqlite.backup({
  destination: "./backup/database_backup.db"
})

// Restore from backup
sqlite.restore({
  source: "./backup/database_backup.db"
})

// Export as SQL
sqlite.export({
  format: "sql",
  output: "./export/database.sql"
})
```

## Security Considerations

1. **SQL Injection**: Use parameterized queries
2. **Access Control**: Configure read-only when appropriate
3. **Encryption**: Use SQLite encryption extensions if needed
4. **Backup Security**: Secure backup files
5. **Connection Limits**: Configure appropriate limits

## Best Practices

1. **Use Transactions**: Group related operations
2. **Index Properly**: Create indexes for frequent queries
3. **Normalize Data**: Follow database normalization rules
4. **Regular Backups**: Implement backup strategy
5. **Monitor Size**: Track database growth

## Troubleshooting

### Common Issues

1. **Database Locked**
   - Increase SQLITE_BUSY_TIMEOUT
   - Check for long-running transactions
   - Enable WAL mode

2. **Performance Issues**
   - Run ANALYZE command
   - Check query plans with EXPLAIN
   - Add appropriate indexes

3. **Corruption**
   - Run integrity check
   - Restore from backup
   - Use VACUUM to rebuild

### Debug Mode

```bash
export SQLITE_DEBUG=true
export SQLITE_TRACE=true
```

## Integration with Agents

Commonly used with:
- `code-analyzer` - For storing analysis results
- `test-runner` - For test data management
- `python-backend-engineer` - For data operations

## Data Types

### SQLite Type Affinity

- **TEXT**: String data
- **INTEGER**: Whole numbers
- **REAL**: Floating point
- **BLOB**: Binary data
- **NULL**: Null values

### JSON Support

```sql
-- Store JSON
INSERT INTO config (data) VALUES (json('{"key": "value"}'));

-- Query JSON
SELECT json_extract(data, '$.key') FROM config;

-- Update JSON
UPDATE config SET data = json_set(data, '$.key', 'new_value');
```

## Version History

- **1.0.0**: Initial MCP integration
- **1.1.0**: Transaction support
- **1.2.0**: Query builder
- **1.3.0**: Migration system
- **1.4.0**: JSON support

## Related Resources

- [SQLite Documentation](https://sqlite.org/docs.html)
- [SQL Tutorial](https://www.sqlite.org/lang.html)
- [Database Best Practices](../guides/database-best-practices.md)