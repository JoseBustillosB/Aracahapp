import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * - Si no hay sesión → /auth/login
 * - Si hay sesión pero email no verificado → /auth/verify
 *   (permitimos permanecer en /auth/verify para evitar bucles)
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const location = useLocation();

  if (!auth || auth.authLoading) {
    return <div style={{ padding: 20 }}>Cargando sesión...</div>;
  }

  // No logueado
  if (!auth.firebaseUser) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }

  // Logueado pero sin verificar correo → bloquear todo excepto la propia pantalla de verificación
  const onVerifyPage = location.pathname.startsWith('/auth/verify');
  if (!auth.firebaseUser.emailVerified && !onVerifyPage) {
    return <Navigate to="/auth/verify" replace />;
  }

  return <>{children}</>;
}
