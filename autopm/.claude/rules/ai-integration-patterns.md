# AI Integration Patterns Rule

> **PURPOSE**: Mandatory patterns for AI API integration and safety practices.

## CRITICAL AI INTEGRATION REQUIREMENTS

### 1. AGENT SELECTION BY USE CASE

**OpenAI Integration** - Use `openai-python-expert`:

- GPT models for text generation and chat
- Embeddings for semantic search and similarity  
- Vision API for image analysis and OCR
- Audio processing (Whisper, TTS)
- Function calling for tool integration

**Google AI Integration** - Use `gemini-api-expert`:

- Multimodal inputs (text, images, audio, video)
- Advanced reasoning and analysis
- Safety-first content filtering
- Function calling with structured outputs
- Large context window requirements

**Complex Workflows** - Use `langgraph-workflow-expert`:

- Multi-agent collaboration patterns
- State management and persistence
- Conditional routing and decision trees
- Human-in-the-loop workflows
- Error handling and recovery

### 2. MANDATORY SAFETY PRACTICES

**Content Filtering** (ALWAYS implement):

- Enable content safety filters on all AI APIs
- Implement input validation and sanitization
- Set up output content monitoring
- Create content moderation workflows

**Rate Limiting** (REQUIRED):

- Implement API rate limiting at application level
- Set up exponential backoff for retries
- Monitor usage and costs continuously
- Implement circuit breakers for failures

**Error Handling** (MANDATORY):

- Graceful degradation when AI APIs fail
- Fallback responses for service unavailability  
- Comprehensive logging and monitoring
- User-friendly error messages

### 3. PRODUCTION DEPLOYMENT PATTERNS

**API Key Management**:

```bash
# NEVER commit API keys to repository
# Use environment variables or secret management
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
```

**Configuration Management**:

```python
# Use configuration classes for API settings
@dataclass
class AIConfig:
    api_key: str
    model: str
    temperature: float = 0.1
    max_tokens: int = 1000
    safety_settings: Dict[str, str] = field(default_factory=dict)
```

**Monitoring and Observability**:

- Log all AI API requests and responses
- Monitor token usage and costs
- Track response quality and user satisfaction
- Set up alerts for errors and rate limits

### 4. WORKFLOW ORCHESTRATION PATTERNS

**Simple Chat** → Use `openai-python-expert`:

```python
# Single model, single turn conversations
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": prompt}]
)
```

**Multi-turn Conversations** → Use `openai-python-expert` or `gemini-api-expert`:

```python
# Conversation history management
conversation_manager.add_message("user", user_input)
response = conversation_manager.continue_conversation(conversation_id)
```

**Complex Workflows** → Use `langgraph-workflow-expert`:

```python
# Multi-agent workflows with state management
workflow = StateGraph(WorkflowState)
workflow.add_node("researcher", research_agent)
workflow.add_node("analyzer", analysis_agent)
workflow.add_conditional_edges("researcher", route_to_analyzer)
```

### 5. INTEGRATION TESTING REQUIREMENTS

**Unit Tests** (MANDATORY):

- Mock AI API responses for consistent testing
- Test error handling and edge cases
- Validate input/output processing
- Test rate limiting and retry logic

**Integration Tests** (REQUIRED):

- Test with real API endpoints (using test keys)
- Validate end-to-end workflows
- Test concurrent request handling
- Verify safety filters and content moderation

**Performance Tests** (REQUIRED):

- Load testing with concurrent requests
- Token usage optimization testing
- Response time monitoring
- Cost optimization validation

### 6. COST OPTIMIZATION STRATEGIES

**Model Selection**:

- Use GPT-3.5-turbo for simple tasks
- Reserve GPT-4 for complex reasoning
- Use smaller embedding models when sufficient
- Implement model switching based on complexity

**Token Management**:

- Implement conversation pruning for long chats
- Use summarization for context compression
- Cache frequently requested responses
- Optimize prompt engineering for token efficiency

**Batch Processing**:

- Group similar requests for batch processing
- Implement async processing for non-real-time tasks
- Use streaming for long responses
- Implement request deduplication

## AGENT COORDINATION RULES

### When to Use Multiple Agents

**OpenAI + LangGraph**: Complex workflows with OpenAI models
**Gemini + LangGraph**: Multimodal workflows with state management
**OpenAI + Gemini**: Comparative analysis or model ensemble approaches

### Agent Communication Patterns

```python
# Use Task tool to coordinate multiple AI agents
Task 1: "Use openai-python-expert to generate initial response"
Task 2: "Use gemini-api-expert to analyze and enhance the response"  
Task 3: "Use langgraph-workflow-expert to orchestrate the full pipeline"
```

## COMPLIANCE AND GOVERNANCE

### Data Privacy (MANDATORY)

- Never send PII to AI APIs without encryption
- Implement data retention policies
- Set up audit logging for AI interactions
- Comply with GDPR/CCPA requirements

### Model Governance

- Document model versions and capabilities
- Implement A/B testing for model changes
- Set up model performance monitoring
- Create rollback procedures for model issues

### Usage Monitoring

- Track API usage by user/session
- Monitor response quality metrics
- Set up cost alerts and budgets
- Generate usage reports for stakeholders

## VIOLATIONS AND ENFORCEMENT

**CRITICAL VIOLATIONS** (Block deployment):

- API keys committed to repository
- Missing content safety filters
- No error handling for AI API failures
- Unbounded token usage without limits

**MAJOR VIOLATIONS** (Require fixes):

- Missing rate limiting implementation
- No monitoring or logging setup
- Inadequate testing coverage
- Missing cost optimization strategies

These patterns ensure responsible, secure, and cost-effective AI integration across all projects.
