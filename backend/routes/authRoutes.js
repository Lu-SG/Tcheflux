const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'seuSegredoSuperSecretoParaJWT'; // Mova para .env em produção!

// Rota de Login (POST /api/auth/login)
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    try {
        // 1. Encontrar o usuário pelo email
        const userResult = await pool.query('SELECT * FROM usuario WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas. Usuário não encontrado.' });
        }

        const usuario = userResult.rows[0];

        // 2. Comparar a senha fornecida com a senhaHash armazenada
        // Lembre-se que 'senha_padrao_hash_placeholder' não é um hash bcrypt válido.
        // Esta comparação falhará para usuários criados com o placeholder.
        // Você precisará de um endpoint de registro de usuário que use bcrypt.hash para criar hashes válidos.
        let isMatch = false;
        if (usuario.senhahash !== 'senha_padrao_hash_placeholder' && usuario.senhahash !== 'placeholder_hash') {
            isMatch = await bcrypt.compare(senha, usuario.senhahash);
        } else {
            // Lógica de fallback para senhas placeholder (NÃO USE EM PRODUÇÃO)
            // Isso é apenas para permitir o login durante o desenvolvimento com usuários criados automaticamente.
            // Se a senha enviada for 'senha123' e o hash for o placeholder, permita o login.
            if ((usuario.senhahash === 'senha_padrao_hash_placeholder' || usuario.senhahash === 'placeholder_hash') && senha === 'senha123') {
                console.warn(`AVISO: Login realizado com senha placeholder para o usuário ${email}. Isso é inseguro.`);
                isMatch = true;
            }
        }

        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciais inválidas. Senha incorreta.' });
        }

        // 3. Gerar o Token JWT
        const payload = {
            usuario: {
                id: usuario.idusuario,
                nome: usuario.nomecompleto,
                tipo: usuario.tipo,
                email: usuario.email,
                ...(usuario.tipo === 'Atendente' && usuario.coddepto && { coddepto: usuario.coddepto })
            }
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Token expira em 1 hora

        res.json({ token, usuario: payload.usuario });

    } catch (err) {
        console.error('Erro no login:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota de Registro de Usuário (POST /api/auth/register)
router.post('/register', async (req, res) => {
    const { nomeCompleto, telefone, email, senha, tipo, departamento_area } = req.body;

    // Validação básica
    if (!nomeCompleto || !telefone || !email || !senha || !tipo) {
        return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos (Nome, Telefone, Email, Senha, Tipo).' });
    }

    if (tipo === 'Atendente' && !departamento_area) {
        return res.status(400).json({ error: 'Atendentes devem selecionar um departamento.' });
    }

    try {
        // Verificar se o usuário já existe pelo email
        const userExists = await pool.query('SELECT * FROM usuario WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'Usuário com este email já existe.' });
        }

        // Hash da senha
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        let codDeptoParaSalvar = null;
        if (tipo === 'Atendente') {
            // Buscar o coddepto com base na area fornecida
            const deptoResult = await pool.query('SELECT coddepto FROM departamento WHERE areas = $1', [departamento_area]);
            if (deptoResult.rows.length === 0) {
                return res.status(400).json({ error: `Departamento '${departamento_area}' não encontrado. Selecione um departamento válido.` });
            }
            codDeptoParaSalvar = deptoResult.rows[0].coddepto;
        } else if (departamento_area) {
            return res.status(400).json({ error: 'Campo departamento só é permitido para usuários do tipo Atendente.' });
        }

        // Inserir usuário no banco
        const newUser = await pool.query(
            `INSERT INTO usuario (nomecompleto, telefone, email, senhahash, tipo, coddepto)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING idusuario, nomecompleto, email, tipo`,
            [nomeCompleto, telefone, email, senhaHash, tipo, codDeptoParaSalvar]
        );

        res.status(201).json({
            message: 'Usuário registrado com sucesso!',
            usuario: newUser.rows[0]
        });

    } catch (err) {
        console.error('Erro no registro:', err);
        // Tratar erro de constraint do banco (ex: chk_tipo_depto se a lógica falhar)
        if (err.code === '23514') { // Código para check_violation
             return res.status(400).json({ error: 'Violação de regra de negócio. Verifique o tipo de usuário e departamento.', details: err.detail });
        }
        if (err.code === '23505' && err.constraint === 'usuario_email_key') { // violação de unique constraint no email
            return res.status(400).json({ error: 'Usuário com este email já existe.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor ao tentar registrar o usuário.' });
    }
});

module.exports = router;