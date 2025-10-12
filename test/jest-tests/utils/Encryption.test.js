/**
 * @fileoverview Tests for Encryption utility
 * Tests encryption/decryption with AES-256-CBC and PBKDF2 key derivation
 */

const Encryption = require('../../../lib/utils/Encryption');

describe('Encryption', () => {
  const testPassword = 'test-password-123';
  const testPlaintext = 'sensitive-api-key-data';

  describe('Constructor', () => {
    test('should be instantiable', () => {
      const encryption = new Encryption();
      expect(encryption).toBeInstanceOf(Encryption);
    });
  });

  describe('generateSalt', () => {
    test('should generate 32-byte salt', () => {
      const encryption = new Encryption();
      const salt = encryption.generateSalt();
      expect(Buffer.isBuffer(salt)).toBe(true);
      expect(salt.length).toBe(32);
    });

    test('should generate unique salts', () => {
      const encryption = new Encryption();
      const salt1 = encryption.generateSalt();
      const salt2 = encryption.generateSalt();
      expect(salt1.equals(salt2)).toBe(false);
    });

    test('should generate cryptographically random salts', () => {
      const encryption = new Encryption();
      const salts = new Set();
      for (let i = 0; i < 100; i++) {
        salts.add(encryption.generateSalt().toString('hex'));
      }
      expect(salts.size).toBe(100);
    });
  });

  describe('generateIV', () => {
    test('should generate 16-byte IV', () => {
      const encryption = new Encryption();
      const iv = encryption.generateIV();
      expect(Buffer.isBuffer(iv)).toBe(true);
      expect(iv.length).toBe(16);
    });

    test('should generate unique IVs', () => {
      const encryption = new Encryption();
      const iv1 = encryption.generateIV();
      const iv2 = encryption.generateIV();
      expect(iv1.equals(iv2)).toBe(false);
    });

    test('should generate cryptographically random IVs', () => {
      const encryption = new Encryption();
      const ivs = new Set();
      for (let i = 0; i < 100; i++) {
        ivs.add(encryption.generateIV().toString('hex'));
      }
      expect(ivs.size).toBe(100);
    });
  });

  describe('deriveKey', () => {
    test('should derive 32-byte key from password and salt', () => {
      const encryption = new Encryption();
      const salt = encryption.generateSalt();
      const key = encryption.deriveKey(testPassword, salt);
      expect(Buffer.isBuffer(key)).toBe(true);
      expect(key.length).toBe(32);
    });

    test('should derive same key from same password and salt', () => {
      const encryption = new Encryption();
      const salt = encryption.generateSalt();
      const key1 = encryption.deriveKey(testPassword, salt);
      const key2 = encryption.deriveKey(testPassword, salt);
      expect(key1.equals(key2)).toBe(true);
    });

    test('should derive different keys from different passwords', () => {
      const encryption = new Encryption();
      const salt = encryption.generateSalt();
      const key1 = encryption.deriveKey('password1', salt);
      const key2 = encryption.deriveKey('password2', salt);
      expect(key1.equals(key2)).toBe(false);
    });

    test('should derive different keys from different salts', () => {
      const encryption = new Encryption();
      const salt1 = encryption.generateSalt();
      const salt2 = encryption.generateSalt();
      const key1 = encryption.deriveKey(testPassword, salt1);
      const key2 = encryption.deriveKey(testPassword, salt2);
      expect(key1.equals(key2)).toBe(false);
    });

    test('should throw error for invalid password', () => {
      const encryption = new Encryption();
      const salt = encryption.generateSalt();
      expect(() => encryption.deriveKey('', salt)).toThrow('Password is required');
      expect(() => encryption.deriveKey(null, salt)).toThrow('Password is required');
      expect(() => encryption.deriveKey(undefined, salt)).toThrow('Password is required');
    });

    test('should throw error for invalid salt', () => {
      const encryption = new Encryption();
      expect(() => encryption.deriveKey(testPassword, null)).toThrow('Salt must be a Buffer');
      expect(() => encryption.deriveKey(testPassword, 'not-a-buffer')).toThrow('Salt must be a Buffer');
    });

    test('should use PBKDF2 with 100,000 iterations', () => {
      const encryption = new Encryption();
      const salt = encryption.generateSalt();
      const startTime = Date.now();
      encryption.deriveKey(testPassword, salt);
      const duration = Date.now() - startTime;
      // PBKDF2 with 100k iterations should take some time (at least 10ms)
      expect(duration).toBeGreaterThan(10);
    });
  });

  describe('encrypt', () => {
    test('should encrypt plaintext and return encrypted data object', () => {
      const encryption = new Encryption();
      const result = encryption.encrypt(testPlaintext, testPassword);

      expect(result).toHaveProperty('encrypted');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('salt');
      expect(result).toHaveProperty('algorithm');
      expect(result.algorithm).toBe('aes-256-cbc');
      expect(typeof result.encrypted).toBe('string');
      expect(typeof result.iv).toBe('string');
      expect(typeof result.salt).toBe('string');
    });

    test('should produce different encrypted values for same plaintext', () => {
      const encryption = new Encryption();
      const result1 = encryption.encrypt(testPlaintext, testPassword);
      const result2 = encryption.encrypt(testPlaintext, testPassword);

      // Should be different due to random IV and salt
      expect(result1.encrypted).not.toBe(result2.encrypted);
      expect(result1.iv).not.toBe(result2.iv);
      expect(result1.salt).not.toBe(result2.salt);
    });

    test('should encrypt empty string', () => {
      const encryption = new Encryption();
      const result = encryption.encrypt('', testPassword);
      expect(result.encrypted).toBeTruthy();
    });

    test('should encrypt long strings', () => {
      const encryption = new Encryption();
      const longText = 'a'.repeat(10000);
      const result = encryption.encrypt(longText, testPassword);
      expect(result.encrypted).toBeTruthy();
      expect(result.encrypted.length).toBeGreaterThan(0);
    });

    test('should encrypt special characters', () => {
      const encryption = new Encryption();
      const specialText = '!@#$%^&*()_+{}|:"<>?[];\',./ 你好 🎉';
      const result = encryption.encrypt(specialText, testPassword);
      expect(result.encrypted).toBeTruthy();
    });

    test('should throw error for invalid plaintext', () => {
      const encryption = new Encryption();
      expect(() => encryption.encrypt(null, testPassword)).toThrow('Plaintext is required');
      expect(() => encryption.encrypt(undefined, testPassword)).toThrow('Plaintext is required');
    });

    test('should throw error for invalid password', () => {
      const encryption = new Encryption();
      expect(() => encryption.encrypt(testPlaintext, '')).toThrow('Password is required');
      expect(() => encryption.encrypt(testPlaintext, null)).toThrow('Password is required');
    });

    test('should return base64-encoded values', () => {
      const encryption = new Encryption();
      const result = encryption.encrypt(testPlaintext, testPassword);

      // Should be valid base64
      expect(() => Buffer.from(result.encrypted, 'base64')).not.toThrow();
      expect(() => Buffer.from(result.iv, 'base64')).not.toThrow();
      expect(() => Buffer.from(result.salt, 'base64')).not.toThrow();
    });
  });

  describe('decrypt', () => {
    test('should decrypt encrypted data back to original plaintext', () => {
      const encryption = new Encryption();
      const encrypted = encryption.encrypt(testPlaintext, testPassword);
      const decrypted = encryption.decrypt(encrypted, testPassword);
      expect(decrypted).toBe(testPlaintext);
    });

    test('should decrypt empty string', () => {
      const encryption = new Encryption();
      const encrypted = encryption.encrypt('', testPassword);
      const decrypted = encryption.decrypt(encrypted, testPassword);
      expect(decrypted).toBe('');
    });

    test('should decrypt long strings', () => {
      const encryption = new Encryption();
      const longText = 'a'.repeat(10000);
      const encrypted = encryption.encrypt(longText, testPassword);
      const decrypted = encryption.decrypt(encrypted, testPassword);
      expect(decrypted).toBe(longText);
    });

    test('should decrypt special characters', () => {
      const encryption = new Encryption();
      const specialText = '!@#$%^&*()_+{}|:"<>?[];\',./ 你好 🎉';
      const encrypted = encryption.encrypt(specialText, testPassword);
      const decrypted = encryption.decrypt(encrypted, testPassword);
      expect(decrypted).toBe(specialText);
    });

    test('should throw error for wrong password', () => {
      const encryption = new Encryption();
      const encrypted = encryption.encrypt(testPlaintext, testPassword);
      expect(() => encryption.decrypt(encrypted, 'wrong-password')).toThrow();
    });

    test('should throw error for missing encrypted field', () => {
      const encryption = new Encryption();
      const invalidData = { iv: 'abc', salt: 'def', algorithm: 'aes-256-cbc' };
      expect(() => encryption.decrypt(invalidData, testPassword)).toThrow('Encrypted data is required');
    });

    test('should throw error for missing iv field', () => {
      const encryption = new Encryption();
      const invalidData = { encrypted: 'abc', salt: 'def', algorithm: 'aes-256-cbc' };
      expect(() => encryption.decrypt(invalidData, testPassword)).toThrow('IV is required');
    });

    test('should throw error for missing salt field', () => {
      const encryption = new Encryption();
      const invalidData = { encrypted: 'abc', iv: 'def', algorithm: 'aes-256-cbc' };
      expect(() => encryption.decrypt(invalidData, testPassword)).toThrow('Salt is required');
    });

    test('should throw error for invalid algorithm', () => {
      const encryption = new Encryption();
      const encrypted = encryption.encrypt(testPlaintext, testPassword);
      encrypted.algorithm = 'invalid-algorithm';
      expect(() => encryption.decrypt(encrypted, testPassword)).toThrow('Invalid algorithm');
    });

    test('should throw error for corrupted encrypted data', () => {
      const encryption = new Encryption();
      const encrypted = encryption.encrypt(testPlaintext, testPassword);
      encrypted.encrypted = 'corrupted-data';
      expect(() => encryption.decrypt(encrypted, testPassword)).toThrow();
    });

    test('should throw error for corrupted iv', () => {
      const encryption = new Encryption();
      const encrypted = encryption.encrypt(testPlaintext, testPassword);
      encrypted.iv = 'corrupted-iv';
      expect(() => encryption.decrypt(encrypted, testPassword)).toThrow();
    });

    test('should throw error for corrupted salt', () => {
      const encryption = new Encryption();
      const encrypted = encryption.encrypt(testPlaintext, testPassword);
      encrypted.salt = 'corrupted-salt';
      expect(() => encryption.decrypt(encrypted, testPassword)).toThrow();
    });

    test('should throw error for invalid password type', () => {
      const encryption = new Encryption();
      const encrypted = encryption.encrypt(testPlaintext, testPassword);
      expect(() => encryption.decrypt(encrypted, null)).toThrow('Password is required');
      expect(() => encryption.decrypt(encrypted, '')).toThrow('Password is required');
    });
  });

  describe('Round-trip encryption', () => {
    test('should handle multiple encrypt/decrypt cycles', () => {
      const encryption = new Encryption();
      let data = testPlaintext;

      for (let i = 0; i < 5; i++) {
        const encrypted = encryption.encrypt(data, testPassword);
        data = encryption.decrypt(encrypted, testPassword);
      }

      expect(data).toBe(testPlaintext);
    });

    test('should work with different passwords for different data', () => {
      const encryption = new Encryption();
      const data1 = 'secret1';
      const data2 = 'secret2';
      const pass1 = 'password1';
      const pass2 = 'password2';

      const enc1 = encryption.encrypt(data1, pass1);
      const enc2 = encryption.encrypt(data2, pass2);

      expect(encryption.decrypt(enc1, pass1)).toBe(data1);
      expect(encryption.decrypt(enc2, pass2)).toBe(data2);
      expect(() => encryption.decrypt(enc1, pass2)).toThrow();
      expect(() => encryption.decrypt(enc2, pass1)).toThrow();
    });
  });

  describe('Security properties', () => {
    test('should use AES-256-CBC algorithm', () => {
      const encryption = new Encryption();
      const result = encryption.encrypt(testPlaintext, testPassword);
      expect(result.algorithm).toBe('aes-256-cbc');
    });

    test('encrypted data should be significantly different from plaintext', () => {
      const encryption = new Encryption();
      const result = encryption.encrypt(testPlaintext, testPassword);
      const encryptedBuffer = Buffer.from(result.encrypted, 'base64');
      const plaintextBuffer = Buffer.from(testPlaintext);

      // Encrypted should be different length and content
      expect(encryptedBuffer.equals(plaintextBuffer)).toBe(false);
    });

    test('should not leak password in error messages', () => {
      const encryption = new Encryption();
      const encrypted = encryption.encrypt(testPlaintext, testPassword);

      try {
        encryption.decrypt(encrypted, 'wrong-password');
      } catch (error) {
        expect(error.message).not.toContain('wrong-password');
        expect(error.message).not.toContain(testPassword);
      }
    });
  });
});
