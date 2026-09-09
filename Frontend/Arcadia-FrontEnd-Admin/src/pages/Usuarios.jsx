// src/pages/Usuarios.jsx
// Pestaña de administración de usuarios — consume el microservicio Spring Boot

import { useEffect, useState } from "react";
import { usuariosApi } from "../services/usuariosApi";
import "./Usuarios.css";

// ── Helpers ──────────────────────────────────────────────

function initials(nombre = "") {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Sub-componentes ───────────────────────────────────────

function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-${status}`}>
      {status === "UP" ? "Conectado" : "Sin conexión"}
    </span>
  );
}

export function AuthBadge({ user }) {
  const isMicrosoft =
    user?.esMicrosoft === true ||
    user?.proveedor?.toUpperCase() === "MICROSOFT" ||
    user?.authProvider?.toUpperCase() === "MICROSOFT";

  if (isMicrosoft) {
    return (
      <span className="auth-badge auth-microsoft" title="Autenticado con Microsoft Entra ID">
        <svg className="auth-icon-ms" viewBox="0 0 21 21" width="14" height="14">
          <rect x="1" y="1" width="9" height="9" fill="#f25022" />
          <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
          <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
          <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
        </svg>
        <span>Microsoft</span>
      </span>
    );
  }

  return (
    <span className="auth-badge auth-local" title="Cuenta local (correo y contraseña)">
      <svg className="auth-icon-local" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <span>Local</span>
    </span>
  );
}

function UserRow({ user, onDelete }) {
  const [confirmando, setConfirmando] = useState(false);

  const handleDelete = async () => {
    if (!confirmando) {
      setConfirmando(true);
      return;
    }
    try {
      await onDelete(user.id);
    } catch {
      setConfirmando(false);
    }
  };

  return (
    <tr>
      <td>
        <div className="user-cell">
          <div className="avatar">{initials(user.nombre)}</div>
          <div>
            <p className="user-name">{user.nombre}</p>
            <p className="user-email">{user.email}</p>
          </div>
        </div>
      </td>
      <td>
        <span className={`rol-badge rol-${user.rol?.toLowerCase()}`}>
          {user.rol ?? "Cliente"}
        </span>
      </td>
      <td>
        <AuthBadge user={user} />
      </td>
      <td className="date-cell">{formatDate(user.fechaRegistro)}</td>
      <td>
        <button
          className={`btn-delete${confirmando ? " confirming" : ""}`}
          onClick={handleDelete}
          onBlur={() => setConfirmando(false)}
        >
          {confirmando ? "¿Confirmar?" : "Eliminar"}
        </button>
      </td>
    </tr>
  );
}

// ── Componente principal ──────────────────────────────────

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [apiStatus, setApiStatus] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroProveedor, setFiltroProveedor] = useState("todos");

  // Verificar conexión con el microservicio
  useEffect(() => {
    usuariosApi
      .healthCheck()
      .then((data) => setApiStatus(data.status))
      .catch(() => setApiStatus("DOWN"));
  }, []);

  // Cargar usuarios
  const cargarUsuarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usuariosApi.obtenerTodos();
      setUsuarios(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleEliminar = async (id) => {
    await usuariosApi.eliminar(id);
    setUsuarios((prev) => prev.filter((u) => u.id !== id));
  };

  const msCount = usuarios.filter(
    (u) => u.esMicrosoft === true || u.proveedor?.toUpperCase() === "MICROSOFT"
  ).length;
  const localCount = usuarios.length - msCount;

  // Filtro de búsqueda y proveedor
  const usuariosFiltrados = usuarios.filter((u) => {
    const matchesTexto =
      u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email?.toLowerCase().includes(busqueda.toLowerCase());

    const isMs =
      u.esMicrosoft === true || u.proveedor?.toUpperCase() === "MICROSOFT";

    if (filtroProveedor === "microsoft") return matchesTexto && isMs;
    if (filtroProveedor === "local")     return matchesTexto && !isMs;
    return matchesTexto;
  });

  return (
    <div className="usuarios-page">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuarios</h1>
          <p className="page-subtitle">
            {usuarios.length} usuario{usuarios.length !== 1 ? "s" : ""} registrado{usuarios.length !== 1 ? "s" : ""} ·{" "}
            <span className="subtitle-highlight ms-color">{msCount} con Microsoft</span> ·{" "}
            <span className="subtitle-highlight">{localCount} locales</span>
          </p>
        </div>
        <div className="header-actions">
          <StatusBadge status={apiStatus ?? "—"} />
          <button className="btn-refresh" onClick={cargarUsuarios}>
            ↻ Actualizar
          </button>
        </div>
      </div>

      {/* Barra de herramientas: Buscador y Filtro por proveedor */}
      <div className="toolbar-section">
        <div className="search-bar">
          <input
            className="search-input"
            type="text"
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          <button
            type="button"
            className={`filter-pill${filtroProveedor === "todos" ? " active" : ""}`}
            onClick={() => setFiltroProveedor("todos")}
          >
            Todos ({usuarios.length})
          </button>
          <button
            type="button"
            className={`filter-pill pill-ms${filtroProveedor === "microsoft" ? " active" : ""}`}
            onClick={() => setFiltroProveedor("microsoft")}
          >
            <svg viewBox="0 0 21 21" width="12" height="12">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            Microsoft ({msCount})
          </button>
          <button
            type="button"
            className={`filter-pill pill-local${filtroProveedor === "local" ? " active" : ""}`}
            onClick={() => setFiltroProveedor("local")}
          >
            Local ({localCount})
          </button>
        </div>
      </div>

      {/* Tabla */}
      {loading && <p className="state-msg">Cargando usuarios...</p>}
      {error   && (
        <div className="error-box">
          <strong>Error al conectar con el microservicio</strong>
          <p>{error}</p>
          <p className="error-hint">
            Asegúrate de que el API Gateway esté corriendo en{" "}
            <code>http://localhost:8083</code>
          </p>
        </div>
      )}

      {!loading && !error && (
        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Autenticación</th>
                <th>Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-row">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((u) => (
                  <UserRow key={u.id} user={u} onDelete={handleEliminar} />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
