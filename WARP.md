# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Mascate Runeria** is a simple stock control system designed specifically for nightclubs to manage small cash register items (cigarette papers, chocolates, candies, etc.). The system focuses on **fast sales transactions** rather than being a full professional POS system.

### Key Characteristics
- **Portuguese language**: Business logic documentation and UI text
- **Offline-first**: SQLite in browser with localStorage persistence
- **Mobile-responsive**: Works on phones and computers
- **Role-based access**: Superadmin → Admin → User hierarchy
- **Simple workflow**: Add products → Quick sales (−1, −2, −5 buttons) → Stock alerts

## Development Commands

### Core Development
```bash
# Start development server
npm run dev

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
│   ├── db/           # Database service (SQLite)
│   └── api/          # Supabase API (optional)
├── hooks/            # Cross-feature custom hooks
├── types/            # TypeScript definitions
└── utils/            # General utilities
```

### Data Flow Pattern
```
UI Component → React Query Hook → Database Service → SQLite (localStorage) → Cache
     ↓              ↓                    ↓                   ↓              ↓
   Form         useProducts()       browser-db.ts      localStorage    TanStack Query
  Button        useCreateProduct()     CRUD ops       persistence        cache
```

## Database Service

### SQLite in Browser
The system uses `sql.js` for SQLite database in the browser with localStorage persistence:

```typescript
// Service pattern
const db = await getDatabase();
const products = await db.products.findAll();
await db.products.create(productData);
await db.stockMovements.create(movementData);
```

### Storage Keys Pattern
- `mascate_stock_v2_users`
- `mascate_stock_v2_products` 
- `mascate_stock_v2_stock_movements`
- `mascate_stock_v2_activity_logs`

### Automatic Seeding
Database initializes with sample data if empty (dev environment).

## Authentication & Authorization

### Local Authentication
The system uses a simple local authentication system:
- Username/password stored in local SQLite database
- Session persistence via localStorage
- No external dependencies or cloud services

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
- Modern browser with WebAssembly support

### Environment Variables
```bash
# Copy from example
cp .env.example .env

# App configuration
VITE_APP_NAME="Mascate Runeria"
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=development

# Database settings (SQLite local only)
VITE_DB_NAME=mascate_stock_v2
```

### Development Setup
```bash
git clone <repository-url>
cd mascate-pro
npm install
cp .env.example .env
npm run dev
```

## Testing Strategy

### Test Stack
- **Unit Tests**: Vitest with jsdom environment
- **Component Tests**: React Testing Library
- **E2E Tests**: Playwright
- **Setup**: `src/test/setup.ts`

### Test Database
Tests use in-memory SQLite database, not localStorage:

```typescript
// In test files
beforeEach(async () => {
  const db = await getDatabase(); // Gets clean test DB
  await db.seedTestData();
});
```

### Mocking Patterns
```typescript
// Mock localStorage database
vi.mock('@/services/db', () => ({
  getDatabase: vi.fn(() => mockDatabase)
}));

// Mock localStorage for clean tests
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
```

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

## Migration Notes

### From Previous MVP
The system can migrate data from a previous localStorage-based version:
- Look for `mascate_usuarios`, `mascate_produtos`, `mascate_logs` keys
- Automatic migration transforms data to new SQLite schema
- Preserves user accounts and product catalog

### Supabase Migration (Future)
Database service is abstracted to allow gradual migration from SQLite to Supabase:
- Environment variable `VITE_USE_LOCAL_DB` controls data source
- Same service interface works with both backends
- React Query cache works identically

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
1. Define TypeScript interface in `types/index.ts`
2. Add table to `services/db/browser-db.ts`
3. Create React Query hooks in feature module
4. Add to seed data for development

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