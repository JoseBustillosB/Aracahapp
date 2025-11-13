import { pool, sql, poolConnect } from '../db/pool.js';

const norm = (s) => (s || '').toString().trim().toLowerCase();

async function getUserRoleByEmail(email) {
  await poolConnect;
  const q = await pool.request()
    .input('correo', sql.VarChar, email)
    .query(`
      SELECT TOP 1 r.nombre_rol
      FROM dbo.usuarios u
      JOIN dbo.roles r ON r.id_rol = u.id_rol
      WHERE u.correo = @correo
    `);
  return q.recordset[0]?.nombre_rol || null;
}

export function requireRole(rolesPermitidos = []) {
  const allow = rolesPermitidos.map(norm);
  return async (req, res, next) => {
    try {
      const correo = req.user?.email;
      if (!correo) return res.status(403).json({ error: 'Correo no presente en token' });
      const rol = await getUserRoleByEmail(correo);
      if (!rol) return res.status(403).json({ error: 'Rol no asignado' });

      if (allow.length && !allow.includes(norm(rol))) {
        return res.status(403).json({ error: 'Acceso denegado', rol_actual: rol });
      }
      req.role = rol;
      next();
    } catch (e) {
      console.error('requireRole error:', e);
      res.status(500).json({ error: 'Error validando rol' });
    }
  };
}






/*
// --- Autorización por rol desde BD ---
function requireRole(rolesPermitidos = []) {
  // rolesPermitidos: ['Admin'] o ['Admin','supervisor'] etc.
  const normalizar = (s) => (s || '').toString().trim().toLowerCase();

  return async (req, res, next) => {
    try {
      // Necesitamos el correo del token para buscar el rol en BD
      const correo = req.user?.email;
      if (!correo) return res.status(403).json({ error: 'Correo no presente en token' });

      await poolConnect;
      const q = await pool.request()
        .input('correo', sql.VarChar, correo)
        .query(`
          SELECT TOP 1 r.nombre_rol
          FROM dbo.usuarios u
          JOIN dbo.roles r ON r.id_rol = u.id_rol
          WHERE u.correo = @correo
        `);

      const rol = q.recordset[0]?.nombre_rol || '';
      const permitido = rolesPermitidos.map(normalizar).includes(normalizar(rol));

      if (!permitido) {
        return res.status(403).json({ error: 'Acceso denegado', rol_actual: rol });
      }

      // Adjunta el rol al request por si lo necesitas en handlers
      req.role = rol;
      next();
    } catch (e) {
      console.error('requireRole error:', e);
      res.status(500).json({ error: 'Error validando rol' });
    }
  };
}






*/