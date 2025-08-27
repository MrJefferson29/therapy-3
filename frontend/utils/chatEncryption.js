import CryptoJS from 'crypto-js';

class FrontendChatEncryption {
  constructor() {
    this.algorithm = 'AES';
    this.keyLength = 256;
  }

  // Generate session key for a chat room (matches backend)
  generateSessionKey(roomId, user1Id, user2Id) {
    try {
      // Create deterministic key material (same as backend)
      const keyMaterial = `${roomId}_${user1Id}_${user2Id}_${process.env.EXPO_PUBLIC_JWT_SECRET || 'default_secret'}`;
      const hash = CryptoJS.SHA256(keyMaterial);
      return hash.toString(CryptoJS.enc.Hex);
    } catch (error) {
      throw new Error(`Failed to generate session key: ${error.message}`);
    }
  }

  // Encrypt a message with AES-256
  encryptMessage(message, sessionKey) {
    try {
      if (!message || !sessionKey) {
        throw new Error('Message and session key are required');
      }

      // Generate random IV
      const iv = CryptoJS.lib.WordArray.random(16);
      
      // Encrypt the message
      const encrypted = CryptoJS.AES.encrypt(message, sessionKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      return {
        encrypted: encrypted.toString(),
        iv: iv.toString(CryptoJS.enc.Hex)
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  // Decrypt a message with AES-256
  decryptMessage(encryptedData, sessionKey) {
    try {
      if (!encryptedData || !sessionKey) {
        throw new Error('Encrypted data and session key are required');
      }

      // Parse IV
      const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);
      
      // Decrypt the message
      const decrypted = CryptoJS.AES.decrypt(encryptedData.encrypted, sessionKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      return decrypted.toString(CryptoJS.enc.Utf8);
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
      return CryptoJS.SHA256(message).toString();
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

  // Decrypt message from backend format
  decryptBackendMessage(encryptedMessage, iv, tag, sessionKey) {
    try {
      // Since backend uses Node.js crypto and we use CryptoJS,
      // we need to handle the format conversion
      
      // For now, return a placeholder - in production you'd want to ensure
      // the encryption formats match exactly between frontend and backend
      
      // This is a temporary solution - the backend is encrypting but frontend
      // needs to decrypt using the same algorithm
      return `[Decrypted Message]`;
    } catch (error) {
      throw new Error(`Backend message decryption failed: ${error.message}`);
    }
  }

  // Test encryption/decryption cycle
  testEncryptionCycle() {
    try {
      console.log('Testing frontend encryption/decryption cycle...');
      
      const testMessage = 'Hello, this is a test message!';
      const testSessionKey = this.generateSessionKey('test_room', 'user1', 'user2');
      
      console.log(`Test message: ${testMessage}`);
      console.log(`Test session key: ${testSessionKey.substring(0, 20)}...`);
      
      // Encrypt
      const encrypted = this.encryptMessage(testMessage, testSessionKey);
      console.log(`Encrypted data length: ${encrypted.encrypted.length} chars`);
      
      // Decrypt
      const decrypted = this.decryptMessage(encrypted, testSessionKey);
      console.log(`Decrypted message: ${decrypted}`);
      
      // Verify
      const isSuccess = testMessage === decrypted;
      console.log(`Frontend encryption cycle test result: ${isSuccess ? 'SUCCESS' : 'FAILED'}`);
      
      return isSuccess;
    } catch (error) {
      console.error('Frontend encryption cycle test failed:', error);
      return false;
    }
  }
}

export default new FrontendChatEncryption();
