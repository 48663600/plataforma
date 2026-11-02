import { useState } from "react";
import { MODE, login as doLogin, resetDemo } from "../services/dataService.js";

const DEMO = {
  admin: ["admin@academiq.edu", "admin2026"],
  teacher: ["ana.garcia@academiq.edu", "Ana2026"],
  student: ["valentina.perez", "Valentina2026"],
};

export default function Login({ onLogin, dark, setDark }) {
  const [role, setRole] = useState("admin");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const isDemo = MODE === "local";

  const login = async (e) => {
    e?.preventDefault();
    if (busy) return;
    setErr("");
    setBusy(true);
    try {
      const res = await doLogin({ role, user: user.trim(), pass });
      await onLogin(res);
    } catch (ex) {
      setErr(ex.message || "Credenciales incorrectas. Revisa e intenta nuevamente.");
      setBusy(false);
    }
  };

  const fillDemo = () => {
    setUser(DEMO[role][0]);
    setPass(DEMO[role][1]);
    setErr("");
  };

  const reset = () => {
    if (!window.confirm("¿Restablecer los datos de demostración? Se perderán todos los cambios hechos en este navegador.")) return;
    resetDemo();
    setErr("");
    window.alert("Datos de demostración restablecidos.");
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={login}>
        <div style={{ position: "absolute", top: 16, right: 16 }}>
          <button type="button" className="theme-toggle" onClick={() => setDark(!dark)}>
            {dark ? "☀️ Claro" : "🌙 Oscuro"}
          </button>
        </div>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div className="login-logo">A</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 900, color: "var(--txt)", letterSpacing: -1 }}>AcademiQ</h1>
          <p style={{ fontSize: 13, color: "var(--txt3)", fontWeight: 600, marginTop: 4 }}>Sistema de Gestión Escolar Profesional</p>
        </div>
        <div className="role-btns">
          {[["admin", "🛡️", "Director"], ["teacher", "📚", "Docente"], ["student", "🎒", "Alumno"]].map(([r, ic, lb]) => (
            <button type="button" key={r} className={`role-btn ${role === r ? "sel" : ""}`} onClick={() => { setRole(r); setErr(""); }}>
              <div className="role-btn-ico">{ic}</div>
              <div className="role-btn-lbl">{lb}</div>
            </button>
          ))}
        </div>
        <div className="fg">
          <label className="fl" htmlFor="login-user">{role === "student" ? "Usuario o correo" : "Correo electrónico"}</label>
          <input id="login-user" className="fc" autoComplete="username" value={user} onChange={(e) => setUser(e.target.value)} placeholder={role === "student" ? "nombre_apellido" : "correo@wellmann.edu"} />
        </div>
        <div className="fg">
          <label className="fl" htmlFor="login-pass">Contraseña</label>
          <input id="login-pass" className="fc" type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" />
        </div>
        {err && <div className="warn-box" style={{ marginTop: 2 }}>{err}</div>}
        <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 6 }} disabled={busy || !user || !pass}>
          {busy ? "Ingresando…" : "Iniciar Sesión →"}
        </button>
        {isDemo && (
          <div className="demo-box">
            <div style={{ fontWeight: 800, marginBottom: 4 }}>🧪 Modo demostración</div>
            <div>Los datos se guardan solo en este navegador.</div>
            <div style={{ marginTop: 6 }}>
              Demo: <code>{DEMO[role][0]}</code> / <code>{DEMO[role][1]}</code>
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
              <button type="button" className="btn btn-xs btn-ghost" onClick={fillDemo}>Usar credenciales demo</button>
              <button type="button" className="btn btn-xs btn-ghost" onClick={reset}>Restablecer datos</button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
