import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Alert,
} from '@mui/material';
import { Link } from 'react-router'; // el tema usa Link desde 'react-router' en estas vistas
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from 'src/lib/firebase';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';

/**
 * Formulario para recuperar contraseña (Firebase)
 * - Pide el correo
 * - Envía un email con el enlace de reseteo
 */
const AuthReset = () => {
  const [email, setEmail] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOkMsg('');
    setError('');

    if (!email.trim()) {
      setError('Ingresa tu correo.');
      return;
    }

    setSending(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setOkMsg('Hemos enviado un enlace de recuperación a tu correo.');
    } catch (err: any) {
      const code = err?.code || '';
      let msg = 'No pudimos enviar el correo de recuperación.';
      if (code.includes('auth/invalid-email')) msg = 'Correo inválido.';
      else if (code.includes('auth/user-not-found')) msg = 'No existe un usuario con ese correo.';
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <Box component="form" onSubmit={onSubmit}>
      <Stack>
        <Box>
          <Typography variant="subtitle1" fontWeight={500} component="label" htmlFor="email" mb="5px">
            Correo
          </Typography>
          <CustomTextField
            id="email"
            type="email"
            variant="outlined"
            fullWidth
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          />
        </Box>

        {okMsg && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {okMsg}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Stack>

      <Box mt={2}>
        <Button color="primary" variant="contained" size="large" fullWidth type="submit" disabled={sending}>
          {sending ? 'Enviando...' : 'Enviar enlace de recuperación'}
        </Button>
      </Box>

      <Typography variant="body2" textAlign="center" mt={2}>
        ¿Recordaste tu clave?{' '}
        <Link to="/auth/login" style={{ color: 'var(--mui-palette-primary-main)' }}>
          Inicia sesión
        </Link>
      </Typography>
    </Box>
  );
};

export default AuthReset;
