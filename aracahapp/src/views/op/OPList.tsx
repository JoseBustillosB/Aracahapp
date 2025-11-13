// src/views/produccion/OPList.tsx
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Stack, Typography, Button, Alert, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  Paper, Divider, MenuItem,
} from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import { useAuth } from 'src/context/AuthContext';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

type OPItem = {
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
  total_count?: number;
};

export default function OPList() {
  useEffect(() => { document.title = 'Órdenes de producción | Sistema Aracah'; }, []);
  const auth = useAuth();
  const token = auth?.idToken || '';
  const headers = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }), [token]);

  // Filtros
  const [q, setQ] = useState('');                  // número de pedido / cliente
  const [estado, setEstado] = useState('');        // CRE/ASG/INI/FIN/PAU
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  // Datos
  const [rows, setRows] = useState<OPItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const firstLoad = useRef(true);

  const fetchData = async (overrides?: Partial<{ q:string; estado:string; desde:string; hasta:string; page:number; pageSize:number }>) => {
    const f = { q, estado, desde, hasta, page: page + 1, pageSize, ...overrides };
    try {
      setErr(''); setLoading(true);
      const url = new URL('http://localhost:3001/api/op');
      url.searchParams.set('page', String(f.page));
      url.searchParams.set('pageSize', String(f.pageSize));
      if (f.q) url.searchParams.set('q', f.q);
      if (f.estado) url.searchParams.set('estado', f.estado);
      if (f.desde) url.searchParams.set('desde', f.desde);
      if (f.hasta) url.searchParams.set('hasta', f.hasta);

      const r = await fetch(url.toString(), { headers });
      if (!r.ok) throw new Error(await r.text());
      const js = await r.json();
      setRows(js.items || []);
      setTotal(js.total || 0);
    } catch (e:any) {
      setErr(e.message || 'Error cargando órdenes de producción');
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

  const onBuscar = () => { setPage(0); fetchData({ page: 1 }); };
  const onClear  = () => { setQ(''); setEstado(''); setDesde(''); setHasta(''); setPage(0); fetchData({ q:'', estado:'', desde:'', hasta:'', page:1 }); };

  const fmt = (d?: string | null) => d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '';

  const onExportCSV = () => {
    const headersCsv = ['ID OP','ID Pedido','Pedido','Cliente','Estado','Creada','Asignada','Inicio','Fin'];
    const lines = rows.map(r => ([
      r.id_orden,
      r.id_pedido,
      r.numero_pedido || '',
      r.cliente || '',
      r.estado_nombre,
      fmt(r.fecha_creada),
      fmt(r.fecha_asignada),
      fmt(r.fecha_inicio),
      fmt(r.fecha_fin),
    ].map(v => `"${(v ?? '').toString().replace(/"/g,'""')}"`).join(',')));
    const csv = [headersCsv.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `op_${dayjs().format('YYYYMMDD_HHmmss')}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageContainer title="Órdenes de producción | Sistema Aracah" description="Listado de OP y filtros">
      <Box>
        <Typography variant="h4" fontWeight={700} mb={2}>Órdenes de producción</Typography>

        <Paper sx={{ p:2, mb:2 }}>
          <Box sx={{ display:'grid', gridTemplateColumns:{ xs:'1fr', md:'repeat(12,1fr)' }, gap:2 }}>
            <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 4' } }}>
              <CustomTextField
                label="Buscar (pedido/cliente)"
                placeholder="Ej. PED-0010 / María"
                fullWidth
                value={q}
                onChange={(e:any)=>setQ(e.target.value)}
              />
            </Box>
            <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 2' } }}>
              <CustomTextField
                select
                fullWidth
                label="Estado"
                value={estado}
                onChange={(e:any)=>setEstado(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="CRE">Creada</MenuItem>
                <MenuItem value="ASG">Asignada</MenuItem>
                <MenuItem value="INI">En proceso</MenuItem>
                <MenuItem value="PAU">Pausada</MenuItem>
                <MenuItem value="FIN">Finalizada</MenuItem>
              </CustomTextField>
            </Box>
            <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 2' } }}>
              <CustomTextField
                label="Desde"
                type="date"
                fullWidth
                InputLabelProps={{ shrink:true }}
                value={desde}
                onChange={(e:any)=>setDesde(e.target.value)}
              />
            </Box>
            <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 2' } }}>
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
          <Divider sx={{ my:1 }}/>
          <Box sx={{ overflowX:'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID OP</TableCell>
                  <TableCell>Pedido</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Creada</TableCell>
                  <TableCell>Asignada</TableCell>
                  <TableCell>Inicio</TableCell>
                  <TableCell>Fin</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.id_orden} hover>
                    <TableCell>{r.id_orden}</TableCell>
                    <TableCell>{r.numero_pedido || r.id_pedido}</TableCell>
                    <TableCell>{r.cliente || '-'}</TableCell>
                    <TableCell>{r.estado_nombre}</TableCell>
                    <TableCell>{fmt(r.fecha_creada)}</TableCell>
                    <TableCell>{fmt(r.fecha_asignada)}</TableCell>
                    <TableCell>{fmt(r.fecha_inicio)}</TableCell>
                    <TableCell>{fmt(r.fecha_fin)}</TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" component={Link} to={`/op/${r.id_orden}`}>
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length===0 && !loading && (
                  <TableRow><TableCell colSpan={9}>Sin resultados.</TableCell></TableRow>
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
