import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "../lib/firebase";

/** ================== Tipos ================== */
export interface Perfil {
  id_usuario: number;
  nombre: string;
  correo: string;
  nombre_rol: string;
}

export interface AuthContextType {
  firebaseUser: User | null;
  perfil: Perfil | null;
  idToken: string | null;
  authLoading: boolean;     // Estado de Firebase (true mientras resolvemos sesión)
  profileLoading: boolean;  // Perfil desde tu API (se carga en paralelo)
  logout: () => void;
}

/** 
 * createContext con undefined: obliga a usar el hook dentro del Provider
 * y nos permite un hook no-nullable.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** ================== Provider ================== */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthContextType>({
    firebaseUser: null,
    perfil: null,
    idToken: null,
    authLoading: true,
    profileLoading: false,
    logout: () => signOut(auth),
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      // No autenticado
      if (!user) {
        setState({
          firebaseUser: null,
          perfil: null,
          idToken: null,
          authLoading: false,
          profileLoading: false,
          logout: () => signOut(auth),
        });
        return;
      }

      // Autenticado
      try {
        // 1) Token para tu backend
        const token = await user.getIdToken();

        // 2) Actualizamos estado base y marcamos que el perfil va en paralelo
        setState((prev) => ({
          ...prev,
          firebaseUser: user,
          idToken: token,
          authLoading: false,   // ✅ Ya puedes renderizar rutas protegidas
          profileLoading: true, // 🔄 Perfil se trae en background
        }));

        // 3) Traer/crear perfil en tu API (no bloquea UI)
        const res = await fetch("http://localhost:3001/api/sync-user", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        setState((prev) => ({
          ...prev,
          perfil: (data && data.perfil) ? data.perfil as Perfil : null,
          profileLoading: false,
        }));
      } catch (e) {
        console.error("Auth init error:", e);
        setState({
          firebaseUser: null,
          perfil: null,
          idToken: null,
          authLoading: false,
          profileLoading: false,
          logout: () => signOut(auth),
        });
      }
    });

    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
}

/** ================== Hook seguro ==================
 * Siempre devuelve AuthContextType (no null/undefined).
 * Si se usa fuera de <AuthProvider>, lanza un error claro en desarrollo.
 */
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
