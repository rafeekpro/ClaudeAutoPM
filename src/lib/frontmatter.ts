/**
 * @license
 * Copyright 2025 Rafeek Pro
 * SPDX-License-Identifier: MIT
 */

import * as matter from 'gray-matter';
import { z } from 'zod';

/**
 * Frontmatter Parsing and Modification Utility
 *
 * Handles YAML frontmatter in Epic and Task markdown files:
 * - Parse frontmatter and content
 * - Update frontmatter fields
 * - Validate frontmatter structure
 *
 * Uses gray-matter for:
 * - Robust YAML parsing
 * - Preserving content formatting
 * - Round-trip parsing/stringifying
 *
 * Context7 Best Practices Applied:
 * - matter() for parsing strings with frontmatter
 * - Accessing parsed data via .data and .content properties
 * - matter.stringify() for converting back to markdown
 */

/**
 * Epic frontmatter schema
 * Matches structure from PM_WORKFLOW_ANALYSIS.md
 */
export const EpicFrontmatterSchema = z.object({
  name: z.string(),
  status: z.enum(['open', 'in-progress', 'completed', 'blocked']),
  created: z.string(), // ISO 8601 timestamp
  updated: z.string(), // ISO 8601 timestamp
  progress: z.number().min(0).max(100),
  totalTasks: z.number().min(0).optional(),
  completedTasks: z.number().min(0).optional(),
});

export type EpicFrontmatter = z.infer<typeof EpicFrontmatterSchema>;

/**
 * Task frontmatter schema
 * Matches structure from PM_WORKFLOW_ANALYSIS.md
 */
export const TaskFrontmatterSchema = z.object({
  name: z.string(),
  status: z.enum(['open', 'in-progress', 'completed', 'blocked']),
  created: z.string(), // ISO 8601 timestamp
  updated: z.string(), // ISO 8601 timestamp
  depends_on: z.array(z.string()).optional().default([]),
  parallel: z.boolean().optional().default(true),
  conflicts_with: z.array(z.string()).optional().default([]),
  assignee: z.string().optional(),
  effort: z.enum(['xs', 's', 'm', 'l', 'xl']).optional(),
});

export type TaskFrontmatter = z.infer<typeof TaskFrontmatterSchema>;

/**
 * PRD frontmatter schema
 */
export const PrdFrontmatterSchema = z.object({
  name: z.string(),
  created: z.string(), // ISO 8601 timestamp
  updated: z.string(), // ISO 8601 timestamp
  status: z.enum(['draft', 'review', 'approved', 'implemented']),
  author: z.string().optional(),
  version: z.string().optional(),
});

export type PrdFrontmatter = z.infer<typeof PrdFrontmatterSchema>;

/**
 * Generic parsed frontmatter result
 */
export interface ParsedFrontmatter<T = any> {
  data: T;
  content: string;
  isEmpty: boolean;
}

/**
 * Parse frontmatter from markdown string
 * Best Practice: Uses matter() which handles YAML parsing robustly
 *
 * @param markdown - Markdown string with frontmatter
 * @returns Parsed frontmatter data and content
 */
export function parseFrontmatter<T = any>(markdown: string): ParsedFrontmatter<T> {
  const parsed = matter(markdown);

  return {
    data: parsed.data as T,
    content: parsed.content,
    isEmpty: parsed.isEmpty,
  };
}

/**
 * Parse and validate epic frontmatter
 *
 * @param markdown - Epic markdown content
 * @returns Validated epic frontmatter and content
 * @throws ZodError if frontmatter is invalid
 */
export function parseEpicFrontmatter(markdown: string): ParsedFrontmatter<EpicFrontmatter> {
  const parsed = parseFrontmatter<EpicFrontmatter>(markdown);

  // Validate frontmatter structure
  const validated = EpicFrontmatterSchema.parse(parsed.data);

  return {
    data: validated,
    content: parsed.content,
    isEmpty: parsed.isEmpty,
  };
}

/**
 * Parse and validate task frontmatter
 *
 * @param markdown - Task markdown content
 * @returns Validated task frontmatter and content
 * @throws ZodError if frontmatter is invalid
 */
export function parseTaskFrontmatter(markdown: string): ParsedFrontmatter<TaskFrontmatter> {
  const parsed = parseFrontmatter<TaskFrontmatter>(markdown);

  // Validate frontmatter structure
  const validated = TaskFrontmatterSchema.parse(parsed.data);

  return {
    data: validated,
    content: parsed.content,
    isEmpty: parsed.isEmpty,
  };
}

/**
 * Parse and validate PRD frontmatter
 *
 * @param markdown - PRD markdown content
 * @returns Validated PRD frontmatter and content
 * @throws ZodError if frontmatter is invalid
 */
export function parsePrdFrontmatter(markdown: string): ParsedFrontmatter<PrdFrontmatter> {
  const parsed = parseFrontmatter<PrdFrontmatter>(markdown);

  // Validate frontmatter structure
  const validated = PrdFrontmatterSchema.parse(parsed.data);

  return {
    data: validated,
    content: parsed.content,
    isEmpty: parsed.isEmpty,
  };
}

/**
 * Stringify frontmatter and content back to markdown
 * Best Practice: Uses matter.stringify() for round-trip conversion
 *
 * @param data - Frontmatter data object
 * @param content - Markdown content
 * @returns Markdown string with frontmatter
 */
export function stringifyFrontmatter<T = any>(data: T, content: string): string {
  return matter.stringify(content, data);
}

/**
 * Update frontmatter fields in markdown
 * Preserves existing fields and content
 *
 * @param markdown - Original markdown string
 * @param updates - Partial frontmatter updates
 * @returns Updated markdown string
 */
export function updateFrontmatter<T = any>(markdown: string, updates: Partial<T>): string {
  const parsed = parseFrontmatter<T>(markdown);

  // Merge updates with existing data
  const updatedData = {
    ...parsed.data,
    ...updates,
  };

  // Stringify back to markdown
  return stringifyFrontmatter(updatedData, parsed.content);
}

/**
 * Update epic frontmatter with validation
 *
 * @param markdown - Original epic markdown
 * @param updates - Partial epic frontmatter updates
 * @returns Updated and validated epic markdown
 * @throws ZodError if resulting frontmatter is invalid
 */
export function updateEpicFrontmatter(
  markdown: string,
  updates: Partial<EpicFrontmatter>
): string {
  const parsed = parseEpicFrontmatter(markdown);

  // Merge updates with existing data
  const updatedData = {
    ...parsed.data,
    ...updates,
    // Always update the 'updated' timestamp
    updated: new Date().toISOString(),
  };

  // Validate merged data
  const validated = EpicFrontmatterSchema.parse(updatedData);

  // Stringify back to markdown
  return stringifyFrontmatter(validated, parsed.content);
}

/**
 * Update task frontmatter with validation
 *
 * @param markdown - Original task markdown
 * @param updates - Partial task frontmatter updates
 * @returns Updated and validated task markdown
 * @throws ZodError if resulting frontmatter is invalid
 */
export function updateTaskFrontmatter(
  markdown: string,
  updates: Partial<TaskFrontmatter>
): string {
  const parsed = parseTaskFrontmatter(markdown);

  // Merge updates with existing data
  const updatedData = {
    ...parsed.data,
    ...updates,
    // Always update the 'updated' timestamp
    updated: new Date().toISOString(),
  };

  // Validate merged data
  const validated = TaskFrontmatterSchema.parse(updatedData);

  // Stringify back to markdown
  return stringifyFrontmatter(validated, parsed.content);
}

/**
 * Update PRD frontmatter with validation
 *
 * @param markdown - Original PRD markdown
 * @param updates - Partial PRD frontmatter updates
 * @returns Updated and validated PRD markdown
 * @throws ZodError if resulting frontmatter is invalid
 */
export function updatePrdFrontmatter(
  markdown: string,
  updates: Partial<PrdFrontmatter>
): string {
  const parsed = parsePrdFrontmatter(markdown);

  // Merge updates with existing data
  const updatedData = {
    ...parsed.data,
    ...updates,
    // Always update the 'updated' timestamp
    updated: new Date().toISOString(),
  };

  // Validate merged data
  const validated = PrdFrontmatterSchema.parse(updatedData);

  // Stringify back to markdown
  return stringifyFrontmatter(validated, parsed.content);
}

/**
 * Create new epic frontmatter
 *
 * @param name - Epic name
 * @param additionalFields - Additional frontmatter fields
 * @returns Epic frontmatter object
 */
export function createEpicFrontmatter(
  name: string,
  additionalFields: Partial<EpicFrontmatter> = {}
): EpicFrontmatter {
  const now = new Date().toISOString();

  const frontmatter: EpicFrontmatter = {
    name,
    status: 'open',
    created: now,
    updated: now,
    progress: 0,
    totalTasks: 0,
    completedTasks: 0,
    ...additionalFields,
  };

  // Validate before returning
  return EpicFrontmatterSchema.parse(frontmatter);
}

/**
 * Create new task frontmatter
 *
 * @param name - Task name
 * @param additionalFields - Additional frontmatter fields
 * @returns Task frontmatter object
 */
export function createTaskFrontmatter(
  name: string,
  additionalFields: Partial<TaskFrontmatter> = {}
): TaskFrontmatter {
  const now = new Date().toISOString();

  const frontmatter: TaskFrontmatter = {
    name,
    status: 'open',
    created: now,
    updated: now,
    depends_on: [],
    parallel: true,
    conflicts_with: [],
    ...additionalFields,
  };

  // Validate before returning
  return TaskFrontmatterSchema.parse(frontmatter);
}

/**
 * Create new PRD frontmatter
 *
 * @param name - PRD name
 * @param additionalFields - Additional frontmatter fields
 * @returns PRD frontmatter object
 */
export function createPrdFrontmatter(
  name: string,
  additionalFields: Partial<PrdFrontmatter> = {}
): PrdFrontmatter {
  const now = new Date().toISOString();

  const frontmatter: PrdFrontmatter = {
    name,
    status: 'draft',
    created: now,
    updated: now,
    ...additionalFields,
  };

  // Validate before returning
  return PrdFrontmatterSchema.parse(frontmatter);
}

/**
 * Extract frontmatter without content
 *
 * @param markdown - Markdown string
 * @returns Frontmatter data only
 */
export function extractFrontmatter<T = any>(markdown: string): T {
  const parsed = parseFrontmatter<T>(markdown);
  return parsed.data;
}

/**
 * Check if markdown has frontmatter
 *
 * @param markdown - Markdown string
 * @returns True if frontmatter exists
 */
export function hasFrontmatter(markdown: string): boolean {
  const parsed = parseFrontmatter(markdown);
  return !parsed.isEmpty;
}
