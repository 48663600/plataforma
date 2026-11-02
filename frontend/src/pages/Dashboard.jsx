import { isAdmin } from "../lib/roles";
export default function Dashboard({ data, user, setPage }) {
  const active = data.students.filter(s => s.status === "active").length;
  const allSc = data.scores.filter(s => s.score != null);
  const maxById = new Map(data.assignments.map(a => [a.id, Number(a.maxScore) || 0]));
  const allPct = allSc.filter(s => maxById.get(s.assignmentId) > 0).map(s => (s.score / maxById.get(s.assignmentId)) * 100);
  const generalAvg = allPct.length ? `${Math.round(allPct.reduce((a, b) => a + b, 0) / allPct.length)}%` : "–";
  const teachers = data.users.filter(u => u.role === "teacher").length;

  const myTeacherCourses = !isAdmin(user)
    ? data.courses.filter(c => c.teacherId === user.id)
    : data.courses;

  const barData = myTeacherCourses.slice(0, 5).map(c => {
    // Rendimiento en % (nota / valor máximo de cada tarea), para comparar cursos con distinto puntaje.
    const maxById = new Map(data.assignments.filter(a => a.courseId === c.id).map(a => [a.id, Number(a.maxScore) || 0]));
    const pcts = data.scores.filter(s => maxById.get(s.assignmentId) > 0 && s.score != null).map(s => (s.score / maxById.get(s.assignmentId)) * 100);
    const gr = data.grades.find(g => g.id === c.gradeId);
    return { name: c.name.slice(0, 8), title: `${c.name} — ${gr?.name || ""}`, avg: pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0, color: c.color };
  });

  const statsItems = !isAdmin(user) ? [
    { ico: "👥", lbl: "Mis Alumnos", val: data.students.filter(s => myTeacherCourses.some(c => c.gradeId === s.gradeId)).length, sub: "en mis grados", col: "var(--accent)", bg: "var(--accl)" },
    { ico: "📚", lbl: "Mis Cursos", val: myTeacherCourses.length, sub: "asignados", col: "#22c55e", bg: "rgba(34,197,94,.12)" },
    { ico: "📋", lbl: "Mis Tareas", val: data.assignments.filter(a => myTeacherCourses.map(c => c.id).includes(a.courseId)).length, sub: "publicadas", col: "#f59e0b", bg: "rgba(245,158,11,.12)" },
    { ico: "✅", lbl: "Notas Reg.", val: data.scores.filter(s => s.submitted && myTeacherCourses.flatMap(c => data.assignments.filter(a => a.courseId === c.id).map(a => a.id)).includes(s.assignmentId)).length, sub: "registradas", col: "#16a34a", bg: "rgba(22,163,74,.12)" },
  ] : [
    { ico: "👥", lbl: "Total Alumnos", val: data.students.length, sub: `${active} activos`, col: "var(--accent)", bg: "var(--accl)" },
    { ico: "📚", lbl: "Docentes", val: teachers, sub: "activos", col: "#22c55e", bg: "rgba(34,197,94,.12)" },
    { ico: "📊", lbl: "Promedio Gral.", val: generalAvg, sub: "rendimiento medio", col: "#f59e0b", bg: "rgba(245,158,11,.12)" },
    { ico: "⚠️", lbl: "Reportes", val: data.incidents.length, sub: "este ciclo", col: "#dc2626", bg: "rgba(220,38,38,.12)" },
  ];

  return (
    <div>
      <div className="stats-grid">
        {statsItems.map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-icon" style={{ background: s.bg, color: s.col }}>{s.ico}</div>
            <div className="stat-val">{s.val}</div>
            <div className="stat-lbl">{s.lbl}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div>
          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-hd"><span style={{ fontSize: 18 }}>📈</span><div className="card-title">Rendimiento por Curso</div></div>
            <div className="card-body">
              <div className="bar-chart">
                {barData.map((c, i) => (
                  <div className="bar-col" key={i}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--txt2)", marginBottom: 2 }}>{c.avg}%</div>
                    <div className="bar" style={{ height: `${Math.max(4, Math.min(100, c.avg))}px`, background: `linear-gradient(180deg,${c.color},${c.color}88)`, borderRadius: "4px 4px 0 0" }} />
                    <div className="bar-lbl" title={c.title}>{c.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Quick Nav Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {(isAdmin(user)
              ? [["gradebook", "📊", "Calificaciones", "Registrar notas"], ["students", "👥", "Alumnos", "Gestionar alumnos"], ["reports", "📈", "Reportes", "Ver estadísticas"], ["bulletin", "📄", "Boletines", "Generar e imprimir"], ["attendance", "📅", "Asistencia", "Control diario"], ["chat", "💬", "Chat", "Mensajería"]]
              : [["gradebook", "📊", "Calificaciones", "Mis cuadros"], ["quickgrade", "⚡", "Nota Rápida", "Asignar nota"], ["attendance", "📅", "Asistencia", "Registrar hoy"], ["announcements", "📢", "Avisos", "Publicar aviso"], ["genreports", "📋", "Cuadros", "Cuadros generales"], ["chat", "💬", "Chat", "Mensajería"]]
            ).map(([pg, ic, lb, sub]) => (
              <div key={pg} className="card" style={{ cursor: "pointer", padding: "0" }}
                onClick={() => setPage(pg)}>
                <div style={{ padding: "14px 16px", display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--accl)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{ic}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--txt)" }}>{lb}</div>
                    <div style={{ fontSize: 11, color: "var(--txt3)", fontWeight: 600 }}>{sub}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-hd"><span style={{ fontSize: 18 }}>📢</span><div className="card-title">Avisos Recientes</div></div>
            <div style={{ padding: "6px 16px" }}>
              {data.announcements.slice(0, 3).map(a => (
                <div key={a.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
                    <span className={`badge badge-${a.priority}`}>{a.priority === "high" ? "Alta" : a.priority === "medium" ? "Media" : "Baja"}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--txt)" }}>{a.title}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--txt2)" }}>{a.content.length > 70 ? `${a.content.slice(0, 70)}…` : a.content}</div>
                  <div style={{ fontSize: 10.5, color: "var(--txt3)", marginTop: 3, fontWeight: 600 }}>{a.date}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-hd"><span style={{ fontSize: 18 }}>🏫</span><div className="card-title">Grados Activos</div></div>
            <div style={{ padding: "4px 16px" }}>
              {data.grades.map(g => {
                const cnt = data.students.filter(s => s.gradeId === g.id && s.status === "active").length;
                const crs = data.courses.filter(c => c.gradeId === g.id).length;
                return (
                  <div className="mini-row" key={g.id}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--accl)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎓</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{g.name} — Sección "{g.section}"</div>
                      <div style={{ fontSize: 11, color: "var(--txt3)" }}>{g.level} · {crs} cursos</div>
                    </div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 20, color: "var(--accent)" }}>{cnt}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
