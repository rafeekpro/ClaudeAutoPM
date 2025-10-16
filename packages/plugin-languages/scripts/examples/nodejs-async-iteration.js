#!/usr/bin/env node
/**
 * Node.js Async Iteration Patterns - Context7 Best Practices
 *
 * Demonstrates modern Node.js async patterns:
 * - for await...of with Symbol.asyncIterator
 * - AbortSignal for cancellation
 * - Mixed approach (event + await) for performance
 * - Stream processing with async iterators
 *
 * Source: /nodejs/node (8,761 snippets, trust 9.1)
 */

import { createReadStream } from 'node:fs';
import { writeFile, readFile } from 'node:fs/promises';
import * as readline from 'node:readline';
import { once, on } from 'node:events';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';

// Context7 Pattern 1: for await...of with Symbol.asyncIterator
async function processLineByLine(filePath) {
  console.log('Pattern 1: Async Line-by-Line Processing');

  const rl = readline.createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity,
  });

  // ✅ CORRECT: Use for await...of for async iteration
  let lineCount = 0;
  for await (const line of rl) {
    // Each line is processed sequentially
    lineCount++;
    if (lineCount <= 3) {
      console.log(`  Line ${lineCount}: ${line.substring(0, 50)}...`);
    }
  }

  console.log(`  Total lines: ${lineCount}`);
}

// Context7 Pattern 2: Mixed Approach for Better Performance
async function processLinesMixed(filePath) {
  console.log('\nPattern 2: Mixed Approach (Event + Await)');

  const rl = readline.createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity,
  });

  let lineCount = 0;

  // ✅ CORRECT: Use event handler for better performance
  rl.on('line', (line) => {
    lineCount++;
    // Process line synchronously
  });

  // Wait for 'close' event
  await once(rl, 'close');

  console.log(`  Processed ${lineCount} lines (mixed approach)`);
}

// Context7 Pattern 3: AbortSignal for Cancellation
async function fetchWithTimeout(url, timeout = 5000) {
  console.log('\nPattern 3: AbortSignal for Request Cancellation');

  // ✅ CORRECT: Use AbortController for cancellation
  const controller = new AbortController();
  const { signal } = controller;

  const timeoutId = setTimeout(() => {
    console.log('  Aborting request due to timeout');
    controller.abort();
  }, timeout);

  try {
    // Simulate fetch with signal
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 1000);

      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new Error('Request aborted'));
      });
    });

    console.log(`  Request completed successfully`);
    return { status: 200, data: 'success' };
  } catch (error) {
    if (error.name === 'AbortError' || error.message === 'Request aborted') {
      console.log('  Request was cancelled');
      throw error;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Context7 Pattern 4: AbortSignal with Event Iteration
async function watchEventsWithCancellation(emitter, eventName, timeout = 5000) {
  console.log('\nPattern 4: Event Iteration with AbortSignal');

  const ac = new AbortController();
  const { signal } = ac;

  // Cancel after timeout
  setTimeout(() => {
    console.log('  Cancelling event watching');
    ac.abort();
  }, timeout);

  try {
    // ✅ CORRECT: Use AbortSignal with event iteration
    let eventCount = 0;
    for await (const event of on(emitter, eventName, { signal })) {
      eventCount++;
      console.log(`  Event ${eventCount}: ${JSON.stringify(event)}`);

      if (eventCount >= 3) {
        ac.abort();
        break;
      }
    }

    console.log(`  Processed ${eventCount} events`);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('  Event watching cancelled');
    } else {
      throw error;
    }
  }
}

// Context7 Pattern 5: Custom Async Iterator with Symbol.asyncIterator
class AsyncNumberGenerator {
  constructor(max = 10) {
    this.max = max;
  }

  // ✅ CORRECT: Implement Symbol.asyncIterator
  async *[Symbol.asyncIterator]() {
    for (let i = 1; i <= this.max; i++) {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      yield i;
    }
  }
}

async function useCustomAsyncIterator() {
  console.log('\nPattern 5: Custom Async Iterator');

  const generator = new AsyncNumberGenerator(5);

  let sum = 0;
  for await (const num of generator) {
    sum += num;
    console.log(`  Generated: ${num}, Sum: ${sum}`);
  }

  console.log(`  Final sum: ${sum}`);
}

// Context7 Pattern 6: Stream Processing with Async Iteration
async function processStream() {
  console.log('\nPattern 6: Stream Processing');

  // Create readable stream
  const readable = Readable.from(async function* () {
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      yield `chunk-${i}`;
    }
  }());

  // ✅ CORRECT: Process stream with for await...of
  let chunkCount = 0;
  for await (const chunk of readable) {
    chunkCount++;
    console.log(`  Chunk ${chunkCount}: ${chunk}`);
  }

  console.log(`  Processed ${chunkCount} chunks`);
}

// Real-World Example: Log File Processor
class LogProcessor {
  constructor(logFilePath) {
    this.logFilePath = logFilePath;
    this.stats = {
      totalLines: 0,
      errors: 0,
      warnings: 0,
      info: 0,
    };
  }

  async *processLogs() {
    const rl = readline.createInterface({
      input: createReadStream(this.logFilePath),
      crlfDelay: Infinity,
    });

    // ✅ Async iteration with Symbol.asyncIterator
    for await (const line of rl) {
      this.stats.totalLines++;

      const logEntry = this.parseLine(line);
      if (logEntry) {
        yield logEntry;
      }
    }
  }

  parseLine(line) {
    this.stats.totalLines++;

    if (line.includes('ERROR')) {
      this.stats.errors++;
      return { level: 'ERROR', line };
    } else if (line.includes('WARNING')) {
      this.stats.warnings++;
      return { level: 'WARNING', line };
    } else if (line.includes('INFO')) {
      this.stats.info++;
      return { level: 'INFO', line };
    }

    return null;
  }

  async analyzeWithTimeout(timeoutMs = 10000) {
    const ac = new AbortController();
    const { signal } = ac;

    // Set timeout
    const timeoutId = setTimeout(() => ac.abort(), timeoutMs);

    try {
      const results = [];

      // ✅ Use AbortSignal with async iteration
      for await (const entry of this.processLogs()) {
        if (signal.aborted) {
          break;
        }

        results.push(entry);

        if (results.length >= 10) {
          break; // Process only first 10 for demo
        }
      }

      clearTimeout(timeoutId);
      return { results, stats: this.stats };
    } catch (error) {
      clearTimeout(timeoutId);
      if (signal.aborted) {
        console.log('Analysis cancelled due to timeout');
      }
      throw error;
    }
  }
}

// Main Demo
async function main() {
  console.log('Node.js Async Iteration Patterns - Context7 Best Practices');
  console.log('='.repeat(60));

  // Create test file
  const testFile = '/tmp/test-nodejs-async.txt';
  await writeFile(testFile, `Line 1: INFO - Application started
Line 2: WARNING - High memory usage
Line 3: ERROR - Database connection failed
Line 4: INFO - Retrying connection
Line 5: INFO - Connection established
Line 6: WARNING - Slow query detected
Line 7: INFO - Processing request
Line 8: ERROR - Invalid input
Line 9: INFO - Request completed
Line 10: INFO - Application running`);

  try {
    // Pattern 1: Basic async iteration
    await processLineByLine(testFile);

    // Pattern 2: Mixed approach
    await processLinesMixed(testFile);

    // Pattern 3: AbortSignal for timeout
    await fetchWithTimeout('https://example.com/api', 5000);

    // Pattern 4: Event iteration with cancellation
    const emitter = new EventEmitter();
    const watchPromise = watchEventsWithCancellation(emitter, 'data', 2000);

    // Emit some events
    setTimeout(() => emitter.emit('data', { value: 1 }), 100);
    setTimeout(() => emitter.emit('data', { value: 2 }), 200);
    setTimeout(() => emitter.emit('data', { value: 3 }), 300);
    setTimeout(() => emitter.emit('data', { value: 4 }), 400);

    await watchPromise;

    // Pattern 5: Custom async iterator
    await useCustomAsyncIterator();

    // Pattern 6: Stream processing
    await processStream();

    // Real-world example
    console.log('\nReal-World Example: Log Processor');
    console.log('-'.repeat(60));
    const processor = new LogProcessor(testFile);
    const analysis = await processor.analyzeWithTimeout(5000);

    console.log('Analysis Results:');
    console.log(`  Total entries: ${analysis.results.length}`);
    console.log('Statistics:');
    console.log(`  Total lines: ${analysis.stats.totalLines}`);
    console.log(`  Errors: ${analysis.stats.errors}`);
    console.log(`  Warnings: ${analysis.stats.warnings}`);
    console.log(`  Info: ${analysis.stats.info}`);

  } catch (error) {
    console.error('Error in demo:', error);
  }

  console.log(`
Context7 Verified Best Practices Applied:
==========================================
1. ✅ for await...of for async iteration
2. ✅ Mixed approach (event + await once) for performance
3. ✅ AbortSignal for request cancellation
4. ✅ AbortSignal with event iteration (on + signal)
5. ✅ Symbol.asyncIterator for custom iterators
6. ✅ Stream processing with async iteration
7. ✅ Proper error handling and cleanup
8. ✅ Real-world log processing example

Source:
- /nodejs/node (8,761 snippets, trust 9.1)

Key Performance Benefits:
- Event handling faster than async iteration for simple tasks
- AbortSignal enables graceful cancellation
- Symbol.asyncIterator provides standard interface
- Streams enable memory-efficient processing
`);
}

// Run the demo
main().catch(console.error);
