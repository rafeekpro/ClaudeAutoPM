/*
dbt Transform Example - Context7 Best Practices

Demonstrates dbt transformation patterns from Context7:
- Jinja macros (log, debug, ref, source)
- Materializations (table, view, incremental)
- Tests and documentation
- Configuration blocks

Source: /dbt-labs/dbt-core (133 snippets, trust 10.0)

To use this file:
1. Place in models/ directory of your dbt project
2. Create schema.yml for tests and documentation
3. Run: dbt run --models fct_orders
*/

-- ===================================================================
-- MODEL CONFIGURATION (Context7 Pattern)
-- ===================================================================

{{
  config(
    materialized='table',
    tags=['finance', 'production'],
    schema='analytics',
    alias='fact_orders'
  )
}}

-- ===================================================================
-- JINJA MACROS (Context7 Pattern)
-- ===================================================================

-- ✅ CORRECT: Use {{ log() }} for debugging
{{ log("Building fct_orders model", info=True) }}

-- ===================================================================
-- CTE STRUCTURE (Best Practice)
-- ===================================================================

WITH

-- ✅ CORRECT: Use {{ ref() }} for model dependencies
raw_orders AS (
    SELECT *
    FROM {{ ref('stg_orders') }}
    {{ log("Loaded " ~ (select count(*) from ref('stg_orders')) ~ " orders", info=True) }}
),

-- ✅ CORRECT: Use {{ source() }} for raw data
raw_customers AS (
    SELECT *
    FROM {{ source('raw', 'customers') }}
),

-- ✅ CORRECT: Use {{ ref() }} for other models
raw_products AS (
    SELECT *
    FROM {{ ref('dim_products') }}
),

-- ===================================================================
-- TRANSFORMATIONS
-- ===================================================================

enriched_orders AS (
    SELECT
        o.order_id,
        o.order_date,
        o.customer_id,
        c.customer_name,
        c.customer_email,
        c.customer_segment,
        o.product_id,
        p.product_name,
        p.product_category,
        o.quantity,
        o.unit_price,
        -- ✅ CORRECT: Calculated columns
        o.quantity * o.unit_price AS order_total,
        CASE
            WHEN o.quantity > 10 THEN 'bulk'
            WHEN o.quantity > 5 THEN 'medium'
            ELSE 'small'
        END AS order_size,
        -- Metadata
        CURRENT_TIMESTAMP AS dbt_updated_at,
        '{{ run_started_at }}' AS dbt_run_started_at

    FROM raw_orders o
    LEFT JOIN raw_customers c
        ON o.customer_id = c.customer_id
    LEFT JOIN raw_products p
        ON o.product_id = p.product_id

    -- ✅ CORRECT: Filter out invalid records
    WHERE o.order_date IS NOT NULL
        AND o.quantity > 0
        AND o.unit_price > 0
),

-- ===================================================================
-- AGGREGATIONS
-- ===================================================================

order_metrics AS (
    SELECT
        order_id,
        order_date,
        customer_id,
        customer_name,
        product_id,
        product_name,
        order_total,
        order_size,

        -- Customer-level aggregations
        SUM(order_total) OVER (
            PARTITION BY customer_id
            ORDER BY order_date
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS customer_lifetime_value,

        -- Product-level aggregations
        AVG(order_total) OVER (
            PARTITION BY product_id
        ) AS product_avg_order_value,

        dbt_updated_at,
        dbt_run_started_at

    FROM enriched_orders
)

-- ===================================================================
-- FINAL SELECT
-- ===================================================================

SELECT
    order_id,
    order_date,
    customer_id,
    customer_name,
    product_id,
    product_name,
    order_total,
    order_size,
    customer_lifetime_value,
    product_avg_order_value,
    dbt_updated_at,
    dbt_run_started_at

FROM order_metrics

-- ===================================================================
-- TESTS AND DOCUMENTATION (schema.yml)
-- ===================================================================

/*
Create a schema.yml file alongside this model:

version: 2

models:
  - name: fct_orders
    description: "Orders fact table with customer and product enrichment"

    # ✅ CORRECT: Model-level tests
    tests:
      - dbt_utils.unique_combination_of_columns:
          combination_of_columns:
            - order_id

    columns:
      - name: order_id
        description: "Primary key - unique order identifier"
        tests:
          - unique
          - not_null

      - name: customer_id
        description: "Foreign key to customers dimension"
        tests:
          - not_null
          - relationships:
              to: ref('dim_customers')
              field: customer_id

      - name: order_date
        description: "Order creation timestamp"
        tests:
          - not_null
          - dbt_utils.expression_is_true:
              expression: "order_date <= current_date"

      - name: order_total
        description: "Total order amount (quantity * unit_price)"
        tests:
          - not_null
          - dbt_utils.accepted_range:
              min_value: 0
              inclusive: true

      - name: customer_lifetime_value
        description: "Cumulative customer spending"
        tests:
          - not_null
          - dbt_utils.accepted_range:
              min_value: 0

sources:
  - name: raw
    description: "Raw data from source systems"
    tables:
      - name: customers
        description: "Customer master data"
        columns:
          - name: customer_id
            tests:
              - unique
              - not_null

Context7 Patterns Demonstrated:
================================
1. ✅ {{ config() }} - Model configuration
2. ✅ {{ ref() }} - Reference other models
3. ✅ {{ source() }} - Reference raw data sources
4. ✅ {{ log() }} - Debug logging
5. ✅ CTE structure - Clean, readable SQL
6. ✅ Calculated columns - Business logic
7. ✅ Window functions - Advanced aggregations
8. ✅ Tests in schema.yml - Data quality
9. ✅ Documentation - Column descriptions
10. ✅ Relationships - Foreign key tests

Source: /dbt-labs/dbt-core (133 snippets, trust 10.0)
*/
