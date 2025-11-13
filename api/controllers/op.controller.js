// controllers/op.controller.js
export default function makeOPController(pool, sql) {
  // ===== Helpers =====
  function clientMeta(req) {
    return {
      ip: (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString().slice(0, 64),
      ua: (req.headers['user-agent'] || '').toString().slice(0, 512),
      idUsuario: null, 
    };
  }

  async function fetchHeader(id_orden) {
    const r = await pool.request()
      .input('id_orden', sql.Int, id_orden)
      .execute('dbo.sp_op_get'); // RS1: header
    const header = (r.recordsets?.[0] || [])[0] || null;
    return header;
  }

  // Crea TVP dbo.tt_consumo_material desde [{id_material, cantidad}]
  function buildConsumoTVP(consumos = []) {
    const tvp = new sql.Table('dbo.tt_consumo_material');
    tvp.columns.add('id_material', sql.Int);
    tvp.columns.add('cantidad',   sql.Decimal(14, 4));
    (Array.isArray(consumos) ? consumos : []).forEach(c => {
      const idm  = Number(c.id_material);
      const cant = Number(c.cantidad);
      if (idm && cant > 0) tvp.rows.add(idm, cant);
    });
    return tvp;
  }

  // ===== Lectura =====
  // GET /api/op
  const list = async (req, res) => {
    try {
      const {
        page = 1, pageSize = 20,
        q = null, estado = null, desde = null, hasta = null,
      } = req.query;

      const r = await pool.request()
        .input('q',             sql.NVarChar(sql.MAX), q || null)
        .input('estado_codigo', sql.VarChar(10),       estado || null)
        .input('desde',         sql.Date,              desde || null)
        .input('hasta',         sql.Date,              hasta || null)
        .input('page',          sql.Int,               Number(page))
        .input('pageSize',      sql.Int,               Number(pageSize))
        .execute('dbo.sp_op_list');

      const rows = r.recordset || [];
      const total = rows.length ? Number(rows[0].total_count || 0) : 0;
      res.json({ items: rows, total, page: Number(page), pageSize: Number(pageSize) });
    } catch (err) {
      console.error('op.list error:', err);
      res.status(500).json({ error: err.message || 'Error listando OP' });
    }
  };

  // GET /api/op/:id
  const getById = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ error: 'id inválido' });

      const header = await fetchHeader(id);
      if (!header) return res.status(404).json({ error: 'OP no encontrada' });

      res.json({ header });
    } catch (err) {
      console.error('op.getById error:', err);
      res.status(500).json({ error: err.message || 'Error obteniendo OP' });
    }
  };

  // GET /api/op/:id/consumo  (usa sp_op_get_consumo)
  const getConsumos = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ error: 'id inválido' });

      const r = await pool.request()
        .input('id_orden', sql.Int, id)
        .execute('dbo.sp_op_get_consumo'); // RS1: consumos

      res.json({ items: r.recordset || [] });
    } catch (err) {
      console.error('op.getConsumos error:', err);
      res.status(500).json({ error: err.message || 'Error obteniendo consumos' });
    }
  };

  // NEW: GET /api/op/:id/detalle  (usa sp_op_get_detalle_pedido)
  const getDetalle = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ error: 'id inválido' });

      const r = await pool.request()
        .input('id_orden', sql.Int, id)
        .execute('dbo.sp_op_get_detalle_pedido');

      res.json({ items: r.recordset || [] });
    } catch (err) {
      console.error('op.getDetalle error:', err);
      res.status(500).json({ error: err.message || 'Error obteniendo detalle de pedido' });
    }
  };

  // ===== Transiciones / acciones =====

  // POST /api/op/:id/assign  -> sp_cambiar_estado('OP','ASG')
  const assign = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ error: 'id inválido' });

      const { ip, ua, idUsuario } = clientMeta(req);
      await pool.request()
        .input('dominio',        sql.VarChar(20), 'OP')
        .input('id_registro',    sql.Int, id)
        .input('codigo_destino', sql.VarChar(10), 'ASG')
        .input('comentario',     sql.NVarChar(300), null)
        .input('id_usuario',     sql.Int, idUsuario)
        .input('ip',             sql.VarChar(64),   ip)
        .input('user_agent',     sql.NVarChar(512), ua)
        .execute('dbo.sp_cambiar_estado');

      const header = await fetchHeader(id);
      res.json({ ok: true, header });
    } catch (err) {
      console.error('op.assign error:', err);
      res.status(400).json({ error: err.message || 'No se pudo asignar la OP' });
    }
  };

  // POST /api/op/:id/start  -> valida BOM/stock e inserta consumo con sp_op_try_start
  const start = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ error: 'id inválido' });

      const r = await pool.request()
        .input('id_orden', sql.Int, id)
        .output('ok_out',  sql.Bit)
        .output('msg_out', sql.NVarChar(400))
        .execute('dbo.sp_op_try_start');

      const ok  = (typeof r.output?.ok_out === 'boolean') ? r.output.ok_out : (r.returnValue === 0);
      const msg = r.output?.msg_out || (ok ? null : 'No se pudo iniciar la OP');
      if (!ok) return res.status(400).json({ error: msg });

      const header = await fetchHeader(id);
      res.json({ ok: true, header });
    } catch (err) {
      console.error('op.start error:', err);
      res.status(400).json({ error: err.message || 'No se pudo iniciar la OP' });
    }
  };

  // POST /api/op/:id/consume  -> registrar consumos manuales (sp_registrar_consumo_material)
  // Body: { consumos: [{ id_material, cantidad }...], comentario? }
  const consume = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ error: 'id inválido' });

      const { consumos = [], comentario = null } = req.body || {};
      if (!Array.isArray(consumos) || !consumos.length) {
        return res.status(400).json({ error: 'consumos[] requerido' });
      }

      const tvp = buildConsumoTVP(consumos);
      const { ip, ua, idUsuario } = clientMeta(req);

      await pool.request()
        .input('id_orden',   sql.Int, id)
        .input('consumos',   tvp) // TVP dbo.tt_consumo_material
        .input('comentario', sql.NVarChar(200), comentario || null)
        .input('id_usuario', sql.Int, idUsuario)
        .input('ip',         sql.VarChar(64),   ip)
        .input('user_agent', sql.NVarChar(512), ua)
        .execute('dbo.sp_registrar_consumo_material');

      const header = await fetchHeader(id);
      res.json({ ok: true, header });
    } catch (err) {
      console.error('op.consume error:', err);
      res.status(400).json({ error: err.message || 'Error registrando consumo' });
    }
  };

  // Helper para estados con sp_cambiar_estado
  async function changeState(id, codigo_destino, req) {
    const { ip, ua, idUsuario } = clientMeta(req);
    await pool.request()
      .input('dominio',        sql.VarChar(20), 'OP')
      .input('id_registro',    sql.Int, id)
      .input('codigo_destino', sql.VarChar(10), codigo_destino) // 'PAU'|'INI'|'FIN'
      .input('comentario',     sql.NVarChar(300), null)
      .input('id_usuario',     sql.Int, idUsuario)
      .input('ip',             sql.VarChar(64),   ip)
      .input('user_agent',     sql.NVarChar(512), ua)
      .execute('dbo.sp_cambiar_estado');

    return fetchHeader(id);
  }

  // POST /api/op/:id/pause
  const pause = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ error: 'id inválido' });
      const header = await changeState(id, 'PAU', req);
      res.json({ ok: true, header });
    } catch (err) {
      console.error('op.pause error:', err);
      res.status(400).json({ error: err.message || 'No se pudo pausar la OP' });
    }
  };

  // POST /api/op/:id/resume  (PAU -> INI)
  const resume = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ error: 'id inválido' });
      const header = await changeState(id, 'INI', req);
      res.json({ ok: true, header });
    } catch (err) {
      console.error('op.resume error:', err);
      res.status(400).json({ error: err.message || 'No se pudo reanudar la OP' });
    }
  };

  // POST /api/op/:id/finish  (INI/PAU -> FIN)
  const finish = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ error: 'id inválido' });
      const header = await changeState(id, 'FIN', req);
      res.json({ ok: true, header });
    } catch (err) {
      console.error('op.finish error:', err);
      res.status(400).json({ error: err.message || 'No se pudo finalizar la OP' });
    }
  };

  return {
    list,
    getById,
    getConsumos,     // GET /api/op/:id/consumo
    getDetalle,      // GET /api/op/:id/detalle
    assign,          // POST /api/op/:id/assign
    start,           // POST /api/op/:id/start
    consume,         // POST /api/op/:id/consume
    pause,           // POST /api/op/:id/pause
    resume,          // POST /api/op/:id/resume
    finish,          // POST /api/op/:id/finish
  };
}
