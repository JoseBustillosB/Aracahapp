// routes/pedidos.routes.js
import { Router } from 'express';
import { requireRole } from '../middleware/requireRole.js';

// Controllers (son fábricas -> hay que instanciarlas)
import makePedidosController from '../controllers/pedidos.controller.js';
import makePedidosTransitionsController from '../controllers/pedidos.transitions.controller.js';

export default function pedidosRoutes({ pool, sql, verifyFirebaseToken }) {
  const router = Router();

  // --- Instanciar controllers ---
  const pedCtrl = makePedidosController(pool, sql);
  const pedTrx  = makePedidosTransitionsController(pool, sql);

  // --- Todas estas rutas requieren sesión válida ---
  router.use(verifyFirebaseToken);

  // === Lecturas / listados ===
  router.get(
    '/',
    requireRole(['Admin', 'Supervisor', 'Vendedor']),
    pedCtrl.list
  );

  router.get(
    '/:id',
    requireRole(['Admin', 'Supervisor', 'Vendedor']),
    pedCtrl.getById
  );

  router.get(
    '/:id/detalle',
    requireRole(['Admin', 'Supervisor', 'Vendedor']),
    pedCtrl.getDetalle
  );

  // === Creación desde cotización aprobada ===
  router.post(
    '/confirmar',
    requireRole(['Admin', 'Supervisor', 'Vendedor']),
    pedCtrl.createFromCotizacion
  );

  // === Creación manual (sin cotización) ===
  router.post(
    '/manual',
    requireRole(['Admin', 'Supervisor']), // solo Admin/Supervisor
    pedCtrl.createManual
  );

  // === Transiciones de estado del pedido ===
  // A producción -> crea/obtiene OP y cambia PED -> PROD
  router.post(
    '/:id/to-prod',
    requireRole(['Admin', 'Supervisor']), // tú decides si Vendedor puede
    pedTrx.toProduccion
  );

  // Marcar listo
  router.post(
    '/:id/to-listo',
    requireRole(['Admin', 'Supervisor']),
    pedTrx.marcarListo
  );

  // Marcar entregado
  router.post(
    '/:id/to-ent',
    requireRole(['Admin', 'Supervisor']),
    pedTrx.marcarEntregado
  );

  // Cancelar
  router.post(
    '/:id/cancel',
    requireRole(['Admin', 'Supervisor']),
    pedTrx.cancelar
  );

  // Forzar PEN
  router.post(
    '/:id/to-pen',
    requireRole(['Admin']),
    pedTrx.forzarPen
  );

  return router; // ⚠️ devolver router (no usar app.use aquí)
}
