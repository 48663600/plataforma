// "Backend" que corre en el navegador (modo demostración / GitHub Pages).
// Guarda todo en localStorage y aplica las mismas reglas de acceso que el servidor.
import { INIT_DATA } from "../data/initialData.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { isAdminRole } from "../lib/roles.js";
import { publicState, mergeState, AccessError } from "../lib/stateRules.js";

const STATE_KEY = "academiq_demo_state_v1";
const SESSION_HOURS = 8;

const fail = (status, message) => {
  throw new AccessError(status, message);
};

const readStored = () => {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeStored = (state) => {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    fail(507, "El navegador no permitió guardar los datos (almacenamiento lleno o bloqueado).");
  }
};

async function hashAccounts(list = []) {
  return Promise.all(list.map(async (a) => ({ ...a, password: await hashPassword(a.password) })));
}

async function buildDemoState() {
  const base = JSON.parse(JSON.stringify(INIT_DATA));
  return { ...base, users: await hashAccounts(base.users), students: await hashAccounts(base.students) };
}

let ready = null;
async function getStored() {
  const current = readStored();
  if (current) return current;
  if (!ready) {
    ready = buildDemoState().then((s) => {
      writeStored(s);
      return s;
    });
  }
  const s = await ready;
  ready = null;
  return s;
}

const encodeToken = (session) => btoa(encodeURIComponent(JSON.stringify(session)));
function decodeToken(token) {
  try {
    const s = JSON.parse(decodeURIComponent(atob(token)));
    if (!s?.id || !s?.role || Date.now() > s.exp) return null;
    return s;
  } catch {
    return null;
  }
}

export async function login({ role, user, pass }) {
  if (!role || !user || !pass) fail(400, "Completa usuario y contraseña.");
  const state = await getStored();
  const q = String(user).trim().toLowerCase();
  const eq = (v) => typeof v === "string" && v.toLowerCase() === q;

  let account;
  if (role === "student") {
    account = (state.students || []).find((s) => eq(s.username) || eq(s.email));
    if (account && account.status === "inactive") fail(403, "Tu usuario está inactivo. Consulta con la Dirección.");
  } else {
    const roleOk = (r) => (role === "admin" ? isAdminRole(r) : r === role);
    account = (state.users || []).find((u) => roleOk(u.role) && (eq(u.email) || eq(u.username) || eq(u.name)));
  }
  if (!account || !(await verifyPassword(pass, account.password))) fail(401, "Credenciales incorrectas.");

  const sessionRole = role === "student" ? "student" : account.role;
  const token = encodeToken({ id: account.id, role: sessionRole, exp: Date.now() + SESSION_HOURS * 3600e3 });
  return { token };
}

export async function getState(token) {
  const session = decodeToken(token);
  if (!session) fail(401, "Sesión expirada.");
  const visible = publicState(await getStored(), session);
  if (!visible) fail(401, "El usuario ya no existe.");
  return visible;
}

export async function putState(token, data) {
  const session = decodeToken(token);
  if (!session) fail(401, "Sesión expirada.");
  const merged = await mergeState(await getStored(), data, session, hashPassword);
  writeStored(merged);
  return { ok: true };
}

export function resetDemo() {
  try {
    localStorage.removeItem(STATE_KEY);
  } catch {
    /* sin almacenamiento: nada que borrar */
  }
}
