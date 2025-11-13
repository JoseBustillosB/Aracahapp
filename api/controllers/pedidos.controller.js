// controllers/pedidos.controller.js
export default function makePedidosController(pool, sql) {
  const toInt = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const parseDetalle = (body) => {
    const base = Array.isArray(body?.detalle)
      ? body.detalle
      : (Array.isArray(body?.lineas) ? body.lineas : []);
    return base
      .map((r) => ({
        id_producto: toInt(r?.id_producto),
        cantidad: toInt(r?.cantidad),
        // Si queremos permitir override explícito:
        // precio_unitario: (r?.precio_unitario === '' || r?.precio_unitario == null) ? null : Number(r.precio_unitario),
      }))
      .filter((r) => (r.id_producto && r.id_producto > 0) && (r.cantidad && r.cantidad > 0));
  };

  const list = async (req, res) => {
    const { page = 1, pageSize = 20, q = null, estado = null, id_cliente = null, desde = null, hasta = null } = req.query;
    try {
      const conn = await pool.connect();
      const r = await conn
        .request()
        .input('page', sql.Int, Number(page))
        .input('pageSize', sql.Int, Number(pageSize))
        .input('q', sql.NVarChar(sql.MAX), q || null)
        .input('estado', sql.VarChar(10), estado || null)
        .input('id_cliente', sql.Int, id_cliente ? Number(id_cliente) : null)
        .input('desde', sql.Date, desde || null)
        .input('hasta', sql.Date, hasta || null)
        .execute('dbo.sp_ped_list');

      const items = r.recordset || [];
      const total = items.length > 0 ? Number(items[0].total_count || 0) : 0;
      res.json({ items, total, page: Number(page), pageSize: Number(pageSize) });
    } catch (err) {
      console.error('pedidos.list error:', err);
      res.status(500).json({ error: err.message || 'Error listando pedidos' });
    }
  };

  const getById = async (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id inválido' });

    try {
      const conn = await pool.connect();
      const r = await conn.request().input('id_pedido', sql.Int, id).execute('dbo.sp_ped_get');
      const header = (r.recordsets?.[0] || [])[0] || null;
      const totals = (r.recordsets?.[1] || [])[0] || { subtotal: 0, impuesto: 0, total: 0 };
      if (!header) return res.status(404).json({ error: 'Pedido no encontrado' });
      res.json({ header, totals });
    } catch (err) {
      console.error('pedidos.getById error:', err);
      res.status(500).json({ error: err.message || 'Error obteniendo pedido' });
    }
  };

  const getDetalle = async (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id inválido' });

    try {
      const conn = await pool.connect();
      const r = await conn.request().input('id_pedido', sql.Int, id).execute('dbo.sp_ped_get_detalle');
      res.json({ items: r.recordset || [] });
    } catch (err) {
      console.error('pedidos.getDetalle error:', err);
      res.status(500).json({ error: err.message || 'Error obteniendo detalle de pedido' });
    }
  };

  const createFromCotizacion = async (req, res) => {
    const { id_cotizacion, recalcular_precios = 0, numero_pedido = null, fecha_compromiso = null } = req.body || {};
    if (!id_cotizacion) return res.status(400).json({ error: 'id_cotizacion es requerido' });

    try {
      const conn = await pool.connect();
      const outName = 'id_pedido_out';
      const r = await conn
        .request()
        .input('id_cotizacion', sql.Int, Number(id_cotizacion))
        .input('recalcular_precios', sql.Bit, recalcular_precios ? 1 : 0)
        .input('numero_pedido', sql.VarChar(30), numero_pedido || null)
        .input('fecha_compromiso', sql.Date, fecha_compromiso || null)
        .input('id_usuario', sql.Int, null)
        .input('ip', sql.VarChar(64), (req.ip || '').substring(0, 64))
        .input('user_agent', sql.NVarChar(512), (req.headers['user-agent'] || '').substring(0, 512))
        .output(outName, sql.Int)
        .execute('dbo.sp_confirmar_pedido_desde_cotizacion');

      res.status(201).json({ id_pedido: r.output[outName] });
    } catch (err) {
      console.error('pedidos.createFromCotizacion error:', err);
      res.status(500).json({ error: err.message || 'Error confirmando pedido desde cotización' });
    }
  };

  const createManual = async (req, res) => {
    try {
      const id_cliente = toInt(req.body?.id_cliente);
      const fecha_compromiso = req.body?.fecha_compromiso || null;
      const descripcion = req.body?.descripcion || null;

      if (!id_cliente || id_cliente <= 0) {
        return res.status(400).json({ error: 'id_cliente inválido' });
      }

      const detalle = parseDetalle(req.body);
      if (!Array.isArray(detalle) || detalle.length === 0) {
        return res.status(400).json({ error: 'Debes enviar al menos una línea' });
      }

      const conn = await pool.connect();

      const tvp = new sql.Table('dbo.tt_linea_ped');
      tvp.columns.add('id_producto', sql.Int, { nullable: false });
      tvp.columns.add('cantidad', sql.Int, { nullable: false });
      tvp.columns.add('precio_unitario', sql.Decimal(12, 2), { nullable: true });

      for (const l of detalle) {
        tvp.rows.add(l.id_producto, l.cantidad, null);
        // Para override: tvp.rows.add(l.id_producto, l.cantidad, (l.precio_unitario ?? null));
      }

      const outIdName = 'id_pedido_out';
      const outNumName = 'numero_out';

      const r = await conn
        .request()
        .input('id_cliente', sql.Int, id_cliente)
        .input('fecha_compromiso', sql.Date, fecha_compromiso || null)
        .input('descripcion', sql.NVarChar(sql.MAX), descripcion)
        .input('lineas', tvp)
        .output(outIdName, sql.Int)
        .output(outNumName, sql.VarChar(30))
        .execute('dbo.sp_ped_crear_manual');

      res.status(201).json({
        id_pedido: r.output[outIdName],
        numero: r.output[outNumName],
      });
    } catch (err) {
      console.error('pedidos.createManual error:', err);
      res.status(500).json({ error: err.message || 'Error creando pedido manual' });
    }
  };

  return { list, getById, getDetalle, createFromCotizacion, createManual };
}
