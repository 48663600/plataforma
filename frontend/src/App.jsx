import { useState, useEffect, useRef, useCallback } from "react";
import { makeCSS } from "./styles/theme.js";
import { NAV_CFG, homePage } from "./config/navigation.js";
import { roleLabel, roleBadge } from "./lib/roles.js";
import * as db from "./services/dataService.js";
import Av from "./components/Avatar.jsx";
import BgDecor from "./components/BgDecor.jsx";
import NotifPanel from "./components/NotifPanel.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import StudentsPage from "./pages/StudentsPage.jsx";
import GradeBook from "./pages/GradeBook.jsx";
import QuickGrade from "./pages/QuickGrade.jsx";
import AttendancePage from "./pages/AttendancePage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import BulletinPage from "./pages/BulletinPage.jsx";
import GeneralReports from "./pages/GeneralReports.jsx";
import IncidentsPage from "./pages/IncidentsPage.jsx";
import AdminSetup from "./pages/AdminSetup.jsx";
import AnnouncementsPage from "./pages/AnnouncementsPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import MyCourses from "./pages/MyCourses.jsx";
import StudentPortal from "./pages/StudentPortal.jsx";

const PAGES = {
  dashboard: Dashboard, students: StudentsPage, gradebook: GradeBook, quickgrade: QuickGrade,
  attendance: AttendancePage, reports: ReportsPage, bulletin: BulletinPage, genreports: GeneralReports,
  incidents: IncidentsPage, setup: AdminSetup, announcements: AnnouncementsPage, chat: ChatPage,
  mycourses: MyCourses, portal: StudentPortal,
};

const THEME_KEY = "academiq_theme";
const readTheme = () => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved === "dark";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches || false;
  } catch {
    return false;
  }
};

const SAVE_LABELS = {
  saving: ["⏳", "Guardando…"],
  saved: ["✅", "Guardado"],
  error: ["⚠️", "Error al guardar"],
};

export default function App() {
  const [token, setToken] = useState(db.session.get);
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [dark, setDark] = useState(readTheme);
  const [search, setSearch] = useState("");
  const [showNotif, setShowNotif] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [booting, setBooting] = useState(Boolean(token));
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveError, setSaveError] = useState("");
  const loadedRef = useRef(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch {
      /* preferencia solo en memoria */
    }
  }, [dark]);

  const logout = useCallback(() => {
    clearTimeout(saveTimer.current);
    db.session.clear();
    loadedRef.current = null;
    setToken("");
    setUser(null);
    setData(null);
    setPage("dashboard");
    setSaveStatus("idle");
  }, []);

  const openSession = useCallback(async (tk, { initialPage } = {}) => {
    const state = await db.loadState(tk);
    loadedRef.current = state;
    setData(state);
    setUser(state.me);
    setPage(initialPage || homePage(state.me.role));
  }, []);

  // Restaurar la sesión al recargar la página (para todos los roles).
  useEffect(() => {
    if (!booting) return;
    openSession(token)
      .catch(() => logout())
      .finally(() => setBooting(false));
  }, [booting, token, openSession, logout]);

  // Guardado automático (director y docentes). Se omite si los datos no cambiaron desde la carga.
  useEffect(() => {
    if (!token || !user || !data || user.role === "student") return;
    if (data === loadedRef.current) return;
    clearTimeout(saveTimer.current);
    setSaveStatus("saving");
    saveTimer.current = setTimeout(async () => {
      try {
        await db.saveState(token, data);
        setSaveStatus("saved");
        setSaveError("");
      } catch (e) {
        if (e.status === 401) return logout();
        setSaveStatus("error");
        setSaveError(e.message);
      }
    }, 700);
  }, [data, token, user, logout]);

  // Avisar antes de cerrar la pestaña si hay cambios sin guardar.
  useEffect(() => {
    const onUnload = (e) => {
      if (saveStatus === "saving" || saveStatus === "error") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [saveStatus]);

  useEffect(() => {
    setSearch("");
    setNavOpen(false);
  }, [page]);

  const css = <style>{makeCSS(dark)}</style>;

  if (booting) {
    return (
      <>
        {css}
        <BgDecor />
        <div className="login-screen"><div className="loading">Cargando…</div></div>
      </>
    );
  }

  if (!user || !data) {
    return (
      <>
        {css}
        <BgDecor />
        <Login
          dark={dark}
          setDark={setDark}
          onLogin={async (res) => {
            db.session.set(res.token);
            setToken(res.token);
            await openSession(res.token);
          }}
        />
      </>
    );
  }

  const nav = NAV_CFG[user.role] || NAV_CFG.teacher;
  const allItems = nav.flatMap((g) => g.items);
  const current = allItems.some((i) => i.id === page) ? page : allItems[0].id;
  const pageLabel = allItems.find((i) => i.id === current)?.label || "";
  const Page = PAGES[current] || Dashboard;
  const unread = (data.notifications || []).filter((n) => !n.read).length;
  const [saveIco, saveTxt] = SAVE_LABELS[saveStatus] || [];

  return (
    <>
      {css}
      <BgDecor />
      <div className="app">
        {navOpen && <div className="nav-backdrop" onClick={() => setNavOpen(false)} />}
        <aside className={`sidebar ${navOpen ? "open" : ""}`}>
          <div className="sidebar-logo">
            <div className="logo-mark">A</div>
            <div><div className="logo-text">AcademiQ</div><div className="logo-sub">Gestión Escolar</div></div>
          </div>
          <nav style={{ flex: 1, padding: "6px 8px", overflowY: "auto" }}>
            {nav.map((group) => (
              <div key={group.section}>
                <div className="nav-section">{group.section}</div>
                {group.items.map((item) => (
                  <button key={item.id} type="button" className={`nav-item ${current === item.id ? "active" : ""}`} onClick={() => setPage(item.id)}>
                    <span className="nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <button type="button" className="user-card" onClick={logout} title="Cerrar sesión">
              <Av init={user.avatar} size="av-md" />
              <div style={{ flex: 1, textAlign: "left" }}>
                <div className="user-name">{user.name}</div>
                <div className="user-role">{roleLabel(user.role)} · Cerrar sesión</div>
              </div>
              <span style={{ fontSize: 13, color: "var(--txt3)" }}>↩</span>
            </button>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <button type="button" className="icon-btn menu-btn" onClick={() => setNavOpen(true)} aria-label="Abrir menú">☰</button>
            <div style={{ minWidth: 0 }}>
              <div className="topbar-title">{pageLabel}</div>
              <div className="topbar-sub">{new Date().toLocaleDateString("es", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
            </div>
            <div className="spacer" />
            {saveIco && (
              <div className={`save-status ${saveStatus}`} title={saveError || saveTxt}>
                {saveIco} <span className="hide-sm">{saveTxt}</span>
              </div>
            )}
            {current !== "portal" && current !== "chat" && (
              <div className="search-bar">
                <span style={{ color: "var(--txt3)", fontSize: 14 }}>🔍</span>
                <input placeholder="Buscar en esta sección..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            )}
            <button type="button" className="theme-toggle" onClick={() => setDark(!dark)} title="Cambiar tema">
              <div className={`toggle-track ${dark ? "on" : ""}`}>
                <div className="toggle-thumb" style={{ left: dark ? 14 : 2, transition: "left .2s" }} />
              </div>
              {dark ? "☀️" : "🌙"}
            </button>
            <div style={{ position: "relative" }}>
              <button type="button" className="icon-btn" onClick={() => setShowNotif(!showNotif)} aria-label="Notificaciones">
                🔔
                {unread > 0 && <span className="notif-badge">{unread}</span>}
              </button>
              {showNotif && <NotifPanel data={data} setData={setData} onClose={() => setShowNotif(false)} />}
            </div>
            <div className="hide-sm" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Av init={user.avatar} size="av-sm" />
              <span className={`badge badge-${roleBadge(user.role)}`}>{roleLabel(user.role)}</span>
            </div>
          </div>
          {saveStatus === "error" && (
            <div className="warn-box save-banner">
              ⚠️ No se pudieron guardar los últimos cambios: {saveError}. Se volverá a intentar con el próximo cambio.
            </div>
          )}
          <div className="content" onClick={() => showNotif && setShowNotif(false)}>
            <Page data={data} setData={setData} user={user} search={search} setPage={setPage} />
          </div>
        </main>
      </div>
    </>
  );
}
