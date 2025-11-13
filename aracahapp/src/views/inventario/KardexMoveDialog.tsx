// src/views/inventario/components/KardexMoveDialog.tsx
'use client';
import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Alert
} from '@mui/material';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';

type Props = {
  open: boolean;
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  idMaterial: number;
  headers: Record<string,string>;
  onClose: () => void;
  onDone: () => void;
};

export default function KardexMoveDialog({ open, tipo, idMaterial, headers, onClose, onDone }: Props) {
  const [cantidad, setCantidad] = useState<string>('');
  const [costo, setCosto] = useState<string>('');     // útil para ENTRADA/AJUSTE
  const [comentario, setComentario] = useState<string>('');
  const [err, setErr] = useState('');

  const endpoint = tipo === 'ENTRADA' ? 'entrada'
                  : tipo === 'SALIDA' ? 'salida' : 'ajuste';

  const handleSubmit = async () => {
    try {
      setErr('');
      const body: any = {
        cantidad: Number(cantidad),
        comentario: comentario || null,
      };
      if (tipo !== 'SALIDA' && costo !== '') body.costo_unitario = Number(costo);

      const r = await fetch(`http://localhost:3001/api/materiales/${idMaterial}/${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await r.text());
      onDone();
      setCantidad(''); setCosto(''); setComentario('');
    } catch (e:any) {
      setErr(e.message || 'Error registrando movimiento');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{tipo === 'ENTRADA' ? 'Registrar Entrada' : tipo === 'SALIDA' ? 'Registrar Salida' : 'Registrar Ajuste'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {err && <Alert severity="error">{err}</Alert>}
          <CustomTextField
            label="Cantidad"
            type="number"
            value={cantidad}
            onChange={(e:any)=>setCantidad(e.target.value)}
            inputProps={{ min: 0, step: '0.01' }}
            fullWidth
          />
          {tipo !== 'SALIDA' && (
            <CustomTextField
              label="Costo unitario (opcional)"
              type="number"
              value={costo}
              onChange={(e:any)=>setCosto(e.target.value)}
              inputProps={{ min: 0, step: '0.01' }}
              fullWidth
            />
          )}
          <CustomTextField
            label="Comentario (opcional)"
            value={comentario}
            onChange={(e:any)=>setComentario(e.target.value)}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!cantidad}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
