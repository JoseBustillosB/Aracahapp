// src/middleware/requirePerm.js
/**
 * Fábrica de middlewares de autorización.
 * Usa tu pool y sql existentes (inyectados desde index.js)
 *
 * - requireRole(rolesPermitidos)
 *   Verifica que el usuario tenga alguno de los roles.
 *
 * - requirePerm(modulo, accion)
 *   (opcional) Verifica permiso fino si tienes tablas: permisos, rol_permiso
 *
 * Nota: Este archivo NO crea el pool; lo recibe por parámetro para evitar duplicados.
 */
module.exports = function makeRBAC(pool, sql) {
  const normalizar = (s) => (s || '').toString().trim().toLowerCase();

  /**
   * Obtiene el rol del usuario (por correo) desde tu tabla dbo.usuarios JOIN dbo.roles
   */
  async function getUserRoleByEmail(correo) {
    const q = await pool.request()
      .input('correo', sql.VarChar, correo)
      .query(`
        SELECT TOP 1 r.nombre_rol
        FROM dbo.usuarios u
        JOIN dbo.roles r ON r.id_rol = u.id_rol
        WHERE u.correo = @correo
      `);
    return q.recordset[0]?.nombre_rol || null;
  }

  /**
   * Middleware por rol. Ej:
   *   app.get('/admin', verifyToken, requireRole(['Admin']), handler)
   */
  function requireRole(rolesPermitidos = []) {
    const allow = rolesPermitidos.map(normalizar);

    return async function (req, res, next) {
      try {
        const correo = req.user?.email;
        if (!correo) return res.status(403).json({ error: 'Correo no presente en token' });

        const rol = await getUserRoleByEmail(correo);
        if (!rol) return res.status(403).json({ error: 'Rol no asignado' });

        const ok = allow.length === 0 || allow.includes(normalizar(rol));
        if (!ok) {
          return res.status(403).json({ error: 'Acceso denegado', rol_actual: rol });
        }

        // adjuntamos por si quieres leerlo en handlers
        req.role = rol;
        next();
      } catch (e) {
        console.error('requireRole error:', e);
        res.status(500).json({ error: 'Error validando rol' });
      }
    };
  }

  /**
   * Middleware de permiso fino (si adoptas tablas: permisos, rol_permiso).
   * Uso:
   *   app.post('/api/pedidos/:id/aprobar',
   *     verifyToken,
   *     requirePerm('pedidos','approve'),
   *     handler)
   */
  function requirePerm(modulo, accion) {
    return async function (req, res, next) {
      try {
        const correo = req.user?.email;
        if (!correo) return res.status(403).json({ error: 'Correo no presente en token' });

        // 1) rol del usuario
        const rol = await getUserRoleByEmail(correo);
        if (!rol) return res.status(403).json({ error: 'Rol no asignado' });

        // 2) verifica permiso (JOIN role -> rol_permiso -> permisos)
        // Si aún NO tienes esas tablas, puedes comentar este bloque y usar requireRole.
        const rs = await pool.request()
          .input('rol', sql.NVarChar, rol)
          .input('mod', sql.NVarChar, modulo)
          .input('acc', sql.NVarChar, accion)
          .query(`
            SELECT 1 AS ok
            FROM dbo.roles r
            JOIN dbo.rol_permiso rp ON rp.id_role = r.id_rol
            JOIN dbo.permisos p ON p.id_permiso = rp.id_permiso
            WHERE r.nombre_rol = @rol
              AND p.modulo = @mod
              AND p.accion = @acc
          `);

        if (!rs.recordset.length) {
          return res.status(403).json({ error: 'Permiso denegado', rol, modulo, accion });
        }

        req.role = rol;
        next();
      } catch (e) {
        console.error('requirePerm error:', e);
        res.status(500).json({ error: 'Error validando permiso' });
      }
    };
  }

  return { requireRole, requirePerm };
};
