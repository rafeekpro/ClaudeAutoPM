## Project Management

> **FILL IN — generated placeholder.** The installer could not determine this
> project's CI/CD arrangement, so it made no assumption. Replace this section
> with what is actually true: name the provider (GitHub Actions, Azure
> Pipelines, GitLab CI, …) and how it is triggered, or state plainly that the
> project runs no CI and verification is manual.

### Development Workflow

1. **Local Development**
   - Make changes locally
   - Run tests before pushing
   - Keep commits small and focused

2. **Verification**
   - FILL IN: the commands that must pass before a change is proposed
   - FILL IN: whether they run locally, in CI, or both

3. **Deployment**
   - FILL IN: how a change reaches production, and who triggers it

### Version Control

Branch-based workflow (see the git rules and prohibitions above — direct
commits to the default branch are not permitted):

```bash
git checkout -b feature/{description}
git add .
git commit -m "{type}({scope}): {description}"
git push -u origin feature/{description}
# Open a PR for review
```
