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
                email: usuario.email
            }
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Token expira em 1 hora

        res.json({ token, usuario: payload.usuario });

    } catch (err) {
        console.error('Erro no login:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;