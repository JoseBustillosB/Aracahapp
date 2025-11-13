'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Stack, Typography, Button, Alert, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  MenuItem, Paper, Divider,
} from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import StatusChip from 'src/components/shared/StatusChip';
import { useAuth } from 'src/context/AuthContext';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

type ItemCot = {
  id_cotizacion: number;
  numero: string | null;
  fecha_cotizacion: string;
  valida_hasta: string | null;
  id_cliente: number;
  cliente: string;
  estado_codigo: string;     // PEN/APR/RECH/VENC
  estado_nombre: string;
  total?: number;
};

export default function CotizacionesList() {
  // Título del tab
  useEffect(() => {
    document.title = 'Cotizaciones | Sistema Aracah';
  }, []);

  const auth = useAuth();
  const token = auth?.idToken || '';
  const isVendedor = (auth?.perfil?.nombre_rol || '').toLowerCase().includes('vendedor');

  // Filtros
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState<string>('');
  const [desde, setDesde] = useState<string>('');
  const [hasta, setHasta] = useState<string>('');

  // Datos
  const [rows, setRows] = useState<ItemCot[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);          // UI 0-based, API 1-based
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');
  const firstLoad = useRef(true);

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
    [token]
  );

  // Fetch con overrides para evitar carreras de estado
  const fetchData = async (overrides: Partial<{
    q: string;
    estado: string;
    desde: string;
    hasta: string;
    page: number;      // 1-based para API
    pageSize: number;
  }> = {}) => {
    try {
      setErr('');
      setLoading(true);

      const _q        = overrides.q        ?? q;
      const _estado   = overrides.estado   ?? estado;
      const _desde    = overrides.desde    ?? desde;
      const _hasta    = overrides.hasta    ?? hasta;
      const _page     = overrides.page     ?? (page + 1);   // API 1-based
      const _pageSize = overrides.pageSize ?? pageSize;

      const url = new URL('http://localhost:3001/api/cotizaciones');
      url.searchParams.set('page', String(_page));
      url.searchParams.set('pageSize', String(_pageSize));
      if (_q)      url.searchParams.set('q', _q);            // ← único buscador (número o cliente)
      if (_estado) url.searchParams.set('estado', _estado);
      if (_desde)  url.searchParams.set('desde', _desde);
      if (_hasta)  url.searchParams.set('hasta', _hasta);

      const r = await fetch(url.toString(), { headers });
      if (!r.ok) {
        const tx = await r.text();
        throw new Error(tx || `Error ${r.status}`);
      }
      const js = await r.json();
      setRows(js.items || []);
      setTotal(js.total || 0);
    } catch (e: any) {
      console.error('fetch cotizaciones', e);
      setErr(e.message || 'Error cargando cotizaciones');
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial y cambios de paginación/tamaño
  useEffect(() => {
    if (!token) return;
    if (firstLoad.current) {
      firstLoad.current = false;
      fetchData();
    } else {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, pageSize]);

  const onBuscar = () => {
    // Reinicia a página 1 (API) y usa filtros actuales
    setPage(0);
    fetchData({ page: 1 });
  };

  const onClear = () => {
    // Limpia estados de filtros
    setQ('');
    setEstado('');
    setDesde('');
    setHasta('');
    setPage(0);

    // Dispara búsqueda inmediatamente con filtros vacíos (sin esperar setState)
    fetchData({
      q: '',
      estado: '',
      desde: '',
      hasta: '',
      page: 1,
    });
  };

  const onExportCSV = () => {
    const headers = ['#', 'Número', 'Fecha', 'Cliente', 'Estado', 'Valida hasta'];
    const lines = rows.map((r) => ([
      r.id_cotizacion,
      r.numero || '',
      dayjs(r.fecha_cotizacion).format('YYYY-MM-DD'),
      r.cliente,
      r.estado_nombre,
      r.valida_hasta ? dayjs(r.valida_hasta).format('YYYY-MM-DD') : ''
    ].map(v => `"${(v ?? '').toString().replace(/"/g,'""')}"`).join(',')));

    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `cotizaciones_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageContainer title="Cotizaciones | Sistema Aracah" description="Listado y filtros de cotizaciones">
      <Box>
        <Typography variant="h4" fontWeight={700} mb={2}>
          Cotizaciones
        </Typography>

        <Paper sx={{ p: 2, mb: 2 }}>
          {/* Filtros */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' },
              gap: 2,
            }}
          >
            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}>
              <CustomTextField
                label="Buscar (número/cliente)"
                fullWidth
                value={q}
                onChange={(e: any) => setQ(e.target.value)}
                placeholder="Ej. COT-0005 / Juan"
              />
            </Box>

            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 2' } }}>
              <CustomTextField
                label="Estado"
                select
                fullWidth
                value={estado}
                onChange={(e: any) => setEstado(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="PEN">Pendiente</MenuItem>
                <MenuItem value="APR">Aprobada</MenuItem>
                <MenuItem value="RECH">Rechazada</MenuItem>
                <MenuItem value="VENC">Vencida</MenuItem>
              </CustomTextField>
            </Box>

            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 2' } }}>
              <CustomTextField
                label="Desde"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={desde}
                onChange={(e: any) => setDesde(e.target.value)}
              />
            </Box>

            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 2' } }}>
              <CustomTextField
                label="Hasta"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={hasta}
                onChange={(e: any) => setHasta(e.target.value)}
              />
            </Box>

            <Box sx={{ gridColumn: '1 / -1' }}>
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={onBuscar} disabled={loading}>
                  {loading ? 'Cargando...' : 'Buscar'}
                </Button>
                <Button variant="outlined" onClick={onClear} disabled={loading}>
                  Limpiar
                </Button>
                <Box flexGrow={1} />
                <Button variant="outlined" onClick={onExportCSV} disabled={loading || rows.length === 0}>
                  Exportar CSV
                </Button>
                {isVendedor && (
                  <Button component={Link} to="/cotizaciones/nueva" variant="contained" color="primary">
                    Nueva cotización
                  </Button>
                )}
              </Stack>
            </Box>
          </Box>
        </Paper>

        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

        <Paper>
          <Box sx={{ px: 2, pt: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle1" fontWeight={600}>Resultados</Typography>
              {loading && <CircularProgress size={16} />}
            </Stack>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Número</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Valida hasta</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => {
                  const fecha = dayjs(r.fecha_cotizacion).format('YYYY-MM-DD');
                  const vto = r.valida_hasta ? dayjs(r.valida_hasta).format('YYYY-MM-DD') : '';
                  const isEditable = r.estado_codigo === 'PEN';

                  return (
                    <TableRow key={r.id_cotizacion} hover>
                      <TableCell>{r.id_cotizacion}</TableCell>
                      <TableCell>{r.numero || '-'}</TableCell>
                      <TableCell>{fecha}</TableCell>
                      <TableCell>{r.cliente}</TableCell>
                      <TableCell><StatusChip code={r.estado_codigo} /></TableCell>
                      <TableCell>{vto}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined"
                            component={Link}
                            to={`/cotizaciones/${r.id_cotizacion}`}
                          >
                            Ver
                          </Button>
                          {isVendedor && (
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              component={Link}
                              to={`/cotizaciones/${r.id_cotizacion}/editar`}
                              disabled={!isEditable}
                            >
                              Editar
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {rows.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography variant="body2" color="text.secondary">
                        Sin resultados.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_e, p) => setPage(p)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </Paper>
      </Box>
    </PageContainer>
  );
}
