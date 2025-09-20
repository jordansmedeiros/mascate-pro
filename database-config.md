# Configuração de Conexão com Banco de Dados

## Estrutura de Arquivos de Ambiente

Mantemos apenas 3 arquivos:
- **`.env`** - Configurações de desenvolvimento (valores padrão)
- **`.env.example`** - Template de documentação (sem valores sensíveis)
- **`.env.production`** - Configurações de produção (não versionado no git)

## Ambientes

### Desenvolvimento (Local)
- **Host**: postgres.platform.sinesys.app (conexão remota via HTTPS)
- **Porta**: 5432
- **Banco**: postgres
- **SSL**: Habilitado (rejectUnauthorized: false para desenvolvimento)
- **Arquivo**: `.env` (padrão)

### Produção (CapRover)
- **Host**: srv-captain--postgres (nome do container interno)
- **Porta**: 5432
- **Banco**: postgres
- **SSL**: Desabilitado (conexão interna entre containers)
- **Arquivo**: `.env.production` (criado no deploy)

## Como usar

### Desenvolvimento local:
```bash
# Usa .env automaticamente
npm run dev:full    # Frontend + Backend
npm run server      # Apenas backend
npm run dev         # Apenas frontend
```

### Produção:
```bash
# Cria .env.production no servidor com as configs de produção
NODE_ENV=production npm start

# Ou
npm run start:prod
```

## Configuração do .env

### Para Desenvolvimento (.env)
```env
NODE_ENV=development
POSTGRES_HOST=postgres.platform.sinesys.app
POSTGRES_SSL=true
VITE_API_URL=http://localhost:3002/api
```

### Para Produção (.env.production)
```env
NODE_ENV=production
POSTGRES_HOST=srv-captain--postgres
POSTGRES_SSL=false
VITE_API_URL=/api
```

## Notas importantes

1. Em desenvolvimento, conectamos ao PostgreSQL remoto hospedado em `postgres.platform.sinesys.app` com SSL habilitado
2. Em produção no CapRover, usamos o nome do container interno `srv-captain--postgres` sem SSL (conexão segura entre containers)
3. A configuração detecta automaticamente o ambiente baseado em `NODE_ENV`
4. Para desenvolvimento, `rejectUnauthorized: false` permite conexão com certificados auto-assinados