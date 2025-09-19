/**
 * TDD Test Suite for Interactive Guide Command
 * Tests the autopm guide feature that helps new users with setup
 */

const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const fs = require('fs-extra');
const inquirer = require('inquirer').default || require('inquirer');

describe('Interactive Guide Command', () => {
  let consoleLogStub;
  let consoleErrorStub;
  let processExitStub;
  let inquirerPromptStub;
  let fsWriteJsonStub;
  let fsExistsStub;

  beforeEach(() => {
    consoleLogStub = sinon.stub(console, 'log');
    consoleErrorStub = sinon.stub(console, 'error');
    processExitStub = sinon.stub(process, 'exit');
    // Handle inquirer as ES module or CommonJS
    if (inquirer.prompt) {
      inquirerPromptStub = sinon.stub(inquirer, 'prompt');
    } else {
      inquirerPromptStub = sinon.stub().resolves({});
    }
    fsWriteJsonStub = sinon.stub(fs, 'writeJson');
    fsExistsStub = sinon.stub(fs, 'pathExists');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Guide Command Structure', () => {
    it('should export correct yargs command structure', () => {
      const guideCommand = require('../../src/commands/guide');

      expect(guideCommand).to.have.property('command');
      expect(guideCommand).to.have.property('describe');
      expect(guideCommand).to.have.property('builder');
      expect(guideCommand).to.have.property('handler');
      expect(guideCommand.command).to.equal('guide');
      expect(guideCommand.describe).to.include('interactive');
    });

    it('should support skip and reset options', () => {
      const guideCommand = require('../../src/commands/guide');
      const yargsMock = {
        option: sinon.stub().returnsThis()
      };

      guideCommand.builder(yargsMock);

      expect(yargsMock.option.calledWith('skip-deps')).to.be.true;
      expect(yargsMock.option.calledWith('reset')).to.be.true;
    });
  });

  describe('Welcome Step', () => {
    it('should display welcome message with ASCII art', async () => {
      const guideCommand = require('../../src/commands/guide');

      await guideCommand.handler({ skipDeps: true });

      expect(consoleLogStub.calledWith(sinon.match(/Welcome to ClaudeAutoPM/))).to.be.true;
      expect(consoleLogStub.calledWith(sinon.match(/Interactive Setup Guide/))).to.be.true;
    });

    it('should ask user to continue', async () => {
      inquirerPromptStub.resolves({ continue: true });

      const guideCommand = require('../../src/commands/guide');
      await guideCommand.handler({ skipDeps: true });

      expect(inquirerPromptStub.calledWith(sinon.match.array.contains([
        sinon.match.has('name', 'continue')
      ]))).to.be.true;
    });

    it('should exit gracefully if user chooses not to continue', async () => {
      inquirerPromptStub.resolves({ continue: false });

      const guideCommand = require('../../src/commands/guide');
      await guideCommand.handler({});

      expect(consoleLogStub.calledWith(sinon.match(/Come back anytime/))).to.be.true;
      expect(processExitStub.calledWith(0)).to.be.true;
    });
  });

  describe('Dependency Verification', () => {
    it('should check for required dependencies', async () => {
      const execStub = sinon.stub(require('child_process'), 'exec');
      execStub.withArgs('git --version').yields(null, 'git version 2.x.x');
      execStub.withArgs('node --version').yields(null, 'v18.x.x');

      inquirerPromptStub.resolves({ continue: true });

      const guideCommand = require('../../src/commands/guide');
      await guideCommand.handler({});

      expect(consoleLogStub.calledWith(sinon.match(/✓ Git/))).to.be.true;
      expect(consoleLogStub.calledWith(sinon.match(/✓ Node.js/))).to.be.true;
    });

    it('should warn about missing dependencies', async () => {
      const execStub = sinon.stub(require('child_process'), 'exec');
      execStub.withArgs('git --version').yields(new Error('Command not found'));

      inquirerPromptStub.resolves({ continue: true });

      const guideCommand = require('../../src/commands/guide');
      await guideCommand.handler({});

      expect(consoleLogStub.calledWith(sinon.match(/✗ Git.*not found/))).to.be.true;
    });

    it('should skip dependency check with --skip-deps flag', async () => {
      const execStub = sinon.stub(require('child_process'), 'exec');
      inquirerPromptStub.resolves({ continue: true, provider: 'github' });

      const guideCommand = require('../../src/commands/guide');
      await guideCommand.handler({ skipDeps: true });

      expect(execStub.called).to.be.false;
    });
  });

  describe('Provider Configuration', () => {
    beforeEach(() => {
      inquirerPromptStub.onCall(0).resolves({ continue: true });
    });

    it('should prompt for provider selection', async () => {
      inquirerPromptStub.onCall(1).resolves({ provider: 'github' });

      const guideCommand = require('../../src/commands/guide');
      await guideCommand.handler({ skipDeps: true });

      expect(inquirerPromptStub.calledWith(sinon.match.array.contains([
        sinon.match.has('name', 'provider')
      ]))).to.be.true;
    });

    it('should configure GitHub provider', async () => {
      inquirerPromptStub.onCall(1).resolves({ provider: 'github' });
      inquirerPromptStub.onCall(2).resolves({
        githubToken: 'ghp_test123',
        githubRepo: 'user/repo'
      });
      fsWriteJsonStub.resolves();

      const guideCommand = require('../../src/commands/guide');
      await guideCommand.handler({ skipDeps: true });

      expect(fsWriteJsonStub.calledWith(
        sinon.match(/config\.json$/),
        sinon.match({
          provider: 'github',
          github: {
            token: 'ghp_test123',
            repository: 'user/repo'
          }
        })
      )).to.be.true;
    });

    it('should configure Azure DevOps provider', async () => {
      inquirerPromptStub.onCall(1).resolves({ provider: 'azure' });
      inquirerPromptStub.onCall(2).resolves({
        azureToken: 'azure_pat_123',
        azureOrg: 'myorg',
        azureProject: 'myproject'
      });
      fsWriteJsonStub.resolves();

      const guideCommand = require('../../src/commands/guide');
      await guideCommand.handler({ skipDeps: true });

      expect(fsWriteJsonStub.calledWith(
        sinon.match(/config\.json$/),
        sinon.match({
          provider: 'azure',
          azure: {
            token: 'azure_pat_123',
            organization: 'myorg',
            project: 'myproject'
          }
        })
      )).to.be.true;
    });

    it('should validate token format', async () => {
      const guideCommand = require('../../src/commands/guide');

      // Test GitHub token validation
      const githubValidator = guideCommand.validateGitHubToken;
      expect(githubValidator('ghp_validtoken123')).to.be.true;
      expect(githubValidator('invalid')).to.match(/Invalid GitHub token/);

      // Test Azure token validation
      const azureValidator = guideCommand.validateAzureToken;
      expect(azureValidator('valid_azure_pat')).to.be.true;
      expect(azureValidator('')).to.match(/Token cannot be empty/);
    });
  });

  describe('First Task Creation', () => {
    beforeEach(() => {
      inquirerPromptStub.onCall(0).resolves({ continue: true });
      inquirerPromptStub.onCall(1).resolves({ provider: 'github' });
      inquirerPromptStub.onCall(2).resolves({
        githubToken: 'ghp_test123',
        githubRepo: 'user/repo'
      });
      fsWriteJsonStub.resolves();
    });

    it('should offer to create first task', async () => {
      inquirerPromptStub.onCall(3).resolves({ createTask: true });
      inquirerPromptStub.onCall(4).resolves({
        taskTitle: 'My First Task',
        taskDescription: 'This is a test task'
      });

      const guideCommand = require('../../src/commands/guide');
      await guideCommand.handler({ skipDeps: true });

      expect(inquirerPromptStub.calledWith(sinon.match.array.contains([
        sinon.match.has('name', 'createTask')
      ]))).to.be.true;
    });

    it('should create task using appropriate provider command', async () => {
      const execSyncStub = sinon.stub(require('child_process'), 'execSync');

      inquirerPromptStub.onCall(3).resolves({ createTask: true });
      inquirerPromptStub.onCall(4).resolves({
        taskTitle: 'My First Task',
        taskDescription: 'This is a test task'
      });

      const guideCommand = require('../../src/commands/guide');
      await guideCommand.handler({ skipDeps: true });

      expect(execSyncStub.calledWith(sinon.match(/autopm/))).to.be.true;
    });

    it('should handle task creation errors gracefully', async () => {
      const execSyncStub = sinon.stub(require('child_process'), 'execSync');
      execSyncStub.throws(new Error('API error'));

      inquirerPromptStub.onCall(3).resolves({ createTask: true });
      inquirerPromptStub.onCall(4).resolves({
        taskTitle: 'My First Task',
        taskDescription: 'This is a test task'
      });

      const guideCommand = require('../../src/commands/guide');
      await guideCommand.handler({ skipDeps: true });

      expect(consoleLogStub.calledWith(sinon.match(/couldn't create/))).to.be.true;
    });
  });

  describe('Summary and Next Steps', () => {
    beforeEach(() => {
      inquirerPromptStub.onCall(0).resolves({ continue: true });
      inquirerPromptStub.onCall(1).resolves({ provider: 'github' });
      inquirerPromptStub.onCall(2).resolves({
        githubToken: 'ghp_test123',
        githubRepo: 'user/repo'
      });
      inquirerPromptStub.onCall(3).resolves({ createTask: false });
      fsWriteJsonStub.resolves();
    });

    it('should display configuration summary', async () => {
      const guideCommand = require('../../src/commands/guide');
      await guideCommand.handler({ skipDeps: true });

      expect(consoleLogStub.calledWith(sinon.match(/Setup Complete/))).to.be.true;
      expect(consoleLogStub.calledWith(sinon.match(/Provider: GitHub/))).to.be.true;
    });

    it('should show next steps and useful commands', async () => {
      const guideCommand = require('../../src/commands/guide');
      await guideCommand.handler({ skipDeps: true });

      expect(consoleLogStub.calledWith(sinon.match(/Next Steps/))).to.be.true;
      expect(consoleLogStub.calledWith(sinon.match(/autopm/))).to.be.true;
    });

    it('should provide links to documentation', async () => {
      const guideCommand = require('../../src/commands/guide');
      await guideCommand.handler({ skipDeps: true });

      expect(consoleLogStub.calledWith(sinon.match(/Documentation/))).to.be.true;
      expect(consoleLogStub.calledWith(sinon.match(/github\.com/))).to.be.true;
    });
  });

  describe('Reset Configuration', () => {
    it('should reset configuration with --reset flag', async () => {
      fsExistsStub.resolves(true);
      const fsRemoveStub = sinon.stub(fs, 'remove').resolves();

      inquirerPromptStub.onCall(0).resolves({ confirmReset: true });
      inquirerPromptStub.onCall(1).resolves({ continue: true });
      inquirerPromptStub.onCall(2).resolves({ provider: 'github' });
      inquirerPromptStub.onCall(3).resolves({
        githubToken: 'ghp_test123',
        githubRepo: 'user/repo'
      });
      fsWriteJsonStub.resolves();

      const guideCommand = require('../../src/commands/guide');
      await guideCommand.handler({ reset: true, skipDeps: true });

      expect(fsRemoveStub.called).to.be.true;
      expect(consoleLogStub.calledWith(sinon.match(/Configuration reset/))).to.be.true;
    });

    it('should skip reset if user cancels', async () => {
      inquirerPromptStub.onCall(0).resolves({ confirmReset: false });
      const fsRemoveStub = sinon.stub(fs, 'remove');

      const guideCommand = require('../../src/commands/guide');
      await guideCommand.handler({ reset: true });

      expect(fsRemoveStub.called).to.be.false;
      expect(processExitStub.calledWith(0)).to.be.true;
    });
  });

  describe('Error Handling', () => {
    it('should handle configuration write errors', async () => {
      inquirerPromptStub.onCall(0).resolves({ continue: true });
      inquirerPromptStub.onCall(1).resolves({ provider: 'github' });
      inquirerPromptStub.onCall(2).resolves({
        githubToken: 'ghp_test123',
        githubRepo: 'user/repo'
      });
      fsWriteJsonStub.rejects(new Error('Permission denied'));

      const guideCommand = require('../../src/commands/guide');
      await guideCommand.handler({ skipDeps: true });

      expect(consoleErrorStub.calledWith(sinon.match(/Failed to save configuration/))).to.be.true;
    });

    it('should handle interrupted setup gracefully', async () => {
      inquirerPromptStub.rejects(new Error('User force closed'));

      const guideCommand = require('../../src/commands/guide');
      await guideCommand.handler({});

      expect(consoleLogStub.calledWith(sinon.match(/Setup interrupted/))).to.be.true;
      expect(processExitStub.calledWith(1)).to.be.true;
    });
  });
});

describe('Guide Integration Tests', () => {
  it('should complete full setup flow for GitHub', async () => {
    const inquirerPromptStub = inquirer.prompt ? sinon.stub(inquirer, 'prompt') : sinon.stub().resolves({});
    const fsWriteJsonStub = sinon.stub(fs, 'writeJson').resolves();

    // Simulate full flow
    inquirerPromptStub.onCall(0).resolves({ continue: true });
    inquirerPromptStub.onCall(1).resolves({ provider: 'github' });
    inquirerPromptStub.onCall(2).resolves({
      githubToken: 'ghp_test123',
      githubRepo: 'user/repo'
    });
    inquirerPromptStub.onCall(3).resolves({ createTask: false });

    const guideCommand = require('../../src/commands/guide');
    await guideCommand.handler({ skipDeps: true });

    expect(fsWriteJsonStub.called).to.be.true;

    inquirerPromptStub.restore();
    fsWriteJsonStub.restore();
  });
});