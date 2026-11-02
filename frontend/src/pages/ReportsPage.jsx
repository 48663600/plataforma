import { useState } from "react";
import { scoreColor, totalScore, maxPossible } from "../lib/grades";
import Av from "../components/Avatar";

export default function ReportsPage({ data, search }) {
  const [tab, setTab] = useState("general");
  const allSc = data.scores.filter(s => s.score != null);
  const maxById = new Map(data.assignments.map(a => [a.id, Number(a.maxScore) || 0]));
  const allPct = allSc.filter(s => maxById.get(s.assignmentId) > 0).map(s => (s.score / maxById.get(s.assignmentId)) * 100);
  const avg = allPct.length ? `${Math.round(allPct.reduce((a, b) => a + b, 0) / allPct.length)}%` : "–";

  const studentSearch = search || "";
  const filteredStudents = data.students.filter(s => !studentSearch || s.name.toLowerCase().includes(studentSearch.toLowerCase()));

  const studentStats = filteredStudents.map(s => {
    const gr = data.grades.find(g => g.id === s.gradeId);
    const courses = data.courses.filter(c => c.gradeId === s.gradeId);
    const totalPts = courses.reduce((sum, c) => {
      const asgns = data.assignments.filter(a => a.courseId === c.id);
      return sum + totalScore(s.id, asgns, data.scores);
    }, 0);
    const maxPts = courses.reduce((sum, c) => sum + maxPossible(data.assignments.filter(a => a.courseId === c.id)), 0);
    const incs = data.incidents.filter(i => i.studentId === s.id).length;
    return { ...s, gr, totalPts, maxPts, incs };
  }).sort((a, b) => b.totalPts - a.totalPts);

  return (
    <div>
      <div className="tabs">
        {[["general", "📊 General"], ["students", "👤 Por Alumno"], ["courses", "📚 Por Curso"]].map(([id, lbl]) => (
          <button key={id} className={`tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>{lbl}</button>
        ))}
      </div>

      {tab === "general" && (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="stat-card"><div className="stat-icon" style={{ background: "var(--accl)", color: "var(--accent)" }}>📊</div><div className="stat-val">{avg}</div><div className="stat-lbl">Rendimiento General</div></div>
            <div className="stat-card"><div className="stat-icon" style={{ background: "rgba(22,163,74,0.12)", color: "var(--green)" }}>✅</div><div className="stat-val">{data.scores.filter(s => s.submitted).length}</div><div className="stat-lbl">Notas Registradas</div></div>
            <div className="stat-card"><div className="stat-icon" style={{ background: "rgba(220,38,38,0.12)", color: "var(--red)" }}>⚠️</div><div className="stat-val">{data.incidents.length}</div><div className="stat-lbl">Total Reportes</div></div>
          </div>
          <div className="card">
            <div className="card-hd"><span style={{ fontSize: 17 }}>🎯</span><div className="card-title">Resumen por Grado</div></div>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Grado</th><th>Alumnos</th><th>Cursos</th><th>Reportes</th></tr></thead>
                <tbody>
                  {data.grades.map(g => {
                    const studs = data.students.filter(s => s.gradeId === g.id && s.status === "active").length;
                    const crs = data.courses.filter(c => c.gradeId === g.id).length;
                    const incs = data.incidents.filter(i => data.students.find(s => s.id === i.studentId)?.gradeId === g.id).length;
                    return (
                      <tr key={g.id}>
                        <td style={{ fontWeight: 700 }}>{g.name} "{g.section}"</td>
                        <td>{studs}</td><td>{crs}</td>
                        <td><span style={{ color: incs > 0 ? "var(--red)" : "var(--green)", fontWeight: 700 }}>{incs}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "students" && (
        <div className="card">
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>#</th><th>Alumno</th><th>Grado</th><th>Puntos Acumulados</th><th>Reportes</th></tr></thead>
              <tbody>
                {studentStats.map((s, i) => (
                  <tr key={s.id}>
                    <td><span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 16, color: i < 3 ? ["#f59e0b", "#6b7280", "#b45309"][i] : "var(--txt3)" }}>{i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${i + 1}`}</span></td>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 9 }}><Av init={s.avatar} /><span style={{ fontWeight: 700 }}>{s.name}</span></div></td>
                    <td>{s.gr?.name} "{s.gr?.section}"</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 17, color: scoreColor(s.totalPts, s.maxPts) }}>{s.totalPts}</span>
                        <span style={{ fontSize: 11, color: "var(--txt3)" }}>/ {s.maxPts} pts</span>
                        <div className="prog" style={{ width: 60 }}><div className="prog-bar" style={{ width: `${s.maxPts > 0 ? (s.totalPts / s.maxPts * 100) : 0}%`, background: scoreColor(s.totalPts, s.maxPts) }} /></div>
                      </div>
                    </td>
                    <td>{s.incs > 0 ? <span className="badge badge-high">⚠️ {s.incs}</span> : <span style={{ color: "var(--green)", fontSize: 13 }}>✅ 0</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "courses" && (
        <div className="card">
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Curso</th><th>Grado</th><th>Docente</th><th>Tareas</th><th>Notas Reg.</th><th>Prom. Pts</th></tr></thead>
              <tbody>
                {data.courses.map(c => {
                  const aIds = data.assignments.filter(a => a.courseId === c.id).map(a => a.id);
                  const scs = data.scores.filter(s => aIds.includes(s.assignmentId) && s.score != null).map(s => s.score);
                  const ca = scs.length ? Math.round(scs.reduce((a, b) => a + b, 0) / scs.length * 10) / 10 : null;
                  const gr = data.grades.find(g => g.id === c.gradeId);
                  const t = data.users.find(u => u.id === c.teacherId);
                  return (
                    <tr key={c.id}>
                      <td><div style={{ display: "flex", alignItems: "center", gap: 7 }}><div style={{ width: 9, height: 9, borderRadius: "50%", background: c.color }} /><span style={{ fontWeight: 700 }}>{c.name}</span></div></td>
                      <td>{gr?.name} "{gr?.section}"</td>
                      <td><div style={{ display: "flex", alignItems: "center", gap: 6 }}><Av init={t?.avatar || "?"} size="av-sm" /><span>{t?.name || "–"}</span></div></td>
                      <td>{aIds.length}</td><td>{scs.length}</td>
                      <td><span style={{ fontWeight: 800, color: "var(--accent)" }}>{ca ?? "–"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
