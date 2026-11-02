// Pruebas de la API con almacenamiento en archivo temporal (sin base de datos).
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const bcrypt = require("bcrypt");

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "academiq-"));
process.env.DATA_FILE = path.join(dir, "state.json");
process.env.JWT_SECRET = "x".repeat(40);
delete process.env.DATABASE_URL;

const app = require("../src/server");
let base, server;

const call = async (method, url, { token, body } = {}) => {
  const res = await fetch(base + url, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
};
const login = async (role, user, pass) => (await call("POST", "/api/auth/login", { body: { role, user, pass } })).body.token;

before(async () => {
  const h = (p) => bcrypt.hashSync(p, 4);
  fs.writeFileSync(process.env.DATA_FILE, JSON.stringify({
    users: [
      { id: 1, role: "director", name: "Dir", email: "dir@x.edu", password: h("dir-pass"), passwordPlain: "dir-pass" },
      { id: 2, role: "teacher", name: "Doc", email: "doc@x.edu", password: h("doc-pass") },
    ],
    students: [
      { id: 10, name: "A", username: "a", gradeId: 1, status: "active", password: h("a-pass") },
      { id: 11, name: "B", username: "b", gradeId: 2, status: "active", password: h("b-pass") },
    ],
    grades: [{ id: 1 }, { id: 2 }], courses: [{ id: 100, gradeId: 1, teacherId: 2 }], periods: [],
    assignments: [{ id: 1, courseId: 100, maxScore: 10 }],
    scores: [{ id: 1, studentId: 10, assignmentId: 1, score: 9 }, { id: 2, studentId: 11, assignmentId: 1, score: 3 }],
    attendance: [], announcements: [], chatMessages: [{ id: 1, text: "privado" }], incidents: [], notifications: [],
  }));
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

test("el director entra con el botón Director (role=admin)", async () => {
  assert.ok(await login("admin", "dir@x.edu", "dir-pass"));
});

test("credenciales incorrectas → 401", async () => {
  const r = await call("POST", "/api/auth/login", { body: { role: "teacher", user: "doc@x.edu", pass: "mal" } });
  assert.strictEqual(r.status, 401);
});

test("el estado nunca incluye contraseñas", async () => {
  const token = await login("admin", "dir@x.edu", "dir-pass");
  const { body } = await call("GET", "/api/state", { token });
  for (const acc of [...body.users, ...body.students]) {
    assert.ok(!("password" in acc) && !("passwordPlain" in acc));
  }
  assert.strictEqual(body.me.id, 1);
});

test("un alumno solo recibe sus notas y no ve el chat", async () => {
  const token = await login("student", "a", "a-pass");
  const { body } = await call("GET", "/api/state", { token });
  assert.deepStrictEqual(body.scores.map((s) => s.studentId), [10]);
  assert.deepStrictEqual(body.chatMessages, []);
  assert.strictEqual(body.students.length, 1);
});

test("un docente no puede cambiar la contraseña del director", async () => {
  const token = await login("teacher", "doc@x.edu", "doc-pass");
  const { body } = await call("GET", "/api/state", { token });
  body.users[0].password = "hackeada";
  body.scores = [];
  const r = await call("PUT", "/api/state", { token, body });
  assert.strictEqual(r.status, 200);
  assert.ok(await login("admin", "dir@x.edu", "dir-pass"), "la contraseña del director no cambió");
  const saved = JSON.parse(fs.readFileSync(process.env.DATA_FILE, "utf8"));
  assert.deepStrictEqual(saved.scores, [], "pero sí guardó las notas");
});

test("un alumno no puede guardar", async () => {
  const token = await login("student", "a", "a-pass");
  const r = await call("PUT", "/api/state", { token, body: {} });
  assert.strictEqual(r.status, 403);
});

test("el director puede restablecer una contraseña (hash del frontend)", async () => {
  const token = await login("admin", "dir@x.edu", "dir-pass");
  const { body } = await call("GET", "/api/state", { token });
  body.students[0].password = "NuevaClave1";
  assert.strictEqual((await call("PUT", "/api/state", { token, body })).status, 200);
  assert.ok(await login("student", "a", "NuevaClave1"));
  const saved = JSON.parse(fs.readFileSync(process.env.DATA_FILE, "utf8"));
  assert.ok(saved.students[0].password.startsWith("$2"), "se guardó con bcrypt");
  assert.ok(saved.students[1].password.startsWith("$2"), "el otro alumno conserva su hash");
});

test("bloquea tras demasiados intentos fallidos", async () => {
  let last;
  for (let i = 0; i < 11; i++) last = await call("POST", "/api/auth/login", { body: { role: "teacher", user: "doc@x.edu", pass: "x" } });
  assert.strictEqual(last.status, 429);
});
