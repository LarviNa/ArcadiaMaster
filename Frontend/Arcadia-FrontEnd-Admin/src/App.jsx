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
      // Redirect to login portal
      window.location.href = "http://localhost:5173";
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.rol?.toLowerCase() !== "admin") {
        alert("Acceso denegado: Se requiere rol de Administrador.");
        window.location.href = "http://localhost:5173";
        return;
      }
      setAuthorized(true);
    } catch (e) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "http://localhost:5173";
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'http://localhost:5173';
  };

  if (!authorized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a', color: '#fff' }}>
        <p>Verificando credenciales de Administrador...</p>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-dot" />
          AdminPanel
        </div>
        <button
          onClick={handleLogout}
          className="logout-button"
          title="Cerrar sesión"
        >
          Cerrar Sesión
        </button>
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
      </header>

      <main className="content-area">
        {renderPage(activeTab)}
      </main>
    </div>
  );
}
