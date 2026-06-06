import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({ baseURL: API_URL });

// Adjuntar token JWT en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sgpe_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirigir al login si el token expira
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sgpe_token');
      localStorage.removeItem('sgpe_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:         (data) => api.post('/auth/login', data),
  me:            ()     => api.get('/auth/me'),
  register:      (data) => api.post('/auth/register', data),
  getUsuarios:   ()     => api.get('/auth/usuarios'),
  toggleUsuario: (id)   => api.patch(`/auth/usuarios/${id}/toggle`),
};

// ─── INVENTARIO ───────────────────────────────────────────────────────────────
export const inventarioAPI = {
  getEquipos:      (params) => api.get('/inventario/equipos', { params }),
  getEquipo:       (id)     => api.get(`/inventario/equipos/${id}`),
  getEstadisticas: ()       => api.get('/inventario/equipos/estadisticas'),
  createEquipo:    (data)   => api.post('/inventario/equipos', data),
  updateEquipo:    (id, d)  => api.put(`/inventario/equipos/${id}`, d),
  darDeBaja:       (id)     => api.patch(`/inventario/equipos/${id}/baja`),
};

// ─── RESERVAS ─────────────────────────────────────────────────────────────────
export const reservasAPI = {
  solicitar:  (data) => api.post('/reservas/solicitar', data),
  getAll:     (p)    => api.get('/reservas', { params: p }),
  getById:    (id)   => api.get(`/reservas/${id}`),
  aprobar:    (id, d) => api.patch(`/reservas/${id}/aprobar`, d),
};

// ─── LOGÍSTICA ────────────────────────────────────────────────────────────────
export const logisticaAPI = {
  registrarEntrega:    (data) => api.post('/logistica/entrega', data),
  registrarDevolucion: (id, d) => api.post(`/logistica/devolucion/${id}`, d),
  getPrestamos:        (p)    => api.get('/logistica/prestamos', { params: p }),
  getPrestamo:         (id)   => api.get(`/logistica/prestamos/${id}`),
};

// ─── MANTENIMIENTO ────────────────────────────────────────────────────────────
export const mantenimientoAPI = {
  registrarBitacora:    (data)    => api.post('/mantenimiento/bitacora', data),
  getBitacora:          (params)  => api.get('/mantenimiento/bitacora', { params }),
  programar:            (data)    => api.post('/mantenimiento/programar', data),
  getMantenimientos:    (params)  => api.get('/mantenimiento/programados', { params }),
  completar:            (id, d)   => api.patch(`/mantenimiento/programados/${id}/completar`, d),
  getAlertas:           ()        => api.get('/mantenimiento/alertas'),
};

// ─── REPORTES ─────────────────────────────────────────────────────────────────
export const reportesAPI = {
  getDisponibilidad:        (p) => api.get('/reportes/disponibilidad', { params: p }),
  getEquiposMasSolicitados: () => api.get('/reportes/equipos-mas-solicitados'),
  getTasaDanos:             () => api.get('/reportes/tasa-danos'),
  getResumenGeneral:        () => api.get('/reportes/resumen-general'),
};

export default api;