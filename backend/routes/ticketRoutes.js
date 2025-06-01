const express = require('express');
const router = express.Router();
const pool = require('../db'); // Importa a configuração da conexão com o banco

// Rota para CRIAR um novo ticket (POST /api/tickets)
router.post('/', async (req, res) => {
    const {
        cliente_nome,
        solicitante_nome,
        titulo,
        descricao,
        prioridade,
        catalogo_servico_item,
        responsavel_nome,
        seguidores,
        status // Adicionado para pegar o status do formulário
    } = req.body;

    // Validação básica (campos obrigatórios conforme o HTML e a tabela)
    if (!cliente_nome || !solicitante_nome || !titulo || !descricao || !status) {
        return res.status(400).json({ error: 'Campos obrigatórios (Cliente, Solicitante, Título, Descrição, Status) não foram preenchidos.' });
    }

    try {
        const novoTicket = await pool.query(
            `INSERT INTO tickets (
                cliente_nome, solicitante_nome, titulo, descricao, prioridade,
                catalogo_servico_item, responsavel_nome, seguidores, status
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`, // RETURNING * retorna o registro inserido
            [
                cliente_nome,
                solicitante_nome,
                titulo,
                descricao,
                prioridade || null, // Se prioridade for undefined/vazio, insere NULL
                catalogo_servico_item || null, // Se catalogo_servico_item for undefined/vazio, insere NULL
                responsavel_nome || null, // Se responsavel_nome for undefined/vazio, insere NULL
                seguidores || null, // Se seguidores for undefined/vazio, insere NULL
                status
            ]
        );

        res.status(201).json(novoTicket.rows[0]); // Retorna o ticket criado com status 201 (Created)
    } catch (err) {
        console.error('Erro ao inserir ticket:', err.message);
        console.error('Detalhes do erro:', err); // Log completo do erro
        // Verifica se é um erro de violação de constraint (ex: campo NOT NULL faltando)
        if (err.code && err.code.startsWith('23')) { // Códigos de erro de integridade do PostgreSQL geralmente começam com '23'
             return res.status(400).json({ error: 'Erro de validação de dados. Verifique os campos enviados.', details: err.detail });
        }
        res.status(500).json({ error: 'Erro interno do servidor ao tentar criar o ticket.' });
    }
});

// Você pode adicionar outras rotas aqui (GET para listar, GET por ID, PUT, DELETE)

module.exports = router;
