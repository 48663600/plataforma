import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, isHashed } from "../src/lib/password.js";
import { publicState, mergeState } from "../src/lib/stateRules.js";
import { genPassword, genEmail, mkId } from "../src/lib/credentials.js";

const state = {
  users: [
    { id: 1, role: "admin", name: "Dir", email: "d@x.edu", password: "pbkdf2$1$a$b" },
    { id: 2, role: "teacher", name: "Doc", email: "t@x.edu", password: "pbkdf2$1$c$d" },
  ],
  students: [
    { id: 10, name: "A", gradeId: 1, password: "pbkdf2$1$e$f" },
    { id: 11, name: "B", gradeId: 2, password: "pbkdf2$1$g$h" },
  ],
  grades: [{ id: 1 }, { id: 2 }],
  courses: [{ id: 100, gradeId: 1 }, { id: 200, gradeId: 2 }],
  periods: [],
  assignments: [{ id: 1, courseId: 100 }, { id: 2, courseId: 200 }],
  scores: [{ studentId: 10, assignmentId: 1 }, { studentId: 11, assignmentId: 2 }],
  attendance: [],
  incidents: [{ studentId: 11 }],
  announcements: [],
  chatMessages: [{ id: 1, text: "privado" }],
  notifications: [],
};

describe("contraseñas", () => {
  it("hashea y verifica con PBKDF2", async () => {
    const h = await hashPassword("Secreta123");
    expect(isHashed(h)).toBe(true);
    expect(await verifyPassword("Secreta123", h)).toBe(true);
    expect(await verifyPassword("otra", h)).toBe(false);
  });

  it("genera contraseñas aleatorias distintas", () => {
    const set = new Set(Array.from({ length: 50 }, genPassword));
    expect(set.size).toBe(50);
    expect([...set][0]).toMatch(/^[A-Z][a-z]{3}\d{4}$/);
  });

  it("evita correos duplicados", () => {
    expect(genEmail("Ana García", ["ana_garcia@wellmann.edu"])).toBe("ana_garcia2@wellmann.edu");
  });

  it("mkId no repite valores", () => {
    const ids = new Set(Array.from({ length: 1000 }, mkId));
    expect(ids.size).toBe(1000);
  });
});

describe("publicState", () => {
  it("nunca entrega contraseñas", () => {
    const s = publicState(state, { id: 1, role: "admin" });
    expect(s.users.every((u) => !("password" in u))).toBe(true);
    expect(s.students.every((u) => !("password" in u))).toBe(true);
    expect(s.me.id).toBe(1);
  });

  it("un alumno solo ve sus propios datos", () => {
    const s = publicState(state, { id: 10, role: "student" });
    expect(s.students).toHaveLength(1);
    expect(s.scores).toEqual([{ studentId: 10, assignmentId: 1 }]);
    expect(s.incidents).toEqual([]);
    expect(s.chatMessages).toEqual([]);
    expect(s.assignments.map((a) => a.id)).toEqual([1]);
    expect(s.me.role).toBe("student");
  });

  it("devuelve null si el usuario ya no existe", () => {
    expect(publicState(state, { id: 999, role: "teacher" })).toBeNull();
  });
});

describe("mergeState", () => {
  const hash = async (p) => `pbkdf2$hashed$${p}`;

  it("un docente no puede modificar usuarios ni alumnos", async () => {
    const incoming = { ...state, users: [{ id: 1, role: "admin", password: "hackeada" }], scores: [] };
    const out = await mergeState(state, incoming, { id: 2, role: "teacher" }, hash);
    expect(out.users).toBe(state.users);
    expect(out.scores).toEqual([]);
  });

  it("el director conserva contraseñas que no envía y hashea las nuevas", async () => {
    const pub = publicState(state, { id: 1, role: "admin" });
    pub.students[0] = { ...pub.students[0], password: "Nueva2026" };
    const out = await mergeState(state, pub, { id: 1, role: "director" }, hash);
    expect(out.students[0].password).toBe("pbkdf2$hashed$Nueva2026");
    expect(out.students[1].password).toBe("pbkdf2$1$g$h");
    expect(out.users[0].password).toBe("pbkdf2$1$a$b");
    expect(out).not.toHaveProperty("me");
  });

  it("un alumno no puede guardar", async () => {
    await expect(mergeState(state, state, { id: 10, role: "student" }, hash)).rejects.toMatchObject({ status: 403 });
  });
});
