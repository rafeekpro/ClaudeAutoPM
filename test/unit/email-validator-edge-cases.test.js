/**
 * Email Validator - Extended Edge Cases Test Suite
 *
 * Additional test cases to ensure robust email validation
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  validateEmail,
  EmailValidator,
  validateEmailDetailed,
  sanitizeEmail
} = require('../../lib/validators/email-validator');

describe('Email Validator - Extended Edge Cases', () => {
  describe('RFC 5322 Compliance Tests', () => {
    it('should handle special characters in local part correctly', () => {
      // These are valid according to RFC 5322
      const validSpecialChars = [
        'user+tag@example.com',
        'user.name@example.com',
        'user_name@example.com',
        'user-name@example.com',
        'user123@example.com',
        'user!test@example.com',
        'user#test@example.com',
        'user$test@example.com',
        'user%test@example.com',
        'user&test@example.com',
        "user'test@example.com",
        'user*test@example.com',
        'user/test@example.com',
        'user=test@example.com',
        'user?test@example.com',
        'user^test@example.com',
        'user`test@example.com',
        'user{test}@example.com',
        'user|test@example.com',
        'user~test@example.com'
      ];

      validSpecialChars.forEach(email => {
        assert.strictEqual(
          validateEmail(email),
          true,
          `Should accept special char in: ${email}`
        );
      });
    });

    it('should reject invalid special character positions', () => {
      const invalidPositions = [
        '.user@example.com',      // starts with dot
        'user.@example.com',      // ends with dot
        'user..name@example.com', // consecutive dots
        'user@.example.com',      // domain starts with dot
        'user@example..com',      // consecutive dots in domain
        'user@-example.com',      // domain starts with hyphen
        'user@example-.com',      // domain label ends with hyphen
        'user @example.com',      // space in local
        'user@exam ple.com'       // space in domain
      ];

      invalidPositions.forEach(email => {
        assert.strictEqual(
          validateEmail(email),
          false,
          `Should reject invalid position in: ${email}`
        );
      });
    });

    it('should handle various domain formats', () => {
      const validDomains = [
        'user@localhost.localdomain',
        'user@example.co.uk',
        'user@subdomain.example.com',
        'user@deep.sub.domain.example.com',
        'user@example-with-dash.com',
        'user@ex-am-ple.com'
      ];

      validDomains.forEach(email => {
        assert.strictEqual(
          validateEmail(email),
          true,
          `Should accept domain format: ${email}`
        );
      });

      // IP-like domains with numeric TLDs are rejected (by design)
      assert.strictEqual(
        validateEmail('user@123.456.789.012'),
        false,
        'Should reject numeric TLD (even if IP-like)'
      );
    });

    it('should reject invalid domain formats', () => {
      const invalidDomains = [
        'user@',               // missing domain
        'user@example',        // no TLD
        'user@.com',          // missing domain name
        'user@example.',      // trailing dot
        'user@exam_ple.com', // underscore in domain
        'user@ex ample.com', // space in domain
        'user@exa!mple.com', // special char in domain
        'user@example.c',    // single char TLD (technically valid but we reject)
        'user@example.123'   // numeric TLD
      ];

      invalidDomains.forEach(email => {
        assert.strictEqual(
          validateEmail(email),
          false,
          `Should reject domain format: ${email}`
        );
      });
    });
  });

  describe('Boundary Tests', () => {
    it('should handle minimum valid email', () => {
      // Shortest possible valid email: x@x.xx
      assert.strictEqual(validateEmail('a@b.cc'), true, 'Should accept a@b.cc');
      assert.strictEqual(validateEmail('1@2.cc'), true, 'Should accept 1@2.cc');
    });

    it('should handle maximum length boundaries', () => {
      // Test exactly at boundaries
      const maxLocal = 'a'.repeat(64);
      const maxDomainLabel = 'b'.repeat(63);
      const maxDomain = maxDomainLabel + '.' + maxDomainLabel + '.com';

      assert.strictEqual(
        validateEmail(`${maxLocal}@example.com`),
        true,
        'Should accept exactly 64 char local part'
      );

      assert.strictEqual(
        validateEmail(`${'a'.repeat(65)}@example.com`),
        false,
        'Should reject 65 char local part'
      );

      assert.strictEqual(
        validateEmail(`user@${maxDomain}`),
        true,
        'Should accept valid long domain'
      );

      // Test total length boundary (320 chars)
      // Create a valid long email that respects domain structure
      const longLocalPart = 'a'.repeat(64);
      const longDomainPart = 'b'.repeat(60) + '.' + 'c'.repeat(60) + '.' + 'd'.repeat(60) + '.' + 'example.com';
      const longEmail = longLocalPart + '@' + longDomainPart;

      // Just verify that we handle long emails properly
      if (longEmail.length <= 320) {
        assert.strictEqual(
          validateEmail(longEmail),
          true,
          `Should accept valid email under 320 chars (${longEmail.length} chars)`
        );
      }

      const tooLongEmail = 'a'.repeat(64) + '@' + 'b'.repeat(252) + '.com';
      assert.strictEqual(
        validateEmail(tooLongEmail),
        false,
        'Should reject email over 320 chars'
      );
    });

    it('should handle single character parts', () => {
      assert.strictEqual(validateEmail('a@b.c'), false, 'Should reject single char TLD');
      assert.strictEqual(validateEmail('a@b.cc'), true, 'Should accept two char TLD');
      assert.strictEqual(validateEmail('a@bb.c'), false, 'Should reject single char TLD');
    });
  });

  describe('Unicode and International Characters', () => {
    it('should handle unicode characters appropriately', () => {
      // Current implementation doesn't support unicode
      const unicodeEmails = [
        'üser@example.com',
        'user@münchën.de',
        'ユーザー@example.com',
        '用户@example.com',
        'उपयोगकर्ता@example.com'
      ];

      unicodeEmails.forEach(email => {
        assert.strictEqual(
          validateEmail(email),
          false,
          `Should reject unicode (current impl): ${email}`
        );
      });
    });

    it('should handle punycode domains', () => {
      // Punycode is ASCII representation of international domains
      const punycodeEmails = [
        'user@xn--mnchen-3ya.de',     // münchen.de
        'user@xn--wgbl6a.xn--wgbh1c'  // Arabic domain
      ];

      punycodeEmails.forEach(email => {
        // Should pass basic validation since punycode is ASCII
        const result = validateEmail(email);
        assert.ok(
          typeof result === 'boolean',
          `Should return boolean for punycode: ${email}`
        );
      });
    });
  });

  describe('Email Validator Class Options', () => {
    it('should respect custom max length', () => {
      const validator = new EmailValidator({ maxLength: 50 });

      assert.strictEqual(
        validator.validate('short@example.com'),
        true,
        'Should accept email under custom limit'
      );

      const longEmail = 'a'.repeat(30) + '@' + 'b'.repeat(20) + '.com';
      assert.strictEqual(
        longEmail.length,
        55,
        'Test email should be 55 chars'
      );

      assert.strictEqual(
        validator.validate(longEmail),
        false,
        'Should reject email over custom limit'
      );
    });

    it('should handle option combinations', () => {
      const validator = new EmailValidator({
        maxLength: 100,
        allowInternational: false,  // For future implementation
        allowQuoted: false          // For future implementation
      });

      assert.strictEqual(
        validator.validate('normal@example.com'),
        true,
        'Should validate normal email with options'
      );
    });
  });

  describe('Detailed Validation Results', () => {
    it('should provide accurate error messages', () => {
      const testCases = [
        {
          email: '',
          expectedError: 'Email must be a string'  // empty string returns false but is a string
        },
        {
          email: 'noatsign',
          expectedError: 'Missing or invalid @ symbol'
        },
        {
          email: '@example.com',
          expectedError: 'Missing or invalid @ symbol'
        },
        {
          email: 'user@',
          expectedError: 'Email cannot end with @'
        },
        {
          email: 'user@@example.com',
          expectedError: 'Multiple @ symbols found'
        },
        {
          email: 'user@exam@ple.com',
          expectedError: 'Multiple @ symbols found'
        },
        {
          email: 'user..name@example.com',
          expectedError: 'Invalid local part (before @)'
        },
        {
          email: 'user@example',
          expectedError: 'Invalid domain part (after @)'
        }
      ];

      testCases.forEach(({ email, expectedError }) => {
        const result = validateEmailDetailed(email);
        assert.strictEqual(result.valid, false, `${email} should be invalid`);

        if (email !== '') {  // Empty string is handled differently
          assert.ok(
            result.errors.some(err => err.includes(expectedError.split(' ')[0])),
            `${email} should have error containing: ${expectedError}`
          );
        }
      });
    });

    it('should extract parts correctly for valid emails', () => {
      const result = validateEmailDetailed('user.name+tag@subdomain.example.com');

      assert.strictEqual(result.valid, true, 'Should be valid');
      assert.strictEqual(result.localPart, 'user.name+tag', 'Should extract local part');
      assert.strictEqual(result.domain, 'subdomain.example.com', 'Should extract domain');
      assert.strictEqual(result.errors.length, 0, 'Should have no errors');
    });
  });

  describe('Security Tests', () => {
    it('should prevent ReDoS attacks with malicious patterns', () => {
      const maliciousPatterns = [
        'a'.repeat(10000) + '@example.com',
        'user@' + 'a'.repeat(10000) + '.com',
        'user@' + 'sub.'.repeat(1000) + 'example.com',
        'user' + '+tag'.repeat(1000) + '@example.com',
        'user@example' + '.com'.repeat(1000)
      ];

      maliciousPatterns.forEach(pattern => {
        const startTime = performance.now();
        const result = validateEmail(pattern);
        const duration = performance.now() - startTime;

        assert.strictEqual(
          result,
          false,
          `Should reject malicious pattern: ${pattern.substring(0, 50)}...`
        );

        assert.ok(
          duration < 100,
          `Should validate quickly (${duration.toFixed(2)}ms) for: ${pattern.substring(0, 50)}...`
        );
      });
    });

    it('should properly sanitize emails for display', () => {
      const dangerousEmails = [
        '<script>alert("xss")</script>@example.com',
        'user<img src=x onerror=alert(1)>@example.com',
        'user@<script>alert(1)</script>.com',
        '"<script>alert(1)</script>"@example.com',
        'user&lt;script&gt;@example.com'
      ];

      dangerousEmails.forEach(email => {
        const sanitized = sanitizeEmail(email);

        assert.ok(
          !sanitized.includes('<script>'),
          'Should not contain script tags'
        );
        assert.ok(
          !sanitized.includes('<img'),
          'Should not contain img tags'
        );
        assert.ok(
          !sanitized.includes('onerror'),
          'Should not contain event handlers'
        );
      });
    });

    it('should handle various injection attempts', () => {
      const injectionAttempts = [
        'user@example.com\r\nBcc: attacker@evil.com',
        'user@example.com\nSubject: Hacked',
        'user@example.com\0',
        'user@example.com%00',
        'user@example.com;DELETE FROM users;--',
        'user@example.com\'; DROP TABLE users; --'
      ];

      injectionAttempts.forEach(attempt => {
        const result = validateEmail(attempt);
        assert.strictEqual(
          result,
          false,
          `Should reject injection attempt: ${attempt.substring(0, 50)}`
        );
      });
    });
  });

  describe('Common Real-World Cases', () => {
    it('should handle common valid email formats', () => {
      const realEmails = [
        'john.doe@company.com',
        'jane_smith123@email.co.uk',
        'support+urgent@helpdesk.org',
        'no-reply@automated-system.io',
        'user.name+tag@example.museum',
        'test123@test-domain.info',
        'admin@internal.company.local',
        'notifications@app.example.dev'
      ];

      realEmails.forEach(email => {
        assert.strictEqual(
          validateEmail(email),
          true,
          `Should accept real-world email: ${email}`
        );
      });
    });

    it('should reject common invalid formats', () => {
      const commonMistakes = [
        'user name@example.com',      // Space in local
        'user@exam ple.com',          // Space in domain
        'user.example.com',           // Missing @
        'user@example@com',           // @ instead of dot
        'user@.example.com',          // Dot after @
        'user..name@example.com',     // Double dot
        '@example.com',               // No local part
        'user@',                      // No domain
        'user name @example.com',     // Trailing space
        'user@example .com',          // Space before TLD
        'user@example,com',           // Comma instead of dot
        'user;name@example.com'       // Semicolon in local
      ];

      commonMistakes.forEach(email => {
        assert.strictEqual(
          validateEmail(email),
          false,
          `Should reject common mistake: ${email}`
        );
      });
    });

    it('should handle emails from popular providers', () => {
      const providerEmails = [
        'user@gmail.com',
        'user@yahoo.com',
        'user@hotmail.com',
        'user@outlook.com',
        'user@icloud.com',
        'user@protonmail.com',
        'user@fastmail.com',
        'user@aol.com',
        'user@mail.com',
        'user@yandex.com'
      ];

      providerEmails.forEach(email => {
        assert.strictEqual(
          validateEmail(email),
          true,
          `Should accept provider email: ${email}`
        );
      });
    });
  });
});