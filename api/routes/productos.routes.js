// src/routes/productos.routes.js
import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/authFirebase.js';
import { requireRole } from '../middleware/requireRole.js';
import { productoBrief } from '../controllers/productos.controller.js';

const router = Router();

router.use(verifyFirebaseToken);

// Vendedor/Supervisor/Admin pueden consultar productos
router.get('/:id/brief', requireRole(['Admin','Supervisor','Vendedor']), productoBrief);

export default router;
