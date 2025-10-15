/**
 * @license
 * Copyright 2025 Rafeek Pro
 * SPDX-License-Identifier: MIT
 */

import { z } from 'zod';

/**
 * Common Validation Utilities
 *
 * Provides reusable validation schemas and helpers for PM operations:
 * - Epic/Task naming validation
 * - Status validation
 * - Timestamp validation
 * - Input sanitization
 *
 * Uses Zod for:
 * - Type-safe validation
 * - Clear error messages
 * - Composable schemas
 *
 * Context7 Best Practices Applied:
 * - Custom error messages for better UX
 * - safeParse() for graceful error handling
 * - Schema composition for reusability
 */

/**
 * Epic/Task name validation schema
 * Rules:
 * - Lowercase alphanumeric with hyphens
 * - 3-50 characters
 * - Cannot start or end with hyphen
 */
export const EpicNameSchema = z
  .string()
  .min(3, 'Epic name must be at least 3 characters')
  .max(50, 'Epic name must be at most 50 characters')
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    'Epic name must be lowercase alphanumeric with hyphens (e.g., user-authentication)'
  );

/**
 * Task number validation schema
 * Format: 001, 002, ..., 999
 */
export const TaskNumberSchema = z
  .string()
  .regex(/^\d{3}$/, 'Task number must be 3 digits (e.g., 001, 002)');

/**
 * Status validation schema
 */
export const StatusSchema = z.enum(['open', 'in-progress', 'completed', 'blocked']);

/**
 * ISO 8601 timestamp validation
 */
export const TimestampSchema = z
  .string()
  .datetime({ message: 'Must be valid ISO 8601 timestamp' });

/**
 * Progress percentage validation
 */
export const ProgressSchema = z
  .number()
  .min(0, 'Progress must be at least 0')
  .max(100, 'Progress must be at most 100');

/**
 * Effort estimation validation
 */
export const EffortSchema = z.enum(['xs', 's', 'm', 'l', 'xl'], {
  errorMap: () => ({ message: 'Effort must be one of: xs, s, m, l, xl' }),
});

/**
 * Validate epic name
 *
 * @param name - Epic name to validate
 * @returns Validation result
 */
export function validateEpicName(name: string): {
  valid: boolean;
  error?: string;
} {
  const result = EpicNameSchema.safeParse(name);

  if (result.success) {
    return { valid: true };
  }

  return {
    valid: false,
    error: result.error.errors[0]?.message || 'Invalid epic name',
  };
}

/**
 * Validate task number
 *
 * @param taskNumber - Task number to validate
 * @returns Validation result
 */
export function validateTaskNumber(taskNumber: string): {
  valid: boolean;
  error?: string;
} {
  const result = TaskNumberSchema.safeParse(taskNumber);

  if (result.success) {
    return { valid: true };
  }

  return {
    valid: false,
    error: result.error.errors[0]?.message || 'Invalid task number',
  };
}

/**
 * Validate status value
 *
 * @param status - Status to validate
 * @returns Validation result
 */
export function validateStatus(status: string): {
  valid: boolean;
  error?: string;
} {
  const result = StatusSchema.safeParse(status);

  if (result.success) {
    return { valid: true };
  }

  return {
    valid: false,
    error: 'Status must be one of: open, in-progress, completed, blocked',
  };
}

/**
 * Sanitize epic name
 * Converts to valid format: lowercase, hyphens, alphanumeric
 *
 * @param name - Raw epic name
 * @returns Sanitized epic name
 */
export function sanitizeEpicName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-\s]/g, '') // Remove invalid characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate task number
 * Formats number as 3-digit string
 *
 * @param taskIndex - Task index (0-based)
 * @returns Formatted task number (e.g., "001")
 */
export function generateTaskNumber(taskIndex: number): string {
  return String(taskIndex + 1).padStart(3, '0');
}

/**
 * Parse task number to index
 *
 * @param taskNumber - Task number (e.g., "001")
 * @returns Task index (0-based)
 */
export function parseTaskNumber(taskNumber: string): number {
  return parseInt(taskNumber, 10) - 1;
}

/**
 * Validate progress value
 *
 * @param progress - Progress percentage
 * @returns Validation result
 */
export function validateProgress(progress: number): {
  valid: boolean;
  error?: string;
} {
  const result = ProgressSchema.safeParse(progress);

  if (result.success) {
    return { valid: true };
  }

  return {
    valid: false,
    error: result.error.errors[0]?.message || 'Invalid progress value',
  };
}

/**
 * Calculate epic progress from task statuses
 *
 * @param totalTasks - Total number of tasks
 * @param completedTasks - Number of completed tasks
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(
  totalTasks: number,
  completedTasks: number
): number {
  if (totalTasks === 0) {
    return 0;
  }

  return Math.round((completedTasks / totalTasks) * 100);
}

/**
 * Validate ISO 8601 timestamp
 *
 * @param timestamp - Timestamp string
 * @returns Validation result
 */
export function validateTimestamp(timestamp: string): {
  valid: boolean;
  error?: string;
} {
  const result = TimestampSchema.safeParse(timestamp);

  if (result.success) {
    return { valid: true };
  }

  return {
    valid: false,
    error: result.error.errors[0]?.message || 'Invalid timestamp',
  };
}

/**
 * Validate effort estimation
 *
 * @param effort - Effort estimation
 * @returns Validation result
 */
export function validateEffort(effort: string): {
  valid: boolean;
  error?: string;
} {
  const result = EffortSchema.safeParse(effort);

  if (result.success) {
    return { valid: true };
  }

  return {
    valid: false,
    error: result.error.errors[0]?.message || 'Invalid effort estimation',
  };
}

/**
 * Validate array of task dependencies
 *
 * @param dependencies - Array of task numbers
 * @returns Validation result
 */
export function validateDependencies(dependencies: string[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const dep of dependencies) {
    const result = validateTaskNumber(dep);
    if (!result.valid) {
      errors.push(`Invalid dependency '${dep}': ${result.error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check for circular dependencies
 *
 * @param taskNumber - Current task number
 * @param dependencies - Task dependencies
 * @param allTasks - Map of task number to dependencies
 * @returns True if circular dependency detected
 */
export function hasCircularDependency(
  taskNumber: string,
  dependencies: string[],
  allTasks: Map<string, string[]>
): boolean {
  const visited = new Set<string>();

  function checkCircular(current: string): boolean {
    if (current === taskNumber) {
      return true; // Found cycle back to original task
    }

    if (visited.has(current)) {
      return false; // Already visited, no cycle in this path
    }

    visited.add(current);

    const deps = allTasks.get(current) || [];
    for (const dep of deps) {
      if (checkCircular(dep)) {
        return true;
      }
    }

    return false;
  }

  for (const dep of dependencies) {
    visited.clear();
    if (checkCircular(dep)) {
      return true;
    }
  }

  return false;
}

/**
 * Validate task conflicts
 * Ensures tasks don't conflict with their dependencies
 *
 * @param dependencies - Task dependencies
 * @param conflicts - Task conflicts
 * @returns Validation result
 */
export function validateConflicts(
  dependencies: string[],
  conflicts: string[]
): {
  valid: boolean;
  error?: string;
} {
  const depSet = new Set(dependencies);
  const conflictSet = new Set(conflicts);

  // Check for overlap between dependencies and conflicts
  for (const dep of depSet) {
    if (conflictSet.has(dep)) {
      return {
        valid: false,
        error: `Task ${dep} cannot be both a dependency and a conflict`,
      };
    }
  }

  return { valid: true };
}

/**
 * Format validation errors as user-friendly message
 *
 * @param error - Zod error
 * @returns Formatted error message
 */
export function formatValidationError(error: z.ZodError): string {
  const issues = error.errors.map(err => {
    const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
    return `${path}${err.message}`;
  });

  return issues.join('\n');
}

/**
 * Create validation error message
 *
 * @param field - Field name
 * @param message - Error message
 * @returns Formatted error
 */
export function createValidationError(field: string, message: string): string {
  return `Validation error for '${field}': ${message}`;
}
