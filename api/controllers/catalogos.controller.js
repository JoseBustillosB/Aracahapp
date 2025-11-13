// controllers/catalogos.controller.js
import { pool, sql, poolConnect } from '../db/pool.js';

export async function listGeneros(_req, res) {
  try {
    await poolConnect;
    const r = await pool.request().execute('dbo.sp_cat_genero_list');
    res.json({ items: r.recordset || [] });
  } catch (e) {
    console.error('listGeneros error:', e);
    res.status(500).json({ error: e.message || 'Error listGeneros' });
  }
}

export async function listTiposCliente(_req, res) {
  try {
    await poolConnect;
    const r = await pool.request().execute('dbo.sp_cat_tipo_cliente_list');
    res.json({ items: r.recordset || [] });
  } catch (e) {
    console.error('listTiposCliente error:', e);
    res.status(500).json({ error: e.message || 'Error listTiposCliente' });
  }
}
