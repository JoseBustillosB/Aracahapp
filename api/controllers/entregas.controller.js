// controllers/entregas.controller.js
// Factory: el router inyecta { pool, sql }. Aquí NO importamos bd/pool.js.

export default function makeEntregasController({ pool, sql }) {
  // LIST
  const list = async (req, res) => {
    try {
      const {
        q = null,
        estado = null,          // alias (código PEN/RUTA/ENT/FALL) – opcional
        id_estado = null,       // id numérico – opcional
        desde = null,
        hasta = null,
        id_transportista = null,
        page = 1,
        pageSize = 10,
      } = req.query;

      await pool.connect();

      const r = await pool.request()
        .input('q', sql.NVarChar(120), q || null)
        .input('id_estado', sql.Int, id_estado ? Number(id_estado) : null)
        .input('estado', sql.NVarChar(10), estado || null)   // el SP acepta alias/código
        .input('desde', sql.Date, desde || null)
        .input('hasta', sql.Date, hasta || null)
        .input('id_transportista', sql.Int, id_transportista ? Number(id_transportista) : null)
        .input('page', sql.Int, Number(page || 1))
        .input('pageSize', sql.Int, Number(pageSize || 10))
        .execute('dbo.sp_ent_list');

      const total = r.recordsets?.[0]?.[0]?.total ?? 0;
      const items = r.recordsets?.[1] ?? [];
      res.json({ total, items });
    } catch (e) {
      console.error('entregas.list error:', e);
      res.status(500).json({ error: e.message });
    }
  };

  // GET ONE
  const getOne = async (req, res) => {
    try {
      const id = Number(req.params.id);
      await pool.connect();
      const r = await pool.request()
        .input('id_entrega', sql.Int, id)
        .execute('dbo.sp_ent_get');

      const header = r.recordsets?.[0]?.[0] || null;
      const detalle = r.recordsets?.[1] || [];
      if (!header) return res.status(404).json({ error: 'Entrega no encontrada' });
      res.json({ header, detalle });
    } catch (e) {
      console.error('entregas.getOne error:', e);
      res.status(500).json({ error: e.message });
    }
  };

  // CREATE FROM PEDIDO
  const createFromPedido = async (req, res) => {
    try {
      const {
        id_pedido,
        fecha_entrega = null,                // 'YYYY-MM-DD' o null
        metodo_envio,
        direccion_entrega,
        referencia_ubicacion = null,
        nombre_recibe = null,
        codigo_estado_ent = 'PEN',          // default PEN
        id_transportista = null,
        guia = null,
        costo_envio = 0,
      } = req.body;

      await pool.connect();
      const rq = pool.request();
      rq.input('id_pedido', sql.Int, Number(id_pedido));
      rq.input('fecha_entrega', sql.Date, fecha_entrega || null);
      rq.input('metodo_envio', sql.VarChar(100), metodo_envio);
      rq.input('direccion_entrega', sql.NVarChar(255), direccion_entrega);
      rq.input('referencia_ubicacion', sql.NVarChar(sql.MAX), referencia_ubicacion);
      rq.input('nombre_recibe', sql.NVarChar(100), nombre_recibe);
      rq.input('codigo_estado_ent', sql.VarChar(10), codigo_estado_ent);
      rq.input('id_transportista', sql.Int, id_transportista ? Number(id_transportista) : null);
      rq.input('guia', sql.VarChar(80), guia);
      rq.input('costo_envio', sql.Decimal(12, 2), Number(costo_envio || 0));
      rq.output('id_entrega_out', sql.Int);

      const r = await rq.execute('dbo.sp_ent_create_from_pedido');
      res.status(201).json({ id_entrega: r.output.id_entrega_out });
    } catch (e) {
      console.error('entregas.createFromPedido error:', e);
      res.status(400).json({ error: e.message });
    }
  };

  // UPDATE TRACKING (usa outputs ok/msg del SP)
  const updateTracking = async (req, res) => {
    try {
      const id = Number(req.params.id);
      const {
        fecha_envio = null,                 // ISO string o null
        id_transportista = null,
        guia = null,
        costo_envio = null,                 // opcional
      } = req.body;

      await pool.connect();
      const rq = pool.request();
      rq.input('id_entrega', sql.Int, id);
      rq.input('fecha_envio', sql.DateTime, fecha_envio || null);
      rq.input('id_transportista', sql.Int, id_transportista ? Number(id_transportista) : null);
      rq.input('guia', sql.VarChar(80), guia || null);
      rq.input('costo_envio', sql.Decimal(12, 2), (costo_envio != null) ? Number(costo_envio) : null);
      rq.output('ok_out', sql.Bit);
      rq.output('msg_out', sql.NVarChar(400));

      const r = await rq.execute('dbo.sp_ent_update_tracking');
      const ok = !!r.output.ok_out;
      const msg = r.output.msg_out || (ok ? 'Tracking actualizado' : 'No actualizado');
      if (!ok) return res.status(400).json({ error: msg });
      res.json({ ok, msg });
    } catch (e) {
      console.error('entregas.updateTracking error:', e);
      res.status(500).json({ error: e.message });
    }
  };

  // ---- Catálogo de transportistas (solo lectura) ----
  // Para catálogo no hace falta SP; NOTA: si luego necesitamos, crearemos sp_cat_transportista_list.
  const listTransportistas = async (_req, res) => {
    try {
      await pool.connect();
      const r = await pool.request().query(`
        SELECT id_transportista, codigo, nombre, activo
        FROM dbo.cat_transportista
        WHERE activo = 1
        ORDER BY orden, nombre
      `);
      res.json({ items: r.recordset || [] });
    } catch (e) {
      console.error('entregas.transportistas error:', e);
      res.status(500).json({ error: e.message });
    }
  };

  // ---- Transiciones vía SP (incluye autoguía en RUTA desde el SP) ----
  const callSetEstado = async (id, codigo) => {
    await pool.connect();
    const rq = pool.request()
      .input('id_entrega', sql.Int, Number(id))
      .input('codigo', sql.VarChar(10), codigo)
      .output('ok_out', sql.Bit)
      .output('msg_out', sql.NVarChar(400));
    const r = await rq.execute('dbo.sp_ent_set_estado');
    const ok = !!r.output.ok_out;
    if (!ok) throw new Error(r.output.msg_out || 'No se pudo actualizar estado');
    return { ok: true, msg: r.output.msg_out };
  };

  const toRuta = async (req, res) => {
    try { const out = await callSetEstado(req.params.id, 'RUTA'); res.json(out); }
    catch (e) { res.status(400).json({ error: e.message }); }
  };

  const toEnt = async (req, res) => {
    try { const out = await callSetEstado(req.params.id, 'ENT'); res.json(out); }
    catch (e) { res.status(400).json({ error: e.message }); }
  };

  const toFall = async (req, res) => {
    try { const out = await callSetEstado(req.params.id, 'FALL'); res.json(out); }
    catch (e) { res.status(400).json({ error: e.message }); }
  };

  return {
    list,
    getOne,
    createFromPedido,
    updateTracking,
    listTransportistas,
    toRuta,
    toEnt,
    toFall,
  };
}
