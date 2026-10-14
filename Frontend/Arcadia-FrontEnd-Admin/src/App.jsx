import { useState, useEffect } from "react";
import "./App.css";
import Inicio   from "./pages/Inicio";
import Usuarios from "./pages/Usuarios";
import Comics   from "./pages/Comics";
import Ventas   from "./pages/Ventas";

const TABS = [
  { id: "inicio",   label: "Inicio",   icon: "⌂" },
  { id: "usuarios", label: "Usuarios", icon: "◎" },
  { id: "comics",   label: "Cómics",   icon: "◈" },
  { id: "ventas",   label: "Ventas",   icon: "◇" },
];

function renderPage(id) {
  switch (id) {
    case "inicio":   return <Inicio />;
    case "usuarios": return <Usuarios />;
    case "comics":   return <Comics />;
    case "ventas":   return <Ventas />;
    default:         return <Inicio />;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState("inicio");
  const [authorized, setAuthorized] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const loginUrl = import.meta.env.VITE_LOGIN_URL || "https://arcadia-comics.duckdns.org/login/";
  const clientesUrl = import.meta.env.VITE_CLIENTES_URL || "https://arcadia-comics.duckdns.org";

  useEffect(() => {
    // 1. Ingest URL query parameters (SSO from login portal)
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    const userParam = params.get("user");

    if (tokenParam && userParam) {
      localStorage.setItem("token", tokenParam);
      localStorage.setItem("user", decodeURIComponent(userParam));
      // Clear URL params
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    // 2. Validate token and Admin role session
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      setAuthorized(false);
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.rol?.toLowerCase() !== "admin") {
        console.warn("Acceso denegado: El usuario no posee rol Admin", user);
        setAuthorized(false);
        return;
      }
      setCurrentUser(user);
      setAuthorized(true);
    } catch (e) {
      setAuthorized(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = loginUrl;
  };

  const handleDemoAdminAccess = () => {
    const demoAdmin = {
      id: "u-admin-demo",
      nombre: "Administrador Demo (Bypass)",
      email: "admin@arcadia.cl",
      rol: "Admin",
      proveedor: "DEMO"
    };
    localStorage.setItem("token", "mock-admin-token-bypass");
    localStorage.setItem("user", JSON.stringify(demoAdmin));
    setCurrentUser(demoAdmin);
    setAuthorized(true);
  };

  if (!authorized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'radial-gradient(circle at top, #1e1b4b 0%, #0f172a 100%)', color: '#f8fafc', padding: '1.5rem', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', padding: '2.5rem', borderRadius: '16px', maxWidth: '440px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.8rem' }}>🛡️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.4rem', color: '#fff' }}>Arcadia AdminPanel</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
            Se requiere sesión de Administrador para gestionar el catálogo de cómics, inventario y usuarios.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => window.location.href = loginUrl}
              style={{ padding: '0.75rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }}
            >
              🔐 Iniciar Sesión (Portal Arcadia / Microsoft)
            </button>
            <button
              type="button"
              onClick={handleDemoAdminAccess}
              style={{ padding: '0.75rem', background: '#334155', color: '#f8fafc', border: '1px solid #475569', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}
              title="Ingresar directamente con credenciales de prueba para presentaciones"
            >
              ⚡ Acceso Rápido Administrador (Modo Demo)
            </button>
            <a
              href={clientesUrl}
              style={{ display: 'inline-block', color: '#818cf8', fontSize: '0.85rem', textDecoration: 'none', marginTop: '0.5rem' }}
            >
              ← Volver a la Tienda de Cómics
            </a>
          </div>
        </div>
      </div>
    );
  }

  const isMicrosoft =
    currentUser?.esMicrosoft === true ||
    currentUser?.proveedor?.toUpperCase() === "MICROSOFT";

  return (
    <div className="admin-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-dot" />
          AdminPanel
        </div>

        <nav className="nav-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`nav-tab${activeTab === tab.id ? " active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="topbar-user-section">
          {currentUser && (
            <div className="topbar-user-badge" title={currentUser.email}>
              <span className="topbar-user-name">{currentUser.nombre || currentUser.email}</span>
              <span className="topbar-user-role">ADMIN</span>
              {isMicrosoft && (
                <span className="topbar-ms-tag" title="Autenticado con Microsoft Entra ID">
                  <svg viewBox="0 0 21 21" width="12" height="12">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                  </svg>
                  Microsoft
                </span>
              )}
            </div>
          )}
          <a
            href={clientesUrl}
            style={{
              textDecoration: "none",
              color: "#38bdf8",
              fontSize: "0.85rem",
              fontWeight: "600",
              marginRight: "0.5rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem"
            }}
            title="Ir a la Tienda de Cómics"
          >
            🛒 Tienda
          </a>
          <button
            onClick={handleLogout}
            className="logout-button"
            title="Cerrar sesión"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="content-area">
        {renderPage(activeTab)}
      </main>
    </div>
  );
}
