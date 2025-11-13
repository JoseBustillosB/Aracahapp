// src/views/inventario/MaterialView.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Box, Stack, Typography, Button, Alert, Paper, Divider,
  Table, TableHead, TableRow, TableCell, TableBody, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import { useAuth } from 'src/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
// Import correcto del diálogo de movimientos
import KardexMoveDialog from 'src/views/inventario/KardexMoveDialog';

type Material = {
  id_material: number;
  nombre: string;
  descripcion?: string | null;
  presentacion?: string | null;
  color?: string | null;
  textura?: string | null;
  unidad_medida: string;
  costo_unitario: number;
  saldo: number;
};

type KardexItem = {
  id_kardex: number;
  id_material: number;
  material: string;
  fecha: string;
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  cantidad: number;
  costo_unitario?: number | null;
  id_origen?: number | null;
  origen?: string | null;
  comentario?: string | null;
};

export default function MaterialView() {
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

  const [item, setItem] = useState<Material | null>(null);
  const [kardex, setKardex] = useState<KardexItem[]>([]);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  // filtros de kardex
  const [tipo, setTipo] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  // diálogo movimientos
  const [dlgOpen, setDlgOpen] = useState<false | 'ENTRADA' | 'SALIDA' | 'AJUSTE'>(false);

  // diálogo editar
  const [editOpen, setEditOpen] = useState(false);
  const [eNombre, setENombre] = useState('');
  const [eUM, setEUM] = useState('');
  const [eCosto, setECosto] = useState<string>('');
  const [ePresent, setEPresent] = useState('');
  const [eColor, setEColor] = useState('');
  const [eTextura, setETextura] = useState('');

  useEffect(()=>{ document.title = `Material ${id} | Sistema Aracah`; },[id]);

  const fmt = (n: number | null | undefined) =>
    (n ?? 0).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const loadItem = async () => {
    try {
      setErr('');
      const r = await fetch(`http://localhost:3001/api/materiales/${id}`, { headers });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setItem(data);
    } catch (e:any) {
      setErr(e.message || 'Error cargando material');
    }
  };

  const loadKardex = async () => {
    try {
      setErr('');
      const url = new URL(`http://localhost:3001/api/materiales/${id}/kardex`);
      if (tipo) url.searchParams.set('tipo', tipo);
      if (desde) url.searchParams.set('desde', desde);
      if (hasta) url.searchParams.set('hasta', hasta);
      const r = await fetch(url.toString(), { headers });
      if (!r.ok) throw new Error(await r.text());
      const js = await r.json();
      setKardex(js.items || []);
    } catch (e:any) {
      setErr(e.message || 'Error cargando kárdex');
    }
  };

  useEffect(()=>{ if(token && id){ loadItem(); loadKardex(); } },[token,id]); // eslint-disable-line

  const onRecalc = async () => {
    try {
      setErr(''); setOk('');
      const r = await fetch('http://localhost:3001/api/materiales/recalcular/stock', {
        method: 'POST', headers
      });
      if (!r.ok) throw new Error(await r.text());
      setOk('Stock recalculado');
      await loadItem();
      await loadKardex();
    } catch (e:any) {
      setErr(e.message || 'Error recalculando stock');
    }
  };

  // Abrir diálogo editar con datos actuales
  const openEdit = () => {
    if (!item) return;
    setENombre(item.nombre || '');
    setEUM(item.unidad_medida || '');
    setECosto(String(item.costo_unitario ?? ''));
    setEPresent(item.presentacion || '');
    setEColor(item.color || '');
    setETextura(item.textura || '');
    setEditOpen(true);
  };

  const onSaveEdit = async () => {
    try {
      setErr(''); setOk('');
      if (!eNombre.trim() || !eUM.trim() || !eCosto) {
        setErr('Nombre, UM y Costo unitario son obligatorios.');
        return;
      }
      const body = {
        nombre: eNombre.trim(),
        unidad_medida: eUM.trim(),
        costo_unitario: Number(eCosto),
        presentacion: ePresent || null,
        color: eColor || null,
        textura: eTextura || null,
      };
      const r = await fetch(`http://localhost:3001/api/materiales/${id}`, {
        method: 'PUT', headers, body: JSON.stringify(body)
      });
      if (!r.ok) throw new Error(await r.text());
      setOk('Material actualizado');
      setEditOpen(false);
      await loadItem();
    } catch (e:any) {
      setErr(e.message || 'Error actualizando material');
    }
  };

  const onDelete = async () => {
    if (!confirm('¿Eliminar este material? Esta acción no se puede deshacer.')) return;
    try {
      setErr(''); setOk('');
      const r = await fetch(`http://localhost:3001/api/materiales/${id}`, {
        method: 'DELETE', headers
      });
      if (!r.ok) throw new Error(await r.text());
      navigate('/inventario');
    } catch (e:any) {
      setErr(e.message || 'Error eliminando material');
    }
  };

  return (
    <PageContainer title={`Material ${id} | Sistema Aracah`} description="Detalle de material">
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <Typography variant="h4" fontWeight={700}>Material #{id}</Typography>
          <Box flexGrow={1} />
          <Button variant="outlined" onClick={()=>navigate('/inventario')}>Volver</Button>
        </Stack>

        {err && <Alert severity="error" sx={{ mb:2 }}>{err}</Alert>}
        {ok &&  <Alert severity="success" sx={{ mb:2 }}>{ok}</Alert>}

        {/* Encabezado */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Encabezado</Typography>
          <Box sx={{ display:'grid', gridTemplateColumns:{ xs:'1fr', md:'repeat(12,1fr)' }, gap:2 }}>
            <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 4' } }}>
              <Chip label={`Nombre: ${item?.nombre || '-'}`} />
            </Box>
            <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 2' } }}>
              <Chip label={`UM: ${item?.unidad_medida || '-'}`} />
            </Box>
            <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 3' } }}>
              <Chip label={`Costo: ${fmt(item?.costo_unitario)}`} />
            </Box>
            <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 3' } }}>
              <Chip color="primary" label={`Saldo: ${fmt(item?.saldo)}`} />
            </Box>
          </Box>

          <Divider sx={{ my:2 }} />

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button variant="contained" onClick={()=>setDlgOpen('ENTRADA')}>Entrada</Button>
            <Button variant="outlined"  onClick={()=>setDlgOpen('AJUSTE')}>Ajuste</Button>
            <Button variant="outlined" color="warning" onClick={()=>setDlgOpen('SALIDA')}>Salida</Button>
            <Box flexGrow={1} />
            {canManage && (
              <>
                <Button variant="outlined" onClick={openEdit}>Editar</Button>
                <Button variant="outlined" color="error" onClick={onDelete}>Eliminar</Button>
              </>
            )}
            <Button variant="text" onClick={onRecalc}>Recalcular stock</Button>
          </Stack>
        </Paper>

        {/* Filtros kárdex */}
        <Paper sx={{ p:2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Kárdex</Typography>
          <Box sx={{ display:'grid', gridTemplateColumns:{ xs:'1fr', md:'repeat(12,1fr)' }, gap:2, mb:2 }}>
            <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 3' } }}>
              <CustomTextField
                select
                label="Tipo"
                fullWidth
                value={tipo}
                onChange={(e:any)=>setTipo(e.target.value)}
                SelectProps={{ native:true }}
              >
                <option value="">Todos</option>
                <option value="ENTRADA">Entrada</option>
                <option value="SALIDA">Salida</option>
                <option value="AJUSTE">Ajuste</option>
              </CustomTextField>
            </Box>
            <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 3' } }}>
              <CustomTextField type="date" label="Desde" fullWidth
                InputLabelProps={{ shrink:true }}
                value={desde} onChange={(e:any)=>setDesde(e.target.value)} />
            </Box>
            <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 3' } }}>
              <CustomTextField type="date" label="Hasta" fullWidth
                InputLabelProps={{ shrink:true }}
                value={hasta} onChange={(e:any)=>setHasta(e.target.value)} />
            </Box>
            <Box sx={{ gridColumn:'1 / -1' }}>
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={loadKardex}>Buscar</Button>
                <Button variant="outlined" onClick={() => { setTipo(''); setDesde(''); setHasta(''); setTimeout(loadKardex,0); }}>
                  Limpiar
                </Button>
              </Stack>
            </Box>
          </Box>

          <Box sx={{ overflowX:'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell align="right">Costo unit.</TableCell>
                  <TableCell>Origen</TableCell>
                  <TableCell>Comentario</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {kardex.map(k => (
                  <TableRow key={k.id_kardex} hover>
                    <TableCell>{k.id_kardex}</TableCell>
                    <TableCell>{dayjs(k.fecha).format('YYYY-MM-DD HH:mm')}</TableCell>
                    <TableCell>{k.tipo}</TableCell>
                    <TableCell align="right">{fmt(k.cantidad)}</TableCell>
                    <TableCell align="right">{k.costo_unitario != null ? fmt(k.costo_unitario) : '-'}</TableCell>
                    <TableCell>{k.origen || '-'}</TableCell>
                    <TableCell>{k.comentario || '-'}</TableCell>
                  </TableRow>
                ))}
                {kardex.length===0 && (
                  <TableRow><TableCell colSpan={7}>Sin movimientos.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      </Box>

      {/* Diálogo de movimiento */}
      <KardexMoveDialog
        open={!!dlgOpen}
        tipo={dlgOpen || 'ENTRADA'}
        onClose={() => setDlgOpen(false)}
        idMaterial={Number(id)}
        headers={headers}
        onDone={async ()=>{ await loadItem(); await loadKardex(); setDlgOpen(false); }}
      />

      {/* Diálogo editar material */}
      <Dialog open={editOpen} onClose={()=>setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar material</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display:'grid', gridTemplateColumns:{ xs:'1fr', md:'repeat(12,1fr)' }, gap:2 }}>
            <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 8' } }}>
              <CustomTextField label="Nombre *" fullWidth value={eNombre} onChange={(e:any)=>setENombre(e.target.value)} />
            </Box>
            <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 4' } }}>
              <CustomTextField label="UM *" fullWidth value={eUM} onChange={(e:any)=>setEUM(e.target.value)} />
            </Box>
            <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 4' } }}>
              <CustomTextField label="Costo unitario *" type="number" fullWidth value={eCosto} onChange={(e:any)=>setECosto(e.target.value)} />
            </Box>
            <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 4' } }}>
              <CustomTextField label="Presentación" fullWidth value={ePresent} onChange={(e:any)=>setEPresent(e.target.value)} />
            </Box>
            <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 4' } }}>
              <CustomTextField label="Color" fullWidth value={eColor} onChange={(e:any)=>setEColor(e.target.value)} />
            </Box>
            <Box sx={{ gridColumn:'1 / -1' }}>
              <CustomTextField label="Textura" fullWidth value={eTextura} onChange={(e:any)=>setETextura(e.target.value)} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setEditOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={onSaveEdit}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
