/**
 * Test Suite for Simplified PM Commands
 * Verifies that PM commands work without agentExecutor
 */

const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const fs = require('fs-extra');

describe('Simplified PM Commands', () => {
  let consoleLogStub;
  let consoleErrorStub;
  let printWarningStub;
  let printInfoStub;

  beforeEach(() => {
    consoleLogStub = sinon.stub(console, 'log');
    consoleErrorStub = sinon.stub(console, 'error');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('AI-Only Commands', () => {
    it('should show Claude Code requirement for issueAnalyze', () => {
      const command = require('../../bin/commands/pm/issueAnalyze');

      expect(command).to.have.property('command');
      expect(command).to.have.property('handler');
      expect(command.command).to.include('issue-analyze');

      // Test handler
      command.handler({ issue_id: '123' });

      // Verify Claude Code message is shown
      expect(consoleLogStub.calledWith('╔════════════════════════════════════════════════╗')).to.be.true;
      expect(consoleLogStub.calledWith('║    🤖 AI-Powered Command (Claude Code Only)    ║')).to.be.true;
    });

    it('should show Claude Code requirement for epicSync', () => {
      const command = require('../../bin/commands/pm/epicSync');

      expect(command.command).to.include('epic-sync');

      command.handler({ epic_name: 'test-epic' });

      // Check that it mentions Claude Code
      const output = consoleLogStub.args.map(args => args[0]).join(' ');
      expect(output).to.include('Claude Code');
    });
  });

  describe('Hybrid Commands', () => {
    it('prdNew should support template mode', () => {
      const command = require('../../bin/commands/pm/prdNew');

      expect(command.command).to.include('prd-new');
      expect(command.builder).to.be.a('function');

      // Check builder adds template option
      const yargsStub = {
        positional: sinon.stub().returnsThis(),
        option: sinon.stub().returnsThis(),
        example: sinon.stub().returnsThis()
      };

      command.builder(yargsStub);

      // Verify template option is added
      const templateOption = yargsStub.option.args.find(args => args[0] === 'template');
      expect(templateOption).to.not.be.undefined;
    });

    it('prdParse should support basic mode', () => {
      const command = require('../../bin/commands/pm/prdParse');

      expect(command.command).to.include('prd-parse');

      // Check builder adds basic option
      const yargsStub = {
        positional: sinon.stub().returnsThis(),
        option: sinon.stub().returnsThis(),
        example: sinon.stub().returnsThis()
      };

      command.builder(yargsStub);

      const basicOption = yargsStub.option.args.find(args => args[0] === 'basic');
      expect(basicOption).to.not.be.undefined;
    });

    it('epicDecompose should support template types', () => {
      const command = require('../../bin/commands/pm/epicDecompose');

      expect(command.command).to.include('epic-decompose');

      // Check builder adds template option with choices
      const yargsStub = {
        positional: sinon.stub().returnsThis(),
        option: sinon.stub().returnsThis(),
        example: sinon.stub().returnsThis()
      };

      command.builder(yargsStub);

      const templateOption = yargsStub.option.args.find(args => args[0] === 'template');
      expect(templateOption).to.not.be.undefined;
      expect(templateOption[1].choices).to.include('backend');
      expect(templateOption[1].choices).to.include('frontend');
    });
  });

  describe('Script-Based Commands', () => {
    it('standup should work in deterministic mode', async () => {
      const command = require('../../bin/commands/pm/standup');

      expect(command.command).to.equal('pm:standup');
      expect(command.handler).to.be.a('function');

      // Mock fs operations
      const fsPathExistsStub = sinon.stub(fs, 'pathExists');
      const fsReaddirStub = sinon.stub(fs, 'readdir');
      const fsStatStub = sinon.stub(fs, 'stat');

      fsPathExistsStub.withArgs(sinon.match(/\.claude$/)).resolves(true);
      fsPathExistsStub.withArgs(sinon.match(/standup\.sh$/)).resolves(false);
      fsReaddirStub.resolves([]);

      // Run handler
      await command.handler({ days: 1 });

      // Should show basic report
      expect(consoleLogStub.calledWith(sinon.match(/Daily Standup/))).to.be.true;

      fsPathExistsStub.restore();
      fsReaddirStub.restore();
      fsStatStub.restore();
    });
  });

  describe('No agentExecutor dependency', () => {
    it('should not require agentExecutor in any simplified command', () => {
      const pmCommands = [
        'standup', 'help', 'status', 'blocked',
        'issueAnalyze', 'epicSync',
        'prdNew', 'prdParse', 'epicDecompose'
      ];

      pmCommands.forEach(cmd => {
        const commandPath = path.join(__dirname, '../../bin/commands/pm', `${cmd}.js`);
        if (fs.existsSync(commandPath)) {
          const content = fs.readFileSync(commandPath, 'utf-8');
          expect(content).to.not.include('agentExecutor');
        }
      });
    });
  });
});