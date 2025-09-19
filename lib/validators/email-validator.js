/**
 * Email Validator Module
 *
 * A robust email validation implementation following RFC 5322 standards
 * with performance optimizations and security considerations.
 *
 * Implemented using TDD methodology.
 */

/**
 * Core email validation function
 *
 * @param {*} email - The email address to validate
 * @returns {boolean} - True if valid email, false otherwise
 */
function validateEmail(email) {
  // Handle non-string inputs
  if (email === null || email === undefined) {
    return false;
  }

  if (typeof email !== 'string') {
    return false;
  }

  // Check for empty string
  if (email.length === 0) {
    return false;
  }

  // Check maximum length (RFC 5321)
  if (email.length > 320) {
    return false;
  }

  // Split into local and domain parts
  const atIndex = email.lastIndexOf('@');

  // Must have exactly one @ symbol, not at the beginning or end
  if (atIndex <= 0 || atIndex === email.length - 1) {
    return false;
  }

  // Check for multiple @ symbols
  if (email.indexOf('@') !== atIndex) {
    return false;
  }

  const localPart = email.substring(0, atIndex);
  const domainPart = email.substring(atIndex + 1);

  // Validate local part
  if (!validateLocalPart(localPart)) {
    return false;
  }

  // Validate domain part
  if (!validateDomainPart(domainPart)) {
    return false;
  }

  return true;
}

/**
 * Validates the local part of an email address (before @)
 *
 * @param {string} localPart - The local part to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateLocalPart(localPart) {
  // Check length (max 64 characters)
  if (localPart.length === 0 || localPart.length > 64) {
    return false;
  }

  // Check for spaces
  if (localPart.includes(' ')) {
    return false;
  }

  // Check for invalid start/end characters
  if (localPart[0] === '.' || localPart[localPart.length - 1] === '.') {
    return false;
  }

  // Check for consecutive dots
  if (localPart.includes('..')) {
    return false;
  }

  // Basic check for valid characters (alphanumeric, dots, hyphens, underscores, plus)
  // This is a simplified version - full RFC 5322 allows more characters
  const validLocalPartRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+$/;

  if (!validLocalPartRegex.test(localPart)) {
    return false;
  }

  return true;
}

/**
 * Validates the domain part of an email address (after @)
 *
 * @param {string} domainPart - The domain part to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateDomainPart(domainPart) {
  // Check length (max 253 characters for domain)
  // Note: Some very long domains might be technically valid but we limit for practical reasons
  if (domainPart.length === 0 || domainPart.length > 253) {
    return false;
  }

  // Check for spaces
  if (domainPart.includes(' ')) {
    return false;
  }

  // Must contain at least one dot for TLD
  if (!domainPart.includes('.')) {
    return false;
  }

  // Check for invalid start/end characters
  if (domainPart[0] === '.' ||
      domainPart[0] === '-' ||
      domainPart[domainPart.length - 1] === '.' ||
      domainPart[domainPart.length - 1] === '-') {
    return false;
  }

  // Split by dots to check each label
  const labels = domainPart.split('.');

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const isLastLabel = i === labels.length - 1;

    // TLD (last label) should be at least 2 characters and not purely numeric
    if (isLastLabel) {
      if (label.length < 2) {
        return false;
      }
      // Reject purely numeric TLDs
      if (/^\d+$/.test(label)) {
        return false;
      }
    }

    if (!validateDomainLabel(label)) {
      return false;
    }
  }

  return true;
}

/**
 * Validates a single domain label
 *
 * @param {string} label - The domain label to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateDomainLabel(label) {
  // Check length (max 63 characters per label)
  // TLD should be at least 2 characters
  if (label.length === 0 || label.length > 63) {
    return false;
  }

  // Check for invalid start/end with hyphen
  if (label[0] === '-' || label[label.length - 1] === '-') {
    return false;
  }

  // Must contain only alphanumeric and hyphens
  const validLabelRegex = /^[a-zA-Z0-9-]+$/;

  if (!validLabelRegex.test(label)) {
    return false;
  }

  return true;
}

/**
 * EmailValidator class for advanced configuration
 */
class EmailValidator {
  constructor(options = {}) {
    this.options = {
      allowInternational: options.allowInternational || false,
      allowQuoted: options.allowQuoted || false,
      maxLength: options.maxLength || 320,
      ...options
    };
  }

  validate(email) {
    // Check custom max length
    if (typeof email === 'string' && email.length > this.options.maxLength) {
      return false;
    }

    // For now, use the same validation logic
    // In future, we can add support for international domains and quoted strings
    return validateEmail(email);
  }
}

/**
 * Detailed validation with error information
 *
 * @param {string} email - The email to validate
 * @returns {object} - Validation result with details
 */
function validateEmailDetailed(email) {
  const result = {
    valid: false,
    localPart: null,
    domain: null,
    errors: []
  };

  if (typeof email !== 'string') {
    result.errors.push('Email must be a string');
    return result;
  }

  const atIndex = email.lastIndexOf('@');

  if (atIndex <= 0) {
    result.errors.push('Missing or invalid @ symbol');
    return result;
  }

  if (atIndex === email.length - 1) {
    result.errors.push('Email cannot end with @');
    return result;
  }

  if (email.indexOf('@') !== atIndex) {
    result.errors.push('Multiple @ symbols found');
    return result;
  }

  result.localPart = email.substring(0, atIndex);
  result.domain = email.substring(atIndex + 1);

  if (!validateLocalPart(result.localPart)) {
    result.errors.push('Invalid local part (before @)');
  }

  if (!validateDomainPart(result.domain)) {
    result.errors.push('Invalid domain part (after @)');
  }

  result.valid = result.errors.length === 0;

  return result;
}

/**
 * Async validation wrapper (for future extensibility)
 *
 * @param {string} email - The email to validate
 * @returns {Promise<boolean>} - Promise resolving to validation result
 */
async function validateEmailAsync(email) {
  // Could add DNS validation, blacklist checking, etc.
  return Promise.resolve(validateEmail(email));
}

/**
 * Sanitizes email for safe display (removes potential XSS vectors)
 *
 * @param {string} email - The email to sanitize
 * @returns {string} - Sanitized email
 */
function sanitizeEmail(email) {
  if (typeof email !== 'string') {
    return '';
  }

  // Remove HTML tags and script content
  // Also handle already escaped entities
  return email
    .replace(/&/g, '&amp;')  // Must be first to avoid double-encoding
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/onerror/gi, '')  // Remove event handlers
    .replace(/onclick/gi, '')
    .replace(/onload/gi, '');
}

/**
 * Creates an email validation rule for form validators
 *
 * @param {object} options - Validation options
 * @returns {function} - Validation rule function
 */
function emailRule(options = {}) {
  return function(value) {
    if (options.required && !value) {
      return 'Email is required';
    }

    if (value && !validateEmail(value)) {
      return options.message || 'Invalid email address';
    }

    return null; // Valid
  };
}

// Export everything
module.exports = validateEmail;
module.exports.validateEmail = validateEmail;
module.exports.EmailValidator = EmailValidator;
module.exports.validateEmailDetailed = validateEmailDetailed;
module.exports.validateEmailAsync = validateEmailAsync;
module.exports.sanitizeEmail = sanitizeEmail;
module.exports.emailRule = emailRule;

// For testing internal functions
if (process.env.NODE_ENV === 'test') {
  module.exports._internal = {
    validateLocalPart,
    validateDomainPart,
    validateDomainLabel
  };
}