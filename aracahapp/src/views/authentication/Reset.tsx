import { Grid, Box, Card, Typography } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import AuthLogo from 'src/layouts/full/shared/logo/AuthLogo';
import AuthReset from './auth/AuthReset';

const Reset = () => {
  return (
    <PageContainer title="Recuperar contraseña" description="Recuperar acceso - Sistema Aracah">
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

              <Typography variant="subtitle1" textAlign="center" color="textSecondary" mb={1}>
                <strong>Tapicería Aracah</strong> — De la fábrica a tu casa.
              </Typography>

              <Typography variant="h5" fontWeight={700} textAlign="center" mb={2}>
                Recuperar contraseña
              </Typography>

              <AuthReset />
            </Card>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default Reset;
