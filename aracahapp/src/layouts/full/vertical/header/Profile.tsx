import { useState, MouseEvent } from 'react';
import { Link } from 'react-router'; // el tema usa este Link en los items superiores
import { Box, Menu, Avatar, Typography, IconButton, Button } from '@mui/material';
import * as dropdownData from './data';
import ProfileImg from 'src/assets/images/profile/user-1.jpg';

// importar tu contexto y navigate para redirigir tras logout
import { useAuth } from 'src/context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  const { logout } = useAuth() || {}; // logout viene del AuthContext (cierra sesión de Firebase)

  // Tipamos bien el ancla del menú
  const [anchorEl2, setAnchorEl2] = useState<null | HTMLElement>(null);

  const handleClick2 = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl2(event.currentTarget);
  };

  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  // Al hacer logout: cierra sesión, cierra el menú y navega a /auth/login
  const handleLogout = async () => {
    try {
      await logout?.(); // cierra sesión en Firebase (AuthContext)
    } finally {
      handleClose2();
      navigate('/auth/login', { replace: true });
    }
  };

  return (
    <Box>
      <IconButton
        size="large"
        aria-label="profile menu"
        color="inherit"
        aria-controls="profile-menu"
        aria-haspopup="true"
        sx={{
          ...(typeof anchorEl2 === 'object' && {
            color: 'primary.main',
          }),
        }}
        onClick={handleClick2}
      >
        <Avatar
          src={ProfileImg}
          alt={'ProfileImg'}
          sx={{ width: 35, height: 35 }}
        />
      </IconButton>

      <Menu
        id="profile-menu"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        sx={{
          '& .MuiMenu-paper': {
            width: '240px',
            p: 0,
          },
        }}
      >
        {/* Items superiores (Profile / Account / Dashboard) */}
        <Box paddingX={2}>
          {dropdownData.profile.map((profile) => (
            <Box key={profile.title}>
              <Box
                sx={{
                  px: 2,
                  borderRadius: '9px',
                  py: '10px',
                  '&:hover': { backgroundColor: 'primary.light' },
                }}
                className="hover-text-primary"
              >
                <Link to={profile.href} onClick={handleClose2}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={500}
                    color="textPrimary"
                    className="text-hover"
                    component="span"
                    noWrap
                    sx={{ width: '240px' }}
                  >
                    {profile.title}
                  </Typography>
                </Link>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Botón de Logout */}
        <Box p={0}>
          <Box
            sx={{
              px: 2,
              py: '10px',
              '&:hover': { backgroundColor: 'primary.light' },
            }}
            className="hover-text-primary"
          >
            {/*ya NO usamos Link aquí: cerramos sesión y luego redirigimos */}
            <Button
              variant="outlined"
              color="primary"
              sx={{ width: '100%' }}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
        </Box>
      </Menu>
    </Box>
  );
};

export default Profile;
