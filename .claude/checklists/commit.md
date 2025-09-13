# Commit Checklist

## Automated Verification (Git Hooks)

- [ ] Pre-commit hook installed and working
- [ ] Pre-push hook configured for full validation
- [ ] Safe-commit script available at `scripts/safe-commit.sh`

## Before Committing

- [ ] Tests written and passing (`npm test`)
- [ ] Build successful (`npm run build`)
- [ ] Code formatted (prettier/black)
- [ ] Linting clean (`npm run lint`)
- [ ] TypeScript checks passing (`npm run typecheck`)
- [ ] No hardcoded values or secrets
- [ ] Error handling implemented
- [ ] Security considerations addressed
- [ ] Performance acceptable

## Code Quality

- [ ] No code duplication
- [ ] Functions are single-purpose
- [ ] Variable names are descriptive
- [ ] Comments explain "why", not "what"
- [ ] No debugging code left behind

## Testing

- [ ] Unit tests cover new functionality
- [ ] Integration tests updated if needed
- [ ] Manual testing completed
- [ ] Edge cases considered

## Documentation

- [ ] README updated if needed
- [ ] API documentation current
- [ ] Changelog entry added
- [ ] Breaking changes documented

## Before Push

- [ ] E2E tests passing (`npm run test:e2e`)
- [ ] CI simulation successful (`npm run ci:local`)
- [ ] Recent commits reviewed (`git log -3`)
- [ ] No merge conflicts
- [ ] No large files accidentally added
- [ ] No TODO/FIXME comments left

## Final Checks

- [ ] Build passes locally
- [ ] No console errors/warnings
- [ ] Memory leaks checked
- [ ] Cross-browser compatibility (for frontend)
- [ ] Mobile responsiveness (for UI changes)

## Emergency Bypass (Use Sparingly!)

```bash
# Only in critical situations
git commit --no-verify -m "emergency: critical fix"
git push --no-verify

# Always verify afterward
npm run ci:local
```

## Post-Commit

- [ ] CI/CD pipeline passes
- [ ] Deployment successful (if applicable)
- [ ] Monitoring shows no issues
- [ ] Team notified of breaking changes

## Troubleshooting

- Tests fail? Run `npm test -- --verbose`
- Build fails? Try `rm -rf node_modules && npm install`
- Hooks not working? Check `.git/hooks/` permissions
- CI fails but local passes? Check environment differences