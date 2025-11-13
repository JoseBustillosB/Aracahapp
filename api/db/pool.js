import sql from 'mssql';

const sqlConfig = {
  server: process.env.AZURESQL_SERVER,
  database: process.env.AZURESQL_DB,
  user: process.env.AZURESQL_USER,
  password: process.env.AZURESQL_PASS,
  options: { encrypt: process.env.AZURESQL_ENCRYPT === 'true' },
};

export const pool = new sql.ConnectionPool(sqlConfig);
export const poolConnect = pool.connect()
  .then(() => console.log('Conectado a Azure SQL (pool compartido)'))
  .catch((err) => console.error('Error conectando a Azure SQL:', err.message));

export { sql };


/*
// 🔌 CONFIG DB (pool global de conexión)
const sqlConfig = {
  server: process.env.AZURESQL_SERVER,
  database: process.env.AZURESQL_DB,
  user: process.env.AZURESQL_USER,
  password: process.env.AZURESQL_PASS,
  options: { encrypt: process.env.AZURESQL_ENCRYPT === 'true' },
};
const pool = new sql.ConnectionPool(sqlConfig);
const poolConnect = pool.connect().then(() => {
  console.log('Conectado a Azure SQL');
}).catch((err) => {
  console.error('Error conectando a Azure SQL:', err.message);
});
*/