// src/pages/Inicio.jsx
import { useEffect, useState } from "react";
import { usuariosApi } from "../services/usuariosApi";
import { comicsApi }   from "../services/comicsApi";
import { ventasApi }   from "../services/ventasApi";
import "./Inicio.css";

// ── Helpers ───────────────────────────────────────────────

function initials(nombre = "") {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function formatFecha(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMonto(amount) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}

const STATUS_META = {
  PENDING:    { label: "Pendiente",  cls: "status-pending"    },
  PROCESSING: { label: "Procesando", cls: "status-processing" },
  COMPLETED:  { label: "Completada", cls: "status-completed"  },
  CANCELLED:  { label: "Cancelada",  cls: "status-cancelled"  },
};

// ── Subcomponentes ────────────────────────────────────────

function StatCard({ icon, label, value, loading }) {
  return (
    <div className="stat-card">
      <span className="stat-icon">{icon}</span>
      <div className="stat-body">
        <p className="stat-label">{label}</p>
        {loading
          ? <div className="stat-skeleton" />
          : <p className="stat-value">{value}</p>
        }
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="section-header">
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
    </div>
  );
}

function EmptyRow({ cols, msg }) {
  return (
    <tr>
      <td colSpan={cols} className="empty-row">{msg}</td>
    </tr>
  );
}

function ErrorNote({ msg }) {
  return <p className="section-error">⚠ {msg}</p>;
}

// ── Sección: Usuarios recientes ───────────────────────────

function UsuariosRecientes({ usuarios, loading, error }) {
  const recientes = usuarios
    .slice()
    .sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro))
    .slice(0, 5);

  return (
    <div className="dashboard-card">
      <SectionHeader title="Usuarios recientes" subtitle="Últimos 5 registros" />
      {error && <ErrorNote msg={error} />}
      <div className="table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Registro</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  <td><div className="skel skel-wide" /></td>
                  <td><div className="skel skel-short" /></td>
                  <td><div className="skel skel-mid" /></td>
                </tr>
              ))
            ) : recientes.length === 0 ? (
              <EmptyRow cols={3} msg="Sin usuarios registrados" />
            ) : (
              recientes.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="user-cell">
                      <div className="avatar">{initials(u.nombre)}</div>
                      <div>
                        <p className="cell-name">{u.nombre}</p>
                        <p className="cell-sub">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`rol-badge rol-${u.rol?.toLowerCase() ?? "cliente"}`}>
                      {u.rol ?? "Cliente"}
                    </span>
                  </td>
                  <td className="cell-date">{formatFecha(u.fechaRegistro)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Sección: Cómics más vendidos ──────────────────────────
// Calcula ranking a partir de los items de las ventas completadas

function comicsRanking(ventas, comics) {
  const conteo = {};
  ventas
    .filter((v) => v.status === "COMPLETED")
    .forEach((v) =>
      v.items?.forEach((item) => {
        const id = item.productId ?? item.comicId;
        if (!id) return;
        conteo[id] = (conteo[id] ?? 0) + (item.quantity ?? 1);
      })
    );

  return Object.entries(conteo)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, total]) => {
      const comic = comics.find(
        (c) => String(c.id) === String(id)
      );
      return { id, total, titulo: comic?.title ?? comic?.titulo ?? `Comic #${id}`, precio: comic?.price ?? comic?.precio };
    });
}

function ComicsMasVendidos({ ventas, comics, loadingV, loadingC, errorV, errorC }) {
  const ranking = comicsRanking(ventas, comics);
  const loading = loadingV || loadingC;
  const error   = errorV ?? errorC;

  return (
    <div className="dashboard-card">
      <SectionHeader title="Cómics más vendidos" subtitle="Por unidades en ventas completadas" />
      {error && <ErrorNote msg={error} />}
      <div className="table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Título</th>
              <th>Precio</th>
              <th>Unidades</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  <td><div className="skel skel-xs" /></td>
                  <td><div className="skel skel-wide" /></td>
                  <td><div className="skel skel-mid" /></td>
                  <td><div className="skel skel-short" /></td>
                </tr>
              ))
            ) : ranking.length === 0 ? (
              <EmptyRow cols={4} msg="Sin datos de ventas completadas" />
            ) : (
              ranking.map(({ id, total, titulo, precio }, idx) => (
                <tr key={id}>
                  <td>
                    <span className={`rank-badge rank-${idx + 1}`}>{idx + 1}</span>
                  </td>
                  <td className="cell-name">{titulo}</td>
                  <td className="cell-date">
                    {precio != null ? formatMonto(precio) : "—"}
                  </td>
                  <td>
                    <span className="units-badge">{total} u.</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Sección: Últimas ventas ───────────────────────────────

function UltimasVentas({ ventas, loading, error }) {
  const ultimas = ventas
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  return (
    <div className="dashboard-card dashboard-card--wide">
      <SectionHeader title="Últimas ventas" subtitle="Las 6 órdenes más recientes" />
      {error && <ErrorNote msg={error} />}
      <div className="table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Orden</th>
              <th>Usuario</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  <td><div className="skel skel-short" /></td>
                  <td><div className="skel skel-mid" /></td>
                  <td><div className="skel skel-mid" /></td>
                  <td><div className="skel skel-short" /></td>
                  <td><div className="skel skel-mid" /></td>
                </tr>
              ))
            ) : ultimas.length === 0 ? (
              <EmptyRow cols={5} msg="Sin órdenes registradas" />
            ) : (
              ultimas.map((v) => {
                const meta = STATUS_META[v.status] ?? { label: v.status, cls: "status-pending" };
                return (
                  <tr key={v.id}>
                    <td><span className="order-id">#{v.id}</span></td>
                    <td className="cell-name">{v.userId}</td>
                    <td className="cell-date">{formatFecha(v.createdAt)}</td>
                    <td className="cell-monto">{formatMonto(v.totalAmount)}</td>
                    <td>
                      <span className={`order-status ${meta.cls}`}>{meta.label}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────

export default function Inicio() {
  const [usuarios, setUsuarios] = useState([]);
  const [comics,   setComics]   = useState([]);
  const [ventas,   setVentas]   = useState([]);

  const [loadingU, setLoadingU] = useState(true);
  const [loadingC, setLoadingC] = useState(true);
  const [loadingV, setLoadingV] = useState(true);

  const [errorU, setErrorU] = useState(null);
  const [errorC, setErrorC] = useState(null);
  const [errorV, setErrorV] = useState(null);

  useEffect(() => {
    usuariosApi.obtenerTodos()
      .then(setUsuarios)
      .catch(() => setErrorU("No se pudo conectar con el servicio de usuarios"))
      .finally(() => setLoadingU(false));

    comicsApi.obtenerTodos()
      .then(setComics)
      .catch(() => setErrorC("No se pudo conectar con el servicio de cómics"))
      .finally(() => setLoadingC(false));

    ventasApi.obtenerTodas()
      .then(setVentas)
      .catch(() => setErrorV("No se pudo conectar con el servicio de ventas"))
      .finally(() => setLoadingV(false));
  }, []);

  const totalVentas = ventas
    .filter((v) => v.status === "COMPLETED")
    .reduce((acc, v) => acc + (v.totalAmount ?? 0), 0);

  return (
    <div className="inicio-page">

      {/* KPIs */}
      <div className="stats-row">
        <StatCard icon="◎" label="Usuarios registrados" value={usuarios.length} loading={loadingU} />
        <StatCard icon="◈" label="Cómics en catálogo"   value={comics.length}   loading={loadingC} />
        <StatCard icon="◇" label="Órdenes totales"      value={ventas.length}   loading={loadingV} />
        <StatCard
          icon="$"
          label="Ingresos completados"
          value={formatMonto(totalVentas)}
          loading={loadingV}
        />
      </div>

      {/* Grid principal */}
      <div className="dashboard-grid">
        <UsuariosRecientes
          usuarios={usuarios}
          loading={loadingU}
          error={errorU}
        />
        <ComicsMasVendidos
          ventas={ventas}
          comics={comics}
          loadingV={loadingV}
          loadingC={loadingC}
          errorV={errorV}
          errorC={errorC}
        />
        <UltimasVentas
          ventas={ventas}
          loading={loadingV}
          error={errorV}
        />
      </div>

    </div>
  );
}
