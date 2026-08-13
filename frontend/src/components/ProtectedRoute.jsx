// A component whose entire job is to accept a `children` prop and decide
// whether to render it — a classic small, composable React component.
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-text">Loading session…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
