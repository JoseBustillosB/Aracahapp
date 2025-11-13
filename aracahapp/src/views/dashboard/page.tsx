'use client';
import { Grid, Box, Typography, Card } from '@mui/material';
import SalesOverview from 'src/components/dashboard/TheSalesOverview';
import OurVisitors from 'src/components/dashboard/TheOurVisitors';
import ProfileCard from 'src/components/dashboard/TheProfileCard';
import ActivityTimeline from 'src/components/dashboard/TheActivityTimeline';
import MyContacts from 'src/components/dashboard/TheMyContacts';
import MfaStatusChip from 'src/components/security/MfaStatusChip';
import { useAuth } from 'src/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { multiFactor } from 'firebase/auth';
import { useMemo } from 'react';
import { auth } from 'src/lib/firebase';

export default function Dashboard() {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();

  // Detectar si el usuario ya tiene 2FA activado
  const isMfaOn = useMemo(() => {
    const user = auth.currentUser || firebaseUser;
    if (!user) return false;
    const enrolled = multiFactor(user).enrolledFactors || [];
    return enrolled.length > 0;
  }, [firebaseUser]);

  return (
    <Box>
      {/* Encabezado del dashboard */}
      <Card
        sx={{
          mb: 3,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="h5" fontWeight={600}>
          Panel de Control
        </Typography>

        {/* Chip compacto: clic solo si el 2FA está inactivo */}
        <Box
          sx={{
            cursor: isMfaOn ? 'default' : 'pointer',
            '&:hover': !isMfaOn ? { opacity: 0.9 } : {},
          }}
          onClick={() => {
            if (!isMfaOn) navigate('/settings/mfa-sms');
          }}
          title={
            isMfaOn
              ? '2FA activo'
              : 'Haz clic para configurar la autenticación en dos pasos'
          }
        >
          <MfaStatusChip compact />
        </Box>
      </Card>

      {/* Contenido principal del dashboard */}
      <Grid container spacing={3}>
        <Grid
          size={{
            xs: 12,
            lg: 8,
          }}
        >
          <SalesOverview />
        </Grid>

        <Grid
          size={{
            xs: 12,
            lg: 4,
          }}
        >
          <OurVisitors />
        </Grid>

        <Grid
          size={{
            xs: 12,
            lg: 4,
          }}
        >
          <Grid container spacing={3}>
            <Grid size={12}>
              <ProfileCard />
            </Grid>
            <Grid size={12}>
              <MyContacts />
            </Grid>
          </Grid>
        </Grid>

        <Grid
          size={{
            xs: 12,
            lg: 8,
          }}
        >
          <ActivityTimeline />
        </Grid>
      </Grid>
    </Box>
  );
}
