require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { getState, setState, storageName } = require("./state");
const { requireAuth, loginRateLimit } = require("./auth");
const { verifyPassword, hashPassword } = require("./password");
const { isAdminRole, publicState, mergeState } = require("./stateRules");

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("❌ Define JWT_SECRET (mínimo 32 caracteres) en backend/.env. Genera uno con:");
  console.error("   node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"");
  process.exit(1);
}

const app = express();
app.set("trust proxy", 1);

// CORS_ORIGIN: lista separada por comas (p. ej. https://usuario.github.io). Sin definir = cualquier origen.
const origins = (process.env.CORS_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
app.use(cors(origins.length ? { origin: origins } : {}));
app.use(express.json({ limit: "10mb" }));

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const NOT_READY = { error: "Base de datos no inicializada. Ejecute la semilla: npm run db:seed" };
const limiter = loginRateLimit();

app.get("/", (_, res) => res.json({ ok: true, name: "AcademiQ API" }));
app.get("/api/health", (_, res) => res.json({ ok: true }));

app.post("/api/auth/login", limiter.check, asyncHandler(async (req, res) => {
  const { role, user, pass } = req.body || {};
  if (!role || !user || !pass) return res.status(400).json({ error: "Completa usuario y contraseña." });

  const state = await getState();
  if (!state) return res.status(503).json(NOT_READY);

  const q = String(user).trim().toLowerCase();
  const eq = (v) => typeof v === "string" && v.toLowerCase() === q;

  let account;
  if (role === "student") {
    account = (state.students || []).find((s) => eq(s.username) || eq(s.email));
    if (account && account.status === "inactive") return res.status(403).json({ error: "Tu usuario está inactivo. Consulta con la Dirección." });
  } else {
    // El botón "Director" envía role=admin y acepta cuentas admin o director.
    const roleOk = (r) => (role === "admin" ? isAdminRole(r) : r === role);
    account = (state.users || []).find((u) => roleOk(u.role) && (eq(u.email) || eq(u.username) || eq(u.name)));
  }

  if (!account || !(await verifyPassword(String(pass), account.password))) {
    limiter.fail(req);
    return res.status(401).json({ error: "Credenciales incorrectas." });
  }
  limiter.reset(req);

  const sessionRole = role === "student" ? "student" : account.role;
  const token = jwt.sign({ id: account.id, role: sessionRole, name: account.name }, process.env.JWT_SECRET, { expiresIn: "8h" });
  return res.json({ token });
}));

app.get("/api/state", requireAuth, asyncHandler(async (req, res) => {
  const state = await getState();
  if (!state) return res.status(503).json(NOT_READY);
  const visible = publicState(state, req.user);
  if (!visible) return res.status(401).json({ error: "El usuario ya no existe." });
  return res.json(visible);
}));

app.put("/api/state", requireAuth, asyncHandler(async (req, res) => {
  const stored = await getState();
  if (!stored) return res.status(503).json(NOT_READY);
  const merged = await mergeState(stored, req.body, req.user, hashPassword);
  await setState(merged);
  return res.json({ ok: true });
}));

app.use((err, _req, res, _next) => {
  if (err.status && err.status < 500) return res.status(err.status).json({ error: err.message });
  console.error(err);
  return res.status(500).json({ error: "Error interno del servidor" });
});

// Limpieza única: versiones anteriores guardaban "passwordPlain" (contraseña en texto plano).
async function removePlainPasswords() {
  const state = await getState();
  if (!state) return;
  const strip = (list = []) => list.map(({ passwordPlain, ...rest }) => rest);
  const dirty = [...(state.users || []), ...(state.students || [])].some((a) => "passwordPlain" in a);
  if (!dirty) return;
  await setState({ ...state, users: strip(state.users), students: strip(state.students) });
  console.log("🔒 Se eliminaron contraseñas en texto plano del estado guardado.");
}

if (require.main === module) {
  const port = process.env.PORT || 3000;
  removePlainPasswords()
    .catch((e) => console.error("No se pudo revisar el estado guardado:", e.message))
    .finally(() => {
      app.listen(port, () => console.log(`AcademiQ API en http://localhost:${port} (almacenamiento: ${storageName()})`));
    });
}

module.exports = app;
