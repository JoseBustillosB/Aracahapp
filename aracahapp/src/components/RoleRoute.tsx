import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleRoute({
  roles,
  children,
}: {
  roles: string[];
  children: ReactNode;
}) {
  const auth = useAuth(); // nuestro hook nunca devuelve null/undefined

  if (auth.authLoading || auth.profileLoading) {
    return <div style={{ padding: 20 }}>Cargando permisos...</div>;
  }
  if (!auth.firebaseUser) {
    return <Navigate to="/auth/login" replace />;
  }

  const userRole = (auth.perfil?.nombre_rol || '').trim().toLowerCase();
  const allowed = roles.map((r) => r.trim().toLowerCase());
  if (!allowed.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
