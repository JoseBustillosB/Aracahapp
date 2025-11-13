import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
// import admin from 'firebase-admin';

import { pool, poolConnect, sql } from './db/pool.js';
import { verifyFirebaseToken } from './middleware/authFirebase.js';
import { requireRole } from './middleware/requireRole.js';

import clientesRoutes from './routes/clientes.routes.js';
import cotizacionesRouter from './routes/cotizaciones.routes.js';
import productosRoutes from './routes/productos.routes.js';
import pedidosRoutes from './routes/pedidos.routes.js';
import materialesRoutes from './routes/materiales.routes.js';
import opRoutes from './routes/op.routes.js';
import entregasRoutes from './routes/entregas.routes.js';
import reportesRoutes from './routes/reportes.routes.js';
//import makeEntregasRoutes from './routes/entregas.routes.js';


const app = express();

const allowed = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowed.includes(origin)) callback(null, true);
      else callback(new Error('Origen no permitido por CORS'));
    },
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());

// Utils
app.get('/api/ping', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.get('/api/db-ping', async (_req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query('SELECT 1 AS ok, DB_NAME() AS db');
    res.json({ ok: true, db: result.recordset[0].db });
  } catch (e) {
    console.error('db-ping error:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/roles', async (_req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query(`
      SELECT id_rol, nombre_rol, detalle_rol
      FROM dbo.roles
      ORDER BY id_rol
    `);
  res.json(result.recordset);
  } catch (e) {
    console.error('roles error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/me', verifyFirebaseToken, (req, res) => {
  res.json({ firebase_user: req.user });
});

app.post('/api/sync-user', verifyFirebaseToken, async (req, res) => {
  try {
    await poolConnect;

    const { email, name } = req.user;
    const request = pool.request();
    request.input('correo', sql.VarChar, email);
    request.input('nombre', sql.NVarChar, name || email);
    request.input('rolDefecto', sql.VarChar, 'cliente');
    request.output('id_usuario_out', sql.Int);
    request.output('id_cliente_out', sql.Int);

    const result = await request.execute('dbo.sp_upsert_usuario_firebase');
    const idUsuario = result.output.id_usuario_out;
    const idCliente = result.output.id_cliente_out ?? null;

    const perfil = await pool.request()
      .input('id', sql.Int, idUsuario)
      .query(`
        SELECT u.id_usuario, u.nombre, u.correo, r.nombre_rol
        FROM dbo.usuarios u
        JOIN dbo.roles r ON u.id_rol = r.id_rol
        WHERE u.id_usuario = @id
      `);

    res.json({ firebase_user: req.user, perfil: perfil.recordset[0], id_cliente_out: idCliente });
  } catch (e) {
    console.error('sync-user error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Rutas de negocio
app.use('/api/clientes', clientesRoutes);
app.use('/api/cotizaciones', cotizacionesRouter);
app.use('/api/productos', productosRoutes);

// Pedidos
app.use('/api/pedidos', pedidosRoutes({ pool, sql, verifyFirebaseToken }));

//Materiales
app.use('/api/materiales', materialesRoutes({ pool, sql, verifyFirebaseToken }));

// Órdenes de Producción (OP)
app.use('/api/op', opRoutes({ pool, sql, verifyFirebaseToken }));

//Entregas
app.use('/api/entregas', entregasRoutes({ pool, sql, verifyFirebaseToken }));

//Reportes
app.use('/api/reportes', reportesRoutes({ pool, sql }));

//app.use('/api/entregas', makeEntregasRoutes(pool, sql));


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API corriendo en puerto ${PORT}`));
