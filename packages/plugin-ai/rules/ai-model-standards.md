# AI Model Standards

## Priority: High

## Description

Comprehensive AI model development standards with Context7-verified best practices for model selection, deployment, monitoring, and optimization across OpenAI, HuggingFace, and MLflow frameworks.

## Applies To
- commands
- agents

## Enforces On
- openai-python-expert
- gemini-api-expert
- langgraph-workflow-expert

## Context7 Documentation Sources

**MANDATORY:** All AI model implementations MUST consult:
- `/openai/openai-python` (277 snippets, trust 9.1) - OpenAI API best practices
- `/huggingface/transformers` (2,790 snippets, trust 9.6) - HuggingFace model patterns
- `/mlflow/mlflow` (3,114 snippets, trust 9.1) - ML experiment tracking and deployment

## Standards

### 1. Model Selection and Configuration

#### ✅ CORRECT: Context7-verified model selection
```python
from openai import AsyncOpenAI
from pydantic import BaseModel, Field

class ModelConfig(BaseModel):
    """Model configuration with Context7 best practices"""
    # Context7: Use latest stable models
    model: str = Field(
        default="gpt-4",
        description="Model name from OpenAI"
    )
    temperature: float = Field(
        default=0.1,  # Context7: Low temperature for deterministic responses
        ge=0.0,
        le=2.0
    )
    max_tokens: int = Field(
        default=500,
        ge=1,
        le=4096
    )
    top_p: float = Field(default=1.0, ge=0.0, le=1.0)

# Context7 pattern: AsyncOpenAI for production
client = AsyncOpenAI(
    api_key=api_key,
    max_retries=3,      # Context7: Retry failed requests
    timeout=60.0        # Context7: Reasonable timeout
)
```

#### ❌ INCORRECT: Hardcoded, non-configurable models
```python
# DON'T: Hardcoded model without configuration
client = openai.OpenAI()  # Missing async, retries, timeout
response = openai.ChatCompletion.create(
    model="gpt-3.5",  # Outdated model name
    prompt=prompt,
    temperature=1.0    # Too high for production
)
```

### 2. Async Operations and Rate Limiting

#### ✅ CORRECT: Async with rate limiting (Context7 pattern)
```python
import asyncio
from datetime import datetime, timedelta

class RateLimiter:
    """Context7 pattern: Token bucket rate limiting"""
    def __init__(self, requests_per_minute: int = 60):
        self.rpm = requests_per_minute
        self.requests = []

    async def wait_if_needed(self):
        now = datetime.now()
        # Remove requests older than 1 minute
        self.requests = [t for t in self.requests if now - t < timedelta(minutes=1)]

        if len(self.requests) >= self.rpm:
            oldest = min(self.requests)
            wait_time = 60 - (now - oldest).total_seconds()
            if wait_time > 0:
                await asyncio.sleep(wait_time)

        self.requests.append(now)

# Context7 pattern: Use rate limiter
rate_limiter = RateLimiter(requests_per_minute=50)

async def safe_completion(prompt: str):
    await rate_limiter.wait_if_needed()
    response = await client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return response
```

#### ❌ INCORRECT: Blocking calls without rate limiting
```python
# DON'T: Synchronous calls in async context
def completion(prompt):
    # No rate limiting - will hit API limits
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content
```

### 3. Error Handling and Retry Logic

#### ✅ CORRECT: Exponential backoff with retry (Context7 pattern)
```python
async def completion_with_retry(
    prompt: str,
    max_retries: int = 3,
    base_delay: float = 1.0
) -> str:
    """Context7 pattern: Exponential backoff retry"""
    for attempt in range(max_retries):
        try:
            response = await client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content

        except openai.RateLimitError as e:
            if attempt == max_retries - 1:
                raise
            # Exponential backoff
            delay = base_delay * (2 ** attempt)
            logger.warning(f"Rate limit hit, retrying in {delay}s")
            await asyncio.sleep(delay)

        except openai.APIError as e:
            logger.error(f"API error: {e}")
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(base_delay * (2 ** attempt))

        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise
```

#### ❌ INCORRECT: No error handling
```python
# DON'T: No error handling or retries
async def completion(prompt):
    response = await client.chat.completions.create(...)
    return response.choices[0].message.content  # Will fail on any error
```

### 4. Response Caching and Optimization

#### ✅ CORRECT: TTL caching for repeated queries (Context7 pattern)
```python
from cachetools import TTLCache
import hashlib

class CachedInference:
    """Context7 pattern: TTL cache for responses"""
    def __init__(self, ttl: int = 300):  # 5 min cache
        self.cache = TTLCache(maxsize=1000, ttl=ttl)

    def _cache_key(self, prompt: str, temperature: float, max_tokens: int) -> str:
        """Generate cache key from parameters"""
        key_data = f"{prompt}:{temperature}:{max_tokens}"
        return hashlib.md5(key_data.encode()).hexdigest()

    async def get_completion(
        self,
        prompt: str,
        temperature: float = 0.1,
        max_tokens: int = 500,
        use_cache: bool = True
    ) -> str:
        # Check cache
        cache_key = self._cache_key(prompt, temperature, max_tokens)
        if use_cache and cache_key in self.cache:
            logger.info("Cache hit")
            return self.cache[cache_key]

        # Call API
        response = await client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=max_tokens
        )

        result = response.choices[0].message.content

        # Store in cache
        if use_cache:
            self.cache[cache_key] = result

        return result
```

#### ❌ INCORRECT: No caching, repeated API calls
```python
# DON'T: No caching for repeated queries
async def get_completion(prompt):
    # Will call API even for identical prompts
    response = await client.chat.completions.create(...)
    return response.choices[0].message.content
```

### 5. Monitoring and Metrics

#### ✅ CORRECT: Comprehensive metrics tracking (Context7 pattern)
```python
from dataclasses import dataclass, field
from typing import Dict
import logging

@dataclass
class ModelMetrics:
    """Context7 pattern: Track model usage metrics"""
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    total_tokens: int = 0
    total_cost: float = 0.0
    cache_hits: int = 0
    cache_misses: int = 0

    # Cost per token (as of 2025)
    COST_PER_TOKEN: Dict[str, Dict[str, float]] = field(default_factory=lambda: {
        "gpt-4": {"input": 0.00003, "output": 0.00006},
        "gpt-3.5-turbo": {"input": 0.0000015, "output": 0.000002}
    })

    def record_request(
        self,
        model: str,
        success: bool,
        prompt_tokens: int,
        completion_tokens: int,
        cache_hit: bool = False
    ):
        """Record request metrics"""
        self.total_requests += 1

        if success:
            self.successful_requests += 1
        else:
            self.failed_requests += 1

        if cache_hit:
            self.cache_hits += 1
        else:
            self.cache_misses += 1

        # Calculate cost
        if model in self.COST_PER_TOKEN:
            cost_info = self.COST_PER_TOKEN[model]
            cost = (
                prompt_tokens * cost_info["input"] +
                completion_tokens * cost_info["output"]
            )
            self.total_cost += cost
            self.total_tokens += prompt_tokens + completion_tokens

    def get_summary(self) -> Dict:
        """Get metrics summary"""
        success_rate = (
            self.successful_requests / self.total_requests * 100
            if self.total_requests > 0 else 0
        )
        cache_hit_rate = (
            self.cache_hits / (self.cache_hits + self.cache_misses) * 100
            if (self.cache_hits + self.cache_misses) > 0 else 0
        )

        return {
            "total_requests": self.total_requests,
            "success_rate": f"{success_rate:.2f}%",
            "cache_hit_rate": f"{cache_hit_rate:.2f}%",
            "total_tokens": self.total_tokens,
            "total_cost": f"${self.total_cost:.4f}"
        }
```

#### ❌ INCORRECT: No monitoring
```python
# DON'T: No metrics or monitoring
async def completion(prompt):
    response = await client.chat.completions.create(...)
    return response.choices[0].message.content
    # No tracking of costs, success rate, or performance
```

### 6. HuggingFace Model Loading and Inference

#### ✅ CORRECT: Optimized model loading (Context7 pattern)
```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
import torch

class HuggingFaceInference:
    """Context7 pattern: Optimized HuggingFace model loading"""
    def __init__(self, model_name: str, device: str = "auto"):
        self.model_name = model_name
        self.device = 0 if torch.cuda.is_available() and device == "auto" else -1

    def load_model(self):
        """Context7 pattern: Use pipeline API for simplicity"""
        self.pipeline = pipeline(
            "text-classification",
            model=self.model_name,
            device=self.device
        )
        logger.info(f"Loaded model: {self.model_name} on device: {self.device}")

    async def predict(self, text: str) -> Dict:
        """Run inference with proper error handling"""
        try:
            result = self.pipeline(text)
            return {
                "label": result[0]["label"],
                "score": result[0]["score"],
                "model": self.model_name
            }
        except Exception as e:
            logger.error(f"Inference failed: {e}")
            raise
```

#### ❌ INCORRECT: Manual tokenization without optimization
```python
# DON'T: Manual tokenization and model forward pass
model = AutoModelForSequenceClassification.from_pretrained(model_name)
tokenizer = AutoTokenizer.from_pretrained(model_name)

def predict(text):
    inputs = tokenizer(text, return_tensors="pt")  # No device placement
    outputs = model(**inputs)  # No error handling
    return outputs.logits
```

### 7. MLflow Experiment Tracking

#### ✅ CORRECT: Comprehensive MLflow tracking (Context7 pattern)
```python
import mlflow
from mlflow.tracking import MlflowClient

class MLflowTracker:
    """Context7 pattern: MLflow experiment tracking"""
    def __init__(self, experiment_name: str):
        mlflow.set_experiment(experiment_name)
        self.client = MlflowClient()

    def log_model_run(
        self,
        model_name: str,
        params: Dict,
        metrics: Dict,
        artifacts: Dict = None
    ):
        """Log model run with Context7 best practices"""
        with mlflow.start_run():
            # Log parameters
            mlflow.log_params(params)

            # Log metrics
            mlflow.log_metrics(metrics)

            # Log model info
            mlflow.set_tag("model_name", model_name)
            mlflow.set_tag("framework", "openai")

            # Log artifacts
            if artifacts:
                for name, path in artifacts.items():
                    mlflow.log_artifact(path, artifact_path=name)

            run_id = mlflow.active_run().info.run_id
            logger.info(f"Logged run: {run_id}")

            return run_id
```

#### ❌ INCORRECT: No experiment tracking
```python
# DON'T: No MLflow tracking of experiments
def run_model(prompt):
    response = client.chat.completions.create(...)
    return response.choices[0].message.content
    # No tracking of parameters, metrics, or results
```

## Enforcement Rules

1. **All AI model implementations MUST**:
   - Use AsyncOpenAI or async alternatives
   - Implement rate limiting
   - Include exponential backoff retry logic
   - Track metrics (requests, costs, latency)
   - Use caching for repeated queries
   - Log errors and warnings

2. **All production deployments MUST**:
   - Use environment variables for API keys
   - Implement health check endpoints
   - Include monitoring (Prometheus/Datadog)
   - Set up alerting for failures
   - Track costs and usage

3. **All model configurations MUST**:
   - Use Pydantic for validation
   - Include reasonable defaults
   - Document all parameters
   - Support environment-based config

## Testing Requirements

1. **Unit Tests**: Test inference logic with mocked APIs
2. **Integration Tests**: Test with real API endpoints (in staging)
3. **Load Tests**: Validate performance under load
4. **Cost Tests**: Ensure cost tracking is accurate

## Security Requirements

1. **API Keys**: Never hardcode, use environment variables or secret managers
2. **Input Validation**: Validate all user inputs with Pydantic
3. **Output Sanitization**: Remove sensitive information from responses
4. **Rate Limiting**: Protect against abuse and runaway costs

## References

- Context7: `/openai/openai-python` - Production API patterns
- Context7: `/huggingface/transformers` - Model loading and inference
- Context7: `/mlflow/mlflow` - Experiment tracking
