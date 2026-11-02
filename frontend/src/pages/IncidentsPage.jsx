import { useState } from "react";
import { severityLabels, incidentTypes, todayISO } from "../lib/format";
import { isAdmin } from "../lib/roles";
import { mkId } from "../lib/credentials";
import Av from "../components/Avatar";

export default function IncidentsPage({ data, setData, user, search }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ studentId: "", type: "conduct", severity: "medium", description: "", justification: "", date: todayISO() });

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
    setModal(false); setForm({ studentId: "", type: "conduct", severity: "medium", description: "", justification: "", date: todayISO() });
  };

  const typeMap = incidentTypes;
  // Un docente solo puede reportar alumnos de los grados donde imparte clase.
  const myGradeIds = new Set(data.courses.filter(c => c.teacherId === user.id).map(c => c.gradeId));
  const reportable = data.students.filter(s => s.status === "active" && (isAdmin(user) || myGradeIds.has(s.gradeId)));

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
                {reportable.map(s => {
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
