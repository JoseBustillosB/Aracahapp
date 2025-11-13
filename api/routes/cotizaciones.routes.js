import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/authFirebase.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  // ===== Listar / ver =====
  listCotizaciones,
  getCotizacion,

  // ===== Crear / Editar =====
  createCotizacion,
  updateCotizacion,

  // ===== Estados =====
  approveCotizacion,
  rejectCotizacion,

  // ===== Confirmar a Pedido =====
  confirmToPedido,

  // ===== Eliminar =====
  deleteCotizacion,

  // ===== Aux: producto-lite (SKU/ID → precio/impuesto/nombres) =====
  productoLite,              // <<< NUEVO ENDPOINT
} from '../controllers/cotizaciones.controller.js';

const router = Router();

// Todas las rutas requieren token Firebase
router.use(verifyFirebaseToken);

/* =========================
   Listar / Ver
========================= */
router.get('/',    requireRole(['Admin','Supervisor','Vendedor']), listCotizaciones);
router.get('/:id', requireRole(['Admin','Supervisor','Vendedor']), getCotizacion);

/* =========================
   Crear / Editar
========================= */
router.post('/',    requireRole(['Admin','Vendedor','Supervisor']), createCotizacion);
router.put('/:id',  requireRole(['Admin','Vendedor','Supervisor']), updateCotizacion);

/* =========================
   Aprobar / Rechazar
========================= */
router.post('/:id/approve', requireRole(['Admin','Supervisor']), approveCotizacion);
router.post('/:id/reject',  requireRole(['Admin','Supervisor']), rejectCotizacion);

/* =========================
   Confirmar a Pedido
========================= */
router.post('/:id/confirm-to-pedido', requireRole(['Admin','Supervisor']), confirmToPedido);

/* =========================
   Eliminar (solo Admin)
========================= */
router.delete('/:id', requireRole(['Admin']), deleteCotizacion);

/* =========================================================
   Auxiliares de UI (no exponen lógica de negocio):
   - producto-lite: devuelve datos de catálogo por id_producto o sku
   IMPORTANTE: solo lectura, todo cálculo real se hace en SPs.
========================================================= */
router.get('/aux/producto-lite', requireRole(['Admin','Supervisor','Vendedor']), productoLite);

export default router;
