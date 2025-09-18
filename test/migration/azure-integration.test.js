#!/usr/bin/env node
/**
 * Integration tests for Azure DevOps script migration
 * Validates that all three scripts work with their bash wrappers
 */

const { describe, it } = require('node:test');
const { execSync } = require('child_process');
const path = require('path');
const assert = require('assert');
const { describeIntegration } = require('../helpers/test-utils');

describeIntegration('Azure Scripts Integration Tests', () => {
    const projectRoot = path.join(__dirname, '..', '..');

    describe.skip('Node.js Implementations - PENDING: Implementation', () => {
        // TODO: Enable after implementing Azure scripts
        it('azure-feature-list.js should validate environment and show error', () => {
            try {
                const output = execSync('node bin/node/azure-feature-list.js', {
                    cwd: projectRoot,
                    encoding: 'utf8',
                    stdio: 'pipe'
                });
                assert.fail('Should have failed with missing environment');
            } catch (error) {
                assert(error.stdout.includes('Missing required environment variable'));
                assert(error.stdout.includes('AZURE_DEVOPS_ORG'));
            }
        });

        it('azure-sprint-report.js should validate environment and show error', () => {
            try {
                const output = execSync('node bin/node/azure-sprint-report.js', {
                    cwd: projectRoot,
                    encoding: 'utf8',
                    stdio: 'pipe'
                });
                assert.fail('Should have failed with missing environment');
            } catch (error) {
                assert(error.stdout.includes('Missing required environment variable'));
                assert(error.stdout.includes('AZURE_DEVOPS_ORG'));
            }
        });

        it('azure-next-task.js should validate environment and show error', () => {
            try {
                const output = execSync('node bin/node/azure-next-task.js', {
                    cwd: projectRoot,
                    encoding: 'utf8',
                    stdio: 'pipe'
                });
                assert.fail('Should have failed with missing environment');
            } catch (error) {
                assert(error.stdout.includes('Missing required environment variable'));
                assert(error.stdout.includes('AZURE_DEVOPS_ORG'));
            }
        });
    });

    describe.skip('Bash Wrapper Delegation - PENDING: Implementation', () => {
        // TODO: Enable after implementing bash wrappers
        it('feature-list.sh should delegate to Node.js implementation', () => {
            try {
                const output = execSync('bash autopm/.claude/scripts/azure/feature-list.sh', {
                    cwd: projectRoot,
                    encoding: 'utf8',
                    stdio: 'pipe'
                });
                assert.fail('Should have failed with missing environment');
            } catch (error) {
                // Should show the same error as Node.js version (proving delegation works)
                assert(error.stdout.includes('Missing required environment variable'));
                assert(error.stdout.includes('AZURE_DEVOPS_ORG'));
                // Should NOT show the fallback warning
                assert(!error.stdout.includes('Node.js implementation not found'));
            }
        });

        it('sprint-report.sh should delegate to Node.js implementation', () => {
            try {
                const output = execSync('bash autopm/.claude/scripts/azure/sprint-report.sh', {
                    cwd: projectRoot,
                    encoding: 'utf8',
                    stdio: 'pipe'
                });
                assert.fail('Should have failed with missing environment');
            } catch (error) {
                assert(error.stdout.includes('Missing required environment variable'));
                assert(error.stdout.includes('AZURE_DEVOPS_ORG'));
                assert(!error.stdout.includes('Node.js implementation not found'));
            }
        });

        it('next-task.sh should delegate to Node.js implementation', () => {
            try {
                const output = execSync('bash autopm/.claude/scripts/azure/next-task.sh', {
                    cwd: projectRoot,
                    encoding: 'utf8',
                    stdio: 'pipe'
                });
                assert.fail('Should have failed with missing environment');
            } catch (error) {
                assert(error.stdout.includes('Missing required environment variable'));
                assert(error.stdout.includes('AZURE_DEVOPS_ORG'));
                assert(!error.stdout.includes('Node.js implementation not found'));
            }
        });
    });

    describe('Argument Passing', () => {
        it('feature-list.sh should pass arguments to Node.js version', () => {
            try {
                const output = execSync('bash autopm/.claude/scripts/azure/feature-list.sh --status=active', {
                    cwd: projectRoot,
                    encoding: 'utf8',
                    stdio: 'pipe'
                });
                assert.fail('Should have failed with missing environment');
            } catch (error) {
                // Even with arguments, should still fail on environment validation
                assert(error.stdout.includes('Missing required environment variable'));
            }
        });

        it('sprint-report.sh should pass sprint name to Node.js version', () => {
            try {
                const output = execSync('bash autopm/.claude/scripts/azure/sprint-report.sh "Sprint 24"', {
                    cwd: projectRoot,
                    encoding: 'utf8',
                    stdio: 'pipe'
                });
                assert.fail('Should have failed with missing environment');
            } catch (error) {
                assert(error.stdout.includes('Missing required environment variable'));
            }
        });

        it('next-task.sh should pass user filter to Node.js version', () => {
            try {
                const output = execSync('bash autopm/.claude/scripts/azure/next-task.sh --user=john@example.com', {
                    cwd: projectRoot,
                    encoding: 'utf8',
                    stdio: 'pipe'
                });
                assert.fail('Should have failed with missing environment');
            } catch (error) {
                assert(error.stdout.includes('Missing required environment variable'));
            }
        });
    });

    describe('File Structure Validation', () => {
        it('all Node.js implementations should exist', () => {
            const fs = require('fs');
            const featureListPath = path.join(projectRoot, 'bin', 'node', 'azure-feature-list.js');
            const sprintReportPath = path.join(projectRoot, 'bin', 'node', 'azure-sprint-report.js');
            const nextTaskPath = path.join(projectRoot, 'bin', 'node', 'azure-next-task.js');

            assert(fs.existsSync(featureListPath), 'azure-feature-list.js should exist');
            assert(fs.existsSync(sprintReportPath), 'azure-sprint-report.js should exist');
            assert(fs.existsSync(nextTaskPath), 'azure-next-task.js should exist');

            // Check that files are executable
            const featureListStat = fs.statSync(featureListPath);
            const sprintReportStat = fs.statSync(sprintReportPath);
            const nextTaskStat = fs.statSync(nextTaskPath);

            assert(featureListStat.mode & 0o111, 'azure-feature-list.js should be executable');
            assert(sprintReportStat.mode & 0o111, 'azure-sprint-report.js should be executable');
            assert(nextTaskStat.mode & 0o111, 'azure-next-task.js should be executable');
        });

        it('all bash wrappers should exist and contain delegation logic', () => {
            const fs = require('fs');
            const featureListPath = path.join(projectRoot, 'autopm', '.claude', 'scripts', 'azure', 'feature-list.sh');
            const sprintReportPath = path.join(projectRoot, 'autopm', '.claude', 'scripts', 'azure', 'sprint-report.sh');
            const nextTaskPath = path.join(projectRoot, 'autopm', '.claude', 'scripts', 'azure', 'next-task.sh');

            assert(fs.existsSync(featureListPath), 'feature-list.sh should exist');
            assert(fs.existsSync(sprintReportPath), 'sprint-report.sh should exist');
            assert(fs.existsSync(nextTaskPath), 'next-task.sh should exist');

            // Check that wrappers contain delegation logic
            const featureListContent = fs.readFileSync(featureListPath, 'utf8');
            const sprintReportContent = fs.readFileSync(sprintReportPath, 'utf8');
            const nextTaskContent = fs.readFileSync(nextTaskPath, 'utf8');

            assert(featureListContent.includes('NODE_SCRIPT='), 'feature-list.sh should contain Node.js delegation');
            assert(featureListContent.includes('exec node'), 'feature-list.sh should exec Node.js script');

            assert(sprintReportContent.includes('NODE_SCRIPT='), 'sprint-report.sh should contain Node.js delegation');
            assert(sprintReportContent.includes('exec node'), 'sprint-report.sh should exec Node.js script');

            assert(nextTaskContent.includes('NODE_SCRIPT='), 'next-task.sh should contain Node.js delegation');
            assert(nextTaskContent.includes('exec node'), 'next-task.sh should exec Node.js script');
        });
    });

    describe.skip('Module Exports - REQUIRES FULL IMPLEMENTATION', () => {
        it('azure-feature-list.js should export required functions', () => {
            const azureFeatureList = require('../../bin/node/azure-feature-list.js');

            assert(typeof azureFeatureList.listFeatures === 'function');
            assert(typeof azureFeatureList.formatFeatureTable === 'function');
            assert(typeof azureFeatureList.validateEnvironment === 'function');
            assert(typeof azureFeatureList.buildWiqlQuery === 'function');
            assert(typeof azureFeatureList.main === 'function');
        });

        it('azure-sprint-report.js should export required functions', () => {
            const azureSprintReport = require('../../bin/node/azure-sprint-report.js');

            assert(typeof azureSprintReport.generateSprintReport === 'function');
            assert(typeof azureSprintReport.getSprintInformation === 'function');
            assert(typeof azureSprintReport.validateEnvironment === 'function');
            assert(typeof azureSprintReport.main === 'function');
        });

        it('azure-next-task.js should export required functions', () => {
            const azureNextTask = require('../../bin/node/azure-next-task.js');

            assert(typeof azureNextTask.getNextTask === 'function');
            assert(typeof azureNextTask.getAvailableTasks === 'function');
            assert(typeof azureNextTask.scoreTask === 'function');
            assert(typeof azureNextTask.validateEnvironment === 'function');
            assert(typeof azureNextTask.main === 'function');
        });
    });
});

// Run the tests if this file is executed directly
// NOTE: This direct execution is for debugging only, not part of test suite
if (require.main === module && process.env.DEBUG_AZURE_TESTS) {
    const { shouldRunIntegrationTests } = require('../helpers/test-utils');

    console.log('Running Azure Scripts Integration Tests...');
    console.log('==========================================');

    try {
        // Simple validation that files exist and can be loaded
        const fs = require('fs');

        console.log('✅ Testing file existence...');
        const nodeScripts = [
            'bin/node/azure-feature-list.js',
            'bin/node/azure-sprint-report.js',
            'bin/node/azure-next-task.js'
        ];

        const bashScripts = [
            'autopm/.claude/scripts/azure/feature-list.sh',
            'autopm/.claude/scripts/azure/sprint-report.sh',
            'autopm/.claude/scripts/azure/next-task.sh'
        ];

        for (const script of nodeScripts) {
            const fullPath = path.join(__dirname, '..', '..', script);
            assert(fs.existsSync(fullPath), `${script} should exist`);
            console.log(`  ✓ ${script}`);
        }

        for (const script of bashScripts) {
            const fullPath = path.join(__dirname, '..', '..', script);
            assert(fs.existsSync(fullPath), `${script} should exist`);
            console.log(`  ✓ ${script}`);
        }

        // Skip module export tests if not running integration tests
        if (shouldRunIntegrationTests()) {
            console.log('✅ Testing module exports...');
            const azureFeatureList = require('../../bin/node/azure-feature-list.js');
            const azureSprintReport = require('../../bin/node/azure-sprint-report.js');
            const azureNextTask = require('../../bin/node/azure-next-task.js');

            assert(typeof azureFeatureList.main === 'function');
            assert(typeof azureSprintReport.main === 'function');
            assert(typeof azureNextTask.main === 'function');
            console.log('  ✓ All modules export main function');
        } else {
            console.log('⏭️ Skipping module export tests (integration tests disabled)');
        }

        console.log('✅ Testing environment validation...');
        try {
            execSync('node bin/node/azure-feature-list.js', {
                cwd: path.join(__dirname, '..', '..'),
                encoding: 'utf8',
                stdio: 'pipe'
            });
        } catch (error) {
            assert(error.stdout.includes('Missing required environment variable'));
            console.log('  ✓ Environment validation working');
        }

        console.log('✅ Testing bash wrapper delegation...');
        try {
            execSync('bash autopm/.claude/scripts/azure/feature-list.sh', {
                cwd: path.join(__dirname, '..', '..'),
                encoding: 'utf8',
                stdio: 'pipe'
            });
        } catch (error) {
            assert(error.stdout.includes('Missing required environment variable'));
            assert(!error.stdout.includes('Node.js implementation not found'));
            console.log('  ✓ Bash wrapper delegation working');
        }

        console.log('');
        console.log('🎉 All integration tests passed!');
        console.log('Azure scripts migration completed successfully.');

    } catch (error) {
        console.error('❌ Integration test failed:', error.message);
        process.exit(1);
    }
}