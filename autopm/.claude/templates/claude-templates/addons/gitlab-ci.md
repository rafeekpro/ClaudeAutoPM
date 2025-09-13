## GitLab CI/CD

### Continuous Integration with GitLab

This project uses GitLab CI/CD for automated testing and deployment.

#### Quick Start
```bash
# Check pipeline status
git pipeline status
git pipeline list

# View job logs
git job logs <job-id>

# Trigger manual pipeline
git push -o ci.skip=false
```

#### Pipeline Configuration
- **CI Pipeline**: `.gitlab-ci.yml` defines all stages
- **Stages**: build → test → deploy
- **Environments**: dev, staging, production
- **Security**: SAST, dependency scanning, container scanning

#### Local Testing
```bash
# GitLab Runner local execution
gitlab-runner exec docker test
gitlab-runner exec docker build
```

See `.gitlab-ci.yml` for pipeline configuration.