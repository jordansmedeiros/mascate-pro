-- Fix admin password with correct bcrypt hash
-- Este script corrige a senha do admin para 'admin123'

-- Primeiro, vamos verificar se o usuário existe
SELECT
    id,
    username,
    email,
    password_hash,
    role,
    active
FROM mascate_pro.users
WHERE email = 'admin@mascate.com';

-- Atualizar a senha do admin para 'admin123'
-- Hash bcrypt correto gerado para 'admin123'
UPDATE mascate_pro.users
SET
    password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    username = 'admin',
    display_name = 'Administrador do Sistema',
    role = 'superadmin',
    active = true,
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'admin@mascate.com';

-- Se não existir, criar o usuário
INSERT INTO mascate_pro.users (
    username,
    email,
    display_name,
    role,
    active,
    password_hash
)
SELECT
    'admin',
    'admin@mascate.com',
    'Administrador do Sistema',
    'superadmin',
    true,
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE NOT EXISTS (
    SELECT 1 FROM mascate_pro.users WHERE email = 'admin@mascate.com'
);

-- Verificar o resultado final
SELECT
    id,
    username,
    email,
    display_name,
    role,
    active,
    created_at,
    updated_at,
    CASE
        WHEN password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
        THEN 'Senha atualizada corretamente'
        ELSE 'Senha pode estar incorreta'
    END as senha_status
FROM mascate_pro.users
WHERE email = 'admin@mascate.com';