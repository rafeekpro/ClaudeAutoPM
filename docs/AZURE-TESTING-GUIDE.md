# Azure DevOps Integration - Testing Guide

Comprehensive guide for testing Azure DevOps integration in ClaudeAutoPM.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Azure DevOps Setup](#azure-devops-setup)
3. [Environment Configuration](#environment-configuration)
4. [Running Tests](#running-tests)
5. [Manual Testing](#manual-testing)
6. [Troubleshooting](#troubleshooting)
7. [Test Coverage](#test-coverage)

---

## Prerequisites

### Required Tools
- Node.js 14+ installed
- npm or yarn package manager
- Git (for version control)
- Azure DevOps account with organization access

### Required Permissions
Your Azure DevOps Personal Access Token (PAT) must have:
- ✅ **Work Items**: Read, Write, & Manage
- ✅ **Project and Team**: Read
- ✅ **Code**: Read (optional, for repository integration)

---

## Azure DevOps Setup

### 1. Create a Test Project

**Recommended:** Create a dedicated test project to avoid affecting production data.

1. Navigate to your Azure DevOps organization: `https://dev.azure.com/{your-organization}`
2. Click **"+ New project"**
3. Configure:
   - **Project name**: `ClaudeAutoPM-Testing` (or similar)
   - **Visibility**: Private
   - **Version control**: Git
   - **Work item process**: Agile (default)
4. Click **Create**

### 2. Generate Personal Access Token (PAT)

1. Click your profile icon (top right) → **Personal access tokens**
2. Click **"+ New Token"**
3. Configure:
   - **Name**: `ClaudeAutoPM Integration Tests`
   - **Organization**: Select your organization
   - **Expiration**: 90 days (recommended for testing)
   - **Scopes**:
     - ✅ Work Items (Read, write, & manage)
     - ✅ Project and Team (Read)
4. Click **Create**
5. **IMPORTANT**: Copy the token immediately (it won't be shown again)

### 3. Verify Project Configuration

1. Open your test project
2. Go to **Boards** → **Work Items**
3. Verify these work item types exist:
   - Epic
   - Feature
   - User Story
   - Task
   - Bug

---

## Environment Configuration

### 1. Set Environment Variables

Create a `.env.test` file in your project root (or export variables):

```bash
# Azure DevOps Configuration
export AZURE_DEVOPS_PAT="your_personal_access_token_here"
export AZURE_DEVOPS_ORG="your_organization_name"
export AZURE_DEVOPS_PROJECT="ClaudeAutoPM-Testing"
```

**Load variables:**
```bash
# On Linux/macOS
source .env.test

# On Windows (PowerShell)
Get-Content .env.test | ForEach-Object {
  if ($_ -match "export (.+)=(.+)") {
    [Environment]::SetEnvironmentVariable($matches[1], $matches[2].Trim('"'), "Process")
  }
}
```

### 2. Verify Configuration

```bash
# Quick verification
node -e "console.log('PAT:', process.env.AZURE_DEVOPS_PAT ? '✓ Set' : '✗ Missing')"
node -e "console.log('ORG:', process.env.AZURE_DEVOPS_ORG || '✗ Missing')"
node -e "console.log('PROJECT:', process.env.AZURE_DEVOPS_PROJECT || '✗ Missing')"
```

Expected output:
```
PAT: ✓ Set
ORG: your_organization_name
PROJECT: ClaudeAutoPM-Testing
```

---

## Running Tests

### 1. Unit Tests (Mocked)

These tests use mocked Azure API and don't require credentials:

```bash
# Run all unit tests
npm test

# Run Azure provider unit tests only
npm test -- test/unit/providers/AzureDevOpsProvider-jest.test.js

# Run IssueService Azure tests
npm test -- test/unit/services/IssueService.azure-sync.test.js

# Run EpicService Azure tests
npm test -- test/unit/services/EpicService.azure-sync.test.js
```

**Expected Results:**
- ✅ AzureDevOpsProvider: 67 tests passing
- ✅ IssueService Azure: 50 tests passing
- ✅ EpicService Azure: 41 tests passing
- **Total**: 158 tests passing

### 2. Integration Tests (Real Azure API)

**⚠️ WARNING:** These tests create and delete real work items in Azure DevOps!

```bash
# Ensure environment variables are set
source .env.test

# Run integration tests
npm run test:integration:azure

# Or run directly with Jest
npx jest test/integration/azure-sync-integration.test.js --runInBand
```

**Test Duration:** ~2-3 minutes (due to API rate limiting)

**What Gets Tested:**
1. ✅ Provider CRUD operations (create, read, update, delete)
2. ✅ Work item comments (add, retrieve)
3. ✅ WIQL queries (filtering, sorting)
4. ✅ Issue sync operations (push, pull, conflict detection)
5. ✅ Epic sync operations (push, pull, status check)
6. ✅ Work item types (Epic, Feature, User Story, Task, Bug)
7. ✅ State management (New → Active → Resolved → Closed)
8. ✅ Error handling (invalid IDs, types, operations)

### 3. Quick Smoke Test

Run a quick verification without full test suite:

```bash
npm run test:azure:quick
```

This runs the manual test script (see below).

---

## Manual Testing

### Manual Test Script

For quick verification and debugging:

```bash
node test/integration/test-azure-manual.js
```

**What It Tests:**
1. Environment configuration
2. Provider authentication
3. Work item creation
4. Work item retrieval and update
5. Comments
6. WIQL queries
7. Issue sync (local → Azure)
8. Epic creation and sync
9. Multiple work item types
10. Cleanup

**Output Example:**
```
🧪 Azure DevOps Manual Integration Test

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  1. Environment Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ AZURE_DEVOPS_PAT found
✓ Organization: your-org
✓ Project: ClaudeAutoPM-Testing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  2. Provider Initialization
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Provider created
✓ Authentication successful
...
```

### CLI Manual Testing

Test the CLI commands directly:

```bash
# Set up environment
source .env.test

# Create a test local issue
echo "---
id: 12345
title: Test CLI Sync
status: open
---

# Test CLI Sync

Testing Azure sync via CLI.
" > .claude/issues/12345.md

# Test sync to Azure
node bin/autopm.js issue sync 12345 --provider azure

# Check sync status
node bin/autopm.js issue sync-status 12345 --provider azure

# Pull from Azure
node bin/autopm.js issue sync 12345 --provider azure --pull
```

---

## Troubleshooting

### Common Issues

#### 1. Authentication Failed

**Error:** `Authentication failed` or `401 Unauthorized`

**Solutions:**
- Verify PAT is correct: `echo $AZURE_DEVOPS_PAT`
- Check PAT hasn't expired in Azure DevOps
- Verify PAT has correct scopes (Work Items: Read, write, & manage)
- Regenerate PAT if needed

#### 2. Project Not Found

**Error:** `Project 'X' not found`

**Solutions:**
- Verify project name: `echo $AZURE_DEVOPS_PROJECT`
- Check project exists in organization
- Ensure exact name match (case-sensitive)
- Try project ID instead of name

#### 3. Rate Limiting

**Error:** `TooManyRequests` or `429` status

**Solutions:**
- Tests include automatic delays (500ms-1000ms between operations)
- Reduce test parallelization: `--runInBand`
- Wait a few minutes before retrying
- Azure DevOps has rate limits: ~200 requests/minute

#### 4. Work Item Type Not Found

**Error:** `Work item type 'X' does not exist`

**Solutions:**
- Verify project uses Agile process template
- Check available work item types in Azure DevOps
- Some templates use different names:
  - Scrum: Product Backlog Item (instead of User Story)
  - CMMI: Requirement (instead of User Story)

#### 5. Cleanup Issues

**Error:** Work items not deleted after tests

**Solutions:**
```bash
# Manual cleanup via WIQL query
# 1. Go to Azure DevOps → Queries
# 2. Create query:
SELECT [System.Id], [System.Title]
FROM WorkItems
WHERE [System.Tags] CONTAINS 'test'
  OR [System.Tags] CONTAINS 'integration'
  OR [System.Title] CONTAINS 'Integration Test'
ORDER BY [System.CreatedDate] DESC

# 3. Multi-select and delete
```

---

## Test Coverage

### Unit Tests (Mocked)

| Component | Tests | Coverage | Status |
|-----------|-------|----------|--------|
| AzureDevOpsProvider | 67 | 94.49% | ✅ |
| IssueService (Azure) | 50 | 100% | ✅ |
| EpicService (Azure) | 41 | 100% | ✅ |
| **Total** | **158** | **~95%** | ✅ |

### Integration Tests (Real API)

| Category | Tests | Description |
|----------|-------|-------------|
| Provider CRUD | 5 | Create, read, update, delete work items |
| Comments | 2 | Add and retrieve comments |
| WIQL Queries | 2 | Query work items with filters |
| Issue Sync | 3 | Push, pull, conflict detection |
| Epic Sync | 3 | Epic sync operations |
| Work Item Types | 5 | Test all work item types |
| State Management | 1 | State transitions |
| Error Handling | 4 | Invalid operations |
| **Total** | **25** | **Comprehensive integration coverage** |

### Manual Tests

- ✅ Environment setup verification
- ✅ CLI command testing
- ✅ End-to-end workflows
- ✅ Visual inspection in Azure DevOps UI

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Azure DevOps Integration Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  integration-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run Azure integration tests
        env:
          AZURE_DEVOPS_PAT: ${{ secrets.AZURE_DEVOPS_PAT }}
          AZURE_DEVOPS_ORG: ${{ secrets.AZURE_DEVOPS_ORG }}
          AZURE_DEVOPS_PROJECT: ${{ secrets.AZURE_DEVOPS_PROJECT }}
        run: npm run test:integration:azure
```

### Required Secrets

Add to GitHub repository settings → Secrets:
- `AZURE_DEVOPS_PAT`
- `AZURE_DEVOPS_ORG`
- `AZURE_DEVOPS_PROJECT`

---

## Best Practices

### 1. Use Dedicated Test Project
- ✅ Create separate Azure DevOps project for testing
- ✅ Never use production project for integration tests
- ✅ Set clear naming convention (e.g., `*-Testing`)

### 2. PAT Security
- ✅ Use shortest expiration time needed (90 days max)
- ✅ Store PAT in environment variables, never in code
- ✅ Use `.env.test` and add to `.gitignore`
- ✅ Rotate PATs regularly
- ✅ Revoke PATs when testing is complete

### 3. Test Data Management
- ✅ Use unique identifiers (timestamps, random numbers)
- ✅ Tag all test data (`test`, `integration`)
- ✅ Always cleanup after tests
- ✅ Verify cleanup completed

### 4. Rate Limiting
- ✅ Add delays between operations (500ms-1000ms)
- ✅ Run integration tests sequentially (`--runInBand`)
- ✅ Avoid parallel execution with real API
- ✅ Respect Azure DevOps rate limits

### 5. Monitoring
- ✅ Check Azure DevOps audit logs
- ✅ Monitor work item creation/deletion
- ✅ Review test results regularly
- ✅ Investigate cleanup failures

---

## Next Steps

1. **Run Unit Tests**: `npm test` (no credentials needed)
2. **Set Up Azure**: Create test project and PAT
3. **Configure Environment**: Set environment variables
4. **Run Manual Test**: `node test/integration/test-azure-manual.js`
5. **Run Integration Tests**: `npm run test:integration:azure`
6. **Review Results**: Check Azure DevOps for created work items

---

## Support

**Documentation:**
- Azure DevOps API: https://docs.microsoft.com/en-us/rest/api/azure/devops/
- azure-devops-node-api: https://github.com/microsoft/azure-devops-node-api

**Issues:**
If you encounter problems:
1. Check this troubleshooting guide
2. Review test output and error messages
3. Verify Azure DevOps configuration
4. Check GitHub issues: https://github.com/rafeekpro/ClaudeAutoPM/issues

---

**Last Updated:** 2025-10-14
**Version:** 2.8.0-alpha
