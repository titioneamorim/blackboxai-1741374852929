// Classes para representar as entidades
class Usuario {
    constructor(id, nome, email, senha, tipo) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.senha = senha;
        this.tipo = tipo;
    }
}

class Turma {
    constructor(id, nome, status, criadoPor) {
        this.id = id;
        this.nome = nome;
        this.status = status;
        this.criadoPor = criadoPor;
        this.alunos = [];
    }
}

class Aluno {
    constructor(id, nome, cpf, telefone) {
        this.id = id;
        this.nome = nome;
        this.cpf = cpf;
        this.telefone = telefone;
        this.contatos = [];
    }
}

class Contato {
    constructor(id, tipo, usuario, descricao) {
        this.id = id;
        this.tipo = tipo;
        this.usuario = usuario;
        this.descricao = descricao;
        this.dataHora = new Date().toISOString();
    }
}

// Gerenciamento de dados no localStorage
const Storage = {
    get(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },
    remove(key) {
        localStorage.removeItem(key);
    }
};

// Gerenciamento de Autenticação
const Auth = {
    usuarioAtual: null,
    usuarios: Storage.get('usuarios') || [],

    inicializar() {
        const usuarioSalvo = Storage.get('usuarioAtual');
        if (usuarioSalvo) {
            this.usuarioAtual = usuarioSalvo;
            this.mostrarApp();
        } else {
            this.mostrarLogin();
        }

        // Inicializar event listeners de autenticação
        this.inicializarEventListeners();
    },

    inicializarEventListeners() {
        // Login form
        const loginForm = document.getElementById('form-login');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const senha = document.getElementById('login-senha').value;
                
                if (this.login(email, senha)) {
                    this.mostrarApp();
                } else {
                    alert('Email ou senha incorretos');
                }
            });
        }

        // Cadastro form
        const cadastroForm = document.getElementById('form-cadastro');
        if (cadastroForm) {
            cadastroForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const nome = document.getElementById('cadastro-nome').value;
                const email = document.getElementById('cadastro-email').value;
                const senha = document.getElementById('cadastro-senha').value;
                const tipo = document.getElementById('cadastro-tipo').value;
                
                if (this.cadastrar(nome, email, senha, tipo)) {
                    alert('Cadastro realizado com sucesso!');
                    this.mostrarLogin();
                }
            });
        }
    },

    cadastrar(nome, email, senha, tipo) {
        const usuarioExistente = this.usuarios.find(u => u.email === email);
        if (usuarioExistente) {
            alert('Este email já está cadastrado');
            return false;
        }

        const id = Date.now().toString();
        const usuario = new Usuario(id, nome, email, senha, tipo);
        this.usuarios.push(usuario);
        Storage.set('usuarios', this.usuarios);
        return true;
    },

    login(email, senha) {
        const usuario = this.usuarios.find(u => u.email === email && u.senha === senha);
        if (usuario) {
            this.usuarioAtual = usuario;
            Storage.set('usuarioAtual', usuario);
            return true;
        }
        return false;
    },

    logout() {
        this.usuarioAtual = null;
        Storage.remove('usuarioAtual');
        this.mostrarLogin();
    },

    temPermissao(tipo) {
        if (!this.usuarioAtual) return false;
        
        switch (this.usuarioAtual.tipo) {
            case 'admin':
                return true;
            case 'coordenador':
                return tipo !== 'admin';
            case 'professor':
                return tipo === 'professor';
            default:
                return false;
        }
    },

    mostrarLogin() {
        document.getElementById('pagina-login').classList.remove('hidden');
        document.getElementById('pagina-cadastro').classList.add('hidden');
        document.getElementById('app').classList.add('hidden');
    },

    mostrarCadastro() {
        document.getElementById('pagina-login').classList.add('hidden');
        document.getElementById('pagina-cadastro').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
    },

    mostrarApp() {
        document.getElementById('pagina-login').classList.add('hidden');
        document.getElementById('pagina-cadastro').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        document.getElementById('usuario-nome').textContent = this.usuarioAtual.nome;
        App.inicializar();
    }
};

// Aplicação Principal
const App = {
    turmas: Storage.get('turmas') || [],
    turmaAtual: null,
    alunoAtual: null,

    inicializar() {
        this.inicializarEventListeners();
        this.atualizarInterface();
    },

    inicializarEventListeners() {
        // Form de Nova/Editar Turma
        const formTurma = document.getElementById('form-turma');
        if (formTurma) {
            formTurma.addEventListener('submit', (e) => {
                e.preventDefault();
                const nome = document.getElementById('input-nome-turma').value;
                const status = document.getElementById('input-status-turma').value;
                const id = document.getElementById('turma-id').value;

                if (id) {
                    if (this.editarTurma(id, nome, status)) {
                        fecharModalTurma();
                    } else {
                        alert('Você não tem permissão para editar esta turma');
                    }
                } else {
                    this.adicionarTurma(nome, status);
                    fecharModalTurma();
                }
            });
        }

        // Form de Novo Aluno
        const formAluno = document.getElementById('form-aluno');
        if (formAluno) {
            formAluno.addEventListener('submit', (e) => {
                e.preventDefault();
                const nome = document.getElementById('input-nome-aluno').value;
                const cpf = document.getElementById('input-cpf-aluno').value;
                const telefone = document.getElementById('input-telefone-aluno').value;
                
                if (this.adicionarAluno(this.turmaAtual.id, nome, cpf, telefone)) {
                    fecharModalAluno();
                } else {
                    alert('Você não tem permissão para adicionar alunos a esta turma');
                }
            });
        }

        // Form de Novo Contato
        const formContato = document.getElementById('form-contato');
        if (formContato) {
            formContato.addEventListener('submit', (e) => {
                e.preventDefault();
                const tipo = document.getElementById('input-tipo-contato').value;
                const usuario = document.getElementById('input-usuario-contato').value;
                const descricao = document.getElementById('input-descricao-contato').value;
                
                this.adicionarContato(this.turmaAtual.id, this.alunoAtual.id, tipo, usuario, descricao);
                fecharModalContato();
            });
        }
    },

    // Métodos para Turmas
    adicionarTurma(nome, status) {
        const id = Date.now().toString();
        const turma = new Turma(id, nome, status, Auth.usuarioAtual.id);
        this.turmas.push(turma);
        this.salvarDados();
        this.atualizarInterface();
        return true;
    },

    editarTurma(id, nome, status) {
        const turma = this.turmas.find(t => t.id === id);
        if (turma && this.podeEditarTurma(turma)) {
            turma.nome = nome;
            turma.status = status;
            this.salvarDados();
            this.atualizarInterface();
            return true;
        }
        return false;
    },

    removerTurma(id) {
        const turma = this.turmas.find(t => t.id === id);
        if (turma && this.podeEditarTurma(turma)) {
            this.turmas = this.turmas.filter(t => t.id !== id);
            this.salvarDados();
            this.atualizarInterface();
            return true;
        }
        return false;
    },

    podeEditarTurma(turma) {
        return Auth.temPermissao('admin') || 
               (Auth.temPermissao('coordenador')) ||
               (Auth.temPermissao('professor') && turma.criadoPor === Auth.usuarioAtual.id);
    },

    // Métodos para Alunos
    adicionarAluno(turmaId, nome, cpf, telefone) {
        const turma = this.turmas.find(t => t.id === turmaId);
        if (turma && this.podeEditarTurma(turma)) {
            const id = Date.now().toString();
            const aluno = new Aluno(id, nome, cpf, telefone);
            turma.alunos.push(aluno);
            this.salvarDados();
            this.atualizarInterface();
            return true;
        }
        return false;
    },

    editarAluno(turmaId, alunoId, nome, cpf, telefone) {
        const turma = this.turmas.find(t => t.id === turmaId);
        if (turma && this.podeEditarTurma(turma)) {
            const aluno = turma.alunos.find(a => a.id === alunoId);
            if (aluno) {
                aluno.nome = nome;
                aluno.cpf = cpf;
                aluno.telefone = telefone;
                this.salvarDados();
                this.atualizarInterface();
                return true;
            }
        }
        return false;
    },

    removerAluno(turmaId, alunoId) {
        const turma = this.turmas.find(t => t.id === turmaId);
        if (turma && this.podeEditarTurma(turma)) {
            turma.alunos = turma.alunos.filter(a => a.id !== alunoId);
            this.salvarDados();
            this.atualizarInterface();
            return true;
        }
        return false;
    },

    // Métodos para Contatos
    adicionarContato(turmaId, alunoId, tipo, usuario, descricao) {
        const turma = this.turmas.find(t => t.id === turmaId);
        if (turma) {
            const aluno = turma.alunos.find(a => a.id === alunoId);
            if (aluno) {
                const id = Date.now().toString();
                const contato = new Contato(id, tipo, usuario, descricao);
                aluno.contatos.push(contato);
                this.salvarDados();
                this.atualizarInterface();
                return true;
            }
        }
        return false;
    },

    // Persistência de dados
    salvarDados() {
        Storage.set('turmas', this.turmas);
    },

    // Navegação
    mostrarPaginaTurmas() {
        document.getElementById('pagina-turmas').classList.remove('hidden');
        document.getElementById('pagina-turma').classList.add('hidden');
        document.getElementById('pagina-aluno').classList.add('hidden');
        this.turmaAtual = null;
        this.alunoAtual = null;
        this.atualizarListaTurmas();
    },

    mostrarPaginaTurma(turmaId) {
        this.turmaAtual = this.turmas.find(t => t.id === turmaId);
        if (this.turmaAtual) {
            document.getElementById('pagina-turmas').classList.add('hidden');
            document.getElementById('pagina-turma').classList.remove('hidden');
            document.getElementById('pagina-aluno').classList.add('hidden');
            this.atualizarDetalhesTurma();
        }
    },

    mostrarPaginaAluno(turmaId, alunoId) {
        const turma = this.turmas.find(t => t.id === turmaId);
        if (turma) {
            this.turmaAtual = turma;
            this.alunoAtual = turma.alunos.find(a => a.id === alunoId);
            if (this.alunoAtual) {
                document.getElementById('pagina-turmas').classList.add('hidden');
                document.getElementById('pagina-turma').classList.add('hidden');
                document.getElementById('pagina-aluno').classList.remove('hidden');
                this.atualizarDetalhesAluno();
            }
        }
    },

    // Atualização da interface
    atualizarInterface() {
        if (this.alunoAtual) {
            this.atualizarDetalhesAluno();
        } else if (this.turmaAtual) {
            this.atualizarDetalhesTurma();
        } else {
            this.atualizarListaTurmas();
        }
    },

    atualizarListaTurmas() {
        const listaTurmas = document.getElementById('lista-turmas');
        listaTurmas.innerHTML = '';

        this.turmas.forEach(turma => {
            const podeEditar = this.podeEditarTurma(turma);
            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <h2 class="text-xl font-semibold">${turma.nome}</h2>
                    <span class="px-2 py-1 text-sm rounded ${
                        turma.status === 'ativa' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }">${turma.status}</span>
                </div>
                <p class="text-gray-600 mb-4">${turma.alunos.length} alunos</p>
                <div class="flex justify-between items-center">
                    <button onclick="App.mostrarPaginaTurma('${turma.id}')" 
                            class="text-blue-500 hover:text-blue-700">
                        Ver detalhes
                    </button>
                    ${podeEditar ? `
                        <button onclick="App.removerTurma('${turma.id}')" 
                                class="text-red-500 hover:text-red-700">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            `;
            listaTurmas.appendChild(card);
        });
    },

    atualizarDetalhesTurma() {
        if (!this.turmaAtual) return;

        const podeEditar = this.podeEditarTurma(this.turmaAtual);
        
        document.getElementById('titulo-turma').textContent = 'Turma: ' + this.turmaAtual.nome;
        document.getElementById('nome-turma').textContent = this.turmaAtual.nome;
        document.getElementById('status-turma').textContent = 'Status: ' + this.turmaAtual.status;

        // Mostrar/ocultar botões de edição baseado nas permissões
        const btnEditarTurma = document.querySelector('button[onclick="editarTurma()"]');
        const btnNovoAluno = document.querySelector('button[onclick="abrirModalAluno()"]');
        if (btnEditarTurma) btnEditarTurma.style.display = podeEditar ? '' : 'none';
        if (btnNovoAluno) btnNovoAluno.style.display = podeEditar ? '' : 'none';

        const listaAlunos = document.getElementById('lista-alunos');
        listaAlunos.innerHTML = '';

        this.turmaAtual.alunos.forEach(aluno => {
            const card = document.createElement('div');
            card.className = 'bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer';
            card.onclick = () => this.mostrarPaginaAluno(this.turmaAtual.id, aluno.id);
            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-medium">${aluno.nome}</h3>
                        <p class="text-sm text-gray-600">CPF: ${aluno.cpf}</p>
                        <p class="text-sm text-gray-600">Tel: ${aluno.telefone}</p>
                    </div>
                    <span class="text-sm text-gray-500">${aluno.contatos.length} contatos</span>
                </div>
            `;
            listaAlunos.appendChild(card);
        });
    },

    atualizarDetalhesAluno() {
        if (!this.alunoAtual) return;

        const podeEditar = this.podeEditarTurma(this.turmaAtual);

        document.getElementById('titulo-aluno').textContent = this.alunoAtual.nome;
        document.getElementById('nome-aluno').textContent = this.alunoAtual.nome;
        document.getElementById('info-aluno').textContent = `CPF: ${this.alunoAtual.cpf} | Tel: ${this.alunoAtual.telefone}`;

        // Mostrar/ocultar botões de edição baseado nas permissões
        const btnEditarAluno = document.querySelector('button[onclick="editarAluno()"]');
        if (btnEditarAluno) btnEditarAluno.style.display = podeEditar ? '' : 'none';

        const listaContatos = document.getElementById('lista-contatos');
        listaContatos.innerHTML = '';

        this.alunoAtual.contatos.forEach(contato => {
            const card = document.createElement('div');
            card.className = 'bg-gray-50 rounded-lg p-4';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <span class="px-2 py-1 text-sm rounded ${this.getContatoTypeClass(contato.tipo)}">
                        ${contato.tipo}
                    </span>
                    <span class="text-sm text-gray-500">
                        ${new Date(contato.dataHora).toLocaleString()}
                    </span>
                </div>
                <p class="text-sm text-gray-600 mb-2">Por: ${contato.usuario}</p>
                <p class="text-gray-700">${contato.descricao}</p>
            `;
            listaContatos.appendChild(card);
        });
    },

    getContatoTypeClass(tipo) {
        const classes = {
            telefone: 'bg-blue-100 text-blue-800',
            email: 'bg-yellow-100 text-yellow-800',
            whatsapp: 'bg-green-100 text-green-800'
        };
        return classes[tipo] || 'bg-gray-100 text-gray-800';
    }
};

// Make functions globally available
window.mostrarLogin = () => Auth.mostrarLogin();
window.mostrarCadastro = () => Auth.mostrarCadastro();
window.logout = () => Auth.logout();
window.voltarParaTurmas = () => App.mostrarPaginaTurmas();
window.voltarParaTurma = () => {
    if (App.turmaAtual) {
        App.mostrarPaginaTurma(App.turmaAtual.id);
    }
};
window.abrirModalTurma = (turma = null) => {
    const modal = document.getElementById('modal-turma');
    const titulo = document.getElementById('titulo-modal-turma');
    const form = document.getElementById('form-turma');
    const inputId = document.getElementById('turma-id');
    const inputNome = document.getElementById('input-nome-turma');
    const inputStatus = document.getElementById('input-status-turma');

    if (turma) {
        titulo.textContent = 'Editar Turma';
        inputId.value = turma.id;
        inputNome.value = turma.nome;
        inputStatus.value = turma.status;
    } else {
        titulo.textContent = 'Nova Turma';
        form.reset();
        inputId.value = '';
    }

    modal.classList.remove('hidden');
};
window.fecharModalTurma = () => {
    document.getElementById('modal-turma').classList.add('hidden');
    document.getElementById('form-turma').reset();
};
window.editarTurma = () => {
    if (App.turmaAtual && App.podeEditarTurma(App.turmaAtual)) {
        abrirModalTurma(App.turmaAtual);
    } else {
        alert('Você não tem permissão para editar esta turma');
    }
};
window.abrirModalAluno = () => {
    document.getElementById('modal-aluno').classList.remove('hidden');
};
window.fecharModalAluno = () => {
    document.getElementById('modal-aluno').classList.add('hidden');
    document.getElementById('form-aluno').reset();
};
window.abrirModalContato = () => {
    document.getElementById('modal-contato').classList.remove('hidden');
};
window.fecharModalContato = () => {
    document.getElementById('modal-contato').classList.add('hidden');
    document.getElementById('form-contato').reset();
};
window.editarAluno = () => {
    if (App.turmaAtual && App.podeEditarTurma(App.turmaAtual)) {
        alert('Funcionalidade de edição em desenvolvimento');
    } else {
        alert('Você não tem permissão para editar este aluno');
    }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Auth.inicializar();
});
