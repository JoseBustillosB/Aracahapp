import {
  IconButton,
  Box,
  AppBar,
  useMediaQuery,
  Toolbar,
  styled,
  Stack,
  // Button, // <- eliminado (era el de publicidad)
  Menu,
  MenuItem,
  Typography,
  Badge,
} from '@mui/material';
import Profile from './Profile';
import Logo from '../../shared/logo/Logo';
import { useEffect, useState, useContext } from 'react';
import { Icon } from '@iconify/react';
import { DashboardContext } from 'src/context/DashboardContext';
import { IconBell } from '@tabler/icons-react';

const Header = () => {
  const [_height, setHeight] = useState('0px');
  const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up('lg'));

  const toggleWidth = '256px';

  const AppBarStyled = styled(AppBar)(({ theme }) => ({
    boxShadow: 'none !important',
    background: theme.palette.primary.main,
    justifyContent: 'center',
    position: 'fixed',
    top: 0, // ⬅⬅⬅ pegamos el header arriba (antes 72px/157px)
    backdropFilter: 'blur(4px)',
    [theme.breakpoints.down('md')]: {
      minHeight: '64px',
      top: 0, // ⬅⬅⬅ también en móviles
    },
  }));

  const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
    width: '100%',
    color: theme.palette.warning.contrastText,
    gap: '8px',
    minHeight: 64, // aseguramos altura consistente (offset 64px ya lo aplicas en PageWrapper)
  }));

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setHeight('0px');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { isMobileSidebar, setIsMobileSidebar } = useContext(DashboardContext);

  // notification
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const handleClick = (event: any) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
    });
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <AppBarStyled color="default">
        <ToolbarStyled>
          {/* Logo / botón sidebar */}
          {lgUp ? (
            <Box sx={{ width: toggleWidth }}>
              <Logo />
            </Box>
          ) : (
            <IconButton
              color="inherit"
              aria-label="menu"
              onClick={lgUp ? () => {} : () => setIsMobileSidebar(!isMobileSidebar)}
            >
              <Icon icon="solar:list-bold" height={20} />
            </IconButton>
          )}

          {/* Notificaciones */}
          <IconButton
            aria-label="show notifications"
            color="inherit"
            aria-controls="notification-menu"
            aria-haspopup="true"
            onClick={handleClick}
          >
            <Badge variant="dot" color="primary">
              <IconBell size="21" stroke="1.5" />
            </Badge>
          </IconButton>

          <Menu
            id="notification-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            anchorReference="anchorPosition"
            anchorPosition={menuPosition ? { top: menuPosition.top, left: menuPosition.left } : undefined}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  boxShadow: 9,
                  minWidth: '200px',
                },
              },
            }}
          >
            <MenuItem onClick={handleClose}>
              <Typography variant="body1">Item 1</Typography>
            </MenuItem>
            <MenuItem onClick={handleClose}>
              <Typography variant="body1">Item 2</Typography>
            </MenuItem>
          </Menu>

          <Box flexGrow={1} />

          {/* Acciones derechas: quitamos publicidad, dejamos perfil */}
          <Stack spacing={2} direction="row" alignItems="center">
            {/* Botón publicitario REMOVIDO
            <Button
              variant="contained"
              color="success"
              target="_blank"
              href="https://www.wrappixel.com/templates/materialpro-react-admin/?ref=376#demos"
            >
              Check Pro Template
            </Button> */}
            <Profile />
          </Stack>
        </ToolbarStyled>
      </AppBarStyled>
    </>
  );
};

export default Header;
