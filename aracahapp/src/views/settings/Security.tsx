import { Box, Card, Stack, Typography, Divider } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import MfaStatusChip from 'src/components/security/MfaStatusChip';
import { useAuth } from 'src/context/AuthContext';

const Security = () => {
  const { perfil } = useAuth();
  const role = (perfil?.nombre_rol || '').toLowerCase();

  return (
    <PageContainer title="Seguridad" description="Estado de la cuenta y autenticación">
      <Box display="flex" justifyContent="center" mt={2}>
        <Card sx={{ p: 3, width: 720, maxWidth: '96vw' }}>
          <Stack spacing={2}>
            <Typography variant="h5">Seguridad de la cuenta</Typography>
            <Divider />

            <Stack spacing={1}>
              <Typography variant="subtitle1" color="text.secondary">
                Autenticación en dos pasos (2FA)
              </Typography>
              <MfaStatusChip />
              <Typography variant="body2" color="text.secondary">
                {role === 'cliente'
                  ? 'Recomendado activar el 2FA para mayor seguridad.'
                  : 'Como administrador, puedes desactivar 2FA o cambiar el número cuando sea necesario.'}
              </Typography>
            </Stack>
          </Stack>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default Security;
