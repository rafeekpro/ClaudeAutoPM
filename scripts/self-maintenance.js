#!/usr/bin/env node

/**
 * ClaudeAutoPM Self-Maintenance Script
 * Complete Node.js implementation replacing all bash scripts
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const readline = require('readline');

class SelfMaintenance {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.agentRegistry = path.join(this.projectRoot, 'autopm/.claude/agents/AGENT-REGISTRY.md');
    this.agentsDir = path.join(this.projectRoot, 'autopm/.claude/agents');
    this.metrics = {
      totalAgents: 0,
      deprecatedAgents: 0,
      consolidatedAgents: 0,
      activeAgents: 0,
      contextEfficiency: 0
    };

    // Constants
    this.MAX_SPAWN_BUFFER = 10 * 1024 * 1024; // 10MB buffer for spawn operations

    // Constants for installation scenarios
    this.DEFAULT_INSTALL_OPTION = '3'; // Full DevOps installation
    this.SCENARIO_MAP = {
      'minimal': '1',
      'docker': '2',
      'full': '3',
      'performance': '4'
    };
  }

  /**
   * PM-HEALTH: Generate system health report
   */
  async runHealthCheck() {
    console.log('🏥 Generating ClaudeAutoPM Health Report...');
    console.log('');
    console.log('📊 System Metrics:');
    console.log('  ├── Agent Ecosystem');

    // Count agents
    const totalAgents = this.countFiles(this.agentsDir, '.md', ['templates']);
    console.log(`  │   ├── Total agents: ${totalAgents}`);

    // Check deprecated agents
    const deprecated = this.countInFiles(this.agentsDir, 'DEPRECATED');
    console.log(`  │   └── Deprecated: ${deprecated}`);

    // Test status
    console.log('  ├── Test Status');
    if (fs.existsSync(path.join(this.projectRoot, 'package.json'))) {
      console.log('  │   ├── Running tests...');
      try {
        const result = spawnSync('npm', ['test', '--silent'], { cwd: this.projectRoot, stdio: 'pipe' });
        if (result.status !== 0) throw new Error('Tests failed');
        console.log('  │   └── ✅ Tests passing');
      } catch (e) {
        console.log('  │   └── ❌ Tests failing');
      }
    }

    // Documentation status
    console.log('  └── Documentation');
    const changelogPath = path.join(this.projectRoot, 'CHANGELOG.md');
    if (fs.existsSync(changelogPath)) {
      const stats = fs.statSync(changelogPath);
      const lastUpdate = stats.mtime.toISOString().split('T')[0];
      console.log(`      └── Last updated: ${lastUpdate}`);
    }

    console.log('');
    console.log('🎯 Recommendations:');

    // Generate recommendations based on metrics
    if (totalAgents > 40) {
      console.log(`  - Consider further agent consolidation (current: ${totalAgents}, target: <30)`);
    }

    if (deprecated > 10) {
      console.log(`  - Clean up deprecated agents (current: ${deprecated})`);
    }

    // Check for recent commits
    try {
      const gitResult = spawnSync('git', ['log', '-1', '--format=%ar'], {
        cwd: this.projectRoot,
        encoding: 'utf8'
      });
      const lastCommit = gitResult.stdout ? gitResult.stdout.trim() : 'unknown';
      console.log('');
      console.log(`📝 Last commit: ${lastCommit}`);
    } catch (e) {
      // Git not available or not a git repo
    }

    console.log('');
    console.log("Use 'pm optimize' to analyze optimization opportunities");
    console.log("Use 'pm validate' to run full validation");
  }

  /**
   * PM-VALIDATE: Validate project integrity
   */
  async runValidation() {
    console.log('🔍 Validating ClaudeAutoPM Project...');
    console.log('');
    console.log('📋 Validation Checklist:');

    let allValid = true;

    // 1. Check agent registry
    process.stdout.write('  ├── Agent registry... ');
    const registryPath = path.join(this.projectRoot, 'autopm/.claude/agents/AGENT-REGISTRY.md');
    if (fs.existsSync(registryPath)) {
      const registryValid = this.validateRegistry();
      console.log(registryValid ? '✅' : '❌');
      allValid = allValid && registryValid;
    } else {
      console.log('❌ (not found)');
      allValid = false;
    }

    // 2. Check configuration
    process.stdout.write('  ├── Configuration... ');
    const configExists = fs.existsSync(path.join(this.projectRoot, '.claude/config.json')) &&
                        fs.existsSync(path.join(this.projectRoot, 'CLAUDE.md'));
    console.log(configExists ? '✅' : '❌');
    allValid = allValid && configExists;

    // 3. Check installation script
    process.stdout.write('  ├── Installation script... ');
    const installExists = fs.existsSync(path.join(this.projectRoot, 'install/install.sh'));
    console.log(installExists ? '✅' : '❌');
    allValid = allValid && installExists;

    // 4. Check documentation
    process.stdout.write('  ├── Documentation... ');
    const docsExist = fs.existsSync(path.join(this.projectRoot, 'README.md')) &&
                     fs.existsSync(path.join(this.projectRoot, 'PLAYBOOK.md')) &&
                     fs.existsSync(path.join(this.projectRoot, 'CHANGELOG.md'));
    console.log(docsExist ? '✅' : '❌');
    allValid = allValid && docsExist;

    // 5. Verify agent configuration
    process.stdout.write('  └── Agent configuration... ');
    try {
      const verifyScript = path.join(this.projectRoot, 'scripts/verify-agents.js');
      if (fs.existsSync(verifyScript)) {
        const result = spawnSync('node', [verifyScript], { cwd: this.projectRoot, stdio: 'pipe' });
        if (result.status !== 0) throw new Error('Verification failed');
        console.log('✅');
      } else {
        console.log('⚠️ (verify script not found)');
      }
    } catch (e) {
      console.log('❌');
      allValid = false;
    }

    console.log('');
    console.log('🧪 Running quick tests...');

    // Run npm test if available
    if (fs.existsSync(path.join(this.projectRoot, 'package.json'))) {
      try {
        const result = spawnSync('npm', ['test', '--silent'], { cwd: this.projectRoot, stdio: 'pipe' });
        if (result.status !== 0) throw new Error('Tests failed');
        console.log('  ✅ Tests passing');
      } catch (e) {
        console.log('  ❌ Some tests failing');
        allValid = false;
      }
    }

    console.log('');
    console.log('📊 Code Analysis:');

    // Count total files
    const totalFiles = this.countFiles(this.projectRoot, ['.md', '.js', '.sh']);
    console.log(`  ├── Total files: ${totalFiles}`);

    // Count agents
    const totalAgents = this.countFiles(this.agentsDir, '.md', ['templates']);
    console.log(`  ├── Total agents: ${totalAgents}`);

    // Check for TODOs
    const todos = this.countInFiles(this.projectRoot, 'TODO', ['node_modules', '.git']);
    console.log(`  └── TODOs found: ${todos}`);

    console.log('');
    console.log(allValid ? '✅ Validation complete' : '⚠️ Validation completed with issues');
    console.log('');
    console.log('For detailed analysis, run:');
    console.log("  - 'pm optimize' for optimization opportunities");
    console.log("  - 'pm health' for system health report");
    console.log("  - 'node scripts/verify-agents.js' for agent verification");
  }

  /**
   * PM-OPTIMIZE: Analyze optimization opportunities
   */
  async runOptimization() {
    console.log('🔬 Analyzing agent ecosystem optimization opportunities...');
    console.log('');
    console.log('Analyzing agent redundancies and overlaps...');

    // Check agent registry
    if (fs.existsSync(this.agentRegistry)) {
      console.log('📊 Current metrics:');

      const registryContent = fs.readFileSync(this.agentRegistry, 'utf8');
      const totalAgents = (registryContent.match(/### /g) || []).length;
      const deprecated = (registryContent.match(/DEPRECATED/g) || []).length;
      const active = totalAgents - deprecated;

      console.log(`  Total agents: ${totalAgents}`);
      console.log(`  Deprecated: ${deprecated}`);
      console.log(`  Active: ${active}`);
    }

    // Run optimization analysis
    const opportunities = this.findOptimizations();

    console.log('');
    console.log('💡 Optimization report generated');
    console.log('');
    console.log('Next steps:');
    console.log('1. Review optimization opportunities');
    console.log('2. Use agent-manager to consolidate agents');
    console.log('3. Update registry with registry-manager');
    console.log('4. Test with test-runner');

    return opportunities;
  }

  /**
   * PM-RELEASE: Prepare new release
   */
  async runRelease() {
    console.log('🚀 Preparing ClaudeAutoPM Release...');
    console.log('');
    console.log('📋 Pre-release Checklist:');

    // 1. Validate registry
    process.stdout.write('  ├── Registry validation... ');
    const registryValid = this.validateRegistry();
    console.log(registryValid ? '✅' : '❌');

    // 2. Run tests
    process.stdout.write('  ├── Test suite... ');
    try {
      const testResult = spawnSync('npm', ['test', '--silent'], { cwd: this.projectRoot, stdio: 'pipe' });
      if (testResult.status !== 0) throw new Error('Tests failed');
      console.log('✅');
    } catch (e) {
      console.log('❌');
    }

    // 3. Check documentation
    process.stdout.write('  ├── Documentation... ');
    const docsExist = fs.existsSync(path.join(this.projectRoot, 'README.md')) &&
                     fs.existsSync(path.join(this.projectRoot, 'PLAYBOOK.md')) &&
                     fs.existsSync(path.join(this.projectRoot, 'CHANGELOG.md'));
    console.log(docsExist ? '✅' : '❌');

    // 4. Installation test
    process.stdout.write('  └── Installation test... ');
    const testDir = path.join(os.tmpdir(), `autopm-release-test-${Date.now()}`);
    try {
      fs.mkdirSync(testDir, { recursive: true });
      // Use safe installation method
      this.runInstallScript(this.DEFAULT_INSTALL_OPTION, testDir);
      const success = fs.existsSync(path.join(testDir, 'CLAUDE.md'));
      console.log(success ? '✅' : '❌');
      // Clean up using fs methods instead of shell commands
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch (e) {
      console.log('❌');
    }

    console.log('');
    console.log('📦 Version Information:');

    const packageJson = JSON.parse(
      fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8')
    );
    console.log(`  Current version: ${packageJson.version}`);

    console.log('');
    console.log('🔄 Release Options:');
    console.log('  1. Patch release (bug fixes)');
    console.log('  2. Minor release (new features)');
    console.log('  3. Major release (breaking changes)');
    console.log('  4. Pre-release (beta/rc)');
    console.log('');

    // Interactive prompt for release type
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('Select release type (1-4): ', (releaseType) => {
        let npmVersion;
        switch (releaseType) {
          case '1': npmVersion = 'patch'; break;
          case '2': npmVersion = 'minor'; break;
          case '3': npmVersion = 'major'; break;
          case '4': npmVersion = 'prerelease'; break;
          default:
            console.log('Invalid selection');
            rl.close();
            resolve(false);
            return;
        }

        console.log('');
        console.log('📝 Release Steps:');
        console.log(`  1. Update version: npm version ${npmVersion}`);
        console.log('  2. Update CHANGELOG.md');
        console.log('  3. Create git tag');
        console.log('  4. Push to GitHub');
        console.log('  5. Publish to npm');
        console.log('');

        rl.question('Proceed with release? (y/n): ', (confirm) => {
          if (confirm.toLowerCase() === 'y') {
            console.log('🎉 Creating release...');
            try {
              const versionResult = spawnSync('npm', ['version', npmVersion], { cwd: this.projectRoot, stdio: 'inherit' });
              if (versionResult.status !== 0) throw new Error('Version update failed');
              console.log('✅ Version updated');
              console.log('');
              console.log('Next steps:');
              console.log('  1. Update CHANGELOG.md with release notes');
              console.log('  2. git push origin main --tags');
              console.log('  3. npm publish');
              resolve(true);
            } catch (e) {
              console.log('❌ Release failed:', e.message);
              resolve(false);
            }
          } else {
            console.log('❌ Release cancelled');
            resolve(false);
          }
          rl.close();
        });
      });
    });
  }

  /**
   * PM-TEST-INSTALL: Test installation scenarios
   */
  async runTestInstall() {
    console.log('🧪 Testing ClaudeAutoPM installation scenarios...');
    console.log('');
    console.log('Running installation tests with test-runner agent...');

    const scenarios = ['minimal', 'docker', 'full', 'performance'];
    const results = [];

    for (const scenario of scenarios) {
      console.log('');
      console.log(`Testing ${scenario} installation...`);

      const testDir = path.join(os.tmpdir(), `autopm-test-${scenario}-${Date.now()}`);

      try {
        // Create test directory
        fs.mkdirSync(testDir, { recursive: true });

        // Run installation test using safe input mapping
        const input = this.SCENARIO_MAP[scenario];
        if (!input) {
          throw new Error(`Unknown scenario: ${scenario}`);
        }

        // Use safe installation method (no shell injection risk)
        this.runInstallScript(input, testDir);

        // Validate installation
        const success = fs.existsSync(path.join(testDir, 'CLAUDE.md')) &&
                       fs.existsSync(path.join(testDir, '.claude'));

        if (success) {
          console.log(`  ✅ ${scenario} installation successful`);
          results.push({ scenario, success: true });
        } else {
          console.log(`  ❌ ${scenario} installation failed`);
          results.push({ scenario, success: false });
        }

        // Cleanup
        fs.rmSync(testDir, { recursive: true, force: true });
      } catch (e) {
        console.log(`  ❌ ${scenario} installation error: ${e.message}`);
        results.push({ scenario, success: false, error: e.message });

        // Cleanup on error
        try {
          fs.rmSync(testDir, { recursive: true, force: true });
        } catch {}
      }
    }

    console.log('');
    console.log('📋 Installation test complete');

    const successful = results.filter(r => r.success).length;
    console.log(`Results: ${successful}/${scenarios.length} scenarios passed`);

    return results;
  }

  /**
   * HELPER METHODS
   */

  /**
   * Safely run installation script without shell injection risk
   */
  runInstallScript(inputOption, targetDir) {
    const installScript = path.join(this.projectRoot, 'install/install.sh');

    // Use spawnSync with proper argument array (no shell interpolation)
    const result = spawnSync('bash', [installScript, targetDir], {
      input: inputOption + '\n',
      encoding: 'utf8',
      cwd: this.projectRoot,
      stdio: 'pipe',
      maxBuffer: this.MAX_SPAWN_BUFFER // Prevent ENOBUFS errors
    });

    if (result.error) {
      throw result.error;
    }

    if (result.status !== 0) {
      throw new Error(`Installation failed with exit code ${result.status}: ${result.stderr}`);
    }

    return result;
  }

  // Count files with specific extensions
  countFiles(dir, extensions, excludeDirs = []) {
    let count = 0;

    if (!fs.existsSync(dir)) return 0;

    const processDir = (currentDir) => {
      const items = fs.readdirSync(currentDir);

      items.forEach(item => {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          const dirName = path.basename(fullPath);
          if (!excludeDirs.includes(dirName) && !dirName.startsWith('.')) {
            processDir(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (typeof extensions === 'string') {
            if (ext === extensions) count++;
          } else if (Array.isArray(extensions)) {
            if (extensions.includes(ext)) count++;
          }
        }
      });
    };

    processDir(dir);
    return count;
  }

  // Count occurrences of pattern in files
  countInFiles(dir, pattern, excludeDirs = []) {
    let count = 0;

    if (!fs.existsSync(dir)) return 0;

    const processDir = (currentDir) => {
      const items = fs.readdirSync(currentDir);

      items.forEach(item => {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          const dirName = path.basename(fullPath);
          if (!excludeDirs.includes(dirName) && !dirName.startsWith('.')) {
            processDir(fullPath);
          }
        } else if (stat.isFile() && item.endsWith('.md')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const matches = content.match(new RegExp(pattern, 'g'));
            if (matches) count += matches.length;
          } catch (e) {
            // Skip files that can't be read
          }
        }
      });
    };

    processDir(dir);
    return count;
  }

  // Validate agent registry consistency
  validateRegistry() {
    if (!fs.existsSync(this.agentRegistry)) {
      console.log(`❌ Agent registry file not found at: ${this.agentRegistry}`);
      return false;
    }

    const registryContent = fs.readFileSync(this.agentRegistry, 'utf8');
    const agents = this.parseAgents(registryContent);

    let issues = [];

    agents.forEach(agent => {
      // Check if agent file exists
      if (agent.location && !agent.deprecated) {
        const agentPath = path.join(this.projectRoot, agent.location);
        if (!fs.existsSync(agentPath)) {
          issues.push(`Missing file for agent: ${agent.name} at ${agent.location}`);
        }
      }

      // Update metrics
      this.metrics.totalAgents++;
      if (agent.deprecated) this.metrics.deprecatedAgents++;
      if (agent.replaces) this.metrics.consolidatedAgents++;
      if (agent.active) this.metrics.activeAgents++;
    });

    if (issues.length > 0) {
      console.log('❌ Registry issues found:');
      issues.forEach(issue => console.log(`  - ${issue}`));
      return false;
    }

    return true;
  }

  // Parse agents from registry
  parseAgents(content) {
    const agents = [];
    const lines = content.split('\n');
    let currentAgent = null;

    lines.forEach(line => {
      if (line.startsWith('### ')) {
        const name = line.replace('### ', '').trim();
        currentAgent = {
          name: name.split(' ')[0],
          deprecated: name.includes('DEPRECATED'),
          active: !name.includes('DEPRECATED'),
          location: null,
          replaces: null
        };
        agents.push(currentAgent);
      } else if (currentAgent && line.startsWith('**Location**:')) {
        currentAgent.location = line.match(/`([^`]+)`/)?.[1];
      } else if (currentAgent && line.startsWith('**Replaces**:')) {
        currentAgent.replaces = line.replace('**Replaces**:', '').trim();
      }
    });

    return agents;
  }

  // Find optimization opportunities
  findOptimizations() {
    console.log('🔬 Analyzing Optimization Opportunities...');

    const opportunities = [];

    // Check for similar agent names
    if (fs.existsSync(this.agentsDir)) {
      const categories = fs.readdirSync(this.agentsDir).filter(f =>
        fs.statSync(path.join(this.agentsDir, f)).isDirectory()
      );

      categories.forEach(category => {
        const categoryPath = path.join(this.agentsDir, category);
        if (!fs.existsSync(categoryPath)) return;

        const agents = fs.readdirSync(categoryPath)
          .filter(f => f.endsWith('.md'))
          .map(f => f.replace('.md', ''));

        // Look for patterns
        const patterns = {
          'cloud': agents.filter(a => a.includes('cloud')),
          'database': agents.filter(a => a.includes('db') || a.includes('database')),
          'api': agents.filter(a => a.includes('api')),
          'test': agents.filter(a => a.includes('test'))
        };

        Object.entries(patterns).forEach(([pattern, matches]) => {
          if (matches.length > 2) {
            opportunities.push({
              category,
              pattern,
              agents: matches,
              recommendation: `Consider consolidating ${matches.length} ${pattern}-related agents`
            });
          }
        });
      });
    }

    if (opportunities.length > 0) {
      console.log('\n💡 Optimization Opportunities Found:');
      opportunities.forEach(opp => {
        console.log(`  - ${opp.recommendation}`);
        console.log(`    Category: ${opp.category}`);
        console.log(`    Agents: ${opp.agents.join(', ')}`);
      });
    } else {
      console.log('  ✅ No immediate optimization opportunities found');
    }

    return opportunities;
  }

  // Main execution
  async run(command = 'all') {
    switch (command) {
      case 'validate':
        await this.runValidation();
        break;
      case 'health':
        await this.runHealthCheck();
        break;
      case 'optimize':
        await this.runOptimization();
        break;
      case 'release':
        await this.runRelease();
        break;
      case 'test-install':
        await this.runTestInstall();
        break;
      case 'test':
        await this.runTestInstall();
        break;
      case 'metrics':
        this.calculateMetrics();
        break;
      case 'all':
      default:
        await this.runHealthCheck();
        console.log('\n' + '='.repeat(50) + '\n');
        await this.runValidation();
        break;
    }
  }

  // Calculate optimization metrics
  calculateMetrics() {
    console.log('📊 Calculating Optimization Metrics...');

    // Context efficiency calculation
    const originalAgents = 50;
    const currentAgents = this.metrics.activeAgents || this.countFiles(this.agentsDir, '.md', ['templates']);
    this.metrics.contextEfficiency = Math.round(
      ((originalAgents - currentAgents) / originalAgents) * 100
    );

    console.log('\n📈 Current Metrics:');
    console.log(`  Total Agents: ${this.metrics.totalAgents}`);
    console.log(`  Active Agents: ${this.metrics.activeAgents}`);
    console.log(`  Deprecated: ${this.metrics.deprecatedAgents}`);
    console.log(`  Consolidated: ${this.metrics.consolidatedAgents}`);
    console.log(`  Context Efficiency: ${this.metrics.contextEfficiency}%`);

    return this.metrics;
  }
}

// CLI execution
if (require.main === module) {
  const command = process.argv[2] || 'all';
  const maintenance = new SelfMaintenance();

  maintenance.run(command).catch(error => {
    console.error('❌ Maintenance failed:', error.message);
    process.exit(1);
  });
}

module.exports = SelfMaintenance;