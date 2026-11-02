import { useState } from "react";
import { mkId } from "../lib/credentials";
import Av from "../components/Avatar";
import { isAdmin } from "../lib/roles";
import { todayISO } from "../lib/format";

export default function AttendancePage({ data, setData, user, search }) {
  const [selCourse, setSelCourse] = useState(null);
  const [date, setDate] = useState(todayISO());
  const courses = isAdmin(user) ? data.courses : data.courses.filter(c => c.teacherId === user.id);
  const course = courses.find(c => c.id === selCourse);
  const students = course ? data.students.filter(s => s.gradeId === course.gradeId && s.status === "active").filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase())) : [];

  const getAtt = sid => data.attendance.find(a => a.studentId === sid && a.courseId === selCourse && a.date === date);
  const setAtt = (sid, status) => setData(d => {
    const ex = d.attendance.find(a => a.studentId === sid && a.courseId === selCourse && a.date === date);
    if (ex) return { ...d, attendance: d.attendance.map(a => a.studentId === sid && a.courseId === selCourse && a.date === date ? { ...a, status } : a) };
    return { ...d, attendance: [...d.attendance, { id: mkId(), studentId: sid, courseId: selCourse, date, status }] };
  });
  const markAll = (status) => setData(d => {
    const ids = new Set(students.map(s => s.id));
    const kept = d.attendance.filter(a => !(ids.has(a.studentId) && a.courseId === selCourse && a.date === date));
    const prev = new Map(d.attendance.filter(a => ids.has(a.studentId) && a.courseId === selCourse && a.date === date).map(a => [a.studentId, a]));
    return { ...d, attendance: [...kept, ...students.map(s => ({ ...(prev.get(s.id) || { id: mkId(), studentId: s.id, courseId: selCourse, date }), status }))] };
  });

  if (!selCourse) {
    return (
      <div>
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>Control de Asistencia</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {courses.map(c => {
            const gr = data.grades.find(g => g.id === c.gradeId);
            const today = data.attendance.filter(a => a.courseId === c.id && a.date === todayISO()).length;
            return (
              <div className="course-card" key={c.id} onClick={() => setSelCourse(c.id)}>
                <div style={{ height: 4, background: c.color }} />
                <div className="card-body">
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 3 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "var(--txt3)", marginBottom: 8 }}>{gr?.name} "{gr?.section}"</div>
                  <div style={{ fontSize: 12, color: today > 0 ? "var(--green)" : "var(--txt3)" }}>
                    {today > 0 ? `✅ ${today} registros hoy` : "📋 Sin registros hoy"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const gr = data.grades.find(g => g.id === course.gradeId);
  const summary = { present: 0, absent: 0, late: 0 };
  students.forEach(s => { const a = getAtt(s.id); if (a) summary[a.status]++; });

  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18 }}>
        <button className="btn btn-ghost" onClick={() => setSelCourse(null)}>← Cursos</button>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 17 }}>{course.name} — {gr?.name} "{gr?.section}"</h3>
        </div>
        <input type="date" className="fc" style={{ width: 165 }} value={date} onChange={e => setDate(e.target.value)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 18 }}>
        {[["present", "✅", "Presente", "var(--green)"], ["absent", "❌", "Ausente", "var(--red)"], ["late", "⏰", "Tarde", "var(--yellow)"]].map(([s, ic, lb, col]) => (
          <div key={s} style={{ background: "var(--surf)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 22 }}>{ic}</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 26, color: col }}>{summary[s]}</div>
            <div style={{ fontSize: 12, color: "var(--txt3)", fontWeight: 700 }}>{lb}</div>
          </div>
        ))}
        <div style={{ background: "var(--surf)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: 14, display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--txt3)", marginBottom: 4 }}>MARCAR TODO</div>
          <button className="btn btn-success btn-sm" style={{ justifyContent: "center" }} onClick={() => markAll("present")}>✅ Todos Presentes</button>
          <button className="btn btn-danger btn-sm" style={{ justifyContent: "center" }} onClick={() => markAll("absent")}>❌ Todos Ausentes</button>
        </div>
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Alumno</th><th>Estado Actual</th><th style={{ textAlign: "center" }}>Registrar</th></tr></thead>
            <tbody>
              {students.map(s => {
                const a = getAtt(s.id);
                return (
                  <tr key={s.id}>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 9 }}><Av init={s.avatar} /><span style={{ fontWeight: 700 }}>{s.name}</span></div></td>
                    <td>{a ? <span className={`badge badge-${a.status}`}>{a.status === "present" ? "✅ Presente" : a.status === "absent" ? "❌ Ausente" : "⏰ Tarde"}</span> : <span style={{ color: "var(--txt3)", fontSize: 12 }}>Sin registrar</span>}</td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        {[["present", "✅"], ["absent", "❌"], ["late", "⏰"]].map(([st, ic]) => (
                          <button key={st} className={`att-btn ${a?.status === st ? st : ""}`} onClick={() => setAtt(s.id, st)}>{ic}</button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
