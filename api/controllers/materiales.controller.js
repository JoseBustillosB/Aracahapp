// controllers/materiales.controller.js
export default function makeMaterialesController(pool, sql) {

  // GET /api/materiales
const list = async (req, res) => {
  const { q = null, page = 1, pageSize = 20, familia = null } = req.query;
  try {
    const conn = await pool.connect();
    const r = await conn.request()
      .input('q', sql.NVarChar(200), q || null)
      .input('page', sql.Int, Number(page))
      .input('pageSize', sql.Int, Number(pageSize))
      .input('familia', sql.VarChar(20), familia || null) // código ('tela') o id numérico
      .execute('dbo.sp_mat_list');
    const items = r.recordset || [];
    const total = items.length ? Number(items[0].total_count || 0) : 0;
    res.json({ items, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) {
    console.error('materiales.list error:', err);
    res.status(500).json({ error: err.message || 'Error listando materiales' });
  }
};


  // GET /api/materiales/:id
  const getById = async (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    try {
      const r = await pool.request()
        .input('id_material', sql.Int, id)
        .execute('dbo.sp_mat_get');
      if (!r.recordset?.length) return res.status(404).json({ error: 'Material no encontrado' });
      res.json(r.recordset[0]);
    } catch (err) {
      console.error('materiales.get error:', err);
      res.status(500).json({ error: err.message || 'Error obteniendo material' });
    }
  };

  // POST /api/materiales  (crear)  |  PUT /api/materiales/:id (editar)
  const upsert = async (req, res) => {
    const id = req.params.id ? Number(req.params.id) : null;
    const {
      nombre, descripcion = null, presentacion = null, color = null, textura = null,
      unidad_medida, costo_unitario
    } = req.body || {};
    if (!nombre || !unidad_medida || costo_unitario == null)
      return res.status(400).json({ error: 'nombre, unidad_medida y costo_unitario son obligatorios' });

    try {
      const r = await pool.request()
        .input('id_material', sql.Int, id)
        .input('nombre', sql.VarChar(150), nombre)
        .input('descripcion', sql.Text, descripcion)
        .input('presentacion', sql.VarChar(100), presentacion)
        .input('color', sql.VarChar(50), color)
        .input('textura', sql.VarChar(100), textura)
        .input('unidad_medida', sql.VarChar(50), unidad_medida)
        .input('costo_unitario', sql.Decimal(12, 2), Number(costo_unitario))
        .execute('dbo.sp_mat_upsert');

      const outId = r.recordset?.[0]?.id_material;
      res.status(id ? 200 : 201).json({ id_material: outId || id });
    } catch (err) {
      console.error('materiales.upsert error:', err);
      res.status(500).json({ error: err.message || 'Error guardando material' });
    }
  };

  // DELETE /api/materiales/:id
  const remove = async (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    try {
      const r = await pool.request()
        .input('id_material', sql.Int, id)
        .execute('dbo.sp_mat_delete');
      res.json({ affected: r.recordset?.[0]?.affected ?? 0 });
    } catch (err) {
      console.error('materiales.delete error:', err);
      res.status(500).json({ error: err.message || 'Error eliminando material' });
    }
  };

  // GET /api/materiales/:id/kardex
  const kardexList = async (req, res) => {
    const id = Number(req.params.id);
    const { tipo = null, desde = null, hasta = null } = req.query;
    if (!id) return res.status(400).json({ error: 'id inválido' });
    try {
      const r = await pool.request()
        .input('id_material', sql.Int, id)
        .input('tipo', sql.VarChar(10), tipo || null)
        .input('desde', sql.Date, desde || null)
        .input('hasta', sql.Date, hasta || null)
        .execute('dbo.sp_kardex_list');
      res.json({ items: r.recordset || [] });
    } catch (err) {
      console.error('kardex.list error:', err);
      res.status(500).json({ error: err.message || 'Error listando kardex' });
    }
  };

  // POST /api/materiales/:id/entrada | /salida | /ajuste
  const kardexMove = (tipo) => async (req, res) => {
    const id = Number(req.params.id);
    const { cantidad, costo_unitario = null, comentario = null } = req.body || {};
    if (!id || !cantidad) return res.status(400).json({ error: 'id y cantidad son obligatorios' });

    try {
      const r = await pool.request()
        .input('id_material', sql.Int, id)
        .input('tipo', sql.VarChar(10), tipo)
        .input('cantidad', sql.Decimal(14,4), Number(cantidad))
        .input('costo_unitario', sql.Decimal(12,4), (costo_unitario==null? null : Number(costo_unitario)))
        .input('comentario', sql.NVarChar(200), comentario)
        .execute('dbo.sp_kardex_registrar');
      res.status(201).json({ id_kardex: r.recordset?.[0]?.id_kardex });
    } catch (err) {
      console.error(`kardex.${tipo} error:`, err);
      res.status(500).json({ error: err.message || `Error registrando ${tipo.toLowerCase()}` });
    }
  };

  // POST /api/materiales/recalcular
  const recalcularStock = async (_req, res) => {
    try {
      await pool.request().execute('dbo.sp_materiales_recalcular_stock');
      res.json({ ok: true });
    } catch (err) {
      console.error('materiales.recalcular error:', err);
      res.status(500).json({ error: err.message || 'Error recalculando stock' });
    }
  };


  // GET /api/materiales/familias
const getFamilias = async (_req, res) => {
  try {
    const conn = await pool.connect();
    const r = await conn.request().execute('dbo.sp_mat_familias');
    res.json({ items: r.recordset || [] });
  } catch (err) {
    console.error('materiales.getFamilias error:', err);
    res.status(500).json({ error: err.message || 'Error cargando familias' });
  }
};

  return {
    list, getById, upsert, remove,
    kardexList,
    kardexEntrada: kardexMove('ENTRADA'),
    kardexSalida:  kardexMove('SALIDA'),
    kardexAjuste:  kardexMove('AJUSTE'),
    recalcularStock,
    getFamilias,
  };
}
