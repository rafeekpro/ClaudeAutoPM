/**
 * Tests for /data:lineage-track command
 *
 * Following TDD methodology - tests written BEFORE implementation
 * Context7-verified patterns for data lineage tracking
 */

const {
  extractLineage,
  parseSQL,
  parsedbt,
  parseAirflow,
  parseSpark,
  buildGraph,
  analyzeImpact,
  generateOpenLineageEvent,
  visualizeGraph,
  publishToCatalog,
  trackColumnLineage,
  validateOpenLineageSchema,
  discoverLineage,
  calculateImpactRadius,
  generateComplianceReport,
  versionLineage,
  mergeLineageGraphs
} = require('../../lib/lineage-track');

describe('/data:lineage-track command', () => {

  // ===================================================================
  // LINEAGE EXTRACTION TESTS
  // ===================================================================

  describe('Lineage Extraction', () => {
    test('should extract lineage from SQL queries', () => {
      const sql = `
        INSERT INTO target_table
        SELECT a.id, b.name
        FROM source_table_a a
        JOIN source_table_b b ON a.id = b.id
      `;

      const lineage = parseSQL(sql);

      expect(lineage).toHaveProperty('inputs');
      expect(lineage).toHaveProperty('outputs');
      expect(lineage.inputs).toContain('source_table_a');
      expect(lineage.inputs).toContain('source_table_b');
      expect(lineage.outputs).toContain('target_table');
    });

    test('should extract lineage from Spark jobs', () => {
      const sparkCode = `
        val df1 = spark.read.parquet("s3://data/source1")
        val df2 = spark.read.parquet("s3://data/source2")
        val result = df1.join(df2, "id")
        result.write.parquet("s3://data/output")
      `;

      const lineage = parseSpark(sparkCode);

      expect(lineage.inputs).toContain('s3://data/source1');
      expect(lineage.inputs).toContain('s3://data/source2');
      expect(lineage.outputs).toContain('s3://data/output');
    });

    test('should extract lineage from dbt models', () => {
      const dbtModel = {
        name: 'customer_orders',
        sql: `
          SELECT * FROM {{ ref('customers') }}
          JOIN {{ source('raw', 'orders') }} USING (customer_id)
        `,
        refs: ['customers'],
        sources: [{ name: 'raw.orders' }]
      };

      const lineage = parsedbt(dbtModel);

      expect(lineage.inputs).toContain('customers');
      expect(lineage.inputs).toContain('raw.orders');
      expect(lineage.outputs).toContain('customer_orders');
    });

    test('should extract lineage from Airflow DAGs', () => {
      const dagDefinition = {
        dag_id: 'etl_pipeline',
        tasks: [
          { task_id: 'extract', inputs: ['source_db.users'], outputs: ['staging.users'] },
          { task_id: 'transform', inputs: ['staging.users'], outputs: ['prod.users'] }
        ]
      };

      const lineage = parseAirflow(dagDefinition);

      expect(lineage.datasets).toHaveLength(3);
      expect(lineage.transformations).toHaveLength(2);
    });

    test('should handle complex transformations', () => {
      const complexSQL = `
        WITH base AS (
          SELECT * FROM table_a
        ),
        joined AS (
          SELECT b.*, a.col FROM table_b b
          JOIN base a ON b.id = a.id
        )
        SELECT * INTO target FROM joined
      `;

      const lineage = parseSQL(complexSQL);

      expect(lineage.inputs).toContain('table_a');
      expect(lineage.inputs).toContain('table_b');
      expect(lineage.outputs).toContain('target');
      expect(lineage.ctes).toContain('base');
      expect(lineage.ctes).toContain('joined');
    });

    test('should extract from multiple source types', () => {
      const sources = [
        { type: 'sql', content: 'SELECT * FROM table_a' },
        { type: 'dbt', content: { refs: ['table_b'] } }
      ];

      const lineage = extractLineage(sources);

      expect(lineage.datasets.size).toBeGreaterThan(0);
      expect(lineage.sources).toEqual(['sql', 'dbt']);
    });
  });

  // ===================================================================
  // OPENLINEAGE COMPLIANCE TESTS
  // ===================================================================

  describe('OpenLineage Compliance', () => {
    test('should generate OpenLineage events', () => {
      const run = {
        runId: 'run-123',
        jobName: 'etl_job',
        jobNamespace: 'prod'
      };

      const datasets = [
        { name: 'input_table', namespace: 'postgres://db' },
        { name: 'output_table', namespace: 'postgres://db' }
      ];

      const event = generateOpenLineageEvent(run, datasets);

      expect(event).toHaveProperty('eventType');
      expect(event).toHaveProperty('eventTime');
      expect(event).toHaveProperty('run');
      expect(event).toHaveProperty('job');
      expect(event).toHaveProperty('inputs');
      expect(event).toHaveProperty('outputs');
    });

    test('should validate OpenLineage schema', () => {
      const validEvent = {
        eventType: 'START',
        eventTime: '2025-01-01T00:00:00Z',
        run: { runId: '123' },
        job: { namespace: 'prod', name: 'job' },
        inputs: [],
        outputs: []
      };

      expect(() => validateOpenLineageSchema(validEvent)).not.toThrow();
    });

    test('should include run facets', () => {
      const event = generateOpenLineageEvent({
        runId: '123',
        jobName: 'job',
        facets: {
          nominalTime: { nominalStartTime: '2025-01-01T00:00:00Z' }
        }
      }, []);

      expect(event.run.facets).toHaveProperty('nominalTime');
    });

    test('should include dataset facets', () => {
      const datasets = [{
        name: 'table',
        namespace: 'postgres://db',
        facets: {
          schema: {
            fields: [
              { name: 'id', type: 'INTEGER' },
              { name: 'name', type: 'VARCHAR' }
            ]
          }
        }
      }];

      const event = generateOpenLineageEvent({ runId: '123', jobName: 'job' }, datasets);

      expect(event.inputs[0].facets).toHaveProperty('schema');
      expect(event.inputs[0].facets.schema.fields).toHaveLength(2);
    });

    test('should support different event types', () => {
      const eventTypes = ['START', 'RUNNING', 'COMPLETE', 'FAIL', 'ABORT'];

      eventTypes.forEach(type => {
        const event = generateOpenLineageEvent(
          { runId: '123', jobName: 'job', eventType: type },
          []
        );

        expect(event.eventType).toBe(type);
      });
    });
  });

  // ===================================================================
  // COLUMN-LEVEL LINEAGE TESTS
  // ===================================================================

  describe('Column-Level Lineage', () => {
    test('should track column transformations', () => {
      const sql = `
        SELECT
          a.customer_id,
          a.first_name || ' ' || a.last_name as full_name,
          b.order_total
        FROM customers a
        JOIN orders b ON a.id = b.customer_id
      `;

      const columnLineage = trackColumnLineage(sql);

      expect(columnLineage).toHaveProperty('full_name');
      expect(columnLineage.full_name.sources).toContain('customers.first_name');
      expect(columnLineage.full_name.sources).toContain('customers.last_name');
    });

    test('should map column dependencies', () => {
      const lineage = trackColumnLineage(`
        SELECT
          col_a as renamed_col,
          col_b + col_c as computed_col
        FROM source_table
      `);

      expect(lineage.renamed_col.sources).toEqual(['source_table.col_a']);
      expect(lineage.computed_col.sources).toContain('source_table.col_b');
      expect(lineage.computed_col.sources).toContain('source_table.col_c');
    });

    test('should handle column renaming', () => {
      const lineage = trackColumnLineage(`
        SELECT id, name as customer_name FROM customers
      `);

      expect(lineage.customer_name.sources).toEqual(['customers.name']);
      expect(lineage.customer_name.transformation).toBe('rename');
    });

    test('should track aggregations', () => {
      const lineage = trackColumnLineage(`
        SELECT
          customer_id,
          COUNT(*) as order_count,
          SUM(total) as total_spent
        FROM orders
        GROUP BY customer_id
      `);

      expect(lineage.order_count.transformation).toBe('aggregation');
      expect(lineage.total_spent.transformation).toBe('aggregation');
      expect(lineage.total_spent.sources).toContain('orders.total');
    });

    test('should handle nested column transformations', () => {
      const lineage = trackColumnLineage(`
        SELECT
          UPPER(TRIM(first_name)) as clean_name
        FROM customers
      `);

      expect(lineage.clean_name.sources).toContain('customers.first_name');
      expect(lineage.clean_name.transformations).toContain('TRIM');
      expect(lineage.clean_name.transformations).toContain('UPPER');
    });
  });

  // ===================================================================
  // GRAPH CONSTRUCTION TESTS
  // ===================================================================

  describe('Graph Construction', () => {
    test('should build lineage graph', () => {
      const lineageData = {
        datasets: ['table_a', 'table_b', 'table_c'],
        transformations: [
          { inputs: ['table_a', 'table_b'], outputs: ['table_c'] }
        ]
      };

      const graph = buildGraph(lineageData);

      expect(graph.nodes).toHaveLength(3);
      expect(graph.edges).toHaveLength(2);
    });

    test('should identify nodes (datasets)', () => {
      const graph = buildGraph({
        datasets: ['customers', 'orders', 'customer_orders']
      });

      expect(graph.nodes.map(n => n.id)).toContain('customers');
      expect(graph.nodes.map(n => n.id)).toContain('orders');
      expect(graph.nodes.map(n => n.id)).toContain('customer_orders');
    });

    test('should identify edges (transformations)', () => {
      const graph = buildGraph({
        transformations: [
          { inputs: ['a'], outputs: ['b'], type: 'sql' },
          { inputs: ['b'], outputs: ['c'], type: 'spark' }
        ]
      });

      expect(graph.edges).toHaveLength(2);
      expect(graph.edges[0].source).toBe('a');
      expect(graph.edges[0].target).toBe('b');
      expect(graph.edges[1].source).toBe('b');
      expect(graph.edges[1].target).toBe('c');
    });

    test('should handle circular dependencies', () => {
      const lineageData = {
        transformations: [
          { inputs: ['a'], outputs: ['b'] },
          { inputs: ['b'], outputs: ['c'] },
          { inputs: ['c'], outputs: ['a'] }  // Creates cycle
        ]
      };

      const graph = buildGraph(lineageData);

      expect(graph.hasCycles).toBe(true);
      expect(graph.cycles).toHaveLength(1);
      expect(graph.cycles[0]).toContain('a');
    });

    test('should merge multiple lineage graphs', () => {
      const graph1 = buildGraph({
        datasets: ['a', 'b'],
        transformations: [{ inputs: ['a'], outputs: ['b'] }]
      });

      const graph2 = buildGraph({
        datasets: ['b', 'c'],
        transformations: [{ inputs: ['b'], outputs: ['c'] }]
      });

      const merged = mergeLineageGraphs([graph1, graph2]);

      expect(merged.nodes).toHaveLength(3);
      expect(merged.edges).toHaveLength(2);
    });
  });

  // ===================================================================
  // IMPACT ANALYSIS TESTS
  // ===================================================================

  describe('Impact Analysis', () => {
    test('should find upstream dependencies', () => {
      const graph = buildGraph({
        transformations: [
          { inputs: ['raw.users'], outputs: ['staging.users'] },
          { inputs: ['staging.users'], outputs: ['prod.users'] }
        ]
      });

      const upstream = analyzeImpact(graph, 'prod.users', 'upstream');

      expect(upstream).toContain('staging.users');
      expect(upstream).toContain('raw.users');
    });

    test('should find downstream dependencies', () => {
      const graph = buildGraph({
        transformations: [
          { inputs: ['raw.users'], outputs: ['staging.users'] },
          { inputs: ['staging.users'], outputs: ['prod.users'] },
          { inputs: ['prod.users'], outputs: ['analytics.user_metrics'] }
        ]
      });

      const downstream = analyzeImpact(graph, 'raw.users', 'downstream');

      expect(downstream).toContain('staging.users');
      expect(downstream).toContain('prod.users');
      expect(downstream).toContain('analytics.user_metrics');
    });

    test('should calculate impact radius', () => {
      const graph = buildGraph({
        transformations: [
          { inputs: ['a'], outputs: ['b'] },
          { inputs: ['b'], outputs: ['c'] },
          { inputs: ['c'], outputs: ['d'] }
        ]
      });

      const radius = calculateImpactRadius(graph, 'a', 'downstream');

      expect(radius).toBe(3); // Affects b, c, d
    });

    test('should identify affected systems', () => {
      const graph = buildGraph({
        datasets: [
          { name: 'source', system: 'postgres' },
          { name: 'intermediate', system: 'spark' },
          { name: 'target', system: 'bigquery' }
        ],
        transformations: [
          { inputs: ['source'], outputs: ['intermediate'] },
          { inputs: ['intermediate'], outputs: ['target'] }
        ]
      });

      const impact = analyzeImpact(graph, 'source', 'downstream');

      expect(impact.affectedSystems).toContain('spark');
      expect(impact.affectedSystems).toContain('bigquery');
    });

    test('should handle both upstream and downstream analysis', () => {
      const graph = buildGraph({
        transformations: [
          { inputs: ['a'], outputs: ['b'] },
          { inputs: ['b'], outputs: ['c'] }
        ]
      });

      const upstreamB = analyzeImpact(graph, 'b', 'upstream');
      const downstreamB = analyzeImpact(graph, 'b', 'downstream');

      expect(upstreamB).toContain('a');
      expect(downstreamB).toContain('c');
    });
  });

  // ===================================================================
  // VISUALIZATION TESTS
  // ===================================================================

  describe('Visualization', () => {
    test('should generate DOT format', () => {
      const graph = buildGraph({
        datasets: ['a', 'b'],
        transformations: [{ inputs: ['a'], outputs: ['b'] }]
      });

      const dot = visualizeGraph(graph, 'dot');

      expect(dot).toContain('digraph');
      expect(dot).toContain('"a" -> "b"');
    });

    test('should generate Mermaid diagrams', () => {
      const graph = buildGraph({
        datasets: ['customers', 'orders'],
        transformations: [{ inputs: ['customers'], outputs: ['orders'] }]
      });

      const mermaid = visualizeGraph(graph, 'mermaid');

      expect(mermaid).toContain('graph LR');
      expect(mermaid).toContain('customers --> orders');
    });

    test('should create interactive graphs', () => {
      const graph = buildGraph({
        datasets: ['a', 'b', 'c'],
        transformations: [
          { inputs: ['a'], outputs: ['b'] },
          { inputs: ['b'], outputs: ['c'] }
        ]
      });

      const interactive = visualizeGraph(graph, 'interactive');

      expect(interactive).toHaveProperty('nodes');
      expect(interactive).toHaveProperty('edges');
      expect(interactive.format).toBe('json');
    });

    test('should highlight critical paths', () => {
      const graph = buildGraph({
        datasets: [
          { name: 'a', critical: false },
          { name: 'b', critical: true },
          { name: 'c', critical: true }
        ],
        transformations: [
          { inputs: ['a'], outputs: ['b'] },
          { inputs: ['b'], outputs: ['c'] }
        ]
      });

      const visualization = visualizeGraph(graph, 'dot', { highlightCritical: true });

      expect(visualization).toContain('color=red');
    });

    test('should support different layout algorithms', () => {
      const graph = buildGraph({
        datasets: ['a', 'b', 'c'],
        transformations: [
          { inputs: ['a'], outputs: ['b'] },
          { inputs: ['a'], outputs: ['c'] }
        ]
      });

      const layouts = ['hierarchical', 'force-directed', 'circular'];

      layouts.forEach(layout => {
        const viz = visualizeGraph(graph, 'interactive', { layout });
        expect(viz.layout).toBe(layout);
      });
    });
  });

  // ===================================================================
  // DATA CATALOG INTEGRATION TESTS
  // ===================================================================

  describe('Data Catalog Integration', () => {
    test('should publish to Apache Atlas', async () => {
      const lineage = {
        datasets: ['table_a', 'table_b'],
        transformations: [{ inputs: ['table_a'], outputs: ['table_b'] }]
      };

      const result = await publishToCatalog(lineage, 'atlas', {
        url: 'http://atlas:21000',
        username: 'admin'
      });

      expect(result.success).toBe(true);
      expect(result.entitiesCreated).toBeGreaterThan(0);
    });

    test('should publish to DataHub', async () => {
      const lineage = {
        datasets: ['dataset1', 'dataset2'],
        transformations: [{ inputs: ['dataset1'], outputs: ['dataset2'] }]
      };

      const result = await publishToCatalog(lineage, 'datahub', {
        server: 'http://datahub:8080'
      });

      expect(result.success).toBe(true);
      expect(result.graphCreated).toBe(true);
    });

    test('should sync metadata', async () => {
      const lineage = {
        datasets: [
          {
            name: 'table_a',
            metadata: {
              owner: 'data_team',
              tags: ['pii', 'customer'],
              description: 'Customer data'
            }
          }
        ]
      };

      const result = await publishToCatalog(lineage, 'atlas', { syncMetadata: true });

      expect(result.metadataSynced).toBe(true);
    });

    test('should handle catalog authentication', async () => {
      const credentials = {
        url: 'http://atlas:21000',
        username: 'admin',
        password: 'secret',
        authType: 'basic'
      };

      const result = await publishToCatalog({}, 'atlas', credentials);

      expect(result.authenticated).toBe(true);
    });
  });

  // ===================================================================
  // COMPLIANCE TESTS
  // ===================================================================

  describe('Compliance', () => {
    test('should trace PII data flow', () => {
      const graph = buildGraph({
        datasets: [
          { name: 'users', tags: ['pii'] },
          { name: 'analytics', tags: [] }
        ],
        transformations: [
          { inputs: ['users'], outputs: ['analytics'] }
        ]
      });

      const piiFlow = generateComplianceReport(graph, 'pii');

      expect(piiFlow.sourceDatasets).toContain('users');
      expect(piiFlow.affectedDatasets).toContain('analytics');
    });

    test('should generate GDPR reports', () => {
      const graph = buildGraph({
        datasets: [
          { name: 'eu_customers', region: 'eu', pii: true },
          { name: 'customer_analytics', region: 'us' }
        ],
        transformations: [
          { inputs: ['eu_customers'], outputs: ['customer_analytics'] }
        ]
      });

      const gdprReport = generateComplianceReport(graph, 'gdpr');

      expect(gdprReport.crossBorderTransfers).toHaveLength(1);
      expect(gdprReport.dataSubjects).toContain('eu_customers');
    });

    test('should track data retention', () => {
      const graph = buildGraph({
        datasets: [
          { name: 'raw_data', retention: 30 },
          { name: 'processed_data', retention: 90 },
          { name: 'archived_data', retention: 365 }
        ]
      });

      const retentionReport = generateComplianceReport(graph, 'retention');

      expect(retentionReport.policies).toHaveLength(3);
      expect(retentionReport.maxRetention).toBe(365);
    });

    test('should identify compliance violations', () => {
      const graph = buildGraph({
        datasets: [
          { name: 'pii_data', tags: ['pii'], encrypted: false }
        ]
      });

      const report = generateComplianceReport(graph, 'security');

      expect(report.violations).toHaveLength(1);
      expect(report.violations[0].type).toBe('unencrypted_pii');
    });
  });

  // ===================================================================
  // AUTOMATED LINEAGE DISCOVERY TESTS
  // ===================================================================

  describe('Automated Lineage Discovery', () => {
    test('should discover lineage from code repository', async () => {
      const repoPath = '/path/to/repo';
      const patterns = ['**/*.sql', '**/*.py'];

      const discovered = await discoverLineage(repoPath, patterns);

      expect(discovered.datasets).toBeDefined();
      expect(discovered.transformations).toBeDefined();
    });

    test('should scan multiple file types', async () => {
      const discovered = await discoverLineage('/repo', {
        sql: true,
        python: true,
        scala: true
      });

      expect(discovered.sources).toContain('sql');
      expect(discovered.sources).toContain('python');
      expect(discovered.sources).toContain('scala');
    });

    test('should extract from git history', async () => {
      const lineage = await discoverLineage('/repo', {
        includeHistory: true,
        commits: 100
      });

      expect(lineage.versions).toBeGreaterThan(0);
    });
  });

  // ===================================================================
  // LINEAGE VERSIONING TESTS
  // ===================================================================

  describe('Lineage Versioning', () => {
    test('should version lineage snapshots', () => {
      const lineage = {
        datasets: ['a', 'b'],
        transformations: [{ inputs: ['a'], outputs: ['b'] }]
      };

      const versioned = versionLineage(lineage, {
        version: '1.0.0',
        timestamp: new Date()
      });

      expect(versioned.version).toBe('1.0.0');
      expect(versioned.timestamp).toBeDefined();
    });

    test('should track lineage changes over time', () => {
      const v1 = { datasets: ['a', 'b'] };
      const v2 = { datasets: ['a', 'b', 'c'] };

      const changes = versionLineage.compare(v1, v2);

      expect(changes.added).toContain('c');
      expect(changes.removed).toHaveLength(0);
    });

    test('should support lineage rollback', () => {
      const versions = [
        { version: '1.0.0', datasets: ['a'] },
        { version: '2.0.0', datasets: ['a', 'b'] },
        { version: '3.0.0', datasets: ['a', 'b', 'c'] }
      ];

      const rolledBack = versionLineage.rollback(versions, '2.0.0');

      expect(rolledBack.datasets).toEqual(['a', 'b']);
    });
  });

  // ===================================================================
  // ERROR HANDLING TESTS
  // ===================================================================

  describe('Error Handling', () => {
    test('should handle invalid SQL', () => {
      const invalidSQL = 'SELEEEECT * FROMMMM';

      expect(() => parseSQL(invalidSQL)).toThrow('Invalid SQL syntax');
    });

    test('should handle missing datasets', () => {
      const lineage = { transformations: [{ inputs: ['missing'], outputs: ['out'] }] };

      expect(() => buildGraph(lineage)).toThrow('Dataset not found: missing');
    });

    test('should handle catalog connection failures', async () => {
      const result = await publishToCatalog({}, 'atlas', {
        url: 'http://invalid:9999'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should validate input parameters', () => {
      expect(() => analyzeImpact(null, 'node', 'upstream')).toThrow('Invalid graph');
      expect(() => visualizeGraph({}, 'invalid_format')).toThrow('Invalid format');
    });
  });

  // ===================================================================
  // PERFORMANCE TESTS
  // ===================================================================

  describe('Performance', () => {
    test('should handle large lineage graphs', () => {
      const largeGraph = {
        datasets: Array.from({ length: 1000 }, (_, i) => `dataset_${i}`),
        transformations: Array.from({ length: 2000 }, (_, i) => ({
          inputs: [`dataset_${i % 500}`],
          outputs: [`dataset_${(i % 500) + 500}`]
        }))
      };

      const graph = buildGraph(largeGraph);

      expect(graph.nodes.length).toBe(1000);
      expect(graph.edges.length).toBe(2000);
    });

    test('should efficiently calculate deep lineage', () => {
      const deepLineage = {
        transformations: Array.from({ length: 50 }, (_, i) => ({
          inputs: [`level_${i}`],
          outputs: [`level_${i + 1}`]
        }))
      };

      const graph = buildGraph(deepLineage);
      const upstream = analyzeImpact(graph, 'level_50', 'upstream');

      expect(upstream.length).toBe(50);
    });
  });
});
