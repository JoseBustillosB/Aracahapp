// controllers/pedidos.controller.js
export default function makePedidosController(pool, sql) {
  const toInt = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const parseDetalle = (body) => {
    const base = Array.isArray(body?.detalle)
      ? body.detalle
      : Array.isArray(body?.lineas)
      ? body.lineas
      : [];

    return base
      .map((r) => ({
        id_producto: toInt(r?.id_producto),
        cantidad: toInt(r?.cantidad),
        // opcional, el SP lo puede ignorar si viene NULL
        precio_unitario:
          r?.precio_unitario === '' || r?.precio_unitario == null
            ? null
            : Number(r.precio_unitario),
      }))
      .filter(
        (r) =>
          r.id_producto && r.id_producto > 0 && r.cantidad && r.cantidad > 0,
      );
  };

  // Obtiene el id_usuario de dbo.usuarios a partir del email del token Firebase
  const getCurrentUserId = async (req) => {
    try {
      const email = req.user?.email;
      if (!email) return null;

      const conn = await pool.connect();
      const q = await conn
        .request()
        .input('correo', sql.VarChar(320), email)
        .query(
          `
          SELECT TOP 1 id_usuario
          FROM dbo.usuarios
          WHERE LOWER(correo) = LOWER(@correo)
            AND activo = 1
        `,
        );

      const id = q.recordset?.[0]?.id_usuario;
      return id ? Number(id) : null;
    } catch (err) {
      console.error('getCurrentUserId error:', err);
      return null;
    }
  };

  // ========== LISTAR ==========
  const list = async (req, res) => {
    const {
      page = 1,
      pageSize = 20,
      q = null,
      estado = null,
      id_cliente = null,
      desde = null,
      hasta = null,
    } = req.query;

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

      res.json({
        items,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      });
    } catch (err) {
      console.error('pedidos.list error:', err);
      res.status(500).json({ error: err.message || 'Error listando pedidos' });
    }
  };

  // ========== CABECERA POR ID ==========
  const getById = async (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id inválido' });

    try {
      const conn = await pool.connect();
      const r = await conn
        .request()
        .input('id_pedido', sql.Int, id)
        .execute('dbo.sp_ped_get');

      const header = (r.recordsets?.[0] || [])[0] || null;
      const totals =
        (r.recordsets?.[1] || [])[0] || { subtotal: 0, impuesto: 0, total: 0 };

      if (!header)
        return res.status(404).json({ error: 'Pedido no encontrado' });

      res.json({ header, totals });
    } catch (err) {
      console.error('pedidos.getById error:', err);
      res
        .status(500)
        .json({ error: err.message || 'Error obteniendo pedido' });
    }
  };

  // ========== DETALLE POR ID ==========
  const getDetalle = async (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id inválido' });

    try {
      const conn = await pool.connect();
      const r = await conn
        .request()
        .input('id_pedido', sql.Int, id)
        .execute('dbo.sp_ped_get_detalle');

      res.json(r.recordset || []);
    } catch (err) {
      console.error('pedidos.getDetalle error:', err);
      res
        .status(500)
        .json({ error: err.message || 'Error obteniendo detalle' });
    }
  };

  // ========== CREAR DESDE COTIZACIÓN ==========
  const createFromCotizacion = async (req, res) => {
    const {
      id_cotizacion,
      recalcular_precios = 0,
      numero_pedido = null,
      fecha_compromiso = null,
    } = req.body || {};

    if (!id_cotizacion) {
      return res.status(400).json({ error: 'id_cotizacion es requerido' });
    }

    try {
      const idUsuario = await getCurrentUserId(req);

      const conn = await pool.connect();
      const outName = 'id_pedido_out';
      const r = await conn
        .request()
        .input('id_cotizacion', sql.Int, Number(id_cotizacion))
        .input('recalcular_precios', sql.Bit, recalcular_precios ? 1 : 0)
        .input('numero_pedido', sql.VarChar(30), numero_pedido || null)
        .input('fecha_compromiso', sql.Date, fecha_compromiso || null)
        // 👇 registrar vendedor que confirma
        .input('id_usuario_vendedor', sql.Int, idUsuario || null)
        .input('ip', sql.VarChar(64), (req.ip || '').substring(0, 64))
        .input(
          'user_agent',
          sql.NVarChar(512),
          (req.headers['user-agent'] || '').substring(0, 512),
        )
        .output(outName, sql.Int)
        .execute('dbo.sp_confirmar_pedido_desde_cotizacion');

      res.status(201).json({ id_pedido: r.output[outName] });
    } catch (err) {
      console.error('pedidos.createFromCotizacion error:', err);
      res.status(500).json({
        error: err.message || 'Error confirmando pedido desde cotización',
      });
    }
  };

  // ========== CREAR PEDIDO MANUAL ==========
  const createManual = async (req, res) => {
    try {
      const { id_cliente, fecha_compromiso, descripcion } = req.body || {};
      const detalle = parseDetalle(req.body);

      if (!id_cliente) {
        return res.status(400).json({ error: 'id_cliente es requerido' });
      }

      if (!Array.isArray(detalle) || detalle.length === 0) {
        return res
          .status(400)
          .json({ error: 'Debe enviar al menos una línea' });
      }

      // TVP para dbo.tt_linea_ped
      const tvp = new sql.Table();
      tvp.columns.add('id_producto', sql.Int);
      tvp.columns.add('cantidad', sql.Int);
      tvp.columns.add('precio_unitario', sql.Decimal(18, 2));

      detalle.forEach((d) => {
        tvp.rows.add(d.id_producto, d.cantidad, d.precio_unitario);
      });

      // Vendedor tomado del usuario logueado (dbo.usuarios)
      const idUsuario = await getCurrentUserId(req);

      const conn = await pool.connect();
      const outIdName = 'id_pedido_out';
      const outNumName = 'numero_out';

      const r = await conn
        .request()
        .input('id_cliente', sql.Int, Number(id_cliente))
        .input('fecha_compromiso', sql.Date, fecha_compromiso || null)
        .input('descripcion', sql.NVarChar(sql.MAX), descripcion || null)
        .input('lineas', tvp)
        .input('id_usuario_vendedor', sql.Int, idUsuario || null)
        .output(outIdName, sql.Int)
        .output(outNumName, sql.VarChar(30))
        .execute('dbo.sp_ped_crear_manual');

      res.status(201).json({
        id_pedido: r.output[outIdName],
        numero: r.output[outNumName],
      });
    } catch (err) {
      console.error('pedidos.createManual error:', err);
      res
        .status(500)
        .json({ error: err.message || 'Error creando pedido manual' });
    }
  };

  return { list, getById, getDetalle, createFromCotizacion, createManual };
}
