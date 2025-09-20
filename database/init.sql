-- Mascate Pro Database Schema
-- PostgreSQL Database Schema for CapRover deployment

-- Drop existing schema if exists (for clean installation)
DROP SCHEMA IF EXISTS mascate_pro CASCADE;

-- Create schema
CREATE SCHEMA mascate_pro;

-- Set search path to use the schema
SET search_path TO mascate_pro, public;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE mascate_pro.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    avatar_id VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('superadmin', 'admin', 'user')),
    active BOOLEAN NOT NULL DEFAULT true,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE mascate_pro.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    packaging VARCHAR(255) NOT NULL,
    purchase_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    sale_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    current_stock INTEGER NOT NULL DEFAULT 0,
    minimum_stock INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    FOREIGN KEY (created_by) REFERENCES mascate_pro.users(id)
);

-- Stock movements table
CREATE TABLE mascate_pro.stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL,
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('sale', 'purchase', 'adjustment', 'return', 'loss')),
    quantity INTEGER NOT NULL,
    price_per_unit DECIMAL(10, 2),
    total_value DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES mascate_pro.products(id),
    FOREIGN KEY (user_id) REFERENCES mascate_pro.users(id)
);

-- Activity logs table
CREATE TABLE mascate_pro.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES mascate_pro.users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON mascate_pro.users(email);
CREATE INDEX idx_users_username ON mascate_pro.users(username);
CREATE INDEX idx_users_active ON mascate_pro.users(active);

CREATE INDEX idx_products_name ON mascate_pro.products(name);
CREATE INDEX idx_products_category ON mascate_pro.products(category);
CREATE INDEX idx_products_active ON mascate_pro.products(active);
CREATE INDEX idx_products_current_stock ON mascate_pro.products(current_stock);

CREATE INDEX idx_stock_movements_product_id ON mascate_pro.stock_movements(product_id);
CREATE INDEX idx_stock_movements_user_id ON mascate_pro.stock_movements(user_id);
CREATE INDEX idx_stock_movements_type ON mascate_pro.stock_movements(type);
CREATE INDEX idx_stock_movements_created_at ON mascate_pro.stock_movements(created_at);

CREATE INDEX idx_activity_logs_user_id ON mascate_pro.activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON mascate_pro.activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON mascate_pro.activity_logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION mascate_pro.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON mascate_pro.users
    FOR EACH ROW EXECUTE FUNCTION mascate_pro.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON mascate_pro.products
    FOR EACH ROW EXECUTE FUNCTION mascate_pro.update_updated_at_column();

-- Insert default admin user
-- Password: admin123 (hashed with bcrypt)
INSERT INTO mascate_pro.users (username, email, display_name, role, password_hash) VALUES
('admin', 'admin@mascate.com', 'Administrador', 'superadmin', '$2b$10$rPF4cVJL8tHQbGH3kQJhtu7Fv9Jtt6RKJjJTQCf5pC.Wh2/9Dx.Nm');

-- Insert sample categories and products
INSERT INTO mascate_pro.products (name, category, unit, packaging, purchase_price, sale_price, current_stock, minimum_stock, created_by) VALUES
('Vodka Absolut 1L', 'Bebidas Destiladas', 'unidade', 'Garrafa 1L', 45.00, 85.00, 20, 5, (SELECT id FROM mascate_pro.users WHERE email = 'admin@mascate.com')),
('Cerveja Skol Lata 350ml', 'Cervejas', 'unidade', 'Lata 350ml', 2.50, 5.00, 100, 20, (SELECT id FROM mascate_pro.users WHERE email = 'admin@mascate.com')),
('Whisky Jack Daniels 1L', 'Bebidas Destiladas', 'unidade', 'Garrafa 1L', 120.00, 220.00, 10, 3, (SELECT id FROM mascate_pro.users WHERE email = 'admin@mascate.com')),
('Refrigerante Coca-Cola 2L', 'Refrigerantes', 'unidade', 'Garrafa 2L', 4.00, 8.00, 50, 15, (SELECT id FROM mascate_pro.users WHERE email = 'admin@mascate.com')),
('Energético Red Bull 250ml', 'Energéticos', 'unidade', 'Lata 250ml', 6.00, 12.00, 30, 10, (SELECT id FROM mascate_pro.users WHERE email = 'admin@mascate.com'));

-- Insert sample stock movements
INSERT INTO mascate_pro.stock_movements (product_id, user_id, type, quantity, price_per_unit, total_value, notes) VALUES
((SELECT id FROM mascate_pro.products WHERE name = 'Vodka Absolut 1L'),
 (SELECT id FROM mascate_pro.users WHERE email = 'admin@mascate.com'),
 'purchase', 20, 45.00, 900.00, 'Compra inicial de estoque'),
((SELECT id FROM mascate_pro.products WHERE name = 'Cerveja Skol Lata 350ml'),
 (SELECT id FROM mascate_pro.users WHERE email = 'admin@mascate.com'),
 'purchase', 100, 2.50, 250.00, 'Compra inicial de estoque');

-- Insert sample activity logs
INSERT INTO mascate_pro.activity_logs (user_id, action, details) VALUES
((SELECT id FROM mascate_pro.users WHERE email = 'admin@mascate.com'), 'SYSTEM_INIT', 'Sistema inicializado com dados de exemplo'),
((SELECT id FROM mascate_pro.users WHERE email = 'admin@mascate.com'), 'PRODUCT_CREATE', 'Produtos iniciais criados'),
((SELECT id FROM mascate_pro.users WHERE email = 'admin@mascate.com'), 'STOCK_MOVEMENT', 'Movimentações iniciais de estoque criadas');

-- Grant permissions to the application user
-- Note: In production, you should create a specific application user with limited permissions
GRANT USAGE ON SCHEMA mascate_pro TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA mascate_pro TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA mascate_pro TO postgres;

-- Set default search path for the database user
-- ALTER USER your_app_user SET search_path TO mascate_pro, public;