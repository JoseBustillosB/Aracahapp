import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Alert,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Link } from 'react-router'; // el tema usa este Link aquí
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from 'src/lib/firebase';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';

/**
 * Registro con el estilo del tema + Firebase:
 * - Campos: nombre, correo, contraseña, confirmar
 * - Crea usuario en Firebase
 * - Actualiza displayName
 * - Fuerza refresh del token y sincroniza en tu API /api/sync-user → (rol 'cliente' por defecto)
 * - Envía email de verificación
 * - Redirige a /auth/verify para que el usuario confirme su correo
 */
const AuthRegister = () => {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [pass1, setPass1] = useState('');
  const [pass2, setPass2] = useState('');
  const [acepta, setAcepta] = useState(true);

  const [error, setError] = useState<string>('');
  const [ok, setOk] = useState<string>(''); // mensaje opcional en pantalla
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');

    // Validaciones simples en cliente
    if (!nombre.trim()) return setError('Ingresa tu nombre.');
    if (!email.trim()) return setError('Ingresa tu correo.');
    if (pass1.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    if (pass1 !== pass2) return setError('Las contraseñas no coinciden.');
    if (!acepta) return setError('Debes aceptar los términos y condiciones.');

    setSubmitting(true);
    try {
      // 1) Crear cuenta en Firebase
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass1);

      // 2) Guardar nombre visible en el perfil
      await updateProfile(cred.user, { displayName: nombre.trim() });

      // 3) Forzar refresh del token para incluir displayName en el claim
      const token = await cred.user.getIdToken(true);

      // 4) Sincronizar en tu API (crea/actualiza usuario con rol 'cliente')
      await fetch('http://localhost:3001/api/sync-user', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      // 5) Enviar correo de verificación
      await sendEmailVerification(cred.user);

      // (opcional) muestra un aviso breve
      setOk('Te enviamos un correo de verificación. Revisa tu bandeja (y spam).');

      // 6) Redirige a la pantalla de verificación
      navigate('/auth/verify', { replace: true });
    } catch (err: any) {
      const code = err?.code || '';
      let msg = 'Error al crear la cuenta';
      if (code.includes('auth/email-already-in-use')) msg = 'Este correo ya está registrado.';
      else if (code.includes('auth/invalid-email')) msg = 'Correo inválido.';
      else if (code.includes('auth/weak-password')) msg = 'La contraseña es muy débil.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={onSubmit}>
      <Stack>
        {/* Nombre */}
        <Box>
          <Typography variant="subtitle1" fontWeight={500} component="label" htmlFor="nombre" mb="5px">
            Nombre completo
          </Typography>
          <CustomTextField
            id="nombre"
            variant="outlined"
            fullWidth
            value={nombre}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNombre(e.target.value)}
          />
        </Box>

        {/* Correo */}
        <Box mt="20px">
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

        {/* Contraseña */}
        <Box mt="20px">
          <Typography variant="subtitle1" fontWeight={500} component="label" htmlFor="pass1" mb="5px">
            Contraseña
          </Typography>
          <CustomTextField
            id="pass1"
            type="password"
            variant="outlined"
            fullWidth
            value={pass1}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPass1(e.target.value)}
          />
        </Box>

        {/* Confirmar contraseña */}
        <Box mt="20px">
          <Typography variant="subtitle1" fontWeight={500} component="label" htmlFor="pass2" mb="5px">
            Confirmar contraseña
          </Typography>
          <CustomTextField
            id="pass2"
            type="password"
            variant="outlined"
            fullWidth
            value={pass2}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPass2(e.target.value)}
          />
        </Box>

        <FormGroup sx={{ mt: 2 }}>
          <FormControlLabel
            control={<Checkbox checked={acepta} onChange={(e) => setAcepta(e.target.checked)} />}
            label={
              <Typography variant="body2" color="text.secondary">
                Acepto los <Link to="/">Términos y condiciones</Link>.
              </Typography>
            }
          />
        </FormGroup>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {ok && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {ok}
          </Alert>
        )}
      </Stack>

      <Box mt={2}>
        <Button color="primary" variant="contained" size="large" fullWidth type="submit" disabled={submitting}>
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
      </Box>
    </Box>
  );
};

export default AuthRegister;
