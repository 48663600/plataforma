import { typeColors } from "../lib/format";

export default function MyCourses({ data, user, search }) {
  const courses = data.courses.filter(c => c.teacherId === user.id).filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 16, marginBottom: 4 }}>Mis Cursos Asignados</h3>
        <p style={{ fontSize: 13, color: "var(--txt3)" }}>Cursos y grados asignados por la Dirección para este ciclo escolar.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
        {courses.map(c => {
          const gr = data.grades.find(g => g.id === c.gradeId);
          const students = data.students.filter(s => s.gradeId === c.gradeId && s.status === "active");
          const assigns = data.assignments.filter(a => a.courseId === c.id);
          const graded = data.scores.filter(s => assigns.map(a => a.id).includes(s.assignmentId) && s.score != null).length;
          const maxPts = assigns.reduce((x, y) => x + y.maxScore, 0);
          return (
            <div className="card" key={c.id}>
              <div style={{ height: 4, background: c.color }} />
              <div className="card-body">
                <h3 style={{ fontSize: 18, marginBottom: 3 }}>{c.name}</h3>
                <div style={{ fontSize: 13, color: "var(--txt3)", marginBottom: 16 }}>{gr?.name} "{gr?.section}" · {gr?.level}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
                  {[["👥", students.length, "Alumnos", "#4f7ef7"], ["📋", assigns.length, "Tareas", "#22c55e"], ["✅", graded, "Calificadas", "#f59e0b"], ["🎯", maxPts, "Pts Máx", "#8b5cf6"]].map(([ic, v, lb, col]) => (
                    <div key={lb} style={{ textAlign: "center", background: "var(--bg3)", borderRadius: 9, padding: "10px 6px" }}>
                      <div style={{ fontSize: 16 }}>{ic}</div>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 18, color: col }}>{v}</div>
                      <div style={{ fontSize: 10, color: "var(--txt3)", fontWeight: 700 }}>{lb}</div>
                    </div>
                  ))}
                </div>
                {assigns.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--txt3)", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".06em" }}>Evaluaciones publicadas</div>
                    {assigns.map(a => (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: typeColors[a.type], flexShrink: 0 }} />
                        <div style={{ flex: 1, fontSize: 13 }}>{a.name}</div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "var(--accent)" }}>{a.maxScore}pts</span>
                        <span style={{ fontSize: 11, color: "var(--txt3)" }}>{a.dueDate}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
