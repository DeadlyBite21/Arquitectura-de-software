import { useEffect, useState } from 'react';
import { AppLayout } from '../components/Layout';
import { authAPI } from '../services/api';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = () => {
    setLoading(true);
    authAPI.getUsuarios()
      .then(res => setUsuarios(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleToggle = async (id, isActive) => {
    if (!window.confirm(`¿Estás seguro de que quieres ${isActive ? 'desactivar' : 'activar'} este usuario?`)) return;
    try {
      await authAPI.toggleUsuario(id);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al modificar el usuario');
    }
  };

  return (
    <AppLayout title="Gestión de Usuarios">
      <div className="page-header">
        <h1 className="page-title">👥 Administración de Usuarios</h1>
        <p className="page-subtitle">RF-005 · Control de acceso y roles del sistema</p>
      </div>

      <div className="card">
        <div className="card-title">Usuarios Registrados</div>
        
        {loading ? <div className="spinner" /> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre Completo</th>
                  <th>Correo Electrónico</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr><td colSpan={5} className="empty-state">No hay usuarios registrados o el servicio no está disponible.</td></tr>
                ) : usuarios.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.nombre} {u.apellido}</strong></td>
                    <td>{u.email}</td>
                    <td><span className="badge badge-blue">{u.rol}</span></td>
                    <td>
                      <span className={`badge ${u.activo !== false ? 'badge-green' : 'badge-red'}`}>
                        {u.activo !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className={`btn btn-sm ${u.activo !== false ? 'btn-danger' : 'btn-secondary'}`}
                        onClick={() => handleToggle(u.id, u.activo !== false)}
                      >
                        {u.activo !== false ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
