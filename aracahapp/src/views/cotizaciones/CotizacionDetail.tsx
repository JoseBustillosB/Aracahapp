'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Stack, Typography, Button, Alert, CircularProgress,
  Paper, Divider, Table, TableHead, TableRow, TableCell, TableBody
} from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import StatusChip from 'src/components/shared/StatusChip';
import { useAuth } from 'src/context/AuthContext';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import dayjs from 'dayjs';

type Cotizacion = {
  id_cotizacion: number;
  numero: string | null;
  fecha_cotizacion: string;    // ISO
  valida_hasta: string | null; // ISO
  id_cliente: number;
  cliente: string;
  estado_codigo: 'PEN'|'APR'|'RECH'|'VENC';
  estado_nombre: string;
  descripcion: string | null;
  total?: number | null;
};

/** ===== NUEVO: tipo para las líneas =====
 *   Ajusta los nombres si tu SP retorna otros alias.
 */
type DetalleItem = {
  id_producto: number;
  sku?: string | null;
  nombre?: string | null;
  cantidad: number;
  precio_unitario: number;         // del catálogo o override
  impuesto_porcentaje: number;     // p.ej. 15.00
  subtotal?: number | null;        // si tu tabla los tiene computados
  impuesto_monto?: number | null;  // idem
  total_linea?: number | null;     // idem
};

export default function CotizacionDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isEdit = location.pathname.endsWith('/editar'); // /cotizaciones/:id/editar

  useEffect(() => {
    document.title = (isEdit ? 'Editar' : 'Detalle') + ' Cotización | Sistema Aracah';
  }, [isEdit]);

  const navigate = useNavigate();
  const auth = useAuth();
  const token = auth?.idToken || '';

  const rol = (auth?.perfil?.nombre_rol || '').toLowerCase();
  const isVendedor = rol.includes('vendedor');
  const isSupervisor = rol.includes('supervisor');
  const isAdmin = rol.includes('admin');

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
    [token]
  );

  const [data, setData] = useState<Cotizacion | null>(null);
  const [detalle, setDetalle] = useState<DetalleItem[]>([]); // <<< NUEVO: líneas
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');
  const [okMsg, setOkMsg] = useState<string>('');

  // Campos editables (solo si estado PEN y rol vendedor/supervisor/admin)
  const canEditFields = !!(data && data.estado_codigo === 'PEN' && (isVendedor || isSupervisor || isAdmin));
  const [form, setForm] = useState<{ descripcion: string; valida_hasta: string }>({
    descripcion: '',
    valida_hasta: '',
  });

  const firstLoad = useRef(true);

  // Helper para formatear dinero rápido
  const fmt = (n: number | null | undefined) =>
    (n ?? 0).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Totales (si tu tabla no trae columnas computadas, los calculamos)
  const totals = useMemo(() => {
    if (!detalle?.length) return { sub: 0, imp: 0, tot: 0 };
    // Si vienen columnas computadas, úsalas; sino calcula
    const anyComputed = detalle[0]?.subtotal != null || detalle[0]?.total_linea != null;
    if (anyComputed) {
      const sub = detalle.reduce((a, r) => a + (r.subtotal ?? r.cantidad * r.precio_unitario), 0);
      const tot = detalle.reduce((a, r) => a + (r.total_linea ?? r.cantidad * r.precio_unitario * (1 + (r.impuesto_porcentaje || 0) / 100)), 0);
      const imp = tot - sub;
      return { sub, imp, tot };
    }
    // cálculo manual
    const sub = detalle.reduce((a, r) => a + r.cantidad * r.precio_unitario, 0);
    const imp = detalle.reduce((a, r) => a + (r.cantidad * r.precio_unitario) * ((r.impuesto_porcentaje || 0) / 100), 0);
    const tot = sub + imp;
    return { sub, imp, tot };
  }, [detalle]);

  const loadData = async () => {
    try {
      setErr('');
      setOkMsg('');
      setLoading(true);
      const r = await fetch(`http://localhost:3001/api/cotizaciones/${id}`, { headers });
      if (!r.ok) throw new Error(await r.text());
      const js = await r.json();
      // Backend retorna { header, detalle } (ver controller)
      const h: Cotizacion = js?.header || js?.cotizacion || js;
      setData(h);
      setDetalle(Array.isArray(js?.detalle) ? js.detalle : []); // <<< líneas a estado
      setForm({
        descripcion: h?.descripcion ?? '',
        valida_hasta: h?.valida_hasta ? dayjs(h.valida_hasta).format('YYYY-MM-DD') : '',
      });
    } catch (e: any) {
      setErr(e.message || 'Error cargando cotización');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !id) return;
    if (firstLoad.current) {
      firstLoad.current = false;
      loadData();
    } else {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

  /* ========= Acciones ========= */

  // Guardar (PUT) — solo cuando canEditFields && isEdit
  const onSave = async () => {
    if (!data) return;
    try {
      setErr('');
      setOkMsg('');
      setLoading(true);

      const body = {
        descripcion: form.descripcion,
        valida_hasta: form.valida_hasta ? form.valida_hasta : null, // YYYY-MM-DD
      };

      const r = await fetch(`http://localhost:3001/api/cotizaciones/${data.id_cotizacion}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await r.text());
      setOkMsg('Cambios guardados.');
      await loadData();
      // Si quieres, puedes navegar de vuelta a /cotizaciones
      // navigate('/cotizaciones');
      setTimeout(() => navigate('/cotizaciones'), 800);
    } catch (e: any) {
      setErr(e.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  // Aprobar (Supervisor/Admin)
  const onApprove = async () => {
    if (!data) return;
    try {
      setErr('');
      setOkMsg('');
      setLoading(true);
      const r = await fetch(`http://localhost:3001/api/cotizaciones/${data.id_cotizacion}/approve`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ comentario: 'Aprobada desde UI' }),
      });
      if (!r.ok) throw new Error(await r.text());
      setOkMsg('Cotización aprobada.');
      await loadData();
    } catch (e: any) {
      setErr(e.message || 'Error al aprobar');
    } finally {
      setLoading(false);
    }
  };

  // Rechazar (Supervisor/Admin)
  const onReject = async () => {
    if (!data) return;
    try {
      setErr('');
      setOkMsg('');
      setLoading(true);
      const r = await fetch(`http://localhost:3001/api/cotizaciones/${data.id_cotizacion}/reject`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ comentario: 'Rechazada desde UI' }),
      });
      if (!r.ok) throw new Error(await r.text());
      setOkMsg('Cotización rechazada.');
      await loadData();
    } catch (e: any) {
      setErr(e.message || 'Error al rechazar');
    } finally {
      setLoading(false);
    }
  };

  // Confirmar a Pedido (Supervisor/Admin) — requiere estado APR
  const onConfirmToPedido = async () => {
    if (!data) return;
    try {
      setErr('');
      setOkMsg('');
      setLoading(true);
      const r = await fetch(`http://localhost:3001/api/cotizaciones/${data.id_cotizacion}/confirm-to-pedido`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ comentario: 'Confirmada a pedido desde UI' }),
      });
      if (!r.ok) throw new Error(await r.text());
      setOkMsg('Se generó el Pedido desde la cotización.');
      await loadData();
    } catch (e: any) {
      setErr(e.message || 'Error al confirmar pedido');
    } finally {
      setLoading(false);
    }
  };

  const readOnly = !(isEdit && canEditFields);

  return (
    <PageContainer
      title={`${isEdit ? 'Editar' : 'Detalle'} Cotización | Sistema Aracah`}
      description="Detalle de cotización y acciones por rol"
    >
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <Typography variant="h4" fontWeight={700}>
            {isEdit ? 'Editar cotización' : 'Detalle de cotización'}
          </Typography>
          {loading && <CircularProgress size={18} />}
          <Box flexGrow={1} />
          <Button component={Link} to="/cotizaciones" variant="outlined">Volver</Button>
        </Stack>

        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
        {okMsg && <Alert severity="success" sx={{ mb: 2 }}>{okMsg}</Alert>}

        <Paper sx={{ p: 2, mb: 2 }}>
          {!data ? (
            <Typography variant="body2" color="text.secondary">
              {loading ? 'Cargando...' : 'No se encontró la cotización.'}
            </Typography>
          ) : (
            <>
              {/* Cabecera */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gap: 2 }}>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}>
                  <CustomTextField label="Número" value={data.numero || '-'} fullWidth disabled />
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}>
                  <CustomTextField
                    label="Fecha"
                    value={dayjs(data.fecha_cotizacion).format('YYYY-MM-DD')}
                    fullWidth
                    disabled
                  />
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}>
                  <CustomTextField label="Cliente" value={data.cliente} fullWidth disabled />
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' }, display: 'flex', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Estado</Typography>
                    <Box mt={0.5}><StatusChip code={data.estado_codigo} /></Box>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Editables */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gap: 2 }}>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 8' } }}>
                  <CustomTextField
                    label="Descripción"
                    fullWidth
                    multiline
                    minRows={3}
                    value={form.descripcion}
                    onChange={(e: any) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                    disabled={readOnly}
                  />
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' } }}>
                  <CustomTextField
                    label="Válida hasta"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={form.valida_hasta}
                    onChange={(e: any) => setForm((f) => ({ ...f, valida_hasta: e.target.value }))}
                    disabled={readOnly}
                  />
                </Box>
              </Box>

              {/* ===== NUEVO: Detalle de líneas ===== */}
              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Líneas</Typography>
              {detalle.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Esta cotización no tiene líneas.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>SKU</TableCell>
                      <TableCell>Nombre</TableCell>
                      <TableCell align="right">Cant.</TableCell>
                      <TableCell align="right">Precio</TableCell>
                      <TableCell align="right">Imp. %</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                      <TableCell align="right">Impuesto</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detalle.map((it, idx) => {
                      const sub = it.subtotal ?? it.cantidad * it.precio_unitario;
                      const imp = it.impuesto_monto ?? sub * ((it.impuesto_porcentaje || 0) / 100);
                      const tot = it.total_linea ?? sub + imp;
                      return (
                        <TableRow key={`${it.id_producto}-${idx}`}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>{it.sku || '-'}</TableCell>
                          <TableCell>{it.nombre || '-'}</TableCell>
                          <TableCell align="right">{it.cantidad}</TableCell>
                          <TableCell align="right">{fmt(it.precio_unitario)}</TableCell>
                          <TableCell align="right">{(it.impuesto_porcentaje ?? 0).toFixed(2)}%</TableCell>
                          <TableCell align="right">{fmt(sub)}</TableCell>
                          <TableCell align="right">{fmt(imp)}</TableCell>
                          <TableCell align="right">{fmt(tot)}</TableCell>
                        </TableRow>
                      );
                    })}
                    {/* Totales al pie */}
                    <TableRow>
                      <TableCell colSpan={6} />
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Subtotal</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Impuesto</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={6} />
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(totals.sub)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(totals.imp)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(totals.tot)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}

              {/* Acciones */}
              <Stack direction="row" spacing={1} mt={2}>
                {isEdit && canEditFields && (
                  <Button variant="contained" onClick={onSave} disabled={loading}>
                    Guardar cambios
                  </Button>
                )}

                {/* Supervisor/Admin pueden aprobar o rechazar si está PEN */}
                {(isSupervisor || isAdmin) && data.estado_codigo === 'PEN' && (
                  <>
                    <Button color="success" variant="contained" onClick={onApprove} disabled={loading}>
                      Aprobar
                    </Button>
                    <Button color="error" variant="outlined" onClick={onReject} disabled={loading}>
                      Rechazar
                    </Button>
                  </>
                )}

                {/* Confirmar a Pedido: solo si APR y Supervisor/Admin */}
                {(isSupervisor || isAdmin) && data.estado_codigo === 'APR' && (
                  <Button color="primary" variant="contained" onClick={onConfirmToPedido} disabled={loading}>
                    Confirmar a Pedido
                  </Button>
                )}
              </Stack>
            </>
          )}
        </Paper>
      </Box>
    </PageContainer>
  );
}
