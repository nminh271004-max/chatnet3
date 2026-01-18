/**
 * DES Encryption Test Suite
 * WARNING: DES is cryptographically broken - this is for educational purposes only
 */

const CryptoJS = require('crypto-js');

/**
 * Encrypt using DES (ECB mode)
 */
function encryptDES(text, key) {
  if (!text) return '';
  try {
    const desKey = (key + '12345678').substring(0, 8);
    const encrypted = CryptoJS.DES.encrypt(text, CryptoJS.enc.Utf8.parse(desKey), {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.toString();
  } catch (error) {
    console.error('DES Encryption error:', error);
    return text;
  }
}

/**
 * Decrypt DES encrypted text
 */
function decryptDES(encryptedText, key) {
  if (!encryptedText) return '';
  try {
    const desKey = (key + '12345678').substring(0, 8);
    const decrypted = CryptoJS.DES.decrypt(encryptedText, CryptoJS.enc.Utf8.parse(desKey), {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('DES Decryption error:', error);
    return encryptedText;
  }
}

const testCases = [
  {
    name: 'Basic text encryption with DES key',
    text: 'Hello World',
    key: 'secret',
  },
  {
    name: 'Long text',
    text: 'The quick brown fox jumps over the lazy dog',
    key: 'mykey123',
  },
  {
    name: 'Special characters',
    text: 'Test@#$%^&*()',
    key: 'key12345',
  },
  {
    name: 'Unicode text',
    text: 'Hello 你好 🔐',
    key: 'unicode',
  },
  {
    name: 'Empty text',
    text: '',
    key: 'key',
  },
];

console.log('🔐 DES Encryption Test Suite');
console.log('⚠️  WARNING: DES is cryptographically broken and should NOT be used for sensitive data\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  try {
    const encrypted = encryptDES(testCase.text, testCase.key);
    const decrypted = decryptDES(encrypted, testCase.key);

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
  { text: 'secret message', key: 'pass1' },
  { text: 'secret message', key: 'pass2' },
  { text: 'secret message', key: 'differentkey' },
];

let keyTestsPassed = 0;

keyTests.forEach((test, index) => {
  const encrypted = encryptDES(test.text, test.key);
  const decrypted = decryptDES(encrypted, test.key);
  
  if (decrypted === test.text) {
    console.log(`✅ Key test ${index + 1}: Key="${test.key}" OK`);
    keyTestsPassed++;
    passed++;
  } else {
    console.log(`❌ Key test ${index + 1}: Key="${test.key}" FAILED`);
    failed++;
  }
});

// Test decryption with wrong key
console.log('\n🚫 Wrong Key Test:\n');

const text = 'secret data';
const key1 = 'correct';
const key2 = 'wrong';

const encrypted = encryptDES(text, key1);
const decryptedWrong = decryptDES(encrypted, key2);

if (decryptedWrong !== text) {
  console.log(`✅ Wrong key produces different output (as expected)`);
  passed++;
} else {
  console.log(`❌ Wrong key decrypted successfully (security issue!)`);
  failed++;
}

console.log(`\n📊 Total Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('✅ All DES tests passed! (but remember: DES is deprecated)\n');
} else {
  console.log('❌ Some tests failed\n');
}

// Export for use
module.exports = { encryptDES, decryptDES };
