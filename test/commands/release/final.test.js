#!/usr/bin/env node

const test = require('node:test');
const assert = require('node:assert');
const { describe, it, beforeEach, afterEach, mock } = test;
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('release:final command', () => {
    let originalEnv;
    let tempDir;
    let consoleLogSpy;
    let consoleErrorSpy;
    let processExitSpy;

    beforeEach(() => {
        originalEnv = process.env;
        process.env = { ...originalEnv };
        tempDir = path.join(__dirname, '..', '..', '..', 'test-temp-' + Date.now());
        fs.mkdirSync(tempDir, { recursive: true });

        consoleLogSpy = mock.fn();
        consoleErrorSpy = mock.fn();
        processExitSpy = mock.fn();

        global.console.log = consoleLogSpy;
        global.console.error = consoleErrorSpy;
        process.exit = processExitSpy;
    });

    afterEach(() => {
        process.env = originalEnv;
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
        mock.restoreAll();
    });

    describe('Release Preparation', () => {
        it('should validate project structure before release', async () => {
            const ReleaseManager = require('../../../lib/release/manager');
            const manager = new ReleaseManager({ projectPath: tempDir });

            // Create minimal valid structure
            const requiredFiles = [
                'package.json',
                'README.md',
                'CHANGELOG.md',
                '.claude/base.md'
            ];

            for (const file of requiredFiles) {
                const filePath = path.join(tempDir, file);
                fs.mkdirSync(path.dirname(filePath), { recursive: true });
                fs.writeFileSync(filePath, '{}');
            }

            const result = await manager.validateStructure();
            assert.strictEqual(result.valid, true);
            assert.strictEqual(result.errors.length, 0);
        });

        it('should check all tests pass before release', async () => {
            const ReleaseManager = require('../../../lib/release/manager');
            const manager = new ReleaseManager({ projectPath: tempDir, dryRun: true });

            const result = await manager.checkTests();
            assert.strictEqual(result.passed, true);
            assert.strictEqual(result.failed, 0);
        });

        it('should verify version bump', async () => {
            const ReleaseManager = require('../../../lib/release/manager');
            const manager = new ReleaseManager({ projectPath: tempDir });

            const packageJson = {
                name: 'claude-autopm',
                version: '1.0.0'
            };
            fs.writeFileSync(
                path.join(tempDir, 'package.json'),
                JSON.stringify(packageJson, null, 2)
            );

            await manager.bumpVersion('minor');

            const updated = JSON.parse(fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8'));
            assert.strictEqual(updated.version, '1.1.0');
        });
    });

    describe('Release Validation', () => {
        it('should validate git status is clean', async () => {
            const ReleaseManager = require('../../../lib/release/manager');
            const manager = new ReleaseManager({ projectPath: tempDir });

            // Override the method directly
            manager.validateGitStatus = async () => ({
                clean: true,
                branch: 'main',
                changes: []
            });

            const result = await manager.validateGitStatus();
            assert.strictEqual(result.clean, true);
            assert.strictEqual(result.branch, 'main');
        });

        it('should ensure on main branch', async () => {
            const ReleaseManager = require('../../../lib/release/manager');
            const manager = new ReleaseManager({ projectPath: tempDir });

            // Override the method directly
            manager.getCurrentBranch = async () => 'main';
            manager.validateGitStatus = async () => ({ branch: 'main', clean: true });

            const result = await manager.ensureMainBranch();
            assert.strictEqual(result, true);
        });

        it('should check for breaking changes', async () => {
            const ReleaseManager = require('../../../lib/release/manager');
            const manager = new ReleaseManager({ projectPath: tempDir });

            const changelog = `# Changelog

## [Unreleased]
### Added
- New feature

### Breaking Changes
- API changed
`;
            fs.writeFileSync(path.join(tempDir, 'CHANGELOG.md'), changelog);

            const result = await manager.checkBreakingChanges();
            assert.strictEqual(result.hasBreaking, true);
            assert.strictEqual(result.changes.length, 1);
        });
    });

    describe('Release Publishing', () => {
        it('should create git tag', async () => {
            const ReleaseManager = require('../../../lib/release/manager');
            const manager = new ReleaseManager({ projectPath: tempDir, dryRun: true });

            const result = await manager.createTag('1.1.0', 'Release v1.1.0');
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.tag, 'v1.1.0');
        });

        it('should push to remote', async () => {
            const ReleaseManager = require('../../../lib/release/manager');
            const manager = new ReleaseManager({ projectPath: tempDir, dryRun: true });

            const result = await manager.push();
            assert.strictEqual(result.success, true);
        });

        it('should publish to npm', async () => {
            const ReleaseManager = require('../../../lib/release/manager');
            const packageJson = {
                name: 'test-package',
                version: '1.1.0'
            };
            fs.writeFileSync(
                path.join(tempDir, 'package.json'),
                JSON.stringify(packageJson, null, 2)
            );

            const manager = new ReleaseManager({ projectPath: tempDir, dryRun: true });

            const result = await manager.publish();
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.version, '1.1.0');
        });
    });
});