import { useState, useEffect, useRef } from "react";
import { fmtTs, fmtDate } from "../lib/format";
import { mkId } from "../lib/credentials";
import Av from "../components/Avatar";

export default function ChatPage({ data, setData, user }) {
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
