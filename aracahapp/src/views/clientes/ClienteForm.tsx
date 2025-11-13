// src/views/clientes/ClienteForm.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Box, Stack, Typography, Button, Alert, Paper, MenuItem, Snackbar,
} from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import { useAuth } from 'src/context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

type Option = { value: number; label: string };

export default function ClienteForm() {
  useEffect(() => { document.title = 'Nuevo cliente | Sistema Aracah'; }, []);
  const auth = useAuth();
  const token = auth?.idToken || '';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('return') || '';

  const headers = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }), [token]);

  // Catálogos desde API (con fallback local si falla)
  const [generos, setGeneros] = useState<Option[]>([]);
  const [tipos, setTipos] = useState<Option[]>([]);

  useEffect(() => {
    const loadCatalogos = async () => {
      try {
        const h = { Authorization: `Bearer ${token}` };
        const [rg, rt] = await Promise.all([
          fetch('http://localhost:3001/api/catalogos/generos', { headers: h }),
          fetch('http://localhost:3001/api/catalogos/tipos-cliente', { headers: h }),
        ]);
        const jg = rg.ok ? await rg.json() : { items: [] };
        const jt = rt.ok ? await rt.json() : { items: [] };
        setGeneros((jg.items || []).map((x: any) => ({ value: x.id, label: x.nombre })));
        setTipos((jt.items || []).map((x: any) => ({ value: x.id, label: x.nombre })));

        // Fallback si vienen vacíos
        if (!jg.items?.length) {
          setGeneros([
            { value: 1, label: 'Masculino' },
            { value: 2, label: 'Femenino' },
            { value: 3, label: 'Otro' },
            { value: 4, label: 'No definido' },
          ]);
        }
        if (!jt.items?.length) {
          setTipos([
            { value: 1, label: 'Frecuente' },
            { value: 2, label: 'Institucional' },
            { value: 3, label: 'Nuevo' },
          ]);
        }
      } catch {
        // Fallback en caso de error de red/API
        setGeneros([
          { value: 1, label: 'Masculino' },
          { value: 2, label: 'Femenino' },
          { value: 3, label: 'Otro' },
          { value: 4, label: 'No definido' },
        ]);
        setTipos([
          { value: 1, label: 'Frecuente' },
          { value: 2, label: 'Institucional' },
          { value: 3, label: 'Nuevo' },
        ]);
      }
    };
    if (token) loadCatalogos();
  }, [token]);

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

      const r = await fetch('http://localhost:3001/api/clientes', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await r.text());
      const js = await r.json(); // { id_cliente }
      setOkMsg('Cliente creado exitosamente.');
      setSnackOpen(true);

      // Si venimos desde Nueva Cotización, volvemos y pasamos createdId
      if (returnTo) {
        setTimeout(() => {
          const glue = returnTo.includes('?') ? '&' : '?';
          navigate(`${returnTo}${glue}createdId=${js.id_cliente}`);
        }, 700);
      } else {
        // O volvemos al listado de clientes
        setTimeout(() => navigate('/clientes'), 700);
      }
    } catch (e: any) {
      setErr(e.message || 'Error al crear el cliente');
    }
  };

  return (
    <PageContainer title="Nuevo cliente | Sistema Aracah" description="Crear cliente">
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h4" fontWeight={700}>Nuevo cliente</Typography>
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
                {generos.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
              </CustomTextField>
            </Box>
            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' } }}>
              <CustomTextField label="Tipo de cliente" select fullWidth value={idTipoCliente} onChange={(e:any)=>setIdTipoCliente(Number(e.target.value))}>
                {tipos.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
              </CustomTextField>
            </Box>

            <Box sx={{ gridColumn: '1 / -1' }}>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => (returnTo ? navigate(returnTo) : navigate('/clientes'))}
                >
                  Volver
                </Button>

                <Button variant="contained" onClick={onSubmit} disabled={!canSave}>Guardar</Button>
              </Stack>
            </Box>

          </Box>
        </Paper>
      </Box>

      <Snackbar open={snackOpen} onClose={()=>setSnackOpen(false)} autoHideDuration={2000} message="Cliente creado" />
    </PageContainer>
  );
}
