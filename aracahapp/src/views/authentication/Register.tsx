import { Link } from 'react-router';
import { Grid, Box, Card, Stack, Typography } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import AuthRegister from './auth/AuthRegister';
import AuthLogo from 'src/layouts/full/shared/logo/AuthLogo';

const Register = () => {
  return (
    <PageContainer title="Registro" description="Crear cuenta en Sistema Aracah">
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
        <Grid container spacing={0} justifyContent="center" sx={{ minHeight: '100vh' }}>
          <Grid
            display="flex"
            justifyContent="center"
            alignItems="center"
            size={{ xs: 12, sm: 12, lg: 4, xl: 3 }}
          >
            <Card elevation={9} sx={{ p: 4, zIndex: 1, width: '100%', maxWidth: 500 }}>
              <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                <AuthLogo />
              </Box>

              {/* Texto superior (branding) */}
              <Typography variant="subtitle1" textAlign="center" color="textSecondary" mb={1}>
                <strong>Tapicería Aracah</strong> — De la fábrica a tu casa.
              </Typography>

              {/* Formulario de registro */}
              <AuthRegister />

              {/* Link a login */}
              <Stack direction="row" spacing={1} justifyContent="center" mt={3}>
                <Typography color="textSecondary" variant="h6" fontWeight={500}>
                  ¿Ya tienes cuenta?
                </Typography>
                <Typography
                  component={Link}
                  to="/auth/login"
                  fontWeight="500"
                  sx={{ textDecoration: 'none', color: 'primary.main' }}
                >
                  Inicia sesión
                </Typography>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default Register;
