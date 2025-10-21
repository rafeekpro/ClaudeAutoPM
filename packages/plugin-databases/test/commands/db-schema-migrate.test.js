#!/usr/bin/env node

/**
 * Test: db:schema-migrate command
 * Description: Tests for database schema migration command
 * Version: 1.0.0
 */

import path from 'path';
import fs from 'fs';

// Import implementation functions
import {
  generateMigration,
  generateMigrationFilename,
  createMigrationHistory,
  validateSafety,
  executeDryRun,
  validateOnStaging,
  trackMigration,
  rollbackToVersion
} from '../../lib/schema-migrate.js';

describe('db:schema-migrate command', () => {
  describe('Migration Generation', () => {
    describe('ADD COLUMN migrations', () => {
      it('should generate ADD COLUMN migration with default value', () => {
        const migration = generateMigration('users', 'add-column', {
          columnName: 'email_verified',
          columnType: 'boolean',
          defaultValue: 'false',
          nullable: false
        });

        expect(migration.up).toContain('ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false NOT NULL');
        expect(migration.down).toContain('ALTER TABLE users DROP COLUMN email_verified');
        expect(migration.safety.dataLossRisk).toBe('low');
        expect(migration.safety.breakingChange).toBe(false);
      });

      it('should generate ADD COLUMN migration for nullable column', () => {
        const migration = generateMigration('products', 'add-column', {
          columnName: 'description',
          columnType: 'TEXT',
          nullable: true
        });

        expect(migration.up).toContain('ALTER TABLE products ADD COLUMN description TEXT');
        expect(migration.down).toContain('ALTER TABLE products DROP COLUMN description');
        expect(migration.safety.dataLossRisk).toBe('low');
      });

      it('should warn about adding NOT NULL column without default to existing table', () => {
        const migration = generateMigration('orders', 'add-column', {
          columnName: 'total_amount',
          columnType: 'NUMERIC(10,2)',
          nullable: false,
          defaultValue: null
        });

        expect(migration.safety.dataLossRisk).toBe('high');
        expect(migration.safety.warnings).toContain('Adding NOT NULL column without default to existing table will fail if table has rows');
        expect(migration.safety.recommendation).toContain('Add DEFAULT value or make column nullable');
      });
    });

    describe('DROP COLUMN migrations', () => {
      it('should generate DROP COLUMN migration with archive recommendation', () => {
        const migration = generateMigration('users', 'drop-column', {
          columnName: 'legacy_field'
        });

        expect(migration.up).toContain('ALTER TABLE users DROP COLUMN legacy_field');
        expect(migration.down).toContain('-- Cannot restore dropped column - data lost permanently');
        expect(migration.safety.dataLossRisk).toBe('critical');
        expect(migration.safety.breakingChange).toBe(true);
        expect(migration.safety.warnings).toContain('Dropping column will permanently delete all data');
      });

      it('should suggest rename instead of drop for data preservation', () => {
        const migration = generateMigration('products', 'drop-column', {
          columnName: 'old_price'
        });

        expect(migration.safety.recommendation).toContain('Consider renaming to "ZZZ_old_price_deprecated_');
        expect(migration.safety.recommendation).toContain('to allow rollback');
      });

      it('should check for foreign key constraints before drop', () => {
        const migration = generateMigration('orders', 'drop-column', {
          columnName: 'user_id',
          hasForeignKey: true
        });

        expect(migration.safety.dataLossRisk).toBe('critical');
        expect(migration.safety.warnings).toContain('Column has foreign key constraint - must be dropped first');
      });
    });

    describe('RENAME COLUMN migrations', () => {
      it('should generate RENAME COLUMN migration for zero-downtime', () => {
        const migration = generateMigration('users', 'rename-column', {
          oldName: 'total_price',
          newName: 'total_amount'
        });

        expect(migration.up).toContain('ALTER TABLE users RENAME COLUMN total_price TO total_amount');
        expect(migration.down).toContain('ALTER TABLE users RENAME COLUMN total_amount TO total_price');
        expect(migration.safety.dataLossRisk).toBe('low');
        expect(migration.safety.breakingChange).toBe(true);
      });

      it('should warn about breaking changes for rename', () => {
        const migration = generateMigration('products', 'rename-column', {
          oldName: 'name',
          newName: 'product_name'
        });

        expect(migration.safety.breakingChange).toBe(true);
        expect(migration.safety.warnings).toContain('Renaming column will break existing queries and application code');
      });
    });

    describe('ADD INDEX migrations', () => {
      it('should generate concurrent index creation for PostgreSQL', () => {
        const migration = generateMigration('orders', 'add-index', {
          indexName: 'idx_orders_customer_id',
          columns: ['customer_id'],
          concurrent: true,
          database: 'postgresql'
        });

        expect(migration.up).toContain('CREATE INDEX CONCURRENTLY idx_orders_customer_id ON orders(customer_id)');
        expect(migration.down).toContain('DROP INDEX CONCURRENTLY IF EXISTS idx_orders_customer_id');
        expect(migration.safety.dataLossRisk).toBe('low');
        expect(migration.safety.lockingBehavior).toBe('non-blocking');
      });

      it('should generate composite index', () => {
        const migration = generateMigration('users', 'add-index', {
          indexName: 'idx_users_email_created',
          columns: ['email', 'created_at DESC'],
          concurrent: true,
          database: 'postgresql'
        });

        expect(migration.up).toContain('CREATE INDEX CONCURRENTLY idx_users_email_created ON users(email, created_at DESC)');
      });

      it('should generate partial index', () => {
        const migration = generateMigration('orders', 'add-index', {
          indexName: 'idx_orders_pending',
          columns: ['created_at'],
          where: "status = 'pending'",
          concurrent: true,
          database: 'postgresql'
        });

        expect(migration.up).toContain("CREATE INDEX CONCURRENTLY idx_orders_pending ON orders(created_at) WHERE status = 'pending'");
      });

      it('should generate GIN index for JSONB columns', () => {
        const migration = generateMigration('products', 'add-index', {
          indexName: 'idx_products_attributes',
          columns: ['attributes'],
          indexType: 'GIN',
          concurrent: true,
          database: 'postgresql'
        });

        expect(migration.up).toContain('CREATE INDEX CONCURRENTLY idx_products_attributes ON products USING GIN(attributes)');
      });

      it('should warn about index creation without CONCURRENTLY', () => {
        const migration = generateMigration('users', 'add-index', {
          indexName: 'idx_users_email',
          columns: ['email'],
          concurrent: false,
          database: 'postgresql'
        });

        expect(migration.safety.lockingBehavior).toBe('blocking');
        expect(migration.safety.warnings).toContain('Index creation will lock table - use CONCURRENTLY for production');
      });
    });

    describe('ADD CONSTRAINT migrations', () => {
      it('should generate foreign key constraint', () => {
        const migration = generateMigration('orders', 'add-constraint', {
          constraintName: 'fk_orders_user_id',
          constraintType: 'FOREIGN KEY',
          columns: ['user_id'],
          references: {
            table: 'users',
            column: 'id'
          }
        });

        expect(migration.up).toContain('ALTER TABLE orders ADD CONSTRAINT fk_orders_user_id FOREIGN KEY (user_id) REFERENCES users(id)');
        expect(migration.down).toContain('ALTER TABLE orders DROP CONSTRAINT fk_orders_user_id');
      });

      it('should generate unique constraint', () => {
        const migration = generateMigration('users', 'add-constraint', {
          constraintName: 'unique_email',
          constraintType: 'UNIQUE',
          columns: ['email']
        });

        expect(migration.up).toContain('ALTER TABLE users ADD CONSTRAINT unique_email UNIQUE (email)');
      });

      it('should generate check constraint', () => {
        const migration = generateMigration('products', 'add-constraint', {
          constraintName: 'check_price_positive',
          constraintType: 'CHECK',
          expression: 'price >= 0'
        });

        expect(migration.up).toContain('ALTER TABLE products ADD CONSTRAINT check_price_positive CHECK (price >= 0)');
      });
    });
  });

  describe('MongoDB Migrations', () => {
    it('should generate MongoDB schema validation migration', () => {
      const migration = generateMigration('users', 'add-validation', {
        database: 'mongodb',
        validationRules: {
          $jsonSchema: {
            required: ['email'],
            properties: {
              email: { type: 'string', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' }
            }
          }
        }
      });

      expect(migration.up).toContain('db.runCommand');
      expect(migration.up).toContain('collMod');
      expect(migration.up).toContain('validator');
    });

    it('should generate MongoDB index creation', () => {
      const migration = generateMigration('products', 'add-index', {
        database: 'mongodb',
        indexName: 'idx_category_created',
        keys: { category: 1, created_at: -1 }
      });

      expect(migration.up).toContain('db.products.createIndex');
      expect(migration.up).toContain('category');
      expect(migration.up).toContain('created_at');
      expect(migration.down).toContain('db.products.dropIndex("idx_category_created")');
    });
  });

  describe('Migration Versioning', () => {
    it('should generate timestamped migration filename', () => {
      const filename = generateMigrationFilename('add_email_verified_to_users');

      expect(filename).toMatch(/^\d{14}_add_email_verified_to_users\.sql$/);
    });

    it('should create migration history entry', () => {
      const historyEntry = createMigrationHistory({
        version: '20250121120000',
        description: 'add_email_verified_to_users',
        appliedAt: new Date(),
        status: 'success'
      });

      expect(historyEntry.version).toBe('20250121120000');
      expect(historyEntry.description).toBe('add_email_verified_to_users');
      expect(historyEntry.status).toBe('success');
    });
  });

  describe('Safety Validation', () => {
    it('should detect data loss risk for DROP COLUMN', () => {
      const safety = validateSafety({
        operation: 'drop-column',
        table: 'users',
        column: 'old_field'
      });

      expect(safety.dataLossRisk).toBe('critical');
      expect(safety.requiresConfirmation).toBe(true);
    });

    it('should detect breaking changes for RENAME COLUMN', () => {
      const safety = validateSafety({
        operation: 'rename-column',
        table: 'products',
        oldName: 'name',
        newName: 'product_name'
      });

      expect(safety.breakingChange).toBe(true);
      expect(safety.requiresCodeUpdate).toBe(true);
    });

    it('should validate NOT NULL constraint on existing data', () => {
      const safety = validateSafety({
        operation: 'add-column',
        table: 'orders',
        columnName: 'tracking_number',
        nullable: false,
        defaultValue: null,
        tableHasRows: true
      });

      expect(safety.dataLossRisk).toBe('high');
      expect(safety.cannotExecute).toBe(true);
    });
  });

  describe('Rollback Generation', () => {
    it('should generate rollback script for ADD COLUMN', () => {
      const migration = generateMigration('users', 'add-column', {
        columnName: 'phone',
        columnType: 'VARCHAR(20)'
      });

      expect(migration.down).toContain('ALTER TABLE users DROP COLUMN phone');
      expect(migration.safety.rollbackSafe).toBe(true);
    });

    it('should generate rollback script for ADD INDEX', () => {
      const migration = generateMigration('orders', 'add-index', {
        indexName: 'idx_orders_status',
        columns: ['status']
      });

      expect(migration.down).toContain('DROP INDEX');
      expect(migration.safety.rollbackSafe).toBe(true);
    });

    it('should warn when rollback is not possible', () => {
      const migration = generateMigration('products', 'drop-column', {
        columnName: 'legacy_data'
      });

      expect(migration.safety.rollbackSafe).toBe(false);
      expect(migration.down).toContain('-- Cannot restore dropped column');
    });
  });

  describe('Dry Run Mode', () => {
    it('should execute dry run without applying changes', () => {
      const result = executeDryRun({
        migration: 'add_email_verified_to_users',
        target: 'staging'
      });

      expect(result.applied).toBe(false);
      expect(result.sqlGenerated).toBeTruthy();
      expect(result.validationResults).toBeDefined();
    });

    it('should validate migration on staging database', () => {
      const result = validateOnStaging({
        migration: 'add_index_orders_customer',
        database: 'staging'
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Migration Execution', () => {
    it('should track migration in schema_migrations table', () => {
      const tracking = trackMigration({
        version: '20250121120000',
        description: 'add_email_verified',
        status: 'applied'
      });

      expect(tracking.inserted).toBe(true);
      expect(tracking.version).toBe('20250121120000');
    });

    it('should rollback to specific version', () => {
      const rollback = rollbackToVersion('20250121110000');

      expect(rollback.targetVersion).toBe('20250121110000');
      expect(rollback.migrationsToRollback).toBeGreaterThan(0);
    });
  });
});

// Implementation functions are imported from lib/schema-migrate.js
