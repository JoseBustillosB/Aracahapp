// routes/clientes.routes.js
import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/authFirebase.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  listClientes,
  getCliente,
  createCliente,
  updateCliente,
  deleteCliente,
} from '../controllers/clientes.controller.js';

const router = Router();

router.use(verifyFirebaseToken);

// Listar y ver (Admin/Supervisor/Vendedor)
router.get('/',    requireRole(['Admin', 'Supervisor', 'Vendedor']), listClientes);
router.get('/:id', requireRole(['Admin', 'Supervisor', 'Vendedor']), getCliente);

// Crear (Admin/Vendedor/Supervisor)
router.post('/',   requireRole(['Admin', 'Vendedor', 'Supervisor']), createCliente);

// Actualizar (Admin/Vendedor/Supervisor)
router.put('/:id', requireRole(['Admin', 'Vendedor', 'Supervisor']), updateCliente);

// Eliminar (solo Admin)
router.delete('/:id', requireRole(['Admin']), deleteCliente);

export default router;
