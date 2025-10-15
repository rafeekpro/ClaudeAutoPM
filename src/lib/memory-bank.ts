/**
 * @license
 * Copyright 2025 Rafeek Pro
 * SPDX-License-Identifier: MIT
 */

import * as path from 'path';
import { readFile, writeFile, pathExists, getClaudeDir } from './file-ops.js';

/**
 * Memory Bank Utility
 *
 * Implements the Memory Bank pattern from Agentic PM Framework:
 * - Shared context logging across all PM operations
 * - Audit trail of all epic/task/PRD operations
 * - Context preservation for multi-agent workflows
 *
 * Memory Bank Structure:
 * .claude/memory_bank.md - Main memory log file
 *
 * Log Format:
 * ## [Timestamp] Operation: operation_name
 * Details: ...
 * Context: ...
 *
 * Best Practices:
 * - Append-only logging (preserve history)
 * - Timestamp all entries
 * - Include operation context and results
 * - Enable cross-tool context sharing
 */

/**
 * Memory Bank entry types
 */
export enum MemoryBankOperation {
  // Initialization
  PM_INIT = 'pm_init',

  // PRD Operations
  PRD_NEW = 'prd_new',
  PRD_PARSE = 'prd_parse',
  PRD_EDIT = 'prd_edit',
  PRD_DELETE = 'prd_delete',

  // Epic Operations
  EPIC_CREATE = 'epic_create',
  EPIC_DECOMPOSE = 'epic_decompose',
  EPIC_START = 'epic_start',
  EPIC_CLOSE = 'epic_close',
  EPIC_EDIT = 'epic_edit',
  EPIC_SYNC = 'epic_sync',
  EPIC_DELETE = 'epic_delete',

  // Task Operations
  TASK_CREATE = 'task_create',
  TASK_START = 'task_start',
  TASK_COMPLETE = 'task_complete',
  TASK_BLOCK = 'task_block',
  TASK_EDIT = 'task_edit',

  // Workflow Operations
  STATUS_CHECK = 'status_check',
  VALIDATION = 'validation',
  ERROR = 'error',
}

/**
 * Memory Bank entry interface
 */
export interface MemoryBankEntry {
  timestamp: string; // ISO 8601
  operation: MemoryBankOperation | string;
  details: string;
  context?: Record<string, any>;
  success: boolean;
  error?: string;
}

/**
 * Get Memory Bank file path
 */
export function getMemoryBankPath(workingDir: string = process.cwd()): string {
  return path.join(getClaudeDir(workingDir), 'memory_bank.md');
}

/**
 * Initialize Memory Bank file
 * Creates memory_bank.md with header
 */
export async function initMemoryBank(workingDir: string = process.cwd()): Promise<void> {
  const memoryBankPath = getMemoryBankPath(workingDir);

  if (await pathExists(memoryBankPath)) {
    return; // Already initialized
  }

  const header = `# Memory Bank

**Purpose**: Shared context and audit trail for Project Management operations

**Format**: Chronological log of all PM operations (PRD, Epic, Task management)

**Usage**: Agents query this log to understand project history and context

---

`;

  await writeFile(memoryBankPath, header);
}

/**
 * Log entry to Memory Bank
 *
 * @param entry - Memory Bank entry to log
 * @param workingDir - Working directory (defaults to cwd)
 */
export async function logToMemoryBank(
  entry: MemoryBankEntry,
  workingDir: string = process.cwd()
): Promise<void> {
  const memoryBankPath = getMemoryBankPath(workingDir);

  // Ensure Memory Bank exists
  if (!(await pathExists(memoryBankPath))) {
    await initMemoryBank(workingDir);
  }

  // Format entry as markdown
  const entryMarkdown = formatMemoryBankEntry(entry);

  // Read existing content
  const existingContent = await readFile(memoryBankPath);

  // Append new entry
  const updatedContent = existingContent + '\n' + entryMarkdown;

  // Write back
  await writeFile(memoryBankPath, updatedContent);
}

/**
 * Format Memory Bank entry as markdown
 */
function formatMemoryBankEntry(entry: MemoryBankEntry): string {
  const timestamp = entry.timestamp;
  const status = entry.success ? '✅' : '❌';

  let markdown = `## [${timestamp}] ${status} Operation: ${entry.operation}\n\n`;
  markdown += `**Details**: ${entry.details}\n\n`;

  if (entry.context && Object.keys(entry.context).length > 0) {
    markdown += `**Context**:\n`;
    for (const [key, value] of Object.entries(entry.context)) {
      markdown += `- ${key}: ${JSON.stringify(value)}\n`;
    }
    markdown += '\n';
  }

  if (entry.error) {
    markdown += `**Error**: ${entry.error}\n\n`;
  }

  markdown += '---\n';

  return markdown;
}

/**
 * Create Memory Bank entry helper
 */
export function createMemoryEntry(
  operation: MemoryBankOperation | string,
  details: string,
  context?: Record<string, any>,
  success: boolean = true,
  error?: string
): MemoryBankEntry {
  return {
    timestamp: new Date().toISOString(),
    operation,
    details,
    context,
    success,
    error,
  };
}

/**
 * Log successful operation
 */
export async function logSuccess(
  operation: MemoryBankOperation | string,
  details: string,
  context?: Record<string, any>,
  workingDir: string = process.cwd()
): Promise<void> {
  const entry = createMemoryEntry(operation, details, context, true);
  await logToMemoryBank(entry, workingDir);
}

/**
 * Log failed operation
 */
export async function logError(
  operation: MemoryBankOperation | string,
  details: string,
  error: string,
  context?: Record<string, any>,
  workingDir: string = process.cwd()
): Promise<void> {
  const entry = createMemoryEntry(operation, details, context, false, error);
  await logToMemoryBank(entry, workingDir);
}

/**
 * Read recent Memory Bank entries
 *
 * @param limit - Maximum number of entries to return
 * @param workingDir - Working directory
 * @returns Recent entries (newest first)
 */
export async function readRecentEntries(
  limit: number = 10,
  workingDir: string = process.cwd()
): Promise<string[]> {
  const memoryBankPath = getMemoryBankPath(workingDir);

  if (!(await pathExists(memoryBankPath))) {
    return [];
  }

  const content = await readFile(memoryBankPath);

  // Split by entry separator (---)
  const entries = content.split('---').filter(e => e.trim().length > 0);

  // Remove header (first entry)
  const logEntries = entries.slice(1);

  // Return most recent entries (reversed and limited)
  return logEntries.reverse().slice(0, limit);
}

/**
 * Search Memory Bank for specific operation
 *
 * @param operation - Operation type to search for
 * @param workingDir - Working directory
 * @returns Matching entries
 */
export async function searchMemoryBank(
  operation: MemoryBankOperation | string,
  workingDir: string = process.cwd()
): Promise<string[]> {
  const memoryBankPath = getMemoryBankPath(workingDir);

  if (!(await pathExists(memoryBankPath))) {
    return [];
  }

  const content = await readFile(memoryBankPath);

  // Split by entry separator
  const entries = content.split('---').filter(e => e.trim().length > 0);

  // Filter entries matching operation
  return entries.filter(entry => entry.includes(`Operation: ${operation}`));
}

/**
 * Get Memory Bank statistics
 */
export async function getMemoryBankStats(
  workingDir: string = process.cwd()
): Promise<{
  totalEntries: number;
  successfulOperations: number;
  failedOperations: number;
  recentOperations: string[];
}> {
  const memoryBankPath = getMemoryBankPath(workingDir);

  if (!(await pathExists(memoryBankPath))) {
    return {
      totalEntries: 0,
      successfulOperations: 0,
      failedOperations: 0,
      recentOperations: [],
    };
  }

  const content = await readFile(memoryBankPath);

  // Count entries
  const entries = content.split('---').filter(e => e.trim().length > 0);
  const totalEntries = Math.max(0, entries.length - 1); // Exclude header

  // Count successful/failed
  const successfulOperations = (content.match(/✅ Operation:/g) || []).length;
  const failedOperations = (content.match(/❌ Operation:/g) || []).length;

  // Get recent operations
  const recentEntries = await readRecentEntries(5, workingDir);
  const recentOperations = recentEntries.map(entry => {
    const match = entry.match(/Operation: ([^\n]+)/);
    return match ? match[1] : 'Unknown';
  });

  return {
    totalEntries,
    successfulOperations,
    failedOperations,
    recentOperations,
  };
}

/**
 * Clear Memory Bank (use with caution)
 * Reinitializes with header only
 */
export async function clearMemoryBank(workingDir: string = process.cwd()): Promise<void> {
  const memoryBankPath = getMemoryBankPath(workingDir);

  // Remove existing file
  const fs = await import('fs-extra');
  await fs.remove(memoryBankPath);

  // Reinitialize
  await initMemoryBank(workingDir);
}
