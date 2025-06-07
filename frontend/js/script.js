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

    // --- Funções para carregar e exibir tickets ---
    async function carregarMeusTickets() {
        const container = document.getElementById('listaMeusTickets');
        if (!container) return;

        const token = localStorage.getItem('token');
        if (!token) {
            container.innerHTML = '<p class="text-danger">Você precisa estar logado para ver seus tickets. <a href="sign_in.html">Faça login</a>.</p>';
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/api/tickets/meus-tickets', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 401) {
                     container.innerHTML = '<p class="text-danger">Sua sessão expirou. <a href="sign_in.html">Faça login novamente</a>.</p>';
                     localStorage.removeItem('token');
                     localStorage.removeItem('usuario');
                } else {
                    const errData = await response.json();
                    throw new Error(errData.error || `Erro ${response.status}`);
                }
                return;
            }

            const tickets = await response.json();
            if (tickets.length === 0) {
                container.innerHTML = '<p>Você ainda não registrou nenhum ticket.</p>';
                return;
            }

            let tableHtml = '<table class="table table-striped table-hover"><thead><tr><th>Nº</th><th>Título</th><th>Status</th><th>Departamento</th><th>Data Abertura</th></tr></thead><tbody>';
            tickets.forEach(ticket => {
                tableHtml += `<tr>
                    <td>${ticket.nro}</td>
                    <td>${ticket.titulo}</td>
                    <td>${ticket.status}</td>
                    <td>${ticket.departamento_area}</td>
                    <td>${new Date(ticket.datainicio).toLocaleString('pt-BR')}</td>
                </tr>`;
            });
            tableHtml += '</tbody></table>';
            container.innerHTML = tableHtml;

        } catch (error) {
            console.error('Erro ao carregar meus tickets:', error);
            container.innerHTML = `<p class="text-danger">Erro ao carregar seus tickets: ${error.message}</p>`;
        }
    }

    async function carregarTicketsDepartamento() {
        const container = document.getElementById('listaTicketsDepartamento');
        if (!container) return;

        const token = localStorage.getItem('token');
        const usuario = JSON.parse(localStorage.getItem('usuario'));

        if (!token || !usuario) {
            container.innerHTML = '<p class="text-danger">Você precisa estar logado como atendente para ver os tickets do departamento. <a href="sign_in.html">Faça login</a>.</p>';
            return;
        }
        if (usuario.tipo !== 'Atendente') {
            container.innerHTML = '<p class="text-danger">Apenas atendentes podem visualizar esta página.</p>';
            // Opcional: redirecionar window.location.href = 'index.html';
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/api/tickets/departamento', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                 if (response.status === 401 || response.status === 403) {
                     container.innerHTML = `<p class="text-danger">Acesso negado ou sessão expirada. <a href="sign_in.html">Faça login novamente</a>.</p>`;
                     localStorage.removeItem('token');
                     localStorage.removeItem('usuario');
                } else {
                    const errData = await response.json();
                    throw new Error(errData.error || `Erro ${response.status}`);
                }
                return;
            }

            const tickets = await response.json();
            // ... (Lógica para renderizar a tabela de tickets do departamento, similar a carregarMeusTickets)
            // Exemplo simplificado:
            if (tickets.length === 0) {
                container.innerHTML = '<p>Não há tickets para este departamento no momento.</p>';
                return;
            }
            let tableHtml = '<table class="table table-striped table-hover"><thead><tr><th>Nº</th><th>Título</th><th>Status</th><th>Solicitante</th><th>Data Abertura</th></tr></thead><tbody>';
            tickets.forEach(ticket => {
                tableHtml += `<tr>
                    <td>${ticket.nro}</td>
                    <td>${ticket.titulo}</td>
                    <td>${ticket.status}</td>
                    <td>${ticket.solicitante_nome}</td>
                    <td>${new Date(ticket.datainicio).toLocaleString('pt-BR')}</td>
                </tr>`;
            });
            tableHtml += '</tbody></table>';
            container.innerHTML = tableHtml;

        } catch (error) {
            console.error('Erro ao carregar tickets do departamento:', error);
            container.innerHTML = `<p class="text-danger">Erro ao carregar tickets do departamento: ${error.message}</p>`;
        }
    }

    // --- Funções de Proteção de Página e Atualização da UI ---
    function protegerPaginas() {
        const path = window.location.pathname;
        // Verifica se estamos em páginas que exigem login
        if (path.endsWith('ticket.html') || path.endsWith('meus_tickets.html') || path.endsWith('ticket_departamento.html')) {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Você precisa estar logado para acessar esta página.');
                window.location.href = 'sign_in.html';
            }
        }
    }
    
    function atualizarNavbar() {
        const token = localStorage.getItem('token');
        const usuarioString = localStorage.getItem('usuario');
        const navbarNav = document.querySelector('#navbarSupportedContent .navbar-nav');

        if (navbarNav) {
            // Links que são sempre manipulados (visibilidade)
            const loginLink = navbarNav.querySelector('a[href="sign_in.html"]');
            const registerLink = navbarNav.querySelector('a[href="register.html"]'); // Se existir
            let deptTicketsNavLinkItem = navbarNav.querySelector('a[href="ticket_departamento.html"]')?.parentElement;

            if (token && usuarioString) {
                if (loginLink) loginLink.parentElement.style.display = 'none'; // Esconde Login
                if (registerLink) registerLink.parentElement.style.display = 'none'; // Esconde Registrar

                const usuario = JSON.parse(usuarioString);
                // Adicionar link "Tickets do Departamento" se for Atendente
                if (usuario.tipo === 'Atendente' && !navbarNav.querySelector('a[href="ticket_departamento.html"]')) {
                    const li = document.createElement('li');
                    li.className = 'nav-item';
                    li.innerHTML = `<a class="nav-link ${window.location.pathname.endsWith('ticket_departamento.html') ? 'active' : ''}" href="ticket_departamento.html">Tickets do Depto.</a>`;
                    
                    const myTicketsLink = navbarNav.querySelector('a[href="meus_tickets.html"]');
                    if (myTicketsLink) {
                        myTicketsLink.parentElement.insertAdjacentElement('afterend', li);
                    } else {
                        // Fallback: tentar inserir após "Novo Ticket"
                        const novoTicketLink = navbarNav.querySelector('a[href="ticket.html"]');
                        if (novoTicketLink) {
                            novoTicketLink.parentElement.insertAdjacentElement('afterend', li);
                        } else {
                            navbarNav.appendChild(li); // Último recurso
                        }
                    }
                    deptTicketsNavLinkItem = li; // Atualiza a referência para o item criado
                }
                // Garante que o link (existente ou recém-criado) esteja visível para Atendentes
                if (deptTicketsNavLinkItem && usuario.tipo === 'Atendente') {
                    deptTicketsNavLinkItem.style.display = 'list-item';
                } else if (deptTicketsNavLinkItem) {
                    deptTicketsNavLinkItem.style.display = 'none'; // Esconde se não for atendente
                }

            } else { // Não está logado
                 // Garantir que links de Login/Registro estejam visíveis se não logado
                if (loginLink) loginLink.parentElement.style.display = 'list-item';
                if (registerLink) registerLink.parentElement.style.display = 'list-item';
                // Esconder link de "Tickets do Departamento" se não logado
                if (deptTicketsNavLinkItem) deptTicketsNavLinkItem.style.display = 'none';
            }
        }
    }

    function atualizarPainelControleIndex() {
        // Executar apenas na página index.html
        const currentPage = window.location.pathname;
        if (!currentPage.endsWith('index.html') && currentPage !== '/' && !currentPage.endsWith('/frontend/')) { // Adicionado /frontend/ para o Live Server
            return;
        }

        const containerTicketsDepartamento = document.getElementById('containerTicketsDepartamento');
        if (!containerTicketsDepartamento) return;

        const token = localStorage.getItem('token');
        const usuarioString = localStorage.getItem('usuario');

        if (token && usuarioString) {
            const usuario = JSON.parse(usuarioString);
            if (usuario.tipo === 'Atendente') {
                containerTicketsDepartamento.style.display = 'block'; // Ou 'flex' se o .col precisar
            } else {
                containerTicketsDepartamento.style.display = 'none';
            }
        } else {
            containerTicketsDepartamento.style.display = 'none';
        }
    }

    // Executar ao carregar a página
    protegerPaginas(); 
    atualizarNavbar();
    atualizarPainelControleIndex(); // Adiciona a chamada para a nova função

    // Chamar as funções de carregamento de dados dependendo da página atual
    if (window.location.pathname.endsWith('meus_tickets.html')) {
        carregarMeusTickets();
    }
    if (window.location.pathname.endsWith('ticket_departamento.html')) {
        carregarTicketsDepartamento();
    }
});