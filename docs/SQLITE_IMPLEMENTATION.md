# Implementação SQLite no Mascate Pro

## Visão Geral

O sistema foi migrado do localStorage para um banco SQLite real usando `sql.js`, uma implementação WebAssembly do SQLite que funciona no navegador.

## Arquitetura

### 1. Serviço SQLite (`src/services/db/sqlite-db.ts`)
- **WebAssembly**: Usa `sql.js` para executar SQLite no navegador
- **Persistência**: Dados salvos no IndexedDB para manter entre sessões
- **Migração**: Migra automaticamente dados do localStorage existente
- **Backup**: Suporte a export/import de arquivos `.db`

### 2. Schema do Banco
```sql
-- Tabelas principais
- users (usuários do sistema)
- products (produtos do estoque)
- stock_movements (movimentações de estoque)
- activity_logs (logs de atividades)

-- Indexes para performance
- Emails, usernames, nomes de produtos
- Datas de criação para ordenação
```

### 3. Persistência em Camadas
1. **Memória**: SQLite em WebAssembly
2. **IndexedDB**: Backup automático do banco
3. **Arquivo**: Banco inicial em `public/mascate_stock.db`

## Fluxo de Inicialização

1. **Carrega SQL.js** com arquivo `sql-wasm.wasm`
2. **Verifica IndexedDB** para banco existente
3. **Se não existe**: Carrega banco inicial de `public/mascate_stock.db`
4. **Se não tem inicial**: Cria novo banco com schema
5. **Migra localStorage** se dados antigos existirem
6. **Salva no IndexedDB** após mudanças

## Vantagens da Implementação

### ✅ Funciona Local e Produção
- **Local**: Dados persistem entre reloads
- **Produção**: Cada usuário tem sua própria base
- **Deploy**: Banco inicial sempre disponível

### ✅ Backup e Sincronização
- **Export/Import**: Funcionalidade nativa do app
- **Git**: Banco inicial versionado em `public/`
- **Migração**: Dados do localStorage preservados

### ✅ Performance
- **SQL Real**: Queries complexas e indexes
- **Memory**: Operações rápidas em WebAssembly
- **Async**: Operações não bloqueiam UI

## Scripts Disponíveis

```bash
# Gerar banco inicial (desenvolvimento)
npm run init-db

# Build com SQLite
npm run build

# Desenvolvimento
npm run dev
```

## Arquivos Importantes

```
src/services/db/
├── sqlite-db.ts      # Serviço SQLite principal
├── index.ts          # Entry point (usa SQLite)
└── browser-db.ts     # Antigo localStorage (mantido)

public/
├── sql-wasm.wasm     # WebAssembly do SQLite
└── mascate_stock.db  # Banco inicial (versionado)

scripts/
└── init-db.js        # Script para gerar banco inicial
```

## Compatibilidade

- ✅ **Navegadores modernos** (Chrome, Firefox, Safari, Edge)
- ✅ **Vercel/Netlify** (arquivos estáticos)
- ✅ **Mobile** (PWA compatível)
- ✅ **Offline** (dados persistem localmente)

## Migração de Dados

O sistema migra automaticamente dados existentes do localStorage:
- Usuários, produtos, movimentações e logs
- Conversão de tipos e campos conforme necessário
- Mantém IDs e timestamps originais

## Deploy na Vercel

Agora o app funcionará corretamente na Vercel porque:
1. **Banco inicial** está em `public/` (servido como estático)
2. **Dados persistem** no IndexedDB de cada usuário
3. **Usuário admin** sempre existe no banco inicial
4. **Funcionalidade completa** desde a primeira visita

## Comandos para Deploy

```bash
# Build para produção
npm run build

# Deploy na Vercel
npm run deploy:vercel
```

O app agora tem um banco SQLite real, persistente e sincronizável! 🎉