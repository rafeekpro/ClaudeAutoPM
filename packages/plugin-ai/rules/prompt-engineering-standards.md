# Prompt Engineering Standards

## Priority: High

## Description

Comprehensive prompt engineering standards with Context7-verified best practices for effective prompt design, few-shot learning, chain-of-thought reasoning, and structured outputs across OpenAI, Gemini, and LangChain frameworks.

## Applies To
- commands
- agents

## Enforces On
- openai-python-expert
- gemini-api-expert
- langgraph-workflow-expert

## Context7 Documentation Sources

**MANDATORY:** All prompt implementations MUST consult:
- `/openai/openai-python` (277 snippets, trust 9.1) - OpenAI prompt patterns
- `/langchain-ai/langchain` (150 snippets, trust 9.2) - LangChain prompt templates
- Context7-verified prompt engineering techniques

## Standards

### 1. System Prompts and Role Definition

#### ✅ CORRECT: Clear, specific system prompts
```python
from langchain_core.prompts import ChatPromptTemplate

# Context7 pattern: Specific role with constraints
SYSTEM_PROMPT = """You are an expert Python developer assistant.

Your responsibilities:
- Provide accurate, working Python code
- Follow PEP 8 style guidelines
- Include comprehensive error handling
- Add clear docstrings and comments
- Suggest tests for the code

Constraints:
- Only provide Python code (no other languages unless explicitly asked)
- Always explain your reasoning
- If unsure, say "I don't have enough information" rather than guessing
"""

prompt_template = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", "{user_input}")
])
```

#### ❌ INCORRECT: Vague, generic system prompts
```python
# DON'T: Vague system prompt
SYSTEM_PROMPT = "You are a helpful assistant."
# Too generic - model has no specific guidance
```

### 2. Few-Shot Learning Patterns

#### ✅ CORRECT: Context7-verified few-shot examples
```python
# Context7 pattern: 3-5 examples covering edge cases
FEW_SHOT_PROMPT = """You are a text classifier for customer support tickets.

Examples:

Input: "My order hasn't arrived yet and it's been 2 weeks"
Output: {"category": "delivery_issue", "priority": "high", "sentiment": "frustrated"}

Input: "How do I reset my password?"
Output: {"category": "account_help", "priority": "low", "sentiment": "neutral"}

Input: "The product is broken, I want a refund immediately!"
Output: {"category": "refund_request", "priority": "high", "sentiment": "angry"}

Input: "Great service, very happy with my purchase"
Output: {"category": "feedback", "priority": "low", "sentiment": "positive"}

Input: "Can you help me choose between product A and B?"
Output: {"category": "pre_sales", "priority": "medium", "sentiment": "neutral"}

Now classify this ticket:
{ticket_text}

Respond with JSON only."""
```

#### ❌ INCORRECT: Single example or no examples
```python
# DON'T: Only one example
FEW_SHOT_PROMPT = """Classify tickets.
Example: "Order issue" -> delivery_issue

{ticket_text}"""
# Not enough examples to establish pattern
```

### 3. Chain-of-Thought (CoT) Reasoning

#### ✅ CORRECT: Explicit reasoning steps (Context7 pattern)
```python
# Context7 pattern: Step-by-step reasoning
COT_PROMPT = """Answer the following question using step-by-step reasoning.

Question: {question}

Please follow this process:
1. Identify what the question is asking
2. List the key information provided
3. Determine what additional information or assumptions are needed
4. Work through the solution step by step
5. State your final answer

Let's think through this systematically:"""

# Usage
messages = [
    {"role": "system", "content": "You are a logical reasoning assistant."},
    {"role": "user", "content": COT_PROMPT.format(
        question="If a train travels 120 miles in 2 hours, then 180 miles in the next 3 hours, what is its average speed?"
    )}
]
```

#### ❌ INCORRECT: Direct answer request without reasoning
```python
# DON'T: Skip reasoning process
PROMPT = "What is the average speed? Answer directly."
# Missing chain-of-thought guidance
```

### 4. Structured Output Generation

#### ✅ CORRECT: JSON schema with validation (Context7 pattern)
```python
from pydantic import BaseModel, Field
from typing import List, Literal
import json

class AnalysisResult(BaseModel):
    """Structured output schema"""
    summary: str = Field(description="Brief summary in 1-2 sentences")
    key_points: List[str] = Field(description="3-5 key points")
    sentiment: Literal["positive", "negative", "neutral"] = Field(description="Overall sentiment")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score")
    action_items: List[str] = Field(description="Recommended actions")

# Context7 pattern: JSON schema in prompt
STRUCTURED_PROMPT = f"""Analyze the following text and provide your response in this EXACT JSON format:

{json.dumps(AnalysisResult.model_json_schema(), indent=2)}

Text to analyze:
{{text}}

Respond with ONLY valid JSON matching the schema above. No additional text."""

# Validation after response
async def get_structured_analysis(text: str) -> AnalysisResult:
    response = await client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": STRUCTURED_PROMPT.format(text=text)}],
        response_format={"type": "json_object"}  # Context7: Force JSON output
    )

    # Parse and validate
    result_data = json.loads(response.choices[0].message.content)
    return AnalysisResult(**result_data)
```

#### ❌ INCORRECT: Unstructured output request
```python
# DON'T: Unstructured output
PROMPT = "Analyze this text and tell me what you think."
# No structure - hard to parse programmatically
```

### 5. Context Window Management

#### ✅ CORRECT: Token counting and truncation (Context7 pattern)
```python
import tiktoken

class PromptManager:
    """Context7 pattern: Manage context window with token counting"""
    def __init__(self, model: str = "gpt-4", max_tokens: int = 8000):
        self.model = model
        self.max_tokens = max_tokens
        self.encoding = tiktoken.encoding_for_model(model)

    def count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        return len(self.encoding.encode(text))

    def truncate_to_fit(
        self,
        system_prompt: str,
        user_message: str,
        reserve_for_response: int = 1000
    ) -> tuple[str, str]:
        """Truncate messages to fit in context window"""
        system_tokens = self.count_tokens(system_prompt)
        user_tokens = self.count_tokens(user_message)

        available_tokens = self.max_tokens - reserve_for_response
        total_tokens = system_tokens + user_tokens

        if total_tokens > available_tokens:
            # Truncate user message
            tokens_to_remove = total_tokens - available_tokens
            user_encoded = self.encoding.encode(user_message)
            truncated = user_encoded[:len(user_encoded) - tokens_to_remove]
            user_message = self.encoding.decode(truncated) + "\n[...truncated]"

        return system_prompt, user_message

# Usage
prompt_mgr = PromptManager(model="gpt-4", max_tokens=8000)
system, user = prompt_mgr.truncate_to_fit(system_prompt, long_user_message)
```

#### ❌ INCORRECT: No token management
```python
# DON'T: No token counting
messages = [
    {"role": "system", "content": very_long_system_prompt},
    {"role": "user", "content": extremely_long_user_message}
]
# Will fail if exceeds context window
```

### 6. Prompt Templates with Variables

#### ✅ CORRECT: Parameterized templates (Context7 LangChain pattern)
```python
from langchain_core.prompts import PromptTemplate, ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

# Context7 pattern: PromptTemplate with clear variables
code_review_template = PromptTemplate(
    input_variables=["code", "language", "focus_areas"],
    template="""Review the following {language} code and focus on: {focus_areas}

Code:
```{language}
{code}
```

Provide:
1. Overall code quality assessment
2. Specific issues found
3. Suggestions for improvement
4. Security considerations

Review:"""
)

# Context7 pattern: Chain with prompt template
review_chain = (
    code_review_template
    | ChatOpenAI(model="gpt-4", temperature=0)
    | StrOutputParser()
)

# Usage
result = review_chain.invoke({
    "code": source_code,
    "language": "Python",
    "focus_areas": "security, performance, maintainability"
})
```

#### ❌ INCORRECT: String concatenation
```python
# DON'T: String concatenation without templates
prompt = f"Review this code: {code}"
# No structure, hard to modify, prone to injection
```

### 7. Handling Ambiguous Inputs

#### ✅ CORRECT: Clarification prompts (Context7 pattern)
```python
# Context7 pattern: Handle ambiguity explicitly
CLARIFICATION_PROMPT = """I need to complete this task, but some information is missing or ambiguous.

Task: {task}

Ambiguities I've identified:
{ambiguities}

Please provide clarification for:
1. {question_1}
2. {question_2}
3. {question_3}

Or, if you'd prefer, I can make reasonable assumptions:
{assumptions}

How would you like me to proceed?"""

# Usage for handling unclear requests
async def handle_ambiguous_request(task: str):
    # Detect ambiguity
    if is_ambiguous(task):
        clarification = await ask_for_clarification(task)
        return clarification
    else:
        return await process_task(task)
```

#### ❌ INCORRECT: Assume without asking
```python
# DON'T: Make assumptions without clarifying
async def process_request(task):
    # Assumes what user meant without asking
    result = await client.chat.completions.create(...)
    return result
```

### 8. Temperature and Parameter Tuning

#### ✅ CORRECT: Task-specific temperature (Context7 pattern)
```python
from enum import Enum

class TaskType(Enum):
    FACTUAL = "factual"          # Low temperature
    CREATIVE = "creative"        # High temperature
    CODE_GEN = "code_generation" # Low temperature
    BRAINSTORM = "brainstorming" # High temperature

# Context7 pattern: Temperature based on task
TEMPERATURE_MAP = {
    TaskType.FACTUAL: 0.1,
    TaskType.CREATIVE: 0.9,
    TaskType.CODE_GEN: 0.1,
    TaskType.BRAINSTORM: 0.8
}

async def generate_with_appropriate_temp(
    prompt: str,
    task_type: TaskType
) -> str:
    """Use Context7-recommended temperature for task"""
    temperature = TEMPERATURE_MAP[task_type]

    response = await client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
        top_p=0.95  # Context7: Slight nucleus sampling
    )

    return response.choices[0].message.content
```

#### ❌ INCORRECT: Fixed temperature for all tasks
```python
# DON'T: Same temperature for everything
response = await client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": prompt}],
    temperature=0.7  # Same for factual and creative tasks
)
```

### 9. Prompt Injection Prevention

#### ✅ CORRECT: Input sanitization (Context7 pattern)
```python
import re

class PromptSanitizer:
    """Context7 pattern: Prevent prompt injection"""
    DANGEROUS_PATTERNS = [
        r"ignore previous instructions",
        r"disregard all",
        r"new instructions:",
        r"system:",
        r"<\|im_start\|>",
        r"### Instruction",
    ]

    @classmethod
    def sanitize_input(cls, user_input: str) -> str:
        """Remove potentially dangerous patterns"""
        # Check for injection attempts
        for pattern in cls.DANGEROUS_PATTERNS:
            if re.search(pattern, user_input, re.IGNORECASE):
                raise ValueError(f"Potential prompt injection detected: {pattern}")

        # Escape special characters
        sanitized = user_input.replace("```", "'''")

        return sanitized

    @classmethod
    def create_safe_prompt(cls, user_input: str, template: str) -> str:
        """Create prompt with sanitized input"""
        sanitized = cls.sanitize_input(user_input)
        return template.format(user_input=sanitized)

# Usage
try:
    safe_prompt = PromptSanitizer.create_safe_prompt(
        user_input,
        "Analyze this: {user_input}"
    )
except ValueError as e:
    logger.error(f"Injection attempt blocked: {e}")
    return "Invalid input detected"
```

#### ❌ INCORRECT: No input validation
```python
# DON'T: Direct user input without sanitization
prompt = f"Analyze this: {user_input}"
# Vulnerable to prompt injection
```

### 10. Retrieval-Augmented Generation (RAG) Prompts

#### ✅ CORRECT: RAG with context citation (Context7 LangChain pattern)
```python
from langchain_core.runnables import RunnablePassthrough
from operator import itemgetter

# Context7 pattern: RAG with source citation
RAG_PROMPT = """Answer the question based ONLY on the following context.
If the context doesn't contain enough information, say "I don't have enough information to answer that question."

Context:
{context}

Question: {question}

Answer (cite specific parts of the context used):"""

# Context7 pattern: RunnablePassthrough.assign()
rag_chain = (
    RunnablePassthrough.assign(
        context=itemgetter("question")
            | retriever
            | (lambda docs: "\n\n".join(
                f"[Source {i+1}]: {doc.page_content}"
                for i, doc in enumerate(docs)
            ))
    )
    | ChatPromptTemplate.from_template(RAG_PROMPT)
    | ChatOpenAI(model="gpt-4", temperature=0)
    | StrOutputParser()
)
```

#### ❌ INCORRECT: RAG without context boundaries
```python
# DON'T: No instruction to stay within context
RAG_PROMPT = """Context: {context}
Question: {question}
Answer:"""
# Model may hallucinate beyond provided context
```

## Enforcement Rules

1. **All prompts MUST**:
   - Include clear role definition in system prompts
   - Specify output format explicitly
   - Handle ambiguous inputs gracefully
   - Use appropriate temperature for task type
   - Sanitize user inputs to prevent injection

2. **All structured outputs MUST**:
   - Use Pydantic schemas for validation
   - Include JSON schema in prompt
   - Use `response_format={"type": "json_object"}` when available
   - Validate responses after parsing

3. **All RAG prompts MUST**:
   - Explicitly instruct to use only provided context
   - Request source citations
   - Include fallback for insufficient information
   - Use RunnablePassthrough.assign() for context injection

## Testing Requirements

1. **Prompt Testing**: Test with edge cases and adversarial inputs
2. **Injection Testing**: Verify sanitization blocks injection attempts
3. **Output Validation**: Ensure structured outputs match schema
4. **Context Testing**: Test with context window limits

## Security Requirements

1. **Input Sanitization**: Always sanitize user inputs
2. **Output Validation**: Validate structured outputs
3. **Injection Prevention**: Block prompt injection patterns
4. **PII Protection**: Remove sensitive information from prompts

## References

- Context7: `/openai/openai-python` - Prompt engineering best practices
- Context7: `/langchain-ai/langchain` - Prompt templates and chains
- OWASP LLM Top 10 - Prompt injection prevention
