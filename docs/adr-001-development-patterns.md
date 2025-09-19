# ADR-001: Padrões de Desenvolvimento - Mascate Pro

**Data:** 19/09/2025  
**Status:** Aceito  
**Contexto:** Definição dos padrões arquiteturais para o desenvolvimento contínuo do sistema

## Resumo

Este documento estabelece os padrões de desenvolvimento, estruturas de dados e convenções técnicas para o sistema de controle de estoque da Mascate Runeria.

## Estruturas de Dados Principais

### Product (Produto)
```typescript
interface Product {
  id: string;                // UUID
  name: string;              // Nome do produto
  category: string;          // Categoria (fumo, doce, bebida, etc.)
  unit: string;              // Unidade (unidade, pacote, caixa)
  packaging: string;         // Descrição da embalagem
  purchase_price: number;    // Preço de compra
  sale_price: number;        // Preço de venda
  current_stock: number;     // Estoque atual
  minimum_stock: number;     // Estoque mínimo
  active: boolean;           // Produto ativo
  created_at: string;        // Data de criação (ISO 8601)
  updated_at?: string;       // Data de atualização (ISO 8601)
  created_by: string;        // ID do usuário que criou
}
```

### StockMovement (Movimentação de Estoque)
```typescript
interface StockMovement {
  id: string;                     // UUID
  product_id: string;             // ID do produto
  movement_type: StockMovementType;
  quantity: number;               // Quantidade movimentada
  previous_stock: number;         // Estoque anterior
  new_stock: number;             // Novo estoque
  unit_price?: number;           // Preço unitário (opcional)
  total_value?: number;          // Valor total (opcional)
  notes?: string;                // Observações
  created_at: string;            // Data da movimentação
  created_by: string;            // ID do usuário
}

type StockMovementType = 'sale' | 'purchase' | 'adjustment' | 'return' | 'loss';
```

## Padrões Técnicos Estabelecidos

### 1. Database Service (localStorage)
- **Serviço**: `src/services/db/browser-db.ts`
- **Padrão**: Singleton com métodos assíncronos
- **Chaves**: `mascate_stock_v2_${table}`
- **Inicialização**: Seed data automático se não existir dados

### 2. React Query Hooks
- **Localização**: `src/features/{domain}/hooks/`
- **Padrões de nomeação**:
  - `use{Entity}()` - Lista de entidades
  - `use{Entity}(id)` - Entidade individual
  - `useCreate{Entity}()` - Mutação de criação
  - `useUpdate{Entity}()` - Mutação de atualização
  - `useDelete{Entity}()` - Mutação de remoção
- **Query Keys**: Estrutura hierárquica com arrays
- **Invalidação**: Cache invalidation após mutations

### 3. Formulários e Validação
- **Biblioteca**: React Hook Form + Zod
- **Schemas**: `src/types/schemas.ts`
- **Padrão de nomeação**: `{entity}FormSchema`
- **Validação**: Client-side com mensagens em português
- **Error handling**: Display automático de erros

### 4. Componentes UI
- **Localização**: `src/components/ui/`
- **Utilitário**: `cn()` para combinação de classes
- **Padrões**:
  - Props interface bem definida
  - Forwarded refs quando necessário
  - Variants e sizes padronizados
  - Estados loading/disabled

### 5. Estilos e Tema

#### Cores Principais
- **Mascate Gold**: `mascate-500` (#f1c535) e `mascate-600` (#e2a928)
- **Nightclub Purple**: `nightclub-500` (#d946ef) e `nightclub-600` (#c026d3)

#### Classes Customizadas
```css
.btn-primary     // Botão principal dourado
.btn-secondary   // Botão secundário cinza
.btn-danger      // Botão de ação perigosa vermelho
.card            // Card base com sombra e borda
.card-header     // Cabeçalho do card
.form-input      // Input padrão de formulário
.form-label      // Label padrão de formulário
.alert-{type}    // Alertas coloridos (warning, success, danger)
```

### 6. Roteamento e Autenticação
- **Router**: React Router v7
- **Proteção**: `ProtectedRoute` wrapper com verificação de role
- **Hierarquia de roles**: user (1) < admin (2) < superadmin (3)
- **Sessão**: localStorage para persistência

### 7. Logging e Auditoria
- **ActivityLog**: Todos CRUD operations são logados
- **Padrão de ações**: `{ENTITY}_{ACTION}` (ex: PRODUCT_CREATED)
- **Detalhes**: Descrição amigável em português
- **Metadata**: IP, user-agent, timestamp

## Decisões para Implementação Contínua

### Estrutura de Features
```
src/features/{domain}/
├── components/          # Componentes específicos do domínio
├── hooks/              # React Query hooks
├── types/              # Tipos específicos (se necessário)
└── utils/              # Utilitários do domínio
```

### Nomenclatura de Arquivos
- **Componentes**: PascalCase (`ProductForm.tsx`)
- **Hooks**: camelCase (`useProducts.ts`)
- **Utilitários**: camelCase (`calculateProfit.ts`)
- **Tipos**: camelCase (`productTypes.ts`)

### Error Handling
- **UI**: Toast notifications para feedback
- **Formulários**: Validação inline com mensagens
- **API**: Try-catch com fallback gracioso
- **Loading**: Skeleton states e spinners

### Performance
- **React Query**: Cache inteligente com stale-time otimizado
- **Componentes**: React.memo para listas grandes
- **Formulários**: Debounce em search inputs
- **Imagens**: Lazy loading quando aplicável

### Testes
- **Unit**: Vitest + React Testing Library
- **Hooks**: @testing-library/react-hooks
- **E2E**: Playwright (futura implementação)
- **Cobertura**: Mínimo 80% para business logic

## Próximos Passos de Implementação

1. **Páginas de Produtos**: CRUD completo com tabela, filtros e modal
2. **Página de Estoque**: Formulário de movimentações e histórico
3. **Componentes reutilizáveis**: Table, Modal, DatePicker
4. **Integração Supabase**: Migração gradual do localStorage
5. **PWA**: Service worker e cache offline

---

**Reviewers**: Jordan Medeiros  
**Aprovação**: ✅ Aceito para implementação imediata