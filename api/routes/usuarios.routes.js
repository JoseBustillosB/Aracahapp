// routes/usuarios.routes.js
import { Router } from 'express';
import makeUsuariosController from '../controllers/usuarios.controller.js';

export default function usuariosRoutes(pool, sql) {
  const controller = makeUsuariosController(pool, sql);
  const router = Router();

  // GET /api/usuarios?page=&pageSize=&q=&id_rol=&activo=
  router.get('/', controller.list);

  // GET /api/usuarios/roles  → para combos
  router.get('/roles', controller.listRoles);

  // GET /api/usuarios/123
  router.get('/:id', controller.getById);

  // PUT /api/usuarios/123  { id_rol, activo }
  router.put('/:id', controller.updateAdmin);

  return router;
}
