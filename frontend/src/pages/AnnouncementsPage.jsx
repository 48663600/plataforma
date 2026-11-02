import { todayISO } from "../lib/format";
import { isAdmin } from "../lib/roles";
import { useState } from "react";
import { mkId } from "../lib/credentials";
import Av from "../components/Avatar";

export default function AnnouncementsPage({ data, setData, user, search }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", priority: "medium", target: "all", gradeId: "", courseId: "" });

  const save = () => {
    if (!form.title || !form.content) return;
    const na = { ...form, id: mkId(), date: todayISO(), authorId: user.id, gradeId: form.gradeId ? parseInt(form.gradeId) : null, courseId: form.courseId ? parseInt(form.courseId) : null };
    setData(d => ({ ...d, announcements: [na, ...d.announcements], notifications: [...d.notifications, { id: mkId(), userId: null, title: "Nuevo aviso publicado", body: na.title, ts: Date.now(), read: false, type: "announcement" }] }));
    setModal(false); setForm({ title: "", content: "", priority: "medium", target: "all", gradeId: "", courseId: "" });
  };

  const canPost = !!user;
  const visible = data.announcements.filter(a => {
    const q = search.toLowerCase();
    if (q && !a.title.toLowerCase().includes(q) && !a.content.toLowerCase().includes(q)) return false;
    if (isAdmin(user)) return true;
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
