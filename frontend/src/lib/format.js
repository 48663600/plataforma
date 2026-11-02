// Formatos, colores y etiquetas compartidas por la interfaz.

const COLORS = ["#4f7ef7", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16", "#14b8a6", "#f97316"];
export const avatarColor = (s) => COLORS[(s || "A").charCodeAt(0) % COLORS.length];

export const fmtTs = (ts) => {
  const d = new Date(ts);
  return d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
};
export const fmtDate = (ts) => new Date(ts).toLocaleDateString("es", { day: "2-digit", month: "short" });
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const typeColors = { tarea: "#4f7ef7", examen: "#ef4444", proyecto: "#22c55e", laboratorio: "#f59e0b" };
export const typeLabels = { tarea: "Tarea", examen: "Examen", proyecto: "Proyecto", laboratorio: "Lab" };
export const severityColors = { low: "#22c55e", medium: "#f59e0b", high: "#ef4444" };
export const severityLabels = { low: "Leve", medium: "Moderado", high: "Grave" };
export const incidentTypes = { conduct: "Conducta", tardiness: "Tardanza", absence: "Inasistencia", academic: "Académico", other: "Otro" };
