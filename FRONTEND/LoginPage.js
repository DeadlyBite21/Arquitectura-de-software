import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📡</div>
          <h1>SGPE</h1>
          <p>Sistema de Gestión de Préstamos de Equipos</p>
          <p style={{ marginTop: '4px', fontSize: '0.75rem' }}>Comisión de Telecomunicaciones · AGSCH</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input
              type="email" className="form-control" required
              value={form.email} placeholder="usuario@agsch.cl"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              type="password" className="form-control" required
              value={form.password} placeholder="••••••••"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar al sistema'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--clr-surface2)', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--clr-muted)' }}>
          <strong style={{ color: 'var(--clr-text)' }}>Usuarios de prueba:</strong><br />
          🔑 admin@agsch.cl / admin1234<br />
          🔑 encargado@agsch.cl / encargado1234<br />
          🔑 dirigente@agsch.cl / dirigente1234
        </div>
      </div>
    </div>
  );
}