import { useState } from "react";
import * as XLSX from "xlsx";
import { isAdmin } from "../lib/roles";

export default function GeneralReports({ data, user }) {
  const [selGrade, setSelGrade] = useState("");
  const [selCourse, setSelCourse] = useState("");

  const isTeacher = !isAdmin(user);

  // Filtrar cursos según el rol
  const allowedCourses = isTeacher
    ? data.courses.filter(c => c.teacherId === user.id)
    : data.courses;

  // Filtrar grados según el rol (el profesor solo ve grados donde dicta)
  const allowedGradeIds = new Set(allowedCourses.map(c => c.gradeId));
  const allowedGrades = isTeacher
    ? data.grades.filter(g => allowedGradeIds.has(g.id))
    : data.grades;

  const filteredCourses = allowedCourses.filter(c => !selGrade || c.gradeId === parseInt(selGrade));

  const students = data.students.filter(s => s.gradeId === parseInt(selGrade)).filter(s => s.status === "active");
  const reportAssignments = data.assignments
    .filter(a => a.courseId === parseInt(selCourse))
    .sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime() || a.id - b.id);

  const rows = students.map((s, idx) => {
    const gradesPerAssignment = reportAssignments.map(a => {
      const sc = data.scores.find(sc => sc.studentId === s.id && sc.assignmentId === a.id);
      return sc?.score;
    });
    const totalScore = Math.round(gradesPerAssignment.reduce((sum, v) => sum + (typeof v === "number" ? v : 0), 0) * 10) / 10;
    return { s, idx, gradesPerAssignment, totalScore };
  });

  const doExportExcel = () => {
    try {
      const gradeName = data.grades.find(g => g.id === parseInt(selGrade))?.name || "Grado";
      const courseName = data.courses.find(c => c.id === parseInt(selCourse))?.name || "Materia";
      const headers = ["No.", "Estudiante", ...reportAssignments.map(a => `${a.name} /${a.maxScore}`), "Total Obtenido"];
      const sheetRows = rows.map(({ s, idx, gradesPerAssignment, totalScore }) => [
        idx + 1, s.name, ...gradesPerAssignment.map(v => (typeof v === "number" ? v : "—")), totalScore
      ]);
      const ws = XLSX.utils.aoa_to_sheet([
        [`CUADRO GENERAL DE CALIFICACIONES - ${gradeName} - ${courseName}`],
        [],
        headers,
        ...sheetRows,
      ]);
      ws["!cols"] = [{ wch: 5 }, { wch: 35 }, ...reportAssignments.map(() => ({ wch: 16 })), { wch: 16 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Cuadro General");
      const safe = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w-]+/g, "_");
      XLSX.writeFile(wb, `Cuadro_${safe(gradeName)}_${safe(courseName)}.xlsx`);
    } catch (e) {
      console.error("Export error:", e);
      window.print();
    }
  };

  return (
    <div>
      <div style={{ background: "var(--surf)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: 20, marginBottom: 20, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }} className="no-print">
        <div style={{ flex: 1, minWidth: 200 }}>
          <label className="fl">Grado</label>
          <select className="fc" value={selGrade} onChange={e => { setSelGrade(e.target.value); setSelCourse(""); }}>
            <option value="">Seleccionar Grado</option>
            {allowedGrades.map(g => <option key={g.id} value={g.id}>{g.name} "{g.section}"</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label className="fl">Materia / Curso</label>
          <select className="fc" value={selCourse} onChange={e => setSelCourse(e.target.value)} disabled={!selGrade}>
            <option value="">Seleccionar Curso</option>
            {filteredCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={doExportExcel} style={{ height: 40 }} disabled={!selGrade || !selCourse}>📊 Exportar Excel</button>
          <button className="btn btn-ghost" onClick={() => window.print()} style={{ height: 40 }} disabled={!selGrade || !selCourse}>🖨️ Imprimir</button>
        </div>
      </div>

      {selGrade && selCourse ? (
        <div className="bulletin-sheet" style={{ maxWidth: "100%", width: "auto" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900 }}>CUADRO GENERAL DE CALIFICACIONES</h2>
            <div style={{ color: "var(--txt3)", fontSize: 13 }}>
              {data.grades.find(g => g.id === parseInt(selGrade))?.name} — Materia: {data.courses.find(c => c.id === parseInt(selCourse))?.name}
            </div>
          </div>
          <div className="tbl-wrap" style={{ overflowX: "auto" }}>
            <table className="report-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Estudiante</th>
                  {reportAssignments.map(a => (
                    <th key={a.id} style={{ textAlign: "center", minWidth: 120 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 800 }}>{a.name}</div>
                      <div style={{ fontSize: 10, opacity: 0.7 }}>/{a.maxScore}</div>
                    </th>
                  ))}
                  <th style={{ textAlign: "center", background: "#f1f5f9" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ s, idx, gradesPerAssignment, totalScore }) => (
                  <tr key={s.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 700 }}>{s.name}</td>
                    {gradesPerAssignment.map((g, i) => <td key={i} style={{ textAlign: "center" }}>{typeof g === "number" ? g : "–"}</td>)}
                    <td style={{ textAlign: "center", fontWeight: 900, fontSize: 15, background: "#f8fafc" }}>{totalScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: "center", padding: 60, color: "var(--txt3)" }}>
          <div style={{ fontSize: 50 }}>📊</div>
          <h3>{selGrade ? "Selecciona un curso para visualizar el cuadro general" : "Selecciona un grado y curso para generar el cuadro"}</h3>
        </div>
      )}
    </div>
  );
}
