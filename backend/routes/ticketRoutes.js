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

// Rota para LISTAR os tickets criados pelo usuário logado (GET /api/tickets/meus-tickets)
router.get('/meus-tickets', authMiddleware, async (req, res) => {
    try {
        const idSolicitante = req.usuario.id;
        const result = await pool.query(
            `SELECT t.nro, t.titulo, t.status, t.datainicio, t.dataatualizacao, d.areas as departamento_area
             FROM ticket t
             JOIN departamento d ON t.coddepto = d.coddepto
             WHERE t.idsolicitante = $1
             ORDER BY t.datainicio DESC`,
            [idSolicitante]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar meus tickets:', err);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar seus tickets.' });
    }
});

// Rota para LISTAR os tickets do departamento do atendente logado (GET /api/tickets/departamento)
router.get('/departamento', authMiddleware, async (req, res) => {
    try {
        // Verificar se o usuário é um Atendente e tem um coddepto
        if (req.usuario.tipo !== 'Atendente' || !req.usuario.coddepto) {
            return res.status(403).json({ error: 'Acesso negado. Apenas atendentes com departamento podem visualizar tickets do departamento.' });
        }

        const codDeptoAtendente = req.usuario.coddepto;

        // Exemplo: buscar tickets abertos ou em andamento do departamento
        // Você pode ajustar os status conforme necessário
        const result = await pool.query(
            `SELECT t.nro, t.titulo, t.status, t.datainicio, t.dataatualizacao, u.nomecompleto as solicitante_nome
             FROM ticket t
             JOIN usuario u ON t.idsolicitante = u.idusuario
             WHERE t.coddepto = $1 AND (t.status = 'Aberto' OR t.status = 'Em Andamento' OR t.status = 'Pendente Cliente')
             ORDER BY t.datainicio ASC`, // Mais antigos primeiro para atendimento
            [codDeptoAtendente]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar tickets do departamento:', err);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar tickets do departamento.' });
    }
});

// Rota para LISTAR os tickets do atendente logado (GET /api/tickets/atendente)
router.get('/ticket-atendente', authMiddleware, async (req, res) => {
    try {
        // Verificar se o usuário é um Atendente
        if (req.usuario.tipo !== 'Atendente') {
            return res.status(403).json({ error: 'Acesso negado. Apenas atendentes podem visualizar seus tickets atribuídos.' });
        }

        const idAtendenteLogado = req.usuario.id; // Obter o ID do atendente logado do req.usuario

        const result = await pool.query(
            `SELECT 
                t.nro, 
                t.titulo, 
                t.status, 
                t.datainicio, 
                t.dataatualizacao,
                solicitante.nomecompleto AS solicitante_nome, -- Nome do solicitante
                atendente_info.nomecompleto AS atendente_nome -- Nome do atendente (opcional, já que estamos filtrando por ele)
             FROM ticket t
             LEFT JOIN usuario solicitante ON t.idsolicitante = solicitante.idusuario
             LEFT JOIN usuario atendente_info ON t.idatendente = atendente_info.idusuario 
             WHERE t.idatendente = $1 -- Filtrar pelos tickets atribuídos ao atendente logado
             ORDER BY t.datainicio ASC`, 
            [idAtendenteLogado] // Usar o ID do atendente logado como parâmetro
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar tickets do atendente:', err);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar os tickets do atendente.' });
    }
});

// Rota para um ATENDENTE assumir um ticket (PUT /api/tickets/:nro/assumir)
router.put('/:nro/assumir', authMiddleware, async (req, res) => {
    const { nro } = req.params; // Número do ticket da URL
    const idAtendente = req.usuario.id; // ID do atendente logado

    // Verificar se o usuário é um Atendente
    if (req.usuario.tipo !== 'Atendente') {
        return res.status(403).json({ error: 'Apenas atendentes podem assumir tickets.' });
    }

    try {
        // Verificar o status atual do ticket e se ele não tem um atendente
        const ticketResult = await pool.query('SELECT status, idatendente FROM ticket WHERE nro = $1', [nro]);

        if (ticketResult.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket não encontrado.' });
        }

        const ticketAtual = ticketResult.rows[0];

        if (ticketAtual.status !== 'Aberto') {
            return res.status(400).json({ error: `Este ticket não está "Aberto". Status atual: ${ticketAtual.status}.` });
        }

        // Atualizar o ticket: definir status para 'Em Andamento' e atribuir o idatendente
        const updatedTicket = await pool.query(
            `UPDATE ticket SET status = 'Em Andamento', idatendente = $1, dataAtualizacao = CURRENT_TIMESTAMP 
             WHERE nro = $2 RETURNING *`,
            [idAtendente, nro]
        );

        res.json(updatedTicket.rows[0]);
    } catch (err) {
        console.error(`Erro ao assumir ticket ${nro}:`, err);
        res.status(500).json({ error: 'Erro interno do servidor ao tentar assumir o ticket.' });
    }
});

// Rota para OBTER detalhes de um ticket específico (GET /api/tickets/:nro)
router.get('/:nro', authMiddleware, async (req, res) => {
    const { nro } = req.params;
    try {
        const ticketResult = await pool.query(
            `SELECT 
                t.*, 
                s.nomecompleto as solicitante_nome, 
                s.email as solicitante_email,
                a.nomecompleto as atendente_nome, 
                a.email as atendente_email,
                d.areas as departamento_area
             FROM ticket t
             JOIN usuario s ON t.idsolicitante = s.idusuario
             LEFT JOIN usuario a ON t.idatendente = a.idusuario
             LEFT JOIN departamento d ON t.coddepto = d.coddepto
             WHERE t.nro = $1`,
            [nro]
        );

        if (ticketResult.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket não encontrado.' });
        }
        res.json(ticketResult.rows[0]);
    } catch (err) {
        console.error(`Erro ao buscar ticket ${nro}:`, err);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar detalhes do ticket.' });
    }
});

// Rota para ADICIONAR um comentário a um ticket (PUT /api/tickets/:nro/comentario)
router.put('/:nro/comentario', authMiddleware, async (req, res) => {
    const { nro } = req.params;
    const { novoComentario } = req.body;
    const usuarioLogado = req.usuario; // { id, nome, tipo, email, coddepto? }

    if (!novoComentario || novoComentario.trim() === '') {
        return res.status(400).json({ error: 'O comentário não pode estar vazio.' });
    }

    try {
        const ticketResult = await pool.query('SELECT descricao FROM ticket WHERE nro = $1', [nro]);
        if (ticketResult.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket não encontrado.' });
        }

        const descricaoAtual = ticketResult.rows[0].descricao || ''; // Pega a descrição atual ou string vazia se for null

        // Formatar o novo comentário com data, hora e nome do usuário
        const timestamp = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const comentarioFormatado = 
`------------------------------------
[${timestamp}] ${usuarioLogado.nome} (${usuarioLogado.tipo}):
${novoComentario.trim()}
`;

        const novaDescricao = descricaoAtual + comentarioFormatado;

        const updateResult = await pool.query(
            'UPDATE ticket SET descricao = $1, dataAtualizacao = CURRENT_TIMESTAMP WHERE nro = $2 RETURNING *',
            [novaDescricao, nro]
        );

        res.json(updateResult.rows[0]);
    } catch (err) {
        console.error(`Erro ao adicionar comentário ao ticket ${nro}:`, err);
        res.status(500).json({ error: 'Erro interno do servidor ao adicionar comentário.' });
    }
});

// Rota para ATUALIZAR o status de um ticket (PUT /api/tickets/:nro/status) - Ação do Atendente
router.put('/:nro/status', authMiddleware, async (req, res) => {
    const { nro } = req.params;
    const { novoStatus, comentarioAdicional } = req.body; // Comentário é opcional ao mudar status
    const usuarioLogado = req.usuario;

    if (!novoStatus) {
        return res.status(400).json({ error: 'O novo status é obrigatório.' });
    }

    // Validar os status permitidos (opcional, mas bom para consistência)
    const statusPermitidos = ['Em Andamento', 'Aguardando Resposta', 'Resolvido', 'Fechado', 'Pendente Cliente']; // Adicionado 'Pendente Cliente'
    if (!statusPermitidos.includes(novoStatus)) {
        return res.status(400).json({ error: `Status '${novoStatus}' inválido.` });
    }

    try {
        // Buscar o ticket para validar as permissões de mudança de status
        const ticketResult = await pool.query('SELECT status, idsolicitante FROM ticket WHERE nro = $1', [nro]);
        if (ticketResult.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket não encontrado.' });
        }
        const ticketAtual = ticketResult.rows[0];

        // Lógica de permissão
        if (usuarioLogado.tipo === 'Solicitante') {
            // Solicitante só pode aprovar (Fechar) ou reprovar (Pendente Cliente) um ticket 'Resolvido' que seja seu.
            if (ticketAtual.idsolicitante !== usuarioLogado.id) {
                return res.status(403).json({ error: 'Você não tem permissão para alterar este ticket.' });
            }
            if (ticketAtual.status !== 'Resolvido') {
                return res.status(400).json({ error: `Ação não permitida. O ticket precisa estar com status 'Resolvido', mas está '${ticketAtual.status}'.` });
            }
            if (novoStatus !== 'Fechado' && novoStatus !== 'Pendente Cliente') {
                return res.status(403).json({ error: `Como solicitante, você só pode definir o status para 'Fechado' ou 'Pendente Cliente'.` });
            }
        } else if (usuarioLogado.tipo !== 'Atendente') {
            // Se não for nem Solicitante nem Atendente, nega.
            return res.status(403).json({ error: 'Você não tem permissão para alterar o status de tickets.' });
        }
        // Se for Atendente, a lógica continua como antes (pode alterar para os status permitidos).

        let descricaoAtualizada = '';
        if (comentarioAdicional && comentarioAdicional.trim() !== '') {
            const ticketResult = await pool.query('SELECT descricao FROM ticket WHERE nro = $1', [nro]);
            if (ticketResult.rows.length === 0) { // Verificação extra, embora a atualização abaixo falharia de qualquer forma
                return res.status(404).json({ error: 'Ticket não encontrado para adicionar comentário.' });
            }
            const descricaoAtual = ticketResult.rows[0].descricao || '';
            const timestamp = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            const comentarioFormatado =
`\n------------------------------------
[${timestamp}] ${usuarioLogado.nome} (Atendente) atualizou o status para: ${novoStatus}
Comentário: ${comentarioAdicional.trim()}
`;
            descricaoAtualizada = descricaoAtual + comentarioFormatado;
        }

        const query = descricaoAtualizada ? 'UPDATE ticket SET status = $1, dataAtualizacao = CURRENT_TIMESTAMP, descricao = $2 WHERE nro = $3 RETURNING *' : 'UPDATE ticket SET status = $1, dataAtualizacao = CURRENT_TIMESTAMP WHERE nro = $2 RETURNING *';
        const params = descricaoAtualizada ? [novoStatus, descricaoAtualizada, nro] : [novoStatus, nro];
        const updateResult = await pool.query(query, params);

        if (updateResult.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket não encontrado para atualizar status.' });
        }
        res.json(updateResult.rows[0]);
    } catch (err) {
        console.error(`Erro ao atualizar status do ticket ${nro}:`, err);
        res.status(500).json({ error: 'Erro interno do servidor ao atualizar status.' });
    }
});

module.exports = router;
