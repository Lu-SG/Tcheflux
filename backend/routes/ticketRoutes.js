const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware'); // Importar o middleware

// Função auxiliar para encontrar ou criar um Departamento
async function findOrCreateDepartamento(areaNome) {
    if (!areaNome) {
        // Este erro deve ser pego antes de chamar a função, pela validação da rota.
        throw new Error('Nome da área do departamento é obrigatório para findOrCreateDepartamento.');
    }
    let deptoResult = await pool.query('SELECT coddepto FROM departamento WHERE areas = $1', [areaNome]);
    if (deptoResult.rows.length > 0) {
        return deptoResult.rows[0].coddepto;
    } else {
        const newDeptoResult = await pool.query(
            'INSERT INTO departamento (areas) VALUES ($1) RETURNING coddepto',
            [areaNome]
        );
        return newDeptoResult.rows[0].coddepto;
    }
}

// Rota para CRIAR um novo ticket (POST /api/tickets)
router.post('/', authMiddleware, async (req, res) => { // Aplicar o middleware aqui
    const {
        titulo,
        descricao,
        departamento_area // Novo campo do formulário
    } = req.body;

    // Validação dos campos obrigatórios do formulário atual
    if (!titulo || !descricao || !departamento_area) {
        return res.status(400).json({
            error: 'Campos obrigatórios (Título, Descrição, Departamento de Destino) não foram preenchidos.',
        });
    }

    try {
        // 1. Obter/Criar o Departamento
        const codDeptoTicket = await findOrCreateDepartamento(departamento_area);
        
        // 2. Obter o idSolicitante do usuário autenticado (adicionado ao req pelo authMiddleware)
        const idSolicitante = req.usuario.id; 

        // Validar se o idSolicitante foi obtido
        if (!idSolicitante) {
            return res.status(401).json({ error: 'Não foi possível identificar o solicitante. Faça login novamente.' });
        }
        // 3. Inserir o Ticket
        // O status será 'Aberto' por default (definido no DB)
        // O idAtendente será NULL por enquanto
        // dataInicio será CURRENT_TIMESTAMP por default (definido no DB)
        const novoTicket = await pool.query(
            `INSERT INTO ticket (titulo, descricao, idsolicitante, coddepto, status)
             VALUES ($1, $2, $3, $4, 'Aberto')
             RETURNING *`,
            [titulo, descricao, idSolicitante, codDeptoTicket]
        );

        res.status(201).json(novoTicket.rows[0]);
    } catch (err) {
        console.error('Erro ao criar ticket:', err.message);
        console.error('Detalhes do erro:', err);
        if (err.code && err.code.startsWith('23')) { // Códigos de erro de integridade do PostgreSQL geralmente começam com '23'
            return res.status(400).json({ error: 'Erro de validação de dados ao criar ticket.', details: err.detail || err.message });
        }
        res.status(500).json({ error: 'Erro interno do servidor ao tentar criar o ticket.' });
    }
});

module.exports = router;
