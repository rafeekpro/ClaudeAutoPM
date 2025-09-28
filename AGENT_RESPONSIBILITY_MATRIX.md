# Agent Responsibility Matrix - Clear Boundaries

## Python Backend Development

### python-backend-expert
**OWNS**:
- New project architecture and setup
- Framework selection (FastAPI vs Flask vs Django)
- Database schema design
- API design patterns
- Performance architecture decisions

**DOES NOT OWN**:
- Day-to-day feature implementation
- Bug fixes in existing code
- Minor refactoring tasks

### python-backend-engineer
**OWNS**:
- Feature implementation in existing projects
- Bug fixes and debugging
- Code refactoring and optimization
- Unit test writing
- Day-to-day development tasks

**DOES NOT OWN**:
- Major architectural decisions
- Framework selection
- Database redesign

---

## React Development

### react-ui-expert
**OWNS**:
- UI component library selection (MUI, Chakra, Ant Design)
- Component architecture and design systems
- Styling strategies (CSS-in-JS, Tailwind)
- Accessibility patterns
- Component documentation

**DOES NOT OWN**:
- Application routing
- State management architecture
- API integration
- Business logic

### react-frontend-engineer
**OWNS**:
- Full application architecture
- State management (Redux, Context, Zustand)
- Routing and navigation
- API integration patterns
- Application performance optimization
- Build configuration

**DOES NOT OWN**:
- Deep UI component customization
- Design system creation
- Component library development

---

## Cloud Infrastructure

### aws-cloud-architect / azure-cloud-architect / gcp-cloud-architect
**OWNS**:
- Platform-specific services (Lambda, Azure Functions, Cloud Run)
- Native cloud tools and console operations
- Platform-specific best practices
- Cost optimization for specific cloud
- Security configurations specific to platform
- Quick prototypes and POCs

**DOES NOT OWN**:
- Complex Terraform module development
- Multi-cloud strategies
- IaC standardization across teams

### terraform-infrastructure-expert
**OWNS**:
- Infrastructure as Code architecture
- Terraform module development and patterns
- Multi-cloud deployments
- State management strategies
- IaC best practices and standards
- GitOps workflows
- Complex infrastructure automation

**DOES NOT OWN**:
- Platform-specific service details
- Cloud console operations
- Quick manual setups

---

## Container Orchestration

### docker-containerization-expert
**OWNS**:
- Dockerfile optimization
- Docker Compose for development
- Container security scanning
- Multi-stage builds
- Local development environments
- Docker registry management

**DOES NOT OWN**:
- Production Kubernetes deployments
- K8s cluster management
- Service mesh configuration

### kubernetes-orchestrator
**OWNS**:
- K8s cluster architecture
- Deployment strategies (blue-green, canary)
- Service mesh (Istio, Linkerd)
- K8s security policies
- Helm charts and operators
- Production orchestration

**DOES NOT OWN**:
- Dockerfile creation
- Local Docker development
- Container build optimization

---

## MCP (Model Context Protocol)

### mcp-manager
**OWNS**:
- MCP server installation and setup
- Server lifecycle management
- Server configuration files
- MCP protocol implementation
- Server health monitoring

**DOES NOT OWN**:
- Context optimization strategies
- Agent coordination patterns
- Context content decisions

### mcp-context-manager
**OWNS**:
- Context optimization strategies
- Agent coordination via MCP
- Context sharing patterns
- Performance optimization
- Context content curation

**DOES NOT OWN**:
- Server installation
- Protocol implementation
- Server configuration

---

## Testing

### e2e-test-engineer
**OWNS**:
- End-to-end test strategy
- Playwright/Cypress implementation
- Visual regression testing
- Cross-browser testing
- Test automation architecture

**DOES NOT OWN**:
- Unit test patterns
- Component testing
- API testing
- Performance testing

### test-runner (core agent)
**OWNS**:
- Test execution and reporting
- CI/CD test integration
- Test result analysis
- Flaky test detection

**DOES NOT OWN**:
- Test writing
- Test strategy
- Framework selection

---

## Decision Rules for Agent Selection

1. **Architecture vs Implementation**
   - Need design decisions? → Use "expert" agents
   - Need to build something? → Use "engineer" agents

2. **Platform-Specific vs Cross-Platform**
   - Single cloud platform? → Use cloud architect
   - Multi-cloud or IaC focus? → Use terraform expert

3. **Component vs Application**
   - UI components only? → react-ui-expert
   - Full app with routing? → react-frontend-engineer

4. **Local vs Production**
   - Local development? → docker-containerization-expert
   - Production deployment? → kubernetes-orchestrator

5. **Setup vs Usage**
   - Installing/configuring? → mcp-manager
   - Optimizing/coordinating? → mcp-context-manager

---

## Gap Coverage Plan

### High Priority Gaps
1. **Frontend Testing Agent** - Unit/integration testing for React/Vue/Angular
2. **Observability Agent** - Prometheus, Grafana, ELK, APM tools
3. **Message Queue Agent** - Kafka, RabbitMQ, SQS, Event streaming

### Medium Priority Gaps
1. **Mobile Development Agent** - React Native, Flutter
2. **API Gateway Agent** - Kong, AWS API Gateway, Azure API Management
3. **Data Pipeline Agent** - Apache Spark, dbt, streaming

### Low Priority Gaps
1. **GraphQL Agent** - Schema design, resolvers, Federation
2. **Microservices Agent** - Service mesh, distributed systems
3. **Security Agent** - OWASP, penetration testing, security scanning