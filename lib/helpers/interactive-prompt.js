#!/usr/bin/env node
/**
 * Interactive Prompt Helper
 * Provides interactive prompts for missing parameters
 */

const readline = require('readline');
const fs = require('fs').promises;

class InteractivePrompt {
    constructor(options = {}) {
        this.rl = null;
        this.history = new Map();
        this.defaults = options.defaults || {};
        this.validation = options.validation || {};
    }

    /**
     * Initialize readline interface
     */
    init() {
        if (!this.rl) {
            this.rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
                terminal: true
            });
        }
    }

    /**
     * Close readline interface
     */
    close() {
        if (this.rl) {
            this.rl.close();
            this.rl = null;
        }
    }

    /**
     * Prompt for input with validation
     */
    async prompt(question, options = {}) {
        this.init();

        const {
            defaultValue = this.defaults[question],
            required = false,
            type = 'string',
            choices = null,
            mask = false,
            validate = this.validation[question]
        } = options;

        let promptText = question;

        // Add choices if available
        if (choices && choices.length > 0) {
            promptText += '\nChoices:\n';
            choices.forEach((choice, index) => {
                promptText += `  ${index + 1}) ${choice}\n`;
            });
            promptText += 'Enter choice';
        }

        // Add default value indicator
        if (defaultValue !== undefined) {
            promptText += ` [${defaultValue}]`;
        }

        promptText += ': ';

        return new Promise((resolve) => {
            const askQuestion = () => {
                this.rl.question(promptText, async (answer) => {
                    // Use default if no answer provided
                    if (!answer && defaultValue !== undefined) {
                        answer = defaultValue;
                    }

                    // Check required
                    if (required && !answer) {
                        console.log('This field is required.');
                        return askQuestion();
                    }

                    // Handle choices
                    if (choices && answer) {
                        const choiceIndex = parseInt(answer) - 1;
                        if (choiceIndex >= 0 && choiceIndex < choices.length) {
                            answer = choices[choiceIndex];
                        } else if (!choices.includes(answer)) {
                            console.log('Invalid choice. Please select from the list.');
                            return askQuestion();
                        }
                    }

                    // Type conversion
                    if (type === 'number' && answer) {
                        answer = parseFloat(answer);
                        if (isNaN(answer)) {
                            console.log('Please enter a valid number.');
                            return askQuestion();
                        }
                    } else if (type === 'boolean' && answer) {
                        answer = ['yes', 'y', 'true', '1'].includes(answer.toLowerCase());
                    }

                    // Custom validation
                    if (validate && answer) {
                        const validationResult = await validate(answer);
                        if (validationResult !== true) {
                            console.log(validationResult || 'Invalid input.');
                            return askQuestion();
                        }
                    }

                    // Store in history
                    this.history.set(question, answer);

                    resolve(answer);
                });
            };

            askQuestion();
        });
    }

    /**
     * Prompt for multiple inputs
     */
    async promptMany(questions) {
        const answers = {};

        for (const question of questions) {
            if (typeof question === 'string') {
                answers[question] = await this.prompt(question);
            } else {
                const { name, ...options } = question;
                answers[name] = await this.prompt(name, options);
            }
        }

        return answers;
    }

    /**
     * Confirm action
     */
    async confirm(message, defaultValue = false) {
        const answer = await this.prompt(message, {
            type: 'boolean',
            defaultValue: defaultValue ? 'yes' : 'no'
        });

        return answer;
    }

    /**
     * Select from list
     */
    async select(message, choices, defaultIndex = 0) {
        return this.prompt(message, {
            choices,
            defaultValue: choices[defaultIndex]
        });
    }

    /**
     * Multi-select from list
     */
    async multiSelect(message, choices, defaults = []) {
        console.log(message);
        console.log('Select multiple (comma-separated numbers):');
        choices.forEach((choice, index) => {
            const selected = defaults.includes(choice) ? '✓' : ' ';
            console.log(`  [${selected}] ${index + 1}) ${choice}`);
        });

        const answer = await this.prompt('Enter choices', {
            defaultValue: defaults.map(d => choices.indexOf(d) + 1).join(',')
        });

        const indices = answer.split(',').map(s => parseInt(s.trim()) - 1);
        return indices
            .filter(i => i >= 0 && i < choices.length)
            .map(i => choices[i]);
    }

    /**
     * Password input (masked)
     */
    async password(message) {
        this.init();

        return new Promise((resolve) => {
            const stdin = process.stdin;
            const stdout = process.stdout;

            stdout.write(message + ': ');

            stdin.setRawMode(true);
            stdin.resume();
            stdin.setEncoding('utf8');

            let password = '';

            const onData = (char) => {
                if (char === '\n' || char === '\r') {
                    stdin.setRawMode(false);
                    stdin.pause();
                    stdin.removeListener('data', onData);
                    stdout.write('\n');
                    resolve(password);
                } else if (char === '\u0003') {
                    // Ctrl+C
                    process.exit();
                } else if (char === '\u007f') {
                    // Backspace
                    if (password.length > 0) {
                        password = password.slice(0, -1);
                        stdout.clearLine();
                        stdout.cursorTo(0);
                        stdout.write(message + ': ' + '*'.repeat(password.length));
                    }
                } else {
                    password += char;
                    stdout.write('*');
                }
            };

            stdin.on('data', onData);
        });
    }

    /**
     * Create wizard for complex configurations
     */
    async wizard(steps) {
        const results = {};

        console.log('\n🧙 Configuration Wizard\n');

        for (const step of steps) {
            if (step.message) {
                console.log(`\n${step.message}\n`);
            }

            if (step.condition && !step.condition(results)) {
                continue;
            }

            const answer = await this.prompt(step.name, step.options);
            results[step.name] = answer;

            if (step.postProcess) {
                await step.postProcess(answer, results);
            }
        }

        console.log('\n✅ Configuration complete!\n');
        return results;
    }
}

/**
 * Preset prompts for Azure DevOps
 */
class AzurePrompts extends InteractivePrompt {
    constructor() {
        super({
            validation: {
                'Work Item ID': (value) => {
                    return /^\d+$/.test(value) || 'Please enter a valid work item ID';
                },
                'Sprint Name': (value) => {
                    return value.length > 0 || 'Sprint name cannot be empty';
                },
                'Story Points': (value) => {
                    const points = parseFloat(value);
                    return (!isNaN(points) && points > 0 && points <= 100) ||
                           'Please enter a valid number between 1 and 100';
                }
            }
        });
    }

    /**
     * Prompt for missing work item details
     */
    async promptWorkItem(existing = {}) {
        const questions = [];

        if (!existing.title) {
            questions.push({
                name: 'title',
                options: { required: true }
            });
        }

        if (!existing.type) {
            questions.push({
                name: 'type',
                options: {
                    choices: ['Task', 'User Story', 'Bug', 'Feature'],
                    defaultValue: 'Task'
                }
            });
        }

        if (!existing.assignedTo) {
            questions.push({
                name: 'assignedTo',
                options: {
                    defaultValue: process.env.AZURE_DEVOPS_USER || 'me'
                }
            });
        }

        if (!existing.priority && existing.type !== 'Feature') {
            questions.push({
                name: 'priority',
                options: {
                    choices: ['1 - Critical', '2 - High', '3 - Medium', '4 - Low'],
                    defaultValue: '3 - Medium'
                }
            });
        }

        const answers = await this.promptMany(questions);
        return { ...existing, ...answers };
    }
}

module.exports = { InteractivePrompt, AzurePrompts };