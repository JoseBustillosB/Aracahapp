// src/views/produccion/OPView.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Box, Stack, Typography, Button, Alert, Paper, Divider, Chip,
  Table, TableHead, TableRow, TableCell, TableBody, Snackbar,
} from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import { useAuth } from 'src/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

type Header = {
  id_orden: number;
  id_pedido: number;
  numero_pedido?: string | null;
  cliente?: string | null;
  estado_codigo: string;      // CRE/ASG/INI/FIN/PAU
  estado_nombre: string;
  fecha_creada?: string | null;
  fecha_asignada?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  comentario?: string | null;
};

type Consumo = {
  id_consumo: number;
  id_material: number;
  material: string;
  cantidad: number;
};

type Detalle = {
  id_producto: number;
  sku: string;
  nombre: string;
  cantidad: number;
};

export default function OPView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const token = auth?.idToken || '';

  const headers = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }), [token]);

  const [header, setHeader] = useState<Header | null>(null);
  const [consumo, setConsumo] = useState<Consumo[]>([]);
  const [detalle, setDetalle] = useState<Detalle[]>([]);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [snack, setSnack] = useState(false);

  useEffect(() => { document.title = `OP ${id} | Sistema Aracah`; }, [id]);

  const fmt = (d?: string | null) => d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-';

  const loadAll = async () => {
    try {
      setErr('');
      // Encabezado
      const r1 = await fetch(`http://localhost:3001/api/op/${id}`, { headers });
      if (!r1.ok) throw new Error(await r1.text());
      const js1 = await r1.json();
      setHeader(js1.header || null);

      // Detalle del pedido (SKU, nombre, cantidad)
      const r3 = await fetch(`http://localhost:3001/api/op/${id}/detalle`, { headers });
      setDetalle(r3.ok ? (await r3.json()).items || [] : []);

      // Consumo (si no hay, regresa vacío)
      const r2 = await fetch(`http://localhost:3001/api/op/${id}/consumo`, { headers });
      setConsumo(r2.ok ? (await r2.json()).items || [] : []);
    } catch (e:any) {
      setErr(e.message || 'Error cargando OP');
    }
  };

  useEffect(() => { if (token && id) loadAll(); }, [token, id]); // eslint-disable-line

  const canAssign = header?.estado_codigo === 'CRE';
  const canStart  = header?.estado_codigo === 'ASG';
  const canPause  = header?.estado_codigo === 'INI';
  const canResume = header?.estado_codigo === 'PAU';
  const canFinish = header?.estado_codigo === 'INI' || header?.estado_codigo === 'PAU';

  const act = async (path: 'assign' | 'start' | 'pause' | 'resume' | 'finish') => {
    try {
      setErr(''); setOk('');
      const r = await fetch(`http://localhost:3001/api/op/${id}/${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ comentario: `Acción ${path} desde UI` })
      });
      if (!r.ok) throw new Error(await r.text());
      setOk('Estado actualizado');
      setSnack(true);
      await loadAll();
    } catch (e:any) {
      setErr(e.message || `Error en transición ${path}`);
    }
  };

  return (
    <PageContainer title={`OP ${header?.id_orden || id} | Sistema Aracah`} description="Detalle de OP">
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <Typography variant="h4" fontWeight={700}>
            OP {header?.id_orden || id} · Pedido {header?.numero_pedido || header?.id_pedido}
          </Typography>
          {header && <Chip label={header.estado_nombre} color={
            header.estado_codigo==='FIN' ? 'success' :
            header.estado_codigo==='INI' ? 'primary' :
            header.estado_codigo==='ASG' ? 'info' :
            header.estado_codigo==='PAU' ? 'warning' : 'default'
          }/>}
          <Box flexGrow={1} />
          <Button variant="outlined" onClick={() => navigate('/op')}>Volver</Button>
        </Stack>

        {err && <Alert severity="error" sx={{ mb:2 }}>{err}</Alert>}
        {ok &&  <Alert severity="success" sx={{ mb:2 }}>{ok}</Alert>}

        <Paper sx={{ p:2, mb:2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Encabezado</Typography>
          <Box sx={{ display:'grid', gridTemplateColumns:{ xs:'1fr', md:'repeat(12,1fr)' }, gap:2 }}>
            <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 3' } }}>
              <Chip label={`Cliente: ${header?.cliente || '-'}`} />
            </Box>
            <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 3' } }}>
              <Chip label={`Creada: ${fmt(header?.fecha_creada)}`} />
            </Box>
            <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 3' } }}>
              <Chip label={`Asignada: ${fmt(header?.fecha_asignada)}`} />
            </Box>
            <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 3' } }}>
              <Chip label={`Inicio: ${fmt(header?.fecha_inicio)}`} />
            </Box>
            <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 3' } }}>
              <Chip label={`Fin: ${fmt(header?.fecha_fin)}`} />
            </Box>
          </Box>

          <Divider sx={{ my:2 }} />

          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Transiciones</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button disabled={!canAssign} variant="contained" onClick={() => act('assign')}>Asignar</Button>
            <Button disabled={!canStart}  variant="contained" onClick={() => act('start')}>Iniciar</Button>
            <Button disabled={!canPause}  variant="outlined"  onClick={() => act('pause')}>Pausar</Button>
            <Button disabled={!canResume} variant="outlined"  onClick={() => act('resume')}>Reanudar</Button>
            <Button disabled={!canFinish} variant="contained" color="success" onClick={() => act('finish')}>Finalizar</Button>
          </Stack>
        </Paper>

        {/* Productos del pedido (coherencia con consumo) */}
        <Paper sx={{ p:2, mb:2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Productos del pedido</Typography>
          <Box sx={{ overflowX:'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>SKU</TableCell>
                  <TableCell>Producto</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detalle.map((d, i) => (
                  <TableRow key={`${d.id_producto}-${i}`}>
                    <TableCell>{d.sku}</TableCell>
                    <TableCell>{d.nombre}</TableCell>
                    <TableCell align="right">{d.cantidad}</TableCell>
                  </TableRow>
                ))}
                {detalle.length===0 && (
                  <TableRow><TableCell colSpan={3}>Sin productos.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>

        {/* Consumo de materiales */}
        <Paper sx={{ p:2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Consumo de materiales</Typography>
          <Box sx={{ overflowX:'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Material</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {consumo.map(c => (
                  <TableRow key={c.id_consumo}>
                    <TableCell>{c.id_consumo}</TableCell>
                    <TableCell>{c.material}</TableCell>
                    <TableCell align="right">{c.cantidad}</TableCell>
                  </TableRow>
                ))}
                {consumo.length===0 && (
                  <TableRow><TableCell colSpan={3}>Sin consumos registrados.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      </Box>

      <Snackbar open={snack} onClose={()=>setSnack(false)} autoHideDuration={2000} message="Acción realizada" />
    </PageContainer>
  );
}
