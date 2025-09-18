#!/usr/bin/env node
/**
 * Azure DevOps Batch API Helper
 * Optimizes API calls by batching multiple requests
 */

const https = require('https');

class AzureBatchAPI {
    constructor(org, project, pat) {
        this.org = org;
        this.project = project;
        this.pat = pat;
        this.baseUrl = `dev.azure.com/${org}/${project}/_apis`;
        this.batchSize = 200; // Azure DevOps batch limit
    }

    /**
     * Execute batch API requests
     * @param {Array} requests - Array of request objects
     * @returns {Promise<Array>} Array of responses
     */
    async executeBatch(requests) {
        if (!requests || requests.length === 0) {
            return [];
        }

        // Split into chunks if needed
        const chunks = this.chunkRequests(requests, this.batchSize);
        const results = [];

        for (const chunk of chunks) {
            const batchResults = await this.executeBatchChunk(chunk);
            results.push(...batchResults);
        }

        return results;
    }

    /**
     * Execute a single batch chunk
     * @private
     */
    async executeBatchChunk(requests) {
        const batchRequest = {
            requests: requests.map((req, index) => ({
                id: index.toString(),
                method: req.method || 'GET',
                url: `/${this.baseUrl}/${req.endpoint}?api-version=7.0`,
                headers: req.headers || {},
                body: req.body
            }))
        };

        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'dev.azure.com',
                path: `/${this.org}/_apis/$batch?api-version=7.0`,
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`:${this.pat}`).toString('base64')}`,
                    'Content-Type': 'application/json'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const batchResponse = JSON.parse(data);
                        const results = batchResponse.responses.map(r => {
                            try {
                                return JSON.parse(r.body);
                            } catch {
                                return r.body;
                            }
                        });
                        resolve(results);
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            req.on('error', reject);
            req.write(JSON.stringify(batchRequest));
            req.end();
        });
    }

    /**
     * Chunk requests into batches
     * @private
     */
    chunkRequests(requests, size) {
        const chunks = [];
        for (let i = 0; i < requests.length; i += size) {
            chunks.push(requests.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * Batch fetch work items
     */
    async batchFetchWorkItems(ids) {
        const requests = ids.map(id => ({
            endpoint: `wit/workitems/${id}`,
            method: 'GET'
        }));

        return this.executeBatch(requests);
    }

    /**
     * Batch update work items
     */
    async batchUpdateWorkItems(updates) {
        const requests = updates.map(update => ({
            endpoint: `wit/workitems/${update.id}`,
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json-patch+json'
            },
            body: update.operations
        }));

        return this.executeBatch(requests);
    }
}

module.exports = AzureBatchAPI;