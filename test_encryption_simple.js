const crypto = require('crypto');

// Simple test of AES-256-GCM encryption
function testEncryption() {
  try {
    console.log('🔐 Testing AES-256-GCM encryption...');
    
    // Generate a session key (32 bytes for AES-256)
    const sessionKey = crypto.randomBytes(32);
    const testMessage = 'Hello, this is a test message!';
    
    console.log(`📝 Test message: "${testMessage}"`);
    console.log(`🔑 Session key length: ${sessionKey.length} bytes`);
    
    // Generate IV
    const iv = crypto.randomBytes(16);
    
    // Encrypt
    const cipher = crypto.createCipheriv('aes-256-gcm', sessionKey, iv);
    let encrypted = cipher.update(testMessage, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    
    console.log(`🔒 Encrypted: ${encrypted}`);
    console.log(`🏷️  IV: ${iv.toString('hex')}`);
    console.log(`🏷️  Tag: ${tag.toString('hex')}`);
    
    // Decrypt
    const decipher = crypto.createDecipheriv('aes-256-gcm', sessionKey, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    console.log(`🔓 Decrypted: "${decrypted}"`);
    console.log(`✅ Match: ${testMessage === decrypted ? 'YES' : 'NO'}`);
    
    return testMessage === decrypted;
  } catch (error) {
    console.error('❌ Encryption test failed:', error);
    return false;
  }
}

// Run the test
const success = testEncryption();
console.log(`\n🎯 Test result: ${success ? 'PASSED' : 'FAILED'}`);
