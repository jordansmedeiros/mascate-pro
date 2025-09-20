# Configuração de Conexão com Banco de Dados

## Ambientes

### Desenvolvimento (Local)

- **Host**: postgres.platform.sinesys.app (conexão remota via HTTPS)
- **Porta**: 5432
- **Banco**: postgres
- **SSL**: Habilitado (rejectUnauthorized: false para desenvolvimento)
- **Arquivo de configuração**: `.env.development`

### Produção (CapRover)

- **Host**: srv-captain--postgres (nome do container interno)
- **Porta**: 5432
- **Banco**: postgres
- **SSL**: Desabilitado (conexão interna entre containers)
- **Arquivo de configuração**: `.env.production`

## Como usar

### Desenvolvimento local:

```bash
# Carrega automaticamente .env.development
npm run dev:full

# Ou rodar servidor apenas
npm run server:dev
```

### Produção:

```bash
# Carrega automaticamente .env.production
NODE_ENV=production npm start

# Ou com script específico
npm run start:prod
```

## Estrutura dos arquivos .env

### .env.development

```env
NODE_ENV=development
POSTGRES_HOST=postgres.platform.sinesys.app
POSTGRES_SSL=true
# ... outras configs
```

### .env.production

```env
NODE_ENV=production
POSTGRES_HOST=srv-captain--postgres
# SSL não é necessário para conexão interna
# ... outras configs
```

## Notas importantes

1. Em desenvolvimento, conectamos ao PostgreSQL remoto hospedado em `postgres.platform.sinesys.app` com SSL habilitado
2. Em produção no CapRover, usamos o nome do container interno `srv-captain--postgres` sem SSL (conexão segura entre containers)
3. A configuração detecta automaticamente o ambiente baseado em `NODE_ENV`
4. Para desenvolvimento, `rejectUnauthorized: false` permite conexão com certificados auto-assinados