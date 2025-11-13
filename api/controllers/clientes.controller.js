// controllers/clientes.controller.js
import { pool, sql, poolConnect } from '../db/pool.js';

/* =====================================================
   LISTAR (sp_clientes_list)
   Filtros: q, page, pageSize
===================================================== */
export async function listClientes(req, res) {
  try {
    await poolConnect;

    const q        = (req.query.q || '').toString().trim() || null;
    const page     = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || '20', 10)));

    const r = await pool.request()
      .input('q',       sql.NVarChar, q)
      .input('page',    sql.Int, page)
      .input('pageSize',sql.Int, pageSize)
      .execute('dbo.sp_clientes_list');

    // Convención: recordsets[0] = items, recordsets[1][0].total = total
    const items = r.recordsets?.[0] || [];
    const total = r.recordsets?.[1]?.[0]?.total ?? items.length;

    res.json({ items, total, page, pageSize });
  } catch (e) {
    console.error('listClientes error:', e);
    res.status(500).json({ error: e.message || 'Error listClientes' });
  }
}

/* =====================================================
   GET (sp_clientes_get)
   SP espera: @id
===================================================== */
export async function getCliente(req, res) {
  try {
    await poolConnect;

    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'Parámetro id inválido' });

    const r = await pool.request()
      .input('id', sql.Int, id) // ¡Ojo! el SP espera @id
      .execute('dbo.sp_clientes_get');

    const item = r.recordset?.[0];
    if (!item) return res.status(404).json({ error: 'Cliente no encontrado' });

    res.json({ item });
  } catch (e) {
    console.error('getCliente error:', e);
    res.status(500).json({ error: e.message || 'Error getCliente' });
  }
}

/* =====================================================
   CREATE (sp_clientes_create)
   SP espera: 
   @nombre NVARCHAR(150),
   @email VARCHAR(150) = NULL,
   @telefono_movil VARCHAR(50) = NULL,
   @telefono_fijo VARCHAR(50) = NULL,
   @direccion NVARCHAR(MAX) = NULL,
   @id_genero INT,
   @id_tipo_cliente INT
   Devuelve: SELECT SCOPE_IDENTITY() AS id;
===================================================== */
export async function createCliente(req, res) {
  try {
    await poolConnect;

    const {
      nombre,
      email = null,
      telefono_movil = null,
      telefono_fijo = null,
      direccion = null,
      id_genero,
      id_tipo_cliente
    } = req.body || {};

    if (!nombre || !id_genero || !id_tipo_cliente) {
      return res.status(400).json({ error: 'nombre, id_genero, id_tipo_cliente son obligatorios' });
    }

    const r = await pool.request()
      .input('nombre',         sql.NVarChar(150), nombre)
      .input('email',          sql.VarChar(150),  email)
      .input('telefono_movil', sql.VarChar(50),   telefono_movil)
      .input('telefono_fijo',  sql.VarChar(50),   telefono_fijo)
      .input('direccion',      sql.NVarChar(sql.MAX), direccion)
      .input('id_genero',      sql.Int,          Number(id_genero))
      .input('id_tipo_cliente',sql.Int,          Number(id_tipo_cliente))
      .execute('dbo.sp_clientes_create');

    const newId = r.recordset?.[0]?.id || r.recordset?.[0]?.ID || r.returnValue;
    if (!newId) {
      return res.status(500).json({ error: 'No se obtuvo el ID del nuevo cliente' });
    }

    res.status(201).json({ id_cliente: Number(newId) });
  } catch (e) {
    console.error('createCliente error:', e);
    const msg = e?.originalError?.info?.message || e.message || 'Error createCliente';
    res.status(500).json({ error: msg });
  }
}

/* =====================================================
   UPDATE (sp_clientes_update)
   SP espera:
   @id INT,
   @nombre NVARCHAR(150) = NULL,
   @email  VARCHAR(150) = NULL,
   @telefono_movil VARCHAR(50) = NULL,
   @telefono_fijo  VARCHAR(50) = NULL,
   @direccion NVARCHAR(MAX) = NULL,
   @id_genero INT = NULL,
   @id_tipo_cliente INT = NULL
   Devuelve: SELECT @@ROWCOUNT AS affected;
===================================================== */
export async function updateCliente(req, res) {
  try {
    await poolConnect;

    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'Parámetro id inválido' });

    const {
      nombre = null,
      email = null,
      telefono_movil = null,
      telefono_fijo = null,
      direccion = null,
      id_genero = null,
      id_tipo_cliente = null
    } = req.body || {};

    const r = await pool.request()
      .input('id',             sql.Int, id)
      .input('nombre',         sql.NVarChar(150), nombre)
      .input('email',          sql.VarChar(150),  email)
      .input('telefono_movil', sql.VarChar(50),   telefono_movil)
      .input('telefono_fijo',  sql.VarChar(50),   telefono_fijo)
      .input('direccion',      sql.NVarChar(sql.MAX), direccion)
      .input('id_genero',      sql.Int,          id_genero !== null ? Number(id_genero) : null)
      .input('id_tipo_cliente',sql.Int,          id_tipo_cliente !== null ? Number(id_tipo_cliente) : null)
      .execute('dbo.sp_clientes_update');

    const affected = r.recordset?.[0]?.affected || 0;
    if (!affected) return res.status(404).json({ error: 'Cliente no encontrado o sin cambios' });

    res.json({ ok: true, affected });
  } catch (e) {
    console.error('updateCliente error:', e);
    const msg = e?.originalError?.info?.message || e.message || 'Error updateCliente';
    res.status(500).json({ error: msg });
  }
}

/* =====================================================
   DELETE (sp_clientes_delete)
   SP espera: @id
===================================================== */
export async function deleteCliente(req, res) {
  try {
    await poolConnect;

    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'Parámetro id inválido' });

    const r = await pool.request()
      .input('id', sql.Int, id)
      .execute('dbo.sp_clientes_delete');

    const affected = r.recordset?.[0]?.affected || r.rowsAffected?.[0] || 0;
    if (!affected) return res.status(404).json({ error: 'Cliente no encontrado' });

    res.json({ ok: true, affected });
  } catch (e) {
    console.error('deleteCliente error:', e);
    const msg = e?.originalError?.info?.message || e.message || 'Error deleteCliente';
    res.status(500).json({ error: msg });
  }
}
