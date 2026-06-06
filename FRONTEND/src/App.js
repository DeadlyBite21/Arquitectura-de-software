import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventarioPage from './pages/InventarioPage';
import BitacoraPage from './pages/BitacoraPage';
import MantenimientoPage from './pages/MantenimientoPage';
import ReservasPage from './pages/ReservasPage';
import PrestamosPage from './pages/PrestamosPage';

// Componentes placeholders para páginas que podrían faltar en los Layouts
const ReportesPage = () => <div style={{padding:'2rem'}}>Reportes en construcción</div>;
const UsuariosPage = () => <div style={{padding:'2rem'}}>Gestión de Usuarios en construcción</div>;

// Componente para proteger rutas privadas
const ProtectedRoute = ({ children }) => {
  const { user, loading } = require('./context/AuthContext').useAuth();
  if (loading) return <div className="spinner" style={{marginTop: '20vh'}} />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/inventario" element={<ProtectedRoute><InventarioPage /></ProtectedRoute>} />
          <Route path="/bitacora" element={<ProtectedRoute><BitacoraPage /></ProtectedRoute>} />
          <Route path="/mantenimiento" element={<ProtectedRoute><MantenimientoPage /></ProtectedRoute>} />
          <Route path="/reservas" element={<ProtectedRoute><ReservasPage /></ProtectedRoute>} />
          <Route path="/prestamos" element={<ProtectedRoute><PrestamosPage /></ProtectedRoute>} />
          <Route path="/reportes" element={<ProtectedRoute><ReportesPage /></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute><UsuariosPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
