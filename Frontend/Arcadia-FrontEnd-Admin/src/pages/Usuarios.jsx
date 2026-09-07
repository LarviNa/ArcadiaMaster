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

  // Filtro de búsqueda local
  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="usuarios-page">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuarios</h1>
          <p className="page-subtitle">
            {usuarios.length} usuario{usuarios.length !== 1 ? "s" : ""} registrado
            {usuarios.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="header-actions">
          <StatusBadge status={apiStatus ?? "—"} />
          <button className="btn-refresh" onClick={cargarUsuarios}>
            ↻ Actualizar
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="search-bar">
        <input
          className="search-input"
          type="text"
          placeholder="Buscar por nombre o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla */}
      {loading && <p className="state-msg">Cargando usuarios...</p>}
      {error   && (
        <div className="error-box">
          <strong>Error al conectar con el microservicio</strong>
          <p>{error}</p>
          <p className="error-hint">
            Asegúrate de que el servicio Spring Boot esté corriendo en{" "}
            <code>http://localhost:8080</code>
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
                <th>Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-row">
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
