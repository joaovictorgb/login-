const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();

// Simulação de banco de dados em memória
let usuarios = [];

// Configuração dos middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: 'chave-secreta-da-sessao',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Mudar para true em produção com HTTPS
}));

// Configuração do Handlebars como motor de visualização
const exphbs = require('express-handlebars');
app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');

// Middleware para verificar se o usuário está logado
const verificarAutenticacao = (req, res, next) => {
    if (req.session.usuario) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Rotas
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Rota de login
app.get('/login', (req, res) => {
    if (req.session.usuario) {
        res.redirect('/perfil');
    } else {
        res.render('login');
    }
});

// Rota de registro
app.get('/registro', (req, res) => {
    if (req.session.usuario) {
        res.redirect('/perfil');
    } else {
        res.render('registro');
    }
});

// API de registro
app.post('/api/sessions/registro', (req, res) => {
    const { primeiro_nome, ultimo_nome, email, idade, senha } = req.body;
    
    // Validação básica
    if (!primeiro_nome || !ultimo_nome || !email || !idade || !senha) {
        return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
    }

    // Verifica se o usuário já existe
    if (usuarios.find(usuario => usuario.email === email)) {
        return res.status(400).json({ erro: 'Usuário já cadastrado' });
    }

    // Cria novo usuário
    const novoUsuario = {
        primeiro_nome,
        ultimo_nome,
        email,
        idade,
        senha // Em um app real, a senha deve ser criptografada!
    };
    usuarios.push(novoUsuario);

    res.redirect('/login');
});

// API de login
app.post('/api/sessions/login', (req, res) => {
    const { email, senha } = req.body;
    
    // Busca usuário
    const usuario = usuarios.find(u => u.email === email && u.senha === senha);
    
    if (!usuario) {
        return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    // Cria sessão
    req.session.usuario = {
        email: usuario.email,
        primeiro_nome: usuario.primeiro_nome,
        ultimo_nome: usuario.ultimo_nome,
        idade: usuario.idade
    };

    res.redirect('/perfil');
});

// Rota do perfil (protegida)
app.get('/perfil', verificarAutenticacao, (req, res) => {
    // Mostra apenas dados não confidenciais
    const { senha, ...infoUsuario } = req.session.usuario;
    res.render('perfil', { usuario: infoUsuario });
});

// Rota de logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Inicia o servidor
const PORTA = 3005;
app.listen(PORTA, () => {
    console.log(`Servidor rodando na porta ${PORTA}`);
});