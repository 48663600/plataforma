// Roles del sistema. "director" y "admin" tienen los mismos permisos.
export const ADMIN_ROLES = ["admin", "director"];
export const isAdminRole = (role) => ADMIN_ROLES.includes(role);
export const isAdmin = (user) => isAdminRole(user?.role);
export const roleLabel = (role) => (isAdminRole(role) ? "Director" : role === "teacher" ? "Docente" : "Alumno");
/** Clase CSS del badge según el rol. */
export const roleBadge = (role) => (isAdminRole(role) ? "admin" : role);
