// routes/reportes.routes.js
import { Router } from 'express';
import makeReportesController from '../controllers/reportes.controller.js';

export default function reportesRoutes(deps) {
  const r = Router();
  const ctrl = makeReportesController(deps);

  r.get('/resumen', ctrl.resumen);              // ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
  r.get('/ventas-dia', ctrl.ventasDia);         // idem
  r.get('/top-productos', ctrl.topProductos);   // &top=10
  r.get('/ops', ctrl.opTiempos);                // idem
  r.get('/materiales', ctrl.consumoMateriales); // &id_material=
  r.get('/entregas', ctrl.entregas);            // &id_estado=&id_transportista=

  return r;
}
