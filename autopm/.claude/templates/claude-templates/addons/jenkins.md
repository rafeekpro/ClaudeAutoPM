## Jenkins CI/CD

### Continuous Integration with Jenkins

This project uses Jenkins for automated builds and deployments.

#### Quick Start
```bash
# Jenkins CLI
java -jar jenkins-cli.jar -s http://jenkins-server/ build <job-name>
java -jar jenkins-cli.jar -s http://jenkins-server/ console <job-name>
```

#### Pipeline Configuration
- **Jenkinsfile**: Defines pipeline as code
- **Stages**: Checkout → Build → Test → Deploy
- **Agents**: Docker containers or dedicated nodes
- **Plugins**: Git, Docker, Slack notifications

#### Local Development
```bash
# Validate Jenkinsfile
curl -X POST -F "jenkinsfile=<Jenkinsfile" http://jenkins-server/pipeline-model-converter/validate
```

#### Build Triggers
- Push to branches
- Pull request events
- Scheduled builds (cron)
- Manual triggers

See `Jenkinsfile` for pipeline definition.