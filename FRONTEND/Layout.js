import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { section: 'General', items: [
    { to: '/dashboard',   icon: '📊', label: 'Dashboard' },
  ]},
  { section: 'Equipos', items: [
    { to: '/inventario',  icon: '📻', label: 'Inventario' },
    { to: '/bitacora',    icon: '📋', label: 'Bitácora' },
    { to: '/mantenimiento', icon: '🔧', label: 'Mantenimiento' },
  ]},
  { section: 'Préstamos', items: [
    { to: '/reservas',    icon: '📅', label: 'Reservas' },
    { to: '/prestamos',   icon: '📦', label: 'Préstamos activos' },
  ]},
  { section: 'Análisis', items: [
    { to: '/reportes',    icon: '📈', label: 'Reportes' },
  ]},
];

const NAV_ADMIN = [
  { section: 'Administración', items: [
    { to: '/usuarios',    icon: '👥', label: 'Usuarios' },
  ]},
];

export function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const initial = user ? (user.nombre[0] + user.apellido[0]).toUpperCase() : '??';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>📡 SGPE</h1>
        <p>Comisión Telecomunicaciones</p>
      </div>
      <nav className="sidebar-nav">
        {[...NAV, ...(isAdmin ? NAV_ADMIN : [])].map((section) => (
          <div key={section.section}>
            <div className="nav-section">{section.section}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to} to={item.to}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initial}</div>
          <div>
            <div className="user-name">{user?.nombre} {user?.apellido}</div>
            <div className="user-role">{user?.rol}</div>
          </div>
        </div>
        <button className="btn-logout" onClick={logout}>Cerrar sesión</button>
      </div>
    </aside>
  );
}

export function AppLayout({ children, title }) {
  const { user } = useAuth();
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="topbar">
          <span className="topbar-title">{title}</span>
          <span className="badge-role">{user?.rol}</span>
        </div>
        <div className="page">{children}</div>
      </main>
    </div>
  );
}