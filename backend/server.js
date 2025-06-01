const express = require('express');
require('dotenv').config(); // Para carregar variáveis de ambiente do .env

// Importar a configuração do banco de dados (opcional aqui, mas útil se você quiser testar a conexão ao iniciar)
// const pool = require('./db');

const app = express();

// Define a porta para o servidor backend
// Tenta usar a variável de ambiente BACKEND_PORT, ou 3000 como padrão
const PORT = process.env.BACKEND_PORT || 3000;

// Middleware para parsear JSON no corpo das requisições (útil para POST, PUT)
app.use(express.json());

// Rota de teste básica
app.get('/', (req, res) => {
  res.send('Olá Mundo com Express! O backend Tcheflux está no ar!');
});

// Aqui você adicionará suas outras rotas no futuro
// Exemplo: const itemRoutes = require('./routes/items');
// app.use('/api/items', itemRoutes);

app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
  // A mensagem de "Conectado ao PostgreSQL com sucesso em:" virá do db.js se ele for importado
});