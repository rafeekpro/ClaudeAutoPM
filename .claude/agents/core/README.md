# Core Agents

Essential agents that form the foundation of the Claude Code agent ecosystem. These agents are used across all projects regardless of technology stack.

## Available Agents

### 📊 file-analyzer
- **Purpose**: Extract and summarize critical information from files
- **Use Cases**: Log analysis, configuration review, large file summarization
- **Token Reduction**: 80-90% while preserving 100% critical information

### 🔍 code-analyzer  
- **Purpose**: Bug hunting, logic tracing, and vulnerability detection
- **Use Cases**: Code review, debugging, security analysis
- **Output**: Risk-assessed findings with actionable fixes

### 🧪 test-runner
- **Purpose**: Execute tests and provide comprehensive analysis
- **Use Cases**: Test execution, failure analysis, flaky test detection
- **Features**: Structured reports with health scores

### 🔄 parallel-worker
- **Purpose**: Coordinate multiple work streams in parallel
- **Use Cases**: Large refactoring, multi-file updates, parallel development
- **Coordination**: File-level locking and handoff protocols

## Usage Guidelines

1. **Always use these agents** for their specialized tasks
2. **Never use direct commands** when an agent exists (e.g., use file-analyzer instead of `cat`)
3. **Chain agents** for complex workflows (e.g., code-analyzer → test-runner)

## Context Optimization

Core agents are designed to:
- Return only 10-20% of processed data
- Preserve 100% of critical information
- Provide structured, actionable outputs
- Self-verify their results