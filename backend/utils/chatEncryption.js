const crypto = require('crypto');

class ChatEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16;  // 128 bits
    this.tagLength = 16; // 128 bits
  }

  // Generate a unique session key for a chat room
  generateSessionKey(roomId, user1Id, user2Id) {
    try {
      // Create a deterministic but unique key based on room participants
      const keyMaterial = `${roomId}_${user1Id}_${user2Id}_${process.env.JWT_SECRET || 'default_secret'}`;
      const hash = crypto.createHash('sha256').update(keyMaterial).digest();
      return hash;
    } catch (error) {
      throw new Error(`Failed to generate session key: ${error.message}`);
    }
  }

  // Encrypt a message with AES-256-GCM
  encryptMessage(message, sessionKey) {
    try {
      if (!message || !sessionKey) {
        throw new Error('Message and session key are required');
      }

      // Ensure sessionKey is a Buffer
      const keyBuffer = Buffer.isBuffer(sessionKey) ? sessionKey : Buffer.from(sessionKey, 'hex');
      
      // Generate random IV
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, keyBuffer, iv);
      
      // Encrypt the message
      let encrypted = cipher.update(message, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag
      const tag = cipher.getAuthTag();
      
      return {
        encrypted: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  // Decrypt a message with AES-256-GCM
  decryptMessage(encryptedData, sessionKey) {
    try {
      if (!encryptedData || !sessionKey) {
        throw new Error('Encrypted data and session key are required');
      }

      // Ensure sessionKey is a Buffer
      const keyBuffer = Buffer.isBuffer(sessionKey) ? sessionKey : Buffer.from(sessionKey, 'hex');
      
      // Parse IV and tag
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = Buffer.from(encryptedData.tag, 'hex');
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, keyBuffer, iv);
      decipher.setAuthTag(tag);
      
      // Decrypt the message
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  // Hash a message for integrity verification
  hashMessage(message) {
    try {
      if (!message) {
        throw new Error('Message is required for hashing');
      }
      return crypto.createHash('sha256').update(message).digest('hex');
    } catch (error) {
      throw new Error(`Hashing failed: ${error.message}`);
    }
  }

  // Verify message integrity
  verifyMessageIntegrity(message, expectedHash) {
    try {
      if (!message || !expectedHash) {
        return false;
      }
      const actualHash = this.hashMessage(message);
      return actualHash === expectedHash;
    } catch (error) {
      console.error('Message integrity verification failed:', error);
      return false;
    }
  }

  // Validate encryption parameters
  validateEncryptionParams(message, sessionKey) {
    if (!message || typeof message !== 'string') {
      throw new Error('Message must be a non-empty string');
    }
    if (!sessionKey) {
      throw new Error('Session key is required');
    }
    if (message.length > 10000) { // Reasonable limit for therapy chats
      throw new Error('Message too long (max 10,000 characters)');
    }
    return true;
  }

  // Test encryption/decryption cycle
  testEncryptionCycle() {
    try {
      console.log('Testing AES-256-GCM encryption/decryption cycle...');
      
      // Generate test session key
      const testSessionKey = crypto.randomBytes(this.keyLength);
      const testMessage = 'Hello, this is a test message for encryption!';
      
      console.log(`Test message: ${testMessage}`);
      console.log(`Test session key length: ${testSessionKey.length} bytes`);
      
      // Encrypt
      const encrypted = this.encryptMessage(testMessage, testSessionKey);
      console.log(`Encrypted data length: ${encrypted.encrypted.length} chars`);
      
      // Decrypt
      const decrypted = this.decryptMessage(encrypted, testSessionKey);
      console.log(`Decrypted message: ${decrypted}`);
      
      // Verify
      const isSuccess = testMessage === decrypted;
      console.log(`Encryption cycle test result: ${isSuccess ? 'SUCCESS' : 'FAILED'}`);
      
      return isSuccess;
    } catch (error) {
      console.error('Encryption cycle test failed:', error);
      return false;
    }
  }
}

module.exports = new ChatEncryption();
