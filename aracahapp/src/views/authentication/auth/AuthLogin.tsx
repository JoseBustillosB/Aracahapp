import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Button,
  Stack,
  Checkbox,
  Alert,
} from '@mui/material';
import { Link } from 'react-router'; // el tema usa 'react-router' aquí
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  getMultiFactorResolver,
  MultiFactorResolver,
  PhoneMultiFactorGenerator,
  PhoneAuthProvider,
  RecaptchaVerifier,
} from 'firebase/auth';
import { auth } from 'src/lib/firebase';
import { useAuth } from 'src/context/AuthContext';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';

type Props = { title?: string; subtitle: any; subtext: any };

const AuthLogin = ({ title, subtitle, subtext }: Props) => {
  const navigate = useNavigate();

  // Estado global de sesión
  const ctx = useAuth();
  const authLoading = ctx?.authLoading;
  const logged = !!ctx?.firebaseUser;

  // Paso 1: email + password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Paso 2: MFA SMS
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [smsSent, setSmsSent] = useState(false);
  const [verificationId, setVerificationId] = useState<string>('');
  const [smsCode, setSmsCode] = useState('');

  // reCAPTCHA invisible (siempre presente)
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (!authLoading && logged) navigate('/dashboard', { replace: true });
  }, [authLoading, logged, navigate]);

  // Crea (una sola vez) el reCAPTCHA invisible ligado al div con id 'recaptcha-login'
  const ensureRecaptcha = () => {
    if (!recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth,
        'recaptcha-login', // usamos el id del div oculto
        { size: 'invisible' }
      );
    }
    return recaptchaVerifierRef.current!;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    setMfaResolver(null);
    setSmsSent(false);
    setVerificationId('');
    setSmsCode('');

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const code = err?.code || '';

      if (code === 'auth/multi-factor-auth-required') {
        try {
          const resolver = getMultiFactorResolver(auth, err);
          setMfaResolver(resolver);

          const phoneHint = resolver.hints.find(
            (h: any) => h.factorId === PhoneMultiFactorGenerator.FACTOR_ID
          );
          if (!phoneHint) {
            setError('No se encontró un factor SMS configurado.');
            setSubmitting(false);
            return;
          }

          // Monta/obtiene el reCAPTCHA invisible
          const appVerifier = ensureRecaptcha();

          const provider = new PhoneAuthProvider(auth);
          const vId = await provider.verifyPhoneNumber(
            { multiFactorHint: phoneHint, session: resolver.session },
            appVerifier
          );

          setVerificationId(vId);
          setSmsSent(true);
          setError('');
          // detenemos el "submitting" aquí para permitir ingresar el código
          setSubmitting(false);
          return;
        } catch (e) {
          console.error(e);
          setError('No se pudo iniciar el desafío de segundo factor (SMS).');
          setSubmitting(false);
        }
      } else {
        let msg = 'Error al iniciar sesión';
        if (code.includes('auth/invalid-email')) msg = 'Correo inválido';
        else if (code.includes('auth/user-not-found')) msg = 'Usuario no encontrado';
        else if (code.includes('auth/wrong-password')) msg = 'Contraseña incorrecta';
        else if (code.includes('auth/too-many-requests')) msg = 'Demasiados intentos. Intenta más tarde.';
        setError(msg);
        setSubmitting(false);
      }
    }
  };

  const onSubmitSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaResolver || !verificationId) {
      setError('No se pudo validar el segundo factor.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const cred = PhoneAuthProvider.credential(verificationId, smsCode.trim());
      const assertion = PhoneMultiFactorGenerator.assertion(cred);
      await mfaResolver.resolveSignIn(assertion);
      navigate('/dashboard', { replace: true });
    } catch (e) {
      console.error(e);
      setError('Código SMS inválido. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Paso 2: ingresar código SMS (UI idéntica a tu estilo)
  if (mfaResolver && smsSent) {
    return (
      <>
        {title ? (
          <Typography fontWeight="700" variant="h2" mb={1}>
            {title}
          </Typography>
        ) : null}

        {subtext}

        <Box component="form" onSubmit={onSubmitSms}>
          <Stack>
            <Typography variant="subtitle1" color="text.secondary" mb={1}>
              Hemos enviado un código por SMS a tu número registrado. Ingresa el código para continuar.
            </Typography>

            <Box>
              <Typography variant="subtitle1" fontWeight={500} component="label" htmlFor="sms" mb="5px">
                Código SMS
              </Typography>
              <CustomTextField
                id="sms"
                inputMode="numeric"
                variant="outlined"
                fullWidth
                value={smsCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSmsCode(e.target.value)}
              />
            </Box>

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </Stack>

          <Box mt={2}>
            <Button color="primary" variant="contained" size="large" fullWidth type="submit" disabled={submitting}>
              {submitting ? 'Verificando...' : 'Verificar y entrar'}
            </Button>
          </Box>

          {subtitle}
        </Box>

        {/* Div oculto para reCAPTCHA (invisible) */}
        <div id="recaptcha-login" style={{ display: 'none' }} />
      </>
    );
  }

  // Paso 1: login normal (UI intacta)
  return (
    <>
      {title ? (
        <Typography fontWeight="700" variant="h2" mb={1}>
          {title}
        </Typography>
      ) : null}

      {subtext}

      <Box component="form" onSubmit={onSubmit}>
        <Stack>
          {/* Correo */}
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

          {/* Contraseña */}
          <Box mt="25px">
            <Typography variant="subtitle1" fontWeight={500} component="label" htmlFor="password" mb="5px">
              Contraseña
            </Typography>
            <CustomTextField
              id="password"
              type="password"
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            />
          </Box>


          <Stack justifyContent="space-between" direction="row" alignItems="center" my={2}>
            <FormGroup>
              <FormControlLabel
                control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} />}
                label="Recordar este dispositivo"
              />
            </FormGroup>
            <Typography component={Link} to="/auth/reset" fontWeight="500" sx={{ textDecoration: 'none', color: 'primary.main' }}>
              ¿Olvidaste tu contraseña?
            </Typography>
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        </Stack>

        <Box>
          <Button color="primary" variant="contained" size="large" fullWidth type="submit" disabled={submitting}>
            {submitting ? 'Ingresando...' : 'Iniciar sesión'}
          </Button>
        </Box>
      </Box>

      {subtitle}

      {/* Div oculto para reCAPTCHA (invisible) */}
      <div id="recaptcha-login" style={{ display: 'none' }} />
    </>
  );
};

export default AuthLogin;
