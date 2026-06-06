import { useEffect, useState } from 'react';
import { AppLayout } from '../components/Layout';
import { mantenimientoAPI, inventarioAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TIPO_BADGE = { 'Reparacion': 'badge-red', 'Reconfiguracion': 'badge-blue', 'Inspeccion': 'badge-green' };

function BitacoraModal({ onClose, onSave }) {
  const [equipos, setEquipos] = useState([]);
  const [form, setForm] = useState({ id_equipo: '', tipo_intervencion: 'Inspeccion', descripcion: '', frecuencia_anterior: '', frecuencia_nueva: '', resultado: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { inventarioAPI.getEquipos().then((r) => setEquipos(r.data)); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await mantenimientoAPI.registrarBitacora(form);
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Error.');
    } finally { setLoading(false); }
  };

  const esFrecuencia = form.tipo_intervencion === 'Reconfiguracion';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">📋 Nueva entrada de bitácora</h2>
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
              <label className="form-label">Tipo intervención *</label>
              <select className="form-control" value={form.tipo_intervencion}
                onChange={(e) => setForm({ ...form, tipo_intervencion: e.target.value })}>
                {['Reparacion','Reconfiguracion','Inspeccion'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          {esFrecuencia && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Frecuencia anterior (MHz)</label>
                <input type="number" step="0.0001" className="form-control" value={form.frecuencia_anterior}
                  onChange={(e) => setForm({ ...form, frecuencia_anterior: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Frecuencia nueva (MHz)</label>
                <input type="number" step="0.0001" className="form-control" value={form.frecuencia_nueva}
                  onChange={(e) => setForm({ ...form, frecuencia_nueva: e.target.value })} />
              </div>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Descripción *</label>
            <textarea className="form-control" rows={3} required value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Resultado / Conclusión técnica</label>
            <textarea className="form-control" rows={2} value={form.resultado}
              onChange={(e) => setForm({ ...form, resultado: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BitacoraPage() {
  const { canManage } = useAuth();
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [filtroEquipo, setFiltro] = useState('');
  const [equipos, setEquipos]     = useState([]);

  useEffect(() => { inventarioAPI.getEquipos().then((r) => setEquipos(r.data)); }, []);

  const load = () => {
    setLoading(true);
    mantenimientoAPI.getBitacora(filtroEquipo ? { id_equipo: filtroEquipo } : {})
      .then((r) => setRegistros(r.data))
      .finally(() => setLoading(false));
  };
  useEffect(load, [filtroEquipo]);

  return (
    <AppLayout title="Bitácora">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">📋 Bitácora de equipos</h1>
          <p className="page-subtitle">RF-004 · Historial de intervenciones técnicas</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setModal(true)}>+ Registrar intervención</button>
        )}
      </div>

      <div className="card">
        <div className="flex gap-3 mb-4">
          <select className="form-control" style={{ maxWidth: 280 }} value={filtroEquipo}
            onChange={(e) => setFiltro(e.target.value)}>
            <option value="">Todos los equipos</option>
            {equipos.map((e) => <option key={e.id_equipo} value={e.id_equipo}>{e.codigo_inventario} · {e.modelo}</option>)}
          </select>
        </div>

        {loading ? <div className="spinner" /> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Equipo</th><th>Tipo</th><th>Descripción</th><th>Frecuencias</th><th>Técnico</th><th>Fecha</th><th>Resultado</th></tr>
              </thead>
              <tbody>
                {registros.length === 0 ? (
                  <tr><td colSpan={7} className="empty-state">No hay registros en la bitácora.</td></tr>
                ) : registros.map((r) => (
                  <tr key={r.id_registro}>
                    <td><strong>{r.codigo_inventario}</strong><br /><span className="text-sm text-muted">{r.modelo}</span></td>
                    <td><span className={`badge ${TIPO_BADGE[r.tipo_intervencion] || 'badge-gray'}`}>{r.tipo_intervencion}</span></td>
                    <td style={{ maxWidth: 220, fontSize: '0.85rem' }}>{r.descripcion}</td>
                    <td style={{ fontSize: '0.82rem' }}>
                      {r.frecuencia_anterior ? `${r.frecuencia_anterior} → ${r.frecuencia_nueva} MHz` : '—'}
                    </td>
                    <td>{r.tecnico}</td>
                    <td style={{ fontSize: '0.82rem' }}>{new Date(r.fecha_intervencion).toLocaleString('es-CL')}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--clr-muted)' }}>{r.resultado || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <BitacoraModal onClose={() => setModal(false)} onSave={() => { setModal(false); load(); }} />}
    </AppLayout>
  );
}