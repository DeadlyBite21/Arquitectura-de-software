import { useEffect, useState } from 'react';
import { AppLayout } from '../components/Layout';
import { logisticaAPI, reservasAPI, inventarioAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function EntregaModal({ onClose, onSave }) {
  const [reservas, setReservas] = useState([]);
  const [equipos,  setEquipos]  = useState([]);
  const [form, setForm] = useState({ id_reserva: '', id_equipo: '', estado_entrega: 'Bueno', observaciones: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      reservasAPI.getAll({ estado: 'Aprobada' }),
      inventarioAPI.getEquipos({ estado: 'Operativo' }),
    ]).then(([r, e]) => { setReservas(r.data); setEquipos(e.data); });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await logisticaAPI.registrarEntrega(form);
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar entrega.');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">📦 Registrar entrega</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Reserva aprobada *</label>
            <select className="form-control" required value={form.id_reserva}
              onChange={(e) => setForm({ ...form, id_reserva: e.target.value })}>
              <option value="">— Seleccionar —</option>
              {reservas.map((r) => (
                <option key={r.id_reserva} value={r.id_reserva}>#{r.id_reserva} · {r.evento}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Equipo a entregar *</label>
            <select className="form-control" required value={form.id_equipo}
              onChange={(e) => setForm({ ...form, id_equipo: e.target.value })}>
              <option value="">— Seleccionar —</option>
              {equipos.map((e) => (
                <option key={e.id_equipo} value={e.id_equipo}>{e.codigo_inventario} · {e.modelo} ({e.tipo})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Estado al entregar</label>
            <select className="form-control" value={form.estado_entrega}
              onChange={(e) => setForm({ ...form, estado_entrega: e.target.value })}>
              {['Bueno','Con danos','Incompleto'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Observaciones</label>
            <textarea className="form-control" rows={2} value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar entrega'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DevolucionModal({ prestamo, onClose, onSave }) {
  const [form, setForm]     = useState({ estado_devolucion: 'Bueno', observaciones: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await logisticaAPI.registrarDevolucion(prestamo.id_prestamo, form);
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Error.');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">🔄 Registrar devolución</h2>
        <p className="text-muted text-sm mb-4">
          Equipo: <strong>{prestamo.codigo_inventario}</strong> — {prestamo.modelo} | Evento: {prestamo.evento}
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Estado al devolver *</label>
            <select className="form-control" value={form.estado_devolucion}
              onChange={(e) => setForm({ ...form, estado_devolucion: e.target.value })}>
              {['Bueno','Con danos','Incompleto'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Observaciones</label>
            <textarea className="form-control" rows={2} value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? 'Registrando...' : 'Confirmar devolución'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const ESTADO_B = { 'Bueno': 'badge-green', 'Con danos': 'badge-red', 'Incompleto': 'badge-yellow' };

export default function PrestamosPage() {
  const { canManage } = useAuth();
  const [prestamos, setPrestamos]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [soloActivos, setSoloActivos] = useState(true);
  const [entregaModal, setEntregaModal]     = useState(false);
  const [devolucionModal, setDevolucionModal] = useState(null);

  const load = () => {
    setLoading(true);
    logisticaAPI.getPrestamos(soloActivos ? { activos: true } : {})
      .then((r) => setPrestamos(r.data))
      .finally(() => setLoading(false));
  };
  useEffect(load, [soloActivos]);

  return (
    <AppLayout title="Préstamos">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">📦 Préstamos</h1>
          <p className="page-subtitle">RF-003 · Registro de entregas y devoluciones</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setEntregaModal(true)}>+ Registrar entrega</button>
        )}
      </div>

      <div className="card">
        <div className="flex gap-3 mb-4">
          <button className={`btn btn-sm ${soloActivos ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSoloActivos(true)}>Solo activos</button>
          <button className={`btn btn-sm ${!soloActivos ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSoloActivos(false)}>Historial completo</button>
        </div>

        {loading ? <div className="spinner" /> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Equipo</th><th>Evento</th><th>Encargado entrega</th>
                  <th>Fecha entrega</th><th>Devolución esperada</th>
                  <th>Estado entrega</th><th>Devolución real</th>
                  {canManage && <th>Acción</th>}
                </tr>
              </thead>
              <tbody>
                {prestamos.length === 0 ? (
                  <tr><td colSpan={8} className="empty-state">No hay préstamos registrados.</td></tr>
                ) : prestamos.map((p) => (
                  <tr key={p.id_prestamo}>
                    <td><strong>{p.codigo_inventario}</strong><br /><span className="text-sm text-muted">{p.modelo}</span></td>
                    <td>{p.evento}</td>
                    <td>{p.encargado_entrega}</td>
                    <td style={{ fontSize: '0.82rem' }}>{new Date(p.fecha_entrega).toLocaleString('es-CL')}</td>
                    <td>{new Date(p.fecha_devolucion_esperada).toLocaleDateString('es-CL')}</td>
                    <td><span className={`badge ${ESTADO_B[p.estado_entrega] || 'badge-gray'}`}>{p.estado_entrega}</span></td>
                    <td>
                      {p.fecha_devolucion_real
                        ? <><span className={`badge ${ESTADO_B[p.estado_devolucion] || 'badge-gray'}`}>{p.estado_devolucion}</span><br /><span className="text-sm text-muted">{new Date(p.fecha_devolucion_real).toLocaleString('es-CL')}</span></>
                        : <span className="badge badge-yellow">Pendiente</span>}
                    </td>
                    {canManage && (
                      <td>
                        {!p.fecha_devolucion_real && (
                          <button className="btn btn-success btn-sm" onClick={() => setDevolucionModal(p)}>
                            Devolver
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {entregaModal   && <EntregaModal onClose={() => setEntregaModal(false)} onSave={() => { setEntregaModal(false); load(); }} />}
      {devolucionModal && <DevolucionModal prestamo={devolucionModal} onClose={() => setDevolucionModal(null)} onSave={() => { setDevolucionModal(null); load(); }} />}
    </AppLayout>
  );
}