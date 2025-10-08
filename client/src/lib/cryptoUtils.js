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

// ---------- Encrypt message for both sender and receiver ----------
export async function encryptMessage(message, recipientPublicKeyBase64, senderPublicKeyBase64 = null) {
  const recipientKey = await importPublicKey(recipientPublicKeyBase64);
  
  // Use provided sender public key or fall back to localStorage
  const senderPublicKey = senderPublicKeyBase64 || localStorage.getItem("publicKey");
  
  if (!senderPublicKey) {
    throw new Error("Sender public key not available");
  }
  
  const senderKey = await importPublicKey(senderPublicKey);
  
  

  // 1️⃣ Generate AES session key
  const aesKey = await generateAESKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM IV

  // 2️⃣ Encrypt message with AES
  const encryptedMessage = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    new TextEncoder().encode(message)
  );

  // 3️⃣ Encrypt AES key for both recipient and sender
  const exportedAES = await exportAESKey(aesKey);
  
  const encryptedAESForRecipient = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    recipientKey,
    new TextEncoder().encode(exportedAES)
  );

  const encryptedAESForSender = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    senderKey,
    new TextEncoder().encode(exportedAES)
  );

  const result = JSON.stringify({
    recipientAES: arrayBufferToBase64(encryptedAESForRecipient),
    senderAES: arrayBufferToBase64(encryptedAESForSender),
    iv: arrayBufferToBase64(iv),
    ciphertext: arrayBufferToBase64(encryptedMessage),
  });
  
  
  return result;
}

// ---------- Decrypt message (Hybrid RSA + AES-GCM) ----------
export async function decryptMessage(encryptedPayloadJSON, privateKeyBase64, isCurrentUser = false) {
  const privateKey = await importPrivateKey(privateKeyBase64);
  
  try {
    const payload = JSON.parse(encryptedPayloadJSON);
    
    // Handle old format (backward compatibility)
    if (payload.aes) {
      console.log("🔄 Using legacy decryption format");
      const { aes, iv, ciphertext } = payload;
      const decryptedAES = await crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        base64ToArrayBuffer(aes)
      );
      const aesKey = await importAESKey(new TextDecoder().decode(decryptedAES));
      const decryptedMessage = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: base64ToArrayBuffer(iv) },
        aesKey,
        base64ToArrayBuffer(ciphertext)
      );
      return new TextDecoder().decode(decryptedMessage);
    }
    
    // Handle new dual encryption format
    const { recipientAES, senderAES, iv, ciphertext } = payload;
    
    if (!recipientAES || !senderAES || !iv || !ciphertext) {
      throw new Error("Invalid encryption payload - missing required fields");
    }
    
    const aesToUse = isCurrentUser ? senderAES : recipientAES;
    console.log(`🔑 Using ${isCurrentUser ? 'sender' : 'recipient'} AES key for decryption`);
    
    // 1️⃣ Decrypt AES key
    const decryptedAES = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      base64ToArrayBuffer(aesToUse)
    );

    const aesKey = await importAESKey(new TextDecoder().decode(decryptedAES));

    // 2️⃣ Decrypt message
    const decryptedMessage = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToArrayBuffer(iv) },
      aesKey,
      base64ToArrayBuffer(ciphertext)
    );

    const result = new TextDecoder().decode(decryptedMessage);
    console.log(`✅ Successfully decrypted message: "${result.substring(0, 20)}..."`);
    return result;
  } catch (error) {
    console.error("🔴 Decryption error details:", {
      errorName: error.name,
      errorMessage: error.message,
      isCurrentUser,
      payloadKeys: Object.keys(JSON.parse(encryptedPayloadJSON || '{}'))
    });
    
    throw new Error(`Decryption failed: ${error.message}`);
  }
}
