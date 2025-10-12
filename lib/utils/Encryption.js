/**
 * @fileoverview Encryption utility for secure API key storage
 * Implements AES-256-CBC encryption with PBKDF2 key derivation
 *
 * Based on Context7 documentation patterns:
 * - node-config: Hierarchical configuration patterns
 * - Node.js crypto: AES-256-CBC, PBKDF2, scrypt for encryption
 *
 * @example
 * const encryption = new Encryption();
 * const encrypted = encryption.encrypt('my-api-key', 'password');
 * const decrypted = encryption.decrypt(encrypted, 'password');
 */

const crypto = require('crypto');

/**
 * Encryption utility class for API keys and sensitive data
 */
class Encryption {
  constructor() {
    // Algorithm configuration
    this.algorithm = 'aes-256-cbc';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits
    this.saltLength = 32; // 256 bits
    this.iterations = 100000; // PBKDF2 iterations
    this.digest = 'sha512';
  }

  /**
   * Generate cryptographically secure random salt
   *
   * @returns {Buffer} Random salt buffer (32 bytes)
   */
  generateSalt() {
    return crypto.randomBytes(this.saltLength);
  }

  /**
   * Generate cryptographically secure random IV
   *
   * @returns {Buffer} Random IV buffer (16 bytes)
   */
  generateIV() {
    return crypto.randomBytes(this.ivLength);
  }

  /**
   * Derive encryption key from password using PBKDF2
   *
   * @param {string} password - Master password
   * @param {Buffer} salt - Salt for key derivation
   * @returns {Buffer} Derived key (32 bytes)
   * @throws {Error} If password or salt is invalid
   */
  deriveKey(password, salt) {
    // Validate inputs
    if (!password || typeof password !== 'string' || password.length === 0) {
      throw new Error('Password is required');
    }

    if (!Buffer.isBuffer(salt)) {
      throw new Error('Salt must be a Buffer');
    }

    // Derive key using PBKDF2
    return crypto.pbkdf2Sync(
      password,
      salt,
      this.iterations,
      this.keyLength,
      this.digest
    );
  }

  /**
   * Encrypt plaintext using AES-256-CBC
   *
   * @param {string} plaintext - Data to encrypt
   * @param {string} password - Master password
   * @returns {Object} Encrypted data object
   * @returns {string} returns.encrypted - Base64-encoded encrypted data
   * @returns {string} returns.iv - Base64-encoded IV
   * @returns {string} returns.salt - Base64-encoded salt
   * @returns {string} returns.algorithm - Encryption algorithm used
   * @throws {Error} If plaintext or password is invalid
   *
   * @example
   * const result = encryption.encrypt('my-api-key', 'password');
   * // {
   * //   encrypted: 'base64string',
   * //   iv: 'base64string',
   * //   salt: 'base64string',
   * //   algorithm: 'aes-256-cbc'
   * // }
   */
  encrypt(plaintext, password) {
    // Validate inputs
    if (plaintext === null || plaintext === undefined) {
      throw new Error('Plaintext is required');
    }

    if (!password || typeof password !== 'string' || password.length === 0) {
      throw new Error('Password is required');
    }

    // Convert plaintext to string if needed
    const plaintextStr = String(plaintext);

    // Generate random salt and IV
    const salt = this.generateSalt();
    const iv = this.generateIV();

    // Derive key from password
    const key = this.deriveKey(password, salt);

    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    // Encrypt data
    let encrypted = cipher.update(plaintextStr, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Return encrypted data object
    return {
      encrypted,
      iv: iv.toString('base64'),
      salt: salt.toString('base64'),
      algorithm: this.algorithm
    };
  }

  /**
   * Decrypt encrypted data using AES-256-CBC
   *
   * @param {Object} encryptedData - Encrypted data object from encrypt()
   * @param {string} encryptedData.encrypted - Base64-encoded encrypted data
   * @param {string} encryptedData.iv - Base64-encoded IV
   * @param {string} encryptedData.salt - Base64-encoded salt
   * @param {string} encryptedData.algorithm - Encryption algorithm
   * @param {string} password - Master password
   * @returns {string} Decrypted plaintext
   * @throws {Error} If data is invalid or password is wrong
   *
   * @example
   * const decrypted = encryption.decrypt(encryptedData, 'password');
   */
  decrypt(encryptedData, password) {
    // Validate inputs
    if (!encryptedData || typeof encryptedData !== 'object') {
      throw new Error('Encrypted data must be an object');
    }

    if (!encryptedData.encrypted) {
      throw new Error('Encrypted data is required');
    }

    if (!encryptedData.iv) {
      throw new Error('IV is required');
    }

    if (!encryptedData.salt) {
      throw new Error('Salt is required');
    }

    if (!encryptedData.algorithm || encryptedData.algorithm !== this.algorithm) {
      throw new Error('Invalid algorithm');
    }

    if (!password || typeof password !== 'string' || password.length === 0) {
      throw new Error('Password is required');
    }

    try {
      // Parse base64-encoded values
      const salt = Buffer.from(encryptedData.salt, 'base64');
      const iv = Buffer.from(encryptedData.iv, 'base64');

      // Derive key from password
      const key = this.deriveKey(password, salt);

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);

      // Decrypt data
      let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      // Don't leak password in error messages
      if (error.message.includes('bad decrypt')) {
        throw new Error('Decryption failed - wrong password or corrupted data');
      }
      throw error;
    }
  }
}

module.exports = Encryption;
