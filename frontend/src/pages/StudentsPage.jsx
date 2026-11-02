import { useState, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import { scoreColor, totalScore, maxPossible } from "../lib/grades";
import { typeColors, severityLabels } from "../lib/format";
import { mkId, genEmail, genUser, genPassword, initials } from "../lib/credentials";
import { hashPassword } from "../lib/password";
import Av from "../components/Avatar";
import { isAdmin } from "../lib/roles";

export default function StudentsPage({ data, setData, search, user }) {
  const [filterGrade, setFilterGrade] = useState("");
  const [modal, setModal] = useState(false);
  const [editS, setEditS] = useState(null);
  const [form, setForm] = useState({ name: "", code: "", gradeId: "", status: "active" });
  const [creds, setCreds] = useState(null);
  const [importedCreds, setImportedCreds] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [xlsxMsg, setXlsxMsg] = useState("");
  const fileRef = useRef(null);

  // ✅ ✅ ✅ DELETE FUNCTION AQUÍ (FUERA DEL useMemo)
  const deleteStudent = (studentId) => {
    if (!isAdmin(user)) return;

    const student = data.students.find((s) => s.id === studentId);
    const ok = window.confirm(
      `¿Eliminar al alumno "${student?.name}"?\n\nEsto también eliminará notas, asistencia y reportes relacionados.`
    );
    if (!ok) return;

    setData((d) => ({
      ...d,
      students: d.students.filter((s) => s.id !== studentId),
      scores: d.scores.filter((sc) => sc.studentId !== studentId),
      attendance: d.attendance.filter((a) => a.studentId !== studentId),
      incidents: d.incidents.filter((i) => i.studentId !== studentId),
    }));
  };

  const filtered = useMemo(() => {
    return data.students.filter((s) => {
      const q = search.toLowerCase();
      const m =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.code.includes(q) ||
        (s.username || "").includes(q);

      const g = !filterGrade || s.gradeId === parseInt(filterGrade);
      return m && g;
    });
  }, [data.students, search, filterGrade]);

  const getAvg = sid => {
    const scs = data.scores.filter(s => s.studentId === sid && s.score != null).map(s => s.score);
    return scs.length ? Math.round(scs.reduce((a, b) => a + b, 0) / scs.length) : null;
  };

  const openNew = () => {
    setEditS(null);
    const n = data.students.length + 1;
    setForm({ name: "", code: `${new Date().getFullYear()}-${String(n).padStart(3, "0")}`, gradeId: "", status: "active" });
    setCreds(null); setModal(true);
  };
  const openEdit = s => { setEditS(s); setForm({ name: s.name, code: s.code, gradeId: String(s.gradeId), status: s.status }); setCreds(null); setModal(true); };

  const save = async () => {
    if (!form.name.trim() || !form.gradeId) return;
    if (editS) {
      setData(d => ({ ...d, students: d.students.map(s => s.id === editS.id ? { ...s, ...form, name: form.name.trim(), gradeId: parseInt(form.gradeId), avatar: initials(form.name) } : s) }));
      setModal(false);
      return;
    }
    const username = genUser(form.name, data.students.map(s => s.username));
    const email = genEmail(form.name, data.students.map(s => s.email));
    const password = genPassword();
    const ns = { id: mkId(), ...form, name: form.name.trim(), gradeId: parseInt(form.gradeId), username, email, avatar: initials(form.name), password: await hashPassword(password) };
    setData(d => ({ ...d, students: [...d.students, ns] }));
    setCreds({ title: "✅ Alumno creado exitosamente", name: ns.name, username, password, email });
  };

  // Las contraseñas se guardan cifradas: no se pueden ver, solo restablecer.
  const resetPassword = async (student) => {
    if (!window.confirm(`¿Generar una nueva contraseña para "${student.name}"? La anterior dejará de funcionar.`)) return;
    const password = genPassword();
    const hashed = await hashPassword(password);
    setData(d => ({ ...d, students: d.students.map(s => s.id === student.id ? { ...s, password: hashed } : s) }));
    setEditS(null);
    setCreds({ title: "🔑 Contraseña restablecida", name: student.name, username: student.username, password, email: student.email });
    setModal(true);
  };

  // ✅ Import / Export Excel (REAL) con xlsx
  const normalizeHeader = (h) =>
    String(h || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const pick = (row, keys) => {
    for (const k of keys) {
      const v = row[k];
      if (v != null && String(v).trim() !== "") return String(v).trim();
    }
    return "";
  };

  const findGradeId = (gradeName, section) => {
    if (!gradeName) return null;
    const gName = gradeName.trim().toLowerCase();
    const sec = (section || "").trim().toLowerCase();

    const found = data.grades.find(
      (g) =>
        g.name.toLowerCase() === gName &&
        (!sec || (g.section || "").toLowerCase() === sec)
    );

    return found?.id ?? null;
  };

  const handleXlsxUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setXlsxMsg(`⏳ Leyendo "${file.name}"...`);

      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });

      const imported = [];

      wb.SheetNames.forEach((sheetName) => {
        const ws = wb.Sheets[sheetName];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });

        raw.forEach((row) => {
          const normalizedRow = {};
          Object.keys(row).forEach((k) => {
            normalizedRow[normalizeHeader(k)] = row[k];
          });

          const name = pick(normalizedRow, ["nombre completo", "nombre", "alumno"]);
          const code = pick(normalizedRow, ["codigo personal", "código personal", "codigo", "código"]);
          const gradeName = pick(normalizedRow, ["grado", "nivel", "grado/nivel"]);
          const section = pick(normalizedRow, ["seccion", "sección", "sec"]);

          if (!name) return;

          imported.push({
            name,
            code: code || "",
            gradeName: gradeName || sheetName,
            section: section || "",
          });
        });
      });

      if (!imported.length) {
        setXlsxMsg("⚠️ No se encontraron filas válidas (revisa columnas).");
        return;
      }

      const existingCodes = new Set(data.students.map((s) => s.code));
      const existingNames = new Set(data.students.map((s) => s.name.toLowerCase()));
      const takenUsers = new Set(data.students.map((s) => s.username));
      const takenEmails = new Set(data.students.map((s) => s.email));

      const pending = [];
      imported.forEach((r, idx) => {
        const gradeId = findGradeId(r.gradeName, r.section) ?? findGradeId(r.gradeName, "") ?? data.grades[0]?.id;
        const codeFinal = (r.code || "").trim() || `2026-IMP-${String(idx + 1).padStart(3, "0")}`;
        const nmKey = r.name.toLowerCase();
        if (existingCodes.has(codeFinal) || existingNames.has(nmKey)) return;
        existingCodes.add(codeFinal);
        existingNames.add(nmKey);
        const username = genUser(r.name, takenUsers);
        const email = genEmail(r.name, takenEmails);
        takenUsers.add(username);
        takenEmails.add(email);
        pending.push({
          plain: genPassword(),
          student: { id: mkId(), name: r.name, code: codeFinal, gradeId, status: "active", avatar: initials(r.name), username, email },
        });
      });

      if (!pending.length) {
        setXlsxMsg("⚠️ Todo lo importado ya existía (duplicados por código/nombre).");
        return;
      }

      setXlsxMsg(`⏳ Generando credenciales para ${pending.length} alumnos...`);
      const newStudents = await Promise.all(pending.map(async ({ plain, student }) => ({ ...student, password: await hashPassword(plain) })));
      setData((d) => ({ ...d, students: [...d.students, ...newStudents] }));
      setImportedCreds(pending.map(({ plain, student }) => ({ ...student, plain })));
      setXlsxMsg(`✅ Importados ${newStudents.length} alumnos desde "${file.name}". Descarga sus credenciales: no se volverán a mostrar.`);

      e.target.value = "";
    } catch (err) {
      console.error(err);
      setXlsxMsg(`❌ Error al importar: ${err.message}`);
    }
  };

  const downloadWorkbook = (rows, sheet, filename) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheet);
    XLSX.writeFile(wb, filename);
  };

  const downloadImportedCreds = () => {
    if (!importedCreds) return;
    downloadWorkbook(
      importedCreds.map((s, i) => {
        const gr = data.grades.find((g) => g.id === s.gradeId);
        return { "No.": i + 1, "Nombre completo": s.name, "Código": s.code, "Grado": gr ? `${gr.name} ${gr.section}` : "", "Usuario": s.username, "Contraseña": s.plain, "Correo": s.email };
      }),
      "Credenciales",
      "Credenciales_alumnos_importados.xlsx"
    );
  };

  const exportToExcel = () => {
    const rows = filtered.map((s, i) => {
      const gr = data.grades.find((g) => g.id === s.gradeId);
      return {
        "No.": i + 1,
        "Nombre completo": s.name,
        "Código personal": s.code,
        "Grado": gr?.name || "",
        "Sección": gr?.section || "",
        "Usuario": s.username,
        "Correo": s.email,
        "Estado": s.status,
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Alumnos");

    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Alumnos_Export.xlsx";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const viewed = viewId ? data.students.find(s => s.id === viewId) : null;
  if (viewed) {
    const student = viewed;
    const gr = data.grades.find(g => g.id === student.gradeId);
    const myCourses = data.courses.filter(c => c.gradeId === student.gradeId);
    const incidents = data.incidents.filter(i => i.studentId === viewId);
    return (
      <div>
        <button className="btn btn-ghost" style={{ marginBottom: 18 }} onClick={() => setViewId(null)}>← Regresar</button>
        <div className="portal-hd">
          <Av init={student.avatar} size="av-xl" />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 22, marginBottom: 4 }}>{student.name}</h2>
            <div style={{ fontSize: 13, color: "var(--txt3)", marginBottom: 8 }}>Código: {student.code} · {gr?.name} "{gr?.section}"</div>
            <div style={{ display: "flex", gap: 8 }}>
              <span className={`badge badge-${student.status}`}>{student.status === "active" ? "Activo" : "Inactivo"}</span>
              <span className="badge badge-student">Alumno</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--txt3)", marginTop: 8 }}>👤 {student.username} &nbsp;|&nbsp; ✉️ {student.email}</div>
          </div>
          {incidents.length > 0 && (
            <div style={{ textAlign: "center", background: "var(--redl)", borderRadius: 12, padding: "10px 16px", border: "1.5px solid rgba(220,38,38,0.2)" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 26, color: "var(--red)" }}>{incidents.length}</div>
              <div style={{ fontSize: 11, color: "var(--red)", fontWeight: 700 }}>Reportes</div>
            </div>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 }}>
          <div>
            {myCourses.map(c => {
              const asgns = data.assignments.filter(a => a.courseId === c.id);
              const total = totalScore(viewId, asgns, data.scores);
              const maxP = maxPossible(asgns);
              return (
                <div className="card" style={{ marginBottom: 14 }} key={c.id}>
                  <div style={{ height: 4, background: c.color }} />
                  <div className="card-hd">
                    <div className="card-title">{c.name}</div>
                    <div style={{ marginLeft: "auto", fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 20, color: scoreColor(total, maxP) }}>
                      {total} / {maxP}
                    </div>
                  </div>
                  <div style={{ padding: "0 18px" }}>
                    {asgns.map(a => {
                      const sc = data.scores.find(s => s.studentId === viewId && s.assignmentId === a.id);
                      return (
                        <div className="mini-row" key={a.id}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: typeColors[a.type] }} />
                          <div style={{ flex: 1, fontSize: 13 }}>{a.name}</div>
                          <span style={{ fontSize: 11, color: "var(--txt3)" }}>/{a.maxScore}</span>
                          <span style={{ fontWeight: 800, fontSize: 14, color: scoreColor(sc?.score, a.maxScore), minWidth: 36, textAlign: "right" }}>{sc?.score ?? "–"}</span>
                        </div>
                      );
                    })}
                    <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 0", gap: 6, fontSize: 12, color: "var(--txt3)" }}>
                      <span>Total:</span>
                      <span style={{ fontWeight: 800, color: scoreColor(total, maxP) }}>{total} / {maxP} pts</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div>
            <div className="card">
              <div className="card-hd"><span style={{ fontSize: 17 }}>⚠️</span><div className="card-title">Reportes ({incidents.length})</div></div>
              <div style={{ padding: "6px 16px" }}>
                {incidents.length === 0 && <div style={{ padding: "16px 0", textAlign: "center", color: "var(--txt3)", fontSize: 13 }}>Sin reportes 🎉</div>}
                {incidents.map(inc => (
                  <div key={inc.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                      <span className={`badge badge-${inc.severity}`}>{severityLabels[inc.severity]}</span>
                      <span style={{ fontSize: 11, color: "var(--txt3)" }}>{inc.date}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--txt)" }}>{inc.description}</div>
                    <div style={{ fontSize: 12, color: "var(--txt2)", marginTop: 3 }}>📋 {inc.justification}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <select className="fc" style={{ width: 200 }} value={filterGrade} onChange={e => setFilterGrade(e.target.value)}>
          <option value="">Todos los grados</option>
          {data.grades.map(g => <option key={g.id} value={g.id}>{g.name} "{g.section}"</option>)}
        </select>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <label className="btn btn-ghost" style={{ cursor: "pointer" }}>
            📂 Importar Excel
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={handleXlsxUpload} />
          </label>
          <button className="btn btn-ghost" onClick={exportToExcel}>📤 Exportar Excel</button>
          <button className="btn btn-primary" onClick={openNew}>+ Nuevo Alumno</button>
        </div>
      </div>
      {xlsxMsg && (
        <div className="info-box" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ flex: 1 }}>{xlsxMsg}</span>
          {importedCreds && <button className="btn btn-sm btn-primary" onClick={downloadImportedCreds}>⬇️ Descargar credenciales</button>}
          <button className="btn btn-xs btn-ghost" onClick={() => { setXlsxMsg(""); setImportedCreds(null); }}>✕</button>
        </div>
      )}
      <div className="info-box" style={{ marginBottom: 14 }}>
        💡 Para importar desde Excel: el archivo debe tener una hoja por grado (nombre de la hoja = nombre del grado). Las columnas deben ser: Nombre, Código.
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Alumno</th><th>Código</th><th>Usuario</th><th>Correo</th><th>Grado</th><th>Total pts</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.map(s => {
                const gr = data.grades.find(g => g.id === s.gradeId);
                const avg = getAvg(s.id);
                const incs = data.incidents.filter(i => i.studentId === s.id).length;
                return (
                  <tr key={s.id}>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><Av init={s.avatar} /><div><div style={{ fontWeight: 700 }}>{s.name}</div>{incs > 0 && <span className="badge badge-high" style={{ marginTop: 2 }}>⚠️ {incs} reportes</span>}</div></div></td>
                    <td style={{ fontFamily: "monospace", fontWeight: 700 }}>{s.code}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--accent)" }}>{s.username}</td>
                    <td style={{ fontSize: 12, color: "var(--txt2)" }}>{s.email}</td>
                    <td>{gr ? `${gr.name} "${gr.section}"` : "–"}</td>
                    <td><span style={{ fontWeight: 800, color: "var(--accent)" }}>{avg ?? "–"}</span></td>
                    <td><span className={`badge badge-${s.status}`}>{s.status === "active" ? "Activo" : "Inactivo"}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-xs btn-ghost" onClick={() => setViewId(s.id)}>Ver</button>
                        <button className="btn btn-xs btn-ghost" onClick={() => openEdit(s)} title="Editar">✏️</button>
                        <button className="btn btn-xs btn-ghost" onClick={() => resetPassword(s)} title="Restablecer contraseña">🔑</button>

                        {isAdmin(user) && (
                          <button
                            className="btn btn-xs btn-danger"
                            onClick={() => deleteStudent(s.id)}
                            title="Eliminar alumno"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="overlay" onClick={() => { if (!creds) setModal(false); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {creds ? (
              <>
                <div className="modal-title">{creds.title}</div>
                <div className="success-box">Comparte estas credenciales con el alumno/familia. Por seguridad, la contraseña no se volverá a mostrar.</div>
                <div className="cred-box">
                  <div style={{ fontWeight: 700, fontSize: 12, color: "var(--txt2)", marginBottom: 6 }}>📋 Credenciales — {creds.name}</div>
                  {[["Usuario", creds.username], ["Contraseña", creds.password], ["Correo", creds.email]].map(([l, v]) => (
                    <div className="cred-row" key={l}><span className="cred-lbl">{l}</span><span className="cred-val">{v}</span></div>
                  ))}
                </div>
                <div className="modal-foot"><button className="btn btn-primary" onClick={() => setModal(false)}>Cerrar</button></div>
              </>
            ) : (
              <>
                <div className="modal-title">{editS ? "Editar Alumno" : "Nuevo Alumno"}</div>
                <div className="fr">
                  <div className="fg"><label className="fl">Nombre completo</label><input className="fc" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nombre Apellido" /></div>
                  <div className="fg"><label className="fl">Código</label><input className="fc" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
                </div>
                <div className="fr">
                  <div className="fg"><label className="fl">Grado</label>
                    <select className="fc" value={form.gradeId} onChange={e => setForm({ ...form, gradeId: e.target.value })}>
                      <option value="">Seleccionar</option>
                      {data.grades.map(g => <option key={g.id} value={g.id}>{g.name} "{g.section}"</option>)}
                    </select></div>
                  <div className="fg"><label className="fl">Estado</label>
                    <select className="fc" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="active">Activo</option><option value="inactive">Inactivo</option>
                    </select></div>
                </div>
                {!editS && <div className="info-box">🔑 Usuario y correo se generan del nombre completo; la contraseña inicial es aleatoria.</div>}
                <div className="modal-foot">
                  <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
                  <button className="btn btn-primary" onClick={save}>Guardar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
