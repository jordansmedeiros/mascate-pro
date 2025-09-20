-- Testar a query exata que o server.js está executando

-- Query exata do server.js para products
SELECT id, name, category, unit, packaging, purchase_price, sale_price,
       current_stock, minimum_stock, active, created_at, updated_at, created_by
FROM mascate_pro.products
ORDER BY name ASC;