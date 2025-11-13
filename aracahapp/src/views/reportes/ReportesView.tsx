// src/views/reportes/ReportesView.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Box, Stack, Typography, Button, Alert, Paper, Divider,
  TextField, Tabs, Tab, Table, TableHead, TableRow, TableCell, TableBody
} from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import { useAuth } from 'src/context/AuthContext';

// Recharts
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts';

// ===== Tipos =====
type VentaDiaItem = { fecha: string; subtotal: number; impuesto: number; total: number };

type TopProdItem = {
  sku: string; nombre: string; cantidad_total: number; total_vendido: number;
};

type OpTiempoItem = {
  id_op: number;
  id_pedido: number;
  estado: string;
  inicio: string | null;
  fin: string | null;
  duracion_horas: number | null;
};

type MatConsumoItem = { material: string; total_consumido: number };

type EntregaItem = {
  id_entrega: number;
  id_pedido: number;
  cliente: string;
  fecha: string | null;
  estado: string;
  transportista: string | null;
  guia: string | null;
  costo: number | null;
};

type ResumenEstadoItem = { estado: string; total: number };

const PIE_COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#6d4c41', '#9c27b0', '#00897b', '#7cb342'];

export default function ReportesView() {
  const auth = useAuth();
  const token = auth?.idToken || '';

  const headers = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }), [token]);

  const [tab, setTab] = useState<number>(0);
  const [fDesde, setFDesde] = useState<string>('');
  const [fHasta, setFHasta] = useState<string>('');
  const [err, setErr] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Estado por pestaña
  const [pedidosEstado, setPedidosEstado] = useState<ResumenEstadoItem[]>([]);
  const [totalVentas, setTotalVentas] = useState<number>(0);
  const [entregasEstado, setEntregasEstado] = useState<ResumenEstadoItem[]>([]);
  const [ventasDia, setVentasDia] = useState<VentaDiaItem[]>([]);
  const [top, setTop] = useState<TopProdItem[]>([]);
  const [ops, setOps] = useState<OpTiempoItem[]>([]);
  const [mats, setMats] = useState<MatConsumoItem[]>([]);
  const [ents, setEnts] = useState<EntregaItem[]>([]);

  // ===== helpers =====
  const buildQ = (d: string, h: string) => {
    const qs: string[] = [];
    if (d) qs.push(`desde=${encodeURIComponent(d)}`);
    if (h) qs.push(`hasta=${encodeURIComponent(h)}`);
    return qs.length ? `?${qs.join('&')}` : '';
  };

  // ====== Loaders (reciben query de forma explícita) ======
  const loadResumen = async (qStr: string) => {
    const r = await fetch(`http://localhost:3001/api/reportes/resumen${qStr}`, { headers });
    if (!r.ok) throw new Error(await r.text());
    const js = await r.json();

    const ped = (js.pedidos_por_estado || []).map((x: any) => ({
      estado: x.estado ?? x.nombre ?? '',
      total: Number(x.total || 0),
    })) as ResumenEstadoItem[];

    const ent = (js.entregas_por_estado || []).map((x: any) => ({
      estado: x.estado ?? x.nombre ?? '',
      total: Number(x.total || 0),
    })) as ResumenEstadoItem[];

    setPedidosEstado(ped);
    setEntregasEstado(ent);
    setTotalVentas(Number(js.total_ventas || 0));
  };

  const loadVentasDia = async (qStr: string) => {
    const r = await fetch(`http://localhost:3001/api/reportes/ventas-dia${qStr}`, { headers });
    if (!r.ok) throw new Error(await r.text());
    const js = await r.json();
    setVentasDia((js.items || []) as VentaDiaItem[]);
  };

  const loadTop = async (qStr: string) => {
    const r = await fetch(`http://localhost:3001/api/reportes/top-productos${qStr}`, { headers });
    if (!r.ok) throw new Error(await r.text());
    const js = await r.json();
    setTop((js.items || []) as TopProdItem[]);
  };

  const loadOps = async (qStr: string) => {
    const r = await fetch(`http://localhost:3001/api/reportes/ops${qStr}`, { headers });
    if (!r.ok) throw new Error(await r.text());
    const js = await r.json();
    const norm: OpTiempoItem[] = (js.items || []).map((x: any) => ({
      id_op: Number(x.id_op ?? x.id_orden),
      id_pedido: Number(x.id_pedido ?? 0),
      estado: String(x.estado ?? x.estado_nombre ?? ''),
      inicio: (x.inicio ?? x.fecha_inicio ?? null) ? String(x.inicio ?? x.fecha_inicio) : null,
      fin: (x.fin ?? x.fecha_fin ?? null) ? String(x.fin ?? x.fecha_fin) : null,
      duracion_horas: x.duracion_horas ?? x.duracion ?? null,
    }));
    setOps(norm);
  };

  const loadMats = async (qStr: string) => {
    const r = await fetch(`http://localhost:3001/api/reportes/materiales${qStr}`, { headers });
    if (!r.ok) throw new Error(await r.text());
    const js = await r.json();
    setMats((js.items || []) as MatConsumoItem[]);
  };

  const loadEnts = async (qStr: string) => {
    const r = await fetch(`http://localhost:3001/api/reportes/entregas${qStr}`, { headers });
    if (!r.ok) throw new Error(await r.text());
    const js = await r.json();
    const norm: EntregaItem[] = (js.items || []).map((x: any) => ({
      id_entrega: Number(x.id_entrega ?? 0),
      id_pedido: Number(x.id_pedido ?? 0),
      cliente: String(x.cliente ?? ''),
      fecha: (x.fecha ?? x.fecha_entrega ?? null) ? String(x.fecha ?? x.fecha_entrega) : null,
      estado: String(x.estado ?? x.estado_nombre ?? ''),
      transportista: x.transportista ?? null,
      guia: x.guia ?? null,
      costo: x.costo ?? x.costo_envio ?? null,
    }));
    setEnts(norm);
  };

  const aplicar = async (d?: string, h?: string) => {
    const desde = d ?? fDesde;
    const hasta = h ?? fHasta;
    const qStr = buildQ(desde, hasta);
    try {
      setIsLoading(true);
      setErr('');
      await Promise.all([
        loadResumen(qStr),
        loadVentasDia(qStr),
        loadTop(qStr),
        loadOps(qStr),
        loadMats(qStr),
        loadEnts(qStr),
      ]);
    } catch (e: any) {
      setErr(e.message || 'Error al cargar reportes');
    } finally {
      setIsLoading(false);
    }
  };

  const limpiar = () => {
    setFDesde('');
    setFHasta('');
    // Aplica inmediatamente con filtros vacíos (evita el “doble clic”)
    aplicar('', '');
  };

  useEffect(() => { if (token) aplicar(); /* eslint-disable-next-line */ }, [token]);

  // ===== Datos para gráficos =====
  const ventasChartData = useMemo(
    () => (ventasDia || []).map(v => ({ fecha: v.fecha, total: Number(v.total || 0) })),
    [ventasDia]
  );

  const pedidosPieData = useMemo(
    () => (pedidosEstado || []).map(p => ({ name: p.estado, value: Number(p.total || 0) })),
    [pedidosEstado]
  );

  const entregasPieData = useMemo(
    () => (entregasEstado || []).map(p => ({ name: p.estado, value: Number(p.total || 0) })),
    [entregasEstado]
  );

  const topBarData = useMemo(
    () => (top || []).map(t => ({ name: t.nombre, qty: Number(t.cantidad_total || 0) })),
    [top]
  );

  const opDurBarData = useMemo(
    () => (ops || []).map(o => ({ name: `OP ${o.id_op}`, horas: Number(o.duracion_horas ?? 0) })),
    [ops]
  );

  const matsBarData = useMemo(
    () => (mats || []).map(m => ({ name: m.material, qty: Number(m.total_consumido || 0) })),
    [mats]
  );

  const entregasBarData = useMemo(() => {
    const acc = new Map<string, number>();
    for (const e of ents) acc.set(e.estado || '-', (acc.get(e.estado || '-') || 0) + 1);
    return Array.from(acc.entries()).map(([name, qty]) => ({ name, qty }));
  }, [ents]);

  // ===== Export CSV (usa el tab activo) =====
  type CsvMeta = { title: string; headers: string[]; rows: (string | number)[][] };

  const currentCsvMeta = (): CsvMeta => {
    switch (tab) {
      case 0:
        return {
          title: 'Resumen',
          headers: ['Bloque', 'Nombre', 'Total'],
          rows: [
            ...pedidosEstado.map(x => ['Pedidos por estado', x.estado, x.total]),
            ['Total ventas', '', totalVentas],
            ...entregasEstado.map(x => ['Entregas por estado', x.estado, x.total]),
          ],
        };
      case 1:
        return {
          title: 'Ventas_por_dia',
          headers: ['Fecha', 'Subtotal', 'Impuesto', 'Total'],
          rows: ventasDia.map(x => [x.fecha, x.subtotal, x.impuesto, x.total]),
        };
      case 2:
        return {
          title: 'Top_productos',
          headers: ['SKU', 'Producto', 'Cantidad', 'Total_vendido'],
          rows: top.map(x => [x.sku, x.nombre, x.cantidad_total, x.total_vendido]),
        };
      case 3:
        return {
          title: 'Tiempos_OP',
          headers: ['ID_OP', 'Pedido', 'Estado', 'Inicio', 'Fin', 'Duracion_h'],
          rows: ops.map(x => [x.id_op, x.id_pedido, x.estado, x.inicio ?? '-', x.fin ?? '-', x.duracion_horas ?? '-']),
        };
      case 4:
        return {
          title: 'Consumo_materiales',
          headers: ['Material', 'Total_consumido'],
          rows: mats.map(x => [x.material, x.total_consumido]),
        };
      default:
        return {
          title: 'Entregas',
          headers: ['#', 'Pedido', 'Cliente', 'Fecha', 'Estado', 'Transportista', 'Guia', 'Costo'],
          rows: ents.map(x => [x.id_entrega, x.id_pedido, x.cliente, x.fecha ?? '-', x.estado, x.transportista ?? '-', x.guia ?? '-', x.costo ?? 0]),
        };
    }
  };

  const exportCSV = () => {
    const meta = currentCsvMeta();
    const lines: string[] = [
      meta.headers.join(','),
      ...meta.rows.map(r =>
        r.map((c) => {
          const s = String(c ?? '');
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        }).join(',')
      ),
    ];
    const csv = lines.join('\n');
    const range = `${fDesde || 'inicio'}_${fHasta || 'hoy'}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${meta.title}_${range}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ===== UI =====
  return (
    <PageContainer title="Reportes | Sistema Aracah" description="Módulo de reportes y analítica">
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} mb={2} flexWrap="wrap">
          <Typography variant="h4" fontWeight={700}>Reportes</Typography>
          <Box flexGrow={1} />
          <TextField
            label="Desde" type="date" size="small"
            InputLabelProps={{ shrink: true }}
            value={fDesde} onChange={(e) => setFDesde(e.target.value)}
          />
          <TextField
            label="Hasta" type="date" size="small"
            InputLabelProps={{ shrink: true }}
            value={fHasta} onChange={(e) => setFHasta(e.target.value)}
          />
          <Button variant="contained" onClick={() => aplicar()} disabled={isLoading}>Aplicar</Button>
          <Button variant="outlined" onClick={limpiar} disabled={isLoading}>Limpiar</Button>
          <Button variant="outlined" onClick={exportCSV} disabled={isLoading}>Exportar CSV</Button>
        </Stack>

        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

        <Paper sx={{ p: 2 }}>
          <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>
            <Tab label="Resumen" />
            <Tab label="Ventas Por Día" />
            <Tab label="Top Productos" />
            <Tab label="Tiempos OP" />
            <Tab label="Consumo Materiales" />
            <Tab label="Entregas" />
          </Tabs>

          {/* ===== RESUMEN ===== */}
          {tab === 0 && (
            <Box p={2}>
              <Typography variant="h6" fontWeight={700} mb={1}>Pedidos por estado</Typography>
              <Box sx={{ width: '100%', height: 320, mb: 2 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pedidosPieData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={3} stroke="#fff">
                      {pedidosPieData.map((_e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>

              <Table size="small" sx={{ mb: 3 }}>
                <TableHead><TableRow><TableCell>Estado</TableCell><TableCell align="right">Total</TableCell></TableRow></TableHead>
                <TableBody>
                  {pedidosEstado.map((x, i) => (
                    <TableRow key={i}><TableCell>{x.estado}</TableCell><TableCell align="right">{x.total}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" fontWeight={700} mb={1}>Entregas por estado</Typography>
              <Box sx={{ width: '100%', height: 300, mb: 2 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={entregasPieData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={3} stroke="#fff">
                      {entregasPieData.map((_e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>

              <Table size="small" sx={{ mb: 3 }}>
                <TableHead><TableRow><TableCell>Estado</TableCell><TableCell align="right">Total</TableCell></TableRow></TableHead>
                <TableBody>
                  {entregasEstado.map((x, i) => (
                    <TableRow key={i}><TableCell>{x.estado}</TableCell><TableCell align="right">{x.total}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Total ventas AL FINAL */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" fontWeight={700} mb={0.5}>Total ventas</Typography>
              <Typography variant="h4" fontWeight={800} color="primary">
                {Number(totalVentas || 0).toLocaleString()}
              </Typography>
            </Box>
          )}

          {/* ===== VENTAS POR DÍA ===== */}
          {tab === 1 && (
            <Box p={2}>
              <Typography variant="h6" fontWeight={700} mb={1}>Tendencia de ventas</Typography>
              <Box sx={{ width: '100%', height: 340, mb: 3 }}>
                <ResponsiveContainer>
                  <LineChart data={ventasChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" /><YAxis /><Tooltip /><Legend />
                    <Line type="monotone" dataKey="total" name="Total" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>

              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="right">Subtotal</TableCell>
                  <TableCell align="right">Impuesto</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {ventasDia.map((x, i) => (
                    <TableRow key={i}>
                      <TableCell>{x.fecha}</TableCell>
                      <TableCell align="right">{Number(x.subtotal || 0).toLocaleString()}</TableCell>
                      <TableCell align="right">{Number(x.impuesto || 0).toLocaleString()}</TableCell>
                      <TableCell align="right">{Number(x.total || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {/* ===== TOP PRODUCTOS ===== */}
          {tab === 2 && (
            <Box p={2}>
              <Typography variant="h6" fontWeight={700} mb={1}>Top productos (cantidad)</Typography>
              <Box sx={{ width: '100%', height: 360, mb: 3 }}>
                <ResponsiveContainer>
                  <BarChart data={topBarData} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" /><YAxis type="category" dataKey="name" width={220} />
                    <Tooltip /><Legend />
                    <Bar dataKey="qty" name="Cantidad" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>SKU</TableCell>
                  <TableCell>Producto</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell align="right">Total vendido</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {top.map((x, i) => (
                    <TableRow key={i}>
                      <TableCell>{x.sku}</TableCell>
                      <TableCell>{x.nombre}</TableCell>
                      <TableCell align="right">{Number(x.cantidad_total || 0)}</TableCell>
                      <TableCell align="right">{Number(x.total_vendido || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {/* ===== TIEMPOS OP ===== */}
          {tab === 3 && (
            <Box p={2}>
              <Typography variant="h6" fontWeight={700} mb={1}>Duración por OP (horas)</Typography>
              <Box sx={{ width: '100%', height: 340, mb: 3 }}>
                <ResponsiveContainer>
                  <BarChart data={opDurBarData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" /><YAxis /><Tooltip /><Legend />
                    <Bar dataKey="horas" name="Duración (h)" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>ID OP</TableCell>
                  <TableCell>Pedido</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Inicio</TableCell>
                  <TableCell>Fin</TableCell>
                  <TableCell align="right">Duración (h)</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {ops.map((x, i) => (
                    <TableRow key={i}>
                      <TableCell>{x.id_op}</TableCell>
                      <TableCell>{x.id_pedido}</TableCell>
                      <TableCell>{x.estado}</TableCell>
                      <TableCell>{x.inicio || '-'}</TableCell>
                      <TableCell>{x.fin || '-'}</TableCell>
                      <TableCell align="right">{x.duracion_horas ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {/* ===== CONSUMO MATERIALES ===== */}
          {tab === 4 && (
            <Box p={2}>
              <Typography variant="h6" fontWeight={700} mb={1}>Consumo total por material</Typography>
              <Box sx={{ width: '100%', height: 360, mb: 3 }}>
                <ResponsiveContainer>
                  <BarChart data={matsBarData} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" /><YAxis type="category" dataKey="name" width={220} />
                    <Tooltip /><Legend />
                    <Bar dataKey="qty" name="Total consumido" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Material</TableCell>
                  <TableCell align="right">Total consumido</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {mats.map((x, i) => (
                    <TableRow key={i}>
                      <TableCell>{x.material}</TableCell>
                      <TableCell align="right">{Number(x.total_consumido || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {/* ===== ENTREGAS ===== */}
          {tab === 5 && (
            <Box p={2}>
              <Typography variant="h6" fontWeight={700} mb={1}>Entregas por estado</Typography>
              <Box sx={{ width: '100%', height: 320, mb: 3 }}>
                <ResponsiveContainer>
                  <BarChart data={entregasBarData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" /><YAxis /><Tooltip /><Legend />
                    <Bar dataKey="qty" name="Cantidad" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Pedido</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Transportista</TableCell>
                  <TableCell>Guía</TableCell>
                  <TableCell align="right">Costo</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {ents.map((x, i) => (
                    <TableRow key={i}>
                      <TableCell>{x.id_entrega}</TableCell>
                      <TableCell>{x.id_pedido}</TableCell>
                      <TableCell>{x.cliente}</TableCell>
                      <TableCell>{x.fecha || '-'}</TableCell>
                      <TableCell>{x.estado}</TableCell>
                      <TableCell>{x.transportista || '-'}</TableCell>
                      <TableCell>{x.guia || '-'}</TableCell>
                      <TableCell align="right">{Number(x.costo || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Paper>
      </Box>
    </PageContainer>
  );
}
