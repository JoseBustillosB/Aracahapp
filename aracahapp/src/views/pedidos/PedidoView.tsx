// src/views/pedidos/PedidoView.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Box, Stack, Typography, Button, Alert, Paper, Divider, Chip,
  Table, TableHead, TableRow, TableCell, TableBody, Snackbar,
} from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import { useAuth } from 'src/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import StatusChip from 'src/components/shared/StatusChip';
import dayjs from 'dayjs';

type Header = {
  id_pedido: number;
  numero: string | null;
  fecha_pedido: string;
  id_cotizacion?: number | null;
  cliente?: string | null;
  estado_codigo: string;
  estado_nombre?: string | null;
  fecha_compromiso?: string | null;
  descripcion?: string | null;
};

type Totals = {
  subtotal: number;
  impuesto: number;
  total: number;
};

type Linea = {
  id_producto: number;
  sku?: string | null;
  nombre?: string | null;
  cantidad: number;
  precio_unitario: number;
  impuesto_porcentaje: number;
  subtotal?: number;
  impuesto_monto?: number;
  total_linea?: number;
};

export default function PedidoView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const token = auth?.idToken || '';
  const isVendedor  = (auth?.perfil?.nombre_rol || '').toLowerCase().includes('vendedor');
  const isSupervisor= (auth?.perfil?.nombre_rol || '').toLowerCase().includes('supervisor');
  const isAdmin     = (auth?.perfil?.nombre_rol || '').toLowerCase().includes('admin');

  const [header, setHeader] = useState<Header | null>(null);
  const [totals, setTotals] = useState<Totals>({ subtotal: 0, impuesto: 0, total: 0 });
  const [detalle, setDetalle] = useState<Linea[]>([]);
  const [err, setErr] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [snack, setSnack] = useState(false);

  useEffect(() => { document.title = `Pedido ${id} | Sistema Aracah`; }, [id]);

  const headers = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }), [token]);

  const fmt = (n: number | null | undefined) =>
    (n ?? 0).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const loadAll = async () => {
    try {
      setErr('');
      // Header + totales
      const r1 = await fetch(`http://localhost:3001/api/pedidos/${id}`, { headers });
      if (!r1.ok) throw new Error(await r1.text());
      const js1 = await r1.json();
      setHeader(js1.header || null);
      setTotals(js1.totals || { subtotal: 0, impuesto: 0, total: 0 });

      // Detalle con sku + nombre
      const r2 = await fetch(`http://localhost:3001/api/pedidos/${id}/detalle`, { headers });
      if (!r2.ok) throw new Error(await r2.text());
      const js2 = await r2.json();
      setDetalle(js2.items || []);
    } catch (e: any) {
      setErr(e.message || 'Error cargando pedido');
    }
  };

  useEffect(() => { if (token && id) loadAll(); }, [token, id]); // eslint-disable-line

  const canToProd  = (header?.estado_codigo === 'PEN')   && (isVendedor || isSupervisor || isAdmin);
  const canToListo = (header?.estado_codigo === 'PROD')  && (isSupervisor || isAdmin);
  const canToEnt   = (header?.estado_codigo === 'LISTO') && (isSupervisor || isAdmin);
  const canCancel  = (header && !['ENT','CANC'].includes(header.estado_codigo)) && (isSupervisor || isAdmin);
  const canToPen   = isAdmin;

  const doTransition = async (path: 'to-prod' | 'to-listo' | 'to-ent' | 'cancel' | 'to-pen') => {
    try {
      setErr(''); setOkMsg('');
      const r = await fetch(`http://localhost:3001/api/pedidos/${id}/${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ comentario: `Cambio vía UI: ${path}` })
      });
      if (!r.ok) throw new Error(await r.text());
      setOkMsg('Estado actualizado');
      setSnack(true);
      await loadAll();
    } catch (e: any) {
      setErr(e.message || `Error en transición ${path}`);
    }
  };

  // Totales locales de respaldo
  const subtotalLocal = detalle.reduce((a, d) => a + (d.subtotal ?? d.cantidad * d.precio_unitario), 0);
  const impuestoLocal = detalle.reduce((a, d) => a + (d.impuesto_monto ?? (d.cantidad * d.precio_unitario * (d.impuesto_porcentaje || 0) / 100)), 0);
  const totalLocal    = detalle.reduce((a, d) => a + (d.total_linea ?? (d.cantidad * d.precio_unitario * (1 + (d.impuesto_porcentaje || 0)/100))), 0);

  const showTotals = {
    subtotal: totals?.subtotal ?? subtotalLocal,
    impuesto: totals?.impuesto ?? impuestoLocal,
    total:    totals?.total    ?? totalLocal,
  };

  return (
    <PageContainer title={`Pedido ${header?.numero || id} | Sistema Aracah`} description="Detalle de pedido">
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <Typography variant="h4" fontWeight={700}>
            Pedido {header?.numero || `#${id}`}
          </Typography>
          {header && <StatusChip code={header.estado_codigo} />}
          <Box flexGrow={1} />
          <Button variant="outlined" onClick={() => navigate('/pedidos')}>Volver</Button>
        </Stack>

        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
        {okMsg && <Alert severity="success" sx={{ mb: 2 }}>{okMsg}</Alert>}

        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Encabezado</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12,1fr)' }, gap: 2 }}>
            <Box sx={{ gridColumn: { xs: '1/-1', md: 'span 3' } }}>
              <Chip label={`Pedido: ${header?.numero || '-'}`} />
            </Box>
            <Box sx={{ gridColumn: { xs: '1/-1', md: 'span 3' } }}>
              <Chip label={`Fecha: ${header?.fecha_pedido ? dayjs(header.fecha_pedido).format('YYYY-MM-DD') : '-'}`} />
            </Box>
            <Box sx={{ gridColumn: { xs: '1/-1', md: 'span 3' } }}>
              <Chip label={`Compromiso: ${header?.fecha_compromiso ? dayjs(header.fecha_compromiso).format('YYYY-MM-DD') : '-'}`} />
            </Box>
            <Box sx={{ gridColumn: { xs: '1/-1', md: 'span 3' } }}>
              <Chip label={`Cliente: ${header?.cliente || '-'}`} />
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Transiciones</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button disabled={!canToProd}  variant="contained" onClick={() => doTransition('to-prod')}>A producción</Button>
            <Button disabled={!canToListo} variant="contained" onClick={() => doTransition('to-listo')}>Marcar listo</Button>
            <Button disabled={!canToEnt}   variant="contained" onClick={() => doTransition('to-ent')}>Marcar entregado</Button>
            <Button disabled={!canCancel}  variant="outlined" color="error" onClick={() => doTransition('cancel')}>Cancelar</Button>
            {isAdmin && (
              <Button disabled={!canToPen} variant="outlined" onClick={() => doTransition('to-pen')}>Forzar PEN</Button>
            )}
          </Stack>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Detalle</Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID Prod</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell align="right">Cant.</TableCell>
                  <TableCell align="right">Precio</TableCell>
                  <TableCell align="right">Imp. %</TableCell>
                  <TableCell align="right">Subtotal</TableCell>
                  <TableCell align="right">Impuesto</TableCell>
                  <TableCell align="right">Total línea</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detalle.map((d, i) => {
                  const sub = d.subtotal ?? (d.cantidad * d.precio_unitario);
                  const imp = d.impuesto_monto ?? (d.cantidad * d.precio_unitario * (d.impuesto_porcentaje || 0) / 100);
                  const tot = d.total_linea ?? (sub + imp);
                  return (
                    <TableRow key={`${d.id_producto}-${i}`}>
                      <TableCell>{d.id_producto}</TableCell>
                      <TableCell>{d.sku || '-'}</TableCell>
                      <TableCell>{d.nombre || '-'}</TableCell>
                      <TableCell align="right">{d.cantidad}</TableCell>
                      <TableCell align="right">{fmt(d.precio_unitario)}</TableCell>
                      <TableCell align="right">{(d.impuesto_porcentaje || 0).toFixed(2)}%</TableCell>
                      <TableCell align="right">{fmt(sub)}</TableCell>
                      <TableCell align="right">{fmt(imp)}</TableCell>
                      <TableCell align="right">{fmt(tot)}</TableCell>
                    </TableRow>
                  );
                })}

                {/* Pie de totales estilo Cotización */}
                <TableRow>
                  <TableCell colSpan={6} />
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Subtotal</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Impuesto</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={6} />
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(showTotals.subtotal)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(showTotals.impuesto)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(showTotals.total)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </Paper>
      </Box>

      <Snackbar open={snack} onClose={() => setSnack(false)} autoHideDuration={2000} message="Acción realizada" />
    </PageContainer>
  );
}
