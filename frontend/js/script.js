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
                const response = await fetch('http://localhost:3001/api/tickets', { // Certifique-se que a URL e porta estão corretas
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
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

    // TODO: Adicionar lógica para verificar se o usuário já está logado ao carregar as páginas
    // TODO: Adicionar funcionalidade de Logout
    // TODO: Proteger rotas/páginas que exigem login
});