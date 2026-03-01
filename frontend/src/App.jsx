import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";


// ============================
// API (backend)
// ============================
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function apiFetch(path, { token, method = "GET", body } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

// ═══════════════════════════════════════════════════════════════
//  INITIAL DATA STORE
// ═══════════════════════════════════════════════════════════════
const mkId = () => Date.now() + Math.floor(Math.random() * 9999);

const genEmail = (name) => {
  const parts = name.trim().split(/\s+/);
  const first = parts[0] || "alumno";
  const last = parts[1] || "colegio";
  const clean = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
  return `${clean(first)}.${clean(last)}@alumnos.edu`;
};
const genUser = (name) => {
  const parts = name.trim().split(/\s+/);
  const first = parts[0] || "alumno";
  const last = parts[1] || "colegio";
  const clean = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
  return `${clean(first)}.${clean(last)}`;
};
const genPass = (name) => {
  const f = name.trim().split(/\s+/)[0] || "Alumno";
  return f.charAt(0).toUpperCase() + f.slice(1).toLowerCase() + "2026";
};
const initials = (name) => name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();

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
};

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════
const scoreColor = (s, max) => {
  if (s == null) return "#9ca3af";
  const p = (s / max) * 100;
  if (p >= 90) return "#16a34a";
  if (p >= 75) return "#2563eb";
  if (p >= 60) return "#d97706";
  if (p >= 50) return "#ea580c";
  return "#dc2626";
};
const pctOf = (s, max) => max > 0 ? Math.round((s / max) * 100) : 0;
const letterGrade = (s, max) => {
  if (s == null) return "–";
  const p = pctOf(s, max);
  if (p >= 90) return "A"; if (p >= 75) return "B"; if (p >= 60) return "C"; if (p >= 50) return "D"; return "F";
};
const totalScore = (studentId, assignments, scores) => {
  let total = 0;
  assignments.forEach(a => {
    const sc = scores.find(s => s.studentId === studentId && s.assignmentId === a.id);
    if (sc?.score != null) total += sc.score;
  });
  return Math.round(total * 10) / 10;
};
const maxPossible = (assignments) => assignments.reduce((a, b) => a + b.maxScore, 0);
const COLORS = ["#4f7ef7", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16", "#14b8a6", "#f97316"];
const avatarColor = (s) => COLORS[(s || "A").charCodeAt(0) % COLORS.length];
const fmtTs = (ts) => {
  const d = new Date(ts);
  return d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
};
const fmtDate = (ts) => new Date(ts).toLocaleDateString("es", { day: "2-digit", month: "short" });
const typeColors = { tarea: "#4f7ef7", examen: "#ef4444", proyecto: "#22c55e", laboratorio: "#f59e0b" };
const typeLabels = { tarea: "Tarea", examen: "Examen", proyecto: "Proyecto", laboratorio: "Lab" };
const severityColors = { low: "#22c55e", medium: "#f59e0b", high: "#ef4444" };
const severityLabels = { low: "Leve", medium: "Moderado", high: "Grave" };

// ═══════════════════════════════════════════════════════════════
//  THEME CSS
// ═══════════════════════════════════════════════════════════════
const makeCSS = (dark) => `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:${dark ? "#0f172a" : "#f0f4ff"};
  --bg2:${dark ? "#1e293b" : "#ffffff"};
  --bg3:${dark ? "#273548" : "#e8eef8"};
  --surf:${dark ? "#1e293b" : "#ffffff"};
  --surf2:${dark ? "#273548" : "#f8faff"};
  --surf3:${dark ? "#304060" : "#eef2ff"};
  --border:${dark ? "rgba(255,255,255,0.08)" : "rgba(79,126,247,0.12)"};
  --border2:${dark ? "rgba(255,255,255,0.14)" : "rgba(79,126,247,0.25)"};
  --txt:${dark ? "#e2e8f0" : "#1e293b"};
  --txt2:${dark ? "#94a3b8" : "#475569"};
  --txt3:${dark ? "#64748b" : "#94a3b8"};
  --accent:#4f7ef7;
  --accent2:#6d99fb;
  --accl:${dark ? "rgba(79,126,247,0.18)" : "rgba(79,126,247,0.1)"};
  --green:#16a34a;
  --greenl:${dark ? "rgba(22,163,74,0.18)" : "rgba(22,163,74,0.1)"};
  --red:#dc2626;
  --redl:${dark ? "rgba(220,38,38,0.18)" : "rgba(220,38,38,0.1)"};
  --yellow:#d97706;
  --yellowl:${dark ? "rgba(217,119,6,0.18)" : "rgba(217,119,6,0.1)"};
  --orange:#ea580c;
  --shadow:${dark ? "0 4px 24px rgba(0,0,0,0.4)" : "0 4px 20px rgba(79,126,247,0.12)"};
  --shadow2:${dark ? "0 2px 12px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.06)"};
  --r:14px;--rsm:9px;--rxl:20px;
  --trans:all 0.18s cubic-bezier(.4,0,.2,1);
}
body{font-family:'Nunito',sans-serif;background:var(--bg);color:var(--txt);overflow:hidden;transition:background .3s,color .3s}
h1,h2,h3,h4,h5{font-family:'Playfair Display',serif}
button{cursor:pointer;font-family:'Nunito',sans-serif}
input,select,textarea{font-family:'Nunito',sans-serif}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:${dark ? "rgba(255,255,255,0.12)" : "rgba(79,126,247,0.2)"};border-radius:3px}

/* BG decorative */
.bg-wrap{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.bg-shape{position:absolute;border-radius:50%}
.bg-s1{width:600px;height:600px;top:-200px;right:-150px;background:${dark ? "radial-gradient(circle,rgba(79,126,247,0.08),transparent 65%)" : "radial-gradient(circle,rgba(79,126,247,0.08),transparent 65%)"}}
.bg-s2{width:500px;height:500px;bottom:-150px;left:-100px;background:${dark ? "radial-gradient(circle,rgba(22,163,74,0.06),transparent 65%)" : "radial-gradient(circle,rgba(99,202,144,0.1),transparent 65%)"}}
.bg-s3{width:400px;height:400px;top:40%;left:40%;background:${dark ? "radial-gradient(circle,rgba(245,158,11,0.04),transparent 65%)" : "radial-gradient(circle,rgba(245,158,11,0.07),transparent 65%)"}}
.bg-dots{
  position:absolute;inset:0;opacity:${dark ? "0.04" : "0.06"};
  background-image:radial-gradient(circle,${dark ? "#fff" : "#4f7ef7"} 1px,transparent 1px);
  background-size:28px 28px;
}
.deco-book{position:absolute;font-size:80px;opacity:0.04;user-select:none}

/* APP SHELL */
.app{position:relative;z-index:1;display:flex;height:100vh;overflow:hidden}

/* SIDEBAR */
.sidebar{
  width:238px;min-width:238px;
  background:${dark ? "rgba(30,41,59,0.95)" : "rgba(255,255,255,0.96)"};
  backdrop-filter:blur(20px);
  border-right:1px solid var(--border);
  display:flex;flex-direction:column;
  box-shadow:${dark ? "2px 0 12px rgba(0,0,0,0.3)" : "2px 0 16px rgba(79,126,247,0.07)"};
  transition:background .3s;
}
.sidebar-logo{padding:22px 18px 16px;display:flex;align-items:center;gap:11px;border-bottom:1px solid var(--border)}
.logo-mark{
  width:38px;height:38px;border-radius:12px;flex-shrink:0;
  background:linear-gradient(135deg,#4f7ef7,#7c3aed);
  display:flex;align-items:center;justify-content:center;
  font-family:'Playfair Display',serif;font-size:20px;font-weight:900;color:#fff;
  box-shadow:0 4px 14px rgba(79,126,247,0.45);
}
.logo-text{font-family:'Playfair Display',serif;font-size:18px;font-weight:900;letter-spacing:-.5px;color:var(--txt)}
.logo-sub{font-size:10px;color:var(--txt3);font-weight:600;letter-spacing:.04em}
.nav-section{padding:14px 18px 5px;font-size:9.5px;font-weight:800;color:var(--txt3);letter-spacing:.1em;text-transform:uppercase}
.nav-item{
  display:flex;align-items:center;gap:9px;padding:9px 10px;margin:1px 10px;
  border-radius:10px;cursor:pointer;transition:var(--trans);
  font-size:13.5px;font-weight:600;color:var(--txt2);position:relative;
}
.nav-item:hover{background:var(--accl);color:var(--accent)}
.nav-item.active{background:var(--accent);color:#fff;box-shadow:0 3px 12px rgba(79,126,247,0.35)}
.nav-icon{width:18px;text-align:center;flex-shrink:0;font-size:14px}
.nav-dot{margin-left:auto;width:7px;height:7px;border-radius:50%;background:#ef4444;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
.sidebar-bottom{margin-top:auto;border-top:1px solid var(--border);padding:12px}
.user-card{
  display:flex;align-items:center;gap:9px;padding:10px 10px;
  border-radius:10px;cursor:pointer;transition:var(--trans);
}
.user-card:hover{background:var(--bg3)}
.user-name{font-size:13px;font-weight:700;color:var(--txt)}
.user-role{font-size:10.5px;color:var(--txt3);font-weight:600}

/* MAIN */
.main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.topbar{
  padding:0 26px;height:62px;display:flex;align-items:center;gap:14px;
  border-bottom:1px solid var(--border);
  background:${dark ? "rgba(30,41,59,0.9)" : "rgba(255,255,255,0.92)"};
  backdrop-filter:blur(20px);flex-shrink:0;
  box-shadow:0 1px 0 var(--border);
}
.topbar-title{font-family:'Playfair Display',serif;font-size:19px;font-weight:900;color:var(--txt)}
.topbar-sub{font-size:11px;color:var(--txt3);font-weight:600;margin-top:1px}
.spacer{flex:1}
.search-bar{
  display:flex;align-items:center;gap:7px;
  background:var(--bg3);border:1.5px solid var(--border);border-radius:10px;
  padding:7px 12px;width:220px;transition:var(--trans);
}
.search-bar:focus-within{border-color:var(--accent);background:var(--surf)}
.search-bar input{background:none;border:none;outline:none;color:var(--txt);font-size:13px;width:100%;font-weight:500}
.search-bar input::placeholder{color:var(--txt3)}
.icon-btn{
  width:36px;height:36px;border-radius:9px;background:var(--bg3);
  border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;
  color:var(--txt2);font-size:15px;transition:var(--trans);position:relative;
}
.icon-btn:hover{background:var(--accl);border-color:var(--accent);color:var(--accent)}
.notif-badge{
  position:absolute;top:-4px;right:-4px;width:16px;height:16px;
  background:#ef4444;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:9px;font-weight:800;color:#fff;border:2px solid var(--bg2);
}
.content{flex:1;overflow-y:auto;padding:26px}

/* CARDS */
.card{
  background:var(--surf);border:1.5px solid var(--border);border-radius:var(--r);
  overflow:hidden;transition:var(--trans);
}
.card:hover{border-color:var(--border2);box-shadow:var(--shadow)}
.card-hd{padding:16px 18px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px}
.card-title{font-family:'Playfair Display',serif;font-size:15px;font-weight:800;color:var(--txt)}
.card-body{padding:18px}

/* STATS */
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
.stat-card{
  background:var(--surf);border:1.5px solid var(--border);border-radius:var(--r);
  padding:18px;transition:var(--trans);position:relative;overflow:hidden;
}
.stat-card:hover{transform:translateY(-2px);box-shadow:var(--shadow)}
.stat-icon{width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:19px;margin-bottom:11px}
.stat-val{font-family:'Playfair Display',serif;font-size:30px;font-weight:900;line-height:1;color:var(--txt)}
.stat-lbl{font-size:12px;font-weight:700;color:var(--txt3);margin-top:4px}
.stat-sub{font-size:11.5px;color:var(--txt2);margin-top:6px;font-weight:600}

/* TABLES */
.tbl-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse}
th{font-size:11px;font-weight:800;color:var(--txt3);text-transform:uppercase;letter-spacing:.07em;padding:9px 14px;text-align:left;border-bottom:1.5px solid var(--border);white-space:nowrap}
td{padding:11px 14px;font-size:13px;font-weight:600;border-bottom:1px solid var(--border);vertical-align:middle;color:var(--txt)}
tr:last-child td{border-bottom:none}
tr:hover td{background:var(--bg3)}

/* BUTTONS */
.btn{padding:8px 16px;border-radius:9px;font-size:13px;font-weight:700;border:none;transition:var(--trans);display:inline-flex;align-items:center;gap:5px;white-space:nowrap;letter-spacing:.01em}
.btn-primary{background:var(--accent);color:#fff;box-shadow:0 2px 8px rgba(79,126,247,0.3)}
.btn-primary:hover{background:var(--accent2);box-shadow:0 4px 16px rgba(79,126,247,0.45)}
.btn-ghost{background:var(--bg3);color:var(--txt);border:1.5px solid var(--border)}
.btn-ghost:hover{background:var(--accl);border-color:var(--accent);color:var(--accent)}
.btn-danger{background:var(--redl);color:var(--red);border:1.5px solid rgba(220,38,38,0.2)}
.btn-danger:hover{background:rgba(220,38,38,0.2)}
.btn-success{background:var(--greenl);color:var(--green);border:1.5px solid rgba(22,163,74,0.2)}
.btn-success:hover{background:rgba(22,163,74,0.2)}
.btn-sm{padding:5px 11px;font-size:12px;border-radius:7px}
.btn-xs{padding:3px 8px;font-size:11px;border-radius:6px}
.btn-full{width:100%;justify-content:center;padding:11px}

/* BADGES */
.badge{display:inline-flex;align-items:center;gap:3px;padding:3px 9px;border-radius:99px;font-size:11px;font-weight:700}
.badge-active{background:var(--greenl);color:var(--green)}
.badge-inactive{background:var(--redl);color:var(--red)}
.badge-present{background:var(--greenl);color:var(--green)}
.badge-absent{background:var(--redl);color:var(--red)}
.badge-late{background:var(--yellowl);color:var(--yellow)}
.badge-high{background:var(--redl);color:var(--red)}
.badge-medium{background:var(--yellowl);color:var(--yellow)}
.badge-low{background:var(--greenl);color:var(--green)}
.badge-admin{background:rgba(79,126,247,0.15);color:var(--accent)}
.badge-teacher{background:var(--greenl);color:var(--green)}
.badge-student{background:rgba(79,126,247,0.12);color:var(--accent)}

/* MODAL */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(8px);z-index:200;display:flex;align-items:center;justify-content:center;animation:fadeIn .15s ease}
.modal{background:var(--surf);border:1.5px solid var(--border2);border-radius:var(--rxl);padding:28px;width:550px;max-height:87vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.25);animation:slideUp .2s cubic-bezier(.4,0,.2,1)}
.modal-lg{width:760px}.modal-xl{width:960px}
.modal-title{font-family:'Playfair Display',serif;font-size:21px;font-weight:900;margin-bottom:20px;color:var(--txt)}
.modal-foot{display:flex;gap:8px;justify-content:flex-end;margin-top:22px;padding-top:18px;border-top:1px solid var(--border)}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}

/* FORMS */
.fg{margin-bottom:14px}
.fr{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.fl{display:block;font-size:11.5px;font-weight:800;color:var(--txt2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.06em}
.fc{width:100%;padding:9px 13px;background:var(--bg3);border:1.5px solid var(--border);border-radius:9px;color:var(--txt);font-size:13px;font-weight:600;outline:none;transition:var(--trans)}
.fc:focus{border-color:var(--accent);background:var(--surf);box-shadow:0 0 0 3px rgba(79,126,247,0.12)}
select.fc option{background:var(--bg2)}
textarea.fc{resize:vertical;min-height:76px}

/* TABS */
.tabs{display:flex;gap:4px;background:var(--bg3);border-radius:10px;padding:4px;margin-bottom:20px}
.tab{flex:1;padding:7px 14px;border-radius:7px;font-size:13px;font-weight:700;color:var(--txt2);border:none;background:none;cursor:pointer;transition:var(--trans);text-align:center}
.tab.active{background:var(--accent);color:#fff;box-shadow:0 2px 8px rgba(79,126,247,0.3)}

/* AVATAR */
.av{border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;flex-shrink:0;letter-spacing:.5px}
.av-xs{width:24px;height:24px;font-size:8.5px}
.av-sm{width:30px;height:30px;font-size:10.5px}
.av-md{width:38px;height:38px;font-size:13px}
.av-lg{width:48px;height:48px;font-size:16px}
.av-xl{width:64px;height:64px;font-size:22px}

/* RING */
.ring-wrap{position:relative;flex-shrink:0}
.ring-val{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-weight:900}

/* SCORE INPUT */
.sc-inp{width:58px;text-align:center;padding:4px 6px;background:var(--bg3);border:1.5px solid var(--border);border-radius:7px;color:var(--txt);font-size:13px;font-weight:700;outline:none;transition:var(--trans)}
.sc-inp:focus{border-color:var(--accent)}

/* PROGRESS */
.prog{height:6px;background:var(--bg3);border-radius:99px;overflow:hidden}
.prog-bar{height:100%;border-radius:99px;transition:width .5s ease}

/* ATTENDANCE BTN */
.att-btn{width:28px;height:28px;border-radius:7px;border:1.5px solid var(--border);display:inline-flex;align-items:center;justify-content:center;font-size:13px;cursor:pointer;transition:var(--trans);background:var(--bg3)}
.att-btn.present{background:var(--greenl);border-color:var(--green)}
.att-btn.absent{background:var(--redl);border-color:var(--red)}
.att-btn.late{background:var(--yellowl);border-color:var(--yellow)}

/* MINI ROW */
.mini-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)}
.mini-row:last-child{border-bottom:none}

/* COURSE CARD */
.course-card{background:var(--surf);border:1.5px solid var(--border);border-radius:var(--r);cursor:pointer;transition:var(--trans);overflow:hidden}
.course-card:hover{border-color:var(--accent);transform:translateY(-2px);box-shadow:var(--shadow)}

/* NOTIFICATION PANEL */
.notif-panel{
  position:absolute;top:50px;right:0;width:360px;
  background:var(--surf);border:1.5px solid var(--border2);border-radius:var(--r);
  box-shadow:var(--shadow);z-index:300;overflow:hidden;
  animation:slideUp .18s ease;
}
.notif-item{display:flex;gap:10px;padding:12px 16px;border-bottom:1px solid var(--border);transition:var(--trans);cursor:pointer}
.notif-item:hover{background:var(--bg3)}
.notif-item.unread{background:var(--accl)}
.notif-item:last-child{border-bottom:none}

/* LOGIN */
.login-screen{min-height:100vh;display:flex;align-items:center;justify-content:center;position:relative;z-index:1}
.login-card{background:var(--surf);border:1.5px solid var(--border2);border-radius:24px;padding:44px;width:430px;box-shadow:0 20px 60px rgba(79,126,247,0.15)}
.role-btns{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:18px 0}
.role-btn{padding:13px 8px;border-radius:10px;border:2px solid var(--border);background:var(--bg3);cursor:pointer;transition:var(--trans);text-align:center;color:var(--txt2)}
.role-btn:hover,.role-btn.sel{border-color:var(--accent);background:var(--accl);color:var(--accent)}
.role-btn-ico{font-size:24px;margin-bottom:4px}
.role-btn-lbl{font-size:12px;font-weight:800;letter-spacing:.02em}

/* INFO/WARN BOXES */
.info-box{background:var(--accl);border:1.5px solid rgba(79,126,247,0.2);border-radius:9px;padding:10px 14px;font-size:12.5px;font-weight:600;color:var(--accent);margin-bottom:12px}
.warn-box{background:var(--yellowl);border:1.5px solid rgba(217,119,6,0.2);border-radius:9px;padding:10px 14px;font-size:12.5px;font-weight:600;color:var(--yellow);margin-bottom:12px}
.success-box{background:var(--greenl);border:1.5px solid rgba(22,163,74,0.2);border-radius:9px;padding:10px 14px;font-size:12.5px;font-weight:600;color:var(--green);margin-bottom:12px}

/* CREDS */
.cred-box{background:var(--bg3);border:1.5px solid var(--border);border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:8px}
.cred-row{display:flex;justify-content:space-between;align-items:center}
.cred-lbl{font-size:11px;font-weight:800;color:var(--txt3);text-transform:uppercase;letter-spacing:.06em}
.cred-val{font-family:monospace;background:var(--accl);color:var(--accent);padding:3px 10px;border-radius:5px;font-size:13px;font-weight:700}

/* DASH GRID */
.dash-grid{display:grid;grid-template-columns:3fr 2fr;gap:18px}
.bar-chart{display:flex;align-items:flex-end;gap:8px;height:100px;padding-top:10px}
.bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px}
.bar{width:100%;border-radius:4px 4px 0 0;min-height:4px}
.bar-lbl{font-size:10px;color:var(--txt3);font-weight:600}

/* PORTAL */
.portal-hd{background:linear-gradient(135deg,var(--accl),rgba(22,163,74,0.06));border:1.5px solid var(--border);border-radius:var(--r);padding:22px;display:flex;gap:16px;align-items:center;margin-bottom:20px}

/* BULLETIN */
@media print{
  .no-print{display:none!important}
  .print-only{display:block!important}
  body{background:#fff!important;color:#000!important}
  .bulletin-sheet{box-shadow:none!important;border:1px solid #ccc!important;page-break-inside:avoid}
}
.print-only{display:none}
.bulletin-sheet{
  background:#fff;color:#000;border:2px solid #4f7ef7;border-radius:12px;
  padding:32px;max-width:780px;margin:0 auto;
  box-shadow:0 4px 24px rgba(79,126,247,0.15);
}
.bulletin-header{text-align:center;border-bottom:2px solid #4f7ef7;padding-bottom:16px;margin-bottom:20px}
.bulletin-title{font-family:'Playfair Display',serif;font-size:24px;font-weight:900;color:#1e293b}
.bulletin-sub{font-size:13px;color:#64748b;margin-top:4px}
.bulletin-student{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px;padding:14px;background:#f8faff;border-radius:8px;border:1px solid #e2e8f0}
.bulletin-field{font-size:13px;color:#475569;display:flex;flex-direction:column;gap:2px}
.bulletin-field strong{font-size:14px;color:#1e293b}
.bulletin-table table{width:100%;border-collapse:collapse}
.bulletin-table th{background:#4f7ef7;color:#fff;padding:8px 12px;font-size:12px;text-align:left}
.bulletin-table td{padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px}
.bulletin-table tr:last-child td{border-bottom:none}
.bulletin-table tr:nth-child(even) td{background:#f8faff}
.bulletin-footer{margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;display:grid;grid-template-columns:1fr 1fr;gap:16px}
.sig-line{border-top:1px solid #000;padding-top:6px;font-size:12px;text-align:center;color:#475569}

/* CHAT */
.chat-inp{background:var(--bg3);border:1.5px solid var(--border);border-radius:10px;padding:10px 14px;color:var(--txt);font-size:13px;font-weight:600;outline:none;flex:1;transition:var(--trans)}
.chat-inp:focus{border-color:var(--accent);background:var(--surf)}

/* INCIDENT */
.incident-card{background:var(--surf);border:1.5px solid var(--border);border-radius:var(--r);padding:16px;margin-bottom:10px;transition:var(--trans)}
.incident-card:hover{border-color:var(--border2)}

/* QUICK GRADE WIDGET */
.qg-result{background:var(--bg3);border:1.5px solid var(--border);border-radius:10px;padding:14px;margin-top:12px}

/* DARK TOGGLE */
.theme-toggle{
  display:flex;align-items:center;gap:6px;padding:6px 11px;
  border-radius:20px;background:var(--bg3);border:1.5px solid var(--border);
  cursor:pointer;font-size:12px;font-weight:700;color:var(--txt2);transition:var(--trans);
}
.theme-toggle:hover{background:var(--accl);color:var(--accent);border-color:var(--accent)}
.toggle-track{width:32px;height:18px;border-radius:9px;background:var(--bg3);border:1.5px solid var(--border);position:relative;transition:var(--trans);cursor:pointer}
.toggle-track.on{background:var(--accent)}
.toggle-thumb{width:12px;height:12px;border-radius:50%;background:#fff;position:absolute;top:1px;left:1px;transition:var(--trans);box-shadow:0 1px 4px rgba(0,0,0,.25)}
.toggle-thumb.on{left:16px}

/* EXCEL UPLOAD */
.upload-zone{border:2px dashed var(--border2);border-radius:var(--r);padding:32px;text-align:center;cursor:pointer;transition:var(--trans);background:var(--bg3)}
.upload-zone:hover{border-color:var(--accent);background:var(--accl)}
`;

// ═══════════════════════════════════════════════════════════════
//  AVATAR COMPONENT
// ═══════════════════════════════════════════════════════════════
function Av({ init = "?", size = "av-md" }) {
  const bg = `linear-gradient(135deg,${avatarColor(init)},${avatarColor(init + "X")})`;
  return <div className={`av ${size}`} style={{ background: bg }}>{init}</div>;
}

function ScoreRing({ score, max, size = 60 }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  const pct = (max > 0 && score != null) ? score / max : 0;
  const col = scoreColor(score, max);
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg3)" strokeWidth="5" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth="5"
          strokeDasharray={c} strokeDashoffset={c - pct * c}
          strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="ring-val" style={{ color: col, fontSize: size < 50 ? 10 : 12 }}>{score != null ? score : "–"}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  BACKGROUND DECORATION
// ═══════════════════════════════════════════════════════════════
function BgDecor() {
  return (
    <div className="bg-wrap">
      <div className="bg-dots" />
      <div className="bg-shape bg-s1" />
      <div className="bg-shape bg-s2" />
      <div className="bg-shape bg-s3" />
      <div className="deco-book" style={{ top: "8%", left: "3%", transform: "rotate(-12deg)" }}>📚</div>
      <div className="deco-book" style={{ bottom: "10%", right: "2%", transform: "rotate(8deg)", fontSize: 60 }}>🎓</div>
      <div className="deco-book" style={{ top: "50%", left: "1%", transform: "rotate(5deg)", fontSize: 50 }}>✏️</div>
      <div className="deco-book" style={{ top: "15%", right: "3%", transform: "rotate(-8deg)", fontSize: 55 }}>📖</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  NOTIFICATIONS PANEL
// ═══════════════════════════════════════════════════════════════
function NotifPanel({ data, setData, onClose }) {
  const unread = data.notifications.filter(n => !n.read).length;
  const markAll = () => setData(d => ({ ...d, notifications: d.notifications.map(n => ({ ...n, read: true })) }));
  const notifIcons = { assignment: "📋", grades: "📊", announcement: "📢", incident: "⚠️", chat: "💬" };
  return (
    <div className="notif-panel">
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 15, color: "var(--txt)" }}>Notificaciones</div>
          {unread > 0 && <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700 }}>{unread} sin leer</div>}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {unread > 0 && <button className="btn btn-xs btn-ghost" onClick={markAll}>Marcar todo leído</button>}
          <button className="btn btn-xs btn-ghost" onClick={onClose}>✕</button>
        </div>
      </div>
      <div style={{ maxHeight: 360, overflowY: "auto" }}>
        {data.notifications.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "var(--txt3)", fontSize: 13 }}>Sin notificaciones</div>
        )}
        {[...data.notifications].reverse().map(n => (
          <div key={n.id} className={`notif-item ${!n.read ? "unread" : ""}`}
            onClick={() => setData(d => ({ ...d, notifications: d.notifications.map(x => x.id === n.id ? { ...x, read: true } : x) }))}>
            <div style={{ fontSize: 20, flexShrink: 0 }}>{notifIcons[n.type] || "🔔"}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--txt)" }}>{n.title}</div>
              <div style={{ fontSize: 12, color: "var(--txt2)", marginTop: 2 }}>{n.body}</div>
              <div style={{ fontSize: 10, color: "var(--txt3)", marginTop: 3 }}>{fmtDate(n.ts)}</div>
            </div>
            {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", flexShrink: 0, marginTop: 4 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  LOGIN
// ═══════════════════════════════════════════════════════════════
function Login({ data, onLogin, dark, setDark }) {
  const [role, setRole] = useState("admin");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const demo = { admin: "admin@academiq.edu / admin2026", teacher: "ana.garcia@academiq.edu / Ana2026", student: "valentina.perez / Valentina2026" };

  const login = async () => {
    setErr("");
    try {
      const res = await apiFetch("/api/auth/login", { method: "POST", body: { role, user, pass } });
      return onLogin(res);
    } catch (e) {
      setErr(e.message || "Credenciales incorrectas. Revisa e intenta nuevamente.");
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div style={{ position: "absolute", top: 16, right: 16 }}>
          <div className="theme-toggle" onClick={() => setDark(!dark)}>
            {dark ? "☀️ Claro" : "🌙 Oscuro"}
          </div>
        </div>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: "linear-gradient(135deg,#4f7ef7,#7c3aed)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 900, color: "#fff", boxShadow: "0 6px 20px rgba(79,126,247,0.4)", marginBottom: 14 }}>A</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 900, color: "var(--txt)", letterSpacing: -1 }}>AcademiQ</h1>
          <p style={{ fontSize: 13, color: "var(--txt3)", fontWeight: 600, marginTop: 4 }}>Sistema de Gestión Escolar Profesional</p>
        </div>
        <div className="role-btns">
          {[["admin", "🛡️", "Director"], ["teacher", "📚", "Docente"], ["student", "🎒", "Alumno"]].map(([r, ic, lb]) => (
            <div key={r} className={`role-btn ${role === r ? "sel" : ""}`} onClick={() => setRole(r)}>
              <div className="role-btn-ico">{ic}</div>
              <div className="role-btn-lbl">{lb}</div>
            </div>
          ))}
        </div>
        <div className="fg"><label className="fl">{role === "student" ? "Usuario o correo" : "Correo electrónico"}</label>
          <input className="fc" value={user} onChange={e => setUser(e.target.value)} placeholder={role === "student" ? "nombre.apellido" : "correo@academiq.edu"} /></div>
        <div className="fg"><label className="fl">Contraseña</label>
          <input className="fc" type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} placeholder="••••••••" /></div>
        {err && <div className="warn-box" style={{ marginTop: 2 }}>{err}</div>}
        <button className="btn btn-primary btn-full" style={{ marginTop: 6 }} onClick={login}>Iniciar Sesión →</button>
        <div style={{ textAlign: "center", fontSize: 11.5, color: "var(--txt3)", marginTop: 14, fontWeight: 600 }}>
          <span>Demo: {demo[role]}</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════════
function Dashboard({ data, user, setPage }) {
  const active = data.students.filter(s => s.status === "active").length;
  const allSc = data.scores.filter(s => s.score != null);
  const generalAvg = allSc.length ? Math.round(allSc.reduce((a, b) => a + b.score, 0) / allSc.length) : 0;
  const pending = data.scores.filter(s => !s.submitted).length;
  const teachers = data.users.filter(u => u.role === "teacher").length;

  const myTeacherCourses = user.role === "teacher"
    ? data.courses.filter(c => c.teacherId === user.id)
    : data.courses;

  const barData = myTeacherCourses.slice(0, 5).map(c => {
    const aIds = data.assignments.filter(a => a.courseId === c.id).map(a => a.id);
    const scs = data.scores.filter(s => aIds.includes(s.assignmentId) && s.score != null).map(s => s.score);
    return { name: c.name.slice(0, 8), avg: scs.length ? Math.round(scs.reduce((a, b) => a + b, 0) / scs.length) : 0, color: c.color };
  });

  const statsItems = user.role === "teacher" ? [
    { ico: "👥", lbl: "Mis Alumnos", val: data.students.filter(s => myTeacherCourses.some(c => c.gradeId === s.gradeId)).length, sub: "en mis grados", col: "var(--accent)", bg: "var(--accl)" },
    { ico: "📚", lbl: "Mis Cursos", val: myTeacherCourses.length, sub: "asignados", col: "#22c55e", bg: "rgba(34,197,94,.12)" },
    { ico: "📋", lbl: "Mis Tareas", val: data.assignments.filter(a => myTeacherCourses.map(c => c.id).includes(a.courseId)).length, sub: "publicadas", col: "#f59e0b", bg: "rgba(245,158,11,.12)" },
    { ico: "✅", lbl: "Notas Reg.", val: data.scores.filter(s => s.submitted && myTeacherCourses.flatMap(c => data.assignments.filter(a => a.courseId === c.id).map(a => a.id)).includes(s.assignmentId)).length, sub: "registradas", col: "#16a34a", bg: "rgba(22,163,74,.12)" },
  ] : [
    { ico: "👥", lbl: "Total Alumnos", val: data.students.length, sub: `${active} activos`, col: "var(--accent)", bg: "var(--accl)" },
    { ico: "📚", lbl: "Docentes", val: teachers, sub: "activos", col: "#22c55e", bg: "rgba(34,197,94,.12)" },
    { ico: "📊", lbl: "Promedio Gral.", val: generalAvg, sub: "puntos acumulados", col: "#f59e0b", bg: "rgba(245,158,11,.12)" },
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
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--txt2)", marginBottom: 2 }}>{c.avg}</div>
                    <div className="bar" style={{ height: `${c.avg}%`, background: `linear-gradient(180deg,${c.color},${c.color}88)`, borderRadius: "4px 4px 0 0" }} />
                    <div className="bar-lbl">{c.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Quick Nav Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {(user.role === "admin"
              ? [["gradebook", "📊", "Calificaciones", "Registrar notas"], ["students", "👥", "Alumnos", "Gestionar alumnos"], ["reports", "📈", "Reportes", "Ver estadísticas"], ["bulletin", "📄", "Boletines", "Generar e imprimir"], ["attendance", "📅", "Asistencia", "Control diario"], ["chat", "💬", "Chat", "Mensajería"]]
              : [["gradebook", "📊", "Calificaciones", "Mis cuadros"], ["quickgrade", "⚡", "Nota Rápida", "Asignar nota"], ["attendance", "📅", "Asistencia", "Registrar hoy"], ["announcements", "📢", "Avisos", "Publicar aviso"], ["reports", "📈", "Reportes", "Estadísticas"], ["chat", "💬", "Chat", "Mensajería"]]
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
                  <div style={{ fontSize: 12, color: "var(--txt2)" }}>{a.content.slice(0, 70)}...</div>
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

// ═══════════════════════════════════════════════════════════════
//  STUDENTS PAGE
// ═══════════════════════════════════════════════════════════════
function StudentsPage({ data, setData, search, user }) {
  const [filterGrade, setFilterGrade] = useState("");
  const [modal, setModal] = useState(false);
  const [editS, setEditS] = useState(null);
  const [form, setForm] = useState({ name: "", code: "", gradeId: "", status: "active" });
  const [creds, setCreds] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [xlsxMsg, setXlsxMsg] = useState("");
  const fileRef = useRef(null);

  // ✅ ✅ ✅ DELETE FUNCTION AQUÍ (FUERA DEL useMemo)
  const deleteStudent = (studentId) => {
    if (user?.role !== "admin") return;

    const student = data.students.find((s) => s.id === studentId);
    const ok = window.confirm(
      `¿Eliminar al alumno "${student?.name}"?\n\nEsto también eliminará notas, asistencia y reportes relacionados.`
    );
    if (!ok) return;

    setData((d) => ({
      ...d,
      students: d.students.filter((s) => s.id !== studentId),
      scores: d.scores.filter((sc) => sc.studentId !== studentId),
      attendance: d.attendance.filter((a) => a.studentId !== studentId),
      incidents: d.incidents.filter((i) => i.studentId !== studentId),
    }));
  };

  const filtered = useMemo(() => {
    return data.students.filter((s) => {
      const q = search.toLowerCase();
      const m =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.code.includes(q) ||
        (s.username || "").includes(q);

      const g = !filterGrade || s.gradeId === parseInt(filterGrade);
      return m && g;
    });
  }, [data.students, search, filterGrade]);

  const getAvg = sid => {
    const scs = data.scores.filter(s => s.studentId === sid && s.score != null).map(s => s.score);
    return scs.length ? Math.round(scs.reduce((a, b) => a + b, 0) / scs.length) : null;
  };

  const openNew = () => {
    setEditS(null);
    const n = data.students.length + 1;
    setForm({ name: "", code: `2024-${String(n).padStart(3, "0")}`, gradeId: "", status: "active" });
    setCreds(null); setModal(true);
  };
  const openEdit = s => { setEditS(s); setForm({ name: s.name, code: s.code, gradeId: String(s.gradeId), status: s.status }); setCreds(null); setModal(true); };

  const save = () => {
    if (!form.name || !form.gradeId) return;
    const username = genUser(form.name);
    const password = genPass(form.name);
    const email = genEmail(form.name);
    const avatar = initials(form.name);
    if (editS) {
      setData(d => ({ ...d, students: d.students.map(s => s.id === editS.id ? { ...s, ...form, gradeId: parseInt(form.gradeId), avatar: initials(form.name) } : s) }));
      setModal(false);
    } else {
      const ns = { id: mkId(), ...form, gradeId: parseInt(form.gradeId), username, password, email, avatar };
      setData(d => ({ ...d, students: [...d.students, ns] }));
      setCreds({ name: form.name, username, password, email });
    }
  };

  // ✅ Import / Export Excel (REAL) con xlsx
  const normalizeHeader = (h) =>
    String(h || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const pick = (row, keys) => {
    for (const k of keys) {
      const v = row[k];
      if (v != null && String(v).trim() !== "") return String(v).trim();
    }
    return "";
  };

  const findGradeId = (gradeName, section) => {
    if (!gradeName) return null;
    const gName = gradeName.trim().toLowerCase();
    const sec = (section || "").trim().toLowerCase();

    const found = data.grades.find(
      (g) =>
        g.name.toLowerCase() === gName &&
        (!sec || (g.section || "").toLowerCase() === sec)
    );

    return found?.id ?? null;
  };

  const genCreds = (fullName) => {
    const parts = fullName.trim().split(/\s+/);
    const first = parts[0] || "alumno";
    const last = parts[1] || "colegio";

    const clean = (s) =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z]/g, "");

    const username = `${clean(first)}.${clean(last)}`;
    const email = `${username}@alumnos.edu`;
    const password =
      first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() + "2026";
    const avatar = fullName
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return { username, email, password, avatar };
  };

  const handleXlsxUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setXlsxMsg(`⏳ Leyendo "${file.name}"...`);

      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });

      const imported = [];

      wb.SheetNames.forEach((sheetName) => {
        const ws = wb.Sheets[sheetName];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });

        raw.forEach((row) => {
          const normalizedRow = {};
          Object.keys(row).forEach((k) => {
            normalizedRow[normalizeHeader(k)] = row[k];
          });

          const name = pick(normalizedRow, ["nombre completo", "nombre", "alumno"]);
          const code = pick(normalizedRow, ["codigo personal", "código personal", "codigo", "código"]);
          const gradeName = pick(normalizedRow, ["grado", "nivel", "grado/nivel"]);
          const section = pick(normalizedRow, ["seccion", "sección", "sec"]);

          if (!name) return;

          imported.push({
            name,
            code: code || "",
            gradeName: gradeName || sheetName,
            section: section || "",
          });
        });
      });

      if (!imported.length) {
        setXlsxMsg("⚠️ No se encontraron filas válidas (revisa columnas).");
        return;
      }

      const existingCodes = new Set(data.students.map((s) => s.code));
      const existingNames = new Set(data.students.map((s) => s.name.toLowerCase()));

      const newStudents = imported
        .map((r, idx) => {
          const gradeId =
            findGradeId(r.gradeName, r.section) ??
            findGradeId(r.gradeName, "") ??
            data.grades[0]?.id;

          let codeFinal = (r.code || "").trim();
          if (!codeFinal) codeFinal = `2026-IMP-${String(idx + 1).padStart(3, "0")}`;

          if (existingCodes.has(codeFinal)) return null;

          const nmKey = r.name.toLowerCase();
          if (existingNames.has(nmKey)) return null;

          const creds = genCreds(r.name);

          return {
            id: mkId(),
            name: r.name,
            code: codeFinal,
            gradeId,
            status: "active",
            avatar: creds.avatar,
            username: creds.username,
            password: creds.password,
            email: creds.email,
          };
        })
        .filter(Boolean);

      if (!newStudents.length) {
        setXlsxMsg("⚠️ Todo lo importado ya existía (duplicados por código/nombre).");
        return;
      }

      setData((d) => ({ ...d, students: [...d.students, ...newStudents] }));
      setXlsxMsg(`✅ Importados ${newStudents.length} alumnos desde "${file.name}".`);

      e.target.value = "";
      setTimeout(() => setXlsxMsg(""), 4500);
    } catch (err) {
      console.error(err);
      setXlsxMsg(`❌ Error al importar: ${err.message}`);
    }
  };

  const exportToExcel = () => {
    const rows = filtered.map((s, i) => {
      const gr = data.grades.find((g) => g.id === s.gradeId);
      return {
        "No.": i + 1,
        "Nombre completo": s.name,
        "Código personal": s.code,
        "Grado": gr?.name || "",
        "Sección": gr?.section || "",
        "Usuario": s.username,
        "Correo": s.email,
        "Estado": s.status,
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Alumnos");

    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Alumnos_Export.xlsx";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (viewId) {
    const student = data.students.find(s => s.id === viewId);
    const gr = data.grades.find(g => g.id === student.gradeId);
    const myCourses = data.courses.filter(c => c.gradeId === student.gradeId);
    const incidents = data.incidents.filter(i => i.studentId === viewId);
    return (
      <div>
        <button className="btn btn-ghost" style={{ marginBottom: 18 }} onClick={() => setViewId(null)}>← Regresar</button>
        <div className="portal-hd">
          <Av init={student.avatar} size="av-xl" />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 22, marginBottom: 4 }}>{student.name}</h2>
            <div style={{ fontSize: 13, color: "var(--txt3)", marginBottom: 8 }}>Código: {student.code} · {gr?.name} "{gr?.section}"</div>
            <div style={{ display: "flex", gap: 8 }}>
              <span className={`badge badge-${student.status}`}>{student.status === "active" ? "Activo" : "Inactivo"}</span>
              <span className="badge badge-student">Alumno</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--txt3)", marginTop: 8 }}>👤 {student.username} &nbsp;|&nbsp; ✉️ {student.email} &nbsp;|&nbsp; 🔑 {student.password}</div>
          </div>
          {incidents.length > 0 && (
            <div style={{ textAlign: "center", background: "var(--redl)", borderRadius: 12, padding: "10px 16px", border: "1.5px solid rgba(220,38,38,0.2)" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 26, color: "var(--red)" }}>{incidents.length}</div>
              <div style={{ fontSize: 11, color: "var(--red)", fontWeight: 700 }}>Reportes</div>
            </div>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 }}>
          <div>
            {myCourses.map(c => {
              const asgns = data.assignments.filter(a => a.courseId === c.id);
              const total = totalScore(viewId, asgns, data.scores);
              const maxP = maxPossible(asgns);
              return (
                <div className="card" style={{ marginBottom: 14 }} key={c.id}>
                  <div style={{ height: 4, background: c.color }} />
                  <div className="card-hd">
                    <div className="card-title">{c.name}</div>
                    <div style={{ marginLeft: "auto", fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 20, color: scoreColor(total, maxP) }}>
                      {total} / {maxP}
                    </div>
                  </div>
                  <div style={{ padding: "0 18px" }}>
                    {asgns.map(a => {
                      const sc = data.scores.find(s => s.studentId === viewId && s.assignmentId === a.id);
                      return (
                        <div className="mini-row" key={a.id}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: typeColors[a.type] }} />
                          <div style={{ flex: 1, fontSize: 13 }}>{a.name}</div>
                          <span style={{ fontSize: 11, color: "var(--txt3)" }}>/{a.maxScore}</span>
                          <span style={{ fontWeight: 800, fontSize: 14, color: scoreColor(sc?.score, a.maxScore), minWidth: 36, textAlign: "right" }}>{sc?.score ?? "–"}</span>
                        </div>
                      );
                    })}
                    <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 0", gap: 6, fontSize: 12, color: "var(--txt3)" }}>
                      <span>Total:</span>
                      <span style={{ fontWeight: 800, color: scoreColor(total, maxP) }}>{total} / {maxP} pts</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div>
            <div className="card">
              <div className="card-hd"><span style={{ fontSize: 17 }}>⚠️</span><div className="card-title">Reportes ({incidents.length})</div></div>
              <div style={{ padding: "6px 16px" }}>
                {incidents.length === 0 && <div style={{ padding: "16px 0", textAlign: "center", color: "var(--txt3)", fontSize: 13 }}>Sin reportes 🎉</div>}
                {incidents.map(inc => (
                  <div key={inc.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                      <span className={`badge badge-${inc.severity}`}>{severityLabels[inc.severity]}</span>
                      <span style={{ fontSize: 11, color: "var(--txt3)" }}>{inc.date}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--txt)" }}>{inc.description}</div>
                    <div style={{ fontSize: 12, color: "var(--txt2)", marginTop: 3 }}>📋 {inc.justification}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <select className="fc" style={{ width: 200 }} value={filterGrade} onChange={e => setFilterGrade(e.target.value)}>
          <option value="">Todos los grados</option>
          {data.grades.map(g => <option key={g.id} value={g.id}>{g.name} "{g.section}"</option>)}
        </select>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <label className="btn btn-ghost" style={{ cursor: "pointer" }}>
            📂 Importar Excel
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={handleXlsxUpload} />
          </label>
          <button className="btn btn-ghost" onClick={exportToExcel}>📤 Exportar Excel</button>
          <button className="btn btn-primary" onClick={openNew}>+ Nuevo Alumno</button>
        </div>
      </div>
      {xlsxMsg && <div className="info-box">{xlsxMsg}</div>}
      <div className="info-box" style={{ marginBottom: 14 }}>
        💡 Para importar desde Excel: el archivo debe tener una hoja por grado (nombre de la hoja = nombre del grado). Las columnas deben ser: Nombre, Código.
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Alumno</th><th>Código</th><th>Usuario</th><th>Correo</th><th>Grado</th><th>Total pts</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.map(s => {
                const gr = data.grades.find(g => g.id === s.gradeId);
                const avg = getAvg(s.id);
                const incs = data.incidents.filter(i => i.studentId === s.id).length;
                return (
                  <tr key={s.id}>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><Av init={s.avatar} /><div><div style={{ fontWeight: 700 }}>{s.name}</div>{incs > 0 && <span className="badge badge-high" style={{ marginTop: 2 }}>⚠️ {incs} reportes</span>}</div></div></td>
                    <td style={{ fontFamily: "monospace", fontWeight: 700 }}>{s.code}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--accent)" }}>{s.username}</td>
                    <td style={{ fontSize: 12, color: "var(--txt2)" }}>{s.email}</td>
                    <td>{gr ? `${gr.name} "${gr.section}"` : "–"}</td>
                    <td><span style={{ fontWeight: 800, color: "var(--accent)" }}>{avg ?? "–"}</span></td>
                    <td><span className={`badge badge-${s.status}`}>{s.status === "active" ? "Activo" : "Inactivo"}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-xs btn-ghost" onClick={() => setViewId(s.id)}>Ver</button>
                        <button className="btn btn-xs btn-ghost" onClick={() => openEdit(s)}>✏️</button>

                        {user?.role === "admin" && (
                          <button
                            className="btn btn-xs btn-danger"
                            onClick={() => deleteStudent(s.id)}
                            title="Eliminar alumno"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="overlay" onClick={() => { if (!creds) setModal(false); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {creds ? (
              <>
                <div className="modal-title">✅ Alumno creado exitosamente</div>
                <div className="success-box">Credenciales generadas automáticamente. Comparte con el alumno/familia.</div>
                <div className="cred-box">
                  <div style={{ fontWeight: 700, fontSize: 12, color: "var(--txt2)", marginBottom: 6 }}>📋 Credenciales — {creds.name}</div>
                  {[["Usuario", creds.username], ["Contraseña", creds.password], ["Correo", creds.email]].map(([l, v]) => (
                    <div className="cred-row" key={l}><span className="cred-lbl">{l}</span><span className="cred-val">{v}</span></div>
                  ))}
                </div>
                <div className="modal-foot"><button className="btn btn-primary" onClick={() => setModal(false)}>Cerrar</button></div>
              </>
            ) : (
              <>
                <div className="modal-title">{editS ? "Editar Alumno" : "Nuevo Alumno"}</div>
                <div className="fr">
                  <div className="fg"><label className="fl">Nombre completo</label><input className="fc" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nombre Apellido" /></div>
                  <div className="fg"><label className="fl">Código</label><input className="fc" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
                </div>
                <div className="fr">
                  <div className="fg"><label className="fl">Grado</label>
                    <select className="fc" value={form.gradeId} onChange={e => setForm({ ...form, gradeId: e.target.value })}>
                      <option value="">Seleccionar</option>
                      {data.grades.map(g => <option key={g.id} value={g.id}>{g.name} "{g.section}"</option>)}
                    </select></div>
                  <div className="fg"><label className="fl">Estado</label>
                    <select className="fc" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="active">Activo</option><option value="inactive">Inactivo</option>
                    </select></div>
                </div>
                {!editS && <div className="info-box">🔑 Usuario, contraseña y correo se generarán automáticamente del nombre completo.</div>}
                <div className="modal-foot">
                  <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
                  <button className="btn btn-primary" onClick={save}>Guardar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  GRADE BOOK
// ═══════════════════════════════════════════════════════════════
function GradeBook({ data, setData, user, search }) {
  const [selCourse, setSelCourse] = useState(null);
  const [aModal, setAModal] = useState(false);
  const [editA, setEditA] = useState(null);
  const [aForm, setAForm] = useState({ name: "", type: "tarea", maxScore: 10, dueDate: "", instructions: "" });
  const [editCell, setEditCell] = useState(null);
  const [cellVal, setCellVal] = useState("");

  const courses = user.role === "admin" ? data.courses : data.courses.filter(c => c.teacherId === user.id);
  const course = courses.find(c => c.id === selCourse);
  const assigns = course ? data.assignments.filter(a => a.courseId === course.id) : [];
  const maxTotal = assigns.reduce((a, b) => a + b.maxScore, 0);
  const students = course ? data.students.filter(s => s.gradeId === course.gradeId && s.status === "active").filter(s => {
    const q = search.toLowerCase();
    return !q || s.name.toLowerCase().includes(q);
  }) : [];

  const getScore = (sid, aid) => data.scores.find(s => s.studentId === sid && s.assignmentId === aid);

  const saveCell = (sid, aid, max) => {
    let val = cellVal === "" ? null : Math.min(max, Math.max(0, parseFloat(cellVal)));
    if (val !== null) val = Math.round(val * 10) / 10;
    setData(d => {
      const ex = d.scores.find(s => s.studentId === sid && s.assignmentId === aid);
      if (ex) return { ...d, scores: d.scores.map(s => s.studentId === sid && s.assignmentId === aid ? { ...s, score: val, submitted: val != null } : s) };
      return { ...d, scores: [...d.scores, { id: mkId(), studentId: sid, assignmentId: aid, score: val, submitted: val != null }] };
    });
    setEditCell(null);
  };

  const saveAssign = () => {
    if (!aForm.name) return;
    if (editA) {
      setData(d => ({ ...d, assignments: d.assignments.map(a => a.id === editA.id ? { ...a, ...aForm, maxScore: parseFloat(aForm.maxScore) } : a) }));
    } else {
      setData(d => ({ ...d, assignments: [...d.assignments, { ...aForm, id: mkId(), courseId: selCourse, maxScore: parseFloat(aForm.maxScore) }] }));
    }
    setAModal(false);
  };

  if (!selCourse) {
    const filteredCourses = courses.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));
    return (
      <div>
        <div style={{ marginBottom: 18 }}>
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>Cuadro de Calificaciones</h3>
          <p style={{ fontSize: 13, color: "var(--txt3)" }}>Las notas se suman directamente según el valor asignado a cada tarea.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {filteredCourses.map(c => {
            const gr = data.grades.find(g => g.id === c.gradeId);
            const t = data.users.find(u => u.id === c.teacherId);
            const studs = data.students.filter(s => s.gradeId === c.gradeId && s.status === "active").length;
            const asgns = data.assignments.filter(a => a.courseId === c.id).length;
            const maxPts = data.assignments.filter(a => a.courseId === c.id).reduce((x, y) => x + y.maxScore, 0);
            return (
              <div className="course-card" key={c.id} onClick={() => setSelCourse(c.id)}>
                <div style={{ height: 4, background: c.color }} />
                <div className="card-body">
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 3 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "var(--txt3)", marginBottom: 10 }}>{gr?.name} "{gr?.section}"</div>
                  <div style={{ display: "flex", gap: 10, fontSize: 12, color: "var(--txt2)" }}>
                    <span>👥 {studs}</span><span>📋 {asgns} tareas</span><span>🎯 {maxPts} pts</span>
                  </div>
                  {user.role === "admin" && <div style={{ fontSize: 11, color: "var(--txt3)", marginTop: 6, fontWeight: 600 }}>Prof. {t?.name}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const gr = data.grades.find(g => g.id === course.gradeId);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <button className="btn btn-ghost" onClick={() => setSelCourse(null)}>← Cursos</button>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 17 }}>{course.name} — {gr?.name} "{gr?.section}"</h3>
          <div style={{ fontSize: 12, color: "var(--txt3)" }}>
            Total máximo: <strong style={{ color: "var(--accent)" }}>{maxTotal} pts</strong> — Las notas se suman directamente (sin promediar)
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditA(null); setAForm({ name: "", type: "tarea", maxScore: 10, dueDate: "", instructions: "" }); setAModal(true); }}>
          + Asignar Tarea
        </button>
      </div>

      {assigns.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {assigns.map(a => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--bg3)", border: "1.5px solid var(--border)", borderRadius: 9, padding: "5px 10px" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: typeColors[a.type] }} />
              <span style={{ fontSize: 12.5, fontWeight: 700 }}>{a.name.slice(0, 22)}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", background: "var(--accl)", padding: "1px 6px", borderRadius: 99 }}>{a.maxScore}pts</span>
              {a.instructions && <span title={a.instructions} style={{ cursor: "help", fontSize: 13 }}>📌</span>}
              <button style={{ background: "none", border: "none", color: "var(--txt3)", cursor: "pointer", fontSize: 12, padding: 0 }} onClick={() => { setEditA(a); setAForm({ ...a }); setAModal(true); }}>✏️</button>
              <button style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 14, padding: 0 }} onClick={() => setData(d => ({ ...d, assignments: d.assignments.filter(x => x.id !== a.id) }))}>×</button>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ minWidth: 180 }}>Alumno</th>
                {assigns.map(a => (
                  <th key={a.id} style={{ textAlign: "center", minWidth: 80 }}>
                    <div style={{ color: typeColors[a.type], fontWeight: 800 }}>{typeLabels[a.type]}</div>
                    <div style={{ fontSize: 9.5, color: "var(--txt3)", textTransform: "none", fontWeight: 600 }}>{a.name.slice(0, 14)}</div>
                    <div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 800 }}>/{a.maxScore}</div>
                  </th>
                ))}
                <th style={{ textAlign: "center", minWidth: 100 }}>Total Acum.</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => {
                const total = totalScore(student.id, assigns, data.scores);
                return (
                  <tr key={student.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Av init={student.avatar} size="av-sm" />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{student.name}</div>
                          <div style={{ fontSize: 10, color: "var(--txt3)" }}>{student.code}</div>
                        </div>
                      </div>
                    </td>
                    {assigns.map(a => {
                      const sc = getScore(student.id, a.id);
                      const key = `${student.id}-${a.id}`;
                      return (
                        <td key={a.id} style={{ textAlign: "center" }}>
                          {editCell === key ? (
                            <input className="sc-inp" type="number" min="0" max={a.maxScore}
                              value={cellVal} onChange={e => setCellVal(e.target.value)}
                              onBlur={() => saveCell(student.id, a.id, a.maxScore)}
                              onKeyDown={e => { if (e.key === "Enter") saveCell(student.id, a.id, a.maxScore); if (e.key === "Escape") setEditCell(null); }}
                              autoFocus />
                          ) : (
                            <div style={{ cursor: "text", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}
                              onClick={() => { setEditCell(key); setCellVal(sc?.score ?? ""); }}>
                              <span style={{ fontWeight: 800, fontSize: 15, color: scoreColor(sc?.score, a.maxScore) }}>
                                {sc?.score != null ? sc.score : <span style={{ color: "var(--txt3)", fontSize: 13 }}>–</span>}
                              </span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 17, color: scoreColor(total, maxTotal) }}>{total}</span>
                        <span style={{ fontSize: 10, color: "var(--txt3)" }}>/ {maxTotal} pts</span>
                        <div className="prog" style={{ width: 50, marginTop: 3 }}>
                          <div className="prog-bar" style={{ width: `${maxTotal > 0 ? (total / maxTotal * 100) : 0}%`, background: scoreColor(total, maxTotal) }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {aModal && (
        <div className="overlay" onClick={() => setAModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{editA ? "Editar Evaluación" : "Nueva Tarea / Evaluación"}</div>
            <div className="fg"><label className="fl">Nombre</label><input className="fc" value={aForm.name} onChange={e => setAForm({ ...aForm, name: e.target.value })} placeholder="Ej: Examen Parcial 1" /></div>
            <div className="fr">
              <div className="fg"><label className="fl">Tipo</label>
                <select className="fc" value={aForm.type} onChange={e => setAForm({ ...aForm, type: e.target.value })}>
                  <option value="tarea">Tarea</option><option value="examen">Examen</option>
                  <option value="proyecto">Proyecto</option><option value="laboratorio">Laboratorio</option>
                </select></div>
              <div className="fg"><label className="fl">Valor máximo (pts)</label><input className="fc" type="number" min="1" value={aForm.maxScore} onChange={e => setAForm({ ...aForm, maxScore: e.target.value })} /></div>
            </div>
            <div className="fr">
              <div className="fg"><label className="fl">Fecha de entrega</label><input className="fc" type="date" value={aForm.dueDate} onChange={e => setAForm({ ...aForm, dueDate: e.target.value })} /></div>
            </div>
            <div className="fg"><label className="fl">📌 Instrucciones / Comentarios</label><textarea className="fc" rows={3} value={aForm.instructions} onChange={e => setAForm({ ...aForm, instructions: e.target.value })} placeholder="Instrucciones detalladas para los alumnos..." /></div>
            <div className="info-box">Nota: La nota asignada se suma directamente al total acumulado. Ej: si pones 8/10, se suman 8 puntos.</div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setAModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveAssign}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  QUICK GRADE (Teacher shortcut)
// ═══════════════════════════════════════════════════════════════
function QuickGrade({ data, setData, user }) {
  const [q, setQ] = useState("");
  const [selStudent, setSelStudent] = useState(null);
  const [selAssign, setSelAssign] = useState(null);
  const [scoreVal, setScoreVal] = useState("");
  const [saved, setSaved] = useState(false);

  const myCourses = data.courses.filter(c => c.teacherId === user.id);
  const myAssignIds = data.assignments.filter(a => myCourses.map(c => c.id).includes(a.courseId)).map(a => a.id);

  const students = useMemo(() => {
    if (!q.trim()) return [];
    return data.students.filter(s => s.name.toLowerCase().includes(q.toLowerCase()) || s.code.includes(q));
  }, [q, data.students]);

  const studentCourseAssigns = selStudent ? (() => {
    const st = data.students.find(s => s.id === selStudent);
    const courses = myCourses.filter(c => c.gradeId === st.gradeId);
    return courses.flatMap(c => {
      const asgns = data.assignments.filter(a => a.courseId === c.id);
      return asgns.map(a => ({ ...a, courseName: c.name }));
    });
  })() : [];

  const assign = studentCourseAssigns.find(a => a.id === selAssign);
  const currScore = selStudent && selAssign ? data.scores.find(s => s.studentId === selStudent && s.assignmentId === selAssign) : null;

  const saveScore = () => {
    if (!selStudent || !selAssign || scoreVal === "") return;
    const max = assign?.maxScore || 100;
    const val = Math.min(max, Math.max(0, parseFloat(scoreVal)));
    setData(d => {
      const ex = d.scores.find(s => s.studentId === selStudent && s.assignmentId === selAssign);
      if (ex) return { ...d, scores: d.scores.map(s => s.studentId === selStudent && s.assignmentId === selAssign ? { ...s, score: val, submitted: true } : s) };
      return { ...d, scores: [...d.scores, { id: mkId(), studentId: selStudent, assignmentId: selAssign, score: val, submitted: true }] };
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <div style={{ maxWidth: 680 }}>
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>⚡ Asignación Rápida de Notas</h3>
          <p style={{ fontSize: 13, color: "var(--txt3)" }}>Busca un alumno por nombre y asigna una nota directamente sin navegar al cuadro completo.</p>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="fg">
              <label className="fl">🔍 Buscar Alumno</label>
              <input className="fc" value={q} onChange={e => { setQ(e.target.value); setSelStudent(null); setSelAssign(null); setSaved(false); }} placeholder="Escribe el nombre del alumno..." />
            </div>

            {students.length > 0 && !selStudent && (
              <div style={{ border: "1.5px solid var(--border)", borderRadius: 9, overflow: "hidden", marginBottom: 14 }}>
                {students.map(s => {
                  const gr = data.grades.find(g => g.id === s.gradeId);
                  return (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", transition: "var(--trans)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      onClick={() => setSelStudent(s.id)}>
                      <Av init={s.avatar} /><div><div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div><div style={{ fontSize: 11, color: "var(--txt3)" }}>{s.code} · {gr?.name}</div></div>
                    </div>
                  );
                })}
              </div>
            )}

            {selStudent && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--accl)", border: "1.5px solid rgba(79,126,247,0.2)", borderRadius: 9, marginBottom: 14 }}>
                  <Av init={data.students.find(s => s.id === selStudent)?.avatar} size="av-sm" />
                  <span style={{ fontWeight: 700, color: "var(--accent)" }}>{data.students.find(s => s.id === selStudent)?.name}</span>
                  <button className="btn btn-xs btn-ghost" style={{ marginLeft: "auto" }} onClick={() => { setSelStudent(null); setQ(""); }}>Cambiar</button>
                </div>

                <div className="fg">
                  <label className="fl">Seleccionar Tarea / Evaluación</label>
                  <select className="fc" value={selAssign || ""} onChange={e => { setSelAssign(parseInt(e.target.value)); setScoreVal(""); setSaved(false); }}>
                    <option value="">Seleccionar...</option>
                    {studentCourseAssigns.map(a => (
                      <option key={a.id} value={a.id}>{a.courseName} — {a.name} (/{a.maxScore}pts)</option>
                    ))}
                  </select>
                </div>

                {selAssign && (
                  <div className="qg-result">
                    {assign?.instructions && <div style={{ fontSize: 12, color: "var(--txt2)", marginBottom: 10 }}>📌 {assign.instructions}</div>}
                    {currScore?.score != null && (
                      <div className="info-box" style={{ marginBottom: 10 }}>Nota actual: <strong>{currScore.score}</strong> / {assign?.maxScore}pts. Puedes actualizarla.</div>
                    )}
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                      <div style={{ flex: 1 }}>
                        <label className="fl">Nota (máx. {assign?.maxScore}pts)</label>
                        <input className="fc" type="number" min="0" max={assign?.maxScore} value={scoreVal} onChange={e => setScoreVal(e.target.value)} placeholder="0" onKeyDown={e => e.key === "Enter" && saveScore()} />
                      </div>
                      <button className="btn btn-primary" style={{ height: 40 }} onClick={saveScore}>Guardar Nota</button>
                    </div>
                    {saved && <div className="success-box" style={{ marginTop: 10 }}>✅ Nota guardada correctamente.</div>}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ATTENDANCE
// ═══════════════════════════════════════════════════════════════
function AttendancePage({ data, setData, user, search }) {
  const [selCourse, setSelCourse] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const courses = user.role === "admin" ? data.courses : data.courses.filter(c => c.teacherId === user.id);
  const course = courses.find(c => c.id === selCourse);
  const students = course ? data.students.filter(s => s.gradeId === course.gradeId && s.status === "active").filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase())) : [];

  const getAtt = sid => data.attendance.find(a => a.studentId === sid && a.courseId === selCourse && a.date === date);
  const setAtt = (sid, status) => setData(d => {
    const ex = d.attendance.find(a => a.studentId === sid && a.courseId === selCourse && a.date === date);
    if (ex) return { ...d, attendance: d.attendance.map(a => a.studentId === sid && a.courseId === selCourse && a.date === date ? { ...a, status } : a) };
    return { ...d, attendance: [...d.attendance, { id: mkId(), studentId: sid, courseId: selCourse, date, status }] };
  });
  const markAll = (status) => students.forEach(s => setAtt(s.id, status));

  if (!selCourse) {
    return (
      <div>
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>Control de Asistencia</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {courses.map(c => {
            const gr = data.grades.find(g => g.id === c.gradeId);
            const today = data.attendance.filter(a => a.courseId === c.id && a.date === new Date().toISOString().split("T")[0]).length;
            return (
              <div className="course-card" key={c.id} onClick={() => setSelCourse(c.id)}>
                <div style={{ height: 4, background: c.color }} />
                <div className="card-body">
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 3 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "var(--txt3)", marginBottom: 8 }}>{gr?.name} "{gr?.section}"</div>
                  <div style={{ fontSize: 12, color: today > 0 ? "var(--green)" : "var(--txt3)" }}>
                    {today > 0 ? `✅ ${today} registros hoy` : "📋 Sin registros hoy"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const gr = data.grades.find(g => g.id === course.gradeId);
  const summary = { present: 0, absent: 0, late: 0 };
  students.forEach(s => { const a = getAtt(s.id); if (a) summary[a.status]++; });

  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18 }}>
        <button className="btn btn-ghost" onClick={() => setSelCourse(null)}>← Cursos</button>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 17 }}>{course.name} — {gr?.name} "{gr?.section}"</h3>
        </div>
        <input type="date" className="fc" style={{ width: 165 }} value={date} onChange={e => setDate(e.target.value)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 18 }}>
        {[["present", "✅", "Presente", "var(--green)"], ["absent", "❌", "Ausente", "var(--red)"], ["late", "⏰", "Tarde", "var(--yellow)"]].map(([s, ic, lb, col]) => (
          <div key={s} style={{ background: "var(--surf)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 22 }}>{ic}</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 26, color: col }}>{summary[s]}</div>
            <div style={{ fontSize: 12, color: "var(--txt3)", fontWeight: 700 }}>{lb}</div>
          </div>
        ))}
        <div style={{ background: "var(--surf)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: 14, display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--txt3)", marginBottom: 4 }}>MARCAR TODO</div>
          <button className="btn btn-success btn-sm" style={{ justifyContent: "center" }} onClick={() => markAll("present")}>✅ Todos Presentes</button>
          <button className="btn btn-danger btn-sm" style={{ justifyContent: "center" }} onClick={() => markAll("absent")}>❌ Todos Ausentes</button>
        </div>
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Alumno</th><th>Estado Actual</th><th style={{ textAlign: "center" }}>Registrar</th></tr></thead>
            <tbody>
              {students.map(s => {
                const a = getAtt(s.id);
                return (
                  <tr key={s.id}>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 9 }}><Av init={s.avatar} /><span style={{ fontWeight: 700 }}>{s.name}</span></div></td>
                    <td>{a ? <span className={`badge badge-${a.status}`}>{a.status === "present" ? "✅ Presente" : a.status === "absent" ? "❌ Ausente" : "⏰ Tarde"}</span> : <span style={{ color: "var(--txt3)", fontSize: 12 }}>Sin registrar</span>}</td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        {[["present", "✅"], ["absent", "❌"], ["late", "⏰"]].map(([st, ic]) => (
                          <button key={st} className={`att-btn ${a?.status === st ? st : ""}`} onClick={() => setAtt(s.id, st)}>{ic}</button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  REPORTS
// ═══════════════════════════════════════════════════════════════
function ReportsPage({ data, search }) {
  const [tab, setTab] = useState("general");
  const allSc = data.scores.filter(s => s.score != null);
  const avg = allSc.length ? Math.round(allSc.reduce((a, b) => a + b.score, 0) / allSc.length) : 0;

  const studentSearch = search || "";
  const filteredStudents = data.students.filter(s => !studentSearch || s.name.toLowerCase().includes(studentSearch.toLowerCase()));

  const studentStats = filteredStudents.map(s => {
    const gr = data.grades.find(g => g.id === s.gradeId);
    const courses = data.courses.filter(c => c.gradeId === s.gradeId);
    const totalPts = courses.reduce((sum, c) => {
      const asgns = data.assignments.filter(a => a.courseId === c.id);
      return sum + totalScore(s.id, asgns, data.scores);
    }, 0);
    const maxPts = courses.reduce((sum, c) => sum + maxPossible(data.assignments.filter(a => a.courseId === c.id)), 0);
    const incs = data.incidents.filter(i => i.studentId === s.id).length;
    return { ...s, gr, totalPts, maxPts, incs };
  }).sort((a, b) => b.totalPts - a.totalPts);

  return (
    <div>
      <div className="tabs">
        {[["general", "📊 General"], ["students", "👤 Por Alumno"], ["courses", "📚 Por Curso"]].map(([id, lbl]) => (
          <button key={id} className={`tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>{lbl}</button>
        ))}
      </div>

      {tab === "general" && (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="stat-card"><div className="stat-icon" style={{ background: "var(--accl)", color: "var(--accent)" }}>📊</div><div className="stat-val">{avg}</div><div className="stat-lbl">Promedio General</div></div>
            <div className="stat-card"><div className="stat-icon" style={{ background: "rgba(22,163,74,0.12)", color: "var(--green)" }}>✅</div><div className="stat-val">{data.scores.filter(s => s.submitted).length}</div><div className="stat-lbl">Notas Registradas</div></div>
            <div className="stat-card"><div className="stat-icon" style={{ background: "rgba(220,38,38,0.12)", color: "var(--red)" }}>⚠️</div><div className="stat-val">{data.incidents.length}</div><div className="stat-lbl">Total Reportes</div></div>
          </div>
          <div className="card">
            <div className="card-hd"><span style={{ fontSize: 17 }}>🎯</span><div className="card-title">Resumen por Grado</div></div>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Grado</th><th>Alumnos</th><th>Cursos</th><th>Reportes</th></tr></thead>
                <tbody>
                  {data.grades.map(g => {
                    const studs = data.students.filter(s => s.gradeId === g.id && s.status === "active").length;
                    const crs = data.courses.filter(c => c.gradeId === g.id).length;
                    const incs = data.incidents.filter(i => data.students.find(s => s.id === i.studentId)?.gradeId === g.id).length;
                    return (
                      <tr key={g.id}>
                        <td style={{ fontWeight: 700 }}>{g.name} "{g.section}"</td>
                        <td>{studs}</td><td>{crs}</td>
                        <td><span style={{ color: incs > 0 ? "var(--red)" : "var(--green)", fontWeight: 700 }}>{incs}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "students" && (
        <div className="card">
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>#</th><th>Alumno</th><th>Grado</th><th>Puntos Acumulados</th><th>Reportes</th></tr></thead>
              <tbody>
                {studentStats.map((s, i) => (
                  <tr key={s.id}>
                    <td><span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 16, color: i < 3 ? ["#f59e0b", "#6b7280", "#b45309"][i] : "var(--txt3)" }}>{i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${i + 1}`}</span></td>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 9 }}><Av init={s.avatar} /><span style={{ fontWeight: 700 }}>{s.name}</span></div></td>
                    <td>{s.gr?.name} "{s.gr?.section}"</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 17, color: scoreColor(s.totalPts, s.maxPts) }}>{s.totalPts}</span>
                        <span style={{ fontSize: 11, color: "var(--txt3)" }}>/ {s.maxPts} pts</span>
                        <div className="prog" style={{ width: 60 }}><div className="prog-bar" style={{ width: `${s.maxPts > 0 ? (s.totalPts / s.maxPts * 100) : 0}%`, background: scoreColor(s.totalPts, s.maxPts) }} /></div>
                      </div>
                    </td>
                    <td>{s.incs > 0 ? <span className="badge badge-high">⚠️ {s.incs}</span> : <span style={{ color: "var(--green)", fontSize: 13 }}>✅ 0</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "courses" && (
        <div className="card">
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Curso</th><th>Grado</th><th>Docente</th><th>Tareas</th><th>Notas Reg.</th><th>Prom. Pts</th></tr></thead>
              <tbody>
                {data.courses.map(c => {
                  const aIds = data.assignments.filter(a => a.courseId === c.id).map(a => a.id);
                  const scs = data.scores.filter(s => aIds.includes(s.assignmentId) && s.score != null).map(s => s.score);
                  const ca = scs.length ? Math.round(scs.reduce((a, b) => a + b, 0) / scs.length * 10) / 10 : null;
                  const gr = data.grades.find(g => g.id === c.gradeId);
                  const t = data.users.find(u => u.id === c.teacherId);
                  return (
                    <tr key={c.id}>
                      <td><div style={{ display: "flex", alignItems: "center", gap: 7 }}><div style={{ width: 9, height: 9, borderRadius: "50%", background: c.color }} /><span style={{ fontWeight: 700 }}>{c.name}</span></div></td>
                      <td>{gr?.name} "{gr?.section}"</td>
                      <td><div style={{ display: "flex", alignItems: "center", gap: 6 }}><Av init={t?.avatar || "?"} size="av-sm" /><span>{t?.name || "–"}</span></div></td>
                      <td>{aIds.length}</td><td>{scs.length}</td>
                      <td><span style={{ fontWeight: 800, color: "var(--accent)" }}>{ca ?? "–"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  INCIDENTS / REPORTES
// ═══════════════════════════════════════════════════════════════
function IncidentsPage({ data, setData, user, search }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ studentId: "", type: "conduct", severity: "medium", description: "", justification: "", date: new Date().toISOString().split("T")[0] });

  const filtered = data.incidents.filter(i => {
    const s = data.students.find(st => st.id === i.studentId);
    return !search || (s?.name || "").toLowerCase().includes(search.toLowerCase());
  });

  const save = () => {
    if (!form.studentId || !form.description) return;
    const ni = { ...form, id: mkId(), authorId: user.id, studentId: parseInt(form.studentId) };
    setData(d => ({
      ...d, incidents: [...d.incidents, ni],
      notifications: [...d.notifications, { id: mkId(), userId: null, title: "Nuevo reporte de conducta", body: `Reporte para ${data.students.find(s => s.id === ni.studentId)?.name}`, ts: Date.now(), read: false, type: "incident" }]
    }));
    setModal(false); setForm({ studentId: "", type: "conduct", severity: "medium", description: "", justification: "", date: new Date().toISOString().split("T")[0] });
  };

  const typeMap = { conduct: "Conducta", tardiness: "Tardanza", absence: "Inasistencia", academic: "Académico", other: "Otro" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Nuevo Reporte</button>
      </div>
      {filtered.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "var(--txt3)" }}>Sin reportes registrados.</div>}
      {filtered.map(inc => {
        const student = data.students.find(s => s.id === inc.studentId);
        const author = data.users.find(u => u.id === inc.authorId);
        const gr = data.grades.find(g => g.id === student?.gradeId);
        return (
          <div className="incident-card" key={inc.id}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
              <Av init={student?.avatar || "?"} size="av-md" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{student?.name}</div>
                <div style={{ fontSize: 12, color: "var(--txt3)" }}>{gr?.name} "{gr?.section}"</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span className={`badge badge-${inc.severity}`}>{severityLabels[inc.severity]}</span>
                <span style={{ fontSize: 11, color: "var(--txt3)", fontWeight: 600 }}>{inc.date}</span>
              </div>
            </div>
            <div style={{ background: "var(--bg3)", borderRadius: 9, padding: "10px 14px", marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--txt3)", marginBottom: 3 }}>TIPO: {typeMap[inc.type] || inc.type}</div>
              <div style={{ fontSize: 13, color: "var(--txt)" }}>{inc.description}</div>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--txt2)" }}>📋 <strong>Justificación:</strong> {inc.justification || "–"}</div>
            <div style={{ fontSize: 11, color: "var(--txt3)", marginTop: 6 }}>Reportado por: {author?.name || "Sistema"}</div>
          </div>
        );
      })}

      {modal && (
        <div className="overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Nuevo Reporte de Conducta</div>
            <div className="fg"><label className="fl">Alumno</label>
              <select className="fc" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}>
                <option value="">Seleccionar alumno</option>
                {data.students.filter(s => s.status === "active").map(s => {
                  const gr = data.grades.find(g => g.id === s.gradeId);
                  return <option key={s.id} value={s.id}>{s.name} — {gr?.name}</option>;
                })}
              </select></div>
            <div className="fr">
              <div className="fg"><label className="fl">Tipo</label>
                <select className="fc" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {Object.entries(typeMap).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select></div>
              <div className="fg"><label className="fl">Gravedad</label>
                <select className="fc" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                  <option value="low">Leve</option><option value="medium">Moderado</option><option value="high">Grave</option>
                </select></div>
            </div>
            <div className="fg"><label className="fl">Fecha</label><input className="fc" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
            <div className="fg"><label className="fl">Descripción del hecho</label><textarea className="fc" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe detalladamente el incidente..." /></div>
            <div className="fg"><label className="fl">Justificación / Medida tomada</label><textarea className="fc" rows={2} value={form.justification} onChange={e => setForm({ ...form, justification: e.target.value })} placeholder="Qué acción se tomó..." /></div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-danger" style={{ background: "var(--red)", color: "#fff" }} onClick={save}>Registrar Reporte</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  BULLETIN (Boletín)
// ═══════════════════════════════════════════════════════════════
function BulletinPage({ data, search }) {
  const [selGrade, setSelGrade] = useState("");
  const [selStudent, setSelStudent] = useState(null);
  const [period, setPeriod] = useState("I Bimestre 2024");
  const printRef = useRef(null);

  const students = useMemo(() => data.students.filter(s => {
    const g = !selGrade || s.gradeId === parseInt(selGrade);
    const q = !search || s.name.toLowerCase().includes(search.toLowerCase());
    return g && q && s.status === "active";
  }), [data.students, selGrade, search]);

  const renderBulletin = (studentId) => {
    const student = data.students.find(s => s.id === studentId);
    const gr = data.grades.find(g => g.id === student?.gradeId);
    const courses = data.courses.filter(c => c.gradeId === student?.gradeId);

    return (
      <div ref={printRef} className="bulletin-sheet" id="bulletin-print">
        <div className="bulletin-header">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 10 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#4f7ef7,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, color: "#fff" }}>A</div>
            <div>
              <div className="bulletin-title">AcademiQ — Boletín de Calificaciones</div>
              <div className="bulletin-sub">Período: {period}</div>
            </div>
          </div>
        </div>
        <div className="bulletin-student">
          {[["Nombre completo", student?.name], ["Código", student?.code], ["Grado", `${gr?.name} — Sección "${gr?.section}"`], ["Nivel", gr?.level]].map(([l, v]) => (
            <div className="bulletin-field" key={l}><span style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{l}</span><strong>{v}</strong></div>
          ))}
        </div>
        <div className="bulletin-table">
          <table>
            <thead><tr><th>Curso</th><th>Docente</th>{data.assignments.filter(a => courses.map(c => c.id).includes(a.courseId)).slice(0, 5).map(a => <th key={a.id} style={{ textAlign: "center", minWidth: 60 }}>{a.name.slice(0, 10)}<br /><span style={{ fontSize: 9, opacity: 0.8 }}>/{a.maxScore}</span></th>)}<th style={{ textAlign: "center" }}>Total</th><th style={{ textAlign: "center" }}>Máximo</th></tr></thead>
            <tbody>
              {courses.map(c => {
                const teacher = data.users.find(u => u.id === c.teacherId);
                const assigns = data.assignments.filter(a => a.courseId === c.id);
                const total = totalScore(studentId, assigns, data.scores);
                const maxP = maxPossible(assigns);
                const allAssigns = data.assignments.filter(a => courses.map(cc => cc.id).includes(a.courseId)).slice(0, 5);
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700 }}>{c.name}</td>
                    <td style={{ fontSize: 12, color: "#64748b" }}>{teacher?.name || "–"}</td>
                    {allAssigns.map(a => {
                      if (!assigns.find(x => x.id === a.id)) return <td key={a.id} style={{ textAlign: "center", color: "#94a3b8" }}>–</td>;
                      const sc = data.scores.find(s => s.studentId === studentId && s.assignmentId === a.id);
                      return <td key={a.id} style={{ textAlign: "center", fontWeight: 700, color: scoreColor(sc?.score, a.maxScore) }}>{sc?.score ?? "–"}</td>;
                    })}
                    <td style={{ textAlign: "center", fontWeight: 900, fontSize: 16, color: scoreColor(total, maxP) }}>{total}</td>
                    <td style={{ textAlign: "center", color: "#64748b", fontSize: 13 }}>{maxP}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="bulletin-footer">
          <div className="sig-line">_______________________________<br />Firma del Director</div>
          <div className="sig-line">_______________________________<br />Firma del Padre/Tutor</div>
        </div>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "#94a3b8" }}>
          Generado con AcademiQ — Sistema de Gestión Escolar · {new Date().toLocaleDateString("es")}
        </div>
      </div>
    );
  };

  const doPrint = () => window.print();

  return (
    <div>
      <div style={{ background: "var(--surf)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: 20, marginBottom: 20, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }} className="no-print">
        <div style={{ flex: 1, minWidth: 200 }}>
          <label className="fl">Seleccionar Grado</label>
          <select className="fc" value={selGrade} onChange={e => { setSelGrade(e.target.value); setSelStudent(null); }}>
            <option value="">Todos los grados</option>
            {data.grades.map(g => <option key={g.id} value={g.id}>{g.name} "{g.section}"</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label className="fl">Período</label>
          <select className="fc" value={period} onChange={e => setPeriod(e.target.value)}>
            {["I Bimestre 2024", "II Bimestre 2024", "III Bimestre 2024", "IV Bimestre 2024", "Año Completo 2024"].map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label className="fl">Alumno</label>
          <select className="fc" value={selStudent || ""} onChange={e => setSelStudent(e.target.value ? parseInt(e.target.value) : null)}>
            <option value="">Seleccionar alumno</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        {selStudent && <button className="btn btn-primary" onClick={doPrint} style={{ height: 40 }}>🖨️ Imprimir Boletín</button>}
      </div>

      {!selStudent && (
        <div className="card">
          <div className="card-body">
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--txt3)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--txt)", marginBottom: 6 }}>Selecciona un alumno para generar el boletín</div>
              <div style={{ fontSize: 13 }}>Elige el grado y alumno en los filtros de arriba</div>
            </div>
          </div>
        </div>
      )}

      {selStudent && renderBulletin(selStudent)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ADMIN SETUP
// ═══════════════════════════════════════════════════════════════
function AdminSetup({ data, setData, search }) {
  const [tab, setTab] = useState("teachers");
  const [gModal, setGModal] = useState(false);
  const [cModal, setCModal] = useState(false);
  const [tModal, setTModal] = useState(false);
  const [editT, setEditT] = useState(null);
  const [gForm, setGForm] = useState({ name: "", section: "A", level: "Primaria" });
  const [cForm, setCForm] = useState({ name: "", gradeId: "", teacherId: "", color: "#4f7ef7" });
  const [tForm, setTForm] = useState({ name: "", email: "", password: "", subject: "" });
  const [tCreds, setTCreds] = useState(null);

  const saveGrade = () => {
    if (!gForm.name) return;
    setData(d => ({ ...d, grades: [...d.grades, { ...gForm, id: mkId() }] }));
    setGModal(false); setGForm({ name: "", section: "A", level: "Primaria" });
  };
  const saveCourse = () => {
    if (!cForm.name || !cForm.gradeId) return;
    setData(d => ({ ...d, courses: [...d.courses, { ...cForm, id: mkId(), gradeId: parseInt(cForm.gradeId), teacherId: parseInt(cForm.teacherId) }] }));
    setCModal(false);
  };
  const saveTeacher = () => {
    if (!tForm.name || !tForm.email || !tForm.password) return;
    const nt = { ...tForm, id: mkId(), role: "teacher", avatar: initials(tForm.name) };
    if (editT) {
      setData(d => ({ ...d, users: d.users.map(u => u.id === editT.id ? { ...u, ...tForm } : u) }));
      setTModal(false); setEditT(null);
    } else {
      setData(d => ({ ...d, users: [...d.users, nt] }));
      setTCreds({ ...nt });
    }
  };

  const teachers = data.users.filter(u => u.role === "teacher").filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="tabs">
        {[["teachers", "👨‍🏫 Docentes"], ["grades", "🏫 Grados"], ["courses", "📚 Cursos"]].map(([id, lbl]) => (
          <button key={id} className={`tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>{lbl}</button>
        ))}
      </div>

      {tab === "teachers" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button className="btn btn-primary" onClick={() => { setEditT(null); setTForm({ name: "", email: "", password: "", subject: "" }); setTCreds(null); setTModal(true); }}>+ Nuevo Docente</button>
          </div>
          <div className="card">
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Docente</th><th>Correo</th><th>Contraseña</th><th>Especialidad</th><th>Cursos</th><th>Acciones</th></tr></thead>
                <tbody>
                  {teachers.map(t => {
                    const tCourses = data.courses.filter(c => c.teacherId === t.id);
                    return (
                      <tr key={t.id}>
                        <td><div style={{ display: "flex", alignItems: "center", gap: 9 }}><Av init={t.avatar} /><span style={{ fontWeight: 700 }}>{t.name}</span></div></td>
                        <td style={{ fontSize: 12, color: "var(--txt2)" }}>{t.email}</td>
                        <td><span style={{ fontFamily: "monospace", background: "var(--accl)", color: "var(--accent)", padding: "2px 8px", borderRadius: 5, fontSize: 12 }}>{t.password}</span></td>
                        <td>{t.subject || "–"}</td>
                        <td><div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{tCourses.map(c => <span key={c.id} style={{ padding: "2px 6px", borderRadius: 5, background: `${c.color}22`, color: c.color, fontSize: 11, fontWeight: 700 }}>{c.name}</span>)}</div></td>
                        <td><button className="btn btn-xs btn-ghost" onClick={() => { setEditT(t); setTForm({ name: t.name, email: t.email, password: t.password, subject: t.subject || "" }); setTCreds(null); setTModal(true); }}>✏️ Editar</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "grades" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button className="btn btn-primary" onClick={() => setGModal(true)}>+ Nuevo Grado</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {data.grades.map(g => {
              const cnt = data.students.filter(s => s.gradeId === g.id && s.status === "active").length;
              const crs = data.courses.filter(c => c.gradeId === g.id).length;
              return (
                <div className="card" key={g.id}>
                  <div className="card-body">
                    <div style={{ fontSize: 30, marginBottom: 8 }}>🏫</div>
                    <h3 style={{ fontSize: 15, marginBottom: 3 }}>{g.name}</h3>
                    <div style={{ fontSize: 12, color: "var(--txt3)", marginBottom: 10 }}>Sección "{g.section}" · {g.level}</div>
                    <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--txt2)" }}>
                      <span>👥 {cnt} alumnos</span><span>📚 {crs} cursos</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "courses" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button className="btn btn-primary" onClick={() => setCModal(true)}>+ Nuevo Curso</button>
          </div>
          <div className="card">
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Curso</th><th>Grado</th><th>Docente</th></tr></thead>
                <tbody>
                  {data.courses.map(c => {
                    const gr = data.grades.find(g => g.id === c.gradeId);
                    const t = data.users.find(u => u.id === c.teacherId);
                    return (
                      <tr key={c.id}>
                        <td><div style={{ display: "flex", alignItems: "center", gap: 7 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: c.color }} /><span style={{ fontWeight: 700 }}>{c.name}</span></div></td>
                        <td>{gr?.name} "{gr?.section}"</td>
                        <td>{t ? <div style={{ display: "flex", alignItems: "center", gap: 7 }}><Av init={t.avatar} size="av-sm" /><span>{t.name}</span></div> : "–"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* MODALS */}
      {gModal && (
        <div className="overlay" onClick={() => setGModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Nuevo Grado / Sección</div>
            <div className="fg"><label className="fl">Nombre del grado</label><input className="fc" value={gForm.name} onChange={e => setGForm({ ...gForm, name: e.target.value })} placeholder="Ej: 4to Primaria" /></div>
            <div className="fr">
              <div className="fg"><label className="fl">Sección</label><select className="fc" value={gForm.section} onChange={e => setGForm({ ...gForm, section: e.target.value })}>{["A", "B", "C", "D"].map(s => <option key={s}>{s}</option>)}</select></div>
              <div className="fg"><label className="fl">Nivel</label><select className="fc" value={gForm.level} onChange={e => setGForm({ ...gForm, level: e.target.value })}>{["Preprimaria", "Primaria", "Básico", "Diversificado"].map(l => <option key={l}>{l}</option>)}</select></div>
            </div>
            <div className="modal-foot"><button className="btn btn-ghost" onClick={() => setGModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={saveGrade}>Crear Grado</button></div>
          </div>
        </div>
      )}
      {cModal && (
        <div className="overlay" onClick={() => setCModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Nuevo Curso</div>
            <div className="fg"><label className="fl">Nombre del curso</label><input className="fc" value={cForm.name} onChange={e => setCForm({ ...cForm, name: e.target.value })} placeholder="Ej: Matemática" /></div>
            <div className="fr">
              <div className="fg"><label className="fl">Grado</label><select className="fc" value={cForm.gradeId} onChange={e => setCForm({ ...cForm, gradeId: e.target.value })}><option value="">Seleccionar</option>{data.grades.map(g => <option key={g.id} value={g.id}>{g.name} "{g.section}"</option>)}</select></div>
              <div className="fg"><label className="fl">Docente</label><select className="fc" value={cForm.teacherId} onChange={e => setCForm({ ...cForm, teacherId: e.target.value })}><option value="">Seleccionar</option>{data.users.filter(u => u.role === "teacher").map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            </div>
            <div className="fg"><label className="fl">Color</label><input className="fc" type="color" value={cForm.color} onChange={e => setCForm({ ...cForm, color: e.target.value })} style={{ height: 44, padding: 4 }} /></div>
            <div className="modal-foot"><button className="btn btn-ghost" onClick={() => setCModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={saveCourse}>Crear Curso</button></div>
          </div>
        </div>
      )}
      {tModal && (
        <div className="overlay" onClick={() => { if (!tCreds) setTModal(false); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {tCreds ? (
              <>
                <div className="modal-title">✅ Docente registrado</div>
                <div className="success-box">Credenciales asignadas por el director.</div>
                <div className="cred-box">
                  {[["Nombre", tCreds.name], ["Correo", tCreds.email], ["Contraseña", tCreds.password], ["Especialidad", tCreds.subject || "–"]].map(([l, v]) => (
                    <div className="cred-row" key={l}><span className="cred-lbl">{l}</span><span className="cred-val">{v}</span></div>
                  ))}
                </div>
                <div className="modal-foot"><button className="btn btn-primary" onClick={() => { setTModal(false); setTCreds(null); }}>Cerrar</button></div>
              </>
            ) : (
              <>
                <div className="modal-title">{editT ? "Editar Credenciales Docente" : "Nuevo Docente"}</div>
                <div className="fr">
                  <div className="fg"><label className="fl">Nombre completo</label><input className="fc" value={tForm.name} onChange={e => setTForm({ ...tForm, name: e.target.value })} /></div>
                  <div className="fg"><label className="fl">Especialidad</label><input className="fc" value={tForm.subject} onChange={e => setTForm({ ...tForm, subject: e.target.value })} placeholder="Ej: Matemática" /></div>
                </div>
                <div className="fg"><label className="fl">Correo electrónico</label><input className="fc" type="email" value={tForm.email} onChange={e => setTForm({ ...tForm, email: e.target.value })} /></div>
                <div className="fg"><label className="fl">Contraseña {editT ? "(nueva)" : "(asignada por director)"}</label><input className="fc" value={tForm.password} onChange={e => setTForm({ ...tForm, password: e.target.value })} placeholder="Contraseña segura" /></div>
                <div className="modal-foot">
                  <button className="btn btn-ghost" onClick={() => { setTModal(false); setEditT(null); }}>Cancelar</button>
                  <button className="btn btn-primary" onClick={saveTeacher}>{editT ? "Actualizar" : "Registrar"}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ANNOUNCEMENTS
// ═══════════════════════════════════════════════════════════════
function AnnouncementsPage({ data, setData, user, search }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", priority: "medium", target: "all", gradeId: "", courseId: "" });

  const save = () => {
    if (!form.title || !form.content) return;
    const na = { ...form, id: mkId(), date: new Date().toISOString().split("T")[0], authorId: user.id, gradeId: form.gradeId ? parseInt(form.gradeId) : null, courseId: form.courseId ? parseInt(form.courseId) : null };
    setData(d => ({ ...d, announcements: [na, ...d.announcements], notifications: [...d.notifications, { id: mkId(), userId: null, title: "Nuevo aviso publicado", body: na.title, ts: Date.now(), read: false, type: "announcement" }] }));
    setModal(false); setForm({ title: "", content: "", priority: "medium", target: "all", gradeId: "", courseId: "" });
  };

  const canPost = user.role === "admin" || user.role === "teacher";
  const visible = data.announcements.filter(a => {
    const q = search.toLowerCase();
    if (q && !a.title.toLowerCase().includes(q) && !a.content.toLowerCase().includes(q)) return false;
    if (user.role === "admin") return true;
    if (user.role === "teacher") return a.target === "all" || a.authorId === user.id || (a.gradeId && data.courses.some(c => c.teacherId === user.id && c.gradeId === a.gradeId));
    if (a.target === "all") return true;
    if (a.gradeId === user.gradeId) return true;
    return false;
  });

  return (
    <div>
      {canPost && <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}><button className="btn btn-primary" onClick={() => setModal(true)}>+ Publicar Aviso</button></div>}
      {visible.map(a => {
        const author = [...data.users, ...data.students].find(u => u.id === a.authorId);
        const gr = a.gradeId ? data.grades.find(g => g.id === a.gradeId) : null;
        const co = a.courseId ? data.courses.find(c => c.id === a.courseId) : null;
        return (
          <div key={a.id} style={{ background: "var(--surf)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: 18, marginBottom: 12, transition: "var(--trans)" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
              <span className={`badge badge-${a.priority}`}>{a.priority === "high" ? "🔴 Urgente" : a.priority === "medium" ? "🟡 Normal" : "🟢 Info"}</span>
              <h3 style={{ fontSize: 15, flex: 1 }}>{a.title}</h3>
              <span style={{ fontSize: 11, color: "var(--txt3)", fontWeight: 600 }}>{a.date}</span>
            </div>
            <p style={{ fontSize: 13.5, color: "var(--txt2)", lineHeight: 1.65, marginBottom: 10 }}>{a.content}</p>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Av init={author?.avatar || "?"} size="av-xs" />
              <span style={{ fontSize: 12, color: "var(--txt3)", fontWeight: 600 }}>{author?.name || "Sistema"}</span>
              {a.target !== "all" && <span style={{ fontSize: 11, color: "var(--accent)", marginLeft: "auto", fontWeight: 700 }}>📍 {gr ? `Grado: ${gr.name}` : co ? `Curso: ${co.name}` : "Específico"}</span>}
              {a.target === "all" && <span style={{ fontSize: 11, color: "var(--txt3)", marginLeft: "auto" }}>🌐 Todo el colegio</span>}
            </div>
          </div>
        );
      })}
      {modal && (
        <div className="overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Publicar Aviso</div>
            <div className="fg"><label className="fl">Título</label><input className="fc" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div className="fg"><label className="fl">Contenido del aviso</label><textarea className="fc" rows={4} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} /></div>
            <div className="fr">
              <div className="fg"><label className="fl">Prioridad</label><select className="fc" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option value="high">🔴 Alta</option><option value="medium">🟡 Media</option><option value="low">🟢 Baja</option></select></div>
              <div className="fg"><label className="fl">Dirigido a</label><select className="fc" value={form.target} onChange={e => setForm({ ...form, target: e.target.value, gradeId: "", courseId: "" })}><option value="all">Todo el colegio</option><option value="grade">Grado específico</option><option value="course">Curso específico</option></select></div>
            </div>
            {form.target === "grade" && <div className="fg"><label className="fl">Grado</label><select className="fc" value={form.gradeId} onChange={e => setForm({ ...form, gradeId: e.target.value })}><option value="">Seleccionar</option>{data.grades.map(g => <option key={g.id} value={g.id}>{g.name} "{g.section}"</option>)}</select></div>}
            {form.target === "course" && <div className="fg"><label className="fl">Curso</label><select className="fc" value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })}><option value="">Seleccionar</option>{data.courses.map(c => <option key={c.id} value={c.id}>{c.name} — {data.grades.find(g => g.id === c.gradeId)?.name}</option>)}</select></div>}
            <div className="modal-foot"><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={save}>Publicar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  CHAT
// ═══════════════════════════════════════════════════════════════
function ChatPage({ data, setData, user }) {
  const [msg, setMsg] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [data.chatMessages]);

  const send = () => {
    if (!msg.trim()) return;
    const nm = { id: mkId(), senderId: user.id, senderName: user.name, senderAvatar: user.avatar, text: msg.trim(), ts: Date.now() };
    setData(d => ({ ...d, chatMessages: [...d.chatMessages, nm] }));
    setMsg("");
  };

  let lastDate = "";
  const members = data.users.filter(u => u.role !== "student");

  return (
    <div style={{ height: "calc(100vh - 130px)", display: "flex", flexDirection: "column" }}>
      <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div className="card-hd">
          <span style={{ fontSize: 18 }}>💬</span>
          <div><div className="card-title">Chat — Cuerpo Docente & Dirección</div><div style={{ fontSize: 11, color: "var(--txt3)", fontWeight: 600 }}>{members.length} miembros</div></div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            {members.map(m => <div key={m.id} title={m.name}><Av init={m.avatar} size="av-xs" /></div>)}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {data.chatMessages.map(m => {
            const isMe = m.senderId === user.id;
            const dateStr = fmtDate(m.ts);
            const showDate = dateStr !== lastDate;
            lastDate = dateStr;
            return (
              <div key={m.id}>
                {showDate && <div style={{ textAlign: "center", fontSize: 10.5, color: "var(--txt3)", padding: "6px 0", fontWeight: 700 }}>{dateStr}</div>}
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexDirection: isMe ? "row-reverse" : "row", maxWidth: "78%", alignSelf: isMe ? "flex-end" : "flex-start" }}>
                  {!isMe && <Av init={m.senderAvatar} size="av-sm" />}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                    {!isMe && <div style={{ fontSize: 10.5, fontWeight: 800, color: "var(--txt2)", marginBottom: 2 }}>{m.senderName}</div>}
                    <div style={{ padding: "9px 14px", borderRadius: isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px", fontSize: 13.5, lineHeight: 1.5, fontWeight: 500, background: isMe ? "var(--accent)" : "var(--bg3)", color: isMe ? "#fff" : "var(--txt)" }}>{m.text}</div>
                    <div style={{ fontSize: 10, color: "var(--txt3)", marginTop: 2, fontWeight: 600 }}>{fmtTs(m.ts)}</div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, background: "var(--bg3)" }}>
          <input className="chat-inp" placeholder="Escribe un mensaje... (Enter para enviar)" value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()} />
          <button className="btn btn-primary" style={{ padding: "9px 18px" }} onClick={send}>Enviar →</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MY COURSES (Teacher)
// ═══════════════════════════════════════════════════════════════
function MyCourses({ data, user, search }) {
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

// ═══════════════════════════════════════════════════════════════
//  STUDENT PORTAL
// ═══════════════════════════════════════════════════════════════
function StudentPortal({ data, user }) {
  const [tab, setTab] = useState("grades");
  const gr = data.grades.find(g => g.id === user.gradeId);
  const myCourses = data.courses.filter(c => c.gradeId === user.gradeId);
  const myIncidents = data.incidents.filter(i => i.studentId === user.id);
  const myAnn = data.announcements.filter(a => a.target === "all" || a.gradeId === user.gradeId || myCourses.some(c => c.id === a.courseId));

  return (
    <div>
      <div className="portal-hd">
        <Av init={user.avatar} size="av-xl" />
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>¡Hola, {user.name.split(" ")[0]}! 👋</h2>
          <div style={{ fontSize: 13, color: "var(--txt3)", marginBottom: 8 }}>Código: {user.code} · {gr?.name} "{gr?.section}"</div>
          <span className="badge badge-student">Alumno Activo</span>
        </div>
        {myIncidents.length > 0 && (
          <div style={{ textAlign: "center", background: "var(--redl)", borderRadius: 12, padding: "12px 18px", border: "1.5px solid rgba(220,38,38,0.2)" }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 28, color: "var(--red)" }}>{myIncidents.length}</div>
            <div style={{ fontSize: 12, color: "var(--red)", fontWeight: 700 }}>Reportes</div>
          </div>
        )}
      </div>

      <div className="tabs">
        {[["grades", "📊 Mis Notas"], ["assignments", "📋 Tareas"], ["incidents", `⚠️ Reportes (${myIncidents.length})`], ["announcements", "📢 Avisos"]].map(([id, lbl]) => (
          <button key={id} className={`tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>{lbl}</button>
        ))}
      </div>

      {tab === "grades" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {myCourses.map(course => {
            const teacher = data.users.find(u => u.id === course.teacherId);
            const assigns = data.assignments.filter(a => a.courseId === course.id);
            const total = totalScore(user.id, assigns, data.scores);
            const maxP = maxPossible(assigns);
            return (
              <div className="card" key={course.id}>
                <div style={{ height: 4, background: course.color }} />
                <div className="card-hd">
                  <div><div className="card-title">{course.name}</div><div style={{ fontSize: 11, color: "var(--txt3)" }}>Prof. {teacher?.name}</div></div>
                  <div style={{ marginLeft: "auto", textAlign: "center" }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 22, color: scoreColor(total, maxP) }}>{total}</div>
                    <div style={{ fontSize: 10, color: "var(--txt3)" }}>/ {maxP} pts</div>
                  </div>
                </div>
                <div style={{ padding: "0 18px" }}>
                  {assigns.map(a => {
                    const sc = data.scores.find(s => s.studentId === user.id && s.assignmentId === a.id);
                    return (
                      <div className="mini-row" key={a.id}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: typeColors[a.type] }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                          {a.instructions && <div style={{ fontSize: 11, color: "var(--txt3)" }}>📌 {a.instructions.slice(0, 55)}...</div>}
                        </div>
                        <span style={{ fontSize: 11, color: "var(--txt3)" }}>/{a.maxScore}</span>
                        <span style={{ fontWeight: 800, fontSize: 15, color: scoreColor(sc?.score, a.maxScore), minWidth: 32, textAlign: "right" }}>
                          {sc?.score != null ? sc.score : <span style={{ color: "var(--txt3)", fontSize: 13 }}>–</span>}
                        </span>
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 0", gap: 6, fontSize: 12, color: "var(--txt3)" }}>
                    <span>Total acumulado:</span><span style={{ fontWeight: 800, color: scoreColor(total, maxP) }}>{total} / {maxP} pts</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "assignments" && (
        <div className="card">
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Tarea / Evaluación</th><th>Curso</th><th>Tipo</th><th>Pts máx.</th><th>Entrega</th><th>Instrucciones</th><th>Mi Nota</th></tr></thead>
              <tbody>
                {data.assignments.filter(a => myCourses.map(c => c.id).includes(a.courseId)).map(a => {
                  const co = myCourses.find(c => c.id === a.courseId);
                  const sc = data.scores.find(s => s.studentId === user.id && s.assignmentId === a.id);
                  return (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 700 }}>{a.name}</td>
                      <td><div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: co?.color }} />{co?.name}</div></td>
                      <td><span style={{ color: typeColors[a.type], fontWeight: 700, fontSize: 12 }}>{typeLabels[a.type]}</span></td>
                      <td><span style={{ fontWeight: 800, color: "var(--accent)" }}>{a.maxScore}</span></td>
                      <td style={{ fontSize: 12, color: "var(--txt3)" }}>{a.dueDate}</td>
                      <td style={{ fontSize: 12, color: "var(--txt2)", maxWidth: 200 }}>{a.instructions || <span style={{ color: "var(--txt3)" }}>–</span>}</td>
                      <td><span style={{ fontWeight: 800, color: scoreColor(sc?.score, a.maxScore) }}>{sc?.score != null ? sc.score : <span style={{ color: "var(--txt3)" }}>–</span>}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "incidents" && (
        <div>
          {myIncidents.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "var(--txt3)" }}>🎉 ¡Sin reportes! Excelente comportamiento.</div>}
          {myIncidents.map(inc => {
            const author = data.users.find(u => u.id === inc.authorId);
            const typeMap = { conduct: "Conducta", tardiness: "Tardanza", absence: "Inasistencia", academic: "Académico", other: "Otro" };
            return (
              <div className="incident-card" key={inc.id}>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <span className={`badge badge-${inc.severity}`}>{severityLabels[inc.severity]}</span>
                  <span style={{ fontWeight: 800, color: "var(--txt)" }}>{typeMap[inc.type] || inc.type}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--txt3)" }}>{inc.date}</span>
                </div>
                <div style={{ fontSize: 13.5, color: "var(--txt)", marginBottom: 8 }}>{inc.description}</div>
                <div style={{ fontSize: 12.5, color: "var(--txt2)" }}>📋 <strong>Medida tomada:</strong> {inc.justification || "–"}</div>
                <div style={{ fontSize: 11, color: "var(--txt3)", marginTop: 6 }}>Reportado por: {author?.name || "Sistema"}</div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "announcements" && (
        <div>
          {myAnn.map(a => {
            const author = [...data.users, ...data.students].find(u => u.id === a.authorId);
            return (
              <div key={a.id} style={{ background: "var(--surf)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: 18, marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 7 }}>
                  <span className={`badge badge-${a.priority}`}>{a.priority === "high" ? "🔴 Urgente" : a.priority === "medium" ? "🟡 Normal" : "🟢 Info"}</span>
                  <h3 style={{ fontSize: 15 }}>{a.title}</h3>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--txt3)" }}>{a.date}</span>
                </div>
                <p style={{ fontSize: 13.5, color: "var(--txt2)", lineHeight: 1.65 }}>{a.content}</p>
                <div style={{ fontSize: 11, color: "var(--txt3)", marginTop: 8, fontWeight: 600 }}>Publicado por: {author?.name || "Sistema"}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  APP SHELL
// ═══════════════════════════════════════════════════════════════
const NAV_CFG = {
  admin: [
    { section: "Principal", items: [{ id: "dashboard", icon: "⊞", label: "Dashboard" }, { id: "students", icon: "👥", label: "Alumnos" }, { id: "gradebook", icon: "📊", label: "Calificaciones" }, { id: "attendance", icon: "📅", label: "Asistencia" }] },
    { section: "Gestión", items: [{ id: "bulletin", icon: "📄", label: "Boletines" }, { id: "incidents", icon: "⚠️", label: "Reportes" }, { id: "reports", icon: "📈", label: "Estadísticas" }] },
    { section: "Admin", items: [{ id: "setup", icon: "⚙️", label: "Configuración" }, { id: "announcements", icon: "📢", label: "Avisos" }, { id: "chat", icon: "💬", label: "Chat Docentes", notif: true }] },
  ],
  teacher: [
    { section: "Mi Área", items: [{ id: "dashboard", icon: "⊞", label: "Dashboard" }, { id: "mycourses", icon: "📚", label: "Mis Cursos" }, { id: "gradebook", icon: "📊", label: "Calificaciones" }, { id: "quickgrade", icon: "⚡", label: "Nota Rápida" }] },
    { section: "Gestión", items: [{ id: "attendance", icon: "📅", label: "Asistencia" }, { id: "incidents", icon: "⚠️", label: "Reportes" }] },
    { section: "Comunicación", items: [{ id: "announcements", icon: "📢", label: "Avisos" }, { id: "chat", icon: "💬", label: "Chat General", notif: true }] },
  ],
  student: [
    { section: "Mi Portal", items: [{ id: "portal", icon: "🎒", label: "Mi Portal" }] },
  ],
};

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [token, setToken] = useState(localStorage.getItem("academiq_token") || "");
  const [data, setData] = useState(INIT_DATA);
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState("");
  const [showNotif, setShowNotif] = useState(false);

  const unread = data.notifications.filter(n => !n.read).length;


  // Load state from backend when token exists (refresh session)
  useEffect(() => {
    (async () => {
      if (!token || user) return;
      try {
        const state = await apiFetch("/api/state", { token });
        setData(state);
        if (state?.me) {
          setUser({ ...state.me, role: "student" });
          setPage("portal");
        }
      } catch {
        localStorage.removeItem("academiq_token");
        setToken("");
      }
    })();
  }, [token, user]);

  // Auto-save state (admin/teacher)
  const saveTimer = useRef(null);
  useEffect(() => {
    if (!token) return;
    if (!user) return;
    if (user.role === "student") return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await apiFetch("/api/state", { token, method: "PUT", body: data });
      } catch (e) {
        // Silencioso para no romper la UX
        console.warn("Save failed:", e.message);
      }
    }, 700);
  }, [data, token, user]);

  // Reset search on page change
  useEffect(() => { setSearch(""); }, [page]);

  if (!user) return (
    <>
      <style>{makeCSS(dark)}</style>
      <BgDecor />
      <Login data={data} onLogin={async (res) => {
        localStorage.setItem("academiq_token", res.token);
        setToken(res.token);
        setUser(res.user);
        // Cargar estado completo
        const state = await apiFetch("/api/state", { token: res.token });
        setData(state);
        setPage(res.user.role === "student" ? "portal" : "dashboard");
      }} dark={dark} setDark={setDark} />
    </>
  );

  const nav = NAV_CFG[user.role] || NAV_CFG.teacher;
  const allItems = nav.flatMap(g => g.items);
  const pageLabel = allItems.find(i => i.id === page)?.label || "";

  const renderPage = () => {
    const props = { data, setData, user, search, setPage };
    switch (page) {
      case "dashboard": return <Dashboard {...props} />;
      case "students": return <StudentsPage {...props} />;
      case "gradebook": return <GradeBook {...props} />;
      case "quickgrade": return <QuickGrade {...props} />;
      case "attendance": return <AttendancePage {...props} />;
      case "reports": return <ReportsPage {...props} />;
      case "bulletin": return <BulletinPage {...props} />;
      case "incidents": return <IncidentsPage {...props} />;
      case "setup": return <AdminSetup {...props} />;
      case "announcements": return <AnnouncementsPage {...props} />;
      case "chat": return <ChatPage {...props} />;
      case "mycourses": return <MyCourses {...props} />;
      case "portal": return <StudentPortal {...props} />;
      default: return <Dashboard {...props} />;
    }
  };

  return (
    <>
      <style>{makeCSS(dark)}</style>
      <BgDecor />
      <div className="app">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-mark">A</div>
            <div><div className="logo-text">AcademiQ</div><div className="logo-sub">Gestión Escolar</div></div>
          </div>
          <div style={{ flex: 1, padding: "6px 8px", overflowY: "auto" }}>
            {nav.map(group => (
              <div key={group.section}>
                <div className="nav-section">{group.section}</div>
                {group.items.map(item => (
                  <div key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)}>
                    <span className="nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                    {item.notif && page !== item.id && unread > 0 && <div className="nav-dot" />}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="sidebar-bottom">
            <div className="user-card" onClick={() => { localStorage.removeItem("academiq_token"); setToken(""); setUser(null); setPage("dashboard"); }}>
              <Av init={user.avatar} size="av-md" />
              <div style={{ flex: 1 }}>
                <div className="user-name">{user.name}</div>
                <div className="user-role">{user.role === "admin" ? "Director" : user.role === "teacher" ? "Docente" : "Alumno"} · Cerrar sesión</div>
              </div>
              <span style={{ fontSize: 13, color: "var(--txt3)" }}>↩</span>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="main">
          <div className="topbar">
            <div>
              <div className="topbar-title">{pageLabel}</div>
              <div className="topbar-sub">{new Date().toLocaleDateString("es", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
            </div>
            <div className="spacer" />
            <div className="search-bar">
              <span style={{ color: "var(--txt3)", fontSize: 14 }}>🔍</span>
              <input placeholder="Buscar en esta sección..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {/* Theme Toggle */}
            <div className="theme-toggle" onClick={() => setDark(!dark)} title="Cambiar tema">
              <div className={`toggle-track ${dark ? "on" : ""}`} style={{ background: dark ? "var(--accent)" : "var(--bg3)" }}>
                <div className="toggle-thumb" style={{ left: dark ? 14 : 2, transition: "left .2s" }} />
              </div>
              {dark ? "☀️" : "🌙"}
            </div>
            {/* Notifications */}
            <div style={{ position: "relative" }}>
              <button className="icon-btn" onClick={() => setShowNotif(!showNotif)}>
                🔔
                {unread > 0 && <span className="notif-badge">{unread}</span>}
              </button>
              {showNotif && <NotifPanel data={data} setData={setData} onClose={() => setShowNotif(false)} />}
            </div>
            {/* User badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Av init={user.avatar} size="av-sm" />
              <span className={`badge badge-${user.role}`}>{user.role === "admin" ? "Director" : user.role === "teacher" ? "Docente" : "Alumno"}</span>
            </div>
          </div>
          <div className="content" onClick={() => showNotif && setShowNotif(false)}>
            {renderPage()}
          </div>
        </main>
      </div>
    </>
  );
}
