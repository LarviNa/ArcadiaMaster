// src/services/ventasApi.js
const BASE_URL = import.meta.env.VITE_VENTAS_API_URL;

async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    headers,
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const ventasApi = {
  obtenerTodas:  ()      => request(""),
  obtenerPorId:  (id)    => request(`/${id}`),
  healthCheck:   ()      => request("/health"),
};
