const express = require('express');
require('dotenv').config(); // Para carregar variáveis de ambiente do .env
    const cors = require('cors'); // Importa o pacote cors
   
// Importar a configuração do banco de dados (opcional aqui, mas útil se você quiser testar a conexão ao iniciar)
   const pool = require('./db'); // Descomente para garantir que a conexão é testada na inicialização
   
const app = express();

// Define a porta para o servidor backend
// Tenta usar a variável de ambiente BACKEND_PORT, ou 3000 como padrão
const PORT = process.env.BACKEND_PORT || 3000;

    // Habilita o CORS para todas as origens (bom para desenvolvimento)
    // Para produção, você pode querer configurar origens específicas: app.use(cors({ origin: 'http://seu-dominio-frontend.com' }));
    app.use(cors());
    
// Middleware para parsear JSON no corpo das requisições (útil para POST, PUT)
app.use(express.json());

// Rota de teste básica
app.get('/', (req, res) => {
  res.send('Olá Mundo com Express! O backend Tcheflux está no ar!');
});

   // Importar e usar as rotas de tickets
   const ticketRoutes = require('./routes/ticketRoutes');
   app.use('/api/tickets', ticketRoutes); // Todas as rotas em ticketRoutes serão prefixadas com /api/tickets

   // Importar e usar as rotas de autenticação
   const authRoutes = require('./routes/authRoutes');
   app.use('/api/auth', authRoutes); // Rotas como /api/auth/login

// Só inicia o servidor se este arquivo for executado diretamente
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
    // A mensagem de "Conectado ao PostgreSQL com sucesso em:" virá do db.js
  });
}

module.exports = app; // Exporta o app para ser usado nos testes