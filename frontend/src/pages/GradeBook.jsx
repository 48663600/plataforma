import { isAdmin } from "../lib/roles";
import { useState } from "react";
import { scoreColor, totalScore } from "../lib/grades";
import { typeColors, typeLabels } from "../lib/format";
import { mkId } from "../lib/credentials";
import Av from "../components/Avatar";

export default function GradeBook({ data, setData, user, search }) {
  const [selCourse, setSelCourse] = useState(null);
  const [aModal, setAModal] = useState(false);
  const [editA, setEditA] = useState(null);
  const [aForm, setAForm] = useState({ name: "", type: "tarea", maxScore: 10, dueDate: "", instructions: "" });
  const [editCell, setEditCell] = useState(null);
  const [cellVal, setCellVal] = useState("");

  const courses = isAdmin(user) ? data.courses : data.courses.filter(c => c.teacherId === user.id);
  const course = courses.find(c => c.id === selCourse);
  const assigns = course ? data.assignments.filter(a => a.courseId === course.id) : [];
  const maxTotal = assigns.reduce((a, b) => a + b.maxScore, 0);
  const students = course ? data.students.filter(s => s.gradeId === course.gradeId && s.status === "active").filter(s => {
    const q = search.toLowerCase();
    return !q || s.name.toLowerCase().includes(q);
  }) : [];

  const getScore = (sid, aid) => data.scores.find(s => s.studentId === sid && s.assignmentId === aid);

  const saveCell = (sid, aid, max) => {
    const parsed = parseFloat(cellVal);
    if (cellVal !== "" && Number.isNaN(parsed)) { setEditCell(null); return; }
    let val = cellVal === "" ? null : Math.min(max, Math.max(0, parsed));
    if (val !== null) val = Math.round(val * 10) / 10;
    setData(d => {
      const ex = d.scores.find(s => s.studentId === sid && s.assignmentId === aid);
      if (ex) return { ...d, scores: d.scores.map(s => s.studentId === sid && s.assignmentId === aid ? { ...s, score: val, submitted: val != null } : s) };
      return { ...d, scores: [...d.scores, { id: mkId(), studentId: sid, assignmentId: aid, score: val, submitted: val != null }] };
    });
    setEditCell(null);
  };

  const deleteAssign = (a) => {
    const graded = data.scores.filter(s => s.assignmentId === a.id && s.score != null).length;
    const msg = graded ? `¿Eliminar "${a.name}"? También se borrarán ${graded} notas registradas.` : `¿Eliminar "${a.name}"?`;
    if (!window.confirm(msg)) return;
    setData(d => ({ ...d, assignments: d.assignments.filter(x => x.id !== a.id), scores: d.scores.filter(s => s.assignmentId !== a.id) }));
  };

  const saveAssign = () => {
    const maxScore = parseFloat(aForm.maxScore);
    if (!aForm.name.trim() || !(maxScore > 0)) return;
    if (editA) {
      setData(d => ({ ...d, assignments: d.assignments.map(a => a.id === editA.id ? { ...a, ...aForm, maxScore } : a) }));
    } else {
      const activePeriodId = data.periods?.find(p => p.active)?.id || 1;
      setData(d => ({ ...d, assignments: [...d.assignments, { ...aForm, id: mkId(), courseId: selCourse, maxScore, periodId: activePeriodId }] }));
    }
    setAModal(false);
  };

  if (!selCourse) {
    const filteredCourses = courses.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));
    return (
      <div>
        <div style={{ marginBottom: 18 }}>
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>Cuadro de Calificaciones</h3>
          <p style={{ fontSize: 13, color: "var(--txt3)" }}>Las notas se suman directamente según el valor asignado a cada tarea.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {filteredCourses.map(c => {
            const gr = data.grades.find(g => g.id === c.gradeId);
            const t = data.users.find(u => u.id === c.teacherId);
            const studs = data.students.filter(s => s.gradeId === c.gradeId && s.status === "active").length;
            const asgns = data.assignments.filter(a => a.courseId === c.id).length;
            const maxPts = data.assignments.filter(a => a.courseId === c.id).reduce((x, y) => x + y.maxScore, 0);
            return (
              <div className="course-card" key={c.id} onClick={() => setSelCourse(c.id)}>
                <div style={{ height: 4, background: c.color }} />
                <div className="card-body">
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 3 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "var(--txt3)", marginBottom: 10 }}>{gr?.name} "{gr?.section}"</div>
                  <div style={{ display: "flex", gap: 10, fontSize: 12, color: "var(--txt2)" }}>
                    <span>👥 {studs}</span><span>📋 {asgns} tareas</span><span>🎯 {maxPts} pts</span>
                  </div>
                  {isAdmin(user) && <div style={{ fontSize: 11, color: "var(--txt3)", marginTop: 6, fontWeight: 600 }}>Prof. {t?.name}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const gr = data.grades.find(g => g.id === course.gradeId);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <button className="btn btn-ghost" onClick={() => setSelCourse(null)}>← Cursos</button>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 17 }}>{course.name} — {gr?.name} "{gr?.section}"</h3>
          <div style={{ fontSize: 12, color: "var(--txt3)" }}>
            Total máximo: <strong style={{ color: "var(--accent)" }}>{maxTotal} pts</strong> — Las notas se suman directamente (sin promediar)
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditA(null); setAForm({ name: "", type: "tarea", maxScore: 10, dueDate: "", instructions: "" }); setAModal(true); }}>
          + Asignar Tarea
        </button>
      </div>

      {assigns.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {assigns.map(a => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--bg3)", border: "1.5px solid var(--border)", borderRadius: 9, padding: "5px 10px" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: typeColors[a.type] }} />
              <span style={{ fontSize: 12.5, fontWeight: 700 }}>{a.name.slice(0, 22)}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", background: "var(--accl)", padding: "1px 6px", borderRadius: 99 }}>{a.maxScore}pts</span>
              {a.instructions && <span title={a.instructions} style={{ cursor: "help", fontSize: 13 }}>📌</span>}
              <button style={{ background: "none", border: "none", color: "var(--txt3)", cursor: "pointer", fontSize: 12, padding: 0 }} onClick={() => { setEditA(a); setAForm({ ...a }); setAModal(true); }}>✏️</button>
              <button style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 14, padding: 0 }} onClick={() => deleteAssign(a)} title="Eliminar">×</button>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ minWidth: 180 }}>Alumno</th>
                {assigns.map(a => (
                  <th key={a.id} style={{ textAlign: "center", minWidth: 80 }}>
                    <div style={{ color: typeColors[a.type], fontWeight: 800 }}>{typeLabels[a.type]}</div>
                    <div style={{ fontSize: 9.5, color: "var(--txt3)", textTransform: "none", fontWeight: 600 }}>{a.name.slice(0, 14)}</div>
                    <div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 800 }}>/{a.maxScore}</div>
                  </th>
                ))}
                <th style={{ textAlign: "center", minWidth: 100 }}>Total Acum.</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => {
                const total = totalScore(student.id, assigns, data.scores);
                return (
                  <tr key={student.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Av init={student.avatar} size="av-sm" />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{student.name}</div>
                          <div style={{ fontSize: 10, color: "var(--txt3)" }}>{student.code}</div>
                        </div>
                      </div>
                    </td>
                    {assigns.map(a => {
                      const sc = getScore(student.id, a.id);
                      const key = `${student.id}-${a.id}`;
                      return (
                        <td key={a.id} style={{ textAlign: "center" }}>
                          {editCell === key ? (
                            <input className="sc-inp" type="number" min="0" max={a.maxScore}
                              value={cellVal} onChange={e => setCellVal(e.target.value)}
                              onBlur={() => saveCell(student.id, a.id, a.maxScore)}
                              onKeyDown={e => { if (e.key === "Enter") saveCell(student.id, a.id, a.maxScore); if (e.key === "Escape") setEditCell(null); }}
                              autoFocus />
                          ) : (
                            <div style={{ cursor: "text", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}
                              onClick={() => { setEditCell(key); setCellVal(sc?.score ?? ""); }}>
                              <span style={{ fontWeight: 800, fontSize: 15, color: scoreColor(sc?.score, a.maxScore) }}>
                                {sc?.score != null ? sc.score : <span style={{ color: "var(--txt3)", fontSize: 13 }}>–</span>}
                              </span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 17, color: scoreColor(total, maxTotal) }}>{total}</span>
                        <span style={{ fontSize: 10, color: "var(--txt3)" }}>/ {maxTotal} pts</span>
                        <div className="prog" style={{ width: 50, marginTop: 3 }}>
                          <div className="prog-bar" style={{ width: `${maxTotal > 0 ? (total / maxTotal * 100) : 0}%`, background: scoreColor(total, maxTotal) }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {aModal && (
        <div className="overlay" onClick={() => setAModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{editA ? "Editar Evaluación" : "Nueva Tarea / Evaluación"}</div>
            <div className="fg"><label className="fl">Nombre</label><input className="fc" value={aForm.name} onChange={e => setAForm({ ...aForm, name: e.target.value })} placeholder="Ej: Examen Parcial 1" /></div>
            <div className="fr">
              <div className="fg"><label className="fl">Tipo</label>
                <select className="fc" value={aForm.type} onChange={e => setAForm({ ...aForm, type: e.target.value })}>
                  <option value="tarea">Tarea</option><option value="examen">Examen</option>
                  <option value="proyecto">Proyecto</option><option value="laboratorio">Laboratorio</option>
                </select></div>
              <div className="fg"><label className="fl">Valor máximo (pts)</label><input className="fc" type="number" min="1" value={aForm.maxScore} onChange={e => setAForm({ ...aForm, maxScore: e.target.value })} /></div>
            </div>
            <div className="fr">
              <div className="fg"><label className="fl">Fecha de entrega</label><input className="fc" type="date" value={aForm.dueDate} onChange={e => setAForm({ ...aForm, dueDate: e.target.value })} /></div>
            </div>
            <div className="fg"><label className="fl">📌 Instrucciones / Comentarios</label><textarea className="fc" rows={3} value={aForm.instructions} onChange={e => setAForm({ ...aForm, instructions: e.target.value })} placeholder="Instrucciones detalladas para los alumnos..." /></div>
            <div className="info-box">Nota: La nota asignada se suma directamente al total acumulado. Ej: si pones 8/10, se suman 8 puntos.</div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setAModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveAssign}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
