## AGENT SELECTION GUIDANCE

Use specialized agents for Docker + Kubernetes workflows:

### Kubernetes Specialists (PRIMARY)

#### kubernetes-orchestrator
**Use for**: K8s manifests, deployments, services
- Deployment strategies
- Service mesh configuration
- Ingress and networking
- RBAC and security policies

#### terraform-infrastructure-expert
**Use for**: Infrastructure as Code
- Multi-cloud deployments
- State management
- Module development
- GitOps workflows

### Container Specialists

#### docker-containerization-expert
**Use for**: Production-grade images
- Multi-stage builds
- Security hardening
- Base image selection
- Layer optimization

#### docker-containerization-expert
**Use for**: Local development orchestration
- Development parity with K8s
- Service dependencies
- Local testing environments

### Cloud Platform Specialists

#### gcp-cloud-architect
**Use for**: GKE deployments
- GKE cluster configuration
- Cloud Build pipelines
- Artifact Registry
- Workload Identity

#### aws-cloud-architect
**Use for**: EKS deployments
- EKS cluster setup
- ECR registry
- IAM roles for service accounts
- ALB ingress controller

#### azure-cloud-architect
**Use for**: AKS deployments
- AKS cluster management
- Azure Container Registry
- Azure AD integration
- Application Gateway ingress

### DevOps & CI/CD Agents

#### github-operations-specialist
**Use for**: GitHub Actions pipelines
- KIND cluster testing
- Multi-environment deployments
- Helm chart automation
- GitOps with ArgoCD

#### azure-devops-specialist
**Use for**: Enterprise pipelines
- Azure Pipelines for K8s
- Multi-stage deployments
- Approval gates
- Integration with AKS

### Monitoring & Observability

#### prometheus-grafana-expert (implied)
- Metrics collection
- Dashboard creation
- Alert configuration
- SLO/SLI tracking

### Security Agents

#### security-scanning-expert (implied)
- Container vulnerability scanning
- SAST/DAST in pipelines
- Policy as code
- Compliance validation

---

**📋 Full Agent Details**: For complete agent descriptions, parameters, tools, and file locations, see `.claude/agents/AGENT-REGISTRY.md`