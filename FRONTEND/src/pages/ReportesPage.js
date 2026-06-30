import { useEffect, useState } from 'react';
import { AppLayout } from '../components/Layout';
import { reportesAPI } from '../services/api';

export default function ReportesPage() {
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [masSolicitados, setMasSolicitados] = useState([]);
  const [tasaDanos, setTasaDanos] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportesAPI.getDisponibilidad(),
      reportesAPI.getEquiposMasSolicitados(),
      reportesAPI.getTasaDanos()
    ]).then(([d, s, t]) => {
      setDisponibilidad(d.data);
      setMasSolicitados(s.data);
      setTasaDanos(t.data);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout title="Reportes">
      <div className="page-header">
        <h1 className="page-title">📈 Reportes e Inteligencia</h1>
        <p className="page-subtitle">RF-007 · Análisis de uso y estado del equipamiento</p>
      </div>

      {loading ? <div className="spinner" /> : (
        <>
          <div className="card mb-6">
            <div className="card-title">Disponibilidad de Equipos</div>
            {disponibilidad.length === 0 ? (
              <p className="empty-state">No hay datos de disponibilidad para graficar en este momento.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Tipo de Equipo</th><th>Total</th><th>Disponibles</th><th>En Terreno</th><th>Tasa de Disponibilidad</th></tr>
                  </thead>
                  <tbody>
                    {disponibilidad.map((row, i) => (
                      <tr key={i}>
                        <td>{row.tipo}</td>
                        <td>{row.total}</td>
                        <td>{row.disponibles}</td>
                        <td>{row.en_terreno}</td>
                        <td><span className="badge badge-blue">{row.tasa}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="card">
              <div className="card-title">Equipos Más Solicitados</div>
              {masSolicitados.length === 0 ? (
                <p className="empty-state" style={{ padding: '2rem' }}>No hay registros suficientes de préstamos.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Equipo</th><th>Veces Solicitado</th></tr>
                    </thead>
                    <tbody>
                      {masSolicitados.map((eq, i) => (
                        <tr key={i}>
                          <td><strong>{eq.codigo}</strong> <span className="text-muted">{eq.modelo}</span></td>
                          <td>{eq.solicitudes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-title">Tasa de Daños Histórica</div>
              {(!tasaDanos || Object.keys(tasaDanos).length === 0) ? (
                <p className="empty-state" style={{ padding: '2rem' }}>No se han registrado incidencias de daños recientes.</p>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--clr-danger)' }}>
                    {tasaDanos.porcentaje}%
                  </div>
                  <p className="text-muted mt-2">
                    De los {tasaDanos.total_prestamos} préstamos realizados este año, {tasaDanos.devoluciones_con_dano} retornaron con observaciones de daños.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
