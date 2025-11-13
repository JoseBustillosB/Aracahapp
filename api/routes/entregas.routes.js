// routes/entregas.routes.js
import Router from 'router';
import makeEntregasController from '../controllers/entregas.controller.js';

export default function entregasRoutes({ pool, sql, verifyFirebaseToken }) {
  const r = Router();
  const ctrl = makeEntregasController({ pool, sql });

  // Auth (igual que otros módulos)
  r.use(verifyFirebaseToken);

  // Listado paginado + filtros (SP: sp_ent_list)
  r.get('/', ctrl.list);

  // Catálogo de transportistas (para el Select de la vista)
  r.get('/transportistas', ctrl.listTransportistas);

  // Obtener una entrega + detalle (SP: sp_ent_get)
  r.get('/:id', ctrl.getOne);

  // Crear entrega desde pedido (SP: sp_ent_create_from_pedido)
  r.post('/', ctrl.createFromPedido);

  // Actualizar tracking (SP: sp_ent_update_tracking)
  r.put('/:id/tracking', ctrl.updateTracking);
  r.patch('/:id/tracking', ctrl.updateTracking); // ← tu FE usa PATCH

  // Transiciones de estado vía SP (SP: sp_ent_set_estado)
  r.post('/:id/to-ruta', ctrl.toRuta);
  r.post('/:id/to-ent',  ctrl.toEnt);
  r.post('/:id/to-fall', ctrl.toFall);

  return r;
}
