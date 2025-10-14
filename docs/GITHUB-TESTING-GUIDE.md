# GitHub Integration Testing Guide

This guide explains how to set up and run GitHub integration tests for ClaudeAutoPM.

## Prerequisites

### 1. GitHub Personal Access Token (PAT)

Create a GitHub Personal Access Token with the following scopes:

1. Go to [GitHub Token Settings](https://github.com/settings/tokens/new)
2. Set token name: `ClaudeAutoPM Testing`
3. Select scopes:
   - ✅ `repo` - Full control of private repositories
   - ✅ `workflow` - Update GitHub Action workflows
4. Click "Generate token"
5. **Copy the token immediately** (you won't be able to see it again)

### 2. Test Repository

You need a GitHub repository for testing:

- Can be a new empty repository
- Or an existing repository you have write access to
- Tests will create/update/close issues in this repository
- **Note:** Tests clean up after themselves, but use a test repo to be safe

### 3. Environment Variables

Set the following environment variables:

```bash
# Your GitHub Personal Access Token
export GITHUB_TOKEN=ghp_your_token_here

# Your GitHub username
export GITHUB_OWNER=your_username

# Repository name (without owner prefix)
export GITHUB_REPO=test-repo
```

**Tip:** Add these to your `.bashrc`, `.zshrc`, or create a `.env.test` file:

```bash
# .env.test
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER=myusername
GITHUB_REPO=autopm-test
```

Then source it: `source .env.test`

## Running Tests

### Quick Manual Test

First, verify your GitHub credentials are working:

```bash
node test/integration/test-github-manual.js
```

This will:
- ✅ Verify credentials are set
- ✅ Test authentication
- ✅ Check rate limits
- ✅ List repository issues

**Expected output:**

```
🧪 GitHub API Manual Test

────────────────────────────────────────────────────────────

1. Checking credentials...

   ✓ GITHUB_TOKEN set
   ✓ GITHUB_OWNER: username
   ✓ GITHUB_REPO: test-repo

2. Initializing GitHub provider...

3. Testing authentication...

   ✓ Authentication successful

4. Checking rate limit...

   ✓ Rate limit: 4998/5000 requests remaining
   Reset at: 10/14/2025, 2:30:00 PM

5. Listing repository issues...

   ✓ Found 3 issues in repository

   Recent issues:
     #123: Test issue [open]
     #122: Another issue [closed]
     #121: Sample issue [open]

────────────────────────────────────────────────────────────

✅ All tests passed!
```

### Full Integration Test Suite

Run the complete Jest integration tests:

```bash
# Standard run
npm run test:github:integration

# Verbose output
npm run test:github:integration:verbose

# With explicit credentials
GITHUB_TOKEN=xxx GITHUB_OWNER=user GITHUB_REPO=repo npm run test:github:integration
```

**Test coverage:**

1. **GitHubProvider Tests** (7 tests)
   - Authentication
   - Issue listing
   - Issue creation
   - Issue retrieval
   - Issue updates
   - Comment operations

2. **IssueService Sync Tests** (5 tests)
   - Push local issue to GitHub
   - Check sync status
   - Pull GitHub updates
   - Update push
   - Bidirectional sync

3. **Conflict Detection Tests** (2 tests)
   - Detect conflicts
   - Resolve with strategies

4. **Error Handling Tests** (2 tests)
   - Non-existent issues
   - Invalid issue numbers

5. **Rate Limiting Tests** (1 test)
   - Rate limit respect

**Total:** 17 comprehensive tests

### Running Specific Test Groups

```bash
# Run only GitHubProvider tests
npm run test:github:integration -- -t "GitHubProvider"

# Run only sync tests
npm run test:github:integration -- -t "IssueService"

# Run only conflict tests
npm run test:github:integration -- -t "Conflict"
```

## Troubleshooting

### Error: Missing credentials

```
⚠️  GitHub integration tests skipped - missing credentials
Set: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO
```

**Solution:** Set all three environment variables as described above.

### Error: 401 Unauthorized

```
❌ Test failed!
Error: Request failed with status code 401
```

**Possible causes:**
- Invalid GitHub token
- Token has expired
- Token lacks required permissions

**Solution:**
1. Verify token is correct
2. Check token hasn't expired
3. Ensure token has `repo` and `workflow` scopes
4. Generate a new token if needed

### Error: 404 Not Found

```
❌ Test failed!
Error: Not Found
```

**Possible causes:**
- Repository doesn't exist
- Repository name is incorrect
- Token lacks access to repository

**Solution:**
1. Verify repository exists: `https://github.com/{OWNER}/{REPO}`
2. Check repository name is correct (no typos)
3. Ensure token has access to the repository

### Error: Rate limit exceeded

```
❌ Test failed!
Error: API rate limit exceeded
```

**Solution:**
- Wait for rate limit reset (check reset time)
- Use a different GitHub token
- Authenticated requests have 5,000 req/hour limit

### Tests create issues but don't clean up

**Normal behavior:** Tests create test issues and should automatically close them in `afterAll`.

**If cleanup fails:**
1. Issues will have `[TEST]` prefix in title
2. Manually close them in GitHub UI
3. Or use this script:

```bash
# Close all test issues
gh issue list --label "test,automation" --state open | \
  awk '{print $1}' | \
  xargs -I {} gh issue close {}
```

## CI/CD Integration

### GitHub Actions

Add to your workflow:

```yaml
name: GitHub Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - name: Run GitHub Integration Tests
        env:
          GITHUB_TOKEN: ${{ secrets.TEST_GITHUB_TOKEN }}
          GITHUB_OWNER: ${{ secrets.TEST_GITHUB_OWNER }}
          GITHUB_REPO: ${{ secrets.TEST_GITHUB_REPO }}
        run: npm run test:github:integration
```

**Setup GitHub Secrets:**
1. Go to repository Settings → Secrets and variables → Actions
2. Add secrets:
   - `TEST_GITHUB_TOKEN`
   - `TEST_GITHUB_OWNER`
   - `TEST_GITHUB_REPO`

### Local CI Simulation

```bash
# Simulate CI environment
CI=true npm run test:github:integration
```

## Test Data Management

### What tests create:

- **1 test issue** per test run
- **Labels:** `test`, `automation`
- **Title prefix:** `[TEST]`
- **Auto-cleanup:** Issue closed in `afterAll`

### Manual cleanup:

If you need to clean up test data manually:

```bash
# List test issues
gh issue list --label "test,automation" --repo $GITHUB_OWNER/$GITHUB_REPO

# Close all test issues
gh issue list --label "test,automation" --state open --repo $GITHUB_OWNER/$GITHUB_REPO | \
  awk '{print $1}' | \
  xargs -I {} gh issue close {} --repo $GITHUB_OWNER/$GITHUB_REPO

# Delete test issues (if you have admin access)
# Note: GitHub doesn't allow permanent deletion via API
```

## Performance Considerations

### Rate Limits

- **Authenticated:** 5,000 requests/hour
- **Test suite uses:** ~20-30 requests per run
- **Can run:** ~150-250 times per hour

### Test Duration

- **Manual test:** ~5 seconds
- **Full suite:** ~60-90 seconds
- **Timeout:** 30 seconds per test

### Optimization Tips

1. **Reuse test data:** Tests create one issue and reuse it
2. **Parallel execution:** Tests are independent (when safe)
3. **Mock in unit tests:** Use mocks, save integration for E2E

## Best Practices

### Development Workflow

1. **Always run manual test first:**
   ```bash
   node test/integration/test-github-manual.js
   ```

2. **Then run specific test groups:**
   ```bash
   npm run test:github:integration -- -t "GitHubProvider"
   ```

3. **Full suite before commit:**
   ```bash
   npm run test:github:integration
   ```

### Security

- **Never commit tokens** in code or `.env` files
- **Use separate tokens** for testing vs production
- **Revoke tokens** when no longer needed
- **Use repository secrets** in CI/CD

### Test Isolation

- **Each test cleans up after itself**
- **Tests are independent** (can run in any order)
- **No shared state** between tests

## Additional Resources

- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [Octokit.js Documentation](https://octokit.github.io/rest.js/)
- [GitHub Token Permissions](https://docs.github.com/en/rest/overview/permissions-required-for-github-apps)
- [Rate Limiting](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)

## Support

If you encounter issues:

1. **Check this guide** for troubleshooting
2. **Run manual test** to isolate the problem
3. **Check GitHub status:** [githubstatus.com](https://www.githubstatus.com/)
4. **Open an issue:** [GitHub Issues](https://github.com/rafeekpro/ClaudeAutoPM/issues)

---

**Last Updated:** 2025-10-14
**Version:** 2.8.0-alpha
**Status:** Active Development
