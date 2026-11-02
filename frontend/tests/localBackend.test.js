import { describe, it, expect, beforeEach } from "vitest";

// localStorage mínimo para Node
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const local = await import("../src/services/localBackend.js");

describe("modo demostración (localStorage)", () => {
  beforeEach(() => store.clear());

  it("inicia sesión con las credenciales demo de cada rol", async () => {
    for (const [role, user, pass] of [
      ["admin", "admin@academiq.edu", "admin2026"],
      ["teacher", "ana.garcia@academiq.edu", "Ana2026"],
      ["student", "valentina.perez", "Valentina2026"],
    ]) {
      const { token } = await local.login({ role, user, pass });
      const s = await local.getState(token);
      expect(s.me).toBeTruthy();
    }
  });

  it("rechaza contraseñas incorrectas y guarda los hashes, no el texto", async () => {
    await expect(local.login({ role: "admin", user: "admin@academiq.edu", pass: "x" })).rejects.toMatchObject({ status: 401 });
    expect(store.get("academiq_demo_state_v1")).not.toContain("admin2026");
  });

  it("persiste los cambios del docente y respeta permisos", async () => {
    const { token } = await local.login({ role: "teacher", user: "ana.garcia@academiq.edu", pass: "Ana2026" });
    const s = await local.getState(token);
    await local.putState(token, { ...s, scores: [], users: [] });
    const again = await local.getState(token);
    expect(again.scores).toEqual([]);
    expect(again.users.length).toBeGreaterThan(0);
  });

  it("un alumno inactivo no puede entrar", async () => {
    await expect(local.login({ role: "student", user: "gabriel.jimenez", pass: "Gabriel2026" })).rejects.toMatchObject({ status: 403 });
  });
});
