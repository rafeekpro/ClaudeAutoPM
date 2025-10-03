---
name: openai-chat-integration
type: ai-integration
category: ai
---

# OpenAI Chat Integration Command

Create a complete chat application using OpenAI Python SDK with advanced features.

## Command
```
/ai:openai-chat
```

## Purpose
Use the openai-python-expert agent to create a production-ready chat application with OpenAI integration, including function calling, embeddings, and safety features.

## Parameters
- `model`: OpenAI model to use (gpt-4, gpt-3.5-turbo, gpt-4-vision-preview)
- `features`: Required features (streaming, function-calling, embeddings, vision)
- `safety`: Safety configuration (content-filtering, rate-limiting, moderation)
- `storage`: Conversation storage (memory, database, file)

## Agent Usage
```
Use the openai-python-expert agent to create a comprehensive chat application with OpenAI integration.
```

## Expected Outcome
- Complete chat application with OpenAI SDK integration
- Streaming response handling
- Function calling implementation
- Rate limiting and error handling
- Conversation persistence
- Content moderation and safety controls
- Production-ready configuration

## Example Usage
```
## Required Documentation Access

**MANDATORY:** Before AI integration and LLM workflows, query Context7 for best practices:

**Documentation Queries:**
- `mcp://context7/ai/llm-integration` - llm integration best practices
- `mcp://context7/ai/workflow-orchestration` - workflow orchestration best practices
- `mcp://context7/openai/api` - api best practices
- `mcp://context7/langchain/agents` - agents best practices

**Why This is Required:**
- Ensures adherence to current industry standards and best practices
- Prevents outdated or incorrect implementation patterns
- Provides access to latest framework/tool documentation
- Reduces errors from stale knowledge or assumptions


Task: Create chat application with GPT-4, streaming responses, function calling for web search, and conversation history
Agent: openai-python-expert
Parameters: model=gpt-4, features=streaming,function-calling,embeddings, safety=content-filtering,rate-limiting, storage=database
```

## Related Agents
- gemini-api-expert: For Google AI alternative
- langgraph-workflow-expert: For complex conversation workflows