/**
 * Caesar Cipher Test Suite
 * Tests the Caesar cipher implementation
 */

// Caesar cipher implementation (copied from src/utils/caesarCipher.ts)
const encryptCaesar = (text, shift) => {
  if (!text) return '';
  
  shift = ((shift % 26) + 26) % 26;
  
  return text
    .split('')
    .map(char => {
      const code = char.charCodeAt(0);
      
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(((code - 65 + shift) % 26) + 65);
      }
      
      if (code >= 97 && code <= 122) {
        return String.fromCharCode(((code - 97 + shift) % 26) + 97);
      }
      
      // Don't shift numbers in Caesar cipher (standard behavior)
      // if (code >= 48 && code <= 57) {
      //   return String.fromCharCode(((code - 48 + shift) % 10) + 48);
      // }
      
      return char;
    })
    .join('');
};

const decryptCaesar = (text, shift) => {
  if (!text) return '';
  return encryptCaesar(text, -shift);
};

const isValidKey = (key) => {
  const numKey = parseInt(key, 10);
  return !isNaN(numKey) && numKey > 0 && numKey <= 25;
};

const parseKey = (key) => {
  return parseInt(key, 10) || 0;
};

const testCases = [
  {
    name: 'Basic encryption with shift 3',
    text: 'hello',
    shift: 3,
    expected: 'khoor',
  },
  {
    name: 'Uppercase letters with shift 1',
    text: 'HELLO',
    shift: 1,
    expected: 'IFMMP',
  },
  {
    name: 'Mixed case with shift 5',
    text: 'Hello World',
    shift: 5,
    expected: 'Mjqqt Btwqi',
  },
  {
    name: 'Numbers with shift 2',
    text: 'abc123xyz',
    shift: 2,
    expected: 'cde123zab',
  },
  {
    name: 'Special characters preserved',
    text: 'Hello, World!',
    shift: 1,
    expected: 'Ifmmp, Xpsme!',
  },
  {
    name: 'Wrap around alphabet',
    text: 'xyz',
    shift: 3,
    expected: 'abc',
  },
  {
    name: 'Negative shift (decrypt)',
    text: 'khoor',
    shift: -3,
    expected: 'hello',
  },
  {
    name: 'Shift 26 (no change)',
    text: 'hello',
    shift: 26,
    expected: 'hello',
  },
];

console.log('🔐 Caesar Cipher Test Suite\n');
let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  try {
    const encrypted = encryptCaesar(testCase.text, testCase.shift);
    
    if (encrypted === testCase.expected) {
      console.log(`✅ Test ${index + 1}: ${testCase.name}`);
      passed++;
    } else {
      console.log(`❌ Test ${index + 1}: ${testCase.name}`);
      console.log(`   Input: "${testCase.text}" with shift ${testCase.shift}`);
      console.log(`   Expected: "${testCase.expected}"`);
      console.log(`   Got: "${encrypted}"`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ Test ${index + 1}: ${testCase.name} - ERROR`);
    console.log(`   ${error.message}`);
    failed++;
  }
});

// Test roundtrip (encrypt then decrypt)
console.log('\n🔄 Roundtrip Tests (Encrypt → Decrypt):\n');

const roundtripTests = [
  { text: 'Hello, World!', shift: 5 },
  { text: 'The quick brown fox', shift: 13 },
  { text: 'ChatNET123', shift: 7 },
];

roundtripTests.forEach((test, index) => {
  const encrypted = encryptCaesar(test.text, test.shift);
  const decrypted = decryptCaesar(encrypted, test.shift);
  
  if (decrypted === test.text) {
    console.log(`✅ Roundtrip ${index + 1}: OK`);
    passed++;
  } else {
    console.log(`❌ Roundtrip ${index + 1}: FAILED`);
    console.log(`   Original: "${test.text}"`);
    console.log(`   After roundtrip: "${decrypted}"`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

// Export for use in other tests
module.exports = { encryptCaesar, decryptCaesar, isValidKey, parseKey };
