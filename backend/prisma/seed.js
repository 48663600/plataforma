const { PrismaClient } = require('@prisma/client'); const bcrypt = require('bcrypt'); const prisma = new PrismaClient();
const INIT_DATA = {
  users: [
    {
      id: 1,
      name: "Luis Yordy Cifuentes Carrillo",
      email: "luisyordy@wellmann.edu",
      role: "admin",
      avatar: "LY",
      password: "LuisYordy2026",
      subject: "",
    },
    {
      id: 2,
      name: "Iris Herrera",
      email: "iris.herrera@wellmann.edu",
      role: "director",
      avatar: "IH",
      password: "Iris2026",
      subject: "",
    },
    {
      id: 3,
      name: "Luis Alfonso",
      email: "luis.alfonso@wellmann.edu",
      role: "teacher",
      avatar: "LA",
      password: "LuisAlfonso2026",
      subject: "Lengua y Literatura",
    },
  ],

  grades: [
    {
      id: 1,
      name: "Segundo BÃ¡sico",
      section: "A",
      level: "BÃ¡sico",
    },
  ],

  courses: [
    {
      id: 1,
      name: "Lengua y Literatura",
      gradeId: 1,
      teacherId: 3,
      color: "#f59e0b",
    },
  ],

  students: [
    {
      id: 101,
      name: "Azucena Herrera",
      code: "2026-001",
      gradeId: 1,
      status: "active",
      avatar: "AH",
      username: "azucena.herrera",
      password: "Azucena2026",
      email: "azucena.herrera@alumnos.wellmann.edu",
    },
  ],

  periods: [
    {
      id: 1,
      name: "I Bimestre",
      weight: 0.25,
      active: true,
    },
    {
      id: 2,
      name: "II Bimestre",
      weight: 0.25,
      active: false,
    },
    {
      id: 3,
      name: "III Bimestre",
      weight: 0.25,
      active: false,
    },
    {
      id: 4,
      name: "IV Bimestre",
      weight: 0.25,
      active: false,
    },
  ],

  assignments: [
    {
      id: 1,
      name: "Lectura comprensiva 1",
      courseId: 1,
      periodId: 1,
      type: "tarea",
      maxScore: 10,
      dueDate: "2026-03-20",
      instructions:
        "Leer el texto asignado y responder las preguntas de comprensiÃ³n.",
    },
  ],

  scores: [
    {
      id: 1,
      studentId: 101,
      assignmentId: 1,
      score: 0,
      submitted: false,
    },
  ],

  attendance: [
    {
      id: 1,
      studentId: 101,
      courseId: 1,
      date: "2026-03-10",
      status: "present",
    },
  ],

  announcements: [
    {
      id: 1,
      title: "Bienvenida al sistema Wellmann",
      content:
        "Se ha inicializado el sistema con el curso de Lengua y Literatura para Segundo BÃ¡sico secciÃ³n A.",
      date: "2026-03-10",
      authorId: 2,
      priority: "medium",
      target: "all",
      gradeId: 1,
      courseId: 1,
    },
  ],

  chatMessages: [
    {
      id: 1,
      senderId: 2,
      senderName: "Iris Herrera",
      senderAvatar: "IH",
      text: "Bienvenidos al sistema Wellmann. Ya estÃ¡ habilitado el curso de Lengua y Literatura para Segundo BÃ¡sico A.",
      ts: Date.now(),
    },
  ],

  incidents: [],

  notifications: [
    {
      id: 1,
      userId: 3,
      title: "Curso asignado",
      body: "Se te ha asignado el curso Lengua y Literatura en Segundo BÃ¡sico A.",
      ts: Date.now(),
      read: false,
      type: "course",
    },
    {
      id: 2,
      userId: 101,
      title: "Bienvenida",
      body: "Tu usuario de estudiante ha sido creado correctamente.",
      ts: Date.now(),
      read: false,
      type: "system",
    },
  ],
};
async function hashPasswords(data) { const users = await Promise.all((data.users || []).map(async (u) => ({ ...u, passwordPlain: u.password, password: await bcrypt.hash(u.password, 10) }))); const students = await Promise.all((data.students || []).map(async (s) => ({ ...s, passwordPlain: s.password, password: await bcrypt.hash(s.password, 10) }))); return { ...data, users, students }; }; (async () => { const hashed = await hashPasswords(INIT_DATA); const payload = JSON.stringify(hashed); const existing = await prisma.appState.findUnique({ where: { id: 1 } }); if (!existing) { await prisma.appState.create({ data: { id: 1, data: payload } }); console.log("✅ Seed: AppState creado"); } else { await prisma.appState.update({ where: { id: 1 }, data: { data: payload } }); console.log("✅ Seed: AppState actualizado"); } await prisma.$disconnect(); })().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
