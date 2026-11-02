// Reglas de acceso a los datos. Es la misma lógica de frontend/src/lib/stateRules.js;
// si cambias una, cambia la otra.
const ADMIN_ROLES = ["admin", "director"];
const isAdminRole = (role) => ADMIN_ROLES.includes(role);

const COLLECTIONS = [
  "users", "students", "grades", "courses", "periods", "assignments", "scores",
  "attendance", "announcements", "chatMessages", "incidents", "notifications",
];
/** Colecciones que un docente puede modificar. Usuarios, alumnos, grados y cursos son solo del director. */
const TEACHER_WRITABLE = ["assignments", "scores", "attendance", "incidents", "announcements", "chatMessages", "notifications"];

const isHashed = (pw) => typeof pw === "string" && (pw.startsWith("pbkdf2$") || /^\$2[aby]\$/.test(pw));
const stripSecrets = ({ password, passwordPlain, ...rest }) => rest;

class AccessError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Estado que puede ver `user`: nunca incluye contraseñas; un alumno solo ve lo suyo. */
function publicState(state, user) {
  const s = state || {};
  const users = (s.users || []).map(stripSecrets);
  const students = (s.students || []).map(stripSecrets);
  if (user.role !== "student") {
    const me = users.find((u) => u.id === user.id);
    if (!me) return null;
    return { ...s, users, students, me };
  }
  const me = students.find((st) => st.id === user.id);
  if (!me) return null;
  const courses = (s.courses || []).filter((c) => c.gradeId === me.gradeId);
  const courseIds = new Set(courses.map((c) => c.id));
  return {
    users: users.filter((u) => u.role !== "student").map(({ id, name, role, avatar, subject }) => ({ id, name, role, avatar, subject })),
    students: [me],
    grades: (s.grades || []).filter((g) => g.id === me.gradeId),
    courses,
    periods: s.periods || [],
    assignments: (s.assignments || []).filter((a) => courseIds.has(a.courseId)),
    scores: (s.scores || []).filter((x) => x.studentId === me.id),
    attendance: (s.attendance || []).filter((x) => x.studentId === me.id),
    incidents: (s.incidents || []).filter((x) => x.studentId === me.id),
    announcements: (s.announcements || []).filter((a) => a.target === "all" || a.gradeId === me.gradeId || courseIds.has(a.courseId)),
    chatMessages: [],
    notifications: (s.notifications || []).filter((n) => n.userId === me.id),
    me: { ...me, role: "student" },
  };
}

async function mergeAccounts(prevList = [], list = [], hashPlain) {
  const prev = new Map(prevList.map((p) => [p.id, p]));
  return Promise.all(
    list.map(async (acc) => {
      const { passwordPlain, ...rest } = acc;
      if (typeof rest.password === "string" && rest.password) {
        if (!isHashed(rest.password)) rest.password = await hashPlain(rest.password);
      } else {
        const old = prev.get(acc.id)?.password;
        if (old) rest.password = old;
        else delete rest.password;
      }
      return rest;
    })
  );
}

/** Combina el estado guardado con el que envía `user`, respetando sus permisos. */
async function mergeState(stored, incoming, user, hashPlain) {
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) throw new AccessError(400, "Estado inválido");
  const base = stored || {};
  const writable = isAdminRole(user.role) ? COLLECTIONS : user.role === "teacher" ? TEACHER_WRITABLE : null;
  if (!writable) throw new AccessError(403, "Sin permiso para modificar datos");
  const next = {};
  for (const k of COLLECTIONS) next[k] = Array.isArray(base[k]) ? base[k] : [];
  for (const k of writable) if (Array.isArray(incoming[k])) next[k] = incoming[k];
  if (isAdminRole(user.role)) {
    next.users = await mergeAccounts(base.users, next.users, hashPlain);
    next.students = await mergeAccounts(base.students, next.students, hashPlain);
  }
  return next;
}

module.exports = { ADMIN_ROLES, isAdminRole, COLLECTIONS, TEACHER_WRITABLE, AccessError, publicState, mergeState };
