# 🏆 Mascate Runeria - Controle de Caixa

**Sistema SIMPLES de controle de estoque para casa noturna**
Uma aplicação **super simples e rápida** para controle dos pequenos itens vendidos no caixa da casa noturna (seda, cigarros, chocolates, balas, etc.).

> 🎯 **FOCO**: Dar baixa rápida nos produtos vendidos. Não é um PDV profissional, é apenas para controlar os "negocinho do caixa"!

## ✨ Features (Simplicidade em Primeiro Lugar!)

### 💰 **VENDAS RÁPIDAS** (Funcionalidade Principal)

- **Botões rápidos**: -1, -2, -5 para vendas comuns
- **Input personalizado**: Para quantidades específicas
- **Visual claro**: Estoque atual bem visível
- **Alertas automáticos**: Quando o produto está acabando

### 📦 **Gerenciamento de Produtos**

- **Cadastro simples**: Nome, categoria, preços, estoque
- **Visualização em cards**: Fácil de ver e editar
- **Categorias básicas**: Doce, Fumo, Bebida, Outros

### 📈 **Controles Básicos**

- **Dashboard**: Visão geral do estoque
- **Autenticação**: Login simples (admin/admin para desenvolvimento)
- **Persistência local**: Tudo salvo no browser (SQLite)
- **Responsivo**: Funciona no celular e computador

## 🛠️ Tech Stack

### Frontend

- **React 19** - Interface de usuário moderna
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utilitário
- **React Query (TanStack)** - Gerenciamento de estado servidor
- **React Hook Form** - Formulários performáticos
- **Zod** - Validação de schemas
- **Recharts** - Gráficos interativos
- **Lucide React** - Ícones modernos

### Backend & Database

- **PostgreSQL** - Database principal via Supabase

### Desenvolvimento

- **Vitest** - Framework de testes
- **Testing Library** - Utilitários de teste
- **ESLint + Prettier** - Code quality
- **Husky** - Git hooks
- **GitHub Actions** - CI/CD

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+
- npm ou pnpm
- Conta no Supabase (opcional para desenvolvimento)

### Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd mascate-pro

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Execute em modo desenvolvimento
npm run dev
```

### Configuração do Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```env
# Supabase Configuration (opcional para dev)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Application Settings
VITE_APP_NAME="Mascate Runeria"
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=development

# Database Settings
VITE_USE_LOCAL_DB=true
VITE_DB_NAME=mascate_stock.db
```

## 📖 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build

# Qualidade de código
npm run lint         # Executa ESLint
npm run lint:fix     # Corrige problemas automaticamente
npm run format       # Formata código com Prettier
npm run typecheck    # Verifica tipos TypeScript

# Testes
npm run test         # Executa testes
npm run test:ui      # Interface gráfica dos testes
npm run test:coverage # Relatório de cobertura
```

## 🏗️ Arquitetura

O projeto segue os princípios SOLID e arquitetura baseada em features:

```
src/
├── app/              # Configuração global da aplicação
├── features/         # Módulos organizados por domínio
│   ├── auth/         # Autenticação e autorização
│   ├── dashboard/    # Dashboard e estatísticas
│   ├── products/     # Gerenciamento de produtos
│   ├── stock/        # Movimentação de estoque
│   ├── users/        # Gestão de usuários
│   └── logs/         # Logs e auditoria
├── components/       # Componentes reutilizáveis
│   ├── ui/           # Componentes base (Button, Card, etc.)
│   └── layout/       # Componentes de layout
├── services/         # Serviços e integrações
│   ├── db/           # Database service (SQLite)
│   └── api/          # API calls (Supabase)
├── hooks/            # Custom hooks
├── types/            # Definições de tipos TypeScript
├── utils/            # Utilitários gerais
└── test/             # Configuração de testes
```

## 🔐 Sistema de Autenticação

### Roles de Usuário

- **Super Admin**: Acesso completo incluindo gestão de usuários
- **Admin**: Gerenciamento de produtos e estoque (sem gestão de usuários)
- **User**: Visualização e operações básicas de estoque

### 🔑 Credenciais de Desenvolvimento

- **Usuário**: `admin`
- **Senha**: `admin`
- **Acesso**: Superadmin (acesso total)
- **Database**: SQLite local (localStorage) com produtos de exemplo

## 📊 Funcionalidades Principais

### Dashboard

- KPIs em tempo real (total produtos, estoque baixo, valores)
- Gráficos de níveis de estoque
- Alertas de produtos com estoque crítico
- Movimentações recentes

### Gestão de Produtos

- CRUD completo com validação
- Categorização por tipo (fumo, doce, bebida, etc.)
- Controle de preços (compra/venda)
- Definição de estoque mínimo
- Cálculo automático de margem de lucro

### Controle de Estoque

- Tipos de movimentação:
  - 💰 **Venda** - Redução por venda ao cliente
  - 📦 **Entrada** - Reposição de estoque
  - ⚙️ **Ajuste** - Correção manual
  - 🔄 **Devolução** - Retorno de produtos
  - ⚠️ **Perda** - Produtos danificados/perdidos

## 📋 Status do Desenvolvimento

### ✅ **FUNCIONANDO** (Pronto para Usar!)

- [x] **💰 VENDAS RÁPIDAS** - Funcionalidade principal 100% funcional!
- [x] **📦 Cadastro de Produtos** - CRUD completo e simples
- [x] **📈 Dashboard** - Visão geral do estoque
- [x] **🔐 Login** - Autenticação básica funcionando
- [x] **💾 Database Local** - SQLite no browser com persistência
- [x] **📱 Responsivo** - Interface mobile-friendly
- [x] **⚡ Performance** - React Query + cache inteligente

### 🎯 **O Essencial Está Pronto!**

O sistema **JÁ FUNCIONA** para o propósito principal:

1. **Cadastrar produtos** do caixa
2. **Dar baixa rápida** quando alguém compra
3. **Ver estoque atual** e alertas de produto acabando
4. **Repor estoque** quando comprar mais produtos

### 🕰️ Melhorias Futuras (Se Necessário)

- [ ] Integração com Supabase (para backup na nuvem)
- [ ] PWA (instalar no celular)
- [ ] Relatórios de vendas
- [ ] Backup/restauração de dados

## 🧪 Migração do MVP Anterior

Para migrar dados do sistema anterior:

1. **Backup dos dados existentes**:

   ```javascript
   // No console do browser do sistema anterior
   const backup = {
     usuarios: JSON.parse(localStorage.getItem('mascate_usuarios')),
     produtos: JSON.parse(localStorage.getItem('mascate_produtos')),
     logs: JSON.parse(localStorage.getItem('mascate_logs'))
   };
   console.log('Backup:', JSON.stringify(backup, null, 2));
   ```

2. **Os dados serão migrados automaticamente** para a nova estrutura SQLite

## 🎨 Design System

### Cores Principais

```css
/* Mascate Gold */
--mascate-500: #f1c535
--mascate-600: #e2a928

/* Nightclub Purple */
--nightclub-500: #d946ef
--nightclub-600: #c026d3
```

### Classes Utilitárias Customizadas

```typescript
// Botões
<button className="btn-primary">Ação Principal</button>
<button className="btn-secondary">Ação Secundária</button>
<button className="btn-danger">Ação Perigosa</button>

// Cards
<div className="card">
  <h3 className="card-header">Título</h3>
  <p>Conteúdo...</p>
</div>

// Formulários
<input className="form-input" />
<label className="form-label">Label</label>

// Alertas
<div className="alert-warning">Aviso</div>
<div className="alert-success">Sucesso</div>
<div className="alert-danger">Erro</div>
```

## 🤝 Contributing

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Convenções de Código

- Use TypeScript sempre que possível
- Siga as regras do ESLint/Prettier
- Escreva testes para novas funcionalidades
- Documentação em português para business logic

## 📄 License

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

Para suporte técnico ou dúvidas sobre implementação:

- 🐛 Issues: GitHub Issues
- 📖 Docs: `/docs` para documentação técnica detalhada
