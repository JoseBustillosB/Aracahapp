import { Link } from 'react-router';
import { Grid, Box, Card, Stack, Typography } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import AuthLogin from './auth/AuthLogin';
import AuthLogo from 'src/layouts/full/shared/logo/AuthLogo';

/**
 * Página de inicio de sesión personalizada para Tapicería Aracah.
 * Incluye el logo, textos personalizados y el título dinámico del navegador.
 */
const Login2 = () => {
  return (
    // ✅ PageContainer establece el título de la pestaña
    <PageContainer
      title="Login"
      description="Inicio de sesión del sistema Tapicería Aracah"
    >
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
        <Grid
          container
          spacing={0}
          justifyContent="center"
          sx={{ height: '100vh' }}
        >
          <Grid
            display="flex"
            justifyContent="center"
            alignItems="center"
            size={{ xs: 12, sm: 12, lg: 4, xl: 3 }}
          >
            <Card
              elevation={9}
              sx={{ p: 4, zIndex: 1, width: '100%', maxWidth: 500 }}
            >
              {/* 🔹 Logo centrado */}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                mb={1}
              >
                <AuthLogo />
              </Box>

              {/* 🔹 Formulario de inicio de sesión */}
              <AuthLogin
                subtext={
                  <Typography
                    variant="subtitle1"
                    textAlign="center"
                    color="textSecondary"
                    mb={1}
                  >
                    <strong>Tapicería Aracah</strong> — De la fábrica a tu casa.
                  </Typography>
                }
                subtitle={
                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="center"
                    mt={3}
                  >
                    <Typography
                      color="textSecondary"
                      variant="h6"
                      fontWeight={500}
                    >
                      ¿Nuevo en Aracah?
                    </Typography>
                    <Typography
                      component={Link}
                      to="/auth/register"
                      fontWeight="500"
                      sx={{
                        textDecoration: 'none',
                        color: 'primary.main',
                      }}
                    >
                      Crear una cuenta
                    </Typography>
                  </Stack>
                }
              />
            </Card>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default Login2;
