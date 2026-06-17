#!/usr/bin/env node

const { execSync } = require('child_process');

const PRIORITY_ORDER = { 'high-priority': 0, 'bug': 1, 'enhancement': 2 };
const EFFORT_ORDER = { 'effort:S': 0, 'effort:M': 1, 'effort:L': 2, 'effort:XL': 3 };

function getPriorityRank(issue) {
  let rank = 99;
  for (const label of issue.labels) {
    if (PRIORITY_ORDER[label.name] !== undefined) {
      rank = Math.min(rank, PRIORITY_ORDER[label.name]);
    }
  }
  return rank;
}

function getEffortRank(issue) {
  let rank = 99;
  for (const label of issue.labels) {
    if (EFFORT_ORDER[label.name] !== undefined) {
      rank = Math.min(rank, EFFORT_ORDER[label.name]);
    }
  }
  return rank;
}

function sortIssues(issues) {
  return [...issues].sort((a, b) => {
    const pa = getPriorityRank(a), pb = getPriorityRank(b);
    if (pa !== pb) return pa - pb;
    const ea = getEffortRank(a), eb = getEffortRank(b);
    if (ea !== eb) return ea - eb;
    // unassigned-first: surfaces actionable work before in-progress items
    const ua = a.assignees.length === 0 ? 0 : 1;
    const ub = b.assignees.length === 0 ? 0 : 1;
    if (ua !== ub) return ua - ub;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
}

function hasOpenDependency(body) {
  return /Depends on #\d+/i.test(body || '');
}

function getBacklog() {
  let rawIssues = [];
  try {
    const out = execSync(
      'gh issue list --state open --json number,title,labels,assignees,createdAt --limit 50',
      { encoding: 'utf8' }
    );
    rawIssues = JSON.parse(out);
  } catch (e) {
    // gh not available or not authenticated
  }

  const issues = rawIssues.map(issue => {
    const effortLabel = issue.labels.find(l => l.name.startsWith('effort:'));
    const effort = effortLabel ? effortLabel.name : null;
    const assignee = issue.assignees && issue.assignees.length > 0
      ? issue.assignees[0].login
      : null;
    return { ...issue, effort, assignee };
  });

  const sorted = sortIssues(issues);

  // Find suggestion: first unassigned effort:S or effort:M with no open dependency
  let suggested = null;
  const candidates = sorted.filter(
    i => !i.assignee && (i.effort === 'effort:S' || i.effort === 'effort:M')
  );

  for (const candidate of candidates) {
    let body = '';
    try {
      const out = execSync(`gh issue view ${candidate.number} --json body`, { encoding: 'utf8' });
      body = JSON.parse(out).body || '';
    } catch (e) {
      // no body available — treat as no dependency
    }
    if (!hasOpenDependency(body)) {
      suggested = candidate;
      break;
    }
  }

  // Format output
  const lines = [];
  lines.push(`BACKLOG (${sorted.length} open)`);
  lines.push('');

  if (suggested) {
    const typeLabel = suggested.labels.find(l => l.name === 'bug' || l.name === 'enhancement');
    const effortStr = suggested.effort || 'no effort';
    const typeStr = typeLabel ? typeLabel.name : 'no type';
    lines.push(`▶ SUGGESTED NEXT: #${suggested.number} ${suggested.title} (${effortStr}, ${typeStr})`);
    lines.push('');
  }

  const highPriority = sorted.filter(i => i.labels.some(l => l.name === 'high-priority'));
  const normal = sorted.filter(i => !i.labels.some(l => l.name === 'high-priority'));

  function fmtRow(issue) {
    const effortTag = issue.effort ? `[${issue.effort}]` : '';
    const typeLabel = issue.labels.find(l => l.name === 'bug' || l.name === 'enhancement');
    const typeTag = typeLabel ? `[${typeLabel.name}]` : '';
    const assigneeStr = issue.assignee ? `@${issue.assignee}` : 'unassigned';
    return `  #${issue.number}  ${issue.title}  ${effortTag} ${typeTag}  ${assigneeStr}`.trimEnd();
  }

  if (highPriority.length > 0) {
    lines.push('HIGH PRIORITY');
    for (const issue of highPriority) lines.push(fmtRow(issue));
    lines.push('');
  }

  if (normal.length > 0) {
    lines.push('NORMAL');
    for (const issue of normal) lines.push(fmtRow(issue));
    lines.push('');
  }

  if (sorted.length > 0) {
    const footerNum = suggested ? suggested.number : sorted[0].number;
    lines.push(`Run: /pm:issue-start ${footerNum}`);
  }

  return { issues: sorted, suggested, output: lines.join('\n') };
}

module.exports = getBacklog;
module.exports.getBacklog = getBacklog;
module.exports.sortIssues = sortIssues;
module.exports.hasOpenDependency = hasOpenDependency;

if (require.main === module) {
  const result = getBacklog();
  console.log(result.output);
}
