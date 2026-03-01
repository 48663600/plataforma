const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getState, setState } = require("./state");
const { requireAuth } = require("./auth");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/", (_, res) => res.json({ ok: true, name: "AcademiQ API" }));

app.post("/api/auth/login", async (req, res) => {
  const { role, user, pass } = req.body || {};
  if (!role || !user || !pass) return res.status(400).json({ error: "Missing fields" });

  const state = await getState();
  if (!state) return res.status(500).json({ error: "State not initialized" });

  if (role === "student") {
    const st = (state.students || []).find((s) => s.username === user || s.email === user);
    if (!st) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(pass, st.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: st.id, role: "student", name: st.name }, process.env.JWT_SECRET, { expiresIn: "8h" });
    return res.json({ token, user: { ...st, role: "student", password: st.passwordPlain } });
  }

  const u = (state.users || []).find((x) => x.role === role && (x.email === user || x.name === user));
  if (!u) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(pass, u.password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: u.id, role: u.role, name: u.name }, process.env.JWT_SECRET, { expiresIn: "8h" });
  return res.json({ token, user: { ...u, password: u.passwordPlain } });
});

app.get("/api/state", requireAuth, async (req, res) => {
  const state = await getState();
  if (!state) return res.status(500).json({ error: "State not initialized" });

  if (req.user.role === "student") {
    const me = (state.students || []).find((s) => s.id === req.user.id);
    const safeUsers = (state.users || []).map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, avatar: u.avatar, subject: u.subject }));
    const safeStudents = (state.students || []).map((s) => ({
      id: s.id, name: s.name, code: s.code, gradeId: s.gradeId, status: s.status, avatar: s.avatar, username: s.username, email: s.email,
      password: s.id === req.user.id ? s.passwordPlain : undefined,
    }));
    return res.json({ ...state, users: safeUsers, students: safeStudents, me });
  }

  return res.json(state);
});

app.put("/api/state", requireAuth, async (req, res) => {
  if (!["admin","teacher"].includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });

  const incoming = req.body;
  if (!incoming || typeof incoming !== "object") return res.status(400).json({ error: "Invalid state" });

  async function fixUsers(users = []) {
    return Promise.all(users.map(async (u) => {
      const plain = u.passwordPlain || u.password || "";
      const hashed = (typeof u.password === "string" && u.password.startsWith("$2")) ? u.password : await bcrypt.hash(plain, 10);
      return { ...u, passwordPlain: plain, password: hashed };
    }));
  }
  async function fixStudents(students = []) {
    return Promise.all(students.map(async (s) => {
      const plain = s.passwordPlain || s.password || "";
      const hashed = (typeof s.password === "string" && s.password.startsWith("$2")) ? s.password : await bcrypt.hash(plain, 10);
      return { ...s, passwordPlain: plain, password: hashed };
    }));
  }

  const fixed = { ...incoming, users: await fixUsers(incoming.users || []), students: await fixStudents(incoming.students || []) };
  await setState(fixed);
  return res.json({ ok: true });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`✅ AcademiQ API on http://localhost:${port}`));
