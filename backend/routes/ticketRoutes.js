const express = require('express');
const router = express.Router();
const pool = require('../db');

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

// Função auxiliar para encontrar ou criar um Usuário
async function findOrCreateUsuario(nomeCompleto, tipoUsuario, emailIn, telefoneIn, senhaHashIn, codDeptoAtendente = null) {
    if (!nomeCompleto || !tipoUsuario) {
        // Este erro deve ser pego antes, pela lógica da rota.
        throw new Error('Nome completo e tipo do usuário são obrigatórios para findOrCreateUsuario.');
    }

    // Usar e-mail como um identificador mais forte para encontrar o usuário, se disponível
    // Para este fluxo, o email será um placeholder.
    let userResult = await pool.query(
        'SELECT idusuario FROM usuario WHERE email = $1 AND tipo = $2',
        [emailIn, tipoUsuario]
    );

    if (userResult.rows.length > 0) {
        return userResult.rows[0].idusuario;
    } else {
        // Usuário não encontrado, criar novo
        if (tipoUsuario === 'Atendente' && !codDeptoAtendente) {
            // A constraint chk_tipo_depto no DB também pegaria isso, mas é bom validar antes.
            throw new Error('Atendentes devem ser associados a um departamento na criação.');
        }

        const newUserResult = await pool.query(
            `INSERT INTO usuario (nomecompleto, telefone, email, senhahash, tipo, coddepto)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING idusuario`,
            [
                nomeCompleto,
                telefoneIn,
                emailIn,
                senhaHashIn, // Em produção, use bcrypt.hashSync ou similar
                tipoUsuario,
                tipoUsuario === 'Atendente' ? codDeptoAtendente : null,
            ]
        );
        return newUserResult.rows[0].idusuario;
    }
}

// Rota para CRIAR um novo ticket (POST /api/tickets)
router.post('/', async (req, res) => {
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

        // 2. Obter/Criar o Solicitante Padrão
        //    Em um sistema real com autenticação, o idSolicitante viria do usuário logado.
        //    Para este MVP, criamos/buscamos um usuário "Solicitante Padrão".
        const nomeSolicitantePadrao = 'Solicitante Padrão do Sistema';
        const emailSolicitantePadrao = 'solicitante.padrao@tcheflux.example.com';
        const telefoneSolicitantePadrao = '00000000000';
        const senhaHashSolicitantePadrao = 'senha_padrao_hash_placeholder'; // NÃO FAÇA ISSO EM PRODUÇÃO

        const idSolicitante = await findOrCreateUsuario(
            nomeSolicitantePadrao,
            'Solicitante',
            emailSolicitantePadrao,
            telefoneSolicitantePadrao,
            senhaHashSolicitantePadrao
        );

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
