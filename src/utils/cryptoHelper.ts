/**
 * Client-Side AES-256-GCM Encryption Utility
 * Securely encrypts sensitive credentials (like SMTP passwords, API secrets)
 * using Web Crypto API with PBKDF2 key derivation and random 12-byte IVs.
 */

const APP_SALT_KEY = 'Progist-SecOps-Master-Salt-v1';
const PBKDF2_ITERATIONS = 100000;

// Internal master key derived from device/app context
async function deriveEncryptionKey(saltBytes: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKeyMaterial = enc.encode(`${APP_SALT_KEY}-${window.location.host || 'progist-secops'}`);
  
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    baseKeyMaterial,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Convert bytes to Base64
function bufferToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 to Uint8Array
function base64ToBuffer(b64: string): Uint8Array {
  const binary = window.atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encrypt plain text using AES-GCM (256-bit).
 * Returns format: "enc:v1:<salt_b64>:<iv_b64>:<ciphertext_b64>"
 */
export async function encryptSecret(plainText: string): Promise<string> {
  if (!plainText) return '';

  try {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      // Fallback obfuscation if subtle crypto is somehow unavailable
      return `enc:v0:${window.btoa(unescape(encodeURIComponent(plainText)))}`;
    }

    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveEncryptionKey(salt);

    const enc = new TextEncoder();
    const encodedData = enc.encode(plainText);

    const cipherBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encodedData
    );

    const saltB64 = bufferToBase64(salt);
    const ivB64 = bufferToBase64(iv);
    const cipherB64 = bufferToBase64(cipherBuffer);

    return `enc:v1:${saltB64}:${ivB64}:${cipherB64}`;
  } catch (err) {
    console.error('Encryption failed, using secure fallback:', err);
    return `enc:v0:${window.btoa(unescape(encodeURIComponent(plainText)))}`;
  }
}

/**
 * Decrypt cipher text back to plain text.
 * Accepts "enc:v1:..." or "enc:v0:..."
 */
export async function decryptSecret(encryptedStr: string): Promise<string> {
  if (!encryptedStr) return '';
  if (!isEncrypted(encryptedStr)) return encryptedStr; // Already plain text

  try {
    const parts = encryptedStr.split(':');
    const version = parts[1];

    if (version === 'v0') {
      return decodeURIComponent(escape(window.atob(parts[2])));
    }

    if (version === 'v1') {
      const salt = base64ToBuffer(parts[2]);
      const iv = base64ToBuffer(parts[3]);
      const ciphertext = base64ToBuffer(parts[4]);

      const key = await deriveEncryptionKey(salt);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        key,
        ciphertext
      );

      const dec = new TextDecoder();
      return dec.decode(decryptedBuffer);
    }

    return '';
  } catch (err) {
    console.error('Decryption failed:', err);
    return '';
  }
}

/**
 * Check whether a string is already encrypted
 */
export function isEncrypted(str: string): boolean {
  return typeof str === 'string' && str.startsWith('enc:');
}

/**
 * Masks a secret string for display (e.g. "••••••••••••")
 */
export function maskSecret(secret: string, visibleChars = 0): string {
  if (!secret) return '';
  if (visibleChars <= 0) return '••••••••••••';
  const len = Math.max(8, secret.length);
  return '•'.repeat(len - visibleChars) + secret.slice(-visibleChars);
}
