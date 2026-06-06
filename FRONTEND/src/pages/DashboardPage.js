import { useEffect, useState } from 'react';
import { AppLayout } from '../components/Layout';
import { reportesAPI, mantenimientoAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportesAPI.getResumenGeneral(),
      mantenimientoAPI.getAlertas(),
    ]).then(([r, a]) => {
      setResumen(r.data);
      setAlertas(a.data);
    }).finally(() => setLoading(false));
  }, []);

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <AppLayout title="Dashboard">
      <div className="page-header">
        <h1 className="page-title">{saludo}, {user?.nombre} 👋</h1>
        <p className="page-subtitle">Resumen operacional de la Comisión de Telecomunicaciones · AGSCH</p>
      </div>

      {loading ? <div className="spinner" /> : (
        <>
          <div className="stats-grid">
            <div className="stat-card success">
              <div className="stat-value" style={{ color: 'var(--clr-success)' }}>{resumen?.equipos_operativos ?? '—'}</div>
              <div className="stat-label">Equipos operativos</div>
            </div>
            <div className="stat-card warn">
              <div className="stat-value" style={{ color: 'var(--clr-warn)' }}>{resumen?.reservas_pendientes ?? '—'}</div>
              <div className="stat-label">Reservas pendientes</div>
            </div>
            <div className="stat-card accent">
              <div className="stat-value" style={{ color: 'var(--clr-accent2)' }}>{resumen?.prestamos_activos ?? '—'}</div>
              <div className="stat-label">Préstamos activos</div>
            </div>
            <div className="stat-card danger">
              <div className="stat-value" style={{ color: 'var(--clr-danger)' }}>{resumen?.alertas_proximas ?? '—'}</div>
              <div className="stat-label">Alertas de mantenimiento</div>
            </div>
          </div>

          {alertas.length > 0 && (
            <div className="card mb-6">
              <div className="card-title">⚠️ Alertas de mantenimiento próximas</div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Equipo</th><th>Tipo</th><th>Descripción</th>
                      <th>Fecha programada</th><th>Responsable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertas.map((a) => (
                      <tr key={a.id_mantenimiento}>
                        <td><strong>{a.codigo_inventario}</strong><br /><span className="text-sm text-muted">{a.modelo}</span></td>
                        <td><span className="badge badge-yellow">{a.tipo}</span></td>
                        <td>{a.descripcion}</td>
                        <td>{new Date(a.fecha_programada).toLocaleDateString('es-CL')}</td>
                        <td>{a.responsable}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-title">📡 Sobre el sistema SGPE</div>
            <p style={{ color: 'var(--clr-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
              El Sistema de Gestión de Préstamos de Equipos centraliza el control de inventario,
              reservas y préstamos de radios VHF/UHF de la Comisión de Telecomunicaciones de la
              Asociación de Guías y Scouts de Chile (AGSCH), garantizando trazabilidad completa
              de cada activo.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              {['RF-001 Inventario','RF-002 Reservas','RF-003 Préstamos','RF-004 Bitácora','RF-005 Usuarios','RF-006 Mantenimiento','RF-007 Reportes'].map(rf => (
                <span key={rf} className="badge badge-blue">{rf}</span>
              ))}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}