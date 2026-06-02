/**
 * End-to-End Encryption (E2EE) Utility using Web Crypto API.
 * 
 * Supports:
 * - Generating RSA-OAEP Keypairs for users
 * - Exporting/Importing public keys (SPKI/JWK format)
 * - Generating ephemeral AES-GCM keys for messages
 * - Encrypting messages (AES-GCM)
 * - Wrapping AES keys with RSA-OAEP public keys
 * - Unwrapping AES keys and decrypting messages
 */

export interface E2EEPayload {
  iv: string; // Base64
  ciphertext: string; // Base64
  encryptedKeySender: string; // Base64
  encryptedKeyRecipient: string; // Base64
}

// Helper to convert ArrayBuffer to Base64
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/** Generate a new RSA-OAEP key pair for the user */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
}

/** Export Public Key to JWK string */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const jwk = await window.crypto.subtle.exportKey("jwk", key);
  return JSON.stringify(jwk);
}

/** Import Public Key from JWK string */
export async function importPublicKey(jwkString: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkString);
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
}

/** Export Private Key to JWK string (WARNING: Store securely) */
export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const jwk = await window.crypto.subtle.exportKey("jwk", key);
  return JSON.stringify(jwk);
}

/** Import Private Key from JWK string */
export async function importPrivateKey(jwkString: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkString);
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );
}

/** 
 * Encrypt a text message for a specific recipient. 
 * Requires both sender and recipient public keys so both can read history.
 */
export async function encryptMessage(
  text: string,
  senderPubKey: CryptoKey,
  recipientPubKey: CryptoKey
): Promise<E2EEPayload> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  // 1. Generate ephemeral AES-GCM key
  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // 2. Encrypt the actual message with AES-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertextBuf = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    data
  );

  // 3. Export the raw AES key material
  const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

  // 4. Encrypt the raw AES key with both public keys
  const encKeySenderBuf = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    senderPubKey,
    rawAesKey
  );
  
  const encKeyRecipientBuf = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    recipientPubKey,
    rawAesKey
  );

  // 5. Return all components as Base64
  return {
    iv: bufferToBase64(iv.buffer),
    ciphertext: bufferToBase64(ciphertextBuf),
    encryptedKeySender: bufferToBase64(encKeySenderBuf),
    encryptedKeyRecipient: bufferToBase64(encKeyRecipientBuf),
  };
}

/**
 * Decrypt a message.
 * @param payload The encrypted payload
 * @param myPrivateKey Your RSA Private Key
 * @param role Are you the 'sender' or 'recipient' of this message?
 */
export async function decryptMessage(
  payload: E2EEPayload,
  myPrivateKey: CryptoKey,
  role: 'sender' | 'recipient'
): Promise<string> {
  const encKeyB64 = role === 'sender' ? payload.encryptedKeySender : payload.encryptedKeyRecipient;
  const encKeyBuf = base64ToBuffer(encKeyB64);

  // 1. Decrypt the AES key
  const rawAesKeyBuf = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    myPrivateKey,
    encKeyBuf
  );

  // 2. Import the decrypted AES key
  const aesKey = await window.crypto.subtle.importKey(
    "raw",
    rawAesKeyBuf,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  // 3. Decrypt the ciphertext
  const ivBuf = base64ToBuffer(payload.iv);
  const ciphertextBuf = base64ToBuffer(payload.ciphertext);

  const decryptedDataBuf = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(ivBuf) },
    aesKey,
    ciphertextBuf
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedDataBuf);
}
