-- Atualizar admin com hash correto para senha 'admin123'
-- Hash correto gerado localmente: $2b$10$.d8PsJu.efJtZVHNsvvbROzMMDgiQUSVJmmjEel7OPimF9xgj54v2

UPDATE mascate_pro.users
SET
    password_hash = '$2b$10$.d8PsJu.efJtZVHNsvvbROzMMDgiQUSVJmmjEel7OPimF9xgj54v2',
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'admin@mascate.com';

-- Verificar se foi atualizado
SELECT
    id,
    username,
    email,
    display_name,
    role,
    active,
    password_hash,
    updated_at
FROM mascate_pro.users
WHERE email = 'admin@mascate.com';