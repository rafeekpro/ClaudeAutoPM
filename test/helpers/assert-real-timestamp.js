/**
 * Shared assertion: content references /tmp/handoff- with a real date command,
 * and contains no placeholder strings (YYYY, <timestamp>, [timestamp]).
 *
 * @param {string} content - file content to assert against
 */
function assertRealTimestamp(content) {
  expect(content).toContain('/tmp/handoff-');
  const hasDateCmd = content.includes('date') || content.includes('%Y%m%d');
  expect(hasDateCmd).toBe(true);
  expect(content).not.toContain('YYYY');
  expect(content).not.toContain('<timestamp>');
  expect(content).not.toContain('[timestamp]');
}

module.exports = { assertRealTimestamp };
