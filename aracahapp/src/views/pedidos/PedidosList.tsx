// src/views/pedidos/PedidosList.tsx
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Stack, Typography, Button, Alert, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  Paper, Divider, MenuItem,
} from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import StatusChip from 'src/components/shared/StatusChip';
import { useAuth } from 'src/context/AuthContext';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

type PedidoItem = {
  id_pedido: number;
  numero: string | null;
  fecha_pedido: string;
  id_cliente: number;
  cliente: string;
  estado_codigo: string;   // PEN | PROD | LISTO | ENT | CANC
  estado_nombre: string;
  fecha_compromiso?: string | null;
  total?: number | null;
};

export default function PedidosList() {
  useEffect(() => { document.title = 'Pedidos | Sistema Aracah'; }, []);
  const auth = useAuth();
  const token = auth?.idToken || '';

  const headers = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }), [token]);

  // filtros
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  // datos
  const [rows, setRows] = useState<PedidoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);      // UI 0-based
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const firstLoad = useRef(true);

  // fetch con overrides → permite que "Limpiar" funcione al primer clic
  const fetchData = async (overrides?: Partial<{
    q: string; estado: string; desde: string; hasta: string; page: number; pageSize: number;
  }>) => {
    const f = {
      q, estado, desde, hasta,
      page: page + 1,
      pageSize,
      ...overrides,
    };

    try {
      setErr(''); setLoading(true);
      const url = new URL('http://localhost:3001/api/pedidos');
      url.searchParams.set('page', String(f.page));
      url.searchParams.set('pageSize', String(f.pageSize));
      if (f.q)      url.searchParams.set('q', f.q);
      if (f.estado) url.searchParams.set('estado', f.estado);
      if (f.desde)  url.searchParams.set('desde', f.desde);
      if (f.hasta)  url.searchParams.set('hasta', f.hasta);

      const r = await fetch(url.toString(), { headers });
      if (!r.ok) throw new Error(await r.text());
      const js = await r.json();
      setRows(js.items || []);
      setTotal(js.total || 0);
    } catch (e: any) {
      setErr(e.message || 'Error cargando pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    if (firstLoad.current) { firstLoad.current = false; fetchData(); }
    else { fetchData(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, pageSize]);

  const onBuscar = () => {
    setPage(0);
    fetchData({ page: 1 }); // fuerza la búsqueda con filtros actuales
  };

  // FIX: limpiar al primer clic (sin esperar a que React aplique los setState)
  const onClear = () => {
    setQ(''); setEstado(''); setDesde(''); setHasta('');
    setPage(0);
    fetchData({ q: '', estado: '', desde: '', hasta: '', page: 1 });
  };

  const onExportCSV = () => {
    const headersCsv = ['#','Número','Fecha','Cliente','Estado','Compromiso','Total'];
    const lines = rows.map(r => ([
      r.id_pedido,
      r.numero || '',
      dayjs(r.fecha_pedido).format('YYYY-MM-DD'),
      r.cliente,
      r.estado_nombre,
      r.fecha_compromiso ? dayjs(r.fecha_compromiso).format('YYYY-MM-DD') : '',
      r.total ?? ''
    ].map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(',')));
    const csv = [headersCsv.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `pedidos_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageContainer title="Pedidos | Sistema Aracah" description="Listado y filtros de pedidos">
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h4" fontWeight={700}>Pedidos</Typography>
          </Stack>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display:'grid', gridTemplateColumns:{ xs:'1fr', md:'repeat(12,1fr)' }, gap:2 }}>
            <Box sx={{ gridColumn:{ xs:'1 / -1', md:'span 3' } }}>
              <CustomTextField
                label="Buscar (número/cliente)"
                placeholder="Ej. PED-0007 / Juan"
                fullWidth
                value={q}
                onChange={(e:any)=>setQ(e.target.value)}
              />
            </Box>

            <Box sx={{ gridColumn:{ xs:'1 / -1', md:'span 2' } }}>
              <CustomTextField
                select
                fullWidth
                label="Estado"
                value={estado}
                onChange={(e:any)=>setEstado(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="PEN">Pendiente</MenuItem>
                <MenuItem value="PROD">Producción</MenuItem>
                <MenuItem value="LISTO">Listo</MenuItem>
                <MenuItem value="ENT">Entregado</MenuItem>
                <MenuItem value="CANC">Cancelado</MenuItem>
              </CustomTextField>
            </Box>

            <Box sx={{ gridColumn:{ xs:'1 / -1', md:'span 2' } }}>
              <CustomTextField
                label="Desde"
                type="date"
                fullWidth
                InputLabelProps={{ shrink:true }}
                value={desde}
                onChange={(e:any)=>setDesde(e.target.value)}
              />
            </Box>

            <Box sx={{ gridColumn:{ xs:'1 / -1', md:'span 2' } }}>
              <CustomTextField
                label="Hasta"
                type="date"
                fullWidth
                InputLabelProps={{ shrink:true }}
                value={hasta}
                onChange={(e:any)=>setHasta(e.target.value)}
              />
            </Box>

            <Box sx={{ gridColumn:'1 / -1' }}>
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={onBuscar} disabled={loading}>
                  {loading ? 'Cargando...' : 'Buscar'}
                </Button>
                <Button variant="outlined" onClick={onClear} disabled={loading}>
                  Limpiar
                </Button>
                <Box flexGrow={1} />
                <Button variant="outlined" onClick={onExportCSV} disabled={loading || rows.length===0}>
                  Exportar CSV
                </Button>
                <Button component={Link} to="/pedidos/nuevo" variant="contained" color="primary">
                  Nuevo Pedido
                </Button>
              </Stack>
            </Box>
          </Box>
        </Paper>

        {err && <Alert severity="error" sx={{ mb:2 }}>{err}</Alert>}

        <Paper>
          <Box sx={{ px:2, pt:2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle1" fontWeight={600}>Resultados</Typography>
              {loading && <CircularProgress size={16} />}
            </Stack>
          </Box>
          <Divider sx={{ my:1 }} />
          <Box sx={{ overflowX:'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Número</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Compromiso</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(r => {
                  const fecha = dayjs(r.fecha_pedido).format('YYYY-MM-DD');
                  const comp = r.fecha_compromiso ? dayjs(r.fecha_compromiso).format('YYYY-MM-DD') : '';
                  return (
                    <TableRow key={r.id_pedido} hover>
                      <TableCell>{r.id_pedido}</TableCell>
                      <TableCell>{r.numero || '-'}</TableCell>
                      <TableCell>{fecha}</TableCell>
                      <TableCell>{r.cliente}</TableCell>
                      <TableCell><StatusChip code={r.estado_codigo} /></TableCell>
                      <TableCell>{comp}</TableCell>
                      <TableCell>{r.total ?? '-'}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          component={Link}
                          to={`/pedidos/${r.id_pedido}`}
                        >
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {rows.length===0 && !loading && (
                  <TableRow><TableCell colSpan={8}>Sin resultados.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_e,p)=>setPage(p)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e)=>{ setPageSize(parseInt(e.target.value,10)); setPage(0); }}
            rowsPerPageOptions={[10,20,50]}
          />
        </Paper>
      </Box>
    </PageContainer>
  );
}
