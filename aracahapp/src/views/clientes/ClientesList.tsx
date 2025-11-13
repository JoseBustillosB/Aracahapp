// src/views/clientes/ClientesList.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Box, Stack, Typography, Button, Alert, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  Paper, Divider,
} from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import { useAuth } from 'src/context/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';

type Cliente = {
  id_cliente: number;
  nombre: string;
  telefono_movil?: string | null;
  telefono_fijo?: string | null;
  email?: string | null;
  fecha_registro?: string;
  id_genero: number;
  id_tipo_cliente: number;
};

export default function ClientesList() {
  useEffect(() => { document.title = 'Clientes | Sistema Aracah'; }, []);

  const auth = useAuth();
  const token = auth?.idToken || '';
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('return') || '';

  // Filtros
  const [q, setQ] = useState('');

  // Datos
  const [rows, setRows] = useState<Cliente[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);       // UI 0-based
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');

  const headers = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }), [token]);

  // fetchData con overrides para evitar "estado viejo" al limpiar
  const fetchData = async (opts?: { qOverride?: string; pageOverride?: number; pageSizeOverride?: number }) => {
    try {
      setErr('');
      setLoading(true);

      const effQ = opts?.qOverride !== undefined ? opts.qOverride : q;
      const effPage = opts?.pageOverride !== undefined ? opts.pageOverride : page;
      const effPageSize = opts?.pageSizeOverride !== undefined ? opts.pageSizeOverride : pageSize;

      const url = new URL('http://localhost:3001/api/clientes');
      url.searchParams.set('page', String(effPage + 1));   // API 1-based
      url.searchParams.set('pageSize', String(effPageSize));
      if (effQ) url.searchParams.set('q', effQ);

      const r = await fetch(url.toString(), { headers });
      if (!r.ok) throw new Error(await r.text());
      const js = await r.json();
      setRows(js.items || []);
      setTotal(js.total || 0);
    } catch (e: any) {
      setErr(e.message || 'Error cargando clientes');
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial y cambios de paginación
  useEffect(() => {
    if (!token) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, pageSize]);

  const onBuscar = () => {
    setPage(0);
    // aseguramos usar el q actual y page=0
    fetchData({ qOverride: q, pageOverride: 0 });
  };

  const onClear = () => {
    // 1) limpiamos estado
    setQ('');
    setPage(0);
    // 2) disparamos fetch con overrides "limpios" (sin esperar al render)
    fetchData({ qOverride: '', pageOverride: 0 });
  };

  return (
    <PageContainer title="Clientes | Sistema Aracah" description="Listado de clientes">
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h4" fontWeight={700}>Clientes</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              component={Link}
              to={`/clientes/nuevo${returnTo ? `?return=${encodeURIComponent(returnTo)}` : ''}`}
              variant="contained"
            >
              Nuevo cliente
            </Button>
          </Stack>
        </Stack>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gap: 2 }}>
            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' } }}>
              <CustomTextField
                label="Buscar (nombre/teléfono/email)"
                fullWidth
                value={q}
                onChange={(e: any) => setQ(e.target.value)}
                placeholder="Ej. Ana / 9999 / @correo"
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
              </Stack>
            </Box>
          </Box>
        </Paper>

        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

        <Paper>
          <Box sx={{ px: 2, pt: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
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
                  <TableCell>Nombre</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Fecha registro</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id_cliente} hover>
                    <TableCell>{c.id_cliente}</TableCell>
                    <TableCell>{c.nombre}</TableCell>
                    <TableCell>{c.telefono_movil || c.telefono_fijo || '-'}</TableCell>
                    <TableCell>{c.email || '-'}</TableCell>
                    <TableCell>{c.fecha_registro || '-'}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="outlined"
                          component={Link}
                          to={`/clientes/${c.id_cliente}${returnTo ? `?return=${encodeURIComponent(returnTo)}` : ''}`}
                        >
                          Ver
                        </Button>
                        {/* Para edición futura: /clientes/:id/editar */}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6}>Sin resultados.</TableCell>
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
