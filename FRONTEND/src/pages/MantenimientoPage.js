import { useEffect, useState } from 'react';
import { AppLayout } from '../components/Layout';
import { mantenimientoAPI, inventarioAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ESTADO_B = { 'Pendiente': 'badge-yellow', 'Realizado': 'badge-green', 'Cancelado': 'badge-red' };

function ProgramarModal({ onClose, onSave }) {
  const [equipos, setEquipos] = useState([]);
  const [form, setForm] = useState({ id_equipo: '', tipo: 'Preventivo', descripcion: '', fecha_programada: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { inventarioAPI.getEquipos().then((r) => setEquipos(r.data)); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await mantenimientoAPI.programar(form);
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Error.');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">🔧 Programar mantenimiento</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Equipo *</label>
              <select className="form-control" required value={form.id_equipo}
                onChange={(e) => setForm({ ...form, id_equipo: e.target.value })}>
                <option value="">— Seleccionar —</option>
                {equipos.map((e) => <option key={e.id_equipo} value={e.id_equipo}>{e.codigo_inventario} · {e.modelo}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select className="form-control" value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                <option>Preventivo</option><option>Correctivo</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Descripción *</label>
            <textarea className="form-control" rows={3} required value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Ej: Revisión de baterías cada 6 meses, calibración de antenas..." />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha programada *</label>
            <input type="date" className="form-control" required value={form.fecha_programada}
              onChange={(e) => setForm({ ...form, fecha_programada: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Programar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MantenimientoPage() {
  const { canManage } = useAuth();
  const [mantenimientos, setMantenimientos] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [filtro, setFiltro]     = useState('');

  const load = () => {
    setLoading(true);
    mantenimientoAPI.getMantenimientos(filtro ? { estado: filtro } : {})
      .then((r) => setMantenimientos(r.data))
      .finally(() => setLoading(false));
  };
  useEffect(load, [filtro]);

  const completar = async (id, estado) => {
    await mantenimientoAPI.completar(id, {
      estado_mantencion: estado,
      fecha_realizado: new Date().toISOString().split('T')[0],
    });
    load();
  };

  return (
    <AppLayout title="Mantenimiento">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">🔧 Mantenimiento preventivo</h1>
          <p className="page-subtitle">RF-006 · Alertas y programación de revisiones</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setModal(true)}>+ Programar mantenimiento</button>
        )}
      </div>

      <div className="card">
        <div className="flex gap-3 mb-4">
          {['', 'Pendiente', 'Realizado', 'Cancelado'].map((e) => (
            <button key={e} className={`btn btn-sm ${filtro === e ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFiltro(e)}>
              {e || 'Todos'}
            </button>
          ))}
        </div>

        {loading ? <div className="spinner" /> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Equipo</th><th>Tipo</th><th>Descripción</th><th>Fecha programada</th><th>Fecha realizado</th><th>Estado</th><th>Responsable</th>{canManage && <th>Acción</th>}</tr>
              </thead>
              <tbody>
                {mantenimientos.length === 0 ? (
                  <tr><td colSpan={8} className="empty-state">No hay mantenimientos registrados.</td></tr>
                ) : mantenimientos.map((m) => (
                  <tr key={m.id_mantenimiento}>
                    <td><strong>{m.codigo_inventario}</strong><br /><span className="text-sm text-muted">{m.modelo}</span></td>
                    <td><span className="badge badge-blue">{m.tipo}</span></td>
                    <td style={{ maxWidth: 220, fontSize: '0.85rem' }}>{m.descripcion}</td>
                    <td>{new Date(m.fecha_programada).toLocaleDateString('es-CL')}</td>
                    <td>{m.fecha_realizado ? new Date(m.fecha_realizado).toLocaleDateString('es-CL') : '—'}</td>
                    <td><span className={`badge ${ESTADO_B[m.estado_mantencion]}`}>{m.estado_mantencion}</span></td>
                    <td>{m.responsable}</td>
                    {canManage && (
                      <td>
                        {m.estado_mantencion === 'Pendiente' && (
                          <div className="flex gap-2">
                            <button className="btn btn-success btn-sm" onClick={() => completar(m.id_mantenimiento, 'Realizado')}>✓ Completar</button>
                            <button className="btn btn-danger btn-sm"  onClick={() => completar(m.id_mantenimiento, 'Cancelado')}>✕</button>
                          </div>
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

      {modal && <ProgramarModal onClose={() => setModal(false)} onSave={() => { setModal(false); load(); }} />}
    </AppLayout>
  );
}