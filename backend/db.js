const { Pool } = require('pg');
require('dotenv').config(); // Para carregar variáveis de ambiente do arquivo .env

// Configuração da conexão com o banco de dados PostgreSQL
// As variáveis de ambiente são usadas para proteger suas credenciais
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Testa a conexão (opcional, mas bom para verificar)
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Erro ao conectar ao PostgreSQL:', err.stack);
  } else {
    console.log('Conectado ao PostgreSQL com sucesso em:', res.rows[0].now);
  }
});

module.exports = pool;