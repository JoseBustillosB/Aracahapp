// src/views/usuarios/UsuariosList.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  FormControlLabel,
  Switch,
  Alert,
} from '@mui/material';

import PageContainer from 'src/components/container/PageContainer';
import { useAuth } from 'src/context/AuthContext';

type Usuario = {
  id_usuario: number;
  nombre: string;
  correo: string;
  activo: boolean;
  id_rol: number;
  nombre_rol: string;
  id_cliente?: number | null;
  nombre_cliente?: string | null;
};

type Rol = {
  id_rol: number;
  nombre_rol: string;
  detalle_rol?: string | null;
};

type ListResponse = {
  items: Usuario[];
  total: number;
  page: number;
  pageSize: number;
};

type FilterOverrides = {
  q?: string;
  id_rol?: string;
  activo?: string;
};

export default function UsuariosList() {
  const { idToken, perfil } = useAuth();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [page, setPage] = useState(0); // MUI usa base 0
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [filtroQ, setFiltroQ] = useState('');
  const [filtroRol, setFiltroRol] = useState<string>('');
  const [filtroActivo, setFiltroActivo] = useState<string>(''); // '', '1', '0'

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [snackMsg, setSnackMsg] = useState('');

  // ---- Dialog de edición ----
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [editRol, setEditRol] = useState<string>('');
  const [editActivo, setEditActivo] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);

  const headers = useMemo(
    () => ({
      Authorization: idToken ? `Bearer ${idToken}` : '',
      'Content-Type': 'application/json',
    }),
    [idToken],
  );

  const isAdmin = (perfil?.nombre_rol || '').toLowerCase().includes('admin');
  const isSupervisor = (perfil?.nombre_rol || '')
    .toLowerCase()
    .includes('supervisor');

  // Solo admin/supervisor deberían estar aquí
  const puedeGestionar = isAdmin || isSupervisor;

  // ---- Cargar roles para combos ----
  const loadRoles = async () => {
    try {
      const r = await fetch('http://localhost:3001/api/usuarios/roles', {
        headers,
      });
      if (!r.ok) throw new Error(await r.text());
      const data: Rol[] = await r.json();

      // Opcional: filtrar solo roles internos (admin, supervisor, vendedor)
      const internos = data.filter((rol) => {
        const n = rol.nombre_rol.toLowerCase();
        return (
          n.includes('admin') || n.includes('supervisor') || n.includes('vendedor')
        );
      });

      setRoles(internos);
    } catch (e: any) {
      console.error('loadRoles error:', e);
      setErr(e.message || 'Error cargando roles');
    }
  };

  // ---- Cargar usuarios ----
  const loadUsuarios = async (
    page0 = page,
    size = pageSize,
    overrides?: FilterOverrides,
  ) => {
    try {
      setLoading(true);
      setErr('');

      // Usar overrides si vienen, sino el estado actual
      const q = overrides?.q ?? filtroQ;
      const rol = overrides?.id_rol ?? filtroRol;
      const act = overrides?.activo ?? filtroActivo;

      const params = new URLSearchParams();
      params.set('page', String(page0 + 1)); // backend base 1
      params.set('pageSize', String(size));

      if (q.trim()) params.set('q', q.trim());
      if (rol) params.set('id_rol', rol);
      if (act) params.set('activo', act); // '1' | '0'

      const url = `http://localhost:3001/api/usuarios?${params.toString()}`;

      const r = await fetch(url, { headers });
      if (!r.ok) throw new Error(await r.text());
      const data: ListResponse = await r.json();

      setUsuarios(data.items || []);
      setTotal(data.total || 0);
      setPage((data.page || 1) - 1);
      setPageSize(data.pageSize || size);
    } catch (e: any) {
      console.error('loadUsuarios error:', e);
      setErr(e.message || 'Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  };

  // Inicial
  useEffect(() => {
    if (!idToken) return;
    loadRoles();
    // sin overrides aquí, usa filtros vacíos por defecto
    loadUsuarios(0, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idToken]);

  // ---- Handlers filtros ----
  const handleApplyFilters = () => {
    // Usa el estado actual de filtros
    loadUsuarios(0, pageSize);
  };

  const handleClearFilters = () => {
    // 1) Resetear estado
    setFiltroQ('');
    setFiltroRol('');
    setFiltroActivo('');
    // 2) Forzar fetch con filtros vacíos (evita el "doble clic")
    loadUsuarios(0, pageSize, { q: '', id_rol: '', activo: '' });
  };

  const handleChangePage = (_: any, newPage: number) => {
    loadUsuarios(newPage, pageSize);
  };

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(e.target.value, 10) || 10;
    setPageSize(newSize);
    loadUsuarios(0, newSize);
  };

  const handleChangeRolFiltro = (e: SelectChangeEvent) => {
    setFiltroRol(e.target.value as string);
  };

  const handleChangeActivoFiltro = (e: SelectChangeEvent) => {
    setFiltroActivo(e.target.value as string);
  };

  // ---- Abrir / cerrar dialogo edición ----
  const openEdit = (u: Usuario) => {
    setEditing(u);
    setEditRol(String(u.id_rol));
    setEditActivo(!!u.activo);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditing(null);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    try {
      setSaving(true);
      setErr('');

      const body = {
        id_rol: Number(editRol),
        activo: editActivo ? 1 : 0,
      };

      const r = await fetch(
        `http://localhost:3001/api/usuarios/${editing.id_usuario}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        },
      );
      if (!r.ok) throw new Error(await r.text());
      // No necesitamos la respuesta → solo forzamos el refresco
      await r.json().catch(() => null);

      setSnackMsg('Usuario actualizado correctamente');
      closeEdit();
      // refrescar lista con filtros actuales
      loadUsuarios();
    } catch (e: any) {
      console.error('handleSaveEdit error:', e);
      setErr(e.message || 'Error actualizando usuario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer title="Usuarios" description="Gestión de usuarios internos">
      <Box>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Typography variant="h4" fontWeight={700}>
            Usuarios
          </Typography>
        </Stack>

        {!puedeGestionar && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No tiene permisos para gestionar usuarios.
          </Alert>
        )}

        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Filtros
          </Typography>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'flex-end' }}
          >
            <TextField
              label="Buscar (nombre o correo)"
              value={filtroQ}
              onChange={(e) => setFiltroQ(e.target.value)}
              fullWidth
            />

            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel id="rol-filter-label">Rol</InputLabel>
              <Select
                labelId="rol-filter-label"
                label="Rol"
                value={filtroRol}
                onChange={handleChangeRolFiltro}
              >
                <MenuItem value="">Todos</MenuItem>
                {roles.map((r) => (
                  <MenuItem key={r.id_rol} value={String(r.id_rol)}>
                    {r.nombre_rol}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 140 }}>
              <InputLabel id="activo-filter-label">Estado</InputLabel>
              <Select
                labelId="activo-filter-label"
                label="Estado"
                value={filtroActivo}
                onChange={handleChangeActivoFiltro}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="1">Activos</MenuItem>
                <MenuItem value="0">Inactivos</MenuItem>
              </Select>
            </FormControl>

            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={handleApplyFilters}>
                Aplicar
              </Button>
              <Button variant="outlined" onClick={handleClearFilters}>
                Limpiar
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {err && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {err}
          </Alert>
        )}

        {/* Tabla */}
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Lista de usuarios
            </Typography>
            {loading && <CircularProgress size={24} />}
          </Box>

          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Correo</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Cliente asociado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usuarios.map((u) => (
                  <TableRow key={u.id_usuario} hover>
                    <TableCell>{u.id_usuario}</TableCell>
                    <TableCell>{u.nombre}</TableCell>
                    <TableCell>{u.correo}</TableCell>
                    <TableCell>
                      <Chip
                        label={u.nombre_rol || '-'}
                        size="small"
                        color={
                          (u.nombre_rol || '').toLowerCase().includes('admin')
                            ? 'error'
                            : (u.nombre_rol || '')
                                .toLowerCase()
                                .includes('supervisor')
                            ? 'warning'
                            : 'info'
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={u.activo ? 'Activo' : 'Inactivo'}
                        size="small"
                        color={u.activo ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{u.nombre_cliente || '-'}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={!puedeGestionar}
                        onClick={() => openEdit(u)}
                      >
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {usuarios.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography variant="body2" color="text.secondary">
                        No hay usuarios que coincidan con los filtros.
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
            onPageChange={handleChangePage}
            rowsPerPage={pageSize}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 20, 50]}
            labelRowsPerPage="Registros por página"
          />
        </Paper>

        {/* Dialog edición */}
        <Dialog open={editOpen} onClose={closeEdit} fullWidth maxWidth="sm">
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogContent dividers>
            {editing && (
              <Stack spacing={2} mt={1}>
                <TextField
                  label="Nombre"
                  value={editing.nombre}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                <TextField
                  label="Correo"
                  value={editing.correo}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />

                <FormControl fullWidth>
                  <InputLabel id="edit-rol-label">Rol</InputLabel>
                  <Select
                    labelId="edit-rol-label"
                    label="Rol"
                    value={editRol}
                    onChange={(e) => setEditRol(e.target.value as string)}
                  >
                    {roles.map((r) => (
                      <MenuItem key={r.id_rol} value={String(r.id_rol)}>
                        {r.nombre_rol}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Switch
                      checked={editActivo}
                      onChange={(e) => setEditActivo(e.target.checked)}
                    />
                  }
                  label={editActivo ? 'Usuario activo' : 'Usuario inactivo'}
                />
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEdit}>Cancelar</Button>
            <Button
              onClick={handleSaveEdit}
              variant="contained"
              disabled={saving || !editing}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={!!snackMsg}
          autoHideDuration={2000}
          onClose={() => setSnackMsg('')}
          message={snackMsg}
        />
      </Box>
    </PageContainer>
  );
}
