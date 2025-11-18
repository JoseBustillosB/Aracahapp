// controllers/reportes.controller.js
export default function makeReportesController({ pool, sql }) {
  // helper para parsear el id de vendedor desde query (?vendedor=3)
  const parseVendedorId = (raw) => {
    if (raw === undefined || raw === null || raw === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };

  const resumen = async (req, res) => {
    try {
      const { desde = null, hasta = null, vendedor = null } = req.query;
      const idVendedor = parseVendedorId(vendedor);

      await pool.connect();
      const r = await pool
        .request()
        .input('desde', sql.Date, desde || null)
        .input('hasta', sql.Date, hasta || null)
        .input('id_vendedor', sql.Int, idVendedor) // 👈 nuevo filtro opcional
        .execute('dbo.sp_rep_resumen_dashboard');

      res.json({
        pedidos_por_estado: r.recordsets?.[0] || [],
        total_ventas: r.recordsets?.[1]?.[0]?.total_ventas ?? 0,
        entregas_por_estado: r.recordsets?.[2] || [],
        top_materiales: r.recordsets?.[3] || [],
      });
    } catch (e) {
      console.error('reportes.resumen error:', e);
      res.status(500).json({ error: e.message });
    }
  };

  const ventasDia = async (req, res) => {
    try {
      const { desde = null, hasta = null, vendedor = null } = req.query;
      const idVendedor = parseVendedorId(vendedor);

      await pool.connect();
      const r = await pool
        .request()
        .input('desde', sql.Date, desde || null)
        .input('hasta', sql.Date, hasta || null)
        .input('id_vendedor', sql.Int, idVendedor) // 👈
        .execute('dbo.sp_rep_ventas_por_dia');

      res.json({ items: r.recordset || [] });
    } catch (e) {
      console.error('reportes.ventasDia error:', e);
      res.status(500).json({ error: e.message });
    }
  };

  const topProductos = async (req, res) => {
    try {
      const { desde = null, hasta = null, top = 10, vendedor = null } =
        req.query;
      const idVendedor = parseVendedorId(vendedor);

      await pool.connect();
      const r = await pool
        .request()
        .input('desde', sql.Date, desde || null)
        .input('hasta', sql.Date, hasta || null)
        .input('top', sql.Int, Number(top || 10))
        .input('id_vendedor', sql.Int, idVendedor) // 👈
        .execute('dbo.sp_rep_top_productos');

      res.json({ items: r.recordset || [] });
    } catch (e) {
      console.error('reportes.topProductos error:', e);
      res.status(500).json({ error: e.message });
    }
  };

  const opTiempos = async (req, res) => {
    try {
      const { desde = null, hasta = null } = req.query;
      await pool.connect();
      const r = await pool
        .request()
        .input('desde', sql.Date, desde || null)
        .input('hasta', sql.Date, hasta || null)
        .execute('dbo.sp_rep_op_tiempos');
      res.json({ items: r.recordset || [] });
    } catch (e) {
      console.error('reportes.opTiempos error:', e);
      res.status(500).json({ error: e.message });
    }
  };

  const consumoMateriales = async (req, res) => {
    try {
      const { desde = null, hasta = null, id_material = null } = req.query;
      await pool.connect();
      const r = await pool
        .request()
        .input('desde', sql.Date, desde || null)
        .input('hasta', sql.Date, hasta || null)
        .input(
          'id_material',
          sql.Int,
          id_material ? Number(id_material) : null,
        )
        .execute('dbo.sp_rep_consumo_materiales');
      res.json({ items: r.recordset || [] });
    } catch (e) {
      console.error('reportes.consumoMateriales error:', e);
      res.status(500).json({ error: e.message });
    }
  };

  const entregas = async (req, res) => {
    try {
      const {
        desde = null,
        hasta = null,
        id_estado = null,
        id_transportista = null,
      } = req.query;
      await pool.connect();
      const r = await pool
        .request()
        .input('desde', sql.Date, desde || null)
        .input('hasta', sql.Date, hasta || null)
        .input('id_estado', sql.Int, id_estado ? Number(id_estado) : null)
        .input(
          'id_transportista',
          sql.Int,
          id_transportista ? Number(id_transportista) : null,
        )
        .execute('dbo.sp_rep_entregas');
      res.json({ items: r.recordset || [] });
    } catch (e) {
      console.error('reportes.entregas error:', e);
      res.status(500).json({ error: e.message });
    }
  };

  return {
    resumen,
    ventasDia,
    topProductos,
    opTiempos,
    consumoMateriales,
    entregas,
  };
}
