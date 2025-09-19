# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Mascate Runeria** is a simple stock control system designed specifically for nightclubs to manage small cash register items (cigarette papers, chocolates, candies, etc.). The system focuses on **fast sales transactions** rather than being a full professional POS system.

### Key Characteristics
- **Portuguese language**: Business logic documentation and UI text
- **Mobile-responsive**: Works on phones and computers
- **Role-based access**: Superadmin → Admin → User hierarchy
- **Simple workflow**: Add products → Quick sales → Stock alerts

## Development Commands

### Core Development
```bash
# Start development server (Frontend + Backend)
npm run dev:full

# Start development server (Frontend only)
npm run dev

# Start development server (Backend only)
npm run server

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality
```bash
# Lint TypeScript code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check

# Type checking only (no build)
npm run typecheck
```

### Testing
```bash
# Run all tests
npm run test

# Run tests with UI interface
npm run test:ui

# Generate coverage report
npm run test:coverage

# Single test file
npm run test -- ProductForm.test.tsx

# E2E tests (Playwright)
npx playwright test
```

## Architecture Overview

### Feature-Based Structure
The codebase follows SOLID principles with domain-driven feature organization:

```
src/
├── app/              # Global app configuration
├── features/         # Domain-organized modules
│   ├── auth/         # Authentication & user management
│   ├── dashboard/    # KPIs and overview statistics
│   ├── products/     # Product CRUD operations
│   ├── stock/        # Stock movements and transactions
│   ├── users/        # User management (superadmin only)
│   └── logs/         # Activity logging and auditing
├── components/       # Reusable components
│   ├── ui/           # Base components (Button, Card, etc.)
│   └── layout/       # Layout components
├── services/         # External integrations
├── types/            # TypeScript definitions
└── utils/            # General utilities

api/                  # Vercel Serverless Functions
├── auth.ts           # Authentication
├── db.ts             # Conexão com o banco de dados
├── products.ts       # CRUD de produtos
├── stock-movements.ts# Movimentação de estoque
└── users.ts          # CRUD de usuários
```

### Data Flow Pattern
```
UI Component → React Query Hook → API Client → Vercel Function → PostgreSQL
     ↓              ↓                    ↓                   ↓              ↓
   Form         useProducts()       api-client.ts         /api/products      Database
  Button        useCreateProduct()     HTTP calls         CRUD ops           Cache
```

## Database Service

The application uses a PostgreSQL database hosted on a remote server. The connection is managed by the backend, which can be either the local Express server for development or the Vercel Serverless Functions in production.

## Authentication & Authorization

The system uses a custom authentication system with a PostgreSQL database. The authentication flow is as follows:

1.  The user enters their email and password in the login form.
2.  The frontend sends a POST request to the `/api/auth` endpoint.
3.  The backend verifies the credentials against the `users` table in the database.
4.  If the credentials are valid, the backend returns a user object.
5.  The frontend stores the user object in the `AuthContext` and redirects the user to the dashboard.

### Role Hierarchy
```typescript
// Role levels (higher number = more permissions)
const roleHierarchy = {
  'user': 1,        // View and basic stock operations
  'admin': 2,       // Product management + stock
  'superadmin': 3   // Full access including user management
};
```

### Development Credentials
```
Username: admin
Password: admin
Role: superadmin
```

### Route Protection
```typescript
<ProtectedRoute requiredRole="admin">
  <ProdutosPage />
</ProtectedRoute>
```

## React Query Patterns

### Hook Naming Conventions
```typescript
// Data fetching
useProducts()           // List products
useProduct(id)          // Single product
useDashboardStats()     // Dashboard data

// Mutations
useCreateProduct()      // Create new product
useUpdateProduct()      // Update existing
useDeleteProduct()      // Delete product
useStockMovement()      // Add stock movement
```

### Query Key Structure
```typescript
['products']              // All products
['products', { search }]  // Filtered products
['products', id]          // Single product
['dashboard', 'stats']    // Dashboard statistics
```

## Form Validation

### Schema-Based Validation
All forms use React Hook Form + Zod:

```typescript
// Schema definition in types/schemas.ts
const productFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  purchase_price: z.number().min(0, 'Preço deve ser positivo'),
  sale_price: z.number().min(0, 'Preço deve ser positivo'),
  current_stock: z.number().min(0, 'Estoque deve ser positivo'),
  minimum_stock: z.number().min(0, 'Estoque mínimo deve ser positivo')
});

// Form component
const form = useForm<ProductFormData>({
  resolver: zodResolver(productFormSchema)
});
```

## Custom Design System

### Brand Colors
```css
/* Tailwind extended colors */
--mascate-500: #f1c535    /* Primary gold */
--mascate-600: #e2a928    /* Dark gold */
--nightclub-500: #d946ef  /* Purple accent */
--nightclub-600: #c026d3  /* Dark purple */
```

### Component Classes
```css
.btn-primary     /* Gold button */
.btn-secondary   /* Gray button */
.btn-danger      /* Red destructive button */
.card            /* Base card with shadow */
.form-input      /* Standard form input */
.alert-warning   /* Yellow alert */
.alert-success   /* Green success */
.alert-danger    /* Red error */
```

## Environment Setup

### Requirements
- Node.js 18+
- npm (no specific preference between npm/yarn/pnpm)
- PostgreSQL database

### Environment Variables
```bash
# Copy from example
cp .env.example .env

# App configuration
VITE_APP_NAME="Mascate Runeria"
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=development

# PostgreSQL Database Configuration
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_HOST=your_postgres_host
POSTGRES_PORT=your_postgres_port
POSTGRES_DB=your_postgres_database

# Frontend Configuration
VITE_API_URL="http://localhost:3002/api"
```

### Development Setup
```bash
git clone <repository-url>
cd mascate-pro
npm install
cp .env.example .env
# Edit .env with your PostgreSQL credentials
npm run dev:full
```

## Testing Strategy

### Test Stack
- **Unit Tests**: Vitest with jsdom environment
- **Component Tests**: React Testing Library
- **E2E Tests**: Playwright
- **Setup**: `src/test/setup.ts`

## Key Business Logic

### Stock Movement Types
```typescript
type StockMovementType = 
  | 'sale'       // 💰 Customer purchase (reduces stock)
  | 'purchase'   // 📦 Inventory restocking (increases stock)  
  | 'adjustment' // ⚙️ Manual correction
  | 'return'     // 🔄 Product return (increases stock)
  | 'loss';      // ⚠️ Damaged/lost items (reduces stock)
```

### Core User Flows
1. **Fast Sales**: Main screen has −1, −2, −5 buttons for common quantities
2. **Product Management**: Admin can add/edit products with purchase/sale prices
3. **Stock Alerts**: Dashboard shows products below minimum stock level
4. **Movement History**: All stock changes are logged with timestamps

### Profit Calculation
```typescript
const profit = (sale_price - purchase_price) * quantity;
const margin = ((sale_price - purchase_price) / purchase_price) * 100;
```

## Common Development Tasks

### Adding a New Feature Module
```bash
# Create feature structure
mkdir -p src/features/my-feature/{components,hooks,types,utils}
touch src/features/my-feature/index.ts

# Follow patterns from existing features
# - components/ for UI components
# - hooks/ for React Query hooks  
# - types/ for domain-specific types
# - utils/ for business logic
```

### Adding New Database Entity
1.  Update the `setup-postgresql.js` script to include the new table and columns.
2.  Run the script to update the database schema.
3.  Create a new Vercel Serverless Function to handle the CRUD operations for the new entity.
4.  Update the frontend to use the new API endpoint.

### Creating Reusable UI Component
```typescript
// src/components/ui/MyComponent.tsx
interface MyComponentProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const MyComponent = forwardRef<HTMLDivElement, MyComponentProps>(
  ({ variant = 'primary', className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('base-styles', variants[variant], className)}
        {...props}
      />
    );
  }
);
```
