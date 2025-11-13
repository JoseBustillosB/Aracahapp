// routes/materiales.routes.js
import { Router } from 'express';
import { requireRole } from '../middleware/requireRole.js';
import makeMaterialesController from '../controllers/materiales.controller.js';

export default function materialesRoutes({ pool, sql, verifyFirebaseToken }) {
  const router = Router();
  const c = makeMaterialesController(pool, sql);

  // todas requieren sesión
  router.use(verifyFirebaseToken);

  // Listado / detalle
  router.get('/',    requireRole(['Admin','Supervisor','Vendedor']), c.list);
  router.get('/familias/list', requireRole(['Admin','Supervisor','Vendedor']), c.getFamilias); // Catálogo de familias (para combo en FE)
  router.get('/:id', requireRole(['Admin','Supervisor','Vendedor']), c.getById);

  // Crear / editar / borrar (solo Admin/Supervisor)
  router.post('/',          requireRole(['Admin','Supervisor']), c.upsert);
  router.put('/:id',        requireRole(['Admin','Supervisor']), c.upsert);
  router.delete('/:id',     requireRole(['Admin','Supervisor']), c.remove);

  // Kardex
  router.get('/:id/kardex',                 requireRole(['Admin','Supervisor','Vendedor']), c.kardexList);
  router.post('/:id/entrada',               requireRole(['Admin','Supervisor']),            c.kardexEntrada);
  router.post('/:id/salida',                requireRole(['Admin','Supervisor']),            c.kardexSalida);   // uso con cuidado (manual)
  router.post('/:id/ajuste',                requireRole(['Admin','Supervisor']),            c.kardexAjuste);

  // Utilidades
  router.post('/recalcular/stock',          requireRole(['Admin']),                         c.recalcularStock);

  return router;
}
