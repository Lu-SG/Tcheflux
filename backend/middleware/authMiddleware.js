const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'seuSegredoSuperSecretoParaJWT';

module.exports = function(req, res, next) {
    // Obter o token do header
    const authHeader = req.header('Authorization');

    // Verificar se não há token
    if (!authHeader) {
        return res.status(401).json({ msg: 'Nenhum token, autorização negada.' });
    }

    // O token geralmente vem no formato "Bearer <token>"
    const tokenParts = authHeader.split(' ');

    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({ msg: 'Token mal formatado, autorização negada.' });
    }

    const token = tokenParts[1];

    // Verificar token
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded.usuario; // Adiciona o payload do usuário ao objeto req
        next(); // Passa para a próxima função de middleware ou rota
    } catch (err) {
        console.error('Erro na verificação do token:', err.message);
        res.status(401).json({ msg: 'Token não é válido.' });
    }
};