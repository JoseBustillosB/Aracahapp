import { useEffect, useMemo, useState } from 'react';
import { Box, CardContent, Card, Typography, Stack, Divider } from '@mui/material';
import { useAuth } from 'src/context/AuthContext';

type ResumenEstadoItem = { estado: string; total: number };

type ResumenResponse = {
  pedidos_por_estado: any[];
  total_ventas: number;
  entregas_por_estado: any[];
};

const ProfileCard = () => {
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

  const vendedorId =
    perfil?.id_vendedor ||
    perfil?.id_usuario ||
    perfil?.correo ||
    firebaseUser?.email ||
    firebaseUser?.uid ||
    null;

  const [pedidos, setPedidos] = useState<ResumenEstadoItem[]>([]);
  const [entregas, setEntregas] = useState<ResumenEstadoItem[]>([]);
  const [totalVentas, setTotalVentas] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        if (!idToken) return;
        setLoading(true);
        setError('');

        let url = 'http://localhost:3001/api/reportes/resumen';
        if (isVendedor && vendedorId) {
          url += `?vendedor=${encodeURIComponent(String(vendedorId))}`;
        }

        const r = await fetch(url, {
          headers: {
            Authorization: `Bearer ${idToken}`,
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

    load();
  }, [idToken, isVendedor, vendedorId]);

  const totalPedidos = useMemo(
    () => pedidos.reduce((acc, p) => acc + (Number(p.total) || 0), 0),
    [pedidos],
  );

  const pedidosEntregados = useMemo(
    () =>
      pedidos.reduce((acc, p) => {
        const e = p.estado.toLowerCase();
        if (e.includes('entregado')) return acc + (Number(p.total) || 0);
        return acc;
      }, 0),
    [pedidos],
  );

  const pedidosActivos = useMemo(
    () => totalPedidos - pedidosEntregados,
    [totalPedidos, pedidosEntregados],
  );

  const totalEntregas = useMemo(
    () => entregas.reduce((acc, e) => acc + (Number(e.total) || 0), 0),
    [entregas],
  );

  const titulo = isVendedor ? 'Mi resumen de ventas' : 'Resumen general';
  const subtitulo = isVendedor
    ? 'Estado de mis pedidos, entregas y ventas.'
    : 'Estado global de pedidos, entregas y ventas.';

  const labelPedidosActivos = isVendedor ? 'Mis pedidos activos' : 'Pedidos activos';
  const labelPedidosEntregados = isVendedor
    ? 'Mis pedidos entregados'
    : 'Pedidos entregados';
  const labelEntregas = isVendedor
    ? 'Mis entregas registradas'
    : 'Entregas registradas';
  const labelVentas = isVendedor ? 'Mis ventas (L.)' : 'Total ventas (L.)';

  return (
    <Card sx={{ height: '100%' }} variant="outlined">
      <CardContent>
        <Typography variant="h6" fontWeight={700} mb={0.5}>
          {titulo}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {subtitulo}
        </Typography>

        {loading && (
          <Typography variant="body2" color="text.secondary">
            Cargando datos...
          </Typography>
        )}

        {error && (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        )}

        {!loading && !error && (
          <>
            <Stack direction="row" spacing={2} mb={2}>
              <Box flex={1}>
                <Typography variant="caption" color="text.secondary">
                  {labelPedidosActivos}
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {pedidosActivos.toLocaleString()}
                </Typography>
              </Box>
              <Box flex={1}>
                <Typography variant="caption" color="text.secondary">
                  {labelPedidosEntregados}
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {pedidosEntregados.toLocaleString()}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2} mb={2}>
              <Box flex={1}>
                <Typography variant="caption" color="text.secondary">
                  {labelEntregas}
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {totalEntregas.toLocaleString()}
                </Typography>
              </Box>
              <Box flex={1}>
                <Typography variant="caption" color="text.secondary">
                  {labelVentas}
                </Typography>
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  {totalVentas.toLocaleString()}
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            <Typography variant="caption" color="text.secondary">
              * Basado en el resumen de reportes del sistema.
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
