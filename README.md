# Landing Page de Recolha de Leads — Farmácias F. da Silva Graça

Aplicação web mobile-first desenhada especificamente para stands de feiras e congressos do setor social e de saúde, direcionada a Diretores Técnicos, Provedores e Gestores de Lares de Idosos e Estruturas Residenciais para Pessoas Idosas (ERPI).

---

## 🌟 Funcionalidades Principais

- **Mobile-First & Ultrarrápida:** Otimizada para leitura imediata via QR Code no stand através do telemóvel do visitante.
- **Formulário em Formato Wizard:** 3 passos intuitivos (Instituição ➔ Responsável ➔ Contacto & Interesse) com validação dinâmica e barra de progresso.
- **Mecânica do PIN da Roleta:** Geração automática e segura de um PIN aleatório de 4 dígitos (com animação de confetes), apresentado no ecrã para o visitante mostrar à equipa do stand e rodar a roleta física.
- **Disparo de Email por SMTP:**
  - **Ao Visitante:** Email HTML responsivo com identidade institucional, destaque do PIN atribuído, resumo das mais-valias para Lares (PIM/Unidose, apoio farmacêutico) e botão direto de contacto.
  - **À Equipa Interna (opcional):** Notificação em tempo real com todos os dados da lead.
- **Base de Dados PostgreSQL:** Registo estruturado com timestamps, dados da instituição, auditoria de consentimento RGPD e índices otimizados.
- **Painel de Administração (`/admin`):**
  - Acesso protegido por utilizador e palavra-passe.
  - Tabela com pesquisa em tempo real (por instituição, nome ou PIN).
  - **Exportação para Excel / CSV** com UTF-8 BOM (abre perfeitamente no Microsoft Excel sem desformatar caracteres portugueses).
- **Segurança Avançada:**
  - Headers HTTP com Helmet (CSP, HSTS, X-Frame-Options).
  - Rate limiting inteligente (proteção contra flooding de submissões).
  - Sanitização de inputs e prevenção de injeção SQL.

---

## 🎨 Identidade Visual

Desenvolvida com base no logótipo oficial das **Farmácias F. da Silva Graça**:
- **Cor Primária:** `#A581B9` (Lilás elegante)
- **Acento / Hover:** `#825F96`
- **Fundo Suave:** `#FBF9FC` / `#FFFFFF`
- **Tipografia:** Sóbria, limpa e legível sob luz de feira.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 20+ instalado
- PostgreSQL (opcional para testes do frontend; o sistema avisa se a BD não estiver ligada)

### Passos:
1. Instalar as dependências:
   ```bash
   npm install
   ```

2. Configurar o ficheiro de ambiente:
   ```bash
   cp .env.example .env
   ```

3. Iniciar a aplicação:
   ```bash
   npm start
   # ou em modo de desenvolvimento com recarregamento automático:
   npm run dev
   ```

4. Aceder no navegador:
   - **Formulário do Visitante:** [http://localhost:3000](http://localhost:3000)
   - **Painel de Gestão:** [http://localhost:3000/admin](http://localhost:3000/admin)
     *(Credenciais padrão: utilizador `admin` / palavra-passe `FarmaciaFeira2026!`)*

---

## ☁️ Deploy no Coolify (VPS Oracle Cloud)

A aplicação inclui `Dockerfile` multi-stage e `docker-compose.yml` prontos para deploy automático no Coolify.

### Método Recomendado no Coolify:

1. No Coolify, crie um **Novo Projeto / Recurso** ➔ Selecione **Docker Compose**.
2. Aponte para o repositório Git deste projeto ou cole o conteúdo do `docker-compose.yml`.
3. Defina as seguintes **Variáveis de Ambiente** no painel do Coolify:
   - `PORT=3000`
   - `DB_USER=postgres`
   - `DB_PASSWORD=uma_password_forte_aqui`
   - `DB_NAME=farmacia_leads`
   - `ADMIN_USER=admin`
   - `ADMIN_PASSWORD=sua_password_admin_segura`
   - `SMTP_HOST=mail.farmaciasfsilvagraca.pt`
   - `SMTP_PORT=465` (ou 587)
   - `SMTP_SECURE=true`
   - `SMTP_USER=geral@farmaciasfsilvagraca.pt`
   - `SMTP_PASS=sua_password_smtp`
   - `SMTP_FROM="Farmácias F. da Silva Graça" <geral@farmaciasfsilvagraca.pt>`
   - `NOTIFICATION_EMAIL=comercial@farmaciasfsilvagraca.pt`
4. No campo **Domains**, configure o seu domínio ou subdomínio (ex: `https://feira.farmaciasfsilvagraca.pt`). O Coolify gera o certificado SSL (Let's Encrypt) automaticamente.
5. Clique em **Deploy**.

---

## 📁 Estrutura do Projeto

```
formulario/
├── public/
│   ├── css/
│   │   └── style.css            # Estilos customizados e paleta de cores
│   ├── images/
│   │   └── logo.png             # Logótipo Farmácias F. da Silva Graça
│   ├── admin.html               # Interface de gestão e exportação CSV
│   └── index.html               # Landing page mobile com wizard e PIN
├── src/
│   ├── routes/
│   │   ├── admin.js             # Rotas protegidas (/admin, /admin/export-csv)
│   │   └── api.js               # Validação, geração de PIN e submissão
│   ├── db.js                    # Conexão PostgreSQL pool e migração automática
│   ├── mailer.js                # Templates HTML e envio por SMTP (Nodemailer)
│   └── server.js                # Configuração do Express, Helmet e Rate Limit
├── Dockerfile                   # Build de produção Node.js Alpine
├── docker-compose.yml           # App + PostgreSQL 16 para Coolify
├── .env.example                 # Exemplo de variáveis de ambiente
└── package.json
```

---

## 🔒 Conformidade RGPD

O formulário inclui recolha explícita de consentimento para tratamento de dados no âmbito das relações institucionais com Lares e ERPI, armazenando o endereço IP e timestamp para efeitos de auditoria.
