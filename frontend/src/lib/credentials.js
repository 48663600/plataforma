// Generación de IDs, usuarios, correos y contraseñas.

let lastId = 0;
/** ID numérico único y creciente (evita choques al crear muchos registros en el mismo milisegundo). */
export const mkId = () => {
  lastId = Math.max(lastId + 1, Date.now());
  return lastId;
};

const clean = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]/g, "");

const nameParts = (name) => {
  const parts = String(name || "").trim().split(/\s+/);
  return { first: clean(parts[0]) || "usuario", last: clean(parts[1]) || "colegio" };
};

export const EMAIL_DOMAIN = "wellmann.edu";

/** Devuelve `base` o `base2`, `base3`… para que no se repita dentro de `taken`. */
export const uniqueValue = (base, taken, suffix = "") => {
  const set = taken instanceof Set ? taken : new Set(taken);
  let candidate = `${base}${suffix}`;
  let n = 2;
  while (set.has(candidate)) candidate = `${base}${n++}${suffix}`;
  return candidate;
};

export const genUser = (name, taken = []) => {
  const { first, last } = nameParts(name);
  return uniqueValue(`${first}_${last}`, taken);
};

export const genEmail = (name, taken = []) => {
  const { first, last } = nameParts(name);
  return uniqueValue(`${first}_${last}`, taken, `@${EMAIL_DOMAIN}`);
};

const LETTERS = "abcdefghjkmnpqrstuvwxyz";
const randomInt = (max) => {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return buf[0] % max;
};

/** Contraseña inicial aleatoria y fácil de dictar, p. ej. "Kmrt4827". */
export const genPassword = () => {
  let s = "";
  for (let i = 0; i < 4; i++) s += LETTERS[randomInt(LETTERS.length)];
  for (let i = 0; i < 4; i++) s += String(randomInt(10));
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const initials = (name) =>
  String(name || "?")
    .trim()
    .split(/\s+/)
    .map((w) => w[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
