## GitHub Actions CI/CD

### Automated workflows with GitHub Actions

This project uses GitHub Actions for continuous integration and deployment.

#### Quick Start
```bash
# Check workflow status
gh workflow list
gh run list

# Trigger manual workflow
gh workflow run ci.yml

# View logs
gh run view --log
```

#### Configured Workflows
- **CI Pipeline**: Runs on every push and PR
- **Release**: Automated releases on version tags
- **Security Scans**: Dependency and code scanning
- **Deploy**: Automated deployment to environments

#### Local Testing
```bash
# Act - run GitHub Actions locally
act push                    # Simulate push event
act pull_request           # Simulate PR event
act -l                     # List all workflows
```

See `.github/workflows/` for workflow definitions.