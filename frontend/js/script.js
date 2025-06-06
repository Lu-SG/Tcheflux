document.addEventListener('DOMContentLoaded', () => {
    const formNovoTicket = document.getElementById('formNovoTicket');

    if (formNovoTicket) {
        formNovoTicket.addEventListener('submit', async (event) => {
            event.preventDefault(); // Impede o envio padrão do formulário (recarregar a página)

            // Coleta os dados do formulário
            const formData = new FormData(formNovoTicket);
            const ticketData = {};
            formData.forEach((value, key) => {
                // Se o valor for uma string vazia e o campo não for obrigatório,
                // podemos querer enviar null ou simplesmente omitir,
                // mas para simplificar, vamos enviar strings vazias por enquanto.
                // O backend já trata strings vazias como NULL para campos não obrigatórios.
                ticketData[key] = value;
            });

            // Adiciona um feedback visual para o usuário (opcional)
            const submitButton = formNovoTicket.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';

            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    alert('Você não está logado. Por favor, faça login para criar um ticket.');
                    window.location.href = 'sign_in.html'; // Redireciona para login
                    return; // Interrompe a execução
                }

                const response = await fetch('http://localhost:3001/api/tickets', { // Certifique-se que a URL e porta estão corretas
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // Adiciona o token JWT ao header
                    },
                    body: JSON.stringify(ticketData),
                });

                if (response.ok) { // Status 200-299
                    const result = await response.json();
                    console.log('Ticket criado com sucesso:', result);
                    alert(`Ticket #${result.nro} criado com sucesso!`);
                    formNovoTicket.reset(); // Limpa o formulário
                    // Você pode redirecionar o usuário ou atualizar a UI aqui
                } else {
                    if (response.status === 401) { // Token inválido ou não autorizado
                        alert('Sua sessão expirou ou é inválida. Por favor, faça login novamente.');
                        localStorage.removeItem('token'); // Limpa token inválido
                        localStorage.removeItem('usuario');
                        window.location.href = 'sign_in.html';
                        return;
                    }
                    // Tenta pegar a mensagem de erro do backend
                    const errorResult = await response.json().catch(() => null); // Evita erro se o corpo não for JSON
                    const errorMessage = errorResult && errorResult.error
                        ? errorResult.error + (errorResult.details ? `\nDetalhes: ${errorResult.details}` : '')
                        : `Erro ao criar ticket. Status: ${response.status} - ${response.statusText}`;
                    console.error('Erro ao criar ticket:', response.status, response.statusText, errorResult);
                    alert(errorMessage);
                }
            } catch (error) {
                console.error('Erro de rede ou ao processar a requisição:', error);
                alert('Erro de conexão ao tentar criar o ticket. Verifique o console para mais detalhes.');
            } finally {
                // Restaura o botão
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
    }

    const formLogin = document.getElementById('formLogin');

    if (formLogin) {
        formLogin.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            const btnLogin = document.getElementById('btnLogin');
            const originalButtonText = btnLogin.textContent;

            btnLogin.disabled = true;
            btnLogin.textContent = 'Entrando...';

            try {
                const response = await fetch('http://localhost:3001/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, senha }),
                });

                const data = await response.json();

                if (response.ok) {
                    console.log('Login bem-sucedido:', data);
                    // Armazenar o token e informações do usuário
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('usuario', JSON.stringify(data.usuario));

                    alert(`Login bem-sucedido! Bem-vindo, ${data.usuario.nome}!`);
                    // Redirecionar para a página principal ou dashboard
                    window.location.href = 'index.html';
                } else {
                    console.error('Erro no login:', data.error);
                    alert(`Erro no login: ${data.error || 'Verifique suas credenciais.'}`);
                }
            } catch (error) {
                console.error('Erro de rede ou ao processar o login:', error);
                alert('Erro de conexão ao tentar fazer login. Verifique o console.');
            } finally {
                btnLogin.disabled = false;
                btnLogin.textContent = originalButtonText;
            }
        });
    }

    // --- Lógica de Registro de Usuário ---
    const formRegister = document.getElementById('formRegister');
    const tipoUsuarioSelect = document.getElementById('tipoUsuario');
    const campoDepartamentoDiv = document.getElementById('campoDepartamento');
    const departamentoAreaSelect = document.getElementById('departamentoArea');

    if (tipoUsuarioSelect && campoDepartamentoDiv) {
        tipoUsuarioSelect.addEventListener('change', function() {
            if (this.value === 'Atendente') {
                campoDepartamentoDiv.style.display = 'block';
                departamentoAreaSelect.required = true;
            } else {
                campoDepartamentoDiv.style.display = 'none';
                departamentoAreaSelect.required = false;
                departamentoAreaSelect.value = ''; // Limpa a seleção se não for Atendente
            }
        });
    }

    if (formRegister) {
        formRegister.addEventListener('submit', async (event) => {
            // console.log('formRegister: Evento de submit capturado.'); 
            event.preventDefault();
            // console.log('formRegister: event.preventDefault() chamado.');

            const formData = new FormData(formRegister);
            const userData = {};
            formData.forEach((value, key) => {
                userData[key] = value;
            });

            if (userData.tipo !== 'Atendente') {
                delete userData.departamento_area;
            }

            const btnRegister = document.getElementById('btnRegister');
            const originalButtonText = btnRegister.textContent;
            btnRegister.disabled = true;
            btnRegister.textContent = 'Registrando...';

            try {
                const response = await fetch('http://localhost:3001/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });
                const data = await response.json();

                if (response.ok) {
                    alert('Usuário registrado com sucesso! Faça login para continuar.');
                    window.location.href = 'sign_in.html';
                } else {
                    alert(`Erro no registro: ${data.error || 'Ocorreu um problema.'}`);
                }
            } catch (error) {
                console.error('Erro de rede ou ao processar o registro:', error);
                alert('Erro de conexão ao tentar registrar. Verifique o console.');
            } finally {
                btnRegister.disabled = false;
                btnRegister.textContent = originalButtonText;
            }
        });
    }

    // --- Funções de Proteção de Página ---
    function protegerPaginaTicket() {
        // Verifica se estamos na página ticket.html e se o usuário não está logado
        if (window.location.pathname.endsWith('ticket.html')) {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Você precisa estar logado para acessar esta página.');
                window.location.href = 'sign_in.html';
            }
        }
    }

    // Executar ao carregar a página
    protegerPaginaTicket(); // Protege a página de tickets se necessário
});