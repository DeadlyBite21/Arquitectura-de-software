import { useEffect, useState } from 'react';
import { AppLayout } from '../components/Layout';
import { inventarioAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ESTADO_BADGE = {
  'Operativo':      'badge-green',
  'En reparacion':  'badge-yellow',
  'De baja':        'badge-red',
};

const TIPOS = ['VHF','UHF','Base','Portatil'];
const ESTADOS = ['Operativo','En reparacion','De baja'];

function EquipoModal({ equipo, onClose, onSave }) {
  const [form, setForm] = useState(equipo || {
    codigo_inventario: '', modelo: '', marca: '',
    tipo: 'VHF', estado_operativo: 'Operativo', fecha_adquisicion: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (equipo) await inventarioAPI.updateEquipo(equipo.id_equipo, form);
      else        await inventarioAPI.createEquipo(form);
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar.');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{equipo ? '✏️ Editar equipo' : '➕ Nuevo equipo'}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Código inventario *</label>
              <input className="form-control" required value={form.codigo_inventario}
                onChange={(e) => setForm({ ...form, codigo_inventario: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Marca *</label>
              <input className="form-control" required value={form.marca}
                onChange={(e) => setForm({ ...form, marca: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Modelo *</label>
              <input className="form-control" required value={form.modelo}
                onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Tipo *</label>
              <select className="form-control" value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                {TIPOS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Estado operativo</label>
              <select className="form-control" value={form.estado_operativo}
                onChange={(e) => setForm({ ...form, estado_operativo: e.target.value })}>
                {ESTADOS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fecha adquisición *</label>
              <input type="date" className="form-control" required value={form.fecha_adquisicion}
                onChange={(e) => setForm({ ...form, fecha_adquisicion: e.target.value })} />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InventarioPage() {
  const { canManage, isAdmin } = useAuth();
  const [equipos, setEquipos]   = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // null | 'new' | equipo
  const [filtros, setFiltros]   = useState({ estado: '', tipo: '' });

  const load = () => {
    setLoading(true);
    Promise.all([
      inventarioAPI.getEquipos(filtros),
      inventarioAPI.getEstadisticas(),
    ]).then(([e, s]) => {
      setEquipos(e.data);
      setStats(s.data);
    }).finally(() => setLoading(false));
  };

  useEffect(load, [filtros]);

  const handleBaja = async (id) => {
    if (!window.confirm('¿Dar de baja este equipo?')) return;
    await inventarioAPI.darDeBaja(id);
    load();
  };

  return (
    <AppLayout title="Inventario de Equipos">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">📻 Inventario</h1>
          <p className="page-subtitle">RF-001 · Control de activos de radiofrecuencia</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setModal('new')}>+ Agregar equipo</button>
        )}
      </div>

      {stats && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: '1.5rem' }}>
          <div className="stat-card"><div className="stat-value">{stats.total}</div><div className="stat-label">Total equipos</div></div>
          <div className="stat-card success"><div className="stat-value" style={{ color: 'var(--clr-success)' }}>{stats.operativos}</div><div className="stat-label">Operativos</div></div>
          <div className="stat-card warn"><div className="stat-value" style={{ color: 'var(--clr-warn)' }}>{stats.en_reparacion}</div><div className="stat-label">En reparación</div></div>
          <div className="stat-card danger"><div className="stat-value" style={{ color: 'var(--clr-danger)' }}>{stats.de_baja}</div><div className="stat-label">De baja</div></div>
        </div>
      )}

      <div className="card">
        <div className="flex gap-3 mb-4">
          <select className="form-control" style={{ maxWidth: 180 }} value={filtros.estado}
            onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}>
            <option value="">Todos los estados</option>
            {ESTADOS.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className="form-control" style={{ maxWidth: 150 }} value={filtros.tipo}
            onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}>
            <option value="">Todos los tipos</option>
            {TIPOS.map((t) => <option key={t}>{t}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={() => setFiltros({ estado: '', tipo: '' })}>
            Limpiar
          </button>
        </div>

        {loading ? <div className="spinner" /> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Código</th><th>Modelo / Marca</th><th>Tipo</th>
                  <th>Estado</th><th>Adquisición</th>{canManage && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {equipos.length === 0 ? (
                  <tr><td colSpan={6} className="empty-state">No hay equipos registrados.</td></tr>
                ) : equipos.map((e) => (
                  <tr key={e.id_equipo}>
                    <td><code>{e.codigo_inventario}</code></td>
                    <td><strong>{e.modelo}</strong><br /><span className="text-sm text-muted">{e.marca}</span></td>
                    <td><span className="badge badge-blue">{e.tipo}</span></td>
                    <td><span className={`badge ${ESTADO_BADGE[e.estado_operativo] || 'badge-gray'}`}>{e.estado_operativo}</span></td>
                    <td>{new Date(e.fecha_adquisicion).toLocaleDateString('es-CL')}</td>
                    {canManage && (
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-secondary btn-sm" onClick={() => setModal(e)}>Editar</button>
                          {isAdmin && e.estado_operativo !== 'De baja' && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleBaja(e.id_equipo)}>Dar de baja</button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <EquipoModal
          equipo={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </AppLayout>
  );
}