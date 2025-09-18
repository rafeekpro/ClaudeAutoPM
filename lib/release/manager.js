const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ReleaseManager {
    constructor(options = {}) {
        this.projectPath = options.projectPath || process.cwd();
        this.dryRun = options.dryRun || false;
        this.verbose = options.verbose || false;
    }

    async validateStructure() {
        const errors = [];
        const requiredFiles = [
            'package.json',
            'README.md',
            'CHANGELOG.md',
            '.claude/base.md'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(this.projectPath, file);
            if (!fs.existsSync(filePath)) {
                errors.push(`Missing required file: ${file}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    async checkTests() {
        try {
            if (this.dryRun) {
                return { passed: true, failed: 0, total: 100 };
            }

            const output = execSync('npm test', {
                cwd: this.projectPath,
                encoding: 'utf8',
                stdio: 'pipe'
            });

            const passed = !output.includes('FAILED');
            const failMatch = output.match(/Failed: (\d+)/);
            const totalMatch = output.match(/Total: (\d+)/);

            return {
                passed,
                failed: failMatch ? parseInt(failMatch[1]) : 0,
                total: totalMatch ? parseInt(totalMatch[1]) : 0
            };
        } catch (error) {
            return {
                passed: false,
                failed: 1,
                total: 1,
                error: error.message
            };
        }
    }

    async bumpVersion(type = 'patch') {
        const packageJsonPath = path.join(this.projectPath, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        const [major, minor, patch] = packageJson.version.split('.').map(Number);

        let newVersion;
        switch (type) {
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

        packageJson.version = newVersion;

        if (!this.dryRun) {
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
        }

        return newVersion;
    }

    async validateGitStatus() {
        try {
            const status = execSync('git status --porcelain', {
                cwd: this.projectPath,
                encoding: 'utf8'
            });

            const branch = execSync('git branch --show-current', {
                cwd: this.projectPath,
                encoding: 'utf8'
            }).trim();

            return {
                clean: status.trim() === '',
                branch,
                changes: status.split('\n').filter(line => line.trim())
            };
        } catch (error) {
            return {
                clean: false,
                branch: 'unknown',
                error: error.message
            };
        }
    }

    async ensureMainBranch() {
        const { branch } = await this.validateGitStatus();
        return branch === 'main' || branch === 'master';
    }

    async getCurrentBranch() {
        try {
            return execSync('git branch --show-current', {
                cwd: this.projectPath,
                encoding: 'utf8'
            }).trim();
        } catch {
            return 'unknown';
        }
    }

    async checkBreakingChanges() {
        const changelogPath = path.join(this.projectPath, 'CHANGELOG.md');

        if (!fs.existsSync(changelogPath)) {
            return { hasBreaking: false, changes: [] };
        }

        const changelog = fs.readFileSync(changelogPath, 'utf8');
        const breakingSection = changelog.match(/###?\s*Breaking Changes?\s*\n([\s\S]*?)(?=\n###?|\n##|$)/i);

        if (breakingSection && breakingSection[1].trim()) {
            const changes = breakingSection[1]
                .split('\n')
                .filter(line => line.trim().startsWith('-'))
                .map(line => line.trim().substring(1).trim());

            return {
                hasBreaking: changes.length > 0,
                changes
            };
        }

        return { hasBreaking: false, changes: [] };
    }

    async createTag(version, message) {
        const tag = `v${version}`;

        try {
            if (!this.dryRun) {
                execSync(`git tag -a ${tag} -m "${message}"`, {
                    cwd: this.projectPath,
                    encoding: 'utf8'
                });
            }

            return {
                success: true,
                tag
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async createGitTag(version, message) {
        return this.createTag(version, message);
    }

    async push() {
        try {
            if (!this.dryRun) {
                execSync('git push && git push --tags', {
                    cwd: this.projectPath,
                    encoding: 'utf8'
                });
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async pushToRemote() {
        return this.push();
    }

    async publish() {
        try {
            const packageJson = JSON.parse(
                fs.readFileSync(path.join(this.projectPath, 'package.json'), 'utf8')
            );

            if (!this.dryRun) {
                execSync('npm publish', {
                    cwd: this.projectPath,
                    encoding: 'utf8'
                });
            }

            return {
                success: true,
                version: packageJson.version
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async publishToNpm() {
        return this.publish();
    }

    async generateChangelog(version, changes) {
        const changelogPath = path.join(this.projectPath, 'CHANGELOG.md');
        let changelog = '';

        if (fs.existsSync(changelogPath)) {
            changelog = fs.readFileSync(changelogPath, 'utf8');
        }

        const date = new Date().toISOString().split('T')[0];
        const newEntry = `## [${version}] - ${date}\n${changes}\n\n`;

        const updatedChangelog = changelog.replace(
            /^(#.*?\n+)/,
            `$1\n${newEntry}`
        );

        if (!this.dryRun) {
            fs.writeFileSync(changelogPath, updatedChangelog);
        }

        return { success: true };
    }

    async executeRelease(options = {}) {
        const steps = [];

        // Validate structure
        const structureCheck = await this.validateStructure();
        steps.push({ step: 'structure', ...structureCheck });
        if (!structureCheck.valid) {
            return { success: false, steps, error: 'Invalid project structure' };
        }

        // Check tests
        const testCheck = await this.checkTests();
        steps.push({ step: 'tests', ...testCheck });
        if (!testCheck.passed) {
            return { success: false, steps, error: 'Tests failed' };
        }

        // Check git status
        const gitStatus = await this.validateGitStatus();
        steps.push({ step: 'git-status', ...gitStatus });
        if (!gitStatus.clean) {
            return { success: false, steps, error: 'Git working directory not clean' };
        }

        // Check branch
        const onMain = await this.ensureMainBranch();
        steps.push({ step: 'branch-check', onMain });
        if (!onMain) {
            return { success: false, steps, error: 'Not on main branch' };
        }

        // Bump version
        const newVersion = await this.bumpVersion(options.versionType || 'patch');
        steps.push({ step: 'version-bump', version: newVersion });

        // Generate changelog
        if (options.changelog) {
            await this.generateChangelog(newVersion, options.changelog);
            steps.push({ step: 'changelog', success: true });
        }

        // Create tag
        const tagResult = await this.createTag(newVersion, `Release v${newVersion}`);
        steps.push({ step: 'tag', ...tagResult });

        // Push to remote
        const pushResult = await this.push();
        steps.push({ step: 'push', ...pushResult });

        // Publish to npm
        if (!options.skipNpm) {
            const publishResult = await this.publish();
            steps.push({ step: 'npm-publish', ...publishResult });
        }

        return {
            success: true,
            version: newVersion,
            steps
        };
    }
}

module.exports = ReleaseManager;