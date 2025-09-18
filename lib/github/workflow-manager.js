/**
 * GitHub Workflow Manager
 * Centralized GitHub Actions workflow management functionality
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Configuration
 */
const CONFIG = {
  directories: {
    workflows: '.github/workflows'
  },
  defaults: {
    os: 'ubuntu-latest',
    nodeVersion: '18.x'
  },
  fileExtensions: ['.yml', '.yaml']
};

/**
 * Workflow templates
 */
const TEMPLATES = {
  node: {
    name: 'Node.js CI',
    content: `name: Node.js CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]

    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    - run: npm ci
    - run: npm test
    - run: npm run build --if-present`
  },
  python: {
    name: 'Python CI',
    content: `name: Python CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        python-version: ["3.8", "3.9", "3.10", "3.11"]

    steps:
    - uses: actions/checkout@v3
    - name: Set up Python \${{ matrix.python-version }}
      uses: actions/setup-python@v4
      with:
        python-version: \${{ matrix.python-version }}
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install pytest
        if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
    - name: Test with pytest
      run: |
        pytest`
  },
  docker: {
    name: 'Docker Build',
    content: `name: Docker Build

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]

jobs:
  docker:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2

    - name: Log in to Docker Hub
      uses: docker/login-action@v2
      with:
        username: \${{ secrets.DOCKER_USERNAME }}
        password: \${{ secrets.DOCKER_TOKEN }}

    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: user/app:latest`
  }
};

class GitHubWorkflowManager {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.workflowsDir = path.join(projectRoot, CONFIG.directories.workflows);
  }

  /**
   * Creates a new workflow
   */
  async createWorkflow(name, options = {}) {
    await fs.mkdir(this.workflowsDir, { recursive: true });

    const workflow = {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      on: options.trigger || ['push', 'pull_request'],
      jobs: {
        build: {
          'runs-on': options.os || CONFIG.defaults.os,
          steps: [
            { uses: 'actions/checkout@v3' },
            { name: 'Setup', run: 'echo "Setting up..."' },
            { name: 'Build', run: 'echo "Building..."' },
            { name: 'Test', run: 'echo "Testing..."' }
          ]
        }
      }
    };

    const workflowPath = path.join(this.workflowsDir, `${name}.yml`);
    await fs.writeFile(workflowPath, this.generateYAML(workflow));

    return {
      path: workflowPath,
      name: workflow.name,
      triggers: Array.isArray(workflow.on) ? workflow.on : [workflow.on]
    };
  }

  /**
   * Creates a test workflow
   */
  async createTestWorkflow(options = {}) {
    await fs.mkdir(this.workflowsDir, { recursive: true });

    const testWorkflow = {
      name: 'Tests',
      on: {
        push: {
          branches: ['main', 'develop']
        },
        pull_request: {
          branches: ['main']
        }
      },
      jobs: {
        test: {
          'runs-on': options.os || CONFIG.defaults.os,
          steps: [
            { uses: 'actions/checkout@v3' },
            {
              name: 'Setup Node.js',
              uses: 'actions/setup-node@v3',
              with: {
                'node-version': options.nodeVersion || CONFIG.defaults.nodeVersion,
                cache: 'npm'
              }
            },
            { name: 'Install dependencies', run: 'npm ci' },
            { name: 'Run tests', run: 'npm test' },
            {
              name: 'Upload coverage',
              if: 'success()',
              uses: 'codecov/codecov-action@v3'
            }
          ]
        }
      }
    };

    const workflowPath = path.join(this.workflowsDir, 'test.yml');
    await fs.writeFile(workflowPath, this.generateYAML(testWorkflow));

    return {
      path: workflowPath,
      name: testWorkflow.name
    };
  }

  /**
   * Creates a release workflow
   */
  async createReleaseWorkflow(options = {}) {
    await fs.mkdir(this.workflowsDir, { recursive: true });

    let trigger = {};
    if (options.trigger === 'tag') {
      trigger = {
        push: {
          tags: ['v*']
        }
      };
    } else {
      trigger = {
        release: {
          types: ['created']
        }
      };
    }

    const releaseWorkflow = {
      name: 'Release',
      on: trigger,
      jobs: {
        release: {
          'runs-on': CONFIG.defaults.os,
          steps: [
            { uses: 'actions/checkout@v3' },
            {
              name: 'Setup Node.js',
              uses: 'actions/setup-node@v3',
              with: {
                'node-version': CONFIG.defaults.nodeVersion,
                'registry-url': 'https://registry.npmjs.org/'
              }
            },
            { name: 'Install dependencies', run: 'npm ci' },
            { name: 'Build', run: 'npm run build --if-present' },
            { name: 'Test', run: 'npm test' },
            {
              name: 'Publish to npm',
              if: options.publish !== false,
              run: 'npm publish',
              env: {
                NODE_AUTH_TOKEN: '${{ secrets.NPM_TOKEN }}'
              }
            },
            {
              name: 'Create GitHub Release',
              uses: 'softprops/action-gh-release@v1',
              if: "startsWith(github.ref, 'refs/tags/')",
              with: {
                files: 'dist/*'
              }
            }
          ]
        }
      }
    };

    const workflowPath = path.join(this.workflowsDir, 'release.yml');
    await fs.writeFile(workflowPath, this.generateYAML(releaseWorkflow));

    return {
      path: workflowPath,
      name: releaseWorkflow.name,
      trigger: options.trigger
    };
  }

  /**
   * Applies a template
   */
  async applyTemplate(templateName) {
    const template = TEMPLATES[templateName];

    if (!template) {
      throw new Error(`Unknown template: ${templateName}`);
    }

    await fs.mkdir(this.workflowsDir, { recursive: true });

    const filename = `${templateName}.yml`;
    const workflowPath = path.join(this.workflowsDir, filename);
    await fs.writeFile(workflowPath, template.content);

    return {
      path: workflowPath,
      template: templateName,
      name: template.name
    };
  }

  /**
   * Lists available templates
   */
  getTemplates() {
    return Object.entries(TEMPLATES).map(([key, template]) => ({
      key,
      name: template.name,
      description: this.getTemplateDescription(key)
    }));
  }

  /**
   * Lists existing workflows
   */
  async listWorkflows() {
    try {
      const files = await fs.readdir(this.workflowsDir);
      const workflows = [];

      for (const file of files) {
        if (CONFIG.fileExtensions.some(ext => file.endsWith(ext))) {
          const content = await fs.readFile(path.join(this.workflowsDir, file), 'utf8');
          workflows.push({
            file,
            name: this.extractWorkflowName(content),
            triggers: this.extractTriggers(content)
          });
        }
      }

      return workflows;
    } catch (error) {
      return [];
    }
  }

  /**
   * Validates workflows
   */
  async validateWorkflows() {
    try {
      const files = await fs.readdir(this.workflowsDir);
      const results = [];

      for (const file of files) {
        if (CONFIG.fileExtensions.some(ext => file.endsWith(ext))) {
          const content = await fs.readFile(path.join(this.workflowsDir, file), 'utf8');
          const issues = this.validateWorkflow(content);
          results.push({
            file,
            valid: issues.length === 0,
            issues
          });
        }
      }

      return results;
    } catch (error) {
      return [];
    }
  }

  /**
   * Updates a workflow
   */
  async updateWorkflow(workflowName, updates = {}) {
    const workflowPath = path.join(this.workflowsDir, `${workflowName}.yml`);
    let content = await fs.readFile(workflowPath, 'utf8');

    // Add job if requested
    if (updates.addJob) {
      const jobName = updates.addJob;
      const jobDefinition = `
  ${jobName}:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: ${jobName}
        run: echo "Running ${jobName}"`;

      // Add before the last line
      const lines = content.split('\n');
      const jobsIndex = lines.findIndex(l => l.startsWith('jobs:'));
      if (jobsIndex >= 0) {
        // Find the end of jobs section
        let insertIndex = lines.length;
        for (let i = jobsIndex + 1; i < lines.length; i++) {
          if (!lines[i].startsWith('  ')) {
            insertIndex = i;
            break;
          }
        }
        lines.splice(insertIndex, 0, jobDefinition);
        content = lines.join('\n');
      }
    }

    await fs.writeFile(workflowPath, content);

    return {
      path: workflowPath,
      updated: true,
      changes: updates
    };
  }

  /**
   * Validates workflow content
   */
  validateWorkflow(content) {
    const issues = [];
    const lines = content.split('\n');

    // Check for required fields
    if (!content.includes('name:')) {
      issues.push('Missing workflow name');
    }

    if (!content.includes('on:')) {
      issues.push('Missing trigger events (on:)');
    }

    if (!content.includes('jobs:')) {
      issues.push('Missing jobs section');
    }

    // Check each job has runs-on
    const jobsIndex = lines.findIndex(l => l.trim().startsWith('jobs:'));
    if (jobsIndex >= 0) {
      let currentJob = null;
      let hasRunsOn = false;

      for (let i = jobsIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // New job starts
        if (line.match(/^  \w+:/)) {
          if (currentJob && !hasRunsOn) {
            issues.push(`Job '${currentJob}' missing runs-on`);
          }
          currentJob = trimmed.replace(':', '');
          hasRunsOn = false;
        }

        // Check for runs-on
        if (trimmed.startsWith('runs-on:')) {
          hasRunsOn = true;
        }

        // End of jobs section
        if (line.length > 0 && !line.startsWith(' ')) {
          break;
        }
      }

      // Check last job
      if (currentJob && !hasRunsOn) {
        issues.push(`Job '${currentJob}' missing runs-on`);
      }
    }

    return issues;
  }

  /**
   * Extracts workflow name from content
   */
  extractWorkflowName(content) {
    const match = content.match(/name:\s*(.+)/);
    return match ? match[1].trim() : 'Unnamed';
  }

  /**
   * Extracts triggers from workflow content
   */
  extractTriggers(content) {
    const match = content.match(/on:\s*(.+)/);
    if (!match) return 'None';

    const triggerLine = match[1].trim();
    if (triggerLine.startsWith('[')) {
      return triggerLine.slice(1, -1);
    }
    return triggerLine;
  }

  /**
   * Gets template description
   */
  getTemplateDescription(name) {
    const descriptions = {
      node: 'Node.js CI/CD with matrix testing',
      python: 'Python testing with pytest',
      docker: 'Docker build and push to registry'
    };
    return descriptions[name] || 'Workflow template';
  }

  /**
   * Generates simple YAML
   */
  generateYAML(obj, indent = 0) {
    let yaml = '';
    const spaces = '  '.repeat(indent);

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        yaml += `${spaces}${key}:\n`;
      } else if (typeof value === 'string') {
        // Handle multi-line strings
        if (value.includes('\n')) {
          yaml += `${spaces}${key}: |\n`;
          value.split('\n').forEach(line => {
            yaml += `${spaces}  ${line}\n`;
          });
        } else {
          yaml += `${spaces}${key}: ${value}\n`;
        }
      } else if (typeof value === 'boolean') {
        yaml += `${spaces}${key}: ${value}\n`;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n${this.generateYAML(value, indent + 1)}`;
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        for (const item of value) {
          if (typeof item === 'object') {
            yaml += `${spaces}- ${this.generateYAML(item, indent + 1).trim()}\n`;
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        }
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }

    return yaml;
  }
}

module.exports = GitHubWorkflowManager;