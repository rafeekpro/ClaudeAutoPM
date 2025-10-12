/**
 * PRDService Tests - TDD Approach
 * Tests for Tier 1 (Pure Parsing) and Tier 3 (Utilities)
 *
 * Following strict TDD methodology:
 * 1. Write failing tests FIRST
 * 2. Implement minimal code to pass
 * 3. Refactor while keeping tests green
 */

const PRDService = require('../../lib/services/PRDService');

describe('PRDService - Tier 1: Pure Parsing (No Dependencies)', () => {
  let service;

  beforeEach(() => {
    // Create service instance with default options
    service = new PRDService();
  });

  describe('parseFrontmatter', () => {
    test('should parse valid YAML frontmatter', () => {
      const content = `---
title: Test PRD
status: draft
priority: P1
author: Test Author
---

# Content`;

      const result = service.parseFrontmatter(content);

      expect(result).toEqual({
        title: 'Test PRD',
        status: 'draft',
        priority: 'P1',
        author: 'Test Author'
      });
    });

    test('should return null for missing frontmatter', () => {
      const content = `# PRD without frontmatter

This is just content.`;

      const result = service.parseFrontmatter(content);
      expect(result).toBeNull();
    });

    test('should parse what it can from malformed YAML', () => {
      const content = `---
title Test PRD
status: : invalid
---

# Content`;

      const result = service.parseFrontmatter(content);
      // Forgiving parser: skips line without colon, parses what it can
      expect(result).toEqual({ status: ': invalid' });
    });

    test('should return empty object for empty frontmatter', () => {
      const content = `---
---

# Content`;

      const result = service.parseFrontmatter(content);
      // Empty frontmatter (no lines) returns empty object
      expect(result).toEqual({});
    });

    test('should handle frontmatter with colons in values', () => {
      const content = `---
title: PRD: Implementation Guide
url: https://example.com:8080/path
---

# Content`;

      const result = service.parseFrontmatter(content);

      expect(result.title).toBe('PRD: Implementation Guide');
      expect(result.url).toBe('https://example.com:8080/path');
    });

    test('should trim whitespace from keys and values', () => {
      const content = `---
  title  :   Test PRD
  status:draft
---

# Content`;

      const result = service.parseFrontmatter(content);

      expect(result.title).toBe('Test PRD');
      expect(result.status).toBe('draft');
    });

    test('should ignore lines without colons', () => {
      const content = `---
title: Test PRD
invalid line without colon
status: draft
---

# Content`;

      const result = service.parseFrontmatter(content);

      expect(result).toEqual({
        title: 'Test PRD',
        status: 'draft'
      });
    });
  });

  describe('extractPrdContent - Basic Parser', () => {
    test('should extract all PRD sections', () => {
      const content = `---
title: Test PRD
---

## Vision

This is the vision section.

## Problem Statement

Users need a solution for X.

## Target Users

- Developers
- Product Managers

## Features

- Feature 1: Description
- Feature 2: Another feature
- Feature 3: Third feature

## Requirements

- Requirement 1
- Requirement 2

## Success Metrics

- Metric 1: 90% satisfaction
- Metric 2: 50% adoption

## Technical Approach

Use Node.js and React.

## Timeline

Q1 2025 - Initial release`;

      const result = service.extractPrdContent(content);

      expect(result.vision).toContain('vision section');
      expect(result.problem).toContain('solution for X');
      expect(result.users).toContain('Developers');
      expect(result.features).toHaveLength(3);
      expect(result.features[0]).toContain('Feature 1');
      expect(result.requirements).toHaveLength(2);
      expect(result.metrics).toContain('satisfaction');
      expect(result.technical).toContain('Node.js');
      expect(result.timeline).toContain('Q1 2025');
    });

    test('should handle missing sections gracefully', () => {
      const content = `---
title: Minimal PRD
---

## Vision

Just a vision.`;

      const result = service.extractPrdContent(content);

      expect(result.vision).toBe('Just a vision.');
      expect(result.problem).toBe('');
      expect(result.users).toBe('');
      expect(result.features).toEqual([]);
      expect(result.requirements).toEqual([]);
      expect(result.metrics).toBe('');
      expect(result.technical).toBe('');
      expect(result.timeline).toBe('');
    });

    test('should extract bullet list features correctly', () => {
      const content = `---
title: Test
---

## Features

- Feature one
* Feature two
• Feature three`;

      const result = service.extractPrdContent(content);

      expect(result.features).toHaveLength(3);
      expect(result.features[0]).toBe('Feature one');
      expect(result.features[1]).toBe('Feature two');
      expect(result.features[2]).toBe('Feature three');
    });

    test('should extract numbered list requirements', () => {
      const content = `---
title: Test
---

## Requirements

1. First requirement
2. Second requirement
3. Third requirement`;

      const result = service.extractPrdContent(content);

      expect(result.requirements).toHaveLength(3);
      expect(result.requirements[0]).toBe('First requirement');
      expect(result.requirements[1]).toBe('Second requirement');
      expect(result.requirements[2]).toBe('Third requirement');
    });

    test('should match section headers case-insensitively', () => {
      const content = `---
title: Test
---

## VISION

Upper case vision.

## Problem

Mixed case problem.

## technical approach

Lower case technical.`;

      const result = service.extractPrdContent(content);

      expect(result.vision).toBe('Upper case vision.');
      expect(result.problem).toBe('Mixed case problem.');
      expect(result.technical).toBe('Lower case technical.');
    });

    test('should handle sections with alternative names', () => {
      const content = `---
title: Test
---

## Project Summary

This is the summary.

## Target Audience

These are the users.

## Success Criteria

These are metrics.

## Architecture

This is technical.

## Schedule

This is timeline.`;

      const result = service.extractPrdContent(content);

      expect(result.vision).toContain('summary');
      expect(result.users).toContain('users');
      expect(result.metrics).toContain('metrics');
      expect(result.technical).toContain('technical');
      expect(result.timeline).toContain('timeline');
    });

    test('should strip frontmatter before parsing sections', () => {
      const content = `---
title: Test PRD
status: draft
---

## Vision

Clean vision content.`;

      const result = service.extractPrdContent(content);

      expect(result.vision).toBe('Clean vision content.');
      expect(result.vision).not.toContain('---');
      expect(result.vision).not.toContain('title:');
    });
  });

  describe('extractPrdContent - Advanced Parser (markdown-it)', () => {
    test('should use advanced parser when enabled', () => {
      const content = `---
title: Test
---

## User Stories

As a developer, I want to use markdown-it.

### Sub-heading

With nested content.

## Requirements

- First requirement
- Second requirement`;

      const result = service.extractPrdContent(content, { useAdvancedParser: true });

      // Advanced parser should preserve structure better
      expect(result.userStories).toBeDefined();
      expect(result.requirements).toBeDefined();
    });

    test('should handle code blocks in advanced parser', () => {
      const content = `---
title: Test
---

## Technical Approach

\`\`\`javascript
const code = 'example';
\`\`\`

Use this pattern.`;

      const result = service.extractPrdContent(content, { useAdvancedParser: true });

      expect(result.technical).toContain('code');
      expect(result.technical).toContain('example');
    });

    test('should preserve markdown formatting in advanced mode', () => {
      const content = `---
title: Test
---

## Features

- **Bold feature**
- *Italic feature*
- \`Code feature\``;

      const result = service.extractPrdContent(content, { useAdvancedParser: true });

      expect(result.features).toBeDefined();
      expect(result.features.length).toBeGreaterThan(0);
    });
  });

  describe('parseUserStories', () => {
    test('should extract user stories in standard format', () => {
      const text = `As a developer
I want to write tests
So that I can ensure quality

As a user
I want to use the feature
So that I can be productive`;

      const result = service.parseUserStories(text);

      expect(result).toHaveLength(2);
      expect(result[0].raw).toContain('As a developer');
      expect(result[0].raw).toContain('I want to write tests');
      expect(result[0].raw).toContain('So that I can ensure quality');
      expect(result[1].raw).toContain('As a user');
    });

    test('should handle user stories with bold formatting', () => {
      const text = `**As a developer**
**I want** to write code
**So that** I can build features`;

      const result = service.parseUserStories(text);

      expect(result).toHaveLength(1);
      expect(result[0].raw).toContain('As a developer');
    });

    test('should handle "As an" variant', () => {
      const text = `As an administrator
I want to manage users
So that I can control access`;

      const result = service.parseUserStories(text);

      expect(result).toHaveLength(1);
      expect(result[0].raw).toContain('As an administrator');
    });

    test('should return empty array for no user stories', () => {
      const text = `This is just regular text
without any user stories`;

      const result = service.parseUserStories(text);

      expect(result).toEqual([]);
    });

    test('should handle multiple stories with blank lines', () => {
      const text = `As a user
I want feature A

As a developer
I want feature B

As an admin
I want feature C`;

      const result = service.parseUserStories(text);

      expect(result).toHaveLength(3);
    });

    test('should combine multi-line stories correctly', () => {
      const text = `As a user
I want to perform action X
and action Y
So that I can achieve goal Z`;

      const result = service.parseUserStories(text);

      expect(result).toHaveLength(1);
      expect(result[0].raw).toContain('action X');
      expect(result[0].raw).toContain('action Y');
      expect(result[0].raw).toContain('goal Z');
    });
  });
});

describe('PRDService - Tier 3: Utilities (No I/O)', () => {
  let service;

  beforeEach(() => {
    service = new PRDService();
  });

  describe('parseEffort', () => {
    test('should convert days to hours (8h per day)', () => {
      expect(service.parseEffort('2d')).toBe(16);
      expect(service.parseEffort('1d')).toBe(8);
      expect(service.parseEffort('5d')).toBe(40);
    });

    test('should convert hours to hours', () => {
      expect(service.parseEffort('2h')).toBe(2);
      expect(service.parseEffort('4h')).toBe(4);
      expect(service.parseEffort('8h')).toBe(8);
    });

    test('should convert weeks to hours (40h per week)', () => {
      expect(service.parseEffort('1w')).toBe(40);
      expect(service.parseEffort('2w')).toBe(80);
      expect(service.parseEffort('3w')).toBe(120);
    });

    test('should default to 1 day (8h) for invalid input', () => {
      expect(service.parseEffort('')).toBe(8);
      expect(service.parseEffort(null)).toBe(8);
      expect(service.parseEffort(undefined)).toBe(8);
      expect(service.parseEffort('invalid')).toBe(8);
    });

    test('should default to 1 day for non-string input', () => {
      expect(service.parseEffort(42)).toBe(8);
      expect(service.parseEffort({})).toBe(8);
      expect(service.parseEffort([])).toBe(8);
    });

    test('should handle edge case of zero', () => {
      expect(service.parseEffort('0d')).toBe(0);
      expect(service.parseEffort('0h')).toBe(0);
      expect(service.parseEffort('0w')).toBe(0);
    });

    test('should handle decimal values', () => {
      expect(service.parseEffort('1.5d')).toBe(12); // 1.5 * 8 = 12
      expect(service.parseEffort('0.5w')).toBe(20); // 0.5 * 40 = 20
    });
  });

  describe('formatEffort', () => {
    test('should format hours to readable format', () => {
      expect(service.formatEffort(4)).toBe('4h');
      expect(service.formatEffort(2)).toBe('2h');
    });

    test('should format days (8-39 hours)', () => {
      expect(service.formatEffort(8)).toBe('1d');
      expect(service.formatEffort(16)).toBe('2d');
      expect(service.formatEffort(24)).toBe('3d');
    });

    test('should format days with remaining hours', () => {
      expect(service.formatEffort(10)).toBe('1d 2h');
      expect(service.formatEffort(18)).toBe('2d 2h');
      expect(service.formatEffort(28)).toBe('3d 4h');
    });

    test('should format weeks (40+ hours)', () => {
      expect(service.formatEffort(40)).toBe('1w');
      expect(service.formatEffort(80)).toBe('2w');
      expect(service.formatEffort(120)).toBe('3w');
    });

    test('should format weeks with remaining days', () => {
      expect(service.formatEffort(48)).toBe('1w 1d');
      expect(service.formatEffort(56)).toBe('1w 2d');
      expect(service.formatEffort(88)).toBe('2w 1d');
    });

    test('should handle zero hours', () => {
      expect(service.formatEffort(0)).toBe('0h');
    });

    test('should round to nearest hour', () => {
      expect(service.formatEffort(1.9)).toBe('1h');
      expect(service.formatEffort(2.1)).toBe('2h');
    });
  });

  describe('calculateTotalEffort', () => {
    test('should sum effort across multiple tasks', () => {
      const tasks = [
        { effort: '2d' },
        { effort: '4h' },
        { effort: '1w' }
      ];

      const result = service.calculateTotalEffort(tasks);

      // 2d = 16h, 4h = 4h, 1w = 40h => 60h total = 1w 2d 4h
      expect(result).toBe('1w 2d 4h');
    });

    test('should handle empty task list', () => {
      const result = service.calculateTotalEffort([]);
      expect(result).toBe('0h');
    });

    test('should handle tasks without effort', () => {
      const tasks = [
        { effort: '2d' },
        { },
        { effort: '1d' }
      ];

      const result = service.calculateTotalEffort(tasks);

      // 2d = 16h, default 8h, 1d = 8h => 32h = 4d
      expect(result).toBe('4d');
    });

    test('should handle all tasks having default effort', () => {
      const tasks = [
        { },
        { },
        { }
      ];

      const result = service.calculateTotalEffort(tasks);

      // 3 * 8h = 24h = 3d
      expect(result).toBe('3d');
    });
  });

  describe('calculateEffortByType', () => {
    test('should sum effort for specific task type', () => {
      const tasks = [
        { type: 'frontend', effort: '2d' },
        { type: 'backend', effort: '3d' },
        { type: 'frontend', effort: '1d' },
        { type: 'testing', effort: '4h' }
      ];

      const frontendEffort = service.calculateEffortByType(tasks, 'frontend');
      const backendEffort = service.calculateEffortByType(tasks, 'backend');
      const testingEffort = service.calculateEffortByType(tasks, 'testing');

      expect(frontendEffort).toBe('3d'); // 2d + 1d = 24h = 3d
      expect(backendEffort).toBe('3d');  // 3d = 24h = 3d
      expect(testingEffort).toBe('4h');   // 4h
    });

    test('should return 0h for non-existent type', () => {
      const tasks = [
        { type: 'frontend', effort: '2d' }
      ];

      const result = service.calculateEffortByType(tasks, 'backend');
      expect(result).toBe('0h');
    });

    test('should handle empty task list', () => {
      const result = service.calculateEffortByType([], 'frontend');
      expect(result).toBe('0h');
    });

    test('should use default effort for tasks without effort field', () => {
      const tasks = [
        { type: 'setup' },
        { type: 'setup', effort: '2h' }
      ];

      const result = service.calculateEffortByType(tasks, 'setup');

      // 8h (default) + 2h = 10h = 1d 2h
      expect(result).toBe('1d 2h');
    });
  });

  describe('generateEpicId', () => {
    test('should convert prd-N to epic-N', () => {
      expect(service.generateEpicId('prd-347')).toBe('epic-347');
      expect(service.generateEpicId('prd-1')).toBe('epic-1');
      expect(service.generateEpicId('prd-9999')).toBe('epic-9999');
    });

    test('should handle uppercase PRD prefix', () => {
      expect(service.generateEpicId('PRD-347')).toBe('epic-347');
    });

    test('should handle prd without hyphen', () => {
      expect(service.generateEpicId('prd347')).toBe('epic-347');
    });

    test('should handle already converted epic IDs', () => {
      // Should be idempotent or return as-is
      const result = service.generateEpicId('epic-347');
      expect(result).toBe('epic-347');
    });
  });

  describe('slugify', () => {
    test('should convert text to lowercase', () => {
      expect(service.slugify('Test Title')).toBe('test-title');
      expect(service.slugify('UPPERCASE')).toBe('uppercase');
    });

    test('should replace spaces with hyphens', () => {
      expect(service.slugify('multiple word title')).toBe('multiple-word-title');
      expect(service.slugify('a b c d')).toBe('a-b-c-d');
    });

    test('should remove special characters', () => {
      expect(service.slugify('title!@#$%^&*()')).toBe('title');
      expect(service.slugify('test[brackets]')).toBe('testbrackets');
    });

    test('should collapse multiple hyphens', () => {
      expect(service.slugify('test    multiple    spaces')).toBe('test-multiple-spaces');
      expect(service.slugify('test---hyphens')).toBe('test-hyphens');
    });

    test('should handle underscores and hyphens', () => {
      expect(service.slugify('test_with_underscores')).toBe('test_with_underscores');
      expect(service.slugify('already-slugified')).toBe('already-slugified');
    });

    test('should handle mixed alphanumeric', () => {
      expect(service.slugify('v1.2.3 Release Notes')).toBe('v123-release-notes');
      expect(service.slugify('Test123ABC')).toBe('test123abc');
    });

    test('should handle empty string', () => {
      expect(service.slugify('')).toBe('');
    });

    test('should create filesystem-safe names', () => {
      const result = service.slugify('PRD: User Authentication & Authorization');
      expect(result).toBe('prd-user-authentication-authorization');
      expect(result).toMatch(/^[a-z0-9-_]+$/);
    });
  });

  describe('isComplexPrd', () => {
    test('should return true for PRD with many components', () => {
      const technicalApproach = {
        frontend: ['component1', 'component2'],
        backend: ['service1', 'service2'],
        data: ['model1'],
        security: ['control1']
      };
      const tasks = new Array(12).fill({ id: 'task' });

      const result = service.isComplexPrd(technicalApproach, tasks);
      expect(result).toBe(true);
    });

    test('should return true for PRD with 3+ component types', () => {
      const technicalApproach = {
        frontend: ['component1'],
        backend: ['service1'],
        data: ['model1'],
        security: []
      };
      const tasks = new Array(5).fill({ id: 'task' });

      const result = service.isComplexPrd(technicalApproach, tasks);
      expect(result).toBe(true); // 3 component types (frontend, backend, data)
    });

    test('should return true for PRD with 10+ tasks', () => {
      const technicalApproach = {
        frontend: ['component1'],
        backend: [],
        data: [],
        security: []
      };
      const tasks = new Array(11).fill({ id: 'task' });

      const result = service.isComplexPrd(technicalApproach, tasks);
      expect(result).toBe(true); // 11 tasks
    });

    test('should return false for simple PRD', () => {
      const technicalApproach = {
        frontend: ['component1'],
        backend: ['service1'],
        data: [],
        security: []
      };
      const tasks = new Array(5).fill({ id: 'task' });

      const result = service.isComplexPrd(technicalApproach, tasks);
      expect(result).toBe(false); // Only 2 component types, 5 tasks
    });

    test('should handle empty technical approach', () => {
      const technicalApproach = {
        frontend: [],
        backend: [],
        data: [],
        security: []
      };
      const tasks = [];

      const result = service.isComplexPrd(technicalApproach, tasks);
      expect(result).toBe(false);
    });

    test('should handle undefined or missing arrays', () => {
      const technicalApproach = {
        frontend: ['component1'],
        backend: undefined,
        // data missing
        security: []
      };
      const tasks = [];

      const result = service.isComplexPrd(technicalApproach, tasks);
      expect(result).toBe(false);
    });
  });
});

describe('PRDService - Constructor and Options', () => {
  test('should create instance with default options', () => {
    const service = new PRDService();
    expect(service).toBeInstanceOf(PRDService);
  });

  test('should accept options object', () => {
    const options = {
      defaultEffortHours: 4,
      hoursPerDay: 6,
      hoursPerWeek: 30
    };

    const service = new PRDService(options);
    expect(service.options).toEqual(options);
  });

  test('should use custom hours per day when provided', () => {
    const service = new PRDService({ hoursPerDay: 6 });

    // 2 days with 6 hours per day = 12 hours
    expect(service.parseEffort('2d')).toBe(12);
  });

  test('should use custom hours per week when provided', () => {
    const service = new PRDService({ hoursPerWeek: 30 });

    // 1 week with 30 hours = 30 hours
    expect(service.parseEffort('1w')).toBe(30);
  });

  test('should use custom default effort when provided', () => {
    const service = new PRDService({ defaultEffortHours: 4 });

    // Invalid input should use custom default of 4 hours
    expect(service.parseEffort('invalid')).toBe(4);
  });
});

describe('PRDService - Error Handling', () => {
  let service;

  beforeEach(() => {
    service = new PRDService();
  });

  test('should handle null content in extractPrdContent', () => {
    expect(() => {
      service.extractPrdContent(null);
    }).not.toThrow();
  });

  test('should handle undefined content in parseFrontmatter', () => {
    const result = service.parseFrontmatter(undefined);
    expect(result).toBeNull();
  });

  test('should handle malformed markdown gracefully', () => {
    const content = `## Section without closing

## Another section
Content here

## ## Double hash

Content`;

    expect(() => {
      service.extractPrdContent(content);
    }).not.toThrow();
  });

  test('should handle extremely long effort values', () => {
    const result = service.parseEffort('99999d');
    expect(result).toBe(99999 * 8);
  });

  test('should handle negative effort values', () => {
    const result = service.parseEffort('-5d');
    expect(result).toBe(-40); // -5 * 8
  });
});

describe('PRDService - Integration Tests', () => {
  let service;

  beforeEach(() => {
    service = new PRDService();
  });

  test('should process complete PRD document end-to-end', () => {
    const prdContent = `---
title: User Authentication System
status: draft
priority: P1
author: Engineering Team
---

## Vision

Build a secure, scalable authentication system for our platform.

## Problem Statement

Users need a way to securely access their accounts.

## Target Users

- End users requiring secure login
- Administrators managing user access
- Developers integrating authentication

## Features

- Email/password authentication
- OAuth2 integration
- Two-factor authentication
- Password reset flow

## Requirements

- Must support 10,000 concurrent users
- 99.9% uptime SLA
- GDPR compliant

## Success Metrics

- 95% login success rate
- < 2 second authentication time

## Technical Approach

Use Node.js with bcrypt for password hashing.
Implement JWT tokens for session management.

## Timeline

Q1 2025 - MVP release
Q2 2025 - OAuth integration`;

    // Test frontmatter parsing
    const frontmatter = service.parseFrontmatter(prdContent);
    expect(frontmatter.title).toBe('User Authentication System');
    expect(frontmatter.priority).toBe('P1');

    // Test content extraction
    const sections = service.extractPrdContent(prdContent);
    expect(sections.vision).toContain('secure');
    expect(sections.features).toHaveLength(4);
    expect(sections.requirements).toHaveLength(3);
    expect(sections.technical).toContain('JWT');

    // Test epic ID generation
    const epicId = service.generateEpicId('prd-347');
    expect(epicId).toBe('epic-347');

    // Test slugify
    const slug = service.slugify(frontmatter.title);
    expect(slug).toBe('user-authentication-system');
  });

  test('should handle task effort calculations for real scenario', () => {
    const tasks = [
      { id: 'TASK-1', type: 'setup', effort: '2h' },
      { id: 'TASK-2', type: 'frontend', effort: '1d' },
      { id: 'TASK-3', type: 'backend', effort: '2d' },
      { id: 'TASK-4', type: 'backend', effort: '1d' },
      { id: 'TASK-5', type: 'integration', effort: '1d' },
      { id: 'TASK-6', type: 'testing', effort: '4h' },
      { id: 'TASK-7', type: 'deployment', effort: '4h' }
    ];

    // Total: 2h + 1d(8h) + 2d(16h) + 1d(8h) + 1d(8h) + 4h + 4h = 50h
    const total = service.calculateTotalEffort(tasks);
    expect(total).toBe('1w 1d 2h');

    // By type
    const setupEffort = service.calculateEffortByType(tasks, 'setup');
    expect(setupEffort).toBe('2h');

    const frontendEffort = service.calculateEffortByType(tasks, 'frontend');
    expect(frontendEffort).toBe('1d');

    const backendEffort = service.calculateEffortByType(tasks, 'backend');
    expect(backendEffort).toBe('3d'); // 2d + 1d
  });

  test('should determine complexity correctly for real PRD', () => {
    const simpleTechnicalApproach = {
      frontend: ['LoginForm'],
      backend: ['AuthService'],
      data: [],
      security: []
    };
    const simpleTasks = new Array(6).fill({});

    expect(service.isComplexPrd(simpleTechnicalApproach, simpleTasks)).toBe(false);

    const complexTechnicalApproach = {
      frontend: ['LoginForm', 'RegisterForm', 'ProfilePage'],
      backend: ['AuthService', 'UserService', 'EmailService'],
      data: ['UserModel', 'SessionModel'],
      security: ['JWTMiddleware', 'RateLimiter']
    };
    const complexTasks = new Array(15).fill({});

    expect(service.isComplexPrd(complexTechnicalApproach, complexTasks)).toBe(true);
  });
});
