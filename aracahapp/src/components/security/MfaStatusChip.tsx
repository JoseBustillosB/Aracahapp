import { useMemo, useState } from 'react';
import { Chip, Stack, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { multiFactor } from 'firebase/auth';
import { auth } from 'src/lib/firebase';
import { useAuth } from 'src/context/AuthContext';

type Props = {
  // Si quieres ocultar botones (por ejemplo en encabezado compacto)
  compact?: boolean;
};

const MfaStatusChip = ({ compact = false }: Props) => {
  const navigate = useNavigate();
  const { firebaseUser, perfil } = useAuth();
  const [err, setErr] = useState('');

  const { isMfaOn, factors } = useMemo(() => {
    const u = auth.currentUser || firebaseUser;
    const list = u ? multiFactor(u).enrolledFactors : [];
    return {
      isMfaOn: (list?.length || 0) > 0,
      factors: list || [],
    };
  }, [firebaseUser]);

  const isAdmin = (perfil?.nombre_rol || '').toLowerCase() === 'admin';

  const handleDeactivate = async () => {
    setErr('');
    try {
      const u = auth.currentUser || firebaseUser;
      if (!u) throw new Error('Sesión no disponible.');
      const list = multiFactor(u).enrolledFactors;
      if (!list.length) return;

      // En este ejemplo, desinscribimos el primer factor (si hay varios, puedes listar/seleccionar)
      const uid = list[0].uid;
      await multiFactor(u).unenroll(uid);
    } catch (e: any) {
      setErr(e?.message || 'No se pudo desactivar el 2FA.');
    }
  };

  return (
    <Stack direction="column" spacing={1}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <Chip
          size="small"
          color={isMfaOn ? 'success' : 'warning'}
          label={isMfaOn ? '2FA: ACTIVO' : '2FA: INACTIVO'}
        />

        {!compact && !isMfaOn && (perfil?.nombre_rol || '').toLowerCase() === 'cliente' && (
          <Button variant="contained" size="small" onClick={() => navigate('/settings/mfa-sms')}>
            Activar 2FA
          </Button>
        )}

        {!compact && isMfaOn && isAdmin && (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" size="small" onClick={handleDeactivate}>
              Desactivar 2FA
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                // Estrategia simple para “cambiar número”:
                // 1) desactivar 2FA (admin)
                // 2) redirigir al enrolamiento para inscribir el nuevo número
                navigate('/settings/mfa-sms');
              }}
            >
              Cambiar número
            </Button>
          </Stack>
        )}
      </Stack>

      {err && <Alert severity="error">{err}</Alert>}

      {/* Opcional: muestra factores enrolados si eres admin */}
      {isAdmin && factors?.length > 0 && (
        <Chip
          size="small"
          variant="outlined"
          label={`Factores: ${factors.map(f => f.displayName || 'SMS').join(', ')}`}
        />
      )}
    </Stack>
  );
};

export default MfaStatusChip;
