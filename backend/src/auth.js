const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Falta el token de sesión" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: "Sesión inválida o expirada" });
  }
}

/** Limita intentos de login por IP (en memoria): `max` intentos fallidos cada `windowMs`. */
function loginRateLimit({ max = 10, windowMs = 15 * 60 * 1000 } = {}) {
  const hits = new Map();
  return {
    check(req, res, next) {
      const now = Date.now();
      const entry = hits.get(req.ip);
      if (entry && now - entry.start < windowMs && entry.count >= max) {
        res.set("Retry-After", String(Math.ceil((entry.start + windowMs - now) / 1000)));
        return res.status(429).json({ error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." });
      }
      return next();
    },
    fail(req) {
      const now = Date.now();
      const entry = hits.get(req.ip);
      if (!entry || now - entry.start >= windowMs) hits.set(req.ip, { start: now, count: 1 });
      else entry.count += 1;
    },
    reset(req) {
      hits.delete(req.ip);
    },
  };
}

module.exports = { requireAuth, loginRateLimit };
