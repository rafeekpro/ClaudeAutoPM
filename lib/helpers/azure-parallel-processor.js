#!/usr/bin/env node
/**
 * Azure DevOps Parallel Processor
 * Enables parallel processing of work items and API calls
 */

const { Worker } = require('worker_threads');
const os = require('os');

class ParallelProcessor {
    constructor(options = {}) {
        this.maxWorkers = options.maxWorkers || os.cpus().length;
        this.taskQueue = [];
        this.activeWorkers = 0;
    }

    /**
     * Process items in parallel
     * @param {Array} items - Items to process
     * @param {Function} processor - Processing function
     * @param {Object} options - Processing options
     * @returns {Promise<Array>} Processed results
     */
    async processParallel(items, processor, options = {}) {
        const chunkSize = Math.ceil(items.length / this.maxWorkers);
        const chunks = this.chunkArray(items, chunkSize);

        const promises = chunks.map(chunk =>
            this.processChunk(chunk, processor, options)
        );

        const results = await Promise.all(promises);
        return results.flat();
    }

    /**
     * Process a chunk of items
     * @private
     */
    async processChunk(chunk, processor, options) {
        const results = [];

        // Use Promise.all for concurrent processing within chunk
        const promises = chunk.map(item =>
            this.wrapWithTimeout(
                processor(item, options),
                options.timeout || 30000
            )
        );

        try {
            const chunkResults = await Promise.allSettled(promises);

            for (const result of chunkResults) {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    console.error(`Processing failed: ${result.reason}`);
                    results.push(null);
                }
            }
        } catch (error) {
            console.error(`Chunk processing error: ${error.message}`);
        }

        return results;
    }

    /**
     * Wrap promise with timeout
     * @private
     */
    wrapWithTimeout(promise, timeout) {
        return Promise.race([
            promise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Operation timed out')), timeout)
            )
        ]);
    }

    /**
     * Chunk array into smaller arrays
     * @private
     */
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * Process WIQL queries in parallel
     */
    async parallelWiqlQueries(queries, apiClient) {
        return this.processParallel(
            queries,
            async (query) => {
                try {
                    return await apiClient.queryByWiql(query);
                } catch (error) {
                    console.error(`Query failed: ${error.message}`);
                    return null;
                }
            },
            { timeout: 10000 }
        );
    }

    /**
     * Fetch work items in parallel
     */
    async parallelFetchWorkItems(ids, apiClient, options = {}) {
        const showProgress = options.showProgress !== false;
        let processed = 0;

        return this.processParallel(
            ids,
            async (id) => {
                try {
                    const result = await apiClient.getWorkItem(id);

                    if (showProgress) {
                        processed++;
                        this.updateProgress(processed, ids.length);
                    }

                    return result;
                } catch (error) {
                    console.error(`Failed to fetch work item ${id}: ${error.message}`);
                    return null;
                }
            },
            { timeout: 5000 }
        );
    }

    /**
     * Update progress indicator
     * @private
     */
    updateProgress(current, total) {
        const percent = Math.round((current / total) * 100);
        const barLength = 30;
        const filled = Math.round((percent / 100) * barLength);
        const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

        process.stdout.write(`\rProgress: ${bar} ${percent}% (${current}/${total})`);

        if (current === total) {
            process.stdout.write('\n');
        }
    }
}

module.exports = ParallelProcessor;