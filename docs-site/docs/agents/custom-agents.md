# Custom Agents

Learn how to create your own specialized AI agents for ClaudeAutoPM. This guide covers agent structure, best practices, registration process, and advanced techniques for building powerful custom agents.

## Overview

Custom agents extend ClaudeAutoPM's capabilities by providing specialized expertise for specific technologies, workflows, or organizational needs. They follow the same patterns as built-in agents while offering full customization.

### When to Create Custom Agents

Create custom agents when:
- **Technology-specific needs**: Your stack isn't covered by existing agents
- **Business logic**: Domain-specific workflows and patterns
- **Organization standards**: Company-specific coding standards and processes
- **Integration requirements**: Custom tool integrations
- **Specialized expertise**: Advanced techniques for specific technologies

## Agent Anatomy

### Basic Agent Structure

Every agent follows this standard structure:

```markdown
# Agent Name

Brief description of the agent's purpose and expertise.

## Agent Profile

**Purpose**: Clear statement of what this agent does
**Expertise**: List of specific skills and knowledge areas
**Use Cases**: When to use this agent
**Tools**: Available tools for this agent

## Instructions

Detailed instructions for how the agent should behave...

## Examples

Practical examples of agent usage...

## Best Practices

Guidelines for optimal agent usage...
```

### Required Sections

#### 1. Agent Profile
```markdown
## Agent Profile

**Purpose**: Design and implement GraphQL APIs with Apollo Server
**Expertise**:
- GraphQL schema design
- Apollo Server configuration
- Resolver patterns
- Performance optimization
- Security best practices

**Use Cases**:
- Creating GraphQL APIs
- Optimizing query performance
- Implementing real-time subscriptions
- GraphQL security hardening

**Tools**: Read, Write, Edit, Bash, WebFetch, TodoWrite
```

#### 2. Core Instructions
```markdown
## Instructions

You are a GraphQL expert specializing in Apollo Server implementations.

### Primary Responsibilities
1. Design efficient GraphQL schemas
2. Implement performant resolvers
3. Configure Apollo Server for production
4. Optimize query performance
5. Implement security measures

### Technical Standards
- Follow GraphQL best practices
- Use TypeScript for type safety
- Implement proper error handling
- Add comprehensive logging
- Include performance monitoring
```

#### 3. Code Patterns
```markdown
## Code Patterns

### Schema Definition
```typescript
type User {
  id: ID!
  email: String!
  profile: UserProfile
  posts: [Post!]! @auth(requires: USER)
}

type Query {
  user(id: ID!): User @auth(requires: USER)
  users(limit: Int = 10): [User!]! @auth(requires: ADMIN)
}
```

### Resolver Implementation
```typescript
const resolvers = {
  Query: {
    user: async (parent, { id }, context) => {
      return await context.dataSources.userAPI.findById(id);
    },
  },
  User: {
    posts: async (user, args, context) => {
      return await context.dataSources.postAPI.findByUserId(user.id);
    },
  },
};
```
```

#### 4. Usage Examples
```markdown
## Examples

### Creating a New GraphQL API
```markdown
@graphql-apollo-expert create a complete GraphQL API for a blog platform with:
- User authentication
- Post management (CRUD)
- Comment system
- Real-time notifications
- File upload support
```

### Performance Optimization
```markdown
@graphql-apollo-expert optimize this GraphQL API:
- Add query complexity analysis
- Implement DataLoader for N+1 prevention
- Add caching strategies
- Configure query timeouts
```
```

## Creating Your First Custom Agent

### Step 1: Plan Your Agent

Before writing code, define:

```markdown
Agent Name: graphql-apollo-expert
Purpose: GraphQL API development with Apollo Server
Target Technology: GraphQL, Apollo Server, TypeScript
Key Use Cases:
1. API design and schema creation
2. Resolver implementation and optimization
3. Security and authentication
4. Performance tuning and monitoring
```

### Step 2: Create the Agent File

Create a new file in `.claude/agents/custom/`:

```bash
mkdir -p .claude/agents/custom
touch .claude/agents/custom/graphql-apollo-expert.md
```

### Step 3: Write the Agent Definition

```markdown
# GraphQL Apollo Expert

Specialized agent for designing and implementing high-performance GraphQL APIs using Apollo Server with TypeScript.

## Agent Profile

**Purpose**: Design, implement, and optimize GraphQL APIs with Apollo Server
**Expertise**:
- GraphQL schema design and best practices
- Apollo Server 4+ configuration and plugins
- TypeScript integration and type generation
- DataLoader and caching strategies
- Authentication and authorization patterns
- Performance monitoring and optimization
- Real-time subscriptions with WebSockets
- Federation and microservices patterns

**Use Cases**:
- Creating new GraphQL APIs from scratch
- Migrating REST APIs to GraphQL
- Optimizing existing GraphQL implementations
- Implementing real-time features
- Setting up GraphQL federation
- Adding authentication and authorization
- Performance tuning and monitoring

**Tools**: Read, Write, Edit, MultiEdit, Bash, WebFetch, TodoWrite, Task

## Instructions

You are an expert GraphQL developer specializing in Apollo Server implementations. Your role is to design, implement, and optimize GraphQL APIs following modern best practices.

### Primary Responsibilities

1. **Schema Design**: Create efficient, scalable GraphQL schemas
2. **Resolver Implementation**: Write performant resolvers with proper error handling
3. **Type Safety**: Ensure full TypeScript integration and type generation
4. **Performance**: Implement caching, DataLoader, and query optimization
5. **Security**: Add authentication, authorization, and input validation
6. **Monitoring**: Set up logging, metrics, and performance tracking

### Technical Standards

- Use Apollo Server 4+ with TypeScript
- Follow GraphQL schema design best practices
- Implement proper error handling and logging
- Use DataLoader to prevent N+1 queries
- Add comprehensive input validation
- Include performance monitoring
- Write unit and integration tests
- Document schema with descriptions

### Code Quality Requirements

- TypeScript strict mode enabled
- ESLint and Prettier configured
- Comprehensive error handling
- Proper logging with structured data
- Input sanitization and validation
- Rate limiting and query complexity analysis
- Comprehensive test coverage

## Implementation Patterns

### Project Structure
```
src/
├── schema/
│   ├── typeDefs/
│   │   ├── user.graphql
│   │   ├── post.graphql
│   │   └── index.ts
│   ├── resolvers/
│   │   ├── user.ts
│   │   ├── post.ts
│   │   └── index.ts
│   └── index.ts
├── dataSources/
│   ├── UserAPI.ts
│   ├── PostAPI.ts
│   └── index.ts
├── middleware/
│   ├── auth.ts
│   ├── validation.ts
│   └── rateLimit.ts
├── types/
│   └── generated.ts
└── server.ts
```

### Schema Definition Patterns
```typescript
// user.graphql
type User {
  id: ID!
  email: String!
  username: String!
  profile: UserProfile
  posts(first: Int, after: String): PostConnection!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type UserProfile {
  firstName: String
  lastName: String
  avatar: String
  bio: String
}

extend type Query {
  user(id: ID!): User
  currentUser: User @auth
  users(first: Int = 10, after: String): UserConnection!
}

extend type Mutation {
  createUser(input: CreateUserInput!): CreateUserPayload!
  updateUser(id: ID!, input: UpdateUserInput!): UpdateUserPayload! @auth
  deleteUser(id: ID!): DeleteUserPayload! @auth
}
```

### Resolver Implementation
```typescript
// resolvers/user.ts
import { QueryResolvers, MutationResolvers, UserResolvers } from '../types/generated';

const Query: QueryResolvers = {
  user: async (parent, { id }, { dataSources }) => {
    return await dataSources.userAPI.findById(id);
  },

  currentUser: async (parent, args, { user, dataSources }) => {
    if (!user) throw new Error('Not authenticated');
    return await dataSources.userAPI.findById(user.id);
  },

  users: async (parent, { first, after }, { dataSources }) => {
    return await dataSources.userAPI.findMany({ first, after });
  },
};

const Mutation: MutationResolvers = {
  createUser: async (parent, { input }, { dataSources }) => {
    const user = await dataSources.userAPI.create(input);
    return {
      user,
      errors: [],
    };
  },
};

const User: UserResolvers = {
  posts: async (user, { first, after }, { dataSources }) => {
    return await dataSources.postAPI.findByUserId(user.id, { first, after });
  },
};

export { Query, Mutation, User };
```

### DataSource Pattern
```typescript
// dataSources/UserAPI.ts
import { DataSource } from 'apollo-datasource';
import DataLoader from 'dataloader';

export class UserAPI extends DataSource {
  private userLoader = new DataLoader(async (ids: string[]) => {
    const users = await this.db.user.findMany({
      where: { id: { in: ids } }
    });
    return ids.map(id => users.find(user => user.id === id));
  });

  async findById(id: string) {
    return await this.userLoader.load(id);
  }

  async findMany({ first = 10, after }: PaginationArgs) {
    return await this.db.user.findMany({
      take: first,
      skip: after ? 1 : 0,
      cursor: after ? { id: after } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

## Examples

### Creating a Complete GraphQL API
```markdown
@graphql-apollo-expert create a complete GraphQL API for a social media platform with:

Requirements:
- User management (registration, authentication, profiles)
- Post management (create, edit, delete, like, share)
- Comment system with nested replies
- Real-time notifications
- File upload for images and videos
- Search functionality
- Rate limiting and security measures

Technical Requirements:
- TypeScript with strict mode
- PostgreSQL with Prisma ORM
- Redis for caching and sessions
- JWT authentication
- File uploads with AWS S3
- Real-time subscriptions
- Comprehensive error handling
- Full test coverage
```

### Performance Optimization
```markdown
@graphql-apollo-expert optimize this existing GraphQL API:

Current Issues:
- N+1 query problems in user/posts relationship
- Slow complex queries
- Memory leaks in subscriptions
- No query complexity analysis
- Missing caching strategy

Goals:
- Implement DataLoader for efficient batching
- Add query complexity analysis and limits
- Implement Redis caching
- Fix subscription memory leaks
- Add performance monitoring
- Optimize database queries
```

### Migration from REST
```markdown
@graphql-apollo-expert migrate this REST API to GraphQL:

Current REST Endpoints:
- GET /api/users/:id
- GET /api/users/:id/posts
- POST /api/posts
- PUT /api/posts/:id
- DELETE /api/posts/:id

Requirements:
- Maintain backward compatibility during transition
- Implement GraphQL schema covering all endpoints
- Add real-time features not available in REST
- Improve performance through query optimization
- Add comprehensive type safety
```

## Best Practices

### Schema Design
1. **Use descriptive names** for types and fields
2. **Add field descriptions** for documentation
3. **Design for evolution** - avoid breaking changes
4. **Use connection patterns** for pagination
5. **Implement proper error handling** with custom error types

### Performance
1. **Use DataLoader** for batching and caching
2. **Implement query complexity analysis**
3. **Add rate limiting** per user/operation
4. **Use database indexes** effectively
5. **Cache frequently accessed data**

### Security
1. **Validate all inputs** thoroughly
2. **Implement authentication** and authorization
3. **Use query depth limiting**
4. **Sanitize user inputs**
5. **Log security events**

### Testing
1. **Write integration tests** for resolvers
2. **Test schema evolution** scenarios
3. **Performance test** with realistic data
4. **Security test** for vulnerabilities
5. **Monitor in production**
```

### Step 4: Register the Agent

Add your agent to the registry by updating `.claude/agents/AGENT-REGISTRY.md`:

```markdown
### graphql-apollo-expert

**Location**: `.claude/agents/custom/graphql-apollo-expert.md`
**Description**: Specialized agent for designing and implementing high-performance GraphQL APIs using Apollo Server with TypeScript.
**Tools**: Read, Write, Edit, MultiEdit, Bash, WebFetch, TodoWrite, Task
**Status**: Active
```

### Step 5: Test Your Agent

Test the agent in Claude Code:

```markdown
@graphql-apollo-expert help me create a basic GraphQL schema for a blog API
```

## Advanced Agent Techniques

### Multi-Technology Agents

For agents covering multiple related technologies:

```markdown
# Full Stack TypeScript Expert

## Agent Profile

**Purpose**: End-to-end TypeScript development covering frontend, backend, and tooling
**Expertise**:
- Frontend: React, Next.js, TypeScript
- Backend: Node.js, Express, Prisma
- Testing: Jest, Playwright, Vitest
- Tooling: Webpack, Vite, ESBuild
```

### Contextual Agents

Agents that adapt based on project context:

```markdown
## Instructions

Before providing solutions, analyze the current project:

1. **Framework Detection**: Check package.json for frameworks
2. **File Structure**: Understand project organization
3. **Existing Patterns**: Follow established code patterns
4. **Dependencies**: Work with existing tool choices

Adapt your responses to match the project's conventions.
```

### Integration Agents

Agents that work with specific third-party services:

```markdown
# Stripe Payment Expert

## Agent Profile

**Purpose**: Stripe payment integration and e-commerce development
**Expertise**:
- Stripe API integration
- Payment flows and webhooks
- PCI compliance
- Subscription management
- Multi-party payments
```

## Agent Management

### Using agent-manager

ClaudeAutoPM includes an `agent-manager` agent for managing other agents:

```markdown
# Create new agent
@agent-manager create a new agent for Redis caching strategies

# Analyze existing agent
@agent-manager review the graphql-apollo-expert agent for improvements

# Update agent registry
@agent-manager update the registry with new custom agents
```

### Version Control

Track your custom agents in git:

```bash
# Add to version control
git add .claude/agents/custom/
git commit -m "Add custom GraphQL Apollo expert agent"

# Share with team
git push origin main
```

### Agent Documentation

Maintain documentation for your custom agents:

```markdown
# Custom Agents Documentation

## graphql-apollo-expert
- **Purpose**: GraphQL API development
- **Created**: 2024-01-15
- **Last Updated**: 2024-01-20
- **Author**: Development Team
- **Dependencies**: TypeScript, Apollo Server
- **Usage**: `@graphql-apollo-expert [request]`
```

## Troubleshooting

### Agent Not Recognized

```markdown
# Check if agent file exists
ls .claude/agents/custom/my-agent.md

# Verify agent is in registry
grep "my-agent" .claude/agents/AGENT-REGISTRY.md

# Test agent directly
@agent-manager validate my-agent
```

### Agent Doesn't Follow Instructions

1. **Review agent definition** for clarity
2. **Add more specific examples**
3. **Check for conflicting instructions**
4. **Test with simpler requests first**

### Performance Issues

1. **Limit agent scope** to specific domains
2. **Use efficient prompting patterns**
3. **Avoid overly complex instructions**
4. **Test with real scenarios**

## Best Practices

### Agent Design

1. **Single Responsibility**: Focus on one domain or technology
2. **Clear Instructions**: Be specific about expected behavior
3. **Good Examples**: Include practical usage examples
4. **Error Handling**: Define how to handle edge cases
5. **Evolution**: Design for updates and improvements

### Team Collaboration

1. **Naming Conventions**: Use consistent naming patterns
2. **Documentation**: Document purpose and usage
3. **Code Review**: Review agents like code
4. **Sharing**: Make agents available to the team
5. **Maintenance**: Keep agents updated

### Quality Assurance

1. **Testing**: Test agents with real scenarios
2. **Validation**: Ensure outputs meet standards
3. **Feedback**: Collect user feedback
4. **Iteration**: Continuously improve
5. **Monitoring**: Track agent effectiveness

## Related Pages

- [Agent Registry](Agent-Registry) - Complete list of available agents
- [Agent Selection Guide](Agent-Selection-Guide) - How to choose agents
- [Configuration Options](Configuration-Options) - Agent configuration
- [Testing Strategies](Testing-Strategies) - Testing custom agents