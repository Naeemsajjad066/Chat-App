// utils/cryptoUtils.js

// ---------- Base64 Helpers ----------
function arrayBufferToBase64(buffer) {
  // buffer may be ArrayBuffer or TypedArray
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer.buffer || buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const buffer = new ArrayBuffer(len);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return buffer;
}

// ---------- RSA Key Generation ----------
export async function generateKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const publicKey = await exportKey(keyPair.publicKey);
  const privateKey = await exportKey(keyPair.privateKey);

  // Persist locally (your choice — secure storage recommended for production)
  localStorage.setItem("publicKey", publicKey);
  localStorage.setItem("privateKey", privateKey);

  return { publicKey, privateKey };
}

async function exportKey(key) {
  // export public = spki, private = pkcs8
  const format = key.type === "public" ? "spki" : "pkcs8";
  const exported = await crypto.subtle.exportKey(format, key);
  return arrayBufferToBase64(exported);
}

async function importPublicKey(base64) {
  return crypto.subtle.importKey(
    "spki",
    base64ToArrayBuffer(base64),
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

async function importPrivateKey(base64) {
  return crypto.subtle.importKey(
    "pkcs8",
    base64ToArrayBuffer(base64),
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
}

// ---------- AES Helpers ----------
async function generateAESKey() {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

async function exportAESKey(key) {
  const raw = await crypto.subtle.exportKey("raw", key); // ArrayBuffer
  return arrayBufferToBase64(raw); // base64 string of raw key
}

async function importAESKey(base64) {
  return crypto.subtle.importKey(
    "raw",
    base64ToArrayBuffer(base64),
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}

// ---------- Encrypt message (Hybrid RSA + AES-GCM) ----------
/**
 * message: string
 * participants: [{ userId: string, publicKeyBase64: string }, ...]
 *
 * returns: JSON string:
 * {
 *   keys: { [userId]: base64WrappedAES },
 *   iv: base64IV,
 *   ciphertext: base64Ciphertext
 * }
 */
export async function encryptMessage(message, participants) {
  // 1) Generate AES session key + IV
  const aesKey = await generateAESKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit for AES-GCM

  // 2) Encrypt plaintext with AES-GCM
  const encoder = new TextEncoder();
  const plaintextBuffer = encoder.encode(message);
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    plaintextBuffer
  );

  // 3) Export AES key (raw) as base64
  const exportedAESBase64 = await exportAESKey(aesKey); // base64 string

  // 4) Wrap (encrypt) the exported AES (base64 string) for each participant's public key
  // We will encrypt the UTF-8 bytes of the exported base64 string using RSA-OAEP.
  const encryptedKeys = {};
  for (const { userId, publicKeyBase64 } of participants) {
    const pubKey = await importPublicKey(publicKeyBase64);

    // Encrypt the base64 string bytes
    const wrappedForParticipant = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      pubKey,
      new TextEncoder().encode(exportedAESBase64)
    );

    encryptedKeys[userId] = arrayBufferToBase64(wrappedForParticipant);
  }

  // 5) Build payload and return as JSON string (so you can store it in `text` without schema change)
  const payload = {
    keys: encryptedKeys,
    iv: arrayBufferToBase64(iv),
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
  };

  return JSON.stringify(payload);
}

// ---------- Decrypt message (Hybrid RSA + AES-GCM) ----------
/**
 * encryptedPayloadJSON: JSON string returned by encryptMessage
 * privateKeyBase64: base64 of user's pkcs8 private key (from localStorage)
 * myUserId: string - current user's id to pick wrapped AES key
 *
 * returns: plaintext string
 */
export async function decryptMessage(encryptedPayloadJSON, privateKeyBase64, myUserId) {
  if (!encryptedPayloadJSON) throw new Error("No payload provided");
  const privateKey = await importPrivateKey(privateKeyBase64);

  const { keys, iv, ciphertext } = JSON.parse(encryptedPayloadJSON);

  if (!keys || !keys[myUserId]) throw new Error("No wrapped AES key for this user");

  // 1) RSA-OAEP decrypt to get exported AES base64 string (the exporter encoded base64 string bytes)
  const wrappedBase64Buffer = base64ToArrayBuffer(keys[myUserId]);
  const decryptedExportedAESBuffer = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    wrappedBase64Buffer
  );

  // Convert decrypted bytes -> base64 string
  const exportedAESBase64 = new TextDecoder().decode(decryptedExportedAESBuffer);

  // 2) import AES key from base64 then decrypt ciphertext
  const aesKey = await importAESKey(exportedAESBase64);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToArrayBuffer(iv) },
    aesKey,
    base64ToArrayBuffer(ciphertext)
  );

  return new TextDecoder().decode(decryptedBuffer);
}
