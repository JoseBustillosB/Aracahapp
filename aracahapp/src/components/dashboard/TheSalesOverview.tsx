/* =====================================================
   DASHBOARD DE Mis ventas por día (últimos 7 días)
===================================================== */

import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Stack, Typography, Box } from '@mui/material';
import DashboardCard from '../shared/DashboardCard';
import { useAuth } from 'src/context/AuthContext';

const Chart = React.lazy(() => import('react-apexcharts'));

type VentaDiaItem = { fecha: string; subtotal: number; impuesto: number; total: number };

const SalesOverview = () => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;

  const authCtx: any = useAuth() || {};
  const { idToken, firebaseUser, perfil } = authCtx;

  const rawRole =
    (perfil?.nombre_rol ||
      perfil?.rol ||
      perfil?.nombreRol ||
      perfil?.role ||
      '') as string;
  const role = (rawRole || 'admin').toString().toLowerCase();

  const isVendedor = role === 'vendedor';

  // id "lógico" del vendedor para filtrar (ajusta a tu realidad)
  const vendedorId =
    perfil?.id_vendedor ||
    perfil?.id_usuario ||
    perfil?.correo ||
    firebaseUser?.email ||
    firebaseUser?.uid ||
    null;

  const [data, setData] = useState<VentaDiaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // ==== helper fechas: últimos 7 días ====
  const range7Days = useMemo(() => {
    const today = new Date();
    const from = new Date();
    from.setDate(today.getDate() - 6);

    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { desde: fmt(from), hasta: fmt(today) };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        if (!idToken) return;
        setLoading(true);
        setError('');

        let q = `?desde=${encodeURIComponent(range7Days.desde)}&hasta=${encodeURIComponent(
          range7Days.hasta,
        )}`;

        // 👇 si es vendedor, agregamos parámetro de filtro
        if (isVendedor && vendedorId) {
          q += `&vendedor=${encodeURIComponent(String(vendedorId))}`;
        }

        const r = await fetch(`http://localhost:3001/api/reportes/ventas-dia${q}`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (!r.ok) throw new Error(await r.text());
        const js = await r.json();
        setData((js.items || []) as VentaDiaItem[]);
      } catch (e: any) {
        setError(e.message || 'Error al cargar ventas');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [idToken, isVendedor, vendedorId, range7Days]);

  const categorias = useMemo(() => data.map((d) => d.fecha), [data]);
  const serieTotal = useMemo(() => data.map((d) => Number(d.total || 0)), [data]);
  const serieSub = useMemo(() => data.map((d) => Number(d.subtotal || 0)), [data]);

  const totalPeriodo = useMemo(
    () => serieTotal.reduce((acc, n) => acc + (Number.isNaN(n) ? 0 : n), 0),
    [serieTotal],
  );

  const optionscolumnchart: any = {
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 6,
        columnWidth: '45%',
      },
    },
    grid: {
      show: true,
      strokeDashArray: 3,
      borderColor: 'rgba(0,0,0,.1)',
    },
    colors: [primary, secondary],
    chart: {
      foreColor: '#adb0bb',
      fontFamily: 'inherit',
      toolbar: { show: false },
    },
    xaxis: {
      type: 'category',
      categories: categorias,
      axisTicks: { show: false },
      axisBorder: { show: false },
    },
    stroke: {
      show: true,
      width: 4,
      colors: ['transparent'],
    },
    dataLabels: { enabled: false },
    legend: { show: true },
    tooltip: { enabled: true },
  };

  const seriescolumnchart = [
    { name: 'Subtotal', data: serieSub },
    { name: 'Total', data: serieTotal },
  ];

  const titulo = isVendedor
    ? 'Mis ventas por día (últimos 7 días)'
    : 'Ventas por día (últimos 7 días)';

  const labelTotal = isVendedor ? 'Total período (mis ventas)' : 'Total período';

  return (
    <DashboardCard
      title={titulo}
      subtitle={`Rango: ${range7Days.desde} a ${range7Days.hasta}`}
      action={
        <Stack spacing={1} textAlign="right">
          <Typography variant="subtitle2" color="text.secondary">
            {labelTotal}
          </Typography>
          <Typography variant="h5" fontWeight={700} color="primary.main">
            {totalPeriodo.toLocaleString()}
          </Typography>

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  bgcolor: primary,
                }}
              />
              <Typography variant="subtitle2" color="primary.main">
                Subtotal
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  bgcolor: secondary,
                }}
              />
              <Typography variant="subtitle2" color="secondary.main">
                Total
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      }
    >
      <Box height="295px">
        {loading && (
          <Typography variant="body2" color="text.secondary">
            Cargando ventas...
          </Typography>
        )}
        {error && (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        )}
        {!loading && !error && data.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No hay datos de ventas en el período.
          </Typography>
        )}
        {!loading && !error && data.length > 0 && (
          <Chart
            options={optionscolumnchart}
            series={seriescolumnchart}
            type="bar"
            height={295}
            width="100%"
          />
        )}
      </Box>
    </DashboardCard>
  );
};

export default SalesOverview;
