abstract class Pessoa {
    constructor(
        public id: string,
        public nome: string,
        public email: string
    ) {}

    abstract toString(): string;
}

class Livro {
    constructor(
        public isbn: string,
        public titulo: string,
        public autor: string,
        public anoPublicacao: number,
        public quantidade: number = 1,
        public emprestados: number = 0
    ) {}

    get disponivel(): boolean {
        return this.quantidade > this.emprestados;
    }

    get quantidadeDisponivel(): number {
        return this.quantidade - this.emprestados;
    }

    async emprestar(): Promise<boolean> {
        if (this.disponivel) {
            await new Promise(resolve => setTimeout(resolve, 500));
            this.emprestados++;
            return true;
        }
        return false;
    }

    async devolver(): Promise<boolean> {
        if (this.emprestados > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
            this.emprestados--;
            return true;
        }
        return false;
    }

    toString(): string {
        const status = this.disponivel ? 'Disponível' : 'Indisponível';
        return `${this.titulo} - ${this.autor} (${this.anoPublicacao}) | ${status} [${this.quantidadeDisponivel}/${this.quantidade}]`;
    }
}

class Usuario extends Pessoa {
    private livrosEmprestados: string[] = [];

    constructor(
        id: string,
        nome: string,
        email: string,
        public matricula: string
    ) {
        super(id, nome, email);
    }

    adicionarLivroEmprestado(isbn: string): void {
        this.livrosEmprestados.push(isbn);
    }

    removerLivroEmprestado(isbn: string): void {
        const index = this.livrosEmprestados.indexOf(isbn);
        if (index > -1) {
            this.livrosEmprestados.splice(index, 1);
        }
    }

    get totalLivrosEmprestados(): number {
        return this.livrosEmprestados.length;
    }

    temLivroEmprestado(isbn: string): boolean {
        return this.livrosEmprestados.includes(isbn);
    }

    toString(): string {
        return `${this.nome} (${this.matricula}) - Livros: ${this.totalLivrosEmprestados}`;
    }
}

class Bibliotecario extends Pessoa {
    constructor(
        id: string,
        nome: string,
        email: string,
        public cargo: string,
        public senha: string
    ) {
        super(id, nome, email);
    }

    async autenticar(senha: string): Promise<boolean> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return this.senha === senha;
    }

    toString(): string {
        return `${this.nome} - ${this.cargo}`;
    }
}

class Emprestimo {
    public dataEmprestimo: Date;
    public dataDevolucao?: Date;

    constructor(
        public id: string,
        public usuarioId: string,
        public livroIsbn: string,
        public bibliotecarioId: string,
        public diasEmprestimo: number = 10
    ) {
        this.dataEmprestimo = new Date();
    }

    async finalizarEmprestimo(): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 200));
        this.dataDevolucao = new Date();
    }

    get estaAtivo(): boolean {
        return !this.dataDevolucao;
    }

    get diasAtraso(): number {
        if (!this.estaAtivo) return 0;
        
        const dataLimite = new Date(this.dataEmprestimo);
        dataLimite.setDate(dataLimite.getDate() + this.diasEmprestimo);
        const hoje = new Date();
        
        return Math.max(0, Math.floor((hoje.getTime() - dataLimite.getTime()) / (1000 * 60 * 60 * 24)));
    }

    toString(): string {
        const status = this.estaAtivo ? 'Ativo' : 'Finalizado';
        return `Empréstimo ${this.id} - ${status} | Atraso: ${this.diasAtraso} dias`;
    }
}

class Biblioteca {
    private livros: Map<string, Livro> = new Map();
    private usuarios: Map<string, Usuario> = new Map();
    private bibliotecarios: Map<string, Bibliotecario> = new Map();
    private emprestimos: Map<string, Emprestimo> = new Map();
    private historicoEmprestimos: Emprestimo[] = [];

    constructor(public nome: string) {}

    adicionarLivro(livro: Livro): void {
        this.livros.set(livro.isbn, livro);
        console.log(`Livro adicionado: ${livro.titulo}`);
    }

    buscarLivroPorIsbn(isbn: string): Livro | undefined {
        return this.livros.get(isbn);
    }

    buscarLivroPorTitulo(titulo: string): Livro | undefined {
        return Array.from(this.livros.values()).find(
            livro => livro.titulo.toLowerCase().includes(titulo.toLowerCase())
        );
    }

    cadastrarUsuario(usuario: Usuario): void {
        this.usuarios.set(usuario.id, usuario);
        console.log(`Usuário cadastrado: ${usuario.nome}`);
    }

    buscarUsuarioPorId(id: string): Usuario | undefined {
        return this.usuarios.get(id);
    }

    cadastrarBibliotecario(bibliotecario: Bibliotecario): void {
        this.bibliotecarios.set(bibliotecario.id, bibliotecario);
        console.log(`Bibliotecário cadastrado: ${bibliotecario.nome}`);
    }

    async realizarEmprestimo(
        usuarioId: string, 
        livroIsbn: string, 
        bibliotecarioId: string
    ): Promise<boolean> {
        console.log(`\n Iniciando empréstimo`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));

        const usuario = this.buscarUsuarioPorId(usuarioId);
        const livro = this.buscarLivroPorIsbn(livroIsbn);
        const bibliotecario = this.bibliotecarios.get(bibliotecarioId);

        if (!usuario) {
            console.log('Usuário não encontrado');
            return false;
        }

        if (!livro) {
            console.log('Livro não encontrado');
            return false;
        }

        if (!bibliotecario) {
            console.log('Bibliotecário não encontrado');
            return false;
        }

        if (usuario.totalLivrosEmprestados >= 3) {
            console.log('Usuário atingiu limite de empréstimos');
            return false;
        }

        if (!livro.disponivel) {
            console.log('Livro não disponível');
            return false;
        }

        const emprestimoSucesso = await livro.emprestar();
        if (emprestimoSucesso) {
            usuario.adicionarLivroEmprestado(livroIsbn);
            
            const emprestimo = new Emprestimo(
                `EMP-${Date.now()}`,
                usuarioId,
                livroIsbn,
                bibliotecarioId
            );
            
            this.emprestimos.set(emprestimo.id, emprestimo);
            console.log(`   Empréstimo realizado com sucesso!`);
            console.log(`   Usuário: ${usuario.nome}`);
            console.log(`   Livro: ${livro.titulo}`);
            console.log(`   Empréstimo ID: ${emprestimo.id}`);
            return true;
        }

        console.log('Falha ao realizar empréstimo');
        return false;
    }

    async realizarDevolucao(
        usuarioId: string, 
        livroIsbn: string
    ): Promise<boolean> {
        console.log(`\n Iniciando devolução`);
        
        await new Promise(resolve => setTimeout(resolve, 800));

        const usuario = this.buscarUsuarioPorId(usuarioId);
        const livro = this.buscarLivroPorIsbn(livroIsbn);

        if (!usuario) {
            console.log('Usuário não encontrado');
            return false;
        }

        if (!livro) {
            console.log('Livro não encontrado');
            return false;
        }

        if (!usuario.temLivroEmprestado(livroIsbn)) {
            console.log('Usuário não possui este livro emprestado');
            return false;
        }

        const devolucaoSucesso = await livro.devolver();
        if (devolucaoSucesso) {
            usuario.removerLivroEmprestado(livroIsbn);
            
            const emprestimo = Array.from(this.emprestimos.values()).find(
                emp => emp.usuarioId === usuarioId && 
                       emp.livroIsbn === livroIsbn && 
                       emp.estaAtivo
            );

            if (emprestimo) {
                await emprestimo.finalizarEmprestimo();
                this.emprestimos.delete(emprestimo.id);
                this.historicoEmprestimos.push(emprestimo);
                
                console.log(`    Devolução realizada com sucesso!`);
                console.log(`   Usuário: ${usuario.nome}`);
                console.log(`   Livro: ${livro.titulo}`);
                console.log(`   Atraso: ${emprestimo.diasAtraso} dias`);
                return true;
            }
        }

        console.log('Falha ao realizar devolução');
        return false;
    }

    listarLivros(): void {
        console.log(`\n ACERVO DA BIBLIOTECA "${this.nome}"`);
        console.log('='.repeat(50));
        if (this.livros.size === 0) {
            console.log('Nenhum livro cadastrado.');
            return;
        }
        this.livros.forEach(livro => {
            console.log(livro.toString());
        });
    }

    listarUsuarios(): void {
        console.log(`\n USUÁRIOS CADASTRADOS`);
        console.log('='.repeat(30));
        if (this.usuarios.size === 0) {
            console.log('Nenhum usuário cadastrado.');
            return;
        }
        this.usuarios.forEach(usuario => {
            console.log(usuario.toString());
        });
    }

    listarBibliotecarios(): void {
        console.log(`\n BIBLIOTECÁRIOS CADASTRADOS`);
        console.log('='.repeat(35));
        if (this.bibliotecarios.size === 0) {
            console.log('Nenhum bibliotecário cadastrado.');
            return;
        }
        this.bibliotecarios.forEach(bibliotecario => {
            console.log(bibliotecario.toString());
        });
    }

    listarEmprestimosAtivos(): void {
        console.log(`\n EMPRÉSTIMOS ATIVOS`);
        console.log('='.repeat(30));
        const emprestimosAtivos = Array.from(this.emprestimos.values()).filter(emp => emp.estaAtivo);
        if (emprestimosAtivos.length === 0) {
            console.log('Nenhum empréstimo ativo.');
            return;
        }
        emprestimosAtivos.forEach(emprestimo => {
            console.log(emprestimo.toString());
        });
    }

    gerarRelatorio(): void {
        console.log(`\n RELATÓRIO DA BIBLIOTECA`);
        console.log('='.repeat(40));
        console.log(`Total de livros: ${this.livros.size}`);
        console.log(`Total de usuários: ${this.usuarios.size}`);
        console.log(`Total de bibliotecários: ${this.bibliotecarios.size}`);
        console.log(`Empréstimos ativos: ${Array.from(this.emprestimos.values()).filter(emp => emp.estaAtivo).length}`);
        console.log(`Histórico de empréstimos: ${this.historicoEmprestimos.length}`);
        
        let totalDisponivel = 0;
        let totalEmprestado = 0;
        this.livros.forEach(livro => {
            totalDisponivel += livro.quantidadeDisponivel;
            totalEmprestado += livro.emprestados;
        });
        console.log(`Livros disponíveis: ${totalDisponivel}`);
        console.log(`Livros emprestados: ${totalEmprestado}`);
    }
}

async function main(): Promise<void> {
    console.log(' SISTEMA DE GERENCIAMENTO DE BIBLIOTECA');
    console.log('='.repeat(50));

    const biblioteca = new Biblioteca('Biblioteca Municipal Central');

    const livros = [
        new Livro('978-8535902775', '1984', 'George Orwell', 1949, 3),
        new Livro('978-8573261425', 'Dom Casmurro', 'Machado de Assis', 1899, 2),
        new Livro('978-8595084752', 'O Senhor dos Anéis', 'J.R.R. Tolkien', 1954, 4),
        new Livro('978-8535914846', 'Harry Potter e a Pedra Filosofal', 'J.K. Rowling', 1997, 5),
        new Livro('978-8576572003', 'O Pequeno Príncipe', 'Antoine de Saint-Exupéry', 1943, 2)
    ];

    livros.forEach(livro => biblioteca.adicionarLivro(livro));

    const usuarios = [
        new Usuario('U001', 'Giselle Silva', 'giselle.silva@gmail.com', '2024001'),
        new Usuario('U002', 'Juliana Oliveira', 'juliana.oliveira@gmail.com', '2024002'),
        new Usuario('U003', 'Marina Santos', 'marina.santos@gmail.com', '2024003')
    ];

    usuarios.forEach(usuario => biblioteca.cadastrarUsuario(usuario));

    const bibliotecarios = [
        new Bibliotecario('B001', 'Gabriel Fernandes ', 'gabrielfernandes@gmail.com', 'Bibliotecário Chefe', 'senha123'),
        new Bibliotecario('B002', 'Ana Costa', 'ana.costa@gmail.com', 'Assistente', 'senha456')
    ];

    bibliotecarios.forEach(bibliotecario => biblioteca.cadastrarBibliotecario(bibliotecario));

    console.log('\n SITUAÇÃO INICIAL:');
    biblioteca.listarLivros();
    biblioteca.listarUsuarios();
    biblioteca.listarBibliotecarios();
    biblioteca.gerarRelatorio();

    console.log('\n INICIANDO OPERAÇÕES DE EMPRÉSTIMO');
    console.log('='.repeat(40));

    console.log('\n Empréstimo 1');
    await biblioteca.realizarEmprestimo('U001', '978-8535902775', 'B001');
    
    console.log('\n Empréstimo 2');
    await biblioteca.realizarEmprestimo('U002', '978-8595084752', 'B002');
    
    console.log('\n Empréstimo 3');
    await biblioteca.realizarEmprestimo('U003', '978-8535902775', 'B001');
    
    console.log('\n Empréstimo 4');
    await biblioteca.realizarEmprestimo('U001', '978-8535902775', 'B002');

    console.log('\n Empréstimo 5');
    await biblioteca.realizarEmprestimo('U001', '978-8573261425', 'B001');
    await biblioteca.realizarEmprestimo('U001', '978-8535914846', 'B001');
    await biblioteca.realizarEmprestimo('U001', '978-8576572003', 'B001');

    console.log('\n SITUAÇÃO APÓS EMPRÉSTIMOS');
    biblioteca.listarLivros();
    biblioteca.listarEmprestimosAtivos();
    biblioteca.gerarRelatorio();

    console.log('\n Aguardando 2 segundos antes das devoluções');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n INICIANDO OPERAÇÕES DE DEVOLUÇÃO');
    console.log('='.repeat(40));

    console.log('\n Devolução 1');
    await biblioteca.realizarDevolucao('U001', '978-8535902775');
    
    console.log('\n Devolução 2');
    await biblioteca.realizarDevolucao('U002', '978-8595084752');
    
    console.log('\n Devolução 3');
    await biblioteca.realizarDevolucao('U001', '978-8576572003');

    console.log('\n Devolução 4');
    await biblioteca.realizarDevolucao('U001', '978-8573261425');
    await biblioteca.realizarDevolucao('U001', '978-8535914846');
    await biblioteca.realizarDevolucao('U003', '978-8535902775');

    console.log('\n SITUAÇÃO FINAL');
    biblioteca.gerarRelatorio();
    biblioteca.listarLivros();
    biblioteca.listarEmprestimosAtivos();

    console.log('\n SISTEMA FINALIZADO!');
}

main().catch(error => {
    console.error('Erro no sistema:', error);
});