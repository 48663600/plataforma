import { useState, useRef, useMemo } from "react";
import { scoreColor, getPeriodAvg, calculateFinalGrade } from "../lib/grades";

export default function BulletinPage({ data, search }) {
  const [selGrade, setSelGrade] = useState("");
  const [selStudent, setSelStudent] = useState(null);
  const printRef = useRef(null);

  const students = useMemo(() => data.students.filter(s => {
    const g = !selGrade || s.gradeId === parseInt(selGrade);
    const q = !search || s.name.toLowerCase().includes(search.toLowerCase());
    return g && q && s.status === "active";
  }), [data.students, selGrade, search]);

  const renderBulletin = (studentId) => {
    const student = data.students.find(s => s.id === studentId);
    const gr = data.grades.find(g => g.id === student?.gradeId);
    const courses = data.courses.filter(c => c.gradeId === student?.gradeId);
    const periods = data.periods || [];

    return (
      <div ref={printRef} className="bulletin-sheet" id="bulletin-print">
        <div className="bulletin-header">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 10 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#4f7ef7,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, color: "#fff" }}>A</div>
            <div>
              <div className="bulletin-title">AcademiQ — Boletín de Calificaciones</div>
              <div className="bulletin-sub">Consolidado Anual Ponderado</div>
            </div>
          </div>
        </div>
        <div className="bulletin-student">
          {[["Nombre completo", student?.name], ["Código", student?.code], ["Grado", `${gr?.name} — Sección "${gr?.section}"`], ["Nivel", gr?.level]].map(([l, v]) => (
            <div className="bulletin-field" key={l}><span style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{l}</span><strong>{v}</strong></div>
          ))}
        </div>
        <div className="bulletin-table">
          <table>
            <thead>
              <tr>
                <th>Curso / Materia</th>
                <th>Docente</th>
                {periods.map(p => (
                  <th key={p.id} style={{ textAlign: "center", minWidth: 60 }}>
                    {p.name}<br />
                    <span style={{ fontSize: 9, opacity: 0.8 }}>({Math.round(p.weight * 100)}%)</span>
                  </th>
                ))}
                <th style={{ textAlign: "center" }}>Nota Final</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(c => {
                const teacher = data.users.find(u => u.id === c.teacherId);
                const final = calculateFinalGrade(studentId, c.id, data);
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700 }}>{c.name}</td>
                    <td style={{ fontSize: 12, color: "#64748b" }}>{teacher?.name || "–"}</td>
                    {periods.map(p => {
                      const avg = getPeriodAvg(studentId, c.id, p.id, data);
                      return <td key={p.id} style={{ textAlign: "center", fontWeight: 700, color: scoreColor(avg, 100) }}>{avg == null ? "–" : Math.round(avg * 10) / 10}</td>;
                    })}
                    <td style={{ textAlign: "center", fontWeight: 900, fontSize: 16, color: scoreColor(final, 100) }}>{final}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="bulletin-footer">
          <div className="sig-line">Firma del Director</div>
          <div className="sig-line">Firma del Padre/Tutor</div>
        </div>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "#94a3b8" }}>
          Generado con AcademiQ — Sistema de Gestión Escolar · {new Date().toLocaleDateString("es")}
        </div>
      </div>
    );
  };

  const doPrint = () => window.print();

  return (
    <div>
      <div style={{ background: "var(--surf)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: 20, marginBottom: 20, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }} className="no-print">
        <div style={{ flex: 1, minWidth: 200 }}>
          <label className="fl">Seleccionar Grado</label>
          <select className="fc" value={selGrade} onChange={e => { setSelGrade(e.target.value); setSelStudent(null); }}>
            <option value="">Todos los grados</option>
            {data.grades.map(g => <option key={g.id} value={g.id}>{g.name} "{g.section}"</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label className="fl">Alumno</label>
          <select className="fc" value={selStudent || ""} onChange={e => setSelStudent(e.target.value ? parseInt(e.target.value) : null)}>
            <option value="">Seleccionar alumno</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        {selStudent && <button className="btn btn-primary" onClick={doPrint} style={{ height: 40 }}>🖨️ Imprimir Boletín</button>}
      </div>

      {!selStudent && (
        <div className="card">
          <div className="card-body">
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--txt3)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--txt)", marginBottom: 6 }}>Selecciona un alumno para generar el boletín</div>
              <div style={{ fontSize: 13 }}>Elige el grado y alumno en los filtros de arriba</div>
            </div>
          </div>
        </div>
      )}

      {selStudent && renderBulletin(selStudent)}
    </div>
  );
}
