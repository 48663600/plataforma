// Verificación de contraseñas: acepta bcrypt ($2…) y PBKDF2 (formato del frontend).
const crypto = require("crypto");
const bcrypt = require("bcrypt");

async function verifyPassword(plain, stored) {
  if (typeof plain !== "string" || typeof stored !== "string" || !stored) return false;
  if (/^\$2[aby]\$/.test(stored)) return bcrypt.compare(plain, stored);
  if (stored.startsWith("pbkdf2$")) {
    const [, iter, salt, hash] = stored.split("$");
    const expected = Buffer.from(hash, "base64");
    const actual = crypto.pbkdf2Sync(plain, Buffer.from(salt, "base64"), Number(iter), expected.length, "sha256");
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  }
  return false; // nunca se aceptan contraseñas guardadas en texto plano
}

const hashPassword = (plain) => bcrypt.hash(plain, 10);

module.exports = { verifyPassword, hashPassword };
