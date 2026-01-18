/**
 * RSA-like Encryption Utility
 * Simplified implementation using AES for actual encryption
 * Suitable for symmetric key exchange scenario
 * 
 * NOTE: This is NOT true RSA. For production asymmetric encryption,
 * use 'react-native-rsa-native' or 'rsa-js' library.
 */

const CryptoJS = require('crypto-js');

/**
 * Encrypt using RSA-like method (actually AES with key derivation)
 * Similar security concept but uses symmetric encryption for compatibility
 */
export const encryptRSA = (text: string, publicKey: string = ''): string => {
  if (!text) return '';

  try {
    // Use provided key or default
    const key = publicKey || 'default-rsa-key';
    
    // Derive encryption key using SHA-256
    const derivedKey = CryptoJS.SHA256(key + 'rsa-salt');
    
    // Generate random IV
    const iv = CryptoJS.lib.WordArray.random(16);
    
    // Encrypt message using AES-256-CBC
    const encrypted = CryptoJS.AES.encrypt(text, derivedKey, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const ivBase64 = CryptoJS.enc.Base64.stringify(iv);
    const cipherBase64 = encrypted.ciphertext.toString(CryptoJS.enc.Base64);

    // Return format: ivBase64:cipherBase64
    return ivBase64 + ':' + cipherBase64;
  } catch (error) {
    console.error('RSA Encryption error:', error);
    return text;
  }
};

/**
 * Decrypt using RSA-like method
 */
export const decryptRSA = (encryptedText: string, privateKey: string = ''): string => {
  if (!encryptedText) return '';

  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) return encryptedText;

    // Use provided key or default
    const key = privateKey || 'default-rsa-key';
    
    // Derive same encryption key
    const derivedKey = CryptoJS.SHA256(key + 'rsa-salt');
    
    // Parse IV and ciphertext
    const iv = CryptoJS.enc.Base64.parse(parts[0]);
    const cipherParams = CryptoJS.enc.Base64.parse(parts[1]);

    // Decrypt
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: cipherParams } as any,
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
};

/**
 * Validate RSA key format
 */
export const isValidRSAKey = (key: string): boolean => {
  return !!(key && key.length > 0 && key.length <= 32);
};

/**
 * Get default RSA key
 */
export const getDefaultRSAKey = (): string => {
  return 'default-rsa-key';
};

/**
 * Generate RSA key pair (simplified - returns same key for demo)
 * In production, use proper RSA library
 */
export const generateRSAKeyPair = (): { publicKey: string; privateKey: string } => {
  const key = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Base64);
  return {
    publicKey: key,
    privateKey: key, // In real RSA, these would be different
  };
};
