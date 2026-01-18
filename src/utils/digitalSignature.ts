import crypto from 'crypto';

/**
 * Digital Signature Module
 * Sử dụng RSA-like signature based on HMAC-SHA256
 * Format: signature:message
 */

interface KeyPair {
  publicKey: string;
  privateKey: string;
}

/**
 * Tạo cặp khoá công khai và riêng tư
 * @param seed - Seed để tạo key (1-32 ký tự)
 * @returns Cặp khoá công khai và riêng tư
 */
export function generateKeyPair(seed: string): KeyPair {
  if (!seed || seed.length < 1 || seed.length > 32) {
    throw new Error('Seed must be 1-32 characters');
  }

  // Hash seed để tạo private key
  const privateKeyHash = crypto.createHash('sha256').update(seed + 'private').digest('hex');
  // Public key = hash của private key
  const publicKeyHash = crypto.createHash('sha256').update(privateKeyHash + 'public').digest('hex');

  return {
    publicKey: publicKeyHash.substring(0, 32),
    privateKey: privateKeyHash.substring(0, 32),
  };
}

/**
 * Ký một tin nhắn bằng khoá riêng tư
 * @param message - Tin nhắn cần ký
 * @param privateKey - Khoá riêng tư (1-32 ký tự)
 * @returns Chữ kí số (format: signature:message)
 */
export function sign(message: string, privateKey: string): string {
  if (!message) {
    throw new Error('Message cannot be empty');
  }

  if (!privateKey || privateKey.length < 1 || privateKey.length > 32) {
    throw new Error('Private key must be 1-32 characters');
  }

  // Tạo chữ kí bằng HMAC-SHA256
  const signature = crypto
    .createHmac('sha256', privateKey + 'sign_salt')
    .update(message)
    .digest('hex')
    .substring(0, 64);

  // Format: signature:message
  return `${signature}:${message}`;
}

/**
 * Kiểm tra chữ kí số bằng khoá công khai
 * @param signedMessage - Tin nhắn đã ký (format: signature:message)
 * @param publicKey - Khoá công khai (1-32 ký tự)
 * @returns true nếu chữ kí hợp lệ, false nếu không
 */
export function verify(signedMessage: string, publicKey: string): boolean {
  if (!signedMessage || !signedMessage.includes(':')) {
    return false;
  }

  if (!publicKey || publicKey.length < 1 || publicKey.length > 32) {
    return false;
  }

  try {
    const parts = signedMessage.split(':');
    const [signature, ...messageParts] = parts;
    const message = messageParts.join(':'); // Tính toán lại để tránh lỗi split

    // Tái tạo chữ kí từ public key
    // Vì đây là symmetric signature, chúng ta sử dụng public key như một shared secret
    const recalculatedSignature = crypto
      .createHmac('sha256', publicKey + 'sign_salt')
      .update(message)
      .digest('hex')
      .substring(0, 64);

    // So sánh signature
    return signature === recalculatedSignature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Kiểm tra xem khoá công khai có hợp lệ không
 * @param publicKey - Khoá công khai
 * @returns true nếu hợp lệ
 */
export function isValidPublicKey(publicKey: string): boolean {
  return publicKey && publicKey.length >= 1 && publicKey.length <= 32;
}

/**
 * Kiểm tra xem khoá riêng tư có hợp lệ không
 * @param privateKey - Khoá riêng tư
 * @returns true nếu hợp lệ
 */
export function isValidPrivateKey(privateKey: string): boolean {
  return privateKey && privateKey.length >= 1 && privateKey.length <= 32;
}

/**
 * Lấy tin nhắn gốc từ signed message
 * @param signedMessage - Tin nhắn đã ký (format: signature:message)
 * @returns Tin nhắn gốc
 */
export function extractMessage(signedMessage: string): string {
  if (!signedMessage || !signedMessage.includes(':')) {
    return signedMessage;
  }

  const parts = signedMessage.split(':');
  const [, ...messageParts] = parts;
  return messageParts.join(':');
}

/**
 * Lấy chữ kí từ signed message
 * @param signedMessage - Tin nhắn đã ký (format: signature:message)
 * @returns Chữ kí (64 ký tự hex)
 */
export function extractSignature(signedMessage: string): string {
  if (!signedMessage || !signedMessage.includes(':')) {
    return '';
  }

  return signedMessage.split(':')[0];
}

export default {
  generateKeyPair,
  sign,
  verify,
  isValidPublicKey,
  isValidPrivateKey,
  extractMessage,
  extractSignature,
};
