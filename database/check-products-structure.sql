-- Verificar estrutura completa da tabela products

-- Ver todos os campos da tabela products
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'mascate_pro' AND table_name = 'products'
ORDER BY ordinal_position;

-- Ver um produto completo com todos os campos
SELECT *
FROM mascate_pro.products
LIMIT 1;