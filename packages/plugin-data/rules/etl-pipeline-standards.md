# ETL Pipeline Standards

**Priority:** HIGH
**Applies To:** commands, agents
**Enforces On:** airflow-orchestration-expert, kedro-pipeline-expert

ETL/ELT pipeline best practices with Context7-verified patterns from Airflow, Kedro, dbt, and pandas.

## Context7 Documentation Requirements

**MANDATORY**: Query Context7 before implementing ETL pipelines for framework-specific patterns.

## Core ETL Principles

### 1. Idempotency

**Rule:** All ETL operations must be idempotent - safe to re-run multiple times.

```python
# ✅ CORRECT: Idempotent load using upsert
def load_to_warehouse(df: pd.DataFrame, table: str):
    """
    Idempotent load using MERGE/UPSERT.

    Context7 Pattern: Prevents duplicates on retry
    """
    # Use MERGE/UPSERT instead of INSERT
    connection.execute(f"""
        MERGE INTO {table} AS target
        USING temp_table AS source
        ON target.id = source.id
        WHEN MATCHED THEN UPDATE SET ...
        WHEN NOT MATCHED THEN INSERT ...
    """)
```

### 2. Incremental Processing

**Rule:** Process only new/changed data when possible.

```python
# ✅ CORRECT: Incremental extraction
@task
def extract_incremental(last_run_timestamp: str) -> Dict:
    """
    Extract only new records since last run.

    Context7 Pattern (Airflow): TaskFlow with state tracking
    """
    query = f"""
        SELECT * FROM source_table
        WHERE updated_at > '{last_run_timestamp}'
    """
    data = execute_query(query)
    return {"data": data, "timestamp": datetime.utcnow().isoformat()}
```

### 3. Error Handling and Retries

**Rule:** Implement proper error handling with exponential backoff.

```python
# ✅ CORRECT: Airflow retry configuration
default_args = {
    "retries": 3,
    "retry_delay": timedelta(minutes=5),
    "retry_exponential_backoff": True,
    "max_retry_delay": timedelta(hours=1),
}
```

### 4. Data Lineage Tracking

**Rule:** Track data provenance and transformations.

```python
# ✅ CORRECT: Kedro pipeline with clear lineage
def create_pipeline(**kwargs) -> Pipeline:
    return pipeline([
        node(
            func=extract_raw_data,
            inputs=None,
            outputs="raw_data",  # Clear lineage
            name="extract",
        ),
        node(
            func=transform_data,
            inputs="raw_data",
            outputs="transformed_data",  # Tracks transformation
            name="transform",
        ),
        node(
            func=load_data,
            inputs="transformed_data",
            outputs=None,
            name="load",
        ),
    ])
```

### 5. Monitoring and Logging

**Rule:** Log all stages with metrics and timing.

```python
import logging
import time

logger = logging.getLogger(__name__)

def etl_stage_wrapper(func):
    """Decorator for ETL stage logging."""
    def wrapper(*args, **kwargs):
        start_time = time.time()
        logger.info(f"Starting {func.__name__}")

        try:
            result = func(*args, **kwargs)
            duration = time.time() - start_time

            logger.info(
                f"Completed {func.__name__} in {duration:.2f}s"
            )
            return result

        except Exception as e:
            logger.error(f"Failed {func.__name__}: {e}")
            raise

    return wrapper
```

## Pipeline Patterns

### Extract Phase

```python
@task
def extract_from_api(endpoint: str) -> Dict:
    """
    Extract data from API with retry logic.

    Context7 Pattern: Robust extraction
    """
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.get(endpoint, timeout=30)
            response.raise_for_status()
            return response.json()
        except RequestException as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)  # Exponential backoff
```

### Transform Phase

```python
def transform_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transform data with Context7 pandas patterns.

    Context7 Pattern: Vectorized operations
    """
    # ✅ CORRECT: Vectorization over apply
    df["total"] = df["quantity"] * df["price"]

    # ✅ CORRECT: GroupBy aggregations
    aggregated = df.groupby("customer_id").agg({
        "total": ["sum", "mean", "count"],
        "order_date": "max"
    })

    # ✅ CORRECT: Efficient merging
    result = df.merge(
        customers,
        on="customer_id",
        how="left",
        validate="many_to_one"
    )

    return result
```

### Load Phase

```python
def load_to_warehouse(
    df: pd.DataFrame,
    table: str,
    mode: str = "append"
):
    """
    Load data to warehouse with proper handling.

    Args:
        df: Data to load
        table: Target table
        mode: 'append' or 'replace'
    """
    # Validate before loading
    assert len(df) > 0, "Empty DataFrame"
    assert not df.isnull().all().any(), "Column with all nulls"

    # Load with transaction
    with engine.begin() as conn:
        df.to_sql(
            table,
            conn,
            if_exists=mode,
            index=False,
            method="multi",  # Batch inserts
            chunksize=1000
        )

    logger.info(f"Loaded {len(df)} rows to {table}")
```

## Testing Standards

```python
def test_etl_pipeline():
    """Test ETL pipeline end-to-end."""
    # Arrange: Setup test data
    test_data = create_test_data()

    # Act: Run pipeline
    result = run_pipeline(test_data)

    # Assert: Validate results
    assert len(result) == expected_count
    assert result["total"].sum() == expected_total
    assert not result.isnull().any().any()
```

## Enforcement Checklist

- [ ] Context7 documentation queried
- [ ] Idempotent operations
- [ ] Incremental processing where applicable
- [ ] Error handling with retries
- [ ] Data validation at each stage
- [ ] Lineage tracking
- [ ] Monitoring and logging
- [ ] Tests cover all stages
- [ ] Documentation complete

## Related Resources

- Rule: `data-quality-standards.md`
- Command: `airflow-dag-scaffold.md`
- Command: `kafka-pipeline-scaffold.md`
- Script: `airflow-dag-example.py`
- Script: `pandas-etl-example.py`
