#!/usr/bin/env node
/**
 * Test Plan Generator
 *
 * Reads epics/tasks, extracts acceptance criteria (lines with `- [ ]`),
 * generates a test plan markdown file at .claude/pm/test-plan.md.
 *
 * Usage: node .claude/scripts/pm/test-plan.js
 */

const fs = require('fs');
const path = require('path');

const basePath = process.cwd();
const pmDir = path.join(basePath, '.claude', 'pm');
const epicsDir = path.join(basePath, '.claude', 'epics');
const outPath = path.join(pmDir, 'test-plan.md');

function readFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^(\w[\w-]*):\s*(.+)/);
    if (m) fm[m[1]] = m[2].trim();
  }
  return fm;
}

function inferTestType(text) {
  const lower = text.toLowerCase();
  if (lower.includes('render') || lower.includes('display') || lower.includes('ui') || lower.includes('page') || lower.includes('navigate')) return 'e2e';
  if (lower.includes('api') || lower.includes('endpoint') || lower.includes('login') || lower.includes('auth') || lower.includes('connect') || lower.includes('database')) return 'integration';
  return 'unit';
}

function extractAcceptanceCriteria(content) {
  const criteria = [];
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*-\s*\[\s*([xX ]?)\s*\]\s*(.+)/);
    if (m) {
      criteria.push({
        text: m[2].trim(),
        done: m[1].toLowerCase() === 'x'
      });
    }
  }
  return criteria;
}

function scanEpics() {
  if (!fs.existsSync(epicsDir)) return [];
  const epics = [];
  for (const entry of fs.readdirSync(epicsDir)) {
    const epicPath = path.join(epicsDir, entry);
    const stat = fs.statSync(epicPath);
    if (stat.isDirectory()) {
      const epic = { name: entry, tasks: [] };
      for (const file of fs.readdirSync(epicPath)) {
        if (!file.endsWith('.md')) continue;
        const content = fs.readFileSync(path.join(epicPath, file), 'utf8');
        const fm = readFrontmatter(content);
        const criteria = extractAcceptanceCriteria(content);
        if (criteria.length > 0) {
          epic.tasks.push({
            file,
            name: fm.name || file.replace('.md', ''),
            status: fm.status || 'open',
            criteria
          });
        }
      }
      if (epic.tasks.length > 0) epics.push(epic);
    } else if (entry.endsWith('.md')) {
      const content = fs.readFileSync(epicPath, 'utf8');
      const fm = readFrontmatter(content);
      const criteria = extractAcceptanceCriteria(content);
      if (criteria.length > 0) {
        epics.push({
          name: fm.name || entry.replace('.md', ''),
          tasks: [{ file: entry, name: fm.name || entry.replace('.md', ''), status: fm.status || 'open', criteria }]
        });
      }
    }
  }
  return epics;
}

function generate() {
  const epics = scanEpics();
  let totalCases = 0;
  let totalTasks = 0;
  const lines = ['# Test Plan', '', `Generated: ${new Date().toISOString().replace(/\.\d+Z/, 'Z')}`, ''];

  if (epics.length === 0) {
    lines.push('No epics with acceptance criteria found in .claude/epics/');
    lines.push('', 'Create epics with `- [ ]` checkbox items to generate test cases.');
  }

  for (const epic of epics) {
    lines.push(`## Epic: ${epic.name}`, '');
    lines.push('| # | Test Case | Source | Type | Status |');
    lines.push('|---|-----------|--------|------|--------|');
    let caseNum = 0;
    for (const task of epic.tasks) {
      totalTasks++;
      for (const ac of task.criteria) {
        caseNum++;
        totalCases++;
        const type = inferTestType(ac.text);
        const status = ac.done ? 'passed' : 'pending';
        lines.push(`| ${caseNum} | ${ac.text} | ${task.name} AC | ${type} | ${status} |`);
      }
    }
    lines.push('', `Total: ${caseNum} test cases from ${epic.tasks.length} tasks`, '');
  }

  lines.push('---', `Summary: ${totalCases} test cases from ${totalTasks} tasks across ${epics.length} epics`);

  if (!fs.existsSync(pmDir)) fs.mkdirSync(pmDir, { recursive: true });
  fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
  console.log(`Test plan generated: ${outPath}`);
  console.log(`${totalCases} test cases from ${totalTasks} tasks across ${epics.length} epics`);
  return { totalCases, totalTasks, epicCount: epics.length, path: outPath };
}

if (require.main === module) {
  generate();
}

module.exports = { generate, scanEpics, extractAcceptanceCriteria, inferTestType };
