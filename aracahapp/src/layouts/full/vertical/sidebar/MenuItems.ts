import { uniqueId } from 'lodash';

export interface MenuitemsType {
  [x: string]: any;
  id?: string;
  navlabel?: boolean;
  subheader?: string;
  title?: string;
  icon?: any;
  href?: string;
  children?: MenuitemsType[];
  chip?: string;
  chipColor?: string;
  variant?: string;
  external?: boolean;
  // nuevo: qué roles pueden ver este ítem (admin, supervisor, vendedor)
  roles?: string[];
}


const Menuitems: MenuitemsType[] = [
  // ============================
  // SECCIÓN PRINCIPAL
  // ============================
  {
    navlabel: true,
    subheader: 'Principal',
  },
  {
    id: uniqueId(),
    title: 'Dashboard',
    icon: 'layers-minimalistic-line-duotone',
    href: '/dashboard',          // Coincide con Router.tsx
  },

  // ============================
  // MÓDULOS ARACAH
  // ============================
  {
    navlabel: true,
    subheader: 'Módulos Aracah',
  },
  {
    id: uniqueId(),
    title: 'Clientes',
    icon: 'user-circle-linear',
    href: '/clientes',
  },
  {
    id: uniqueId(),
    title: 'Cotizaciones',
    icon: 'bill-list-linear',
    href: '/cotizaciones',
  },
  {
    id: uniqueId(),
    title: 'Pedidos',
    icon: 'list-check-linear',
    href: '/pedidos',
  },
  {
    id: uniqueId(),
    title: 'Inventario',
    icon: 'box-minimalistic-linear',
    href: '/inventario',          // Vista InventarioList
    roles: ['admin', 'supervisor'],
  },
  {
    id: uniqueId(),
    title: 'Producción (OP)',
    icon: 'atom-linear',
    href: '/op',
    roles: ['admin', 'supervisor'],
  },
  {
    id: uniqueId(),
    title: 'Entregas',
    icon: 'calendar-linear',
    href: '/entregas',
  },
  {
    id: uniqueId(),
    title: 'Reportes',
    icon: 'chart-linear',
    href: '/reportes',
    roles: ['admin', 'supervisor'],
  },

  // ============================
  // SEGURIDAD / CONFIGURACIÓN
  // ============================
  {
    navlabel: true,
    subheader: 'Seguridad',
  },
  {
    id: uniqueId(),
    title: 'Seguridad de la cuenta',
    icon: 'shield-user-linear',
    href: '/settings/security',

  },
  {
    id: uniqueId(),
    title: '2FA por SMS',
    icon: 'lock-keyhole-minimalistic-linear',
    href: '/settings/mfa-sms',
  },

  {
  id: uniqueId(),
  title: 'Usuarios',
  icon: 'users-group-rounded-linear',
  href: '/usuarios',
  roles: ['admin',], // solo estos lo ven
}

  // (Si quieres puedes dejar una sección de “Utilidades” con las páginas demo,
  // pero por ahora la quito para que el menú quede limpio y enfocado al sistema.)
];

export default Menuitems;
