import { useState, useMemo } from "react";
import { mkId } from "../lib/credentials";
import Av from "../components/Avatar";

export default function QuickGrade({ data, setData, user }) {
  const [q, setQ] = useState("");
  const [selStudent, setSelStudent] = useState(null);
  const [selAssign, setSelAssign] = useState(null);
  const [scoreVal, setScoreVal] = useState("");
  const [saved, setSaved] = useState(false);

  const myCourses = data.courses.filter(c => c.teacherId === user.id);

  const students = useMemo(() => {
    if (!q.trim()) return [];
    const myGradeIds = new Set(myCourses.map(c => c.gradeId));
    return data.students.filter(s => s.status === "active" && myGradeIds.has(s.gradeId) && (s.name.toLowerCase().includes(q.toLowerCase()) || s.code.includes(q)));
  }, [q, data.students, myCourses]);

  const studentCourseAssigns = selStudent ? (() => {
    const st = data.students.find(s => s.id === selStudent);
    const courses = myCourses.filter(c => c.gradeId === st.gradeId);
    return courses.flatMap(c => {
      const asgns = data.assignments.filter(a => a.courseId === c.id);
      return asgns.map(a => ({ ...a, courseName: c.name }));
    });
  })() : [];

  const assign = studentCourseAssigns.find(a => a.id === selAssign);
  const currScore = selStudent && selAssign ? data.scores.find(s => s.studentId === selStudent && s.assignmentId === selAssign) : null;

  const saveScore = () => {
    if (!selStudent || !selAssign || scoreVal === "") return;
    const max = assign?.maxScore || 100;
    const parsed = parseFloat(scoreVal);
    if (Number.isNaN(parsed)) return;
    const val = Math.round(Math.min(max, Math.max(0, parsed)) * 10) / 10;
    setData(d => {
      const ex = d.scores.find(s => s.studentId === selStudent && s.assignmentId === selAssign);
      if (ex) return { ...d, scores: d.scores.map(s => s.studentId === selStudent && s.assignmentId === selAssign ? { ...s, score: val, submitted: true } : s) };
      return { ...d, scores: [...d.scores, { id: mkId(), studentId: selStudent, assignmentId: selAssign, score: val, submitted: true }] };
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <div style={{ maxWidth: 680 }}>
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>⚡ Asignación Rápida de Notas</h3>
          <p style={{ fontSize: 13, color: "var(--txt3)" }}>Busca un alumno por nombre y asigna una nota directamente sin navegar al cuadro completo.</p>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="fg">
              <label className="fl">🔍 Buscar Alumno</label>
              <input className="fc" value={q} onChange={e => { setQ(e.target.value); setSelStudent(null); setSelAssign(null); setSaved(false); }} placeholder="Escribe el nombre del alumno..." />
            </div>

            {students.length > 0 && !selStudent && (
              <div style={{ border: "1.5px solid var(--border)", borderRadius: 9, overflow: "hidden", marginBottom: 14 }}>
                {students.map(s => {
                  const gr = data.grades.find(g => g.id === s.gradeId);
                  return (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", transition: "var(--trans)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      onClick={() => setSelStudent(s.id)}>
                      <Av init={s.avatar} /><div><div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div><div style={{ fontSize: 11, color: "var(--txt3)" }}>{s.code} · {gr?.name}</div></div>
                    </div>
                  );
                })}
              </div>
            )}

            {selStudent && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--accl)", border: "1.5px solid rgba(79,126,247,0.2)", borderRadius: 9, marginBottom: 14 }}>
                  <Av init={data.students.find(s => s.id === selStudent)?.avatar} size="av-sm" />
                  <span style={{ fontWeight: 700, color: "var(--accent)" }}>{data.students.find(s => s.id === selStudent)?.name}</span>
                  <button className="btn btn-xs btn-ghost" style={{ marginLeft: "auto" }} onClick={() => { setSelStudent(null); setQ(""); }}>Cambiar</button>
                </div>

                <div className="fg">
                  <label className="fl">Seleccionar Tarea / Evaluación</label>
                  <select className="fc" value={selAssign || ""} onChange={e => { setSelAssign(parseInt(e.target.value)); setScoreVal(""); setSaved(false); }}>
                    <option value="">Seleccionar...</option>
                    {studentCourseAssigns.map(a => (
                      <option key={a.id} value={a.id}>{a.courseName} — {a.name} (/{a.maxScore}pts)</option>
                    ))}
                  </select>
                </div>

                {selAssign && (
                  <div className="qg-result">
                    {assign?.instructions && <div style={{ fontSize: 12, color: "var(--txt2)", marginBottom: 10 }}>📌 {assign.instructions}</div>}
                    {currScore?.score != null && (
                      <div className="info-box" style={{ marginBottom: 10 }}>Nota actual: <strong>{currScore.score}</strong> / {assign?.maxScore}pts. Puedes actualizarla.</div>
                    )}
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                      <div style={{ flex: 1 }}>
                        <label className="fl">Nota (máx. {assign?.maxScore}pts)</label>
                        <input className="fc" type="number" min="0" max={assign?.maxScore} value={scoreVal} onChange={e => setScoreVal(e.target.value)} placeholder="0" onKeyDown={e => e.key === "Enter" && saveScore()} />
                      </div>
                      <button className="btn btn-primary" style={{ height: 40 }} onClick={saveScore}>Guardar Nota</button>
                    </div>
                    {saved && <div className="success-box" style={{ marginTop: 10 }}>✅ Nota guardada correctamente.</div>}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
