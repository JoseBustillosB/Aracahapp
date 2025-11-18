/* =====================================================
   DASHBOARD DE RESUMEN DE Mis productos más vendidos
===================================================== */

import { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  Card,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  CardContent,
} from '@mui/material';
import { useAuth } from 'src/context/AuthContext';

type TopProdItem = {
  sku: string;
  nombre: string;
  cantidad_total: number;
  total_vendido: number;
};

const MyContacts = () => {
  const authCtx: any = useAuth() || {};
  const { idToken, firebaseUser, perfil } = authCtx;

  const rawRole =
    (perfil?.nombre_rol ||
      perfil?.rol ||
      perfil?.nombreRol ||
      perfil?.role ||
      '') as string;
  const role = (rawRole || 'admin').toString().toLowerCase();
  const isVendedor = role === 'vendedor';

  const vendedorId =
    perfil?.id_vendedor ||
    perfil?.id_usuario ||
    perfil?.correo ||
    firebaseUser?.email ||
    firebaseUser?.uid ||
    null;

  const [items, setItems] = useState<TopProdItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        if (!idToken) return;
        setLoading(true);
        setError('');

        let url = 'http://localhost:3001/api/reportes/top-productos?top=5';
        if (isVendedor && vendedorId) {
          url += `&vendedor=${encodeURIComponent(String(vendedorId))}`;
        }

        const r = await fetch(url, {
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (!r.ok) throw new Error(await r.text());
        const js = await r.json();
        const arr: TopProdItem[] = (js.items || []).map((x: any) => ({
          sku: String(x.sku ?? ''),
          nombre: String(x.nombre ?? x.producto ?? ''),
          cantidad_total: Number(x.cantidad_total ?? x.cantidad ?? 0),
          total_vendido: Number(x.total_vendido ?? x.total ?? 0),
        }));

        setItems(arr);
      } catch (e: any) {
        setError(e.message || 'Error al cargar top productos');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [idToken, isVendedor, vendedorId]);

  const titulo = isVendedor ? 'Mis productos más vendidos' : 'Top productos';
  const subtitulo = isVendedor
    ? 'Productos que yo he vendido en el período consultado.'
    : 'Productos más vendidos en el período consultado.';

  return (
    <Card sx={{ height: '100%' }} variant="outlined">
      <CardContent>
        <Typography variant="h6" fontWeight={700} mb={0.5}>
          {titulo}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {subtitulo}
        </Typography>

        {loading && (
          <Typography variant="body2" color="text.secondary">
            Cargando productos...
          </Typography>
        )}

        {error && (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        )}

        {!loading && !error && items.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No hay datos de productos.
          </Typography>
        )}

        {!loading && !error && items.length > 0 && (
          <Box mt={1}>
            <List disablePadding>
              {items.map((prod, idx) => (
                <ListItem key={`${prod.sku}-${idx}`} disableGutters disablePadding>
                  <ListItemButton sx={{ py: 1, px: 1 }} disableRipple disableTouchRipple>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" fontWeight={600}>
                          #{idx + 1} {prod.nombre}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          SKU: {prod.sku} &nbsp;|&nbsp; Cantidad:{' '}
                          {prod.cantidad_total.toLocaleString()} &nbsp;|&nbsp; Total
                          vendido L. {prod.total_vendido.toLocaleString()}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default MyContacts;
