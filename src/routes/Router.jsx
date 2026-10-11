import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Forgot from '../pages/Forgot';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import { useAuth } from '../contexts/AuthContext';

function RouteLoading() {
  return (
    <main className="route-loading" role="status" aria-live="polite">
      <span className="loading-spinner" aria-hidden="true" />
      <p>Verificando sua sessão…</p>
    </main>
  );
}

function PrivateRoutes() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <RouteLoading />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function GuestRoutes() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <RouteLoading />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

export default function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Routes>
      <Route element={<GuestRoutes />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot" element={<Forgot />} />
      </Route>
      <Route element={<PrivateRoutes />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
      <Route path="/" element={isLoading ? <RouteLoading /> : <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
