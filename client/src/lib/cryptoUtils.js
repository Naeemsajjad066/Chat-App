// utils/cryptoUtils.js

// ---------- Base64 Helpers ----------
function arrayBufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
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

  localStorage.setItem("publicKey", publicKey);
  localStorage.setItem("privateKey", privateKey);

  return { publicKey, privateKey };
}

async function exportKey(key) {
  const exported = await crypto.subtle.exportKey(
    key.type === "public" ? "spki" : "pkcs8",
    key
  );
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
  const raw = await crypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(raw);
}

async function importAESKey(base64) {
  return crypto.subtle.importKey(
    "raw",
    base64ToArrayBuffer(base64),
    "AES-GCM",
    true,
    ["encrypt", "decrypt"]
  );
}

// ---------- Encrypt message (Hybrid RSA + AES-GCM) ----------
export async function encryptMessage(message, recipientPublicKeyBase64) {
  const recipientKey = await importPublicKey(recipientPublicKeyBase64);

  // 1️⃣ Generate AES session key
  const aesKey = await generateAESKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM IV

  // 2️⃣ Encrypt message with AES
  const encryptedMessage = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    new TextEncoder().encode(message)
  );

  // 3️⃣ Encrypt AES key with recipient's RSA public key
  const exportedAES = await exportAESKey(aesKey);
  const encryptedAES = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    recipientKey,
    new TextEncoder().encode(exportedAES)
  );

  return JSON.stringify({
    aes: arrayBufferToBase64(encryptedAES),
    iv: arrayBufferToBase64(iv),
    ciphertext: arrayBufferToBase64(encryptedMessage),
  });
}

// ---------- Decrypt message (Hybrid RSA + AES-GCM) ----------
export async function decryptMessage(encryptedPayloadJSON, privateKeyBase64) {
  const privateKey = await importPrivateKey(privateKeyBase64);
  const { aes, iv, ciphertext } = JSON.parse(encryptedPayloadJSON);

  // 1️⃣ Decrypt AES key
  const decryptedAES = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    base64ToArrayBuffer(aes)
  );

  const aesKey = await importAESKey(new TextDecoder().decode(decryptedAES));

  // 2️⃣ Decrypt message
  const decryptedMessage = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToArrayBuffer(iv) },
    aesKey,
    base64ToArrayBuffer(ciphertext)
  );

  return new TextDecoder().decode(decryptedMessage);
}
