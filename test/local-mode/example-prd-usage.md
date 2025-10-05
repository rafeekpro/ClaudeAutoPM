# PRD Management Commands - Example Usage

This document demonstrates the local PRD management commands implemented in TASK-004.

## Commands Overview

1. `/pm:prd-new --local <name>` - Create a new PRD
2. `/pm:prd-list --local` - List all PRDs
3. `/pm:prd-show --local <id>` - Display a specific PRD
4. `/pm:prd-update --local <id> <field> <value>` - Update PRD frontmatter

## Example Workflow

### 1. Create a New PRD

```javascript
const { createLocalPRD } = require('../../autopm/.claude/scripts/pm-prd-new-local');

// Basic usage
const result = await createLocalPRD('User Authentication System');

console.log(result);
// Output:
// {
//   id: 'prd-347',
//   filepath: '/path/to/.claude/prds/user-authentication-system.md',
//   frontmatter: {
//     id: 'prd-347',
//     title: 'User Authentication System',
//     created: '2025-10-05',
//     createdAt: '2025-10-05T17:00:00.000Z',
//     author: 'ClaudeAutoPM',
//     status: 'draft',
//     priority: 'medium',
//     version: '1.0'
//   }
// }

// With options
const customResult = await createLocalPRD('Payment Gateway', {
  author: 'John Doe',
  priority: 'high',
  id: 'prd-custom-001'
});
```

### 2. List All PRDs

```javascript
const { listLocalPRDs } = require('../../autopm/.claude/scripts/pm-prd-list-local');

// List all PRDs
const allPRDs = await listLocalPRDs();

console.log(allPRDs);
// Output:
// [
//   {
//     filename: 'payment-gateway.md',
//     id: 'prd-custom-001',
//     title: 'Payment Gateway',
//     created: '2025-10-05',
//     createdAt: '2025-10-05T17:05:00.000Z',
//     author: 'John Doe',
//     status: 'draft',
//     priority: 'high',
//     version: '1.0'
//   },
//   {
//     filename: 'user-authentication-system.md',
//     id: 'prd-347',
//     title: 'User Authentication System',
//     created: '2025-10-05',
//     createdAt: '2025-10-05T17:00:00.000Z',
//     author: 'ClaudeAutoPM',
//     status: 'draft',
//     priority: 'medium',
//     version: '1.0'
//   }
// ]

// Filter by status
const approvedPRDs = await listLocalPRDs({ status: 'approved' });
const draftPRDs = await listLocalPRDs({ status: 'draft' });
```

### 3. Display a Specific PRD

```javascript
const { showLocalPRD } = require('../../autopm/.claude/scripts/pm-prd-show-local');

const prd = await showLocalPRD('prd-347');

console.log(prd);
// Output:
// {
//   filepath: '/path/to/.claude/prds/user-authentication-system.md',
//   filename: 'user-authentication-system.md',
//   frontmatter: {
//     id: 'prd-347',
//     title: 'User Authentication System',
//     created: '2025-10-05',
//     createdAt: '2025-10-05T17:00:00.000Z',
//     author: 'ClaudeAutoPM',
//     status: 'draft',
//     priority: 'medium',
//     version: '1.0'
//   },
//   body: '# Product Requirements Document: User Authentication System\n\n## 1. Executive Summary...',
//   content: '---\nid: prd-347\n...\n---\n\n# Product Requirements Document...'
// }
```

### 4. Update PRD Frontmatter

```javascript
const { updateLocalPRD } = require('../../autopm/.claude/scripts/pm-prd-update-local');

// Update status
await updateLocalPRD('prd-347', 'status', 'approved');

// Update priority
await updateLocalPRD('prd-347', 'priority', 'critical');

// Update version
await updateLocalPRD('prd-347', 'version', '2.0');

// Add custom field
await updateLocalPRD('prd-347', 'assignee', 'Alice Smith');
```

## PRD Template Structure

Created PRDs include the following sections:

```markdown
---
id: prd-347
title: User Authentication System
created: 2025-10-05
createdAt: 2025-10-05T17:00:00.000Z
author: ClaudeAutoPM
status: draft
priority: medium
version: 1.0
---

# Product Requirements Document: User Authentication System

## 1. Executive Summary

### Overview
[Describe the feature/product in 2-3 sentences]

### Business Value
[Why is this important?]

### Success Metrics
[How will we measure success?]

## 2. Background

### Problem Statement
[What problem are we solving?]

### Current State
[What exists today?]

### Goals and Objectives
[What are we trying to achieve?]

## 3. User Stories

[Epic-level user stories]

## 4. Functional Requirements

[Detailed requirements]

## 5. Non-Functional Requirements

[Performance, security, etc.]

## 6. Out of Scope

[What we're NOT doing]

## 7. Timeline

[Key milestones]
```

## Error Handling

### PRD Already Exists
```javascript
await createLocalPRD('Duplicate Name');
await createLocalPRD('Duplicate Name'); // Throws: "PRD already exists: duplicate-name.md"
```

### PRD Not Found
```javascript
await showLocalPRD('prd-nonexistent'); // Throws: "PRD not found: prd-nonexistent"
await updateLocalPRD('prd-nonexistent', 'status', 'approved'); // Throws: "PRD not found: prd-nonexistent"
```

### Invalid Parameters
```javascript
await createLocalPRD(''); // Throws: "PRD name is required and must be a non-empty string"
await updateLocalPRD('prd-347', '', 'value'); // Throws: "Field is required"
```

## File Storage

PRDs are stored in:
```
.claude/
└── prds/
    ├── user-authentication-system.md
    ├── payment-gateway.md
    └── dashboard-redesign.md
```

Filename format: `prd-<id>-<name-kebab-case>.md`

## Integration with Frontmatter Utilities

All PRD commands use the frontmatter utilities from TASK-002:

- `parseFrontmatter()` - Parse PRD files
- `stringifyFrontmatter()` - Create/update PRD files

This ensures consistency across all local mode features.
