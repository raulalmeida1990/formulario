require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initDb } = require('./db');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de confiança em proxies reversos (Traefik / Caddy no Coolify)
app.set('trust proxy', 1);

// Segurança com Helmet (Headers HTTP)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net", // Para canvas-confetti
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Limitação de requisições gerais (Rate Limiting)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300, // Máximo de 300 pedidos por janela
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiadas requisições. Por favor tente novamente mais tarde.' },
});
app.use(globalLimiter);

// Limitação específica e mais rigorosa para o endpoint de submissão
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // Máximo de 20 submissões por IP a cada 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Limite de submissões excedido. Aguarde alguns minutos antes de tentar novamente.' },
});

// Parsers
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: true, limit: '64kb' }));

// Servir ficheiros estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Rotas da API e Painel Admin
app.use('/api/submit', submitLimiter);
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

// Fallback para a página inicial
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado na aplicação:', err);
  res.status(500).json({
    success: false,
    message: 'Ocorreu um erro interno no servidor.',
  });
});

// Iniciar servidor e inicializar base de dados
async function startServer() {
  await initDb();

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`  Farmácias F. da Silva Graça — Landing Page Feira`);
    console.log(`  Servidor ativo na porta ${PORT}`);
    console.log(`  Formulário: http://localhost:${PORT}`);
    console.log(`  Painel Admin: http://localhost:${PORT}/admin`);
    console.log(`====================================================`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('A encerrar servidor graciosamente...');
    server.close(() => {
      console.log('Servidor HTTP encerrado.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer();
