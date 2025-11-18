// src/layouts/full/vertical/sidebar/SidebarItems.tsx
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import {
  Sidebar as MUI_Sidebar,
  Menu,
  MenuItem,
  Submenu,
} from 'react-mui-sidebar';

import Menuitems, { MenuitemsType } from './MenuItems';
import { Icon } from '@iconify/react';
import { useAuth } from 'src/context/AuthContext';

// 🔹 Recursivo: filtrar items según rol
const filterByRole = (items: MenuitemsType[], role: string): MenuitemsType[] => {
  return items
    .filter((item) => {
      // Permitir siempre los encabezados
      if (item.navlabel) return true;

      // Si no tiene roles → visible para todos
      if (!item.roles || item.roles.length === 0) return true;

      // Tiene lista de roles → permitir solo si coincide
      return item.roles.map((r: string) => r.toLowerCase()).includes(role);
    })
    .map((item) => {
      // Filtrar hijos recursivamente
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterByRole(item.children, role);
        return { ...item, children: filteredChildren };
      }
      return item;
    })
    // Eliminar items sin hijos cuando todos fueron filtrados
    .filter(
      (item) => !(item.children && item.children.length === 0 && !item.href),
    );
};

// 🔹 Renderizado de menu items
const renderMenuItems = (items: any[], pathDirect: string) => {
  return items.map((item) => {
    // Encabezados / subheaders
    if (item.subheader) {
      return (
        <Box
          sx={{
            margin: '0 -24px',
            textTransform: 'uppercase',
            '& .MuiListSubheader-root': { fontWeight: '600 !important' },
          }}
          key={item.subheader}
        >
          <Menu subHeading={item.subheader} key={item.subheader}>
            <></>
          </Menu>
        </Box>
      );
    }

    // Submenús
    if (item.children && item.children.length > 0) {
      return (
        <Submenu
          key={item.id}
          title={item.title}
          borderRadius="999px"
          icon={
            item.icon ? (
              <Icon icon={'solar:' + item.icon} width="20" height="20" />
            ) : (
              <Icon icon="mdi:circle" width="6" height="6" />
            )
          }
        >
          {renderMenuItems(item.children, pathDirect)}
        </Submenu>
      );
    }

    // Ítems normales
    const href: string = item.href || '/';
    const isExternal =
      href.startsWith('http://') || href.startsWith('https://');

    // 👇 usamos any para no pelear con los tipos de la librería
    const commonProps: any = {
      key: item.id,
      isSelected: pathDirect === href,
      borderRadius: '999px',
      icon: item.icon ? (
        <Icon icon={'solar:' + item.icon} width="20" height="20" />
      ) : (
        <Icon icon="mdi:circle" width="6" height="6" />
      ),
      badge: !!item.chip,
      badgeContent: item.chip || '',
      badgeColor: 'secondary',
      badgeTextColor: '#1b84ff',
      disabled: item.disabled,
    };

    // 🔸 Enlace externo → que abra en nueva pestaña
    if (isExternal) {
      return (
        <MenuItem
          {...commonProps}
          component="a"
          link={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Typography
            component="span"
            color={pathDirect === href ? '#fff' : 'inherit'}
          >
            {item.title}
          </Typography>
        </MenuItem>
      );
    }

    // 🔸 Enlace interno → SPA con react-router
    return (
      <MenuItem
        {...commonProps}
        component={RouterLink as any}
        link={href}
      >
        <Typography
          component="span"
          color={pathDirect === href ? '#fff' : 'inherit'}
        >
          {item.title}
        </Typography>
      </MenuItem>
    );
  });
};

const SidebarItems = () => {
  const location = useLocation();
  const pathDirect = location.pathname;

  const authCtx: any = useAuth() || {};
  const perfil = authCtx?.perfil;

  const rawRole =
    (perfil?.nombre_rol ||
      perfil?.rol ||
      perfil?.role ||
      perfil?.nombreRol ||
      '') as string;

  const role = (rawRole || 'admin').toString().toLowerCase();

  // 🔹 Aplicar filtro según rol
  const visibleItems = filterByRole(Menuitems, role);

  return (
    <Box sx={{ px: '20px', overflowX: 'hidden' }}>
      <MUI_Sidebar
        width={'100%'}
        showProfile={false}
        themeColor={'#43ced7'}
        themeSecondaryColor={'#1b84ff1a'}
      >
        {renderMenuItems(visibleItems, pathDirect)}
      </MUI_Sidebar>
    </Box>
  );
};

export default SidebarItems;
