import { Box, Avatar, Typography, Chip } from '@mui/material';
import ProfileImg from 'src/assets/images/profile/user-1.jpg';
import SidebarProfileBgImg from 'src/assets/images/backgrounds/sidebar-profile-bg.jpg';
import { useAuth } from 'src/context/AuthContext';

export const Profile = () => {
  // Leemos lo que expone tu AuthContext
  const auth: any = useAuth() || {};
  const user = auth.user;      // suele ser el usuario de Firebase
  const perfil = auth.perfil;  // suele venir de /api/sync-user (nombre, rol, etc.)

  // Nombre a mostrar (orden de prioridad)
  const displayName: string =
    perfil?.nombre ||
    user?.displayName ||
    user?.email ||
    'Usuario Aracah';

  // Rol a mostrar en el badge
  const roleName: string =
    perfil?.nombre_rol ||
    perfil?.rol ||
    user?.role ||
    'Usuario';

  // Avatar: si Firebase tiene foto, la usamos; si no, usamos la imagen por defecto
  const avatarSrc: string | undefined = user?.photoURL || ProfileImg;

  return (
    <Box
      sx={{
        backgroundImage: `url(${SidebarProfileBgImg})`,
        borderRadius: '0 !important',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'top center',
      }}
    >
      {/* Avatar */}
      <Box
        py="28px"
        borderRadius="0 !important"
        sx={{
          px: '30px',
        }}
      >
        <Box className="profile-img" position="relative">
          <Avatar
            alt={displayName}
            src={avatarSrc}
            sx={{ height: 50, width: 50 }}
          />
        </Box>
      </Box>

      {/* Nombre + badge de rol */}
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        sx={{
          py: '8px',
          px: 2,
          bgcolor: 'rgba(0,0,0,0.4)',
          borderRadius: '0 !important',
          width: '100%',
        }}
      >
        <Typography
          variant="h6"
          fontSize="15px"
          color="white"
          fontWeight="500"
          sx={{
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            maxWidth: '100%',
          }}
        >
          {displayName}
        </Typography>

        <Chip
          label={roleName}
          size="small"
          variant="outlined"
          sx={{
            mt: 0.5,
            height: 20,
            fontSize: 10,
            borderColor: 'rgba(255,255,255,0.7)',
            color: 'rgba(255,255,255,0.95)',
          }}
        />
      </Box>
    </Box>
  );
};
