'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Box, Stack, Typography, Button, Alert, Paper, Divider
} from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import { useAuth } from 'src/context/AuthContext';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

type Cliente = {
  id_cliente: number;
  nombre: string;
  telefono_movil?: string | null;
  telefono_fijo?: string | null;
  email?: string | null;
  direccion?: string | null;
  fecha_registro?: string | null;
  id_genero: number;
  id_tipo_cliente: number;
};

export default function ClienteView() {
  useEffect(() => { document.title = 'Ver cliente | Sistema Aracah'; }, []);
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

  const [item, setItem] = useState<Cliente | null>(null);
  const [err, setErr] = useState('');

  const load = async () => {
    try {
      setErr('');
      const r = await fetch(`http://localhost:3001/api/clientes/${id}`, { headers });
      if (!r.ok) throw new Error(await r.text());
      const js = await r.json();
      setItem(js.item);
    } catch (e: any) {
      setErr(e.message || 'Error cargando cliente');
    }
  };

  useEffect(() => { if (id && token) load(); /* eslint-disable-next-line */ }, [id, token]);

  return (
    <PageContainer title="Ver cliente | Sistema Aracah" description="Detalle de cliente">
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h4" fontWeight={700}>Cliente</Typography>
          <Stack direction="row" spacing={1}>
            {!!item && (
              <Button
                component={Link}
                to={`/clientes/${item.id_cliente}/editar${returnTo ? `?return=${encodeURIComponent(returnTo)}` : ''}`}
                variant="contained"
              >
                Editar
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={() => returnTo ? navigate(returnTo) : navigate('/clientes')}
            >
              Volver
            </Button>
          </Stack>
        </Stack>

        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

        <Paper sx={{ p: 2 }}>
          {!item ? 'Cargando...' : (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gap: 2 }}>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 6' } }}>
                  <CustomTextField label="Nombre" value={item.nombre} fullWidth disabled />
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}>
                  <CustomTextField label="Teléfono móvil" value={item.telefono_movil || ''} fullWidth disabled />
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}>
                  <CustomTextField label="Teléfono fijo" value={item.telefono_fijo || ''} fullWidth disabled />
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' } }}>
                  <CustomTextField label="Email" value={item.email || ''} fullWidth disabled />
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 8' } }}>
                  <CustomTextField label="Dirección" value={item.direccion || ''} fullWidth multiline minRows={2} disabled />
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' } }}>
                  <CustomTextField label="Género (id)" value={item.id_genero} fullWidth disabled />
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' } }}>
                  <CustomTextField label="Tipo cliente (id)" value={item.id_tipo_cliente} fullWidth disabled />
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' } }}>
                  <CustomTextField label="Fecha registro" value={item.fecha_registro || ''} fullWidth disabled />
                </Box>
              </Box>
              <Divider sx={{ mt: 2 }} />
            </>
          )}
        </Paper>
      </Box>
    </PageContainer>
  );
}
