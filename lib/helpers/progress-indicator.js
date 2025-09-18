#!/usr/bin/env node
/**
 * Progress Indicator Helper
 * Provides various progress indicators for long operations
 */

const readline = require('readline');

class ProgressIndicator {
    constructor(options = {}) {
        this.total = options.total || 0;
        this.current = 0;
        this.startTime = Date.now();
        this.lastUpdate = 0;
        this.updateInterval = options.updateInterval || 100; // ms
        this.width = options.width || 40;
        this.showETA = options.showETA !== false;
        this.showSpeed = options.showSpeed !== false;
        this.style = options.style || 'bar'; // bar, dots, spinner
        this.message = options.message || 'Processing';
        this.spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        this.spinnerIndex = 0;
    }

    /**
     * Start progress tracking
     */
    start(message) {
        if (message) this.message = message;
        this.startTime = Date.now();
        this.current = 0;
        this.lastUpdate = 0;

        if (this.style === 'spinner') {
            this.startSpinner();
        }
    }

    /**
     * Update progress
     */
    update(current, message) {
        if (current !== undefined) this.current = current;
        if (message) this.message = message;

        const now = Date.now();
        if (now - this.lastUpdate < this.updateInterval) {
            return;
        }

        this.lastUpdate = now;

        switch (this.style) {
            case 'bar':
                this.renderBar();
                break;
            case 'dots':
                this.renderDots();
                break;
            case 'spinner':
                this.renderSpinner();
                break;
            case 'percentage':
                this.renderPercentage();
                break;
        }
    }

    /**
     * Increment progress by 1
     */
    increment(message) {
        this.current++;
        this.update(this.current, message);
    }

    /**
     * Complete progress
     */
    complete(message) {
        this.current = this.total;
        this.update(this.current, message || 'Complete');
        process.stdout.write('\n');

        if (this.spinnerInterval) {
            clearInterval(this.spinnerInterval);
            this.spinnerInterval = null;
        }
    }

    /**
     * Render progress bar
     * @private
     */
    renderBar() {
        const percent = this.total > 0 ? this.current / this.total : 0;
        const filled = Math.round(percent * this.width);
        const empty = this.width - filled;

        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        const percentStr = `${Math.round(percent * 100)}%`;

        let output = `\r${this.message}: ${bar} ${percentStr}`;

        if (this.total > 0) {
            output += ` (${this.current}/${this.total})`;
        }

        if (this.showETA && this.total > 0 && this.current > 0) {
            const eta = this.calculateETA();
            output += ` ETA: ${eta}`;
        }

        if (this.showSpeed && this.current > 0) {
            const speed = this.calculateSpeed();
            output += ` ${speed}/s`;
        }

        process.stdout.write(output);
    }

    /**
     * Render dots progress
     * @private
     */
    renderDots() {
        const dots = '.'.repeat((this.current % 4) + 1).padEnd(4);
        const percent = this.total > 0 ? Math.round((this.current / this.total) * 100) : 0;

        let output = `\r${this.message}${dots}`;

        if (this.total > 0) {
            output += ` ${percent}% (${this.current}/${this.total})`;
        }

        process.stdout.write(output.padEnd(80));
    }

    /**
     * Render spinner
     * @private
     */
    renderSpinner() {
        const frame = this.spinnerFrames[this.spinnerIndex];
        let output = `\r${frame} ${this.message}`;

        if (this.total > 0 && this.current > 0) {
            const percent = Math.round((this.current / this.total) * 100);
            output += ` ${percent}% (${this.current}/${this.total})`;
        }

        process.stdout.write(output.padEnd(80));
    }

    /**
     * Render percentage only
     * @private
     */
    renderPercentage() {
        const percent = this.total > 0 ? Math.round((this.current / this.total) * 100) : 0;
        const output = `\r${this.message}: ${percent}% (${this.current}/${this.total})`;
        process.stdout.write(output.padEnd(80));
    }

    /**
     * Start spinner animation
     * @private
     */
    startSpinner() {
        this.spinnerInterval = setInterval(() => {
            this.spinnerIndex = (this.spinnerIndex + 1) % this.spinnerFrames.length;
            this.renderSpinner();
        }, 80);
    }

    /**
     * Calculate ETA
     * @private
     */
    calculateETA() {
        const elapsed = Date.now() - this.startTime;
        const rate = this.current / elapsed;
        const remaining = this.total - this.current;
        const eta = remaining / rate;

        return this.formatTime(eta);
    }

    /**
     * Calculate processing speed
     * @private
     */
    calculateSpeed() {
        const elapsed = (Date.now() - this.startTime) / 1000; // seconds
        const speed = this.current / elapsed;

        if (speed > 1000) {
            return `${(speed / 1000).toFixed(1)}k`;
        }
        return speed.toFixed(1);
    }

    /**
     * Format time duration
     * @private
     */
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        return `${seconds}s`;
    }

    /**
     * Create a simple progress callback
     */
    static create(total, message = 'Processing') {
        const progress = new ProgressIndicator({ total, message });
        progress.start();

        return {
            update: (current, msg) => progress.update(current, msg),
            increment: (msg) => progress.increment(msg),
            complete: (msg) => progress.complete(msg)
        };
    }

    /**
     * Wrap an async function with progress tracking
     */
    static async withProgress(items, processor, message = 'Processing items') {
        const progress = new ProgressIndicator({
            total: items.length,
            message,
            style: 'bar'
        });

        progress.start();

        const results = [];
        for (let i = 0; i < items.length; i++) {
            results.push(await processor(items[i], i));
            progress.increment();
        }

        progress.complete();
        return results;
    }
}

module.exports = ProgressIndicator;