// routes/op.routes.js
import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/authFirebase.js';
import { requireRole } from '../middleware/requireRole.js';
import makeOPController from '../controllers/op.controller.js';

export default function opRoutes({ pool, sql }) {
  const router = Router();
  const c = makeOPController(pool, sql);

  // Todas requieren sesión
  router.use(verifyFirebaseToken);

  // Listado y detalle
  router.get('/',        requireRole(['Admin','Supervisor']), c.list);
  router.get('/:id',     requireRole(['Admin','Supervisor']), c.getById);
  router.get('/:id/consumo', requireRole(['Admin','Supervisor']), c.getConsumos);
  router.get('/:id/detalle', requireRole(['Admin','Supervisor']), c.getDetalle);
  //router.get('/:id/detalle', ctrl.getDetalle);


  // Transiciones
  router.post('/:id/assign',  requireRole(['Admin','Supervisor']), c.assign);
  router.post('/:id/start',   requireRole(['Admin','Supervisor']), c.start);     // ← FALTA en tu API
  router.post('/:id/pause',   requireRole(['Admin','Supervisor']), c.pause);
  router.post('/:id/resume',  requireRole(['Admin','Supervisor']), c.resume);
  router.post('/:id/finish',  requireRole(['Admin','Supervisor']), c.finish);

  return router;
}
