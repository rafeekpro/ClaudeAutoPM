---
allowed-tools: Bash
---

---

## Instructions

Run the following using the Bash tool and show the complete output:

```bash
node - <<'NODE'
const { execFileSync } = require('child_process');

function firstLabel(labels, predicate) {
  return labels.find(predicate) || null;
}

function effortRank(labels) {
  const effort = firstLabel(labels, (label) => /^effort:(s|m|l|xl)$/i.test(label));
  const order = {
    'effort:s': 0,
    'effort:m': 1,
    'effort:l': 2,
    'effort:xl': 3
  };

  return effort ? (order[effort.toLowerCase()] ?? 4) : 4;
}

function typeRank(labels) {
  if (labels.includes('bug')) {
    return 0;
  }

  if (labels.includes('enhancement')) {
    return 1;
  }

  return 2;
}

function priorityRank(labels) {
  if (labels.includes('high-priority')) {
    return 0;
  }

  return 1;
}

function assigneeLabel(issue) {
  if (!Array.isArray(issue.assignees) || issue.assignees.length === 0) {
    return 'unassigned';
  }

  return issue.assignees
    .map((assignee) => `@${assignee.login}`)
    .join(', ');
}

function dependencyNumbers(body) {
  const matches = String(body ?? '').match(/depends on\s+#(\d+)/gi) || [];
  return matches.map((value) => Number(value.match(/#(\d+)/)[1]));
}

function formatTag(value) {
  return value ? `[${value}]` : '';
}

const issues = JSON.parse(
  execFileSync(
    'gh',
    [
      'issue',
      'list',
      '--state',
      'open',
      '--json',
      'number,title,labels,assignees,createdAt,body',
      '--limit',
      '50'
    ],
    { encoding: 'utf8' }
  )
).map((issue) => {
  const labels = Array.isArray(issue.labels)
    ? issue.labels.map((label) => String(label.name ?? '').trim().toLowerCase()).filter(Boolean)
    : [];
  const effort = firstLabel(labels, (label) => /^effort:/i.test(label));
  const dependencies = dependencyNumbers(issue.body);

  return {
    ...issue,
    labels,
    effort,
    dependencies,
    isAssigned: Array.isArray(issue.assignees) && issue.assignees.length > 0
  };
});

issues.sort((left, right) => {
  return (
    priorityRank(left.labels) - priorityRank(right.labels) ||
    typeRank(left.labels) - typeRank(right.labels) ||
    effortRank(left.labels) - effortRank(right.labels) ||
    Number(left.isAssigned) - Number(right.isAssigned) ||
    Date.parse(left.createdAt) - Date.parse(right.createdAt) ||
    left.number - right.number
  );
});

const openIssueNumbers = new Set(issues.map((issue) => issue.number));
const suggested = issues.find((issue) => {
  if (issue.isAssigned) {
    return false;
  }

  if (!['effort:s', 'effort:m', null].includes(issue.effort)) {
    return false;
  }

  return issue.dependencies.every((number) => !openIssueNumbers.has(number));
}) || null;

const sections = [
  {
    title: 'HIGH PRIORITY',
    issues: issues.filter((issue) => issue.labels.includes('high-priority'))
  },
  {
    title: 'NORMAL',
    issues: issues.filter((issue) => !issue.labels.includes('high-priority'))
  }
];

console.log(`BACKLOG (${issues.length} open)`);
console.log('');

if (suggested) {
  const tags = [formatTag(suggested.effort), formatTag(suggested.labels.includes('bug') ? 'bug' : suggested.labels.includes('enhancement') ? 'enhancement' : '')]
    .filter(Boolean)
    .join(' ');
  console.log(`▶ SUGGESTED NEXT: #${suggested.number} ${suggested.title} ${tags}`.trim());
  console.log('');
}

for (const section of sections) {
  if (section.issues.length === 0) {
    continue;
  }

  console.log(section.title);

  for (const issue of section.issues) {
    const type = issue.labels.includes('bug')
      ? 'bug'
      : issue.labels.includes('enhancement')
        ? 'enhancement'
        : '';
    const dependencyText = issue.dependencies.length > 0
      ? ` depends-on=${issue.dependencies.map((number) => `#${number}`).join(',')}`
      : '';
    const tags = [formatTag(issue.effort), formatTag(type)].filter(Boolean).join(' ');
    console.log(
      `  #${String(issue.number).padEnd(4)} ${issue.title} ${tags} ${assigneeLabel(issue)}${dependencyText}`.trimEnd()
    );
  }

  console.log('');
}

console.log('Run: /pm:issue-start <number>');
NODE
```

- DO NOT truncate.
- DO NOT collapse.
- DO NOT abbreviate.
- Show ALL lines in full.

## Required Documentation Access

**MANDATORY:** Query Context7 for project-management best practices before proceeding. Use the standard PM query set in `.claude/rules/context7-required.md`.

- DO NOT print any other comments.
