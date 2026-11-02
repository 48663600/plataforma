// Menú lateral por rol. "director" usa el mismo menú que "admin".
const ADMIN_NAV = [
  { section: "Principal", items: [{ id: "dashboard", icon: "⊞", label: "Dashboard" }, { id: "students", icon: "👥", label: "Alumnos" }, { id: "gradebook", icon: "📊", label: "Calificaciones" }, { id: "attendance", icon: "📅", label: "Asistencia" }] },
  { section: "Gestión", items: [{ id: "bulletin", icon: "📄", label: "Boletines" }, { id: "genreports", icon: "📋", label: "Cuadros Gral." }, { id: "incidents", icon: "⚠️", label: "Reportes" }, { id: "reports", icon: "📈", label: "Estadísticas" }] },
  { section: "Admin", items: [{ id: "setup", icon: "⚙️", label: "Configuración" }, { id: "announcements", icon: "📢", label: "Avisos" }, { id: "chat", icon: "💬", label: "Chat Docentes" }] },
];

export const NAV_CFG = {
  admin: ADMIN_NAV,
  director: ADMIN_NAV,
  teacher: [
    { section: "Mi Área", items: [{ id: "dashboard", icon: "⊞", label: "Dashboard" }, { id: "mycourses", icon: "📚", label: "Mis Cursos" }, { id: "gradebook", icon: "📊", label: "Calificaciones" }, { id: "quickgrade", icon: "⚡", label: "Nota Rápida" }] },
    { section: "Gestión", items: [{ id: "attendance", icon: "📅", label: "Asistencia" }, { id: "genreports", icon: "📋", label: "Cuadros Gral." }, { id: "incidents", icon: "⚠️", label: "Reportes" }] },
    { section: "Comunicación", items: [{ id: "announcements", icon: "📢", label: "Avisos" }, { id: "chat", icon: "💬", label: "Chat General" }] },
  ],
  student: [{ section: "Mi Portal", items: [{ id: "portal", icon: "🎒", label: "Mi Portal" }] }],
};

export const homePage = (role) => (role === "student" ? "portal" : "dashboard");
