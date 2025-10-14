---
name: langgraph-workflow
type: ai-workflow
category: ai
---

# LangGraph Workflow Command

Create complex AI workflows using LangGraph with state management and multi-agent collaboration.

## Command
```
/ai:langgraph-workflow
```

## Purpose
Use the langgraph-workflow-expert agent to create sophisticated AI workflows with graph-based orchestration, state management, and conditional routing.

## Parameters
- `workflow_type`: Type of workflow (conversational, data-processing, multi-agent, human-in-loop)
- `agents`: Number and types of agents in the workflow
- `state_management`: State persistence (memory, database, checkpoints)
- `routing`: Conditional routing logic (simple, complex, ml-based)

## Agent Usage
```
Use the langgraph-workflow-expert agent to create a comprehensive LangGraph workflow system.
```

## Expected Outcome
- Complete LangGraph workflow implementation
- State schema and management
- Multi-agent coordination patterns
- Conditional routing and decision trees
- Human-in-the-loop integration
- Error handling and recovery mechanisms
- Monitoring and debugging tools

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


Task: Create multi-agent research workflow with coordinator, researcher, analyzer, and writer agents
Agent: langgraph-workflow-expert
Parameters: workflow_type=multi-agent, agents=4, state_management=checkpoints, routing=complex
```

## Related Agents
- openai-python-expert: For OpenAI model integration
- gemini-api-expert: For Google AI model integration