import { fmtDate } from "../lib/format";

export default function NotifPanel({ data, setData, onClose }) {
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
