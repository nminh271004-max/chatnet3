/**
 * AES-256-CBC Encryption Test Suite
 * Tests the encryption/decryption implementation used in ChatNET
 */

const CryptoJS = require('crypto-js');

/**
 * Generate a random IV without relying on native crypto module
 * Uses CryptoJS entropy with timestamps and Math.random() for React Native compatibility
 */
function generateRandomIV() {
  // Create random bytes using CryptoJS and Math.random()
  // Combine timestamp, Math.random(), and additional entropy
  const timestamp = Date.now().toString(36);
  const randomPart1 = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  const randomPart3 = Math.random().toString(36).substring(2, 15);
  
  const entropy = timestamp + randomPart1 + randomPart2 + randomPart3;
  
  // Hash it to get more uniform random distribution
  const hash = CryptoJS.SHA256(entropy).toString();
  
  // Take first 32 hex chars (16 bytes = 128 bits) for IV
  const ivHex = hash.substring(0, 32);
  
  // Convert hex to WordArray
  return CryptoJS.enc.Hex.parse(ivHex);
}

/**
 * Encrypt text using AES-256-CBC
 * Returns format: ivBase64:cipherBase64
 */
function encryptAES(text, key) {
  if (!text) return '';
  try {
    const keyHash = CryptoJS.SHA256(key);
    const iv = generateRandomIV();
    const encrypted = CryptoJS.AES.encrypt(text, keyHash, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const ivBase64 = CryptoJS.enc.Base64.stringify(iv);
    const cipherBase64 = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
    return ivBase64 + ':' + cipherBase64;
  } catch (error) {
    console.error('AES Encryption error:', error);
    return text;
  }
}

/**
 * Decrypt AES-256-CBC encrypted text
 * Expects format: ivBase64:cipherBase64
 */
function decryptAES(encryptedText, key) {
  if (!encryptedText) return '';
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      console.error('Invalid encrypted format');
      return encryptedText;
    }
    const iv = CryptoJS.enc.Base64.parse(parts[0]);
    const cipherParams = CryptoJS.enc.Base64.parse(parts[1]);
    const keyHash = CryptoJS.SHA256(key);
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: cipherParams },
      keyHash,
      {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('AES Decryption error:', error);
    return encryptedText;
  }
}

// Test cases
const testCases = [
  {
    name: 'Basic text encryption',
    text: 'Hello, World!',
    key: 'ChatNET1',
  },
  {
    name: 'Long text with special chars',
    text: 'The quick brown fox jumps over the lazy dog! @#$%^&*()',
    key: 'ChatNET1',
  },
  {
    name: 'Unicode text',
    text: 'Xin chào, ChatNET! 你好世界 🔐',
    key: 'ChatNET1',
  },
  {
    name: 'Different key',
    text: 'Secret message',
    key: 'MySecurePassword123',
  },
  {
    name: 'Empty text',
    text: '',
    key: 'ChatNET1',
  },
  {
    name: 'Very long text',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10),
    key: 'ChatNET1',
  },
];

// Run tests
console.log('🧪 Starting AES-256-CBC Test Suite\n');
let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  try {
    const encrypted = encryptAES(testCase.text, testCase.key);
    const decrypted = decryptAES(encrypted, testCase.key);

    if (decrypted === testCase.text) {
      console.log(`✅ Test ${index + 1}: ${testCase.name}`);
      passed++;
    } else {
      console.log(`❌ Test ${index + 1}: ${testCase.name}`);
      console.log(`   Expected: "${testCase.text}"`);
      console.log(`   Got: "${decrypted}"`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ Test ${index + 1}: ${testCase.name} - ERROR`);
    console.log(`   ${error.message}`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

// Export for use in other tests
module.exports = { encryptAES, decryptAES };
