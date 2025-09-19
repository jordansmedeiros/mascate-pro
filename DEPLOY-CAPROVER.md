# Deploy no CapRover - Mascate Pro

## ✅ Projeto Preparado para CapRover

O projeto foi totalmente configurado para deployment no CapRover. Todas as referências ao Vercel foram removidas e o servidor Express está configurado para servir tanto a API quanto o frontend em produção.

## 📁 Arquivos Configurados

- ✅ `captain-definition`: Arquivo de configuração do CapRover
- ✅ `server.js`: Servidor Express configurado para produção
- ✅ `package.json`: Scripts atualizados para produção
- ❌ Removido: `api/` (Vercel Functions)
- ❌ Removido: `vercel.json`

## 🌍 Variáveis de Ambiente no CapRover

Configure as seguintes variáveis de ambiente no painel do CapRover:

### Obrigatórias
```
NODE_ENV=production
POSTGRES_USER=postgres
POSTGRES_PASSWORD=4c6c4d5fb548a9cb
POSTGRES_HOST=postgres.platform.sinesys.app
POSTGRES_PORT=15432
POSTGRES_DB=postgres
```

### Opcionais
```
PORT=80  (será definido automaticamente pelo CapRover)
```

## 🚀 Passos para Deploy

### 1. Instalar CapRover CLI (se não tiver)
```bash
npm install -g caprover
```

### 2. Fazer Login no CapRover
```bash
caprover login
```
- Insira a URL do seu CapRover
- Insira suas credenciais

### 3. Deploy da Aplicação
```bash
caprover deploy
```

### 4. Configurar Variáveis de Ambiente
1. Acesse o painel web do CapRover
2. Vá para sua aplicação
3. Aba "App Configs" → "Environment Variables"
4. Adicione todas as variáveis listadas acima

### 5. Configurar Domínio (Opcional)
1. Aba "HTTP Settings"
2. Configure seu domínio personalizado
3. Ative HTTPS se necessário

## 🔧 Como Funciona

### Desenvolvimento
- `npm run dev:full`: Executa tanto o servidor Express quanto o Vite
- API: `http://localhost:3002/api`
- Frontend: `http://localhost:5180`

### Produção
- `npm start`: Executa apenas o servidor Express
- O servidor Express serve:
  - API em `/api/*`
  - Arquivos estáticos do build em `/*`
  - SPA routing com fallback para `index.html`

## 📊 Health Check

Após o deploy, teste:
- `https://seu-dominio.com/api/health`
- Deve retornar: `{"status":"ok","message":"Express API server running"}`

## 🔑 Autenticação

Credenciais padrão:
- Email: `admin@mascate.com`
- Senha: `admin123`

## 📝 Estrutura do Projeto

```
mascate-pro/
├── captain-definition          # CapRover config
├── server.js                  # Express server
├── package.json               # Scripts e dependências
├── dist/                      # Build do frontend (gerado)
├── src/                       # Código fonte React
└── DEPLOY-CAPROVER.md         # Este arquivo
```

## 🛠️ Troubleshooting

### Build Falha
```bash
npm run build
```
Verifique se não há erros de TypeScript ou ESLint.

### Servidor não Inicia
Verifique as variáveis de ambiente, especialmente as do PostgreSQL.

### API não Conecta
Verifique se o PostgreSQL está acessível e se a porta 15432 está mapeada no Capover.

---

**✅ Projeto pronto para deploy! Execute `caprover deploy` quando estiver pronto.**