// src/routes/Router.tsx
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import React, { lazy } from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';

/* ===== Layouts ===== */
const FullLayout  = lazy(() => import('../layouts/full/FullLayout'));
const BlankLayout = lazy(() => import('../layouts/blank/BlankLayout'));

/* ===== Páginas demo ===== */
const Dashboard       = lazy(() => import('../views/dashboard/page'));
const SamplePage      = lazy(() => import('../views/sample-page/SamplePage'));
const Error           = lazy(() => import('../views/authentication/NotFound'));
const Register        = lazy(() => import('../views/authentication/Register'));
const Login           = lazy(() => import('../views/authentication/Login'));
const TypographyPage  = lazy(() => import('../views/utilities/TypographyPage'));
const Shadow          = lazy(() => import('../views/utilities/Shadow'));
const BasicTable      = lazy(() => import('../views/tables/BasicTable'));
const ExAutoComplete  = lazy(() => import('../views/form-elements/ExAutoComplete'));
const ExButton        = lazy(() => import('../views/form-elements/ExButton'));
const ExCheckbox      = lazy(() => import('../views/form-elements/ExCheckbox'));
const ExRadio         = lazy(() => import('../views/form-elements/ExRadio'));
const ExSlider        = lazy(() => import('../views/form-elements/ExSlider'));
const ExSwitch        = lazy(() => import('../views/form-elements/ExSwitch'));
const FormLayouts     = lazy(() => import('../views/form-layouts/FormLayouts'));
const Reset           = lazy(() => import('../views/authentication/Reset'));
const VerifyEmail     = lazy(() => import('../views/authentication/VerifyEmail'));

/* ===== Pantallas de seguridad extra (MFA SMS) ===== */
const MfaSmsSetup = lazy(() => import('../views/authentication/MfaSmsSetup'));
const Security    = lazy(() => import('src/views/settings/Security'));

/* ===== Vistas de negocio ===== */
const CotizacionesList = lazy(() => import('src/views/cotizaciones/CotizacionesList'));
const CotizacionDetail = lazy(() => import('src/views/cotizaciones/CotizacionDetail'));
const NuevaCotizacion  = lazy(() => import('src/views/cotizaciones/NuevaCotizacion'));

const ClientesList  = lazy(() => import('src/views/clientes/ClientesList'));
const ClienteForm   = lazy(() => import('src/views/clientes/ClienteForm'));
const ClienteView   = lazy(() => import('src/views/clientes/ClienteView'));
const ClienteEdit   = lazy(() => import('src/views/clientes/ClienteEdit'));

/* ===== Pedidos ===== */
const PedidosList = lazy(() => import('src/views/pedidos/PedidosList'));
const PedidoView  = lazy(() => import('src/views/pedidos/PedidoView'));
const PedidoNuevo = lazy(() => import('src/views/pedidos/PedidoNuevo'));

/* ===== Inventario ===== */
const InventarioList = lazy(() => import('src/views/inventario/InventarioList'));
const MaterialView   = lazy(() => import('src/views/inventario/MaterialView'));

/* ===== Producción (OP) ===== */
const OPList = lazy(() => import('src/views/op/OPList'));
const OPView = lazy(() => import('src/views/op/OPView'));

/* ===== Entregas ===== */
const EntregasList = lazy(() => import('src/views/entregas/EntregasList'));
const EntregaView  = lazy(() => import('src/views/entregas/EntregaView'));

/* ===== Usuarios ===== */
const UsuariosList = lazy(() => import('src/views/usuarios/UsuariosList'));

/* ===== Auth context / guards ===== */
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import RoleRoute from '../components/RoleRoute';
import ReportesView from 'src/views/reportes/ReportesView';

const Router = [
  {
    path: '/',
    element: (
      <AuthProvider>
        <FullLayout />
      </AuthProvider>
    ),
    children: [
      /* ===== Dashboard & Settings ===== */
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/settings/mfa-sms',
        element: (
          <ProtectedRoute>
            <MfaSmsSetup />
          </ProtectedRoute>
        ),
      },
      {
        path: '/settings/security',
        element: (
          <ProtectedRoute>
            <Security />
          </ProtectedRoute>
        ),
      },

      /* ===== Clientes ===== */
      {
        path: '/clientes',
        element: (
          <ProtectedRoute>
            <RoleRoute roles={['Vendedor','Supervisor','Admin']}>
              <ClientesList />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/clientes/nuevo',
        element: (
          <ProtectedRoute>
            <RoleRoute roles={['Vendedor','Supervisor','Admin']}>
              <ClienteForm />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/clientes/:id',
        element: (
          <ProtectedRoute>
            <RoleRoute roles={['Vendedor','Supervisor','Admin']}>
              <ClienteView />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/clientes/:id/editar',
        element: (
          <ProtectedRoute>
            <RoleRoute roles={['Vendedor','Supervisor','Admin']}>
              <ClienteEdit />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },

      /* ===== Cotizaciones ===== */
      {
        path: '/cotizaciones',
        element: (
          <ProtectedRoute>
            <RoleRoute roles={['Vendedor','Supervisor','Admin']}>
              <CotizacionesList />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/cotizaciones/nueva',
        element: (
          <ProtectedRoute>
            <RoleRoute roles={['Vendedor','Supervisor','Admin']}>
              <NuevaCotizacion />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/cotizaciones/:id',
        element: (
          <ProtectedRoute>
            <RoleRoute roles={['Vendedor','Supervisor','Admin']}>
              <CotizacionDetail />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/cotizaciones/:id/editar',
        element: (
          <ProtectedRoute>
            <RoleRoute roles={['Vendedor','Supervisor','Admin']}>
              <CotizacionDetail />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },

      /* ===== Pedidos ===== */
      {
        path: '/pedidos',
        element: (
          <ProtectedRoute>
            <RoleRoute roles={['Vendedor','Supervisor','Admin']}>
              <PedidosList />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/pedidos/nuevo',
        element: (
          <ProtectedRoute>
            <RoleRoute roles={['Vendedor','Supervisor','Admin']}>
              <PedidoNuevo />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/pedidos/:id',
        element: (
          <ProtectedRoute>
            <RoleRoute roles={['Vendedor','Supervisor','Admin']}>
              <PedidoView />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },

      /* ===== Inventario ===== */
      {
        path: '/inventario',
        element: (
          <ProtectedRoute>
            <RoleRoute roles={['Vendedor','Supervisor','Admin']}>
              <InventarioList />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/inventario/:id',
        element: (
          <ProtectedRoute>
            <RoleRoute roles={['Vendedor','Supervisor','Admin']}>
              <MaterialView />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },

      /* ===== Producción (OP) ===== */
      {
        path: '/op',
        element: (
          <ProtectedRoute>
            <RoleRoute roles={['Supervisor','Admin']}>
              <OPList />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/op/:id',
        element: (
          <ProtectedRoute>
            <RoleRoute roles={['Supervisor','Admin']}>
              <OPView />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },

      /* ===== Entregas ===== */
      {
        path: '/entregas',
        element: (
          <ProtectedRoute>
            <RoleRoute roles={['Vendedor','Supervisor','Admin']}>
              <EntregasList />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/entregas/:id',
        element: (
          <ProtectedRoute>
            <RoleRoute roles={['Vendedor','Supervisor','Admin']}>
              <EntregaView />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },

      {
        path: '/reportes',
        element: (
          <ProtectedRoute>
            <RoleRoute roles={['Supervisor','Admin']}>
              <ReportesView />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },

      /* ===== Usuarios ===== */
      {
        path: '/usuarios',
        element: (
          <ProtectedRoute>
            <RoleRoute roles={['Supervisor','Admin']}>
              <UsuariosList/>
            </RoleRoute>
          </ProtectedRoute>
        ),
      },

      /* ===== Demo / utilidades ===== */
      { path: '/ui/typography', element: <TypographyPage /> },
      { path: '/ui/shadow', element: <Shadow /> },
      { path: '/sample-page', element: <SamplePage /> },
      { path: '/tables/basic-table', element: <BasicTable /> },
      { path: '/form-layouts', element: <FormLayouts /> },
      { path: '/form-elements/autocomplete', element: <ExAutoComplete /> },
      { path: '/form-elements/button', element: <ExButton /> },
      { path: '/form-elements/checkbox', element: <ExCheckbox /> },
      { path: '/form-elements/radio', element: <ExRadio /> },
      { path: '/form-elements/slider', element: <ExSlider /> },
      { path: '/form-elements/switch', element: <ExSwitch /> },

      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
  {
    path: '/auth',
    element: (
      <AuthProvider>
        <BlankLayout />
      </AuthProvider>
    ),
    children: [
      { path: '/auth/login', element: <Login /> },
      { path: '/auth/register', element: <Register /> },
      { path: '/auth/reset', element: <Reset /> },
      { path: '/auth/verify', element: <VerifyEmail /> },
      { path: '404', element: <Error /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
  { basename: '/' },
];

const router = createBrowserRouter(Router);
export default router;
