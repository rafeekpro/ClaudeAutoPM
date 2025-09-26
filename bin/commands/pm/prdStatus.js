/**
 * Command reference - delegates to autopm implementation
 */
const path = require('path');

module.exports = {
  handler: () => {
    const commandDoc = path.join(__dirname, '../../../autopm/.claude/commands/pm/prd-status.md');
    console.log(`Execute command from: ${commandDoc}`);
    return { success: true, delegated: true };
  }
};
