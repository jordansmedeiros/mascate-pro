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

- **Express.js** - Servidor de desenvolvimento local
- **PostgreSQL** - Database principal
- **Vercel** - Plataforma de deployment com Serverless Functions

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
- Conexão com banco de dados PostgreSQL

### Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd mascate-pro

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações do PostgreSQL

# Execute em modo desenvolvimento (Frontend + Backend)
npm run dev:full
```

### Configuração do Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```env
# PostgreSQL Configuration
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_HOST=your_postgres_host
POSTGRES_PORT=your_postgres_port
POSTGRES_DB=your_postgres_database

# Application Settings
VITE_APP_NAME="Mascate Runeria"
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=development
```

## 📖 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev           # Inicia o servidor de desenvolvimento do Vite
npm run dev:full      # Inicia o servidor do Vite e o servidor Express
npm run server        # Inicia o servidor Express com nodemon

# Build
npm run build         # Build para produção

# Qualidade de código
npm run lint          # Executa ESLint
npm run lint:fix      # Corrige problemas automaticamente
npm run format        # Formata código com Prettier
npm run typecheck     # Verifica tipos TypeScript

# Testes
npm run test          # Executa testes
npm run test:ui       # Interface gráfica dos testes
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
├── types/            # Definições de tipos TypeScript
├── utils/            # Utilitários gerais
└── test/             # Configuração de testes

api/                  # Vercel Serverless Functions
├── auth.ts           # Autenticação
├── db.ts             # Conexão com o banco de dados
├── products.ts       # CRUD de produtos
├── stock-movements.ts# Movimentação de estoque
└── users.ts          # CRUD de usuários
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

## 部署 (Deployment)

O projeto é deployado na Vercel. As Serverless Functions na pasta `api` são usadas para se comunicar com o banco de dados PostgreSQL.

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

Este projeto está sob a licença MIT.

## 🆘 Suporte

Para suporte técnico ou dúvidas sobre implementação:

- 🐛 Issues: GitHub Issues
- 📖 Documentação técnica: consulte a pasta `/docs` para detalhes de arquitetura, migração, padrões e integrações.