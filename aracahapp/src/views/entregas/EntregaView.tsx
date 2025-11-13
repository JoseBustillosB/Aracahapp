// src/views/entregas/EntregaView.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Box, Stack, Typography, Button, Alert, Paper, Divider,
  TextField, Chip, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import { useAuth } from 'src/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

type Transportista = {
  id_transportista: number;
  codigo: string;   // PROPIO | TERCERO | ...
  nombre: string;
  activo: boolean;
};

export default function EntregaView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();

  const token = auth?.idToken || '';
  const rol = (auth?.perfil?.nombre_rol || '').toLowerCase();
  const canManage = rol.includes('admin') || rol.includes('supervisor');

  const headers = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }), [token]);

  const [header, setHeader] = useState<any>(null);
  const [detalle, setDetalle] = useState<any[]>([]);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  // catálogo
  const [transportistas, setTransportistas] = useState<Transportista[]>([]);

  // tracking form
  const [fFechaEnvio, setFFechaEnvio] = useState('');
  const [fTransp, setFTransp] = useState<string>(''); // guarda el id en string
  const [fGuia, setFGuia] = useState('');
  const [fCosto, setFCosto] = useState<string>('');

  const trackingBloqueado = Boolean(header?.fecha_envio); // si ya tiene fecha_envio, no se vuelve a guardar

  const fetchTransportistas = async () => {
    try {
      const r = await fetch(`http://localhost:3001/api/entregas/transportistas`, { headers });
      if (!r.ok) throw new Error(await r.text());
      const js = await r.json();
      setTransportistas(js.items || []);
    } catch (e: any) {
      console.error('transportistas error', e?.message || e);
    }
  };

  const load = async () => {
    try {
      setErr('');
      const r = await fetch(`http://localhost:3001/api/entregas/${id}`, { headers });
      if (!r.ok) throw new Error(await r.text());
      const js = await r.json();

      setHeader(js.header);
      setDetalle(js.detalle || []);

      setFFechaEnvio(js.header?.fecha_envio ? dayjs(js.header.fecha_envio).format('YYYY-MM-DDTHH:mm') : '');
      setFTransp(js.header?.id_transportista ? String(js.header.id_transportista) : '');
      setFGuia(js.header?.guia || '');
      setFCosto(js.header?.costo_envio != null ? String(js.header.costo_envio) : '');

    } catch (e: any) { setErr(e.message || 'Error cargando entrega'); }
  };

  useEffect(() => { document.title = 'Entrega | Sistema Aracah'; }, []);
  useEffect(() => {
    if (token && id) {
      load();
      fetchTransportistas();
    }
    // eslint-disable-next-line
  }, [token, id]);

  // cuando cambia el transportista, aplica regla de costo (PROPIO=0, otros=250)
  useEffect(() => {
    if (!fTransp) return;
    const t = transportistas.find(x => String(x.id_transportista) === fTransp);
    if (!t) return;
    const nuevo = t.codigo?.toUpperCase() === 'PROPIO' ? 0 : 250;
    setFCosto(String(nuevo));
  }, [fTransp, transportistas]);

  const onSaveTracking = async () => {
    try {
      setErr(''); setOk('');
      if (trackingBloqueado) {
        setOk('El tracking ya fue guardado anteriormente.');
        return;
      }

      const body: any = {
        fecha_envio: fFechaEnvio || null,
        id_transportista: fTransp ? Number(fTransp) : null,
        guia: fGuia || null,
        costo_envio: fCosto ? Number(fCosto) : null
      };
      const r = await fetch(`http://localhost:3001/api/entregas/${id}/tracking`, {
        method: 'PATCH', headers, body: JSON.stringify(body)
      });
      if (!r.ok) throw new Error(await r.text());
      setOk('Tracking actualizado');
      load();
    } catch (e: any) { setErr(e.message || 'Error al guardar tracking'); }
  };

  const doTransition = async (code: 'RUTA' | 'ENT' | 'FALL') => {
    try {
      setErr(''); setOk('');
      const path = code === 'RUTA' ? 'to-ruta' : code === 'ENT' ? 'to-ent' : 'to-fall';
      const r = await fetch(`http://localhost:3001/api/entregas/${id}/${path}`, {
        method: 'POST', headers, body: JSON.stringify({})
      });
      if (!r.ok) throw new Error(await r.text());
      setOk(
        code === 'ENT'
          ? 'Entrega marcada como ENTREGADA (el pedido quedó ENTREGADO).'
          : code === 'RUTA'
            ? 'Entrega marcada EN RUTA.'
            : 'Entrega marcada FALLIDA.'
      );
      load();
    } catch (e: any) { setErr(e.message || 'Error al cambiar estado'); }
  };

  return (
    <PageContainer title="Entrega | Sistema Aracah" description="Detalle y tracking de la entrega">
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <Typography variant="h4" fontWeight={700}>Entrega #{id}</Typography>
          <Box flexGrow={1} />
          <Button variant="outlined" onClick={() => navigate('/entregas')}>Volver</Button>
        </Stack>

        {ok && <Alert severity="success" sx={{ mb: 2 }}>{ok}</Alert>}
        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

        {header && (
          <Paper sx={{ p: 2, mb: 2 }}>
            {/* Encabezados con mejor separación y wrap */}
            <Stack spacing={1.2}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip sx={{ mb: 1 }} label={`Pedido: ${header.id_pedido}`} />
                <Chip sx={{ mb: 1 }} label={`Cliente: ${header.cliente || '-'}`} />
                <Chip
                  sx={{ mb: 1 }}
                  label={`Estado: ${header.estado_nombre || '-'}`}
                  color={
                    header.estado_codigo === 'ENT' ? 'success' :
                      header.estado_codigo === 'RUTA' ? 'primary' :
                        header.estado_codigo === 'FALL' ? 'warning' : 'default'
                  }
                />
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip sx={{ mb: 1 }} label={`Método: ${header.metodo_envio || '-'}`} />
                <Chip sx={{ mb: 1 }} label={`Dirección: ${header.direccion_entrega || '-'}`} />
                {header.fecha_entrega &&
                  <Chip
                    sx={{ mb: 1 }}
                    label={`Entrega: ${dayjs(header.fecha_entrega).format('YYYY-MM-DD')}`}
                  />}
              </Stack>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Tracking</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12,1fr)' }, gap: 2 }}>
              <TextField
                label="Fecha envío"
                type="datetime-local"
                value={fFechaEnvio}
                onChange={(e) => setFFechaEnvio(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!canManage || trackingBloqueado}
                sx={{ gridColumn: { xs: '1/-1', md: 'span 4' } }}
              />

              <FormControl sx={{ gridColumn: { xs: '1/-1', md: 'span 3' } }} disabled={!canManage || trackingBloqueado}>
                <InputLabel id="lbl-transp">Transportista</InputLabel>
                <Select
                  labelId="lbl-transp"
                  label="Transportista"
                  value={fTransp}
                  onChange={(e) => setFTransp(String(e.target.value))}
                >
                  <MenuItem value=""><em>- Seleccionar -</em></MenuItem>
                  {transportistas.map(t => (
                    <MenuItem key={t.id_transportista} value={String(t.id_transportista)}>
                      {t.nombre} ({t.codigo})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Guía"
                value={fGuia}
                onChange={(e) => setFGuia(e.target.value)}
                disabled={!canManage || trackingBloqueado}
                sx={{ gridColumn: { xs: '1/-1', md: 'span 3' } }}
              />
              <TextField
                label="Costo envío"
                type="number"
                value={fCosto}
                onChange={(e) => setFCosto(e.target.value)}
                disabled={!canManage || trackingBloqueado}
                sx={{ gridColumn: { xs: '1/-1', md: 'span 2' } }}
              />
            </Box>

            {canManage && (
              <Stack direction="row" spacing={1} mt={2}>
                <Button
                  variant="outlined"
                  onClick={onSaveTracking}
                  disabled={trackingBloqueado}
                >
                  {trackingBloqueado ? 'Tracking guardado' : 'Guardar Tracking'}
                </Button>
                <Box flexGrow={1} />
                <Button variant="contained" onClick={() => doTransition('RUTA')}>Marcar En Ruta</Button>
                <Button variant="contained" color="success" onClick={() => doTransition('ENT')}>Marcar Entregada</Button>
                <Button variant="outlined" color="warning" onClick={() => doTransition('FALL')}>Marcar Fallida</Button>
              </Stack>
            )}
          </Paper>
        )}

        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Detalle de entrega</Typography>
          {detalle.length === 0 && <Typography variant="body2">Sin líneas.</Typography>}
          {detalle.length > 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr' }, gap: 1 }}>
              {detalle.map((d: any) => (
                <Paper key={d.id_detalle} sx={{ p: 1.5 }}>
                  <Typography variant="body2"><b>SKU:</b> {d.sku || '-'}</Typography>
                  <Typography variant="body2"><b>Producto:</b> {d.nombre_producto || '-'}</Typography>
                  <Typography variant="body2"><b>Cantidad:</b> {d.cantidad}</Typography>
                </Paper>
              ))}
            </Box>
          )}
        </Paper>
      </Box>
    </PageContainer>
  );
}
