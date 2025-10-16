#!/usr/bin/env python3
"""
pandas ETL Example - Context7 Best Practices

Demonstrates pandas data processing patterns from Context7:
- Vectorized operations over apply
- GroupBy aggregations
- Efficient merging and concatenation
- Data validation and quality checks
- Performance optimization

Source: /pandas-dev/pandas (7,386 snippets, trust 9.2)
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ===================================================================
# EXTRACTION
# ===================================================================

def extract_data() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Extract data from multiple sources.

    Context7 Pattern: Return DataFrames for downstream processing
    """
    logger.info("Extracting data from sources...")

    # Generate sample data
    np.random.seed(42)
    n_orders = 1000

    # Orders data
    orders = pd.DataFrame({
        'order_id': range(1, n_orders + 1),
        'customer_id': np.random.randint(1, 201, n_orders),
        'product_id': np.random.randint(1, 51, n_orders),
        'quantity': np.random.randint(1, 11, n_orders),
        'unit_price': np.random.uniform(10, 500, n_orders).round(2),
        'order_date': [
            datetime(2025, 1, 1) + timedelta(days=int(x))
            for x in np.random.randint(0, 365, n_orders)
        ],
    })

    # Customers data
    customers = pd.DataFrame({
        'customer_id': range(1, 201),
        'customer_name': [f'Customer {i}' for i in range(1, 201)],
        'customer_email': [f'customer{i}@example.com' for i in range(1, 201)],
        'customer_segment': np.random.choice(
            ['Enterprise', 'SMB', 'Startup'], 200
        ),
    })

    # Products data
    products = pd.DataFrame({
        'product_id': range(1, 51),
        'product_name': [f'Product {i}' for i in range(1, 51)],
        'product_category': np.random.choice(
            ['Electronics', 'Software', 'Services'], 50
        ),
    })

    logger.info(f"✓ Extracted {len(orders)} orders, {len(customers)} customers, {len(products)} products")
    return orders, customers, products


# ===================================================================
# TRANSFORMATION
# ===================================================================

def transform_data(
    orders: pd.DataFrame,
    customers: pd.DataFrame,
    products: pd.DataFrame,
) -> pd.DataFrame:
    """
    Transform and enrich data with Context7 pandas patterns.

    Context7 Patterns:
    - Vectorized operations (avoid apply when possible)
    - Efficient merging with validation
    - GroupBy aggregations
    """
    logger.info("Transforming data...")

    # ✅ CORRECT: Vectorized calculation (faster than apply)
    orders['order_total'] = orders['quantity'] * orders['unit_price']

    # ✅ CORRECT: Vectorized categorization
    orders['order_size'] = pd.cut(
        orders['quantity'],
        bins=[0, 3, 7, float('inf')],
        labels=['small', 'medium', 'large']
    )

    # ✅ CORRECT: Efficient merge with validation
    enriched = orders.merge(
        customers,
        on='customer_id',
        how='left',
        validate='many_to_one'  # Ensure referential integrity
    )

    enriched = enriched.merge(
        products,
        on='product_id',
        how='left',
        validate='many_to_one'
    )

    # ✅ CORRECT: GroupBy aggregations
    logger.info("Calculating customer aggregations...")
    customer_aggs = enriched.groupby('customer_id').agg({
        'order_total': ['sum', 'mean', 'count'],
        'order_date': 'max',
    })

    # Flatten column names
    customer_aggs.columns = ['_'.join(col).strip() for col in customer_aggs.columns]
    customer_aggs = customer_aggs.rename(columns={
        'order_total_sum': 'customer_lifetime_value',
        'order_total_mean': 'avg_order_value',
        'order_total_count': 'total_orders',
        'order_date_max': 'last_order_date',
    })

    # ✅ CORRECT: Merge aggregations back
    enriched = enriched.merge(
        customer_aggs,
        left_on='customer_id',
        right_index=True,
        how='left'
    )

    # ✅ CORRECT: GroupBy for product metrics
    logger.info("Calculating product aggregations...")
    product_aggs = enriched.groupby('product_id')['order_total'].agg(['mean', 'count'])
    product_aggs.columns = ['product_avg_order_value', 'product_order_count']

    enriched = enriched.merge(
        product_aggs,
        left_on='product_id',
        right_index=True,
        how='left'
    )

    logger.info(f"✓ Transformed {len(enriched)} records")
    return enriched


# ===================================================================
# VALIDATION
# ===================================================================

def validate_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Validate data quality with Context7 best practices.

    Context7 Pattern: Comprehensive validation checks
    """
    logger.info("Validating data quality...")

    # Schema validation
    required_columns = [
        'order_id', 'customer_id', 'product_id', 'order_total',
        'customer_name', 'product_name'
    ]
    missing = [col for col in required_columns if col not in df.columns]
    assert not missing, f"Missing required columns: {missing}"

    # Null check
    null_counts = df[required_columns].isnull().sum()
    assert null_counts.sum() == 0, f"Null values found: {null_counts[null_counts > 0].to_dict()}"

    # Type validation
    assert pd.api.types.is_numeric_dtype(df['order_total']), "order_total must be numeric"
    assert pd.api.types.is_integer_dtype(df['order_id']), "order_id must be integer"

    # Range validation
    assert (df['order_total'] >= 0).all(), "order_total contains negative values"
    assert (df['quantity'] > 0).all(), "quantity must be positive"

    # Uniqueness check
    assert df['order_id'].is_unique, "Duplicate order_ids found"

    # Referential integrity
    assert not df['customer_id'].isnull().any(), "Orphan orders (null customer_id)"
    assert not df['product_id'].isnull().any(), "Orphan orders (null product_id)"

    logger.info("✓ Validation passed")
    return df


# ===================================================================
# DATA QUALITY METRICS
# ===================================================================

def calculate_quality_metrics(df: pd.DataFrame) -> dict:
    """
    Calculate data quality metrics.

    Context7 Pattern: Comprehensive metrics for monitoring
    """
    logger.info("Calculating quality metrics...")

    metrics = {
        # Completeness
        'total_records': len(df),
        'completeness_pct': ((df.size - df.isnull().sum().sum()) / df.size * 100),

        # Distribution
        'orders_per_customer': {
            'mean': df.groupby('customer_id').size().mean(),
            'median': df.groupby('customer_id').size().median(),
            'max': df.groupby('customer_id').size().max(),
        },

        # Value ranges
        'order_total_stats': {
            'min': df['order_total'].min(),
            'max': df['order_total'].max(),
            'mean': df['order_total'].mean(),
            'median': df['order_total'].median(),
        },

        # Categorical distribution
        'customer_segments': df['customer_segment'].value_counts().to_dict(),
        'product_categories': df['product_category'].value_counts().to_dict(),
    }

    logger.info(f"✓ Calculated quality metrics")
    return metrics


# ===================================================================
# LOADING
# ===================================================================

def load_data(df: pd.DataFrame, output_path: str = 'output_orders.parquet') -> None:
    """
    Load data to storage.

    Context7 Pattern: Use Parquet for efficient storage
    """
    logger.info(f"Loading {len(df)} records to {output_path}...")

    # ✅ CORRECT: Parquet for efficient storage
    df.to_parquet(
        output_path,
        engine='pyarrow',
        compression='snappy',
        index=False
    )

    logger.info(f"✓ Loaded to {output_path}")


# ===================================================================
# MAIN ETL PIPELINE
# ===================================================================

def run_etl_pipeline():
    """Run complete ETL pipeline with Context7 patterns."""
    print("\n" + "=" * 60)
    print("pandas ETL Pipeline - Context7 Best Practices")
    print("=" * 60)

    start_time = datetime.now()

    try:
        # Extract
        orders, customers, products = extract_data()

        # Transform
        transformed = transform_data(orders, customers, products)

        # Validate
        validated = validate_data(transformed)

        # Quality metrics
        metrics = calculate_quality_metrics(validated)

        # Load
        load_data(validated)

        # Summary
        duration = (datetime.now() - start_time).total_seconds()

        print("\n" + "=" * 60)
        print("ETL PIPELINE COMPLETED SUCCESSFULLY")
        print("=" * 60)
        print(f"Duration: {duration:.2f}s")
        print(f"Records processed: {metrics['total_records']:,}")
        print(f"Data completeness: {metrics['completeness_pct']:.2f}%")
        print(f"\nOrder Statistics:")
        print(f"  - Total: ${metrics['order_total_stats']['mean']:.2f} (avg)")
        print(f"  - Range: ${metrics['order_total_stats']['min']:.2f} - ${metrics['order_total_stats']['max']:.2f}")
        print(f"\nCustomer Segments:")
        for segment, count in metrics['customer_segments'].items():
            print(f"  - {segment}: {count}")

    except Exception as e:
        logger.error(f"ETL pipeline failed: {e}")
        raise


if __name__ == "__main__":
    print("pandas ETL Example - Context7 Best Practices")
    print("=" * 60)
    print("")
    print("Context7 Patterns Demonstrated:")
    print("1. ✅ Vectorized operations (df['col'] * df['col2'])")
    print("2. ✅ Efficient merging with validation")
    print("3. ✅ GroupBy aggregations with agg()")
    print("4. ✅ Data validation (nulls, types, ranges)")
    print("5. ✅ Quality metrics calculation")
    print("6. ✅ Parquet for efficient storage")
    print("7. ✅ Avoid apply() when vectorization possible")
    print("8. ✅ Proper error handling and logging")
    print("")
    print("Source: /pandas-dev/pandas (7,386 snippets, trust 9.2)")

    run_etl_pipeline()
