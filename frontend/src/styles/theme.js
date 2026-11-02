// Hoja de estilos global (tema claro / oscuro)
export const makeCSS = (dark) => `
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
.bar-chart{display:flex;align-items:flex-end;gap:8px;height:150px;padding-top:10px}
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

/* BOTONES SIN ESTILO NATIVO (accesibles con teclado) */
button.nav-item,button.user-card,button.role-btn,button.theme-toggle{font:inherit;width:100%;text-align:left;border:none;background:none}
button.role-btn{text-align:center;border:2px solid var(--border);background:var(--bg3)}
button.theme-toggle{width:auto;border:1.5px solid var(--border);background:var(--bg3)}
button.nav-item{display:flex}
.btn:disabled{opacity:.55;cursor:not-allowed;box-shadow:none}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

/* LOGIN */
.login-card{position:relative;max-width:calc(100vw - 32px)}
.login-logo{width:60px;height:60px;border-radius:16px;background:linear-gradient(135deg,#4f7ef7,#7c3aed);display:inline-flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:28px;font-weight:900;color:#fff;box-shadow:0 6px 20px rgba(79,126,247,0.4);margin-bottom:14px}
.demo-box{margin-top:16px;padding:12px 14px;border-radius:10px;background:var(--bg3);border:1.5px dashed var(--border2);font-size:12px;color:var(--txt2);text-align:center;font-weight:600}
.demo-box code{background:var(--accl);color:var(--accent);padding:1px 6px;border-radius:4px;font-size:11.5px}
.loading{font-weight:800;color:var(--txt3);font-size:15px}

/* ESTADO DE GUARDADO */
.save-status{font-size:12px;font-weight:700;color:var(--txt3);white-space:nowrap}
.save-status.saved{color:var(--green)}
.save-status.error{color:var(--red)}
.save-banner{margin:10px 26px 0;border-radius:9px}

/* MENÚ MÓVIL */
.menu-btn{display:none}
.nav-backdrop{display:none}

@media (max-width:1100px){
  .stats-grid{grid-template-columns:repeat(2,1fr)}
  .content [style*="grid-template-columns: repeat(3"],.content [style*="grid-template-columns: repeat(4"]{grid-template-columns:repeat(2,1fr) !important}
  .content [style*="grid-template-columns: 2fr 1fr"]{grid-template-columns:1fr !important}
  .dash-grid{grid-template-columns:1fr}
}
@media (max-width:900px){
  .menu-btn{display:inline-flex;align-items:center;justify-content:center}
  .sidebar{position:fixed;top:0;bottom:0;left:0;z-index:60;transform:translateX(-105%);transition:transform .25s ease;box-shadow:var(--shadow)}
  .sidebar.open{transform:translateX(0)}
  .nav-backdrop{display:block;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:55}
  .topbar{padding:10px 16px;gap:8px;flex-wrap:wrap;height:auto}
  .topbar-sub{display:none}
  .search-bar{order:10;width:100%;flex-basis:100%}
  .hide-sm{display:none !important}
  .content{padding:16px}
  .save-banner{margin:10px 16px 0}
  .modal,.modal-lg,.modal-xl{width:calc(100vw - 32px) !important;max-height:calc(100vh - 32px);overflow-y:auto;padding:22px}
  .fr{grid-template-columns:1fr}
  .notif-panel{position:fixed;left:16px;right:16px;top:64px;width:auto}
}
@media (max-width:640px){
  .stats-grid{grid-template-columns:1fr 1fr;gap:10px}
  .content [style*="grid-template-columns"]{grid-template-columns:1fr !important}
  .stats-grid[style*="grid-template-columns"]{grid-template-columns:1fr 1fr !important}
  .login-card{padding:28px 20px}
  .bulletin-student{grid-template-columns:1fr}
  .portal-hd{flex-wrap:wrap}
}

/* IMPRESIÓN: solo el contenido (boletín / cuadro), sin menú ni barra superior */
@media print{
  .sidebar,.topbar,.bg-wrap,.save-banner,.nav-backdrop{display:none!important}
  html,body,.app,.main,.content{overflow:visible!important;height:auto!important;display:block!important;padding:0!important;background:#fff!important}
  .bulletin-sheet{border:none!important;max-width:100%!important}
}

/* El boletín y el cuadro general son "papel" blanco también en modo oscuro */
.bulletin-sheet td{color:#1e293b;border-color:#e2e8f0}
.bulletin-sheet tr:hover td{background:#f1f5f9}
.bulletin-sheet h2{color:#1e293b}
.report-table th{background:#f1f5f9;color:#475569}
.bulletin-table{overflow-x:auto}
.bulletin-table th{white-space:normal}
.sig-line{padding-top:8px;margin-top:36px}
`;
