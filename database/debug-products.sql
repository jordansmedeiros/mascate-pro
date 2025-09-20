-- Debug: verificar se a tabela products existe e sua estrutura

-- 1. Verificar se o schema existe
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name = 'mascate_pro';

-- 2. Verificar se a tabela products existe
SELECT table_name, table_schema
FROM information_schema.tables
WHERE table_schema = 'mascate_pro' AND table_name = 'products';

-- 3. Ver a estrutura da tabela products (se existir)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'mascate_pro' AND table_name = 'products'
ORDER BY ordinal_position;

-- 4. Contar quantos produtos existem
SELECT COUNT(*) as total_products
FROM mascate_pro.products;

-- 5. Ver alguns produtos (se existirem)
SELECT id, name, category, unit, current_stock, active
FROM mascate_pro.products
LIMIT 5;