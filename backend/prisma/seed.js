const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

const INIT_DATA = {
  users: [
    { id: 1, name: "Carlos Mendoza", email: "admin@academiq.edu", role: "admin", avatar: "CM", password: "admin2026", subject: "" },
    { id: 2, name: "Ana García", email: "ana.garcia@academiq.edu", role: "teacher", avatar: "AG", password: "Ana2026", subject: "Matemática" },
    { id: 3, name: "Roberto Lima", email: "roberto.lima@academiq.edu", role: "teacher", avatar: "RL", password: "Roberto2026", subject: "Ciencias Naturales" },
    { id: 4, name: "María Soto", email: "maria.soto@academiq.edu", role: "teacher", avatar: "MS", password: "Maria2026", subject: "Lenguaje y Literatura" },
  ],
  grades: [
    { id: 1, name: "1ro Primaria", section: "A", level: "Primaria" },
    { id: 2, name: "2do Primaria", section: "B", level: "Primaria" },
    { id: 3, name: "3ro Básico", section: "A", level: "Básico" },
  ],
  courses: [
    { id: 1, name: "Matemática", gradeId: 1, teacherId: 2, color: "#4f7ef7" },
    { id: 2, name: "Ciencias Naturales", gradeId: 1, teacherId: 3, color: "#22c55e" },
    { id: 3, name: "Lenguaje y Literatura", gradeId: 1, teacherId: 4, color: "#f59e0b" },
    { id: 4, name: "Matemática", gradeId: 2, teacherId: 2, color: "#4f7ef7" },
    { id: 5, name: "Ciencias Naturales", gradeId: 2, teacherId: 3, color: "#22c55e" },
    { id: 6, name: "Lenguaje y Literatura", gradeId: 3, teacherId: 4, color: "#f59e0b" },
    { id: 7, name: "Matemática", gradeId: 3, teacherId: 2, color: "#4f7ef7" },
  ],
  students: [
    { id: 101, name: "Valentina Pérez López", code: "2024-001", gradeId: 1, status: "active", avatar: "VP", username: "valentina.perez", password: "Valentina2026", email: "valentina.perez@alumnos.edu" },
    { id: 102, name: "Diego Martínez Cruz", code: "2024-002", gradeId: 1, status: "active", avatar: "DM", username: "diego.martinez", password: "Diego2026", email: "diego.martinez@alumnos.edu" },
    { id: 103, name: "Sofía Rodríguez Paz", code: "2024-003", gradeId: 1, status: "active", avatar: "SR", username: "sofia.rodriguez", password: "Sofia2026", email: "sofia.rodriguez@alumnos.edu" },
    { id: 104, name: "Andrés López Ruiz", code: "2024-004", gradeId: 1, status: "active", avatar: "AL", username: "andres.lopez", password: "Andres2026", email: "andres.lopez@alumnos.edu" },
    { id: 105, name: "Isabella Torres Mejía", code: "2024-005", gradeId: 2, status: "active", avatar: "IT", username: "isabella.torres", password: "Isabella2026", email: "isabella.torres@alumnos.edu" },
    { id: 106, name: "Mateo Herrera Vega", code: "2024-006", gradeId: 2, status: "active", avatar: "MH", username: "mateo.herrera", password: "Mateo2026", email: "mateo.herrera@alumnos.edu" },
    { id: 107, name: "Camila Vargas Díaz", code: "2024-007", gradeId: 2, status: "active", avatar: "CV", username: "camila.vargas", password: "Camila2026", email: "camila.vargas@alumnos.edu" },
    { id: 108, name: "Sebastián Mora Reyes", code: "2024-008", gradeId: 3, status: "active", avatar: "SM", username: "sebastian.mora", password: "Sebastian2026", email: "sebastian.mora@alumnos.edu" },
    { id: 109, name: "Luciana Castro Flores", code: "2024-009", gradeId: 3, status: "active", avatar: "LC", username: "luciana.castro", password: "Luciana2026", email: "luciana.castro@alumnos.edu" },
    { id: 110, name: "Gabriel Jiménez Rueda", code: "2024-010", gradeId: 3, status: "inactive", avatar: "GJ", username: "gabriel.jimenez", password: "Gabriel2026", email: "gabriel.jimenez@alumnos.edu" },
  ],
  assignments: [
    { id: 1, name: "Tarea 1 – Álgebra Básica", courseId: 1, type: "tarea", maxScore: 10, dueDate: "2024-03-10", instructions: "Resolver ejercicios 1 al 20 del libro de texto, pág. 45." },
    { id: 2, name: "Examen Parcial 1", courseId: 1, type: "examen", maxScore: 50, dueDate: "2024-03-20", instructions: "Estudiar capítulos 1-4. Se permite calculadora básica." },
    { id: 3, name: "Proyecto Geometría", courseId: 1, type: "proyecto", maxScore: 40, dueDate: "2024-04-05", instructions: "Construir figuras 3D con cartón y presentar en clase." },
    { id: 4, name: "Lab. Ecosistemas", courseId: 2, type: "laboratorio", maxScore: 30, dueDate: "2024-03-15", instructions: "Documentar 3 ecosistemas locales con fotos y descripción." },
    { id: 5, name: "Examen Ciencias 1", courseId: 2, type: "examen", maxScore: 70, dueDate: "2024-03-25", instructions: "Temas: célula, fotosíntesis y ecosistemas." },
    { id: 6, name: "Tarea Redacción", courseId: 3, type: "tarea", maxScore: 20, dueDate: "2024-03-12", instructions: "Redactar ensayo de 2 páginas sobre un tema libre." },
    { id: 7, name: "Examen Ortografía", courseId: 3, type: "examen", maxScore: 80, dueDate: "2024-03-22", instructions: "Repasar tildes, puntuación y reglas ortográficas." },
    { id: 8, name: "Tarea – Ecuaciones", courseId: 4, type: "tarea", maxScore: 15, dueDate: "2024-03-10", instructions: "Resolver sistemas de ecuaciones página 67." },
    { id: 9, name: "Examen Parcial 2do", courseId: 4, type: "examen", maxScore: 60, dueDate: "2024-03-22", instructions: "Capítulos 1-5, incluye fracciones." },
  ],
  scores: [
    { id: 1, studentId: 101, assignmentId: 1, score: 8, submitted: true },
    { id: 2, studentId: 102, assignmentId: 1, score: 7, submitted: true },
    { id: 3, studentId: 103, assignmentId: 1, score: 9, submitted: true },
    { id: 4, studentId: 104, assignmentId: 1, score: 6, submitted: true },
    { id: 5, studentId: 101, assignmentId: 2, score: 45, submitted: true },
    { id: 6, studentId: 102, assignmentId: 2, score: 38, submitted: true },
    { id: 7, studentId: 103, assignmentId: 2, score: 47, submitted: true },
    { id: 8, studentId: 104, assignmentId: 2, score: 40, submitted: true },
    { id: 9, studentId: 101, assignmentId: 3, score: 36, submitted: true },
    { id: 10, studentId: 102, assignmentId: 3, score: 30, submitted: true },
    { id: 11, studentId: 101, assignmentId: 4, score: 28, submitted: true },
    { id: 12, studentId: 102, assignmentId: 4, score: 25, submitted: true },
    { id: 13, studentId: 103, assignmentId: 4, score: 27, submitted: true },
    { id: 14, studentId: 101, assignmentId: 5, score: 65, submitted: true },
    { id: 15, studentId: 102, assignmentId: 5, score: 58, submitted: true },
    { id: 16, studentId: 105, assignmentId: 8, score: 13, submitted: true },
    { id: 17, studentId: 106, assignmentId: 8, score: 11, submitted: true },
    { id: 18, studentId: 107, assignmentId: 8, score: 14, submitted: true },
    { id: 19, studentId: 105, assignmentId: 9, score: 52, submitted: true },
    { id: 20, studentId: 106, assignmentId: 9, score: 44, submitted: true },
  ],
  attendance: [
    { id: 1, studentId: 101, courseId: 1, date: "2024-03-11", status: "present" },
    { id: 2, studentId: 102, courseId: 1, date: "2024-03-11", status: "absent" },
    { id: 3, studentId: 103, courseId: 1, date: "2024-03-11", status: "present" },
    { id: 4, studentId: 104, courseId: 1, date: "2024-03-11", status: "late" },
  ],
  announcements: [
    { id: 1, title: "Reunión de Padres de Familia", content: "El viernes 15 se realizará reunión de padres a las 9:00am en el auditorio principal. Asistencia obligatoria.", date: "2024-03-08", authorId: 1, priority: "high", target: "all", gradeId: null, courseId: null },
    { id: 2, title: "Semana Cultural del Colegio", content: "Del 20 al 24 de marzo celebraremos nuestra semana cultural. Habrá actividades artísticas y deportivas.", date: "2024-03-07", authorId: 1, priority: "medium", target: "all", gradeId: null, courseId: null },
    { id: 3, title: "Entrega de Boletines 1er Bimestre", content: "Los boletines del primer bimestre se entregarán el lunes 10 de abril. Favor recoger en secretaría.", date: "2024-03-06", authorId: 1, priority: "low", target: "all", gradeId: null, courseId: null },
  ],
  chatMessages: [
    { id: 1, senderId: 1, senderName: "Carlos Mendoza", senderAvatar: "CM", text: "Buenos días equipo. Recuerden entregar las notas del primer bimestre antes del viernes.", ts: Date.now() - 86400000 * 2 },
    { id: 2, senderId: 2, senderName: "Ana García", senderAvatar: "AG", text: "Entendido Director. Ya tengo el 90% ingresado en el sistema.", ts: Date.now() - 86400000 * 2 + 300000 },
    { id: 3, senderId: 3, senderName: "Roberto Lima", senderAvatar: "RL", text: "Listo, termino hoy mismo mis pendientes.", ts: Date.now() - 86400000 + 60000 },
    { id: 4, senderId: 4, senderName: "María Soto", senderAvatar: "MS", text: "Perfecto. ¿La reunión del martes sigue en pie?", ts: Date.now() - 3600000 * 4 },
    { id: 5, senderId: 1, senderName: "Carlos Mendoza", senderAvatar: "CM", text: "Sí, martes 3pm sala de maestros. ¡Gracias a todos!", ts: Date.now() - 3600000 },
  ],
  incidents: [
    { id: 1, studentId: 102, authorId: 2, date: "2024-03-05", type: "conduct", description: "Comportamiento disruptivo durante clase de matemática.", severity: "medium", justification: "Se llamó la atención al estudiante y se notificó a los padres." },
    { id: 2, studentId: 104, authorId: 4, date: "2024-03-08", type: "tardiness", description: "Llegó tarde por tercera vez consecutiva.", severity: "low", justification: "Se registró tardanza y se envió comunicado a padres." },
    { id: 3, studentId: 102, authorId: 2, date: "2024-03-10", type: "conduct", description: "Uso de celular durante examen.", severity: "high", justification: "Se anuló el examen y se citó a los padres. Examen con nota cero." },
  ],
  notifications: [
    { id: 1, userId: null, title: "Nueva tarea asignada", body: "Proyecto Geometría fue asignado al curso Matemática 1ro A", ts: Date.now() - 3600000 * 2, read: false, type: "assignment" },
    { id: 2, userId: null, title: "Notas pendientes", body: "Examen Parcial 1 tiene 2 notas sin registrar", ts: Date.now() - 3600000 * 5, read: false, type: "grades" },
    { id: 3, userId: null, title: "Nuevo aviso publicado", body: "Reunión de Padres de Familia - Viernes 15", ts: Date.now() - 86400000, read: true, type: "announcement" },
  ],
}

async function hashPasswords(data) {
  const users = await Promise.all((data.users || []).map(async (u) => ({
    ...u,
    passwordPlain: u.password,
    password: await bcrypt.hash(u.password, 10),
  })));
  const students = await Promise.all((data.students || []).map(async (s) => ({
    ...s,
    passwordPlain: s.password,
    password: await bcrypt.hash(s.password, 10),
  })));
  return { ...data, users, students };
}

(async () => {
  const hashed = await hashPasswords(INIT_DATA);
  const payload = JSON.stringify(hashed);
  const existing = await prisma.appState.findUnique({ where: { id: 1 } });
  if (!existing) {
    await prisma.appState.create({ data: { id: 1, data: payload } });
    console.log("✅ Seed: AppState creado");
  } else {
    await prisma.appState.update({ where: { id: 1 }, data: { data: payload } });
    console.log("✅ Seed: AppState actualizado");
  }
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
