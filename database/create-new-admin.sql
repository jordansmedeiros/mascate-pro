-- Criar novo usuário super admin: admin@mascate.com.br
-- Senha: admin123

-- Primeiro, verificar se o email já existe
SELECT
    id, username, email, role, active
FROM mascate_pro.users
WHERE email = 'admin@mascate.com.br';

-- Criar o novo usuário super admin
INSERT INTO mascate_pro.users (
    username,
    email,
    display_name,
    role,
    active,
    password_hash
) VALUES (
    'admin_br',
    'admin@mascate.com.br',
    'Super Administrador BR',
    'superadmin',
    true,
    '$2b$10$.d8PsJu.efJtZVHNsvvbROzMMDgiQUSVJmmjEel7OPimF9xgj54v2'
)
ON CONFLICT (email) DO UPDATE SET
    username = 'admin_br',
    display_name = 'Super Administrador BR',
    role = 'superadmin',
    active = true,
    password_hash = '$2b$10$.d8PsJu.efJtZVHNsvvbROzMMDgiQUSVJmmjEel7OPimF9xgj54v2',
    updated_at = CURRENT_TIMESTAMP;

-- Verificar se foi criado/atualizado
SELECT
    id,
    username,
    email,
    display_name,
    role,
    active,
    created_at,
    updated_at
FROM mascate_pro.users
WHERE email = 'admin@mascate.com.br';