# Deploy no Vercel - Mascate Pro

## Visão Geral

Este documento descreve como fazer deploy da aplicação Mascate Pro no Vercel, incluindo configurações necessárias e boas práticas.

## Pré-requisitos

- [ ] Conta no Vercel (https://vercel.com)
- [ ] Repositório Git (GitHub, GitLab ou Bitbucket)
- [ ] Node.js >= 18.0.0
- [ ] npm >= 9.0.0

## 1. Preparação do Projeto

### Arquivos de Configuração

O projeto já inclui os seguintes arquivos necessários para o deploy:

- `vercel.json` - Configurações específicas do Vercel
- `.nvmrc` - Versão do Node.js
- `package.json` - Scripts e engines
- `.env.example` - Variáveis de ambiente de exemplo

### Build Local (Teste)

```bash
# Limpar builds anteriores
npm run clean

# Build de produção
npm run build

# Testar localmente
npm run preview
```

## 2. Deploy via CLI do Vercel

### Instalação da CLI

```bash
npm install -g vercel
```

### Login

```bash
vercel login
```

### Deploy Inicial

```bash
# Deploy de teste
vercel

# Deploy de produção
vercel --prod
```

## 3. Deploy via GitHub/Git

### 1. Push para repositório

```bash
git add .
git commit -m "feat: prepare for production deployment"
git push origin main
```

### 2. Conectar no Vercel Dashboard

1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Clique em "New Project"
3. Conecte seu repositório Git
4. Selecione o repositório `mascate-pro`

### 3. Configurações do Projeto

#### Framework Preset
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm ci`

#### Node.js Version
- **Node.js Version**: 20.x (automaticamente detectado via .nvmrc)

## 4. Variáveis de Ambiente

Configure as seguintes variáveis no Vercel Dashboard:

### Produção
```env
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_HOST=your_postgres_host
POSTGRES_PORT=your_postgres_port
POSTGRES_DB=your_postgres_database

VITE_APP_NAME="Mascate Runeria"
VITE_APP_VERSION="1.0.0"
VITE_NODE_ENV="production"
```

### Preview (Opcional)
```env
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_HOST=your_postgres_host
POSTGRES_PORT=your_postgres_port
POSTGRES_DB=your_postgres_database

VITE_APP_NAME="Mascate Runeria (Preview)"
VITE_NODE_ENV="development"
```

## 5. Configurações Avançadas

### Headers de Segurança

Os headers já estão configurados no `vercel.json`:
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy

### Cache

Arquivos estáticos têm cache configurado para 1 ano:
- JavaScript, CSS, imagens: `max-age=31536000`
- HTML: sem cache (sempre fresh)

### Redirects

Configurado redirect de fallback para SPA:
- Todas as rotas → `index.html`
- Compatível com React Router

## 6. Scripts Úteis

```bash
# Health check completo
npm run health-check

# Build e preview local
npm run deploy:build

# Deploy direto via CLI
npm run deploy:vercel

# Limpeza de cache
npm run clean
```

## 7. Monitoramento

### Vercel Analytics

Para ativar analytics:
1. Vá para o dashboard do projeto
2. Clique na aba "Analytics"
3. Ative o Vercel Analytics

### Logs

Para ver logs em tempo real:
```bash
vercel logs [deployment-url]
```

## 8. Domínio Customizado (Opcional)

### 1. No Vercel Dashboard
1. Vá para Settings → Domains
2. Adicione seu domínio customizado
3. Configure DNS conforme instruções

### 2. SSL
O Vercel automaticamente configura SSL via Let's Encrypt.

## 9. Troubleshooting

### Build Falha

**Problema**: Erro de build com TypeScript
**Solução**: 
```bash
npm run typecheck
npm run lint:fix
```

**Problema**: Erro de dependências
**Solução**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Deploy Lento

**Problema**: Deploy demora muito
**Solução**: Verifique se node_modules não está no git
```bash
# Adicione ao .gitignore se não estiver
echo "node_modules/" >> .gitignore
```

### Erro 404 em Rotas

**Problema**: Rotas do React Router retornam 404
**Solução**: Verifique se o `vercel.json` está correto:
```json
{
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### Variáveis de Ambiente

**Problema**: Variáveis não funcionam
**Solução**: 
1. Certifique-se de que começam com `VITE_` para o frontend e sem prefixo para o backend
2. Verifique se estão definidas no Vercel Dashboard
3. Redeploy após adicionar/modificar

## 10. Performance

### Métricas Esperadas

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

### Otimizações Aplicadas

- ✅ Code splitting automático
- ✅ Tree shaking
- ✅ Minificação com Terser
- ✅ Compressão Gzip/Brotli
- ✅ Cache de assets estáticos
- ✅ Lazy loading de componentes

## 11. Segurança

### Headers Configurados

- ✅ Content Security Policy
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Referrer-Policy: strict-origin-when-cross-origin

### Boas Práticas

- ✅ Não exposição de chaves secretas
- ✅ Validação de entrada
- ✅ Sanitização de dados

## 12. Backup e Rollback

### Backup Automático

O Vercel mantém histórico de deployments:
- Acesse o dashboard → Deployments
- Todos os deploys ficam salvos
- Rollback com 1 clique

### Rollback Manual

```bash
# Via CLI
vercel --prod --confirm

# Ou promover deploy anterior no dashboard
```

## 13. Contatos e Suporte

- **Vercel Documentation**: https://vercel.com/docs
- **Status Page**: https://vercel-status.com
- **Community**: https://github.com/vercel/vercel/discussions

---

## Checklist de Deploy

- [ ] Build local funcionando
- [ ] Testes passando
- [ ] Variáveis de ambiente configuradas
- [ ] vercel.json validado
- [ ] .gitignore atualizado
- [ ] Domínio configurado (se aplicável)
- [ ] SSL ativado
- [ ] Analytics configurado (opcional)
- [ ] Performance testada
- [ ] Backup verificado
