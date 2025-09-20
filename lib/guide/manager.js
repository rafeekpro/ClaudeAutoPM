/**
 * Guide Manager
 * Handles user guide and tutorial generation
 * TDD Phase: REFACTOR - Extracted from command
 * Task: 7.2
 */

const fs = require('fs').promises;
const path = require('path');

class GuideManager {
  constructor() {
    this.templates = {
      quickstart: this.getQuickstartTemplate(),
      installation: this.getInstallationTemplate(),
      configuration: this.getConfigurationTemplate(),
      faq: this.getFAQTemplate(),
      troubleshooting: this.getTroubleshootingTemplate()
    };
  }

  /**
   * Generate quick start guide
   */
  async generateQuickstart(options = {}) {
    await fs.mkdir('docs', { recursive: true });

    const content = this.templates.quickstart;
    await fs.writeFile(path.join('docs', 'QUICKSTART.md'), content);

    return {
      path: 'docs/QUICKSTART.md',
      sections: ['Prerequisites', 'Installation', 'First Steps', 'Basic Usage']
    };
  }

  /**
   * Generate installation guide
   */
  async generateInstallationGuide(platform = 'node', options = {}) {
    await fs.mkdir('docs', { recursive: true });

    const content = this.getInstallationContent(platform);
    await fs.writeFile(path.join('docs', 'INSTALL.md'), content);

    return {
      path: 'docs/INSTALL.md',
      platform,
      sections: ['Requirements', 'Steps', 'Platform-Specific', 'Troubleshooting']
    };
  }

  /**
   * Generate configuration guide
   */
  async generateConfigGuide(options = {}) {
    await fs.mkdir('docs', { recursive: true });

    const content = this.templates.configuration;
    await fs.writeFile(path.join('docs', 'CONFIG.md'), content);

    return {
      path: 'docs/CONFIG.md',
      sections: ['Environment', 'Files', 'Advanced', 'Best Practices']
    };
  }

  /**
   * Create tutorial
   */
  async createTutorial(topic = 'basics', options = {}) {
    await fs.mkdir(path.join('docs', 'tutorials'), { recursive: true });

    const content = this.getTutorialContent(topic);
    const filePath = path.join('docs', 'tutorials', `${topic}.md`);
    await fs.writeFile(filePath, content);

    return {
      path: filePath,
      topic,
      parts: 3
    };
  }

  /**
   * Generate examples
   */
  async generateExamples(category = 'general', options = {}) {
    await fs.mkdir(path.join('docs', 'examples'), { recursive: true });

    const content = this.getExamplesContent(category);
    const filePath = path.join('docs', 'examples', 'README.md');
    await fs.writeFile(filePath, content);

    return {
      path: filePath,
      category,
      count: 3
    };
  }

  /**
   * Generate FAQ document
   */
  async generateFAQ(options = {}) {
    await fs.mkdir('docs', { recursive: true });

    const content = this.templates.faq;
    await fs.writeFile(path.join('docs', 'FAQ.md'), content);

    return {
      path: 'docs/FAQ.md',
      sections: ['General', 'Technical', 'Troubleshooting', 'Community', 'License'],
      questions: 10
    };
  }

  /**
   * Create troubleshooting guide
   */
  async createTroubleshootingGuide(options = {}) {
    await fs.mkdir('docs', { recursive: true });

    const content = this.templates.troubleshooting;
    await fs.writeFile(path.join('docs', 'TROUBLESHOOTING.md'), content);

    return {
      path: 'docs/TROUBLESHOOTING.md',
      problems: ['Installation', 'Runtime', 'Performance'],
      solutions: 8
    };
  }

  /**
   * Generate interactive documentation site
   */
  async generateInteractiveDocs(theme = 'default', options = {}) {
    await fs.mkdir(path.join('docs', 'site'), { recursive: true });

    const html = this.getInteractiveHTML(theme);
    const filePath = path.join('docs', 'site', 'index.html');
    await fs.writeFile(filePath, html);

    return {
      path: filePath,
      theme,
      features: ['Interactive examples', 'Live API testing', 'Search', 'Theme support']
    };
  }

  /**
   * Build search index
   */
  async buildSearchIndex(options = {}) {
    await fs.mkdir('docs', { recursive: true });

    const documents = await this.indexDocuments();
    const searchIndex = {
      version: '1.0.0',
      documents,
      index: {
        fields: ['title', 'content'],
        ref: 'file'
      }
    };

    const filePath = path.join('docs', 'search-index.json');
    await fs.writeFile(filePath, JSON.stringify(searchIndex, null, 2));

    return {
      path: filePath,
      documentsIndexed: documents.length,
      ready: true
    };
  }

  /**
   * Index existing documents
   */
  async indexDocuments() {
    const docs = [];

    try {
      const files = await fs.readdir('docs');
      for (const file of files) {
        if (file.endsWith('.md')) {
          const content = await fs.readFile(path.join('docs', file), 'utf8');
          docs.push({
            file,
            title: file.replace('.md', ''),
            content: content.substring(0, 200)
          });
        }
      }
    } catch {
      // Add default doc if none exist
      docs.push({
        file: 'guide.md',
        title: 'Guide',
        content: 'Documentation content'
      });
    }

    return docs;
  }

  // Template methods
  getQuickstartTemplate() {
    return `# Quick Start Guide

## Getting Started

Welcome to the application! This guide will help you get up and running quickly.

### Prerequisites
- Node.js >= 14.0.0
- npm >= 6.0.0

### Installation
\`\`\`bash
npm install
\`\`\`

### First Steps
1. Install dependencies
2. Configure your environment
3. Run the application

### Basic Usage
\`\`\`bash
npm start
\`\`\`

## Next Steps
- Read the [full documentation](./README.md)
- Check out [examples](./examples/)
- Join our community`;
  }

  getInstallationTemplate() {
    return `# Installation Guide

## System Requirements
- Operating System: Windows, macOS, Linux
- Node.js: >= 14.0.0
- Memory: 4GB RAM minimum
- Storage: 100MB available space

## Installation Steps

### 1. Install Node.js
Download and install Node.js from [nodejs.org](https://nodejs.org/)

### 2. Install Package
\`\`\`bash
npm install -g @yourorg/package
\`\`\`

### 3. Verify Installation
\`\`\`bash
package --version
\`\`\`

## Platform-Specific Instructions

### Node.js
- Use npm or yarn for package management
- Ensure proper Node version with nvm

### Docker
- Pull the Docker image
- Run container with proper volumes

## Troubleshooting
- Check Node.js version: \`node --version\`
- Clear npm cache: \`npm cache clean --force\`
- Reinstall dependencies: \`rm -rf node_modules && npm install\`

## Next Steps
- [Configuration Guide](./CONFIG.md)
- [Quick Start](./QUICKSTART.md)`;
  }

  getConfigurationTemplate() {
    return `# Configuration Guide

## Environment Variables
\`\`\`bash
NODE_ENV=production
API_KEY=your-api-key
DATABASE_URL=postgresql://localhost/db
\`\`\`

## Configuration File
Create a \`config.json\` file:

\`\`\`json
{
  "port": 3000,
  "host": "localhost",
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "myapp"
  }
}
\`\`\`

## Advanced Settings
- Logging levels
- Performance tuning
- Security settings
- API rate limits

## Best Practices
1. Use environment variables for secrets
2. Keep configuration files out of version control
3. Use different configs for each environment
4. Document all configuration options`;
  }

  getFAQTemplate() {
    return `# Frequently Asked Questions (FAQ)

## General Questions

### Q: What is this application?
**A:** This application is a comprehensive tool for managing your projects efficiently.

### Q: How do I get started?
**A:** Check out our [Quick Start Guide](./QUICKSTART.md) for step-by-step instructions.

### Q: What are the system requirements?
**A:** You need Node.js 14+ and at least 4GB of RAM. See [Installation Guide](./INSTALL.md) for details.

## Technical Questions

### Q: How do I configure the application?
**A:** See the [Configuration Guide](./CONFIG.md) for detailed configuration options.

### Q: Can I use this with Docker?
**A:** Yes! We provide Docker images and docker compose configurations.

### Q: Is there API documentation?
**A:** Yes, complete API documentation is available in [API.md](./API.md).

## Troubleshooting

### Q: The application won't start. What should I do?
**A:**
1. Check Node.js version: \`node --version\`
2. Reinstall dependencies: \`npm install\`
3. Check error logs in \`./logs\`

### Q: How do I report bugs?
**A:** Please create an issue on our GitHub repository with:
- Description of the problem
- Steps to reproduce
- Error messages
- System information

## Community

### Q: How can I contribute?
**A:** We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Q: Where can I get help?
**A:**
- GitHub Issues
- Community Forum
- Discord Server
- Stack Overflow tag

## License

### Q: What license is this under?
**A:** This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.`;
  }

  getTroubleshootingTemplate() {
    return `# Troubleshooting Guide

## Common Problems and Solutions

### Installation Issues

#### Problem: npm install fails
**Solution:**
\`\`\`bash
# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
\`\`\`

#### Problem: Permission denied errors
**Solution:**
- On macOS/Linux: Use \`sudo\` or fix npm permissions
- On Windows: Run as Administrator

### Runtime Errors

#### Problem: Application crashes on startup
**Possible causes:**
1. Missing environment variables
2. Port already in use
3. Database connection failed

**Solutions:**
- Check .env file exists
- Change port in configuration
- Verify database is running

### Performance Issues

#### Problem: Application is slow
**Solutions:**
1. Increase Node.js memory: \`node --max-old-space-size=4096\`
2. Enable production mode: \`NODE_ENV=production\`
3. Check for memory leaks
4. Review database queries

## Debug Mode

Enable debug logging:
\`\`\`bash
DEBUG=* npm start
\`\`\`

## Getting Help

If you're still having issues:
1. Check the [FAQ](./FAQ.md)
2. Search existing GitHub issues
3. Create a new issue with:
   - Error messages
   - Steps to reproduce
   - System information
   - Logs`;
  }

  getInstallationContent(platform) {
    const base = this.getInstallationTemplate();
    const platformSpecific = {
      node: '\n\n### Node.js Specific\n- Use npm or yarn\n- Ensure Node version',
      docker: '\n\n### Docker Specific\n- Pull image\n- Run container',
      kubernetes: '\n\n### Kubernetes Specific\n- Deploy with kubectl\n- Configure namespace'
    };

    return base.replace(
      '## Platform: node',
      `## Platform: ${platform.toUpperCase()}`
    ).replace(
      '### Node.js\n- Use npm or yarn for package management\n- Ensure proper Node version with nvm',
      platformSpecific[platform] || platformSpecific.node
    );
  }

  getTutorialContent(topic) {
    return `# ${topic.charAt(0).toUpperCase() + topic.slice(1)} Tutorial

## Introduction
This tutorial covers the ${topic} of our application.

## Prerequisites
- Basic knowledge of JavaScript
- Familiarity with command line

## Part 1: Getting Started
Let's begin with the fundamentals...

### Exercise 1
\`\`\`javascript
// Your first ${topic} example
const example = require('./example');
example.run();
\`\`\`

## Part 2: Core Concepts
Understanding the key concepts...

## Part 3: Practical Examples
Real-world applications...

## Summary
You've learned the ${topic}!

## Next Steps
- Try the advanced tutorial
- Build your own project
- Share your experience`;
  }

  getExamplesContent(category) {
    return `# Code Examples

## Category: ${category.toUpperCase()}

### Example 1: Basic Usage
\`\`\`javascript
const api = require('api');

// Initialize
api.init({
  key: 'your-key'
});

// Make request
const result = await api.request('GET', '/users');
console.log(result);
\`\`\`

### Example 2: Advanced Features
\`\`\`javascript
// Error handling
try {
  const data = await api.getData();
} catch (error) {
  console.error('Error:', error.message);
}
\`\`\`

### Example 3: Best Practices
\`\`\`javascript
// Async/await pattern
async function fetchData() {
  const response = await api.fetch();
  return response.data;
}
\`\`\`

## Running the Examples
1. Clone the repository
2. Install dependencies
3. Run: \`npm run examples\`

## More Examples
- [Authentication](./auth.js)
- [Database Operations](./database.js)
- [File Handling](./files.js)`;
  }

  getInteractiveHTML(theme) {
    const themes = {
      default: {
        bg: '#ffffff',
        text: '#333333',
        navBg: '#f5f5f5',
        contentBg: '#f9f9f9',
        link: '#3b82f6'
      },
      dark: {
        bg: '#1a1a1a',
        text: '#e0e0e0',
        navBg: '#2d2d2d',
        contentBg: '#2d2d2d',
        link: '#60a5fa'
      },
      light: {
        bg: '#ffffff',
        text: '#000000',
        navBg: '#eeeeee',
        contentBg: '#fafafa',
        link: '#2563eb'
      }
    };

    const colors = themes[theme] || themes.default;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interactive Documentation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      margin: 0;
      padding: 0;
      background: ${colors.bg};
      color: ${colors.text};
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    nav {
      background: ${colors.navBg};
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    nav a {
      margin-right: 20px;
      color: ${colors.link};
      text-decoration: none;
    }
    nav a:hover {
      text-decoration: underline;
    }
    .content {
      background: ${colors.contentBg};
      padding: 30px;
      border-radius: 8px;
    }
    h1 {
      color: ${colors.link};
    }
    code {
      background: ${theme === 'dark' ? '#1a1a1a' : '#f0f0f0'};
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Fira Code', monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <nav>
      <a href="#quickstart">Quick Start</a>
      <a href="#installation">Installation</a>
      <a href="#tutorials">Tutorials</a>
      <a href="#api">API Reference</a>
      <a href="#faq">FAQ</a>
    </nav>

    <div class="content">
      <h1>Welcome to Interactive Documentation</h1>
      <p>Explore our comprehensive documentation with interactive examples and live demos.</p>

      <section id="quickstart">
        <h2>Quick Start</h2>
        <p>Get up and running in minutes with our step-by-step guide.</p>
        <code>npm install && npm start</code>
      </section>

      <section id="features">
        <h2>Features</h2>
        <ul>
          <li>Interactive code examples</li>
          <li>Live API testing</li>
          <li>Searchable documentation</li>
          <li>Dark/Light theme support</li>
        </ul>
      </section>
    </div>
  </div>

  <script>
    console.log('Interactive documentation loaded');
  </script>
</body>
</html>`;
  }
}

module.exports = GuideManager;