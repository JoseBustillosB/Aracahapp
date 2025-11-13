import { pool, sql, poolConnect } from '../db/pool.js';

/* =====================================================
    LISTAR COTIZACIONES (usa sp_cot_list)
===================================================== */
export async function listCotizaciones(req, res) {
  try {
    await poolConnect;
    const q         = (req.query.q || '').toString().trim() || null;
    const estado    = (req.query.estado || '').toString().trim() || null; // PEN, APR, RECH, VENC
    const idCliente = req.query.id_cliente ? parseInt(req.query.id_cliente, 10) : null;
    const desde     = req.query.desde || null;
    const hasta     = req.query.hasta || null;
    const page      = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize  = Math.min(100, Math.max(1, parseInt(req.query.pageSize || '20', 10)));

    const r = await pool.request()
      .input('q',            sql.NVarChar, q)
      .input('id_cliente',   sql.Int,      idCliente)
      .input('estado_codigo',sql.VarChar,  estado)
      .input('desde',        sql.Date,     desde)
      .input('hasta',        sql.Date,     hasta)
      .input('page',         sql.Int,      page)
      .input('pageSize',     sql.Int,      pageSize)
      .execute('dbo.sp_cot_list');

    res.json({
      items: r.recordsets[0],
      total: r.recordsets[1][0].total,
      page, pageSize,
    });
  } catch (e) {
    console.error('listCotizaciones error:', e);
    res.status(500).json({ error: e.message || 'Error listCotizaciones' });
  }
}

/* =====================================================
   OBTENER UNA COTIZACIÓN (usa sp_cot_get)
===================================================== */
export async function getCotizacion(req, res) {
  try {
    await poolConnect;
    const id = parseInt(req.params.id, 10);
    const r = await pool.request()
      .input('id_cotizacion', sql.Int, id)
      .execute('dbo.sp_cot_get');

    if (!r.recordsets[0]?.length) return res.status(404).json({ error: 'No encontrado' });

    // Estructura amigable para el FE
    const header  = r.recordsets[0][0];
    const detalle = r.recordsets[1] || [];
    res.json({ header, detalle });
  } catch (e) {
    console.error('getCotizacion error:', e);
    res.status(500).json({ error: e.message || 'Error getCotizacion' });
  }
}

/* =====================================================
   CREAR COTIZACIÓN (usa sp_generar_cotizacion)
===================================================== */
export async function createCotizacion(req, res) {
  try {
    await poolConnect;

    const { id_cliente, valida_hasta, descripcion, detalle } = req.body;

    if (!id_cliente || !Array.isArray(detalle) || !detalle.length) {
      return res.status(400).json({ error: 'id_cliente y detalle son obligatorios' });
    }

    // Table-Valued Parameter dbo.tt_linea (id_producto, cantidad, precio_unitario)
    const tvp = new sql.Table('dbo.tt_linea');
    tvp.columns.add('id_producto',     sql.Int);
    tvp.columns.add('cantidad',        sql.Int);
    tvp.columns.add('precio_unitario', sql.Decimal(12,2));

    // Permitimos que precio_unitario venga null → SP tomará precio cat.
    for (const item of detalle) {
      tvp.rows.add(
        Number(item.id_producto),
        Number(item.cantidad),
        item.precio_unitario != null ? Number(item.precio_unitario) : null
      );
    }

    const out = await pool.request()
      .input('id_cliente',    sql.Int,         Number(id_cliente))
      .input('lineas',        tvp)
      .input('valida_hasta',  sql.Date,        valida_hasta || null)
      .input('descripcion',   sql.NVarChar(sql.MAX), descripcion || null)
      .input('numero', sql.VarChar(30), null)                // dejamos que el SP genere el correlativo
      .output('id_cotizacion', sql.Int)                     // <<< output 1
      .output('numero_out', sql.VarChar(30))                // <<< output 2 (nuevo)
      .execute('dbo.sp_generar_cotizacion');
      /*
      .input('numero',        sql.VarChar(30), null)
      .input('id_usuario',    sql.Int,         req.user?.id_usuario || null)
      .input('ip',            sql.VarChar(64), req.ip || null)
      .input('user_agent',    sql.NVarChar(512), req.headers['user-agent'] || null)
      .output('id_cotizacion', sql.Int)
      .execute('dbo.sp_generar_cotizacion');
      */

    res.status(201).json({ id_cotizacion: out.output.id_cotizacion, numero: out.output.numero_out });
  } catch (e) {
    console.error('createCotizacion error:', e);
    // Si el error viene vacío, devolvemos algo legible
    const msg = e?.originalError?.info?.message || e.message || 'Error al crear la cotización';
    res.status(500).json({ error: msg });
  }
}

/* =====================================================
   ACTUALIZAR (usa sp_cot_update)
===================================================== */
export async function updateCotizacion(req, res) {
  try {
    await poolConnect;
    const id = parseInt(req.params.id, 10);
    const { valida_hasta, descripcion, detalle } = req.body;
    const detalles_json = Array.isArray(detalle) ? JSON.stringify(detalle) : null;

    await pool.request()
      .input('id_cotizacion', sql.Int, id)
      .input('valida_hasta',  sql.Date,        valida_hasta || null)
      .input('descripcion',   sql.NVarChar(sql.MAX), descripcion || null)
      .input('detalles_json', sql.NVarChar(sql.MAX), detalles_json)
      .execute('dbo.sp_cot_update');

    res.json({ ok: true });
  } catch (e) {
    console.error('updateCotizacion error:', e);
    res.status(500).json({ error: e.message || 'Error updateCotizacion' });
  }
}

/* =====================================================
    APROBAR /  RECHAZAR (usa sp_cambiar_estado)
===================================================== */
export async function approveCotizacion(req, res) {
  try {
    await poolConnect;
    const id = parseInt(req.params.id, 10);

    await pool.request()
      .input('dominio',        sql.VarChar(20), 'COTIZACION')
      .input('id_registro',    sql.Int, id)
      .input('codigo_destino', sql.VarChar(10), 'APR')
      .input('comentario',     sql.NVarChar(300), 'Aprobación de cotización')
      .input('id_usuario',     sql.Int, req.user?.id_usuario || null)
      .input('ip',             sql.VarChar(64), req.ip || null)
      .input('user_agent',     sql.NVarChar(512), req.headers['user-agent'] || null)
      .execute('dbo.sp_cambiar_estado');

    res.json({ ok: true });
  } catch (e) {
    console.error('approveCotizacion error:', e);
    res.status(500).json({ error: e.message || 'Error approveCotizacion' });
  }
}

export async function rejectCotizacion(req, res) {
  try {
    await poolConnect;
    const id = parseInt(req.params.id, 10);
    const { comentario } = req.body || {};

    await pool.request()
      .input('dominio',        sql.VarChar(20), 'COTIZACION')
      .input('id_registro',    sql.Int, id)
      .input('codigo_destino', sql.VarChar(10), 'RECH')
      .input('comentario',     sql.NVarChar(300), comentario || 'Rechazada')
      .input('id_usuario',     sql.Int, req.user?.id_usuario || null)
      .input('ip',             sql.VarChar(64), req.ip || null)
      .input('user_agent',     sql.NVarChar(512), req.headers['user-agent'] || null)
      .execute('dbo.sp_cambiar_estado');

    res.json({ ok: true });
  } catch (e) {
    console.error('rejectCotizacion error:', e);
    res.status(500).json({ error: e.message || 'Error rejectCotizacion' });
  }
}

/* =====================================================
    CONFIRMAR COTIZACIÓN → PEDIDO (sp_confirmar_pedido_desde_cotizacion)
===================================================== */
export async function confirmToPedido(req, res) {
  try {
    await poolConnect;
    const id = parseInt(req.params.id, 10);
    const { recalcular_precios = 0, numero_pedido = null, fecha_compromiso = null } = req.body || {};

    const out = await pool.request()
      .input('id_cotizacion',      sql.Int, id)
      .input('recalcular_precios', sql.Bit, !!recalcular_precios)
      .input('numero_pedido',      sql.VarChar(30), numero_pedido)
      .input('fecha_compromiso',   sql.Date, fecha_compromiso)
      .input('id_usuario',         sql.Int, req.user?.id_usuario || null)
      .input('ip',                 sql.VarChar(64), req.ip || null)
      .input('user_agent',         sql.NVarChar(512), req.headers['user-agent'] || null)
      .output('id_pedido_out',     sql.Int)
      .execute('dbo.sp_confirmar_pedido_desde_cotizacion');

    res.json({ ok: true, id_pedido: out.output.id_pedido_out });
  } catch (e) {
    console.error('confirmToPedido error:', e);
    res.status(500).json({ error: e.message || 'Error confirmToPedido' });
  }
}

/* =====================================================
    ELIMINAR (usa sp_cot_delete)
===================================================== */
export async function deleteCotizacion(req, res) {
  try {
    await poolConnect;
    const id = parseInt(req.params.id, 10);
    const r = await pool.request()
      .input('id_cotizacion', sql.Int, id)
      .execute('dbo.sp_cot_delete');

    if (!r.recordset[0]?.affected) return res.status(404).json({ error: 'No encontrado' });
    res.json({ ok: true });
  } catch (e) {
    console.error('deleteCotizacion error:', e);
    res.status(500).json({ error: e.message || 'Error deleteCotizacion' });
  }
}

/* =====================================================
    AUX: PRODUCTO LITE (usa sp_producto_lite)
   - Permite buscar por ?id_producto=123 o ?sku=ABC-001
   - Respuesta normalizada: { item: {...} }
===================================================== */
export async function productoLite(req, res) {
  try {
    await poolConnect;

    const id_producto = req.query.id_producto ? parseInt(req.query.id_producto, 10) : null;
    const sku = (req.query.sku || '').toString().trim() || null;

    if (!id_producto && !sku) {
      return res.status(400).json({ error: 'Envía id_producto o sku' });
    }

    const r = await pool.request()
      .input('id_producto', sql.Int,       id_producto)
      .input('sku',         sql.VarChar(60), sku)
      .execute('dbo.sp_producto_lite');

    const item = r.recordset?.[0];
    if (!item) return res.status(404).json({ error: 'Producto no encontrado' });

    res.json({ item });
  } catch (e) {
    console.error('productoLite error:', e);
    res.status(500).json({ error: e.message || 'Error productoLite' });
  }
}
