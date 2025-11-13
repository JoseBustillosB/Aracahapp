'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Box, Stack, Typography, Button, Alert, Paper, MenuItem, Snackbar,
} from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import { useAuth } from 'src/context/AuthContext';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

type Option = { value: number; label: string };
const GENEROS: Option[] = [
  { value: 1, label: 'Masculino' },
  { value: 2, label: 'Femenino' },
  { value: 3, label: 'Otro' },
  { value: 4, label: 'No definido' },
];
const TIPOS: Option[] = [
  { value: 1, label: 'Frecuente' },
  { value: 2, label: 'Institucional' },
  { value: 3, label: 'Nuevo' },
];

export default function ClienteEdit() {
  useEffect(() => { document.title = 'Editar cliente | Sistema Aracah'; }, []);
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('return') || '';

  const auth = useAuth();
  const token = auth?.idToken || '';
  const headers = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }), [token]);
  const navigate = useNavigate();

  // Form
  const [nombre, setNombre] = useState('');
  const [telefonoMovil, setTelefonoMovil] = useState('');
  const [telefonoFijo, setTelefonoFijo] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [idGenero, setIdGenero] = useState<number | ''>('');
  const [idTipoCliente, setIdTipoCliente] = useState<number | ''>('');

  const [err, setErr] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [snackOpen, setSnackOpen] = useState(false);

  const canSave = !!nombre && !!idGenero && !!idTipoCliente;

  const load = async () => {
    try {
      setErr('');
      const r = await fetch(`http://localhost:3001/api/clientes/${id}`, { headers });
      if (!r.ok) throw new Error(await r.text());
      const { item } = await r.json();
      setNombre(item.nombre || '');
      setTelefonoMovil(item.telefono_movil || '');
      setTelefonoFijo(item.telefono_fijo || '');
      setEmail(item.email || '');
      setDireccion(item.direccion || '');
      setIdGenero(item.id_genero || '');
      setIdTipoCliente(item.id_tipo_cliente || '');
    } catch (e: any) {
      setErr(e.message || 'Error cargando cliente');
    }
  };

  useEffect(() => { if (id && token) load(); /* eslint-disable-next-line */ }, [id, token]);

  const onSubmit = async () => {
    try {
      setErr(''); setOkMsg('');
      if (!canSave) { setErr('Completa nombre, género y tipo de cliente'); return; }

      const body = {
        nombre,
        telefono_movil: telefonoMovil || null,
        telefono_fijo:  telefonoFijo  || null,
        email:          email         || null,
        direccion:      direccion     || null,
        id_genero:      Number(idGenero),
        id_tipo_cliente:Number(idTipoCliente),
      };

      const r = await fetch(`http://localhost:3001/api/clientes/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await r.text());
      setOkMsg('Cambios guardados.');
      setSnackOpen(true);
      setTimeout(() => {
        if (returnTo) navigate(returnTo);
        else navigate(`/clientes/${id}`);
      }, 700);
    } catch (e: any) {
      setErr(e.message || 'Error al actualizar el cliente');
    }
  };

  return (
    <PageContainer title="Editar cliente | Sistema Aracah" description="Editar datos de cliente">
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h4" fontWeight={700}>Editar cliente</Typography>
          <Button variant="outlined" onClick={() => (returnTo ? navigate(returnTo) : navigate(`/clientes/${id}`))}>
            Volver
          </Button>
        </Stack>

        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
        {okMsg && <Alert severity="success" sx={{ mb: 2 }}>{okMsg}</Alert>}

        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gap: 2 }}>
            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 6' } }}>
              <CustomTextField label="Nombre" fullWidth value={nombre} onChange={(e:any)=>setNombre(e.target.value)} />
            </Box>
            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}>
              <CustomTextField label="Teléfono móvil" fullWidth value={telefonoMovil} onChange={(e:any)=>setTelefonoMovil(e.target.value)} />
            </Box>
            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}>
              <CustomTextField label="Teléfono fijo" fullWidth value={telefonoFijo} onChange={(e:any)=>setTelefonoFijo(e.target.value)} />
            </Box>
            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' } }}>
              <CustomTextField label="Email" fullWidth value={email} onChange={(e:any)=>setEmail(e.target.value)} />
            </Box>
            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 8' } }}>
              <CustomTextField label="Dirección" fullWidth multiline minRows={2} value={direccion} onChange={(e:any)=>setDireccion(e.target.value)} />
            </Box>
            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' } }}>
              <CustomTextField label="Género" select fullWidth value={idGenero} onChange={(e:any)=>setIdGenero(Number(e.target.value))}>
                {GENEROS.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
              </CustomTextField>
            </Box>
            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' } }}>
              <CustomTextField label="Tipo de cliente" select fullWidth value={idTipoCliente} onChange={(e:any)=>setIdTipoCliente(Number(e.target.value))}>
                {TIPOS.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
              </CustomTextField>
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button variant="contained" onClick={onSubmit} disabled={!canSave}>Guardar</Button>
              </Stack>
            </Box>
          </Box>
        </Paper>
      </Box>

      <Snackbar open={snackOpen} onClose={()=>setSnackOpen(false)} autoHideDuration={2000} message="Cambios guardados" />
    </PageContainer>
  );
}
