#!/usr/bin/env node

const chalk = require('chalk');
const ReleaseManager = require('../../../lib/release/manager');
const readline = require('readline');

exports.command = 'release:final';
exports.describe = 'Prepare and execute final release';

exports.builder = (yargs) => {
    return yargs
        .option('version-type', {
            alias: 'v',
            describe: 'Version bump type',
            choices: ['major', 'minor', 'patch'],
            default: 'patch'
        })
        .option('dry-run', {
            alias: 'd',
            describe: 'Perform dry run without making changes',
            type: 'boolean',
            default: false
        })
        .option('skip-npm', {
            describe: 'Skip npm publish step',
            type: 'boolean',
            default: false
        })
        .option('skip-tests', {
            describe: 'Skip test execution (not recommended)',
            type: 'boolean',
            default: false
        })
        .option('changelog', {
            alias: 'c',
            describe: 'Changelog entries for this release',
            type: 'string'
        })
        .option('yes', {
            alias: 'y',
            describe: 'Skip confirmation prompts',
            type: 'boolean',
            default: false
        })
        .option('verbose', {
            describe: 'Show verbose output',
            type: 'boolean',
            default: false
        });
};

exports.handler = async (argv) => {
    const manager = new ReleaseManager({
        projectPath: process.cwd(),
        dryRun: argv.dryRun,
        verbose: argv.verbose
    });

    console.log(chalk.blue('📦 Preparing Final Release'));

    if (argv.dryRun) {
        console.log(chalk.yellow('⚠️  Dry run mode - no changes will be made'));
    }

    try {
        // Step 1: Validate project structure
        console.log(chalk.gray('→ Validating project structure...'));
        const structureCheck = await manager.validateStructure();

        if (!structureCheck.valid) {
            console.error(chalk.red('❌ Project structure validation failed:'));
            structureCheck.errors.forEach(err => console.error(chalk.red(`   - ${err}`)));
            process.exit(1);
        }
        console.log(chalk.green('✓ Project structure valid'));

        // Step 2: Run tests (unless skipped)
        if (!argv.skipTests) {
            console.log(chalk.gray('→ Running tests...'));
            const testResults = await manager.checkTests();

            if (!testResults.passed) {
                console.error(chalk.red(`❌ Tests failed: ${testResults.failed}/${testResults.total}`));
                if (testResults.error) {
                    console.error(chalk.red(`   Error: ${testResults.error}`));
                }
                process.exit(1);
            }
            console.log(chalk.green(`✓ All tests passed (${testResults.total} tests)`));
        }

        // Step 3: Check git status
        console.log(chalk.gray('→ Checking git status...'));
        const gitStatus = await manager.validateGitStatus();

        if (!gitStatus.clean) {
            console.error(chalk.red('❌ Git working directory not clean:'));
            gitStatus.changes.forEach(change => console.error(chalk.red(`   ${change}`)));
            process.exit(1);
        }
        console.log(chalk.green('✓ Git working directory clean'));

        // Step 4: Ensure on main branch
        const onMain = await manager.ensureMainBranch();
        if (!onMain) {
            console.error(chalk.red(`❌ Not on main branch (current: ${gitStatus.branch})`));
            process.exit(1);
        }
        console.log(chalk.green(`✓ On ${gitStatus.branch} branch`));

        // Step 5: Check for breaking changes
        const breaking = await manager.checkBreakingChanges();
        if (breaking.hasBreaking) {
            console.log(chalk.yellow('⚠️  Breaking changes detected:'));
            breaking.changes.forEach(change => console.log(chalk.yellow(`   - ${change}`)));

            if (argv.versionType === 'patch') {
                console.log(chalk.yellow('   Consider using --version-type=major for breaking changes'));
            }
        }

        // Step 6: Show release plan
        const packageJson = require(`${process.cwd()}/package.json`);
        const currentVersion = packageJson.version;
        const [major, minor, patch] = currentVersion.split('.').map(Number);

        let newVersion;
        switch (argv.versionType) {
            case 'major':
                newVersion = `${major + 1}.0.0`;
                break;
            case 'minor':
                newVersion = `${major}.${minor + 1}.0`;
                break;
            case 'patch':
            default:
                newVersion = `${major}.${minor}.${patch + 1}`;
        }

        console.log(chalk.blue('\n📋 Release Plan:'));
        console.log(chalk.gray(`   Current version: ${currentVersion}`));
        console.log(chalk.cyan(`   New version: ${newVersion}`));
        console.log(chalk.gray(`   Version type: ${argv.versionType}`));
        console.log(chalk.gray(`   NPM publish: ${argv.skipNpm ? 'No' : 'Yes'}`));

        if (argv.changelog) {
            console.log(chalk.gray(`   Changelog: ${argv.changelog.substring(0, 50)}...`));
        }

        // Step 7: Confirm release
        if (!argv.yes && !argv.dryRun) {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise(resolve => {
                rl.question(chalk.yellow('\n❓ Proceed with release? (y/N): '), resolve);
            });
            rl.close();

            if (answer.toLowerCase() !== 'y') {
                console.log(chalk.yellow('Release cancelled'));
                process.exit(0);
            }
        }

        // Step 8: Execute release
        console.log(chalk.blue('\n🚀 Executing release...'));

        const result = await manager.executeRelease({
            versionType: argv.versionType,
            changelog: argv.changelog,
            skipNpm: argv.skipNpm
        });

        if (result.success) {
            console.log(chalk.green(`\n✅ Release ${result.version} completed successfully!`));

            console.log(chalk.gray('\n📊 Release summary:'));
            result.steps.forEach(step => {
                const icon = step.success !== false ? '✓' : '✗';
                const color = step.success !== false ? chalk.green : chalk.red;
                console.log(color(`   ${icon} ${step.step}`));
            });

            console.log(chalk.cyan('\n🎉 Next steps:'));
            console.log(chalk.gray('   1. Create GitHub release with release notes'));
            console.log(chalk.gray('   2. Announce release in relevant channels'));
            console.log(chalk.gray('   3. Update documentation if needed'));
        } else {
            console.error(chalk.red(`\n❌ Release failed: ${result.error}`));

            if (result.steps) {
                console.log(chalk.gray('\n📊 Completed steps:'));
                result.steps.forEach(step => {
                    const icon = step.success !== false ? '✓' : '✗';
                    const color = step.success !== false ? chalk.green : chalk.red;
                    console.log(color(`   ${icon} ${step.step}`));
                });
            }
            process.exit(1);
        }

    } catch (error) {
        console.error(chalk.red(`\n❌ Release failed: ${error.message}`));
        if (argv.verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    }
};