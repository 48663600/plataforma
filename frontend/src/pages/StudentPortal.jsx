import { useState } from "react";
import { scoreColor, totalScore, maxPossible } from "../lib/grades";
import { typeColors, typeLabels, severityLabels, incidentTypes } from "../lib/format";
import Av from "../components/Avatar";

export default function StudentPortal({ data, user }) {
  const [tab, setTab] = useState("grades");
  const gr = data.grades.find(g => g.id === user.gradeId);
  const myCourses = data.courses.filter(c => c.gradeId === user.gradeId);
  const myIncidents = data.incidents.filter(i => i.studentId === user.id);
  const myAnn = data.announcements.filter(a => a.target === "all" || a.gradeId === user.gradeId || myCourses.some(c => c.id === a.courseId));

  return (
    <div>
      <div className="portal-hd">
        <Av init={user.avatar} size="av-xl" />
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>¡Hola, {user.name.split(" ")[0]}! 👋</h2>
          <div style={{ fontSize: 13, color: "var(--txt3)", marginBottom: 8 }}>Código: {user.code} · {gr?.name} "{gr?.section}"</div>
          <span className="badge badge-student">Alumno Activo</span>
        </div>
        {myIncidents.length > 0 && (
          <div style={{ textAlign: "center", background: "var(--redl)", borderRadius: 12, padding: "12px 18px", border: "1.5px solid rgba(220,38,38,0.2)" }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 28, color: "var(--red)" }}>{myIncidents.length}</div>
            <div style={{ fontSize: 12, color: "var(--red)", fontWeight: 700 }}>Reportes</div>
          </div>
        )}
      </div>

      <div className="tabs">
        {[["grades", "📊 Mis Notas"], ["assignments", "📋 Tareas"], ["incidents", `⚠️ Reportes (${myIncidents.length})`], ["announcements", "📢 Avisos"]].map(([id, lbl]) => (
          <button key={id} className={`tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>{lbl}</button>
        ))}
      </div>

      {tab === "grades" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {myCourses.map(course => {
            const teacher = data.users.find(u => u.id === course.teacherId);
            const assigns = data.assignments.filter(a => a.courseId === course.id);
            const total = totalScore(user.id, assigns, data.scores);
            const maxP = maxPossible(assigns);
            return (
              <div className="card" key={course.id}>
                <div style={{ height: 4, background: course.color }} />
                <div className="card-hd">
                  <div><div className="card-title">{course.name}</div><div style={{ fontSize: 11, color: "var(--txt3)" }}>Prof. {teacher?.name}</div></div>
                  <div style={{ marginLeft: "auto", textAlign: "center" }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 22, color: scoreColor(total, maxP) }}>{total}</div>
                    <div style={{ fontSize: 10, color: "var(--txt3)" }}>/ {maxP} pts</div>
                  </div>
                </div>
                <div style={{ padding: "0 18px" }}>
                  {assigns.map(a => {
                    const sc = data.scores.find(s => s.studentId === user.id && s.assignmentId === a.id);
                    return (
                      <div className="mini-row" key={a.id}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: typeColors[a.type] }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                          {a.instructions && <div style={{ fontSize: 11, color: "var(--txt3)" }}>📌 {a.instructions.length > 55 ? `${a.instructions.slice(0, 55)}…` : a.instructions}</div>}
                        </div>
                        <span style={{ fontSize: 11, color: "var(--txt3)" }}>/{a.maxScore}</span>
                        <span style={{ fontWeight: 800, fontSize: 15, color: scoreColor(sc?.score, a.maxScore), minWidth: 32, textAlign: "right" }}>
                          {sc?.score != null ? sc.score : <span style={{ color: "var(--txt3)", fontSize: 13 }}>–</span>}
                        </span>
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 0", gap: 6, fontSize: 12, color: "var(--txt3)" }}>
                    <span>Total acumulado:</span><span style={{ fontWeight: 800, color: scoreColor(total, maxP) }}>{total} / {maxP} pts</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "assignments" && (
        <div className="card">
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Tarea / Evaluación</th><th>Curso</th><th>Tipo</th><th>Pts máx.</th><th>Entrega</th><th>Instrucciones</th><th>Mi Nota</th></tr></thead>
              <tbody>
                {data.assignments.filter(a => myCourses.map(c => c.id).includes(a.courseId)).map(a => {
                  const co = myCourses.find(c => c.id === a.courseId);
                  const sc = data.scores.find(s => s.studentId === user.id && s.assignmentId === a.id);
                  return (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 700 }}>{a.name}</td>
                      <td><div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: co?.color }} />{co?.name}</div></td>
                      <td><span style={{ color: typeColors[a.type], fontWeight: 700, fontSize: 12 }}>{typeLabels[a.type]}</span></td>
                      <td><span style={{ fontWeight: 800, color: "var(--accent)" }}>{a.maxScore}</span></td>
                      <td style={{ fontSize: 12, color: "var(--txt3)" }}>{a.dueDate}</td>
                      <td style={{ fontSize: 12, color: "var(--txt2)", maxWidth: 200 }}>{a.instructions || <span style={{ color: "var(--txt3)" }}>–</span>}</td>
                      <td><span style={{ fontWeight: 800, color: scoreColor(sc?.score, a.maxScore) }}>{sc?.score != null ? sc.score : <span style={{ color: "var(--txt3)" }}>–</span>}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "incidents" && (
        <div>
          {myIncidents.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "var(--txt3)" }}>🎉 ¡Sin reportes! Excelente comportamiento.</div>}
          {myIncidents.map(inc => {
            const author = data.users.find(u => u.id === inc.authorId);
            return (
              <div className="incident-card" key={inc.id}>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <span className={`badge badge-${inc.severity}`}>{severityLabels[inc.severity]}</span>
                  <span style={{ fontWeight: 800, color: "var(--txt)" }}>{incidentTypes[inc.type] || inc.type}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--txt3)" }}>{inc.date}</span>
                </div>
                <div style={{ fontSize: 13.5, color: "var(--txt)", marginBottom: 8 }}>{inc.description}</div>
                <div style={{ fontSize: 12.5, color: "var(--txt2)" }}>📋 <strong>Medida tomada:</strong> {inc.justification || "–"}</div>
                <div style={{ fontSize: 11, color: "var(--txt3)", marginTop: 6 }}>Reportado por: {author?.name || "Sistema"}</div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "announcements" && (
        <div>
          {myAnn.map(a => {
            const author = [...data.users, ...data.students].find(u => u.id === a.authorId);
            return (
              <div key={a.id} style={{ background: "var(--surf)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: 18, marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 7 }}>
                  <span className={`badge badge-${a.priority}`}>{a.priority === "high" ? "🔴 Urgente" : a.priority === "medium" ? "🟡 Normal" : "🟢 Info"}</span>
                  <h3 style={{ fontSize: 15 }}>{a.title}</h3>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--txt3)" }}>{a.date}</span>
                </div>
                <p style={{ fontSize: 13.5, color: "var(--txt2)", lineHeight: 1.65 }}>{a.content}</p>
                <div style={{ fontSize: 11, color: "var(--txt3)", marginTop: 8, fontWeight: 600 }}>Publicado por: {author?.name || "Sistema"}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
