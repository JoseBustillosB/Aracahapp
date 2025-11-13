// controllers/pedidos.transitions.controller.js
export default function makePedidosTransitionsController(pool, sql) {
  // Util común para responder errores de SQL
  const handleError = (res, e) => {
    const msg = e?.originalError?.info?.message || e?.message || 'Error en la transición';
    console.error('pedidos.transitions error:', e);
    res.status(400).json({ error: msg });
  };

  // POST /api/pedidos/:id/to-prod  → crea/obtiene OP y pone PEDIDO -> PROD
  const toProduccion = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'id inválido' });

    try {
      // 1) Crear/obtener OP desde pedido
      const r1 = await pool.request()
        .input('id_pedido', sql.Int, id)
        .output('id_orden_out', sql.Int)
        .execute('dbo.sp_op_create_from_pedido');

      const idOrden = r1.output.id_orden_out;

      // 2) Cambiar estado del pedido a PROD
      await pool.request()
        .input('dominio',        sql.VarChar, 'PEDIDO')
        .input('id_registro',    sql.Int,     id)
        .input('codigo_destino', sql.VarChar, 'PROD')
        .input('comentario',     sql.NVarChar, 'A producción')
        .execute('dbo.sp_cambiar_estado');

      return res.json({ ok: true, id_pedido: id, id_orden: idOrden });
    } catch (e) {
      return handleError(res, e);
    }
  };

  // POST /api/pedidos/:id/to-listo  → PEDIDO -> LISTO
  const marcarListo = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'id inválido' });

    try {
      await pool.request()
        .input('dominio',        sql.VarChar, 'PEDIDO')
        .input('id_registro',    sql.Int,     id)
        .input('codigo_destino', sql.VarChar, 'LISTO')
        .input('comentario',     sql.NVarChar, 'Marcado listo')
        .execute('dbo.sp_cambiar_estado');

      return res.json({ ok: true, id_pedido: id, nuevo_estado: 'LISTO' });
    } catch (e) {
      return handleError(res, e);
    }
  };

  // POST /api/pedidos/:id/to-entregado  → PEDIDO -> ENT
  const marcarEntregado = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'id inválido' });

    try {
      await pool.request()
        .input('dominio',        sql.VarChar, 'PEDIDO')
        .input('id_registro',    sql.Int,     id)
        .input('codigo_destino', sql.VarChar, 'ENT')
        .input('comentario',     sql.NVarChar, 'Entregado')
        .execute('dbo.sp_cambiar_estado');

      return res.json({ ok: true, id_pedido: id, nuevo_estado: 'ENT' });
    } catch (e) {
      return handleError(res, e);
    }
  };

  // POST /api/pedidos/:id/cancelar  → PEDIDO -> CANC
  const cancelar = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'id inválido' });

    try {
      await pool.request()
        .input('dominio',        sql.VarChar, 'PEDIDO')
        .input('id_registro',    sql.Int,     id)
        .input('codigo_destino', sql.VarChar, 'CANC')
        .input('comentario',     sql.NVarChar, req.body?.comentario ?? 'Cancelado')
        .execute('dbo.sp_cambiar_estado');

      return res.json({ ok: true, id_pedido: id, nuevo_estado: 'CANC' });
    } catch (e) {
      return handleError(res, e);
    }
  };

  // POST /api/pedidos/:id/force-pen  → fuerza PEDIDO -> PEN (solo admin/super)
  const forzarPen = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'id inválido' });

    try {
      await pool.request()
        .input('dominio',        sql.VarChar, 'PEDIDO')
        .input('id_registro',    sql.Int,     id)
        .input('codigo_destino', sql.VarChar, 'PEN')
        .input('comentario',     sql.NVarChar, 'Forzado a PEN')
        .execute('dbo.sp_cambiar_estado');

      return res.json({ ok: true, id_pedido: id, nuevo_estado: 'PEN' });
    } catch (e) {
      return handleError(res, e);
    }
  };

  return { toProduccion, marcarListo, marcarEntregado, cancelar, forzarPen };
}
