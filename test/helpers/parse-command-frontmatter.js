/**
 * Parse YAML frontmatter from a command file (the leading --- block).
 * Returns a plain object of key/value strings, or {} if no frontmatter.
 */
function parseCommandFrontmatter(content) {
  if (!content || !content.startsWith('---')) return {};
  const end = content.indexOf('\n---', 3);
  if (end === -1) return {};
  const yaml = content.slice(4, end);
  const result = {};
  for (const line of yaml.split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    result[key] = value;
  }
  return result;
}

module.exports = { parseCommandFrontmatter };
