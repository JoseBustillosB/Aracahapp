/* =====================================================
   DASHBOARD DE RESUMEN DE OP REGISTRADAS
===================================================== */
import { useEffect, useMemo, useState } from 'react';
import { Box, Card, CardContent, Typography, Stack, Divider } from '@mui/material';
import { useAuth } from 'src/context/AuthContext';

type OpTiempoItem = {
  id_op: number;
  id_pedido: number;
  estado: string;
  inicio: string | null;
  fin: string | null;
  duracion_horas: number | null;
};

const formatDateTime = (value: string | null) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('es-HN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ActivityTimeline = () => {
  const auth = useAuth();
  const token = auth?.idToken || '';

  const [ops, setOps] = useState<OpTiempoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Últimos 7 días
  const rango = useMemo(() => {
    const hoy = new Date();
    const desde = new Date();
    desde.setDate(hoy.getDate() - 6);

    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { desde: fmt(desde), hasta: fmt(hoy) };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        if (!token) return;
        setLoading(true);
        setError('');

        const qs = `?desde=${encodeURIComponent(rango.desde)}&hasta=${encodeURIComponent(
          rango.hasta
        )}`;
        const r = await fetch(`http://localhost:3001/api/reportes/ops${qs}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!r.ok) throw new Error(await r.text());
        const js = await r.json();

        const norm: OpTiempoItem[] = (js.items || []).map((x: any) => ({
          id_op: Number(x.id_op ?? x.id_orden ?? 0),
          id_pedido: Number(x.id_pedido ?? 0),
          estado: String(x.estado ?? x.estado_nombre ?? ''),
          inicio: (x.inicio ?? x.fecha_inicio ?? null)
            ? String(x.inicio ?? x.fecha_inicio)
            : null,
          fin: (x.fin ?? x.fecha_fin ?? null) ? String(x.fin ?? x.fecha_fin) : null,
          duracion_horas:
            x.duracion_horas ?? x.duracion ?? null,
        }));

        // Ordenar por inicio descendente y tomar las últimas 6
        norm.sort((a, b) => {
          const da = a.inicio ? new Date(a.inicio).getTime() : 0;
          const db = b.inicio ? new Date(b.inicio).getTime() : 0;
          return db - da;
        });

        setOps(norm.slice(0, 6));
      } catch (e: any) {
        setError(e.message || 'Error al cargar OPs');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, rango]);

  return (
    <Card sx={{ height: '100%' }} variant="outlined">
      <CardContent>
        <Typography variant="h6" fontWeight={700} mb={0.5}>
          Órdenes de producción recientes
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Últimas OP registradas en el sistema (rango {rango.desde} a {rango.hasta}).
        </Typography>

        {loading && (
          <Typography variant="body2" color="text.secondary">
            Cargando órdenes de producción...
          </Typography>
        )}

        {error && (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        )}

        {!loading && !error && ops.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No se encontraron órdenes de producción en el rango seleccionado.
          </Typography>
        )}

        {!loading && !error && ops.length > 0 && (
          <Stack spacing={1.5} mt={1}>
            {ops.map((op) => (
              <Box key={op.id_op}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  spacing={1}
                >
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      OP #{op.id_op} &mdash; Pedido #{op.id_pedido}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Estado: {op.estado || 'Sin estado'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Inicio: {formatDateTime(op.inicio)} &nbsp;|&nbsp; Fin:{' '}
                      {formatDateTime(op.fin)}
                    </Typography>
                  </Box>
                  {op.duracion_horas != null && (
                    <Typography variant="subtitle2" color="primary.main">
                      {op.duracion_horas.toFixed(1)} h
                    </Typography>
                  )}
                </Stack>
                <Divider sx={{ mt: 1.2 }} />
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityTimeline;
