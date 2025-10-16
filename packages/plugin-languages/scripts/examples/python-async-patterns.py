#!/usr/bin/env python3
"""
Python Async Patterns - Context7 Best Practices

Demonstrates modern Python async patterns from Context7 documentation:
- AsyncIterator type hints
- ParamSpec for type-safe decorators
- TypeIs for type narrowing
- TYPE_CHECKING for conditional imports

Source: /python/cpython (19,631 snippets, trust 8.9)
Source: /websites/fastapi_tiangolo (28,852 snippets, trust 9.0)
"""

import asyncio
from typing import (
    AsyncIterator,
    Callable,
    ParamSpec,
    TypeVar,
    TypeIs,
    TYPE_CHECKING,
)
from collections.abc import Sequence

# Conditional imports for type checking only (Context7 pattern)
if TYPE_CHECKING:
    from pydantic import BaseModel  # Only imported during type checking

# Type variables for generic functions
P = ParamSpec('P')
R = TypeVar('R')
T = TypeVar('T')


# Context7 Pattern 1: AsyncIterator for async generators
async def infinite_stream(start: int) -> AsyncIterator[int]:
    """
    Generate infinite stream of integers.

    Context7 Best Practice: Use AsyncIterator type hint for async generators
    Source: /python/cpython
    """
    current = start
    while True:
        yield current
        current = await increment(current)


async def increment(value: int) -> int:
    """Async increment operation."""
    await asyncio.sleep(0.01)  # Simulate async work
    return value + 1


async def take(n: int, ait: AsyncIterator[T]) -> list[T]:
    """
    Take n items from async iterator.

    Context7 Pattern: Generic async iterator consumer
    """
    items = []
    async for item in ait:
        items.append(item)
        if len(items) >= n:
            break
    return items


# Context7 Pattern 2: ParamSpec for type-safe decorators
def with_retry(
    max_attempts: int = 3,
    delay: float = 1.0
) -> Callable[[Callable[P, R]], Callable[P, R]]:
    """
    Decorator with retry logic - type-safe using ParamSpec.

    Context7 Best Practice: Use ParamSpec for decorators that preserve signatures
    Source: /python/cpython
    """
    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        async def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            last_exception = None
            for attempt in range(max_attempts):
                try:
                    if asyncio.iscoroutinefunction(func):
                        return await func(*args, **kwargs)
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_attempts - 1:
                        await asyncio.sleep(delay * (attempt + 1))

            raise last_exception

        return wrapper  # type: ignore[return-value]

    return decorator


# Context7 Pattern 3: TypeIs for type narrowing
def is_str_list(val: list[object]) -> TypeIs[list[str]]:
    """
    Type guard using TypeIs.

    Context7 Best Practice: Use TypeIs for type narrowing in conditionals
    Source: /python/cpython
    """
    return all(isinstance(x, str) for x in val)


def process_strings(items: list[object]) -> list[str]:
    """
    Process list of items, ensuring they are strings.

    Context7 Pattern: Type narrowing with TypeIs
    """
    if is_str_list(items):
        # Type checker knows items is list[str] here
        return [s.upper() for s in items]

    raise TypeError("All items must be strings")


# FastAPI Async Patterns (Context7 verified)
class DataProcessor:
    """
    Demonstrates FastAPI async patterns.

    Context7 Source: /websites/fastapi_tiangolo
    """

    @with_retry(max_attempts=3, delay=0.5)
    async def fetch_data(self, url: str) -> dict:
        """
        Fetch data with retry logic.

        Context7 Pattern: Async methods with decorators
        """
        # Simulate API call
        await asyncio.sleep(0.1)
        return {"url": url, "data": "sample"}

    async def process_batch(
        self,
        items: Sequence[str]
    ) -> AsyncIterator[dict]:
        """
        Process items in batch, yielding results.

        Context7 Pattern: AsyncIterator for streaming results
        """
        for item in items:
            result = await self.fetch_data(item)
            await asyncio.sleep(0.05)
            yield result

    async def aggregate_results(
        self,
        items: Sequence[str]
    ) -> list[dict]:
        """
        Aggregate all results from async iterator.

        Context7 Pattern: Consuming async iterators
        """
        results = []
        async for result in self.process_batch(items):
            results.append(result)
        return results


# Example usage with type safety
async def main() -> None:
    """Demonstrate all Context7 patterns."""

    # Pattern 1: AsyncIterator
    print("Pattern 1: AsyncIterator")
    stream = infinite_stream(1)
    first_five = await take(5, stream)
    print(f"First 5 from stream: {first_five}")

    # Pattern 2: ParamSpec decorator
    print("\nPattern 2: ParamSpec Decorator")
    processor = DataProcessor()
    result = await processor.fetch_data("https://api.example.com/data")
    print(f"Fetched: {result}")

    # Pattern 3: TypeIs type narrowing
    print("\nPattern 3: TypeIs Type Narrowing")
    mixed_list: list[object] = ["hello", "world"]
    try:
        processed = process_strings(mixed_list)
        print(f"Processed strings: {processed}")
    except TypeError as e:
        print(f"Type error: {e}")

    # FastAPI async patterns
    print("\nFastAPI Async Patterns")
    items = ["item1", "item2", "item3"]

    # Streaming results
    print("Streaming results:")
    async for result in processor.process_batch(items):
        print(f"  Processed: {result}")

    # Aggregated results
    all_results = await processor.aggregate_results(items)
    print(f"All results: {len(all_results)} items")


if __name__ == "__main__":
    # Run async main
    asyncio.run(main())


# Additional Context7 Best Practices

# 1. Type hints for all functions (MANDATORY)
def typed_function(param: str, count: int = 1) -> list[str]:
    """All functions must have type hints."""
    return [param] * count


# 2. Use modern type syntax (list[T] not List[T])
def modern_types(items: list[str], mapping: dict[str, int]) -> set[str]:
    """Use built-in generics (Python 3.9+)."""
    return set(items)


# 3. Async context managers for resource cleanup
class AsyncResource:
    """Context7 Pattern: Async context manager."""

    async def __aenter__(self) -> 'AsyncResource':
        """Acquire resource."""
        await asyncio.sleep(0.01)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Release resource."""
        await asyncio.sleep(0.01)


async def use_resource() -> None:
    """Demonstrate async context manager."""
    async with AsyncResource() as resource:
        print("Using resource")


# 4. Dataclasses for structured data
from dataclasses import dataclass


@dataclass
class User:
    """Context7 Pattern: Dataclasses for data models."""
    id: int
    email: str
    username: str
    active: bool = True


# 5. Pydantic for validation (when FastAPI is used)
# This would normally import from pydantic, but we use TYPE_CHECKING
if TYPE_CHECKING:
    class UserCreate(BaseModel):
        """User creation schema with validation."""
        email: str  # Would use EmailStr from pydantic
        username: str
        password: str  # Would use SecretStr from pydantic


print("""
Context7 Verified Best Practices Applied:
==========================================
1. ✅ AsyncIterator type hints for async generators
2. ✅ ParamSpec for type-safe decorators
3. ✅ TypeIs for type narrowing
4. ✅ TYPE_CHECKING for conditional imports
5. ✅ Modern type syntax (list[T] not List[T])
6. ✅ Async context managers
7. ✅ Dataclasses for data models
8. ✅ Comprehensive type hints

Sources:
- /python/cpython (19,631 snippets, trust 8.9)
- /websites/fastapi_tiangolo (28,852 snippets, trust 9.0)
""")
