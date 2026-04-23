import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ children, role }) {
  const { token, user } = useAuthStore();
  const loc = useLocation();
  if (!token) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  if (role && user?.role !== role) return <Navigate to="/" replace />;
  return children;
}
