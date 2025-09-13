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
Task: Create multi-agent research workflow with coordinator, researcher, analyzer, and writer agents
Agent: langgraph-workflow-expert
Parameters: workflow_type=multi-agent, agents=4, state_management=checkpoints, routing=complex
```

## Related Agents
- openai-python-expert: For OpenAI model integration
- gemini-api-expert: For Google AI model integration