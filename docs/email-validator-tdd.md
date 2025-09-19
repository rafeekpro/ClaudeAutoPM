# Email Validator - TDD Implementation

## Overview

A robust email validation module implemented using Test-Driven Development (TDD) methodology. This validator follows RFC 5322 standards while balancing between strict compliance and practical real-world usage.

## Features

### Core Validation
- ✅ RFC 5322 compliant email validation
- ✅ Support for special characters in local part (+, -, _, .)
- ✅ Domain validation with TLD requirements
- ✅ Length constraints (local: max 64, domain: max 253, total: max 320)
- ✅ Protection against ReDoS attacks
- ✅ Type safety and null/undefined handling

### Advanced Features
- **EmailValidator Class**: Configurable validation with options
- **Detailed Validation**: Returns parsed components and error messages
- **Async Support**: Promise-based validation for future extensibility
- **XSS Protection**: Email sanitization for safe display
- **Form Integration**: Validation rules for form validators

## Installation

```javascript
// Import the validator
const validateEmail = require('./lib/validators/email-validator');
// Or with destructuring for advanced features
const {
  validateEmail,
  EmailValidator,
  validateEmailDetailed,
  sanitizeEmail
} = require('./lib/validators/email-validator');
```

## Usage Examples

### Basic Validation

```javascript
const validateEmail = require('./lib/validators/email-validator');

// Simple validation
console.log(validateEmail('user@example.com'));        // true
console.log(validateEmail('invalid.email'));           // false
console.log(validateEmail('user@'));                   // false
console.log(validateEmail('@example.com'));            // false
```

### Advanced Validation with Options

```javascript
const { EmailValidator } = require('./lib/validators/email-validator');

// Create validator with custom options
const validator = new EmailValidator({
  maxLength: 100,              // Custom max length
  allowInternational: false,   // Future feature
  allowQuoted: false           // Future feature
});

console.log(validator.validate('user@example.com'));  // true
```

### Detailed Validation Results

```javascript
const { validateEmailDetailed } = require('./lib/validators/email-validator');

const result = validateEmailDetailed('user@example.com');
console.log(result);
// Output:
// {
//   valid: true,
//   localPart: 'user',
//   domain: 'example.com',
//   errors: []
// }

const invalidResult = validateEmailDetailed('user@@example.com');
console.log(invalidResult);
// Output:
// {
//   valid: false,
//   localPart: null,
//   domain: null,
//   errors: ['Multiple @ symbols found']
// }
```

### Email Sanitization

```javascript
const { sanitizeEmail } = require('./lib/validators/email-validator');

// Sanitize for safe HTML display
const dangerous = '<script>alert("xss")</script>@example.com';
const safe = sanitizeEmail(dangerous);
console.log(safe);  // &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;@example.com
```

### Form Validation Integration

```javascript
const { emailRule } = require('./lib/validators/email-validator');

// Create a validation rule for forms
const rule = emailRule({
  required: true,
  message: 'Please enter a valid email address'
});

// Use with form validation
const error = rule('invalid.email');
console.log(error);  // 'Please enter a valid email address'
```

## Validation Rules

### Local Part (before @)
- Maximum 64 characters
- Cannot start or end with a dot (.)
- Cannot contain consecutive dots (..)
- Allowed characters: a-z, A-Z, 0-9, and special characters: `.!#$%&'*+/=?^_\`{|}~-`
- No spaces allowed

### Domain Part (after @)
- Maximum 253 characters
- Must contain at least one dot for TLD
- Cannot start or end with dot (.) or hyphen (-)
- Domain labels can contain: a-z, A-Z, 0-9, hyphen (-)
- TLD must be at least 2 characters and cannot be purely numeric
- No spaces allowed

### Overall Constraints
- Maximum total length: 320 characters
- Exactly one @ symbol required
- Case-insensitive domain validation
- No unicode/international characters (current implementation)

## Test-Driven Development Process

This module was built using TDD methodology:

1. **Write Tests First**: Comprehensive test suite created before implementation
2. **Red Phase**: Tests fail initially (expected behavior)
3. **Green Phase**: Minimal code written to pass tests
4. **Refactor Phase**: Code optimized while maintaining test passage

### Test Coverage

The module includes extensive test coverage:

- **Basic Validation**: Valid/invalid emails, null handling, type checking
- **Edge Cases**: Length boundaries, special characters, international domains
- **Security**: ReDoS prevention, XSS sanitization, injection attempts
- **Performance**: Fast validation even with malicious patterns
- **Real-World Cases**: Common email formats, popular providers

## Performance & Security

### ReDoS Protection
The validator uses efficient string operations instead of complex regex patterns to prevent Regular Expression Denial of Service attacks:

```javascript
// Malicious patterns are handled safely
const malicious = 'a'.repeat(10000) + '@example.com';
validateEmail(malicious);  // Returns false quickly (<100ms)
```

### XSS Prevention
Email addresses are sanitized before display to prevent cross-site scripting:

```javascript
const dangerous = '<img src=x onerror=alert(1)>@example.com';
const safe = sanitizeEmail(dangerous);
// Safe for HTML display
```

## Limitations

Current implementation does not support:
- International/Unicode domain names (IDN)
- Quoted strings in local part
- IP addresses as domains
- Comments in email addresses
- Obsolete RFC 822 formats

## Future Enhancements

Planned features for future versions:
- DNS validation for domain existence
- Disposable email detection
- International domain support
- Quoted local part support
- Configurable validation strictness levels

## Testing

Run the test suites:

```bash
# Run unit tests
npm run test:unit

# Run specific email validator tests
node --test test/unit/email-validator.test.js
node --test test/unit/email-validator-edge-cases.test.js
```

## License

MIT

## Contributing

When contributing to this module:
1. Follow TDD methodology - write tests first
2. Maintain 100% test coverage for new features
3. Ensure all existing tests pass
4. Add edge case tests for complex scenarios
5. Document any new validation rules or options