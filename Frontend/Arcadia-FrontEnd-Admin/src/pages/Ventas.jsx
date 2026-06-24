// src/pages/Ventas.jsx
import { useEffect, useState } from "react";
import { ventasApi } from "../services/ventasApi";
import "./Ventas.css";

// ── Helpers ───────────────────────────────────────────────

function formatMonto(amount) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatFecha(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFechaCorta(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Status badge ──────────────────────────────────────────

const STATUS_META = {
  PENDING:    { label: "Pendiente",   cls: "status-pending"   },
  PROCESSING: { label: "Procesando",  cls: "status-processing"},
  COMPLETED:  { label: "Completada",  cls: "status-completed" },
  CANCELLED:  { label: "Cancelada",   cls: "status-cancelled" },
};

function OrderStatusBadge({ status }) {
  const meta = STATUS_META[status] ?? { label: status, cls: "status-pending" };
  return <span className={`order-status-badge ${meta.cls}`}>{meta.label}</span>;
}

function ApiStatusBadge({ status }) {
  return (
    <span className={`api-status-badge api-status-${status}`}>
      {status === "UP" ? "Conectado" : "Sin conexión"}
    </span>
  );
}

// ── Panel de detalle ──────────────────────────────────────

function DetallePanel({ venta, onClose }) {
  return (
    <div className="detalle-overlay" onClick={onClose}>
      <div className="detalle-panel" onClick={(e) => e.stopPropagation()}>

        {/* Header del panel */}
        <div className="detalle-header">
          <div>
            <p className="detalle-label">Orden</p>
            <p className="detalle-id">#{venta.id}</p>
          </div>
          <div className="detalle-header-right">
            <OrderStatusBadge status={venta.status} />
            <button className="btn-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Info general */}
        <div className="detalle-grid">
          <div className="detalle-field">
            <p className="detalle-field-label">Usuario</p>
            <p className="detalle-field-value">{venta.userId}</p>
          </div>
          <div className="detalle-field">
            <p className="detalle-field-label">Total</p>
            <p className="detalle-field-value detalle-monto">{formatMonto(venta.totalAmount)}</p>
          </div>
          <div className="detalle-field">
            <p className="detalle-field-label">Creada</p>
            <p className="detalle-field-value">{formatFecha(venta.createdAt)}</p>
          </div>
          <div className="detalle-field">
            <p className="detalle-field-label">Actualizada</p>
            <p className="detalle-field-value">{formatFecha(venta.updatedAt)}</p>
          </div>
        </div>

        {/* Items */}
        <div className="detalle-items-header">
          <p className="detalle-section-title">
            Artículos
            <span className="items-count">{venta.items?.length ?? 0}</span>
          </p>
        </div>

        <div className="detalle-items">
          {!venta.items || venta.items.length === 0 ? (
            <p className="items-empty">Sin artículos registrados</p>
          ) : (
            <table className="items-table">
              <thead>
                <tr>
                  <th>ID Producto</th>
                  <th>Cantidad</th>
                  <th>Precio unit.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {venta.items.map((item, i) => (
                  <tr key={item.id ?? i}>
                    <td className="item-product-id">{item.productId ?? item.comicId ?? "—"}</td>
                    <td>{item.quantity ?? "—"}</td>
                    <td>{formatMonto(item.unitPrice ?? item.precio)}</td>
                    <td className="item-subtotal">
                      {formatMonto(
                        item.subtotal ?? (item.quantity * (item.unitPrice ?? item.precio))
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Fila de la lista ──────────────────────────────────────

function VentaRow({ venta, onClick }) {
  return (
    <tr className="venta-row" onClick={() => onClick(venta)}>
      <td>
        <p className="venta-id">#{venta.id}</p>
      </td>
      <td>
        <p className="venta-user">{venta.userId}</p>
      </td>
      <td className="venta-fecha">{formatFechaCorta(venta.createdAt)}</td>
      <td>{formatMonto(venta.totalAmount)}</td>
      <td><OrderStatusBadge status={venta.status} /></td>
      <td className="venta-chevron">›</td>
    </tr>
  );
}

// ── Componente principal ──────────────────────────────────

export default function Ventas() {
  const [ventas, setVentas]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [apiStatus, setApiStatus]   = useState(null);
  const [ventaActiva, setVentaActiva] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [busqueda, setBusqueda]     = useState("");

  useEffect(() => {
    ventasApi.healthCheck()
      .then((d) => setApiStatus(d.status))
      .catch(() => setApiStatus("DOWN"));
  }, []);

  const cargarVentas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ventasApi.obtenerTodas();
      setVentas(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarVentas(); }, []);

  // Filtros
  const ventasFiltradas = ventas.filter((v) => {
    const texto = busqueda.toLowerCase();
    if (texto && !(
      v.id?.toLowerCase().includes(texto) ||
      v.userId?.toLowerCase().includes(texto)
    )) return false;
    if (filtroStatus && v.status !== filtroStatus) return false;
    return true;
  });

  const hayFiltros = busqueda !== "" || filtroStatus !== "";

  return (
    <div className="ventas-page">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Ventas</h1>
          <p className="page-subtitle">
            {hayFiltros
              ? `${ventasFiltradas.length} de ${ventas.length} órdenes`
              : `${ventas.length} orden${ventas.length !== 1 ? "es" : ""} en total`}
          </p>
        </div>
        <div className="header-actions">
          <ApiStatusBadge status={apiStatus ?? "—"} />
          <button className="btn-refresh" onClick={cargarVentas}>↻ Actualizar</button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filtros-panel">
        <div className="filtros-row">
          <div className="filtro-group">
            <label className="filtro-label">Búsqueda</label>
            <input
              className="filtro-input"
              type="text"
              placeholder="ID de orden o usuario..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="filtro-group">
            <label className="filtro-label">Estado</label>
            <select
              className="filtro-input"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="PENDING">Pendiente</option>
              <option value="PROCESSING">Procesando</option>
              <option value="COMPLETED">Completada</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </div>
        </div>
        {hayFiltros && (
          <button className="btn-reset" onClick={() => { setBusqueda(""); setFiltroStatus(""); }}>
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      {/* Estados de carga */}
      {loading && <p className="state-msg">Cargando ventas...</p>}
      {error && (
        <div className="error-box">
          <strong>Error al conectar con el microservicio</strong>
          <p>{error}</p>
          <p className="error-hint">
            Asegúrate de que el servicio esté corriendo en{" "}
            <code>{import.meta.env.VITE_VENTAS_API_URL}</code>
          </p>
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && (
        <div className="table-wrapper">
          <table className="ventas-table">
            <thead>
              <tr>
                <th>ID Orden</th>
                <th>Usuario</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-row">
                    No se encontraron órdenes
                  </td>
                </tr>
              ) : (
                ventasFiltradas.map((v) => (
                  <VentaRow key={v.id} venta={v} onClick={setVentaActiva} />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Panel de detalle */}
      {ventaActiva && (
        <DetallePanel venta={ventaActiva} onClose={() => setVentaActiva(null)} />
      )}
    </div>
  );
}
