#!/usr/bin/env node

/**
 * Migration helper that uses MCP servers to assist with bash→Node.js conversion
 * This demonstrates how MCP can accelerate the migration process
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class MCPMigrationHelper {
  constructor() {
    this.bashScriptsPath = 'autopm/.claude/scripts';
    this.testPath = 'test/migration';
  }

  /**
   * Analyze a bash script structure using filesystem-mcp concepts
   */
  async analyzeBashScript(scriptPath) {
    console.log(`\n📊 Analyzing ${scriptPath}...`);

    const content = fs.readFileSync(scriptPath, 'utf8');
    const analysis = {
      path: scriptPath,
      lines: content.split('\n').length,
      functions: [],
      commands: [],
      variables: [],
      complexity: 'low'
    };

    // Extract functions
    const functionMatches = content.match(/^[a-z_]+\(\)\s*{/gm) || [];
    analysis.functions = functionMatches.map(f => f.replace(/\(\)\s*{/, '').trim());

    // Extract common commands
    const commands = ['git', 'npm', 'docker', 'echo', 'grep', 'sed', 'awk', 'find', 'test'];
    commands.forEach(cmd => {
      const regex = new RegExp(`\\b${cmd}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) {
        analysis.commands.push({ command: cmd, count: matches.length });
      }
    });

    // Extract variables
    const varMatches = content.match(/^\s*([A-Z_]+)=/gm) || [];
    analysis.variables = varMatches.map(v => v.split('=')[0].trim());

    // Determine complexity
    if (analysis.lines > 200 || analysis.functions.length > 5) {
      analysis.complexity = 'high';
    } else if (analysis.lines > 100 || analysis.functions.length > 2) {
      analysis.complexity = 'medium';
    }

    return analysis;
  }

  /**
   * Generate Jest test template for a script
   */
  generateTestTemplate(scriptName, analysis) {
    const testName = scriptName.replace('.sh', '');

    return `// test/migration/behavioral/${testName}.test.js
const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const { createTestRepository, runScript } = require('../jest-migration-helper');

describe('${testName} migration tests', () => {
  let testDir;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(process.cwd(), 'test', 'tmp-'));
    process.chdir(testDir);
  });

  afterEach(async () => {
    process.chdir(path.dirname(testDir));
    await fs.remove(testDir);
  });

  describe('behavioral tests', () => {
    ${analysis.functions.map(func => `
    it('should execute ${func} function correctly', async () => {
      // TODO: Add test for ${func} functionality
      const result = await runScript('${testName}', ['--function', '${func}']);
      expect(result.exitCode).toBe(0);
    });`).join('')}
  });

  describe('command tests', () => {
    ${analysis.commands.slice(0, 3).map(cmd => `
    it('should handle ${cmd.command} commands', async () => {
      // TODO: Mock ${cmd.command} and test
      const result = await runScript('${testName}', ['--test-${cmd.command}']);
      expect(result).toBeDefined();
    });`).join('')}
  });

  describe('parity tests', () => {
    it('should match bash output for standard input', async () => {
      const bashResult = execSync(\`bash autopm/.claude/scripts/${scriptName}\`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      });

      const nodeResult = execSync(\`node autopm/.claude/scripts/${testName}.js\`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      });

      expect(nodeResult).toBe(bashResult);
    });
  });

  describe('error handling', () => {
    it('should handle missing arguments gracefully', async () => {
      const result = await runScript('${testName}', []);
      expect(result.stderr).toContain('Usage:');
    });

    it('should handle invalid input', async () => {
      const result = await runScript('${testName}', ['--invalid-flag']);
      expect(result.exitCode).not.toBe(0);
    });
  });
});
`;
  }

  /**
   * Generate Node.js implementation template
   */
  generateNodeTemplate(scriptName, analysis) {
    const className = scriptName.replace('.sh', '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    return `#!/usr/bin/env node

/**
 * Node.js implementation of ${scriptName}
 * Migrated from bash script with ${analysis.lines} lines
 * Complexity: ${analysis.complexity}
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ${className} {
  constructor() {
    this.projectRoot = process.cwd();
    ${analysis.variables.map(v => `this.${v.toLowerCase()} = process.env.${v} || '';`).join('\n    ')}
  }

${analysis.functions.map(func => `
  async ${func.replace(/-/g, '_')}() {
    // TODO: Implement ${func} functionality
    console.log('Executing ${func}...');
  }
`).join('')}

  async run(args = []) {
    try {
      // Parse arguments
      const command = args[0] || 'default';

      switch(command) {
        ${analysis.functions.map(func => `
        case '${func}':
          return await this.${func.replace(/-/g, '_')}();`).join('')}
        default:
          return this.showUsage();
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }

  showUsage() {
    console.log(\`
Usage: ${scriptName.replace('.sh', '')} [command] [options]

Commands:
${analysis.functions.map(f => `  ${f}  - TODO: Add description`).join('\n')}

Options:
  --help     Show this help message
  --version  Show version information
    \`);
  }
}

// CLI entry point
if (require.main === module) {
  const instance = new ${className}();
  instance.run(process.argv.slice(2));
}

module.exports = ${className};
`;
  }

  /**
   * Create migration files for a script
   */
  async createMigration(scriptName) {
    const scriptPath = path.join(this.bashScriptsPath, scriptName);

    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Script not found: ${scriptPath}`);
    }

    console.log(`\n🚀 Creating migration for ${scriptName}`);

    // Analyze the bash script
    const analysis = await this.analyzeBashScript(scriptPath);
    console.log(`   📊 Analysis complete: ${analysis.complexity} complexity, ${analysis.functions.length} functions`);

    // Generate test file
    const testContent = this.generateTestTemplate(scriptName, analysis);
    const testPath = path.join(this.testPath, 'behavioral', `${scriptName.replace('.sh', '')}.test.js`);

    // Ensure directory exists
    fs.mkdirSync(path.dirname(testPath), { recursive: true });
    fs.writeFileSync(testPath, testContent);
    console.log(`   ✅ Test file created: ${testPath}`);

    // Generate Node.js implementation
    const nodeContent = this.generateNodeTemplate(scriptName, analysis);
    const nodePath = scriptPath.replace('.sh', '.js');
    fs.writeFileSync(nodePath, nodeContent);
    console.log(`   ✅ Node.js file created: ${nodePath}`);

    // Update bash wrapper to use Node.js version
    const wrapperContent = `#!/bin/bash
# Wrapper for ${scriptName} - delegates to Node.js implementation

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
NODE_SCRIPT="\$SCRIPT_DIR/${scriptName.replace('.sh', '.js')}"

if [ -f "\$NODE_SCRIPT" ] && command -v node >/dev/null 2>&1; then
  exec node "\$NODE_SCRIPT" "$@"
else
  echo "Error: Node.js implementation not found or Node.js not installed"
  exit 1
fi
`;

    // Backup original bash script
    const backupPath = scriptPath + '.backup';
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(scriptPath, backupPath);
      console.log(`   ✅ Original backed up: ${backupPath}`);
    }

    // Update bash script to wrapper
    fs.writeFileSync(scriptPath, wrapperContent);
    console.log(`   ✅ Wrapper updated: ${scriptPath}`);

    console.log(`\n✨ Migration created successfully!`);
    console.log(`   Next steps:`);
    console.log(`   1. Run tests: npm test -- ${testPath}`);
    console.log(`   2. Implement TODOs in ${nodePath}`);
    console.log(`   3. Verify parity: npm run test:parity -- --testNamePattern="${scriptName.replace('.sh', '')}"`);

    return {
      analysis,
      testPath,
      nodePath,
      backupPath
    };
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage: node migrate-with-mcp.js <script-name.sh>

Example:
  node migrate-with-mcp.js safe-commit.sh

This will:
1. Analyze the bash script
2. Generate Jest tests
3. Create Node.js implementation template
4. Update bash script to use Node.js version
    `);
    process.exit(0);
  }

  const helper = new MCPMigrationHelper();
  helper.createMigration(args[0])
    .catch(error => {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    });
}

module.exports = MCPMigrationHelper;