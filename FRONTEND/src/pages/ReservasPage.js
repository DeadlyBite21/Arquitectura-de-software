import { useEffect, useState } from 'react';
import { AppLayout } from '../components/Layout';
import { reservasAPI, inventarioAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ESTADO_BADGE = {
  'Pendiente': 'badge-yellow',
  'Aprobada':  'badge-green',
  'Rechazada': 'badge-red',
};

function NuevaReservaModal({ onClose, onSave }) {
  const [equipos, setEquipos] = useState([]);
  const [form, setForm]   = useState({ evento: '', fecha_inicio: '', fecha_fin: '', observaciones: '', equipos: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    inventarioAPI.getEquipos({ estado: 'Operativo' }).then((r) => setEquipos(r.data));
  }, []);

  const toggleEquipo = (eq) => {
    const existe = form.equipos.find((e) => e.id_equipo === eq.id_equipo);
    if (existe) setForm({ ...form, equipos: form.equipos.filter((e) => e.id_equipo !== eq.id_equipo) });
    else setForm({ ...form, equipos: [...form.equipos, { id_equipo: eq.id_equipo, cantidad: 1 }] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    if (!form.equipos.length) { setError('Selecciona al menos un equipo.'); setLoading(false); return; }
    try {
      await reservasAPI.solicitar(form);
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al solicitar reserva.');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">📅 Nueva solicitud de reserva</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre del evento *</label>
            <input className="form-control" required value={form.evento}
              onChange={(e) => setForm({ ...form, evento: e.target.value })} placeholder="Ej: Campamento Regional 2026" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fecha inicio *</label>
              <input type="date" className="form-control" required value={form.fecha_inicio}
                onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha término *</label>
              <input type="date" className="form-control" required value={form.fecha_fin}
                onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Equipos solicitados *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', maxHeight: 200, overflowY: 'auto', border: '1px solid var(--clr-border)', borderRadius: 8, padding: '0.75rem' }}>
              {equipos.map((eq) => {
                const sel = form.equipos.find((e) => e.id_equipo === eq.id_equipo);
                return (
                  <label key={eq.id_equipo} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={!!sel} onChange={() => toggleEquipo(eq)} />
                    <span><strong>{eq.codigo_inventario}</strong> — {eq.modelo} ({eq.tipo})</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Observaciones</label>
            <textarea className="form-control" rows={2} value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Enviando...' : 'Solicitar reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ReservasPage() {
  const { isAdmin, canManage } = useAuth();
  const [reservas, setReservas]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [filtro, setFiltro]       = useState('');
  const [selected, setSelected]   = useState(null);

  const load = () => {
    setLoading(true);
    reservasAPI.getAll(filtro ? { estado: filtro } : {})
      .then((r) => setReservas(r.data))
      .finally(() => setLoading(false));
  };
  useEffect(load, [filtro]);

  const handleAprobar = async (id, estado) => {
    await reservasAPI.aprobar(id, { estado });
    load();
  };

  const expandir = async (r) => {
    if (selected?.id_reserva === r.id_reserva) { setSelected(null); return; }
    const full = await reservasAPI.getById(r.id_reserva);
    setSelected(full.data);
  };

  return (
    <AppLayout title="Reservas">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">📅 Reservas</h1>
          <p className="page-subtitle">RF-002 · Solicitud y aprobación de préstamos</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Nueva reserva</button>
      </div>

      <div className="card">
        <div className="flex gap-3 mb-4">
          {['', 'Pendiente', 'Aprobada', 'Rechazada'].map((e) => (
            <button key={e} className={`btn btn-sm ${filtro === e ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFiltro(e)}>
              {e || 'Todas'}
            </button>
          ))}
        </div>

        {loading ? <div className="spinner" /> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>ID</th><th>Evento</th><th>Solicitante</th><th>Fechas</th><th>Equipos</th><th>Estado</th>{isAdmin && <th>Acciones</th>}</tr>
              </thead>
              <tbody>
                {reservas.length === 0 ? (
                  <tr><td colSpan={7} className="empty-state">No hay reservas.</td></tr>
                ) : reservas.map((r) => (
                  <>
                    <tr key={r.id_reserva} style={{ cursor: 'pointer' }} onClick={() => expandir(r)}>
                      <td><code>#{r.id_reserva}</code></td>
                      <td><strong>{r.evento}</strong></td>
                      <td>{r.solicitante}</td>
                      <td style={{ fontSize: '0.82rem' }}>
                        {new Date(r.fecha_inicio).toLocaleDateString('es-CL')} →{' '}
                        {new Date(r.fecha_fin).toLocaleDateString('es-CL')}
                      </td>
                      <td>{r.cantidad_solicitada} equipo(s)</td>
                      <td><span className={`badge ${ESTADO_BADGE[r.estado_equipos]}`}>{r.estado_equipos}</span></td>
                      {isAdmin && (
                        <td onClick={(e) => e.stopPropagation()}>
                          {r.estado_equipos === 'Pendiente' && (
                            <div className="flex gap-2">
                              <button className="btn btn-success btn-sm" onClick={() => handleAprobar(r.id_reserva, 'Aprobada')}>Aprobar</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleAprobar(r.id_reserva, 'Rechazada')}>Rechazar</button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                    {selected?.id_reserva === r.id_reserva && (
                      <tr key={`detail-${r.id_reserva}`}>
                        <td colSpan={7} style={{ background: 'var(--clr-surface2)', padding: '1rem 1.5rem' }}>
                          <strong style={{ fontSize: '0.8rem', color: 'var(--clr-muted)' }}>EQUIPOS SOLICITADOS</strong>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                            {selected.equipos?.map((eq) => (
                              <span key={eq.id_detalle} className="badge badge-blue">
                                {eq.codigo_inventario} · {eq.modelo} (x{eq.cantidad})
                              </span>
                            ))}
                          </div>
                          {selected.observaciones && (
                            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--clr-muted)' }}>
                              📝 {selected.observaciones}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <NuevaReservaModal onClose={() => setModal(false)} onSave={() => { setModal(false); load(); }} />}
    </AppLayout>
  );
}