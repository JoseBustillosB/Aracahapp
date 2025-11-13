import { Chip } from '@mui/material';

export default function StatusChip({ code }: { code?: string }) {
  const c = (code || '').toUpperCase();
  let color: 'default' | 'success' | 'warning' | 'error' | 'info' = 'default';
  let label = c;

  switch (c) {
    case 'PEN':
      color = 'warning'; label = 'Pendiente'; break;
    case 'APR':
      color = 'success'; label = 'Aprobada'; break;
    case 'RECH':
      color = 'error'; label = 'Rechazada'; break;
    case 'VENC':
      color = 'default'; label = 'Vencida'; break;
    case 'PROD':
      color = 'info'; label = 'En producción'; break;
    case 'LISTO':
      color = 'success'; label = 'Listo/Empacado'; break;
    case 'ENT':
      color = 'success'; label = 'Entregado'; break;
    case 'CANC':
      color = 'error'; label = 'Cancelado'; break;
  }

  return <Chip size="small" color={color} label={label} />;
}
