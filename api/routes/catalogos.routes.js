// routes/catalogos.routes.js
import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/authFirebase.js';
import { requireRole } from '../middleware/requireRole.js';
import { listGeneros, listTiposCliente } from '../controllers/catalogos.controller.js';

const router = Router();
router.use(verifyFirebaseToken);

// Cualquier rol autenticado que pueda crear/editar clientes
router.get('/generos',        requireRole(['Admin','Supervisor','Vendedor']), listGeneros);
router.get('/tipos-cliente',  requireRole(['Admin','Supervisor','Vendedor']), listTiposCliente);

export default router;
