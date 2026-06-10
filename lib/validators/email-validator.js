/**
 * Email validator
 *
 * Pragmatic ASCII email validation (no RFC 5321 quoted strings or
 * internationalized addresses — both are intentionally rejected).
 *
 * Rules:
 * - local part: alphanumerics and `+ _ -`, dot-separated segments
 *   (no leading/trailing/consecutive dots)
 * - domain: at least two labels; each label is alphanumeric with inner
 *   hyphens only (no leading/trailing hyphen, no underscores)
 *
 * Added in #608 — previously test/unit/email-validator-jest.test.js fell back
 * to an inline naive regex because this module did not exist.
 *
 * @param {*} email - Value to validate
 * @returns {boolean} True when the value is a valid email address string
 */

const LOCAL_PART = /^[A-Za-z0-9+_-]+(\.[A-Za-z0-9+_-]+)*$/;
const DOMAIN_LABEL = /^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?$/;

function validateEmail(email) {
  if (typeof email !== 'string' || email.length === 0) {
    return false;
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [local, domain] = parts;

  if (!LOCAL_PART.test(local)) {
    return false;
  }

  const labels = domain.split('.');
  if (labels.length < 2) {
    return false;
  }

  return labels.every(label => DOMAIN_LABEL.test(label));
}

module.exports = validateEmail;
