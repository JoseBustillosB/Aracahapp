import { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button, Stack, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  reload,
} from 'firebase/auth';
import { auth } from 'src/lib/firebase';
import { useAuth } from 'src/context/AuthContext';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';

const MfaSmsSetup = () => {
  const navigate = useNavigate();
  const { firebaseUser, authLoading } = useAuth();

  // UI / estado
  const [phone, setPhone] = useState('+5049XXXXXXXX'); // formato E.164
  const [smsCode, setSmsCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState('');
  const [error, setError] = useState('');

  // reCAPTCHA invisible
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const ensureRecaptcha = () => {
    if (!recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth,
        'recaptcha-enroll', // div oculto
        { size: 'invisible' }
      );
    }
    return recaptchaVerifierRef.current!;
  };

  // Guardas básicos
  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      navigate('/auth/login', { replace: true });
    }
  }, [authLoading, firebaseUser, navigate]);

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');
    setSubmitting(true);

    try {
      if (!firebaseUser) throw new Error('Debes iniciar sesión primero.');
      // 1) Obtener sesión MFA
      const mfaSession = await multiFactor(firebaseUser).getSession();

      // 2) Montar / obtener reCAPTCHA invisible
      const appVerifier = ensureRecaptcha();

      // 3) Enviar SMS
      const provider = new PhoneAuthProvider(auth);
      const vId = await provider.verifyPhoneNumber(
        { phoneNumber: phone.trim(), session: mfaSession },
        appVerifier
      );

      setVerificationId(vId);
      setSmsSent(true);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'No se pudo enviar el SMS. Revisa el número e intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');
    setSubmitting(true);
    try {
      if (!firebaseUser) throw new Error('Debes iniciar sesión primero.');
      if (!verificationId) throw new Error('Primero envía el SMS.');

      const cred = PhoneAuthProvider.credential(verificationId, smsCode.trim());
      const assertion = PhoneMultiFactorGenerator.assertion(cred);

      await multiFactor(firebaseUser).enroll(assertion, 'Mi teléfono');
      await reload(firebaseUser);

      setOk('¡Segundo factor por SMS activado correctamente!');
      setSmsCode('');
      setVerificationId('');
      setSmsSent(false);
    } catch (e: any) {
      console.error(e);
      const msg =
        e?.code === 'auth/invalid-verification-code'
          ? 'Código SMS inválido.'
          : e?.message || 'No se pudo completar el enrolamiento.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Título simple en tu mismo estilo */}
      <Typography fontWeight="700" variant="h2" mb={1}>
        Activar 2FA por SMS
      </Typography>

      <Typography variant="body2" color="text.secondary" mb={2}>
        Se enviará un código por SMS para enrolar tu segundo factor.
      </Typography>

      {/* Paso 1: enviar SMS */}
      {!smsSent ? (
        <Box component="form" onSubmit={handleSendSms}>
          <Stack>
            <Box>
              <Typography variant="subtitle1" fontWeight={500} component="label" htmlFor="phone" mb="5px">
                Número de teléfono (E.164)
              </Typography>
              <CustomTextField
                id="phone"
                variant="outlined"
                fullWidth
                placeholder="+5049XXXXXXXX"
                value={phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
              />
            </Box>

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {ok && <Alert severity="success" sx={{ mt: 2 }}>{ok}</Alert>}
          </Stack>

          <Box mt={2}>
            <Button color="primary" variant="contained" size="large" fullWidth type="submit" disabled={submitting}>
              {submitting ? 'Enviando...' : 'Enviar SMS'}
            </Button>
          </Box>

          {/* reCAPTCHA invisible */}
          <div id="recaptcha-enroll" style={{ display: 'none' }} />
        </Box>
      ) : (
        // Paso 2: ingresar código y enrolar
        <Box component="form" onSubmit={handleEnroll}>
          <Stack>
            <Typography variant="subtitle1" color="text.secondary" mb={1}>
              Te enviamos un código por SMS. Escríbelo para activar el 2FA.
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
            {ok && <Alert severity="success" sx={{ mt: 2 }}>{ok}</Alert>}
          </Stack>

          <Stack direction="row" spacing={2} mt={2}>
            <Button color="primary" variant="contained" size="large" fullWidth type="submit" disabled={submitting || !smsCode}>
              {submitting ? 'Verificando...' : 'Enrolar segundo factor'}
            </Button>
            <Button
              color="inherit"
              variant="outlined"
              size="large"
              fullWidth
              type="button"
              onClick={() => {
                setSmsSent(false);
                setSmsCode('');
                setVerificationId('');
                setError('');
                setOk('');
              }}
            >
              Volver
            </Button>
          </Stack>

          {/* reCAPTCHA invisible */}
          <div id="recaptcha-enroll" style={{ display: 'none' }} />
        </Box>
      )}
    </>
  );
};

export default MfaSmsSetup;
