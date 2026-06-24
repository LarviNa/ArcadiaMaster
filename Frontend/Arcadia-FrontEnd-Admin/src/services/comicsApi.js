// src/services/comicsApi.js
const BASE_URL = import.meta.env.VITE_COMICS_API_URL;

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

export const comicsApi = {
  obtenerTodos:  ()           => request(""),
  obtenerPorId:  (id)         => request(`/${id}`),
  crear:         (comic)      => request("",     { method: "POST",   body: JSON.stringify(comic) }),
  actualizar:    (id, comic)  => request(`/${id}`, { method: "PUT",   body: JSON.stringify(comic) }),
  eliminar:      (id)         => request(`/${id}`, { method: "DELETE" }),
  healthCheck:   ()           => request("/health"),
};
