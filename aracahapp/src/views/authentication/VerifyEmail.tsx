// src/views/authentication/VerifyEmail.tsx
import { useEffect, useState } from 'react';
import { Box, Button, Card, Stack, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth } from 'src/lib/firebase';
import { sendEmailVerification, reload } from 'firebase/auth';
import PageContainer from 'src/components/container/PageContainer';
import AuthLogo from 'src/layouts/full/shared/logo/AuthLogo';
import { useAuth } from 'src/context/AuthContext';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { firebaseUser } = useAuth() || {};
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState('');
  const [err, setErr] = useState('');

  // Si ya está verificado (por si vienen manualmente a esta ruta)
  useEffect(() => {
    if (firebaseUser?.emailVerified) {
      navigate('/dashboard', { replace: true });
    }
  }, [firebaseUser, navigate]);

  const resend = async () => {
    setOk('');
    setErr('');
    try {
      if (!auth.currentUser) {
        setErr('No hay sesión activa.');
        return;
      }
      setSending(true);
      await sendEmailVerification(auth.currentUser);
      setOk('Te enviamos un correo de verificación. Revisa tu bandeja (y spam).');
    } catch (e) {
      console.error(e);
      setErr('No se pudo enviar el correo de verificación.');
    } finally {
      setSending(false);
    }
  };

  const refresh = async () => {
    setOk('');
    setErr('');
    try {
      if (!auth.currentUser) {
        setErr('No hay sesión activa.');
        return;
      }
      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        navigate('/dashboard', { replace: true });
      } else {
        setErr('Aún no aparece como verificado. Intenta nuevamente en unos segundos.');
      }
    } catch (e) {
      console.error(e);
      setErr('No se pudo actualizar el estado. Intenta de nuevo.');
    }
  };

  return (
    <PageContainer title="Verifica tu correo" description="Confirma tu dirección de email para continuar">
      <Box
        sx={{
          position: 'relative',
          '&:before': {
            content: '""',
            background: 'radial-gradient(#d2f1df, #d3d7fa, #bad8f4)',
            backgroundSize: '400% 400%',
            animation: 'gradient 15s ease infinite',
            position: 'absolute',
            height: '100%',
            width: '100%',
            opacity: '0.3',
          },
        }}
      >
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '100vh', p: 2 }}>
          <Card elevation={9} sx={{ p: 4, width: '100%', maxWidth: 560 }}>
            <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
              <AuthLogo />
            </Box>

            <Typography variant="h5" fontWeight={700} textAlign="center" mb={1}>
              Verifica tu correo
            </Typography>

            <Typography color="text.secondary" textAlign="center" mb={3}>
              Te enviamos un email de verificación. Abre el enlace de ese correo
              y luego pulsa <b>“Ya verifiqué / Refrescar”</b> para continuar.
            </Typography>

            {ok && <Alert severity="success" sx={{ mb: 2 }}>{ok}</Alert>}
            {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button variant="outlined" onClick={resend} disabled={sending}>
                {sending ? 'Enviando…' : 'Reenviar verificación'}
              </Button>
              <Button variant="contained" onClick={refresh}>
                Ya verifiqué / Refrescar
              </Button>
            </Stack>
          </Card>
        </Stack>
      </Box>
    </PageContainer>
  );
};

export default VerifyEmail;
