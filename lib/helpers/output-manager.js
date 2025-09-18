#!/usr/bin/env node
/**
 * Output Manager
 * Handles verbose/quiet output modes and formatting
 */

const chalk = require('chalk');

class OutputManager {
    constructor(options = {}) {
        this.mode = options.mode || process.env.OUTPUT_MODE || 'normal'; // quiet, normal, verbose, debug
        this.useColor = options.color !== false && process.stdout.isTTY;
        this.format = options.format || 'text'; // text, json, csv, table
        this.logFile = options.logFile;
        this.timestamps = options.timestamps || false;

        // Set up chalk
        if (!this.useColor) {
            chalk.level = 0;
        }

        // Output levels
        this.levels = {
            debug: 0,
            verbose: 1,
            normal: 2,
            quiet: 3,
            silent: 4
        };

        this.currentLevel = this.levels[this.mode] || 2;
    }

    /**
     * Set output mode
     */
    setMode(mode) {
        this.mode = mode;
        this.currentLevel = this.levels[mode] || 2;
    }

    /**
     * Check if should output at level
     */
    shouldOutput(level) {
        return this.currentLevel <= this.levels[level];
    }

    /**
     * Debug output (only in debug mode)
     */
    debug(...args) {
        if (this.shouldOutput('debug')) {
            const message = this.formatMessage('[DEBUG]', ...args);
            console.error(this.useColor ? chalk.gray(message) : message);
            this.log(message);
        }
    }

    /**
     * Verbose output (verbose and debug modes)
     */
    verbose(...args) {
        if (this.shouldOutput('verbose')) {
            const message = this.formatMessage('[VERBOSE]', ...args);
            console.log(this.useColor ? chalk.dim(message) : message);
            this.log(message);
        }
    }

    /**
     * Normal output (normal, verbose, and debug modes)
     */
    info(...args) {
        if (this.shouldOutput('normal')) {
            const message = this.formatMessage(...args);
            console.log(message);
            this.log(message);
        }
    }

    /**
     * Important output (all modes except silent)
     */
    important(...args) {
        if (this.mode !== 'silent') {
            const message = this.formatMessage(...args);
            console.log(this.useColor ? chalk.bold(message) : message);
            this.log(message);
        }
    }

    /**
     * Success message
     */
    success(...args) {
        if (this.shouldOutput('normal')) {
            const message = this.formatMessage('✅', ...args);
            console.log(this.useColor ? chalk.green(message) : message);
            this.log(message);
        }
    }

    /**
     * Warning message
     */
    warn(...args) {
        if (this.mode !== 'silent') {
            const message = this.formatMessage('⚠️', ...args);
            console.warn(this.useColor ? chalk.yellow(message) : message);
            this.log(message);
        }
    }

    /**
     * Error message
     */
    error(...args) {
        const message = this.formatMessage('❌', ...args);
        console.error(this.useColor ? chalk.red(message) : message);
        this.log(message);
    }

    /**
     * Format message with optional timestamp
     * @private
     */
    formatMessage(...args) {
        let message = args.join(' ');

        if (this.timestamps) {
            const timestamp = new Date().toISOString();
            message = `[${timestamp}] ${message}`;
        }

        return message;
    }

    /**
     * Log to file if configured
     * @private
     */
    log(message) {
        if (this.logFile) {
            const fs = require('fs');
            fs.appendFileSync(this.logFile, message + '\n');
        }
    }

    /**
     * Output data in specified format
     */
    output(data, options = {}) {
        const format = options.format || this.format;

        switch (format) {
            case 'json':
                this.outputJSON(data, options);
                break;
            case 'table':
                this.outputTable(data, options);
                break;
            case 'csv':
                this.outputCSV(data, options);
                break;
            default:
                this.outputText(data, options);
        }
    }

    /**
     * Output as JSON
     */
    outputJSON(data, options = {}) {
        const pretty = options.pretty !== false;
        const output = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
        console.log(output);
    }

    /**
     * Output as table
     */
    outputTable(data, options = {}) {
        if (!Array.isArray(data) || data.length === 0) {
            console.log('No data to display');
            return;
        }

        const headers = options.headers || Object.keys(data[0]);
        const columnWidths = this.calculateColumnWidths(data, headers);

        // Print header
        this.printTableRow(headers, columnWidths, true);
        this.printTableSeparator(columnWidths);

        // Print data rows
        for (const row of data) {
            const values = headers.map(h => row[h]);
            this.printTableRow(values, columnWidths);
        }
    }

    /**
     * Output as CSV
     */
    outputCSV(data, options = {}) {
        if (!Array.isArray(data) || data.length === 0) {
            return;
        }

        const headers = options.headers || Object.keys(data[0]);
        console.log(headers.join(','));

        for (const row of data) {
            const values = headers.map(h => {
                const value = row[h];
                // Escape values containing commas or quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            console.log(values.join(','));
        }
    }

    /**
     * Output as text
     */
    outputText(data, options = {}) {
        if (typeof data === 'string') {
            console.log(data);
        } else if (Array.isArray(data)) {
            data.forEach(item => console.log(item));
        } else {
            console.log(JSON.stringify(data, null, 2));
        }
    }

    /**
     * Calculate column widths for table
     * @private
     */
    calculateColumnWidths(data, headers) {
        const widths = {};

        for (const header of headers) {
            widths[header] = header.length;

            for (const row of data) {
                const value = String(row[header] || '');
                widths[header] = Math.max(widths[header], value.length);
            }
        }

        return widths;
    }

    /**
     * Print table row
     * @private
     */
    printTableRow(values, widths, isHeader = false) {
        const cells = values.map((value, index) => {
            const width = widths[Object.keys(widths)[index]];
            const str = String(value || '').padEnd(width);
            return isHeader && this.useColor ? chalk.bold(str) : str;
        });

        console.log('| ' + cells.join(' | ') + ' |');
    }

    /**
     * Print table separator
     * @private
     */
    printTableSeparator(widths) {
        const separators = Object.values(widths).map(w => '-'.repeat(w));
        console.log('|-' + separators.join('-|-') + '-|');
    }

    /**
     * Create section header
     */
    section(title) {
        if (this.shouldOutput('normal')) {
            const line = '='.repeat(title.length + 4);
            console.log('\n' + (this.useColor ? chalk.cyan(line) : line));
            console.log((this.useColor ? chalk.cyan.bold(`  ${title}  `) : `  ${title}  `));
            console.log((this.useColor ? chalk.cyan(line) : line) + '\n');
        }
    }

    /**
     * Create subsection header
     */
    subsection(title) {
        if (this.shouldOutput('normal')) {
            console.log('\n' + (this.useColor ? chalk.blue.bold(title) : title));
            console.log((this.useColor ? chalk.blue('-'.repeat(title.length)) : '-'.repeat(title.length)));
        }
    }

    /**
     * Print list items
     */
    list(items, options = {}) {
        if (!this.shouldOutput('normal')) return;

        const bullet = options.bullet || '•';
        const indent = options.indent || 2;

        for (const item of items) {
            const padding = ' '.repeat(indent);
            console.log(`${padding}${bullet} ${item}`);
        }
    }

    /**
     * Print key-value pairs
     */
    keyValue(pairs, options = {}) {
        if (!this.shouldOutput('normal')) return;

        const maxKeyLength = Math.max(...Object.keys(pairs).map(k => k.length));

        for (const [key, value] of Object.entries(pairs)) {
            const paddedKey = key.padEnd(maxKeyLength);
            const formattedKey = this.useColor ? chalk.gray(paddedKey + ':') : paddedKey + ':';
            console.log(`  ${formattedKey} ${value}`);
        }
    }
}

module.exports = OutputManager;