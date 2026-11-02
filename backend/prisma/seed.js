// Carga los datos iniciales del colegio.
//   npm run db:seed            → solo si la base está vacía
//   npm run db:seed -- --force → REEMPLAZA todos los datos existentes
// Las contraseñas iniciales se generan al azar y se muestran UNA vez en consola.
require("dotenv").config();
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { getState, setState, storageName, disconnect } = require("../src/state");

const randomPassword = () => {
  const letters = "abcdefghjkmnpqrstuvwxyz";
  let s = "";
  for (let i = 0; i < 4; i++) s += letters[crypto.randomInt(letters.length)];
  for (let i = 0; i < 4; i++) s += crypto.randomInt(10);
  return s[0].toUpperCase() + s.slice(1);
};

const INIT_DATA = {
  users: [
    { id: 1, name: "Luis Yordy Cifuentes Carrillo", email: "luisyordy@wellmann.edu", role: "admin", avatar: "LY", subject: "" },
    { id: 2, name: "Iris Herrera", email: "iris.herrera@wellmann.edu", role: "director", avatar: "IH", subject: "" },
    { id: 3, name: "Luis Alfonso", email: "luis.alfonso@wellmann.edu", role: "teacher", avatar: "LA", subject: "Lengua y Literatura" },
  ],
  grades: [{ id: 1, name: "Segundo Básico", section: "A", level: "Básico" }],
  courses: [{ id: 1, name: "Lengua y Literatura", gradeId: 1, teacherId: 3, color: "#f59e0b" }],
  students: [
    { id: 101, name: "Azucena Herrera", code: "2026-001", gradeId: 1, status: "active", avatar: "AH", username: "azucena.herrera", email: "azucena.herrera@alumnos.wellmann.edu" },
  ],
  periods: [
    { id: 1, name: "I Bimestre", weight: 0.25, active: true },
    { id: 2, name: "II Bimestre", weight: 0.25, active: false },
    { id: 3, name: "III Bimestre", weight: 0.25, active: false },
    { id: 4, name: "IV Bimestre", weight: 0.25, active: false },
  ],
  assignments: [
    { id: 1, name: "Lectura comprensiva 1", courseId: 1, periodId: 1, type: "tarea", maxScore: 10, dueDate: "2026-03-20", instructions: "Leer el texto asignado y responder las preguntas de comprensión." },
  ],
  scores: [],
  attendance: [],
  announcements: [
    { id: 1, title: "Bienvenida al sistema Wellmann", content: "Se ha inicializado el sistema con el curso de Lengua y Literatura para Segundo Básico sección A.", date: "2026-03-10", authorId: 2, priority: "medium", target: "all", gradeId: null, courseId: null },
  ],
  chatMessages: [
    { id: 1, senderId: 2, senderName: "Iris Herrera", senderAvatar: "IH", text: "Bienvenidos al sistema Wellmann. Ya está habilitado el curso de Lengua y Literatura para Segundo Básico A.", ts: Date.now() },
  ],
  incidents: [],
  notifications: [
    { id: 1, userId: 3, title: "Curso asignado", body: "Se te ha asignado el curso Lengua y Literatura en Segundo Básico A.", ts: Date.now(), read: false, type: "course" },
    { id: 2, userId: 101, title: "Bienvenida", body: "Tu usuario de estudiante ha sido creado correctamente.", ts: Date.now(), read: false, type: "system" },
  ],
};

async function withPasswords(list, printed) {
  return Promise.all(
    list.map(async (acc) => {
      const plain = randomPassword();
      printed.push({ nombre: acc.name, usuario: acc.email || acc.username, rol: acc.role || "student", contraseña: plain });
      return { ...acc, password: await bcrypt.hash(plain, 10) };
    })
  );
}

(async () => {
  const force = process.argv.includes("--force");
  const existing = await getState();
  if (existing && !force) {
    console.log(`ℹ️  Ya hay datos en ${storageName()}. No se modificó nada.`);
    console.log("   Para reemplazarlos TODOS usa: npm run db:seed -- --force");
    return;
  }
  const printed = [];
  const data = { ...INIT_DATA, users: await withPasswords(INIT_DATA.users, printed), students: await withPasswords(INIT_DATA.students, printed) };
  await setState(data);
  console.log(`✅ Datos iniciales cargados en ${storageName()}.`);
  console.log("🔑 Credenciales iniciales (guárdalas, no se volverán a mostrar):");
  console.table(printed);
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => disconnect());
