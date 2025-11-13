// src/controllers/productos.controller.js
import { pool, sql, poolConnect } from '../db/pool.js';

/* =====================================================
   BRIEF DE PRODUCTO POR ID (usa sp_prod_brief)
   Devuelve: id_producto, sku, nombre, precio, impuesto_nombre
   (Puedes ampliar campos si quieres mostrar color/modelo/estilo)
===================================================== */
export async function productoBrief(req, res) {
  try {
    await poolConnect;
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'id inválido' });

    const r = await pool.request()
      .input('id_producto', sql.Int, id)
      .execute('dbo.sp_prod_brief');

    const row = r.recordset?.[0];
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    res.json(row);
  } catch (e) {
    console.error('productoBrief error:', e);
    res.status(500).json({ error: e.message || 'Error obteniendo producto' });
  }
}
