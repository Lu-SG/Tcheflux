const request = require('supertest');
const app = require('../server'); // Importa a instância do app Express
const pool = require('../db'); // Importa o pool de conexão para limpar o banco, se necessário

describe('Rotas de Autenticação API', () => {
    // Limpar a tabela de usuários antes e depois dos testes para evitar conflitos
    // CUIDADO: Isso apagará todos os usuários. Use um banco de dados de teste em um cenário real.
    beforeAll(async () => {
        // É uma boa prática ter um banco de dados de teste separado.
        // Por agora, vamos limpar a tabela de usuários.
        // Em um projeto maior, você usaria migrações e seeds para o ambiente de teste.
        await pool.query('DELETE FROM ticket'); // Limpa tickets primeiro devido a FKs
        await pool.query('DELETE FROM usuario');
        // Poderia limpar departamento também, mas os seeds já cuidam do ON CONFLICT
    });

    afterAll(async () => {
        // Fecha a conexão com o banco de dados após todos os testes
        await pool.end();
    });

    // Teste para a rota de registro de usuário
    describe('POST /api/auth/register', () => {
        it('deve registrar um novo usuário Solicitante com sucesso', async () => {
            const novoUsuario = {
                nomeCompleto: 'Teste Solicitante',
                telefone: '11987654321',
                email: 'solicitante.teste@example.com',
                senha: 'senhaSegura123',
                tipo: 'Solicitante'
                // departamento_area não é necessário para Solicitante
            };

            const res = await request(app)
                .post('/api/auth/register')
                .send(novoUsuario);

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('message', 'Usuário registrado com sucesso!');
            expect(res.body.usuario).toHaveProperty('email', novoUsuario.email);
            expect(res.body.usuario).toHaveProperty('tipo', 'Solicitante');
        });

        it('deve registrar um novo usuário Atendente com sucesso', async () => {
            const novoAtendente = {
                nomeCompleto: 'Teste Atendente',
                telefone: '11912345678',
                email: 'atendente.teste@example.com',
                senha: 'outraSenhaSegura123',
                tipo: 'Atendente',
                departamento_area: 'TI' // Atendente precisa de departamento
            };

            const res = await request(app)
                .post('/api/auth/register')
                .send(novoAtendente);

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('message', 'Usuário registrado com sucesso!');
            expect(res.body.usuario).toHaveProperty('email', novoAtendente.email);
            expect(res.body.usuario).toHaveProperty('tipo', 'Atendente');
        });

        it('deve retornar erro 400 se tentar registrar com email já existente', async () => {
            // Primeiro, registra um usuário para garantir que o email exista
            const usuarioExistente = {
                nomeCompleto: 'Usuário Duplicado',
                telefone: '11999999999',
                email: 'duplicado@example.com', // Este email será usado novamente
                senha: 'senha123',
                tipo: 'Solicitante'
            };
            await request(app).post('/api/auth/register').send(usuarioExistente);

            // Tenta registrar novamente com o mesmo email
            const res = await request(app)
                .post('/api/auth/register')
                .send(usuarioExistente);

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'Usuário com este email já existe.');
        });
    });

    // Testes para a rota de login de usuário
    describe('POST /api/auth/login', () => {
        const testUserCredentials = {
            nomeCompleto: 'Usuário Login Teste',
            telefone: '11900000000',
            email: 'login.teste@example.com',
            senha: 'senhaParaLogin123',
            tipo: 'Solicitante'
        };

        // Registrar um usuário antes de testar o login
        beforeAll(async () => {
            // Limpar novamente para garantir que o usuário de teste de login não entre em conflito com os de registro
            // ou que não haja usuários de testes anteriores.
            await pool.query('DELETE FROM ticket'); 
            await pool.query('DELETE FROM usuario WHERE email = $1', [testUserCredentials.email]); // Limpa especificamente este usuário se existir
            
            // Registrar o usuário que será usado para os testes de login
            await request(app)
                .post('/api/auth/register')
                .send(testUserCredentials);
        });

        it('deve logar um usuário com credenciais válidas e retornar um token JWT', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUserCredentials.email,
                    senha: testUserCredentials.senha
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('usuario');
            expect(res.body.usuario).toHaveProperty('email', testUserCredentials.email);
            expect(res.body.usuario).toHaveProperty('nome', testUserCredentials.nomeCompleto);
        });

        it('deve retornar erro 401 para senha incorreta', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUserCredentials.email,
                    senha: 'senhaErrada123'
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('error', 'Credenciais inválidas. Senha incorreta.');
        });

        it('deve retornar erro 401 para usuário não encontrado', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'naoexiste@example.com',
                    senha: 'qualquerSenha'
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('error', 'Credenciais inválidas. Usuário não encontrado.');
        });

        it('deve retornar erro 400 se o email estiver faltando', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    senha: testUserCredentials.senha
                });
            
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'Email e senha são obrigatórios.');
        });
    });

    // TODO: Adicionar testes para a rota de criação de tickets /api/tickets
});