// src/views/inventario/InventarioList.tsx
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Stack, Typography, Button, Alert, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  Paper, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import { useAuth } from 'src/context/AuthContext';
import { Link } from 'react-router-dom';

type Material = {
  id_material: number;
  nombre: string;
  presentacion?: string | null;
  color?: string | null;
  textura?: string | null;
  unidad_medida: string;
  costo_unitario: number;
  saldo: number;
  total_count?: number;
};

export default function InventarioList() {
  useEffect(() => { document.title = 'Inventario | Sistema Aracah'; }, []);
  const auth = useAuth();
  const token = auth?.idToken || '';
  const rol = (auth?.perfil?.nombre_rol || '').toLowerCase();
  const canManage = rol.includes('admin') || rol.includes('supervisor');

  const headers = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }), [token]);

  // filtros
  const [q, setQ] = useState('');
  // datos
  const [rows, setRows] = useState<Material[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const firstLoad = useRef(true);

  // diálogo crear
  const [dlgOpen, setDlgOpen] = useState(false);
  const [fNombre, setFNombre] = useState('');
  const [fUM, setFUM] = useState('');
  const [fCosto, setFCosto] = useState<string>('');
  const [fPresent, setFPresent] = useState('');
  const [fColor, setFColor] = useState('');
  const [fTextura, setFTextura] = useState('');

  const fmt = (n: number | null | undefined) =>
    (n ?? 0).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fetchData = async (overrides?: Partial<{ q: string; page: number; pageSize: number }>) => {
    const f = { q, page: page + 1, pageSize, ...overrides };
    try {
      setErr(''); setLoading(true);
      const url = new URL('http://localhost:3001/api/materiales');
      url.searchParams.set('page', String(f.page));
      url.searchParams.set('pageSize', String(f.pageSize));
      if (f.q) url.searchParams.set('q', f.q);
      const r = await fetch(url.toString(), { headers });
      if (!r.ok) throw new Error(await r.text());
      const js = await r.json();
      setRows(js.items || []);
      setTotal(js.total || 0);
    } catch (e: any) {
      setErr(e.message || 'Error cargando inventario');
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
  const onClear = () => {
    setQ(''); setPage(0);
    fetchData({ q: '', page: 1 });
  };

  // Crear material
  const resetForm = () => { setFNombre(''); setFUM(''); setFCosto(''); setFPresent(''); setFColor(''); setFTextura(''); };
  const onCreate = async () => {
    try {
      setErr(''); setOk('');
      if (!fNombre.trim() || !fUM.trim() || !fCosto) {
        setErr('Nombre, UM y Costo unitario son obligatorios.');
        return;
      }
      const body = {
        nombre: fNombre.trim(),
        unidad_medida: fUM.trim(),
        costo_unitario: Number(fCosto),
        presentacion: fPresent || null,
        color: fColor || null,
        textura: fTextura || null,
      };
      const r = await fetch('http://localhost:3001/api/materiales', {
        method: 'POST', headers, body: JSON.stringify(body)
      });
      if (!r.ok) throw new Error(await r.text());
      setOk('Material creado');
      setDlgOpen(false);
      resetForm();
      await fetchData({ page: 1 });
    } catch (e:any) {
      setErr(e.message || 'Error creando material');
    }
  };

  // Exportar CSV (de la página actual)
  const onExportCSV = () => {
    const headersCsv = ['#','Nombre','UM','Costo unitario','Saldo'];
    const lines = rows.map(r => ([
      r.id_material,
      r.nombre || '',
      r.unidad_medida || '',
      (r.costo_unitario ?? '').toString(),
      (r.saldo ?? '').toString(),
    ].map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(',')));
    const csv = [headersCsv.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `inventario_${new Date().toISOString().replace(/[:.-]/g,'')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageContainer title="Inventario | Sistema Aracah" description="Materiales y saldos">
      <Box>
        <Typography variant="h4" fontWeight={700} mb={2}>Inventario</Typography>

        {ok && <Alert severity="success" sx={{ mb:2 }}>{ok}</Alert>}

        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display:'grid', gridTemplateColumns:{ xs:'1fr', md:'repeat(12,1fr)' }, gap:2 }}>
            <Box sx={{ gridColumn:{ xs:'1 / -1', md:'span 4' } }}>
              <CustomTextField
                label="Buscar (nombre/color/presentación)"
                value={q}
                onChange={(e:any)=>setQ(e.target.value)}
                fullWidth
                placeholder="Ej. Tela / Rojo / 1 lt"
              />
            </Box>
            <Box sx={{ gridColumn:'1 / -1' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button variant="contained" onClick={onBuscar} disabled={loading}>
                  {loading ? 'Cargando...' : 'Buscar'}
                </Button>
                <Button variant="outlined" onClick={onClear} disabled={loading}>
                  Limpiar
                </Button>
                <Box flexGrow={1} />
                <Button
                  variant="outlined"
                  onClick={onExportCSV}
                  disabled={loading || rows.length===0}
                >
                  Exportar CSV
                </Button>
                {canManage && (
                  <Button
                    variant="contained"
                    onClick={() => { resetForm(); setDlgOpen(true); }}
                  >
                    Agregar material
                  </Button>
                )}
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
                  <TableCell>Nombre</TableCell>
                  <TableCell>UM</TableCell>
                  <TableCell align="right">Costo unitario</TableCell>
                  <TableCell align="right">Saldo</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(m => (
                  <TableRow key={m.id_material} hover>
                    <TableCell>{m.id_material}</TableCell>
                    <TableCell>{m.nombre}</TableCell>
                    <TableCell>{m.unidad_medida}</TableCell>
                    <TableCell align="right">{fmt(m.costo_unitario)}</TableCell>
                    <TableCell align="right">{fmt(m.saldo)}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        component={Link}
                        to={`/inventario/${m.id_material}`}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length===0 && !loading && (
                  <TableRow><TableCell colSpan={6}>Sin resultados.</TableCell></TableRow>
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

      {/* Diálogo Crear Material */}
      <Dialog open={dlgOpen} onClose={()=>setDlgOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo material</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display:'grid', gridTemplateColumns:{ xs:'1fr', md:'repeat(12,1fr)' }, gap:2 }}>
            <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 8' } }}>
              <CustomTextField label="Nombre *" fullWidth value={fNombre} onChange={(e:any)=>setFNombre(e.target.value)} />
            </Box>
            <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 4' } }}>
              <CustomTextField label="UM *" fullWidth placeholder="pz / m / lt / kg" value={fUM} onChange={(e:any)=>setFUM(e.target.value)} />
            </Box>
            <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 4' } }}>
              <CustomTextField label="Costo unitario *" type="number" fullWidth value={fCosto} onChange={(e:any)=>setFCosto(e.target.value)} />
            </Box>
            <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 4' } }}>
              <CustomTextField label="Presentación" fullWidth value={fPresent} onChange={(e:any)=>setFPresent(e.target.value)} />
            </Box>
            <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 4' } }}>
              <CustomTextField label="Color" fullWidth value={fColor} onChange={(e:any)=>setFColor(e.target.value)} />
            </Box>
            <Box sx={{ gridColumn:'1 / -1' }}>
              <CustomTextField label="Textura" fullWidth value={fTextura} onChange={(e:any)=>setFTextura(e.target.value)} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setDlgOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={onCreate}>Crear</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
