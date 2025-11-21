// controllers/usuarios.controller.js
export default function makeUsuariosController(pool, sql) {
  // Helpers para parsear
  const toInt = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const parseActivo = (v) => {
    if (v === undefined || v === null || v === '') return null;
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (typeof v === 'number') return v ? 1 : 0;
    const s = String(v).toLowerCase();
    return (s === '1' || s === 'true' || s === 'si') ? 1 : 0;
  };

  // ============ LIST ============
  const list = async (req, res) => {
    const {
      page = 1,
      pageSize = 20,
      q = null,
      id_rol = null,
      activo = null,
    } = req.query;

    try {
      await pool.connect();
      const r = await pool.request()
        .input('page',     sql.Int, toInt(page) || 1)
        .input('pageSize', sql.Int, toInt(pageSize) || 20)
        .input('q',        sql.NVarChar(200), q || null)
        .input('id_rol',   sql.Int, id_rol ? toInt(id_rol) : null)
        .input('activo',   sql.Bit, parseActivo(activo))
        .execute('dbo.sp_usr_list');

      const items = r.recordset || [];
      const total = items.length > 0 ? Number(items[0].total_count || 0) : 0;

      res.json({
        items,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      });
    } catch (err) {
      console.error('usuarios.list error:', err);
      res.status(500).json({ error: err.message || 'Error listando usuarios' });
    }
  };

  // ============ GET BY ID ============
  const getById = async (req, res) => {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'id_usuario inválido' });

    try {
      await pool.connect();
      const r = await pool.request()
        .input('id_usuario', sql.Int, id)
        .execute('dbo.sp_usr_get');

      const row = (r.recordset || [])[0] || null;
      if (!row) return res.status(404).json({ error: 'Usuario no encontrado' });

      res.json(row);
    } catch (err) {
      console.error('usuarios.getById error:', err);
      res.status(500).json({ error: err.message || 'Error obteniendo usuario' });
    }
  };

  // ============ UPDATE BÁSICO (rol / activo) ============
  const updateAdmin = async (req, res) => {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'id_usuario inválido' });

    const { id_rol, activo } = req.body || {};
    if (!id_rol) {
      return res.status(400).json({ error: 'id_rol es requerido' });
    }

    try {
      await pool.connect();
      const r = await pool.request()
        .input('id_usuario', sql.Int, id)
        .input('id_rol',     sql.Int, toInt(id_rol))
        .input('activo',     sql.Bit, parseActivo(activo ?? 1))
        .execute('dbo.sp_usr_update_admin');

      const row = (r.recordset || [])[0] || null;
      if (!row) return res.status(404).json({ error: 'Usuario no encontrado tras actualizar' });

      res.json({ ok: true, usuario: row });
    } catch (err) {
      console.error('usuarios.updateAdmin error:', err);
      res.status(500).json({ error: err.message || 'Error actualizando usuario' });
    }
  };

  // ============ LIST ROLES ============
  const listRoles = async (req, res) => {
    try {
      await pool.connect();
      const r = await pool.request().execute('dbo.sp_roles_list');
      res.json(r.recordset || []);
    } catch (err) {
      console.error('usuarios.listRoles error:', err);
      res.status(500).json({ error: err.message || 'Error listando roles' });
    }
  };

  return {
    list,
    getById,
    updateAdmin,
    listRoles,
  };
}
