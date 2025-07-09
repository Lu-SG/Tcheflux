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

    function calcularSLA(ticket) {
        const slaHorasDefinido = 48; // SLA de 48 horas corridas
        const agora = new Date();
        const dataInicio = new Date(ticket.datainicio);
        let textoSLA = 'N/A';
        let classeCorSLA = 'text-muted'; // Default
    
        const msEmUmaHora = 60 * 60 * 1000;
        const slaMs = slaHorasDefinido * msEmUmaHora;
        const dataLimiteSLA = new Date(dataInicio.getTime() + slaMs);

        if (ticket.status === 'Aberto' || ticket.status === 'Em Andamento') {
            const tempoRestanteMs = dataLimiteSLA - agora;
            
            if (tempoRestanteMs <= 0) {
                const tempoAtrasoMs = Math.abs(tempoRestanteMs);
                const horasAtraso = Math.floor(tempoAtrasoMs / msEmUmaHora);
                const minutosAtraso = Math.floor((tempoAtrasoMs % msEmUmaHora) / (60 * 1000));
                textoSLA = `Atrasado (${horasAtraso}h ${minutosAtraso}m)`;
                classeCorSLA = 'text-danger fw-bold';
            } else {
                const horasRestantes = Math.floor(tempoRestanteMs / msEmUmaHora);
                const minutosRestantes = Math.floor((tempoRestanteMs % msEmUmaHora) / (60 * 1000));
                textoSLA = `Restam: ${horasRestantes}h ${minutosRestantes}m`;
                classeCorSLA = tempoRestanteMs < (slaMs / 4) ? 'text-warning' : 'text-success'; // Menos de 25% do tempo SLA = warning
            }
        } else if (ticket.status === 'Resolvido' || ticket.status === 'Fechado') {
            // Usa dataatualizacao como data de fechamento. Se nula, usa data de início (resultando em tempo 0 se não houve atualização)
            const dataFim = ticket.dataatualizacao ? new Date(ticket.dataatualizacao) : dataInicio;
            const tempoGastoMs = dataFim - dataInicio;
            const horasGastas = Math.floor(tempoGastoMs / msEmUmaHora);
            const minutosGastos = Math.floor((tempoGastoMs % msEmUmaHora) / (60 * 1000));

            textoSLA = `Resolvido em: ${horasGastas}h ${minutosGastos}m`;
            classeCorSLA = tempoGastoMs > slaMs ? 'text-danger' : 'text-primary'; // Se estourou SLA, fica vermelho
        } else if (ticket.status === 'Pendente Cliente') {
            textoSLA = 'Pausado (Aguardando Ação)';
            classeCorSLA = 'text-info';
        }

        return `<span class="${classeCorSLA}">${textoSLA}</span>`;
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
                    let errorMessageFromServer = `Erro ${response.status}: ${response.statusText}`;
                    try {
                        // Tenta ler o corpo da resposta como texto primeiro
                        const errorText = await response.text();
                        // Tenta analisar o texto como JSON
                        const errData = JSON.parse(errorText);
                        errorMessageFromServer = errData.error || errorMessageFromServer;
                    } catch (e) {
                        // Se falhar ao analisar como JSON, o erro original (status + statusText) já é um bom fallback.
                        console.warn("Não foi possível analisar a resposta de erro como JSON. Status:", response.status, response.statusText);
                    }
                    throw new Error(errorMessageFromServer);
                }
                return;
            }

            const tickets = await response.json();
            if (tickets.length === 0) {
                container.innerHTML = '<p>Não há tickets atribuídos a você no momento.</p>';
                return;
            }

            let listHtml = '';
            tickets.forEach(ticket => {
                const slaInfo = calcularSLA(ticket);
                const linkTicket = `visualizar_ticket.html?nro=${ticket.nro}`;
                listHtml += `
                    <a href="${linkTicket}" class="list-group-item list-group-item-action mb-2">
                        <div class="d-flex w-100 justify-content-between">
                            <h5 class="mb-1">#${ticket.nro} - ${ticket.titulo}</h5>
                            <small>Data: ${new Date(ticket.datainicio).toLocaleString('pt-BR')}</small>
                        </div>
                        <p class="mb-1">Status: ${getDisplayStatus(ticket.status)} | Depto: ${ticket.departamento_area}</p>
                        <small>SLA: ${slaInfo}</small>
                    </a>
                `;
            });
            container.innerHTML = listHtml;


        } catch (error) {
            console.error('Erro ao carregar meus tickets:', error);
            container.innerHTML = `<p class="text-danger">Erro ao carregar seus tickets: ${error.message}</p>`;
        }
    }
    async function carregarTicketsAtendente() {
        const container = document.getElementById('listaTicketsAtendente');
        if (!container) return;

        const token = localStorage.getItem('token');
        if (!token) {
            container.innerHTML = '<p class="text-danger">Você precisa estar logado para ver seus tickets. <a href="sign_in.html">Faça login</a>.</p>';
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/api/tickets/ticket-atendente', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 401) {
                     container.innerHTML = '<p class="text-danger">Sua sessão expirou. <a href="sign_in.html">Faça login novamente</a>.</p>';
                     localStorage.removeItem('token');
                     localStorage.removeItem('usuario');
                } else {
                    let errorMessageFromServer = `Erro ${response.status}: ${response.statusText}`;
                    try {
                        // Tenta ler o corpo da resposta como texto primeiro
                        const errorText = await response.text();
                        // Tenta analisar o texto como JSON
                        const errData = JSON.parse(errorText);
                        errorMessageFromServer = errData.error || errorMessageFromServer;
                    } catch (e) {
                        // Se falhar ao analisar como JSON, o erro original (status + statusText) já é um bom fallback.
                        console.warn("Não foi possível analisar a resposta de erro como JSON. Status:", response.status, response.statusText);
                    }
                    throw new Error(errorMessageFromServer);
                }
                return;
            }

            const tickets = await response.json();
            if (tickets.length === 0) {
                container.innerHTML = '<p>Você ainda não registrou nenhum ticket.</p>';
                return;
            }

            let listHtml = '';
            tickets.forEach(ticket => {
                const slaInfo = calcularSLA(ticket);
                const linkTicket = `visualizar_ticket.html?nro=${ticket.nro}`;
                listHtml += `
                     <a href="${linkTicket}" class="list-group-item list-group-item-action mb-2">
                        <div class="d-flex w-100 justify-content-between">
                            <h5 class="mb-1">#${ticket.nro} - ${ticket.titulo}</h5>
                            <small>Data: ${new Date(ticket.datainicio).toLocaleString('pt-BR')}</small>
                        </div>
                        <p class="mb-1">Status: ${getDisplayStatus(ticket.status)}</p>
                        <small>SLA: ${slaInfo}</small>
                    </a>
                `;
            });
            container.innerHTML = listHtml;

        } catch (error) {
            console.error('Erro ao carregar tickets do atendente:', error);
            container.innerHTML = `<p class="text-danger">Erro ao carregar seus tickets atribuídos: ${error.message}</p>`;
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
                    let errorMessageFromServer = `Erro ${response.status}: ${response.statusText}`;
                    try {
                        // Tenta ler o corpo da resposta como texto primeiro
                        const errorText = await response.text();
                        // Tenta analisar o texto como JSON
                        const errData = JSON.parse(errorText);
                        errorMessageFromServer = errData.error || errorMessageFromServer;
                    } catch (e) {
                        console.warn("Não foi possível analisar a resposta de erro do departamento como JSON. Status:", response.status, response.statusText);
                    }
                    throw new Error(errorMessageFromServer);
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
            let listHtml = '';
            tickets.forEach(ticket => {
                const slaInfo = calcularSLA(ticket);
                const linkTicket = `visualizar_ticket.html?nro=${ticket.nro}`;
                listHtml += `
                    <div class="list-group-item mb-2">
                        <div class="d-flex w-100 justify-content-between">
                            <a href="${linkTicket}" class="text-decoration-none text-dark flex-grow-1">
                                <h5 class="mb-1">#${ticket.nro} - ${ticket.titulo}</h5>
                            </a>
                            <button type="button" class="btn btn-success btn-sm btn-assumir-ticket ms-2" data-nro-ticket="${ticket.nro}" style="${ticket.status !== 'Aberto' ? 'display:none;' : ''}">Assumir</button>
                        </div>
                        <p class="mb-1">Solicitante: ${ticket.solicitante_nome} | Status: ${getDisplayStatus(ticket.status)}</p>
                        <small>Data: ${new Date(ticket.datainicio).toLocaleString('pt-BR')} | SLA: ${slaInfo}</small>
                    </div>
                `;
            });
            container.innerHTML = listHtml;
            adicionarEventListenersAssumirTicket(); // Adiciona os listeners aos novos botões
        } catch (error) { // TODO: Melhorar tratamento de erro aqui, como fizemos em carregarMeusTickets
            console.error('Erro ao carregar tickets do departamento:', error);
            container.innerHTML = `<p class="text-danger">Erro ao carregar tickets do departamento: ${error.message}</p>`;
        }
    }

    async function carregarDetalhesTicket() {
        const loadingMessage = document.getElementById('loadingMessage');
        const ticketDetailContainer = document.getElementById('ticketDetailContainer');
        const errorMessageDiv = document.getElementById('errorMessage');

        if (!ticketDetailContainer) return; // Só executa na página de visualização

        const params = new URLSearchParams(window.location.search);
        const nroTicket = params.get('nro');

        if (!nroTicket) {
            loadingMessage.style.display = 'none';
            errorMessageDiv.textContent = 'Número do ticket não fornecido na URL.';
            errorMessageDiv.style.display = 'block';
            return;
        }

        const token = localStorage.getItem('token');
        const usuarioLogado = JSON.parse(localStorage.getItem('usuario'));

        if (!token || !usuarioLogado) {
            loadingMessage.style.display = 'none';
            errorMessageDiv.textContent = 'Você precisa estar logado para visualizar um ticket.';
            errorMessageDiv.style.display = 'block';
            // Opcional: redirecionar para login
            // window.location.href = 'sign_in.html';
            return;
        }

        try {
            const response = await fetch(`http://localhost:3001/api/tickets/${nroTicket}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                let errorMsg = `Erro ao carregar o ticket: ${response.status}`;
                try {
                    const errData = await response.json();
                    errorMsg = errData.error || errorMsg;
                } catch (e) { /* ignore json parse error */ }
                
                if (response.status === 401 || response.status === 403) {
                    errorMsg = 'Acesso negado ou sessão expirada. Faça login novamente.';
                    localStorage.removeItem('token');
                    localStorage.removeItem('usuario');
                }
                throw new Error(errorMsg);
            }

            const ticket = await response.json();

            // Preencher detalhes do ticket
            document.getElementById('ticketNroDetalhe').textContent = ticket.nro;
            document.getElementById('ticketTituloPrincipal').textContent = `Ticket #${ticket.nro} - ${ticket.titulo}`;
            
            const statusSpan = document.getElementById('ticketStatus');
            statusSpan.textContent = getDisplayStatus(ticket.status); // Usa a função para traduzir o status
            statusSpan.className = `badge bg-${getStatusColor(ticket.status)}`; // Função auxiliar para cor do status

            document.getElementById('ticketSolicitante').textContent = `${ticket.solicitante_nome} (${ticket.solicitante_email})`;
            document.getElementById('ticketDepartamento').textContent = ticket.departamento_area || 'N/A';
            document.getElementById('ticketAtendente').textContent = ticket.atendente_nome ? `${ticket.atendente_nome} (${ticket.atendente_email})` : 'Não atribuído';
            document.getElementById('ticketDataInicio').textContent = new Date(ticket.datainicio).toLocaleString('pt-BR');
            document.getElementById('ticketDataAtualizacao').textContent = ticket.dataatualizacao ? new Date(ticket.dataatualizacao).toLocaleString('pt-BR') : 'Nenhuma';
            document.getElementById('ticketSLA').innerHTML = calcularSLA(ticket);
            document.getElementById('ticketDescricaoHistorico').textContent = ticket.descricao || 'Nenhuma descrição ou histórico informado.';

            // Controlar visibilidade das ações
            const areaInteracao = document.getElementById('areaInteracao');
            const acoesAtendenteDiv = document.getElementById('acoesAtendente');
            const acoesSolicitanteDiv = document.getElementById('acoesSolicitante');
            const btnAprovar = document.getElementById('btnAprovarTicket');
            const btnReprovar = document.getElementById('btnReprovarTicket');

            if (usuarioLogado.tipo === 'Atendente') {
                acoesAtendenteDiv.style.display = 'block';
                acoesSolicitanteDiv.style.display = 'none';
            } else if (usuarioLogado.id === ticket.idsolicitante) { // É o solicitante do ticket
                acoesAtendenteDiv.style.display = 'none';
                acoesSolicitanteDiv.style.display = 'block';
                if (ticket.status === 'Resolvido') {
                    btnAprovar.style.display = 'inline-block';
                    btnReprovar.style.display = 'inline-block';
                } else {
                    btnAprovar.style.display = 'none';
                    btnReprovar.style.display = 'none';
                }
            } else { // Outro usuário que não é atendente nem o solicitante (não deveria ter acesso total)
                areaInteracao.style.display = 'none'; // Esconde toda a área de interação
            }

            loadingMessage.style.display = 'none';
            ticketDetailContainer.style.display = 'block';

            // Adicionar event listener para o formulário de comentário
            const formAdicionarComentario = document.getElementById('formAdicionarComentario');
            if (formAdicionarComentario) {
                formAdicionarComentario.addEventListener('submit', (event) => handleAdicionarComentario(event, ticket.nro));
            }
            // Adicionar event listener para o novo botão de enviar para revisão (Atendente)
            const btnEnviarRevisao = document.getElementById('btnEnviarRevisao');
            if (btnEnviarRevisao && usuarioLogado.tipo === 'Atendente') {
                btnEnviarRevisao.addEventListener('click', () => handleEnviarParaRevisao(ticket.nro));
            }

            // Adicionar event listeners para os botões do solicitante
            if (btnAprovar && usuarioLogado.id === ticket.idsolicitante) {
                btnAprovar.addEventListener('click', () => handleAprovarTicket(ticket.nro));
            }

            if (btnReprovar && usuarioLogado.id === ticket.idsolicitante) {
                // O status enviado será 'Pendente Cliente'
                btnReprovar.addEventListener('click', () => handleReprovarTicket(ticket.nro));
            }

        } catch (error) {
            loadingMessage.style.display = 'none';
            errorMessageDiv.textContent = error.message;
            errorMessageDiv.style.display = 'block';
            console.error('Erro ao carregar detalhes do ticket:', error);
        }
    }

    async function handleAdicionarComentario(event, nroTicket) {
        event.preventDefault();
        const textareaComentario = document.getElementById('novoComentario');
        const novoComentario = textareaComentario.value.trim();

        if (!novoComentario) {
            alert('Por favor, digite um comentário.');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert('Sua sessão expirou. Faça login novamente.');
            window.location.href = 'sign_in.html';
            return;
        }
 
        const submitButton = event.target.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';

        try {
            const response = await fetch(`http://localhost:3001/api/tickets/${nroTicket}/comentario`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ novoComentario })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro ${response.status} ao adicionar comentário.`);
            }

            const ticketAtualizado = await response.json();
            // Atualizar a UI com o novo histórico e data de atualização
            document.getElementById('ticketDescricaoHistorico').textContent = ticketAtualizado.descricao;
            document.getElementById('ticketDataAtualizacao').textContent = new Date(ticketAtualizado.dataatualizacao).toLocaleString('pt-BR');
            document.getElementById('ticketSLA').innerHTML = calcularSLA(ticketAtualizado); // Recalcular SLA
            textareaComentario.value = ''; // Limpar o campo de comentário
            alert('Comentário adicionado com sucesso!');

        } catch (error) {
            console.error('Erro ao adicionar comentário:', error);
            alert(`Erro ao adicionar comentário: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    }

    async function handleEnviarParaRevisao(nroTicket) {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Sua sessão expirou. Faça login novamente.');
            window.location.href = 'sign_in.html';
            return;
        }
        
        const botao = document.getElementById('btnEnviarRevisao');
        const originalButtonText = botao.textContent;
        botao.disabled = true;
        botao.textContent = 'Enviando...';

        try {
            // O status é fixo: "Resolvido"
            const bodyPayload = { novoStatus: 'Resolvido' };
            
            const fetchUrl = `http://localhost:3001/api/tickets/${nroTicket}/status`;
            const fetchOptions = {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bodyPayload)
            };

            const response = await fetch(fetchUrl, fetchOptions);

            if (!response.ok) {
                const responseText = await response.text();
                let errorMsg = `Erro ${response.status} ao atualizar status.`;
                try {
                    const errorData = JSON.parse(responseText);
                    errorMsg = errorData.error || errorMsg;
                } catch (e) {
                    console.warn("Não foi possível analisar a resposta de erro como JSON (enviar para revisão).");
                }
                throw new Error(errorMsg);
            }

            const ticketAtualizado = await response.json();
            // Atualizar a UI
            document.getElementById('ticketStatus').textContent = ticketAtualizado.status;
            document.getElementById('ticketStatus').className = `badge bg-${getStatusColor(ticketAtualizado.status)}`;
            document.getElementById('ticketDataAtualizacao').textContent = new Date(ticketAtualizado.dataatualizacao).toLocaleString('pt-BR');
            document.getElementById('ticketSLA').innerHTML = calcularSLA(ticketAtualizado);
            if (ticketAtualizado.descricao && ticketAtualizado.descricao !== document.getElementById('ticketDescricaoHistorico').textContent) {
                document.getElementById('ticketDescricaoHistorico').textContent = ticketAtualizado.descricao;
            }
            alert('Status do ticket atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            alert(`Erro ao atualizar status: ${error.message}`);
        } finally {
            botao.disabled = false;
            botao.textContent = originalButtonText;
        }
    }

    async function handleAprovarTicket(nroTicket) {
        if (!confirm('Tem certeza que deseja aprovar a solução e fechar este ticket? Esta ação não pode ser desfeita.')) {
            return;
        }
        await atualizarStatusSolicitante(nroTicket, 'Fechado', document.getElementById('btnAprovarTicket'));
    }

    async function handleReprovarTicket(nroTicket) {
        if (!confirm('Tem certeza que deseja reprovar a solução e reabrir o ticket para o atendente?')) {
            return;
        }
        // Conforme solicitado, o status enviado ao backend é 'Pendente Cliente'
        await atualizarStatusSolicitante(nroTicket, 'Pendente Cliente', document.getElementById('btnReprovarTicket'));
    }

    async function atualizarStatusSolicitante(nroTicket, novoStatus, botao) {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Sua sessão expirou. Faça login novamente.');
            window.location.href = 'sign_in.html';
            return;
        }

        const originalButtonText = botao.textContent;
        botao.disabled = true;
        botao.textContent = 'Processando...';

        // Desabilitar o outro botão também para evitar cliques duplos
        const outroBotaoId = botao.id === 'btnAprovarTicket' ? 'btnReprovarTicket' : 'btnAprovarTicket';
        const outroBotao = document.getElementById(outroBotaoId);
        if (outroBotao) outroBotao.disabled = true;

        try {
            const response = await fetch(`http://localhost:3001/api/tickets/${nroTicket}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ novoStatus })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro ${response.status} ao processar a ação.`);
            }

            const ticketAtualizado = await response.json();
            
            // Atualizar a UI
            const statusSpan = document.getElementById('ticketStatus');
            
            if (novoStatus === 'Pendente Cliente') {
                // Lógica especial para 'Reprovar'
                statusSpan.textContent = 'Reprovado (Aguardando Atendente)';
                statusSpan.className = 'badge bg-danger'; // Vermelho para reprovado
                alert('Solução reprovada. O ticket foi reaberto para o atendente.');
            } else {
                // Lógica para 'Aprovar'
                statusSpan.textContent = ticketAtualizado.status;
                statusSpan.className = `badge bg-${getStatusColor(ticketAtualizado.status)}`;
                alert('Ticket aprovado e fechado com sucesso!');
            }

            document.getElementById('ticketDataAtualizacao').textContent = new Date(ticketAtualizado.dataatualizacao).toLocaleString('pt-BR');
            document.getElementById('ticketSLA').innerHTML = calcularSLA(ticketAtualizado);

            // Esconder os botões de ação do solicitante após a ação
            document.getElementById('btnAprovarTicket').style.display = 'none';
            document.getElementById('btnReprovarTicket').style.display = 'none';

        } catch (error) {
            console.error('Erro ao processar ação do solicitante:', error);
            alert(`Erro: ${error.message}`);
            // Reabilitar botões em caso de erro
            botao.disabled = false;
            botao.textContent = originalButtonText;
            if (outroBotao) outroBotao.disabled = false;
        }
    }

    function getDisplayStatus(status) {
        if (status === 'Pendente Cliente') {
            return 'Reprovado (Aguardando Atendente)';
        }
        return status;
    }

    function getStatusColor(status) {
        switch (status) {
            case 'Aberto': return 'primary';
            case 'Em Andamento': return 'info';
            case 'Resolvido': return 'success';
            case 'Fechado': return 'secondary';
            case 'Aguardando Resposta': return 'warning';
            case 'Pendente Cliente': return 'danger'; // Cor para o status real
            default: return 'light';
        }
    }

    // --- Funções de Proteção de Página e Atualização da UI ---
    function protegerPaginas() {
        const path = window.location.pathname;
        // Verifica se estamos em páginas que exigem login
        if (path.endsWith('ticket.html') || path.endsWith('meus_tickets.html') || path.endsWith('ticket_departamento.html') || path.endsWith('visualizar_ticket.html')) {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Você precisa estar logado para acessar esta página.');
                window.location.href = 'sign_in.html';
            }
        }
    }
    
    function handleLogoff() {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        alert('Você foi desconectado.'); // Mensagem opcional
        window.location.href = 'sign_in.html';
        // A página será recarregada ao redirecionar, então atualizarNavbar() será chamada automaticamente no carregamento da nova página.
    }

    function adicionarEventListenersAssumirTicket() {
        const botoesAssumir = document.querySelectorAll('.btn-assumir-ticket');
        botoesAssumir.forEach(botao => {
            botao.addEventListener('click', async function() {
                const nroTicket = this.dataset.nroTicket;
                if (confirm(`Tem certeza que deseja assumir o ticket Nº ${nroTicket}?`)) {
                    await assumirTicket(nroTicket, this);
                }
            });
        });
    }

    async function assumirTicket(nroTicket, botao) {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Sua sessão expirou. Faça login novamente.');
            window.location.href = 'sign_in.html';
            return;
        }

        botao.disabled = true;
        botao.textContent = 'Assumindo...';

        try {
            const response = await fetch(`http://localhost:3001/api/tickets/${nroTicket}/assumir`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert(`Ticket Nº ${nroTicket} assumido com sucesso!`);
                carregarTicketsDepartamento(); // Recarrega a lista para refletir a mudança
            } else {
                const errorData = await response.json();
                alert(`Erro ao assumir ticket: ${errorData.error || response.statusText}`);
                botao.disabled = false;
                botao.textContent = 'Assumir';
            }
        } catch (error) {
            console.error('Erro na requisição para assumir ticket:', error);
            alert('Erro de rede ao tentar assumir o ticket.');
            botao.disabled = false;
            botao.textContent = 'Assumir';
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
            const novoTicketLink = navbarNav.querySelector('a[href="ticket.html"]');
            let logoffNavItem = navbarNav.querySelector('#btnLogoff')?.parentElement; // Pega o <li> pai do botão de logoff

            if (token && usuarioString) {
                if (loginLink) loginLink.parentElement.style.display = 'none'; // Esconde Login
                if (registerLink) registerLink.parentElement.style.display = 'none'; // Esconde Registrar

                const usuario = JSON.parse(usuarioString);
                // Controlar visibilidade do link "Novo Ticket"
                if (novoTicketLink) {
                    if (usuario.tipo === 'Atendente') {
                        novoTicketLink.parentElement.style.display = 'none'; // Esconde para Atendente
                    } else {
                        novoTicketLink.parentElement.style.display = 'list-item'; // Mostra para outros (Solicitante)
                    }
                }

                // Adicionar botão de Logoff se não existir
                if (!logoffNavItem) {
                    const li = document.createElement('li');
                    li.className = 'nav-item';
                    
                    const btnLogoff = document.createElement('a');
                    btnLogoff.className = 'nav-link'; // Para estilização similar aos outros links da navbar
                    btnLogoff.id = 'btnLogoff';
                    btnLogoff.href = '#'; // Necessário para que seja um link, mas o comportamento padrão será prevenido
                    btnLogoff.textContent = 'Logoff';
                    btnLogoff.style.cursor = 'pointer'; // Indica que é clicável
                    
                    btnLogoff.addEventListener('click', (e) => {
                        e.preventDefault(); // Previne a navegação para '#'
                        handleLogoff();
                    });

                    li.appendChild(btnLogoff);
                    navbarNav.appendChild(li); // Adiciona o item de logoff ao final da lista de navegação
                }

            } else { // Não está logado
                 // Garantir que links de Login/Registro estejam visíveis se não logado
                if (loginLink) loginLink.parentElement.style.display = 'list-item';
                if (registerLink) registerLink.parentElement.style.display = 'list-item';
                // Mostrar "Novo Ticket" se não estiver logado (usuário pode querer ver a página antes de logar)
                if (novoTicketLink) {
                    novoTicketLink.parentElement.style.display = 'list-item';
                }
                // Remover botão de Logoff se existir
                if (logoffNavItem) {
                    logoffNavItem.remove();
                }
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
        const containerNovoTicket = document.getElementById('containerNovoTicket'); // Pega o container do card Novo Ticket
        const containerTicketsAtendente = document.getElementById('containerTicketsAtendente');
        const containerMeusTickets = document.getElementById('containerMeusTickets');

        const token = localStorage.getItem('token');
        const usuarioString = localStorage.getItem('usuario');

        if (token && usuarioString) {
            const usuario = JSON.parse(usuarioString);
            if (containerTicketsDepartamento) {
                if (usuario.tipo === 'Atendente') {
                    containerTicketsDepartamento.style.display = 'block';
                } else {
                    containerTicketsDepartamento.style.display = 'none';
                }
            }
            if (containerTicketsAtendente) {
                if (usuario.tipo === 'Atendente') {
                    containerTicketsAtendente.style.display = 'block';
                } else {
                    containerTicketsAtendente.style.display = 'none';
                }
            }
            
            if (containerNovoTicket) {
                if (usuario.tipo === 'Atendente') {
                    containerNovoTicket.style.display = 'none'; // Esconde card Novo Ticket para Atendente
                } else {
                    containerNovoTicket.style.display = 'block'; // Mostra para Solicitante
                }
            }

            if (containerMeusTickets) {
                if (usuario.tipo === 'Atendente') {
                    containerMeusTickets.style.display = 'none'; // Esconde card Novo Ticket para Atendente
                } else {
                    containerMeusTickets.style.display = 'block'; // Mostra para Solicitante
                }
            }

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
    if (window.location.pathname.endsWith('ticket_atendente.html')) {
        carregarTicketsAtendente();
    }
    if (window.location.pathname.endsWith('visualizar_ticket.html')) {
        carregarDetalhesTicket();
    }


});