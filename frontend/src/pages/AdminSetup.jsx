import { useState } from "react";
import { mkId, genEmail, genPassword, initials } from "../lib/credentials";
import { hashPassword } from "../lib/password";
import Av from "../components/Avatar";

export default function AdminSetup({ data, setData, search }) {
  const [tab, setTab] = useState("teachers");
  const [gModal, setGModal] = useState(false);
  const [cModal, setCModal] = useState(false);
  const [tModal, setTModal] = useState(false);
  const [editT, setEditT] = useState(null);
  const [gForm, setGForm] = useState({ name: "", section: "A", level: "Primaria" });
  const [cForm, setCForm] = useState({ name: "", gradeId: "", teacherId: "", color: "#4f7ef7" });
  const [tForm, setTForm] = useState({ name: "", email: "", password: "", subject: "" });
  const [tCreds, setTCreds] = useState(null);

  const saveGrade = () => {
    if (!gForm.name) return;
    setData(d => ({ ...d, grades: [...d.grades, { ...gForm, id: mkId() }] }));
    setGModal(false); setGForm({ name: "", section: "A", level: "Primaria" });
  };
  const saveCourse = () => {
    if (!cForm.name || !cForm.gradeId) return;
    setData(d => ({ ...d, courses: [...d.courses, { ...cForm, id: mkId(), gradeId: parseInt(cForm.gradeId), teacherId: cForm.teacherId ? parseInt(cForm.teacherId) : null }] }));
    setCModal(false); setCForm({ name: "", gradeId: "", teacherId: "", color: "#4f7ef7" });
  };
  const [tErr, setTErr] = useState("");

  const saveTeacher = async () => {
    setTErr("");
    const name = tForm.name.trim();
    if (!name) return setTErr("Escribe el nombre del docente.");
    const otherEmails = data.users.filter(u => u.id !== editT?.id).map(u => (u.email || "").toLowerCase());
    if (editT) {
      const email = tForm.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setTErr("Correo electrónico no válido.");
      if (otherEmails.includes(email)) return setTErr("Ese correo ya lo usa otro usuario.");
      if (tForm.password && tForm.password.length < 6) return setTErr("La contraseña debe tener al menos 6 caracteres.");
      const changes = { name, email, subject: tForm.subject, avatar: initials(name) };
      if (tForm.password) changes.password = await hashPassword(tForm.password);
      setData(d => ({ ...d, users: d.users.map(u => u.id === editT.id ? { ...u, ...changes } : u) }));
      setTModal(false); setEditT(null);
      return;
    }
    const email = genEmail(name, otherEmails);
    const password = genPassword();
    const nt = { id: mkId(), name, email, subject: tForm.subject, role: "teacher", avatar: initials(name), password: await hashPassword(password) };
    setData(d => ({ ...d, users: [...d.users, nt] }));
    setTCreds({ title: "✅ Docente registrado", name, email, password, subject: tForm.subject });
  };

  const resetTeacherPassword = async (t) => {
    if (!window.confirm(`¿Generar una nueva contraseña para "${t.name}"? La anterior dejará de funcionar.`)) return;
    const password = genPassword();
    const hashed = await hashPassword(password);
    setData(d => ({ ...d, users: d.users.map(u => u.id === t.id ? { ...u, password: hashed } : u) }));
    setTCreds({ title: "🔑 Contraseña restablecida", name: t.name, email: t.email, password, subject: t.subject });
    setTModal(true);
  };

  const deleteTeacher = (t) => {
    const n = data.courses.filter(c => c.teacherId === t.id).length;
    if (!window.confirm(`¿Eliminar al docente "${t.name}"?${n ? ` Sus ${n} cursos quedarán sin docente asignado.` : ""}`)) return;
    setData(d => ({ ...d, users: d.users.filter(u => u.id !== t.id), courses: d.courses.map(c => c.teacherId === t.id ? { ...c, teacherId: null } : c) }));
  };

  const teachers = data.users.filter(u => u.role === "teacher").filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="tabs">
        {[["teachers", "👨‍🏫 Docentes"], ["grades", "🏫 Grados"], ["courses", "📚 Cursos"]].map(([id, lbl]) => (
          <button key={id} className={`tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>{lbl}</button>
        ))}
      </div>

      {tab === "teachers" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button className="btn btn-primary" onClick={() => { setEditT(null); setTForm({ name: "", email: "", password: "", subject: "" }); setTErr(""); setTCreds(null); setTModal(true); }}>+ Nuevo Docente</button>
          </div>
          <div className="card">
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Docente</th><th>Correo</th><th>Especialidad</th><th>Cursos</th><th>Acciones</th></tr></thead>
                <tbody>
                  {teachers.map(t => {
                    const tCourses = data.courses.filter(c => c.teacherId === t.id);
                    return (
                      <tr key={t.id}>
                        <td><div style={{ display: "flex", alignItems: "center", gap: 9 }}><Av init={t.avatar} /><span style={{ fontWeight: 700 }}>{t.name}</span></div></td>
                        <td style={{ fontSize: 12, color: "var(--txt2)" }}>{t.email}</td>
                        <td>{t.subject || "–"}</td>
                        <td><div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{tCourses.map(c => <span key={c.id} style={{ padding: "2px 6px", borderRadius: 5, background: `${c.color}22`, color: c.color, fontSize: 11, fontWeight: 700 }}>{c.name}</span>)}</div></td>
                        <td><div style={{ display: "flex", gap: 4 }}>
                          <button className="btn btn-xs btn-ghost" onClick={() => { setEditT(t); setTForm({ name: t.name, email: t.email, password: "", subject: t.subject || "" }); setTErr(""); setTCreds(null); setTModal(true); }}>✏️ Editar</button>
                          <button className="btn btn-xs btn-ghost" onClick={() => resetTeacherPassword(t)} title="Restablecer contraseña">🔑</button>
                          <button className="btn btn-xs btn-danger" onClick={() => deleteTeacher(t)} title="Eliminar docente">🗑️</button>
                        </div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "grades" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button className="btn btn-primary" onClick={() => setGModal(true)}>+ Nuevo Grado</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {data.grades.map(g => {
              const cnt = data.students.filter(s => s.gradeId === g.id && s.status === "active").length;
              const crs = data.courses.filter(c => c.gradeId === g.id).length;
              return (
                <div className="card" key={g.id}>
                  <div className="card-body">
                    <div style={{ fontSize: 30, marginBottom: 8 }}>🏫</div>
                    <h3 style={{ fontSize: 15, marginBottom: 3 }}>{g.name}</h3>
                    <div style={{ fontSize: 12, color: "var(--txt3)", marginBottom: 10 }}>Sección "{g.section}" · {g.level}</div>
                    <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--txt2)" }}>
                      <span>👥 {cnt} alumnos</span><span>📚 {crs} cursos</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "courses" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button className="btn btn-primary" onClick={() => setCModal(true)}>+ Nuevo Curso</button>
          </div>
          <div className="card">
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Curso</th><th>Grado</th><th>Docente</th></tr></thead>
                <tbody>
                  {data.courses.map(c => {
                    const gr = data.grades.find(g => g.id === c.gradeId);
                    const t = data.users.find(u => u.id === c.teacherId);
                    return (
                      <tr key={c.id}>
                        <td><div style={{ display: "flex", alignItems: "center", gap: 7 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: c.color }} /><span style={{ fontWeight: 700 }}>{c.name}</span></div></td>
                        <td>{gr?.name} "{gr?.section}"</td>
                        <td>{t ? <div style={{ display: "flex", alignItems: "center", gap: 7 }}><Av init={t.avatar} size="av-sm" /><span>{t.name}</span></div> : "–"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* MODALS */}
      {gModal && (
        <div className="overlay" onClick={() => setGModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Nuevo Grado / Sección</div>
            <div className="fg"><label className="fl">Nombre del grado</label><input className="fc" value={gForm.name} onChange={e => setGForm({ ...gForm, name: e.target.value })} placeholder="Ej: 4to Primaria" /></div>
            <div className="fr">
              <div className="fg"><label className="fl">Sección</label><select className="fc" value={gForm.section} onChange={e => setGForm({ ...gForm, section: e.target.value })}>{["A", "B", "C", "D"].map(s => <option key={s}>{s}</option>)}</select></div>
              <div className="fg"><label className="fl">Nivel</label><select className="fc" value={gForm.level} onChange={e => setGForm({ ...gForm, level: e.target.value })}>{["Preprimaria", "Primaria", "Básico", "Diversificado"].map(l => <option key={l}>{l}</option>)}</select></div>
            </div>
            <div className="modal-foot"><button className="btn btn-ghost" onClick={() => setGModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={saveGrade}>Crear Grado</button></div>
          </div>
        </div>
      )}
      {cModal && (
        <div className="overlay" onClick={() => setCModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Nuevo Curso</div>
            <div className="fg"><label className="fl">Nombre del curso</label><input className="fc" value={cForm.name} onChange={e => setCForm({ ...cForm, name: e.target.value })} placeholder="Ej: Matemática" /></div>
            <div className="fr">
              <div className="fg"><label className="fl">Grado</label><select className="fc" value={cForm.gradeId} onChange={e => setCForm({ ...cForm, gradeId: e.target.value })}><option value="">Seleccionar</option>{data.grades.map(g => <option key={g.id} value={g.id}>{g.name} "{g.section}"</option>)}</select></div>
              <div className="fg"><label className="fl">Docente</label><select className="fc" value={cForm.teacherId} onChange={e => setCForm({ ...cForm, teacherId: e.target.value })}><option value="">Seleccionar</option>{data.users.filter(u => u.role === "teacher").map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            </div>
            <div className="fg"><label className="fl">Color</label><input className="fc" type="color" value={cForm.color} onChange={e => setCForm({ ...cForm, color: e.target.value })} style={{ height: 44, padding: 4 }} /></div>
            <div className="modal-foot"><button className="btn btn-ghost" onClick={() => setCModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={saveCourse}>Crear Curso</button></div>
          </div>
        </div>
      )}
      {tModal && (
        <div className="overlay" onClick={() => { if (!tCreds) setTModal(false); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {tCreds ? (
              <>
                <div className="modal-title">{tCreds.title}</div>
                <div className="success-box">Entrega estas credenciales al docente. Por seguridad, la contraseña no se volverá a mostrar.</div>
                <div className="cred-box">
                  {[["Nombre", tCreds.name], ["Correo", tCreds.email], ["Contraseña", tCreds.password], ["Especialidad", tCreds.subject || "–"]].map(([l, v]) => (
                    <div className="cred-row" key={l}><span className="cred-lbl">{l}</span><span className="cred-val">{v}</span></div>
                  ))}
                </div>
                <div className="modal-foot"><button className="btn btn-primary" onClick={() => { setTModal(false); setTCreds(null); }}>Cerrar</button></div>
              </>
            ) : (
              <>
                <div className="modal-title">{editT ? "Editar Credenciales Docente" : "Nuevo Docente"}</div>
                <div className="fr">
                  <div className="fg"><label className="fl">Nombre completo</label><input className="fc" value={tForm.name} onChange={e => setTForm({ ...tForm, name: e.target.value })} /></div>
                  <div className="fg"><label className="fl">Especialidad</label><input className="fc" value={tForm.subject} onChange={e => setTForm({ ...tForm, subject: e.target.value })} placeholder="Ej: Matemática" /></div>
                </div>
                {editT && (
                  <>
                    <div className="fg"><label className="fl">Correo electrónico</label><input className="fc" type="email" value={tForm.email} onChange={e => setTForm({ ...tForm, email: e.target.value })} /></div>
                    <div className="fg"><label className="fl">Nueva contraseña (opcional)</label><input className="fc" type="password" autoComplete="new-password" value={tForm.password} onChange={e => setTForm({ ...tForm, password: e.target.value })} placeholder="Déjala vacía para no cambiarla" /></div>
                  </>
                )}
                {!editT && <div className="info-box">🔑 El correo se genera del nombre y la contraseña inicial es aleatoria.</div>}
                {tErr && <div className="warn-box">{tErr}</div>}
                <div className="modal-foot">
                  <button className="btn btn-ghost" onClick={() => { setTModal(false); setEditT(null); }}>Cancelar</button>
                  <button className="btn btn-primary" onClick={saveTeacher}>{editT ? "Actualizar" : "Registrar"}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
