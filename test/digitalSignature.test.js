const {
  generateKeyPair,
  sign,
  verify,
  isValidPublicKey,
  isValidPrivateKey,
  extractMessage,
  extractSignature,
} = require('../src/utils/digitalSignature.js');

// Test utilities
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected "${expected}", got "${actual}"`);
  }
}

function assertTrue(value, message) {
  if (value !== true) {
    throw new Error(`${message || 'Assertion failed'}: expected true, got ${value}`);
  }
}

function assertFalse(value, message) {
  if (value !== false && value !== null && value !== undefined) {
    throw new Error(`${message || 'Assertion failed'}: expected false, got ${value}`);
  }
}

console.log('🔐 Digital Signature Tests');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Test 1: Generate key pair
test('Generate key pair with valid seed', () => {
  const keyPair = generateKeyPair('testkey123');
  assertTrue(keyPair.publicKey && keyPair.publicKey.length > 0, 'Public key should exist');
  assertTrue(keyPair.privateKey && keyPair.privateKey.length > 0, 'Private key should exist');
});

// Test 2: Generate key pair error handling
test('Generate key pair with empty seed throws error', () => {
  try {
    generateKeyPair('');
    throw new Error('Should have thrown error for empty seed');
  } catch (e) {
    if (!e.message.includes('Seed must be')) {
      throw e;
    }
  }
});

// Test 3: Generate key pair with too long seed
test('Generate key pair with seed > 32 chars throws error', () => {
  try {
    generateKeyPair('a'.repeat(33));
    throw new Error('Should have thrown error for seed > 32');
  } catch (e) {
    if (!e.message.includes('Seed must be')) {
      throw e;
    }
  }
});

// Test 4: Sign a message
test('Sign a simple message', () => {
  const { privateKey } = generateKeyPair('key123');
  const message = 'Hello, World!';
  const signed = sign(message, privateKey);
  assertTrue(signed.includes(':'), 'Signed message should contain colon separator');
  assertTrue(signed.includes(message), 'Signed message should include original message');
});

// Test 5: Sign and verify - valid signature
test('Verify a valid signature', () => {
  const key = generateKeyPair('key456');
  // Vì là HMAC-based, publicKey = privateKey (symmetric)
  const message = 'Test message 123';
  const signed = sign(message, key.privateKey);
  assertTrue(verify(signed, key.privateKey), 'Valid signature should verify successfully');
});

// Test 6: Verify invalid signature
test('Reject invalid signature', () => {
  const key = generateKeyPair('key789');
  const message = 'Test message 456';
  const signed = sign(message, key.privateKey);
  const tampered = signed.replace('Test', 'Hack');
  assertFalse(verify(tampered, key.privateKey), 'Tampered message should fail verification');
});

// Test 7: Verify with wrong key
test('Reject signature verified with wrong key', () => {
  const { privateKey: key1 } = generateKeyPair('key111');
  const { publicKey: key2 } = generateKeyPair('key222');
  const message = 'Secret message';
  const signed = sign(message, key1);
  assertFalse(verify(signed, key2), 'Different key should fail verification');
});

// Test 8: Sign and verify with unicode
test('Sign and verify unicode message', () => {
  const key = generateKeyPair('key_unicode');
  const message = '🔐 Tin nhắn bí mật! 你好世界 مرحبا';
  const signed = sign(message, key.privateKey);
  assertTrue(verify(signed, key.privateKey), 'Unicode message should sign and verify correctly');
});

// Test 9: Sign special characters
test('Sign and verify message with special characters', () => {
  const key = generateKeyPair('key_special');
  const message = '!@#$%^&*()_+-=[]{}|;:",.<>?/~`';
  const signed = sign(message, key.privateKey);
  assertTrue(verify(signed, key.privateKey), 'Special characters should sign and verify correctly');
});

// Test 10: Extract message from signed message
test('Extract message from signed message', () => {
  const { privateKey } = generateKeyPair('key_extract');
  const message = 'Original message content';
  const signed = sign(message, privateKey);
  assertEqual(extractMessage(signed), message, 'Extracted message should match original');
});

// Test 11: Extract signature
test('Extract signature from signed message', () => {
  const { privateKey } = generateKeyPair('key_sig');
  const message = 'Test for signature extraction';
  const signed = sign(message, privateKey);
  const signature = extractSignature(signed);
  assertTrue(signature.length === 64, 'Signature should be 64 characters');
  assertTrue(/^[a-f0-9]+$/.test(signature), 'Signature should be valid hex');
});

// Test 12: Sign empty message error
test('Sign empty message throws error', () => {
  try {
    const { privateKey } = generateKeyPair('key_test');
    sign('', privateKey);
    throw new Error('Should have thrown error for empty message');
  } catch (e) {
    if (!e.message.includes('Message cannot be empty')) {
      throw e;
    }
  }
});

// Test 13: Sign with invalid private key
test('Sign with invalid private key throws error', () => {
  try {
    sign('message', 'a'.repeat(33));
    throw new Error('Should have thrown error for invalid key');
  } catch (e) {
    if (!e.message.includes('Private key must be')) {
      throw e;
    }
  }
});

// Test 14: Validate public key
test('isValidPublicKey validates correctly', () => {
  assertTrue(isValidPublicKey('valid_key_123'), 'Valid key should return true');
  assertFalse(isValidPublicKey(null), 'Null key should return false');
  assertFalse(isValidPublicKey('a'.repeat(33)), 'Key > 32 chars should return false');
});

// Test 15: Validate private key
test('isValidPrivateKey validates correctly', () => {
  assertTrue(isValidPrivateKey('valid_key_456'), 'Valid key should return true');
  assertFalse(isValidPrivateKey(null), 'Null key should return false');
  assertFalse(isValidPrivateKey('a'.repeat(33)), 'Key > 32 chars should return false');
});

// Test 16: Message with colons
test('Handle message with colons correctly', () => {
  const key = generateKeyPair('key_colons');
  const message = 'Time: 10:30:45 - URL: http://example.com';
  const signed = sign(message, key.privateKey);
  assertTrue(verify(signed, key.privateKey), 'Message with colons should sign and verify correctly');
  assertEqual(extractMessage(signed), message, 'Message with colons should extract correctly');
});

// Test 17: Long message
test('Sign and verify very long message', () => {
  const key = generateKeyPair('key_long');
  const message = 'A'.repeat(5000) + ' Long message content here!';
  const signed = sign(message, key.privateKey);
  assertTrue(verify(signed, key.privateKey), 'Long message should sign and verify correctly');
  assertEqual(extractMessage(signed), message, 'Long message should extract correctly');
});

// Test 18: Same message, different signatures (due to different times/nonces) - This test shows deterministic behavior
test('Same message with same key produces same signature', () => {
  const key = generateKeyPair('key_deterministic');
  const message = 'Deterministic test message';
  const sig1 = sign(message, key.privateKey);
  const sig2 = sign(message, key.privateKey);
  assertEqual(sig1, sig2, 'Same message with same key should produce same signature');
});

// Print results
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('✅ All Digital Signature tests passed!');
  process.exit(0);
} else {
  console.log(`❌ ${failed} test(s) failed`);
  process.exit(1);
}
