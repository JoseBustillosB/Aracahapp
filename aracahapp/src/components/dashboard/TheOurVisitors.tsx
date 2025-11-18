/* =====================================================
   DASHBOARD DE RESUMEN DE Pedidos por estado
===================================================== */

import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Stack, Typography, Box, Divider } from '@mui/material';

import DashboardCard from '../shared/DashboardCard';
import { useAuth } from 'src/context/AuthContext';

const Chart = React.lazy(() => import('react-apexcharts'));

type ResumenEstadoItem = { estado: string; total: number };

type ResumenResponse = {
  pedidos_por_estado: any[];
  entregas_por_estado: any[];
  total_ventas: number;
};

const OurVisitors = () => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;
  const info = theme.palette.info.main;
  const grey = theme.palette.grey[100];

  const { idToken, perfil } = useAuth();

  // Rol desde el perfil de tu API
  const role = (perfil?.nombre_rol || '').toLowerCase();

  // Si es vendedor, NO mostramos este dashboard
  if (role === 'vendedor') {
    return null;
  }

  const [pedidos, setPedidos] = useState<ResumenEstadoItem[]>([]);
  const [entregas, setEntregas] = useState<ResumenEstadoItem[]>([]);
  const [totalVentas, setTotalVentas] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const r = await fetch('http://localhost:3001/api/reportes/resumen', {
          headers: {
            Authorization: idToken ? `Bearer ${idToken}` : '',
            'Content-Type': 'application/json',
          },
        });
        if (!r.ok) throw new Error(await r.text());
        const js = (await r.json()) as ResumenResponse;

        const mapBloque = (arr: any[] | undefined): ResumenEstadoItem[] =>
          (arr || []).map((x) => ({
            estado: String(x.estado ?? x.nombre ?? ''),
            total: Number(x.total || 0),
          }));

        setPedidos(mapBloque(js.pedidos_por_estado));
        setEntregas(mapBloque(js.entregas_por_estado));
        setTotalVentas(Number(js.total_ventas || 0));
      } catch (e: any) {
        setError(e.message || 'Error al cargar resumen');
      } finally {
        setLoading(false);
      }
    };

    if (idToken) {
      load();
    }
  }, [idToken]);

  // Datos para el donut (pedidos por estado)
  const labels = useMemo(() => pedidos.map((p) => p.estado), [pedidos]);
  const series = useMemo(() => pedidos.map((p) => p.total), [pedidos]);

  const totalPedidos = useMemo(
    () => series.reduce((acc, n) => acc + (Number.isNaN(n) ? 0 : n), 0),
    [series],
  );
  const totalEntregas = useMemo(
    () => entregas.reduce((acc, x) => acc + (Number(x.total || 0) || 0), 0),
    [entregas],
  );

  const optionscolumnchart: any = {
    labels,
    chart: {
      height: 250,
      type: 'donut',
      foreColor: '#adb0bb',
      fontFamily: 'inherit',
    },
    colors: [primary, secondary, grey, info],
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { colors: ['transparent'] },
    plotOptions: {
      pie: {
        donut: {
          size: '83',
          background: 'transparent',
          labels: {
            show: true,
            name: {
              show: true,
              offsetY: 7,
            },
            value: { show: false },
            total: {
              show: true,
              color: '#a1aab2',
              fontSize: '13px',
              label: 'Pedidos',
            },
          },
        },
      },
    },
    responsive: [{ breakpoint: 480, options: { chart: { height: 230 } } }],
    tooltip: {
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
      fillSeriesColor: false,
    },
  };

  return (
    <DashboardCard
      title="Pedidos por estado"
      subtitle="Resumen rápido del sistema"
      footer={
        <>
          <Divider />
          <Stack spacing={2} p={3}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="subtitle2" color="text.secondary">
                Total pedidos
              </Typography>
              <Typography variant="subtitle1" fontWeight={600}>
                {totalPedidos.toLocaleString()}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="subtitle2" color="text.secondary">
                Total entregas
              </Typography>
              <Typography variant="subtitle1" fontWeight={600}>
                {totalEntregas.toLocaleString()}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="subtitle2" color="text.secondary">
                Total ventas (L.)
              </Typography>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                color="primary.main"
              >
                {totalVentas.toLocaleString()}
              </Typography>
            </Stack>
          </Stack>
        </>
      }
    >
      <Box height="220px">
        {loading && (
          <Typography variant="body2" color="text.secondary">
            Cargando resumen...
          </Typography>
        )}
        {error && (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        )}
        {!loading && !error && labels.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No hay datos de pedidos.
          </Typography>
        )}
        {!loading && !error && labels.length > 0 && (
          <Chart
            options={optionscolumnchart}
            series={series}
            type="donut"
            height={250}
            width="100%"
          />
        )}
      </Box>
    </DashboardCard>
  );
};

export default OurVisitors;
