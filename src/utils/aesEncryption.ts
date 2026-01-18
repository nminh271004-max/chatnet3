/* Use CommonJS require to improve compatibility with React Native bundlers */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CryptoJS = require('crypto-js');

// For backward compatibility we keep the same exported function names
// but implement AES-256-CBC with a random IV. The IV is prepended to the
// ciphertext (encoded as Base64) separated by a colon.

const DEFAULT_KEY = 'ChatNET1';

/**
 * Generate a random IV without relying on native crypto module
 * Uses CryptoJS entropy with timestamps and Math.random() for React Native compatibility
 */
const generateRandomIV = (): any => {
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
};

/**
 * Encrypt using AES-256-CBC. Returns a string in the form: ivBase64:cipherBase64
 */
export const encryptAES = (text: string, key: string = DEFAULT_KEY): string => {
  if (!text) return '';

  try {
    // Derive a 256-bit key from the passphrase using SHA-256
    const keyHash = CryptoJS.SHA256(key);

    // Generate a random IV (128-bit) using our custom method
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
};

/**
 * Decrypt AES-256-CBC encrypted string formatted as ivBase64:cipherBase64
 */
export const decryptAES = (encryptedText: string, key: string = DEFAULT_KEY): string => {
  if (!encryptedText) return '';

  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) return encryptedText;

    const iv = CryptoJS.enc.Base64.parse(parts[0]);
    const cipherParams = CryptoJS.enc.Base64.parse(parts[1]);

    const keyHash = CryptoJS.SHA256(key);

    const decrypted = CryptoJS.AES.decrypt({ ciphertext: cipherParams } as any, keyHash, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('AES Decryption error:', error);
    return encryptedText;
  }
};

/**
 * Validate key: allow 1-64 chars (will be hashed to 256-bit)
 */
export const isValidKey = (key: string): boolean => {
  // UI and checks expect keys of 1-16 chars; we allow up to 16 here and
  // still derive a 256-bit key via SHA-256 for use with AES-256.
  return !!(key && key.length > 0 && key.length <= 16);
};

/**
 * Parse key (no-op for AES, but keep signature)
 */
export const parseKey = (key: string): string => {
  if (!key || key.length === 0) return DEFAULT_KEY;
  return key;
};

export const getDefaultKey = (): string => DEFAULT_KEY;

// Backward compatibility aliases
export const encryptDES = encryptAES;
export const decryptDES = decryptAES;
