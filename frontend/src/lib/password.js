// Hash de contraseñas con PBKDF2-SHA256 (WebCrypto). El backend verifica el mismo formato.
// Formato: pbkdf2$<iteraciones>$<sal base64>$<hash base64>

const ITERATIONS = 60000;
const enc = new TextEncoder();
const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export const isHashed = (pw) => typeof pw === "string" && (pw.startsWith("pbkdf2$") || /^\$2[aby]\$/.test(pw));
export const canHash = () => Boolean(globalThis.crypto?.subtle);

async function derive(plain, salt, iterations) {
  const key = await crypto.subtle.importKey("raw", enc.encode(plain), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
}

const sameString = (a, b) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

/**
 * Devuelve el hash de la contraseña. Si el navegador no expone WebCrypto
 * (página servida por http en una IP de red), devuelve el texto tal cual y el
 * backend lo convierte a bcrypt al guardarlo.
 */
export async function hashPassword(plain) {
  if (!canHash()) return plain;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await derive(plain, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toB64(salt)}$${toB64(bits)}`;
}

export async function verifyPassword(plain, stored) {
  if (!stored || typeof plain !== "string") return false;
  if (stored.startsWith("pbkdf2$")) {
    if (!canHash()) return false;
    const [, iter, salt, hash] = stored.split("$");
    const bits = await derive(plain, fromB64(salt), Number(iter));
    return sameString(toB64(bits), hash);
  }
  if (isHashed(stored)) return false; // bcrypt: solo lo verifica el servidor
  return sameString(plain, stored);
}
