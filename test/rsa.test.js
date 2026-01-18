/**
 * RSA-like Encryption Test Suite
 * Tests simplified RSA implementation using AES
 * WARNING: This is NOT true RSA, only for educational purposes
 */

const CryptoJS = require('crypto-js');

/**
 * RSA-like encryption using AES
 */
function encryptRSA(text, publicKey = '') {
  if (!text) return '';
  try {
    const key = publicKey || 'default-rsa-key';
    const derivedKey = CryptoJS.SHA256(key + 'rsa-salt');
    const iv = CryptoJS.lib.WordArray.random(16);
    
    const encrypted = CryptoJS.AES.encrypt(text, derivedKey, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const ivBase64 = CryptoJS.enc.Base64.stringify(iv);
    const cipherBase64 = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
    return ivBase64 + ':' + cipherBase64;
  } catch (error) {
    console.error('RSA Encryption error:', error);
    return text;
  }
}

/**
 * RSA-like decryption using AES
 */
function decryptRSA(encryptedText, privateKey = '') {
  if (!encryptedText) return '';
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) return encryptedText;

    const key = privateKey || 'default-rsa-key';
    const derivedKey = CryptoJS.SHA256(key + 'rsa-salt');
    
    const iv = CryptoJS.enc.Base64.parse(parts[0]);
    const cipherParams = CryptoJS.enc.Base64.parse(parts[1]);

    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: cipherParams },
      derivedKey,
      {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('RSA Decryption error:', error);
    return encryptedText;
  }
}

const testCases = [
  {
    name: 'Basic text encryption with RSA',
    text: 'Hello RSA World',
    key: '',
  },
  {
    name: 'Long message with RSA',
    text: 'The quick brown fox jumps over the lazy dog. This is a test of RSA encryption.',
    key: '',
  },
  {
    name: 'Special characters',
    text: 'Test@#$%^&*() with RSA',
    key: '',
  },
  {
    name: 'Unicode text with RSA',
    text: 'Hello RSA 你好 🔐',
    key: '',
  },
  {
    name: 'Empty text',
    text: '',
    key: '',
  },
];

console.log('🔐 RSA-like Encryption Test Suite');
console.log('⚠️  WARNING: Simplified implementation (not true RSA)\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  try {
    const encrypted = encryptRSA(testCase.text, testCase.key);
    const decrypted = decryptRSA(encrypted, testCase.key);

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

// Test with different keys
console.log('\n🔑 Key Variation Tests:\n');

const keyTests = [
  { text: 'secure message', pubKey: 'key1', privKey: 'key1' },
  { text: 'secure message', pubKey: 'key2', privKey: 'key2' },
  { text: 'secure message', pubKey: 'longkeyname123', privKey: 'longkeyname123' },
];

keyTests.forEach((test, index) => {
  const encrypted = encryptRSA(test.text, test.pubKey);
  const decrypted = decryptRSA(encrypted, test.privKey);
  
  if (decrypted === test.text) {
    console.log(`✅ Key test ${index + 1}: Pub="${test.pubKey}" Priv="${test.privKey}" OK`);
    passed++;
  } else {
    console.log(`❌ Key test ${index + 1}: FAILED`);
    failed++;
  }
});

// Test mismatched keys
console.log('\n🚫 Mismatched Key Test:\n');

const text = 'secret data';
const encrypted = encryptRSA(text, 'correct-key');
const decryptedWrong = decryptRSA(encrypted, 'wrong-key');

if (decryptedWrong !== text) {
  console.log(`✅ Mismatched keys produce different output (as expected)`);
  passed++;
} else {
  console.log(`❌ Wrong key decrypted successfully (security issue!)`);
  failed++;
}

console.log(`\n📊 Total Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('✅ All RSA-like tests passed!\n');
}

module.exports = { encryptRSA, decryptRSA };
