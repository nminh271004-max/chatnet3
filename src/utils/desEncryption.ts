/**
 * DES Encryption Utility
 * Note: DES is deprecated and NOT recommended for production use.
 * This is provided for educational purposes only.
 * Use AES-256 for secure encryption.
 */

const CryptoJS = require('crypto-js');

/**
 * Encrypt using DES (ECB mode with PKCS7 padding)
 * WARNING: DES is cryptographically broken and should not be used for sensitive data
 */
export const encryptDES = (text: string, key: string): string => {
  if (!text) return '';

  try {
    // DES requires exactly 8 bytes (64 bits) for the key
    // We'll derive it by taking first 8 chars or padding
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
};

/**
 * Decrypt DES encrypted string
 */
export const decryptDES = (encryptedText: string, key: string): string => {
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
};

/**
 * Validate DES key format
 */
export const isValidDESKey = (key: string): boolean => {
  return !!(key && key.length > 0 && key.length <= 16);
};
