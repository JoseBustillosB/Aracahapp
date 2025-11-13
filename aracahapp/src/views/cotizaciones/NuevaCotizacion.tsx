'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Stack, Typography, Button, Alert, Paper, Divider, IconButton,
  Table, TableHead, TableRow, TableCell, TableBody, TextField, Snackbar, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PageContainer from 'src/components/container/PageContainer';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import { useAuth } from 'src/context/AuthContext';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

type Linea = {
  id_producto: number | '';
  cantidad: number | '';
  // precio_unitario se mantiene solo para mostrar; en el POST lo omitimos para que el SP tome catálogo
  precio_unitario?: number | '';

  // Campos de solo visualización (llenados por /aux/producto-lite)
  sku?: string;
  nombre?: string;
  impuesto_tasa?: number;
  precio_catalogo?: number;
  color_nombre?: string;
  modelo_nombre?: string;
  estilo_nombre?: string;
  tipo_producto_nombre?: string;
};

type ClienteLite = { id_cliente: number; nombre: string; email?: string | null };

export default function NuevaCotizacion() {
  const navigate = useNavigate();
  const auth = useAuth();
  const token = auth?.idToken || '';

  const headers = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }), [token]);

  // Form
  const [idCliente, setIdCliente] = useState<number | ''>('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [validaHasta, setValidaHasta] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');

  // Líneas
  const [rows, setRows] = useState<Linea[]>([{ id_producto: '', cantidad: '', precio_unitario: '' }]);

  // Búsqueda rápida cliente (opcional)
  const [clientes, setClientes] = useState<ClienteLite[]>([]);
  const [loadingCli, setLoadingCli] = useState(false);

  const [err, setErr] = useState<string>('');
  const [okMsg, setOkMsg] = useState<string>('');
  const [snackOpen, setSnackOpen] = useState(false);
  const firstLoad = useRef(true);

  useEffect(() => { document.title = 'Nueva cotización | Sistema Aracah'; }, []);

  // Default: +7 días solo 1 vez
  useEffect(() => {
    if (!validaHasta) {
      setValidaHasta(dayjs().add(7, 'day').format('YYYY-MM-DD'));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!token || !firstLoad.current) return;
    firstLoad.current = false;
    fetchClientes('');
  }, [token]);

  const fetchClientes = async (term: string) => {
    try {
      setLoadingCli(true);
      const url = new URL('http://localhost:3001/api/clientes');
      url.searchParams.set('page', '1');
      url.searchParams.set('pageSize', '20');
      if (term) url.searchParams.set('q', term);
      const r = await fetch(url.toString(), { headers });
      const js = await r.json();
      setClientes(js.items || []);
    } catch (_e) {
      // silencio
    } finally {
      setLoadingCli(false);
    }
  };

  const onAddRow = () => setRows(r => [...r, { id_producto: '', cantidad: '', precio_unitario: '' }]);
  const onDelRow = (idx: number) => setRows(r => r.length === 1 ? r : r.filter((_, i) => i !== idx));

  const onChangeRow = async (idx: number, field: keyof Linea, value: any) => {
    // 1) Mutación base
    setRows(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));

    // 2) Si cambia id_producto, consultamos al BE usando el SP sp_producto_lite
    if (field === 'id_producto') {
      const idp = value === '' ? '' : Number(value);
      if (!idp) {
        setRows(prev => prev.map((row, i) => i === idx ? {
          ...row, sku:'', nombre:'', precio_catalogo: undefined, impuesto_tasa: undefined,
          color_nombre: undefined, modelo_nombre: undefined, estilo_nombre: undefined, tipo_producto_nombre: undefined
        } : row));
        return;
      }
      try {
        const url = new URL('http://localhost:3001/api/cotizaciones/aux/producto-lite');
        url.searchParams.set('id_producto', String(idp));
        const r = await fetch(url.toString(), { headers });
        if (!r.ok) throw new Error(await r.text());
        const { item } = await r.json();

        // Normalizamos en la línea (solo visual). NOTA: no forzamos precio_unitario para permitir que el SP use catálogo.
        setRows(prev => prev.map((row, i) => i === idx ? {
          ...row,
          sku: item.sku,
          nombre: item.nombre,
          precio_catalogo: Number(item.precio),
          impuesto_tasa: Number(item.impuesto_tasa),
          color_nombre: item.color_nombre || '',
          modelo_nombre: item.modelo_nombre || '',
          estilo_nombre: item.estilo_nombre || '',
          tipo_producto_nombre: item.tipo_producto_nombre || '',
          // mostramos precio en el campo pero no lo enviaremos al SP (lo deja vacío)
          precio_unitario: item.precio
        } : row));
      } catch (e) {
        console.error('producto-lite FE error:', e);
      }
    }
  };

  // Subtotal mostrado: usa precio_catalogo/ unitario visible * cantidad
  const subtotal = rows.reduce((acc, r) => {
    const c = Number(r.cantidad || 0);
    const p = Number((r.precio_catalogo ?? r.precio_unitario) || 0);
    return acc + (c * p);
  }, 0);

  const impuestoCalc = rows.reduce((acc, r) => {
    const c = Number(r.cantidad || 0);
    const p = Number((r.precio_catalogo ?? r.precio_unitario) || 0);
    const tasa = Number(r.impuesto_tasa || 0) / 100;
    return acc + (c * p * tasa);
  }, 0);

  const totalCalc = subtotal + impuestoCalc;

  const canSubmit = !!token
    && idCliente
    && rows.every(r => Number(r.id_producto) > 0 && Number(r.cantidad) > 0);

  const onSubmit = async () => {
    try {
      setErr('');
      setOkMsg('');
      if (!canSubmit) {
        setErr('Completa cliente y al menos una línea válida.');
        return;
      }

      // Enviamos SOLO lo necesario. Omitimos precio_unitario para que el SP use catálogo.
      const detalle = rows.map(r => ({
        id_producto: Number(r.id_producto),
        cantidad: Number(r.cantidad),
        // Si quisieras permitir override puntual, descomenta:
        // ...(r.precio_unitario !== '' ? { precio_unitario: Number(r.precio_unitario) } : {})
      }));

      const body = {
        id_cliente: Number(idCliente),
        valida_hasta: validaHasta || null,  // YYYY-MM-DD
        descripcion: descripcion || null,
        detalle
      };

      const resp = await fetch('http://localhost:3001/api/cotizaciones', {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!resp.ok) {
        const tx = await resp.text();
        // tx a veces viene vacío (500). Nos aseguramos de mostrar algo.
        throw new Error(tx || 'Error al crear la cotización');
      }
      const js = await resp.json();  // { id_cotizacion }
      setOkMsg('Cotización creada exitosamente.');
      setSnackOpen(true);
      setTimeout(() => navigate(`/cotizaciones/${js.id_cotizacion}`), 900);
    } catch (e: any) {
      setErr(e.message || 'Error al crear la cotización');
    }
  };

  return (
    <PageContainer title="Nueva cotización | Sistema Aracah" description="Crear una nueva cotización">
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <Typography variant="h4" fontWeight={700}>Nueva cotización</Typography>
          <Box flexGrow={1} />
          {/* Acceso rápido para crear cliente si no existe */}
          <Button variant="outlined" onClick={() => navigate('/clientes/nuevo')}>Crear Cliente</Button>
        </Stack>

        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
        {okMsg && <Alert severity="success" sx={{ mb: 2 }}>{okMsg}</Alert>}

        <Paper sx={{ p: 2, mb: 2 }}>
          {/* Encabezado */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gap: 2 }}>
            {/* Cliente */}
            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 5' } }}>
              <CustomTextField
                label="Cliente (escribe para buscar)"
                placeholder="Ej. Cliente Demo"
                fullWidth
                value={clienteNombre}
                onChange={async (e: any) => {
                  const term = e.target.value;
                  setClienteNombre(term);
                  if (term.length >= 3) await fetchClientes(term);
                }}
                helperText={loadingCli ? 'Buscando...' : (idCliente ? `ID: ${idCliente}` : 'Mín 3 letras')}
              />
              {clientes.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {clientes.slice(0,5).map(c => (
                    <Button key={c.id_cliente} size="small" variant="outlined"
                      onClick={() => { setIdCliente(c.id_cliente); setClienteNombre(c.nombre); }}>
                      {c.nombre}
                    </Button>
                  ))}
                </Box>
              )}
            </Box>

            {/* Válida hasta */}
            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}>
              <CustomTextField
                label="Válida hasta"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={validaHasta}
                onChange={(e: any) => setValidaHasta(e.target.value)}
              />
            </Box>

            {/* Descripción */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <CustomTextField
                label="Descripción"
                fullWidth
                multiline
                minRows={2}
                value={descripcion}
                onChange={(e: any) => setDescripcion(e.target.value)}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Líneas */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="subtitle1" fontWeight={600}>Líneas</Typography>
            <Button startIcon={<AddIcon />} onClick={onAddRow}>Agregar Línea</Button>
          </Stack>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={120}>ID Producto</TableCell>
                <TableCell width={140}>SKU</TableCell>
                <TableCell width={260}>Nombre</TableCell>
                <TableCell width={120}>Cantidad</TableCell>
                <TableCell width={180}>Precio (catálogo)</TableCell>
                <TableCell width={160}>Impuesto</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      placeholder="ej. 1"
                      value={r.id_producto}
                      onChange={(e) => onChangeRow(idx, 'id_producto', e.target.value === '' ? '' : Number(e.target.value))}
                      inputProps={{ min: 1 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" value={r.sku || ''} disabled />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <TextField size="small" value={r.nombre || ''} disabled />
                      {/* Chips de atributos opcionales */}
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {r.modelo_nombre && <Chip size="small" label={`Modelo: ${r.modelo_nombre}`} />}
                        {r.color_nombre && <Chip size="small" label={`Color: ${r.color_nombre}`} />}
                        {r.estilo_nombre && <Chip size="small" label={`Estilo: ${r.estilo_nombre}`} />}
                        {r.tipo_producto_nombre && <Chip size="small" label={r.tipo_producto_nombre} />}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      placeholder="ej. 2"
                      value={r.cantidad}
                      onChange={(e) => onChangeRow(idx, 'cantidad', e.target.value === '' ? '' : Number(e.target.value))}
                      inputProps={{ min: 1 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" value={r.precio_catalogo ?? r.precio_unitario ?? ''} disabled />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={r.impuesto_tasa != null ? `ISV ${r.impuesto_tasa}%` : ''}
                      disabled
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton aria-label="eliminar" onClick={() => onDelRow(idx)} disabled={rows.length === 1} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={7}>Agrega al menos una línea.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>

          <Stack direction="row" mt={2} alignItems="center" justifyContent="flex-end" spacing={3}>
            <Typography variant="subtitle1">Subtotal: {subtotal.toFixed(2)}</Typography>
            <Typography variant="subtitle1">Impuesto: {impuestoCalc.toFixed(2)}</Typography>
            <Typography variant="h6">Total: {totalCalc.toFixed(2)}</Typography>
          </Stack>


          <Stack direction="row" spacing={1} mt={2} justifyContent="flex-end">
            <Button
                variant="outlined" onClick={() => navigate('/cotizaciones')}
            >Volver
            </Button>

            <Button variant="contained" onClick={onSubmit} disabled={!canSubmit}>
            Crear Cotización
            </Button>
          </Stack>
        </Paper>
      </Box>

      <Snackbar
        open={snackOpen}
        onClose={() => setSnackOpen(false)}
        autoHideDuration={2000}
        message="Cotización creada exitosamente"
      />
    </PageContainer>
  );
}


