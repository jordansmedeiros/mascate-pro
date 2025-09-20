-- Criar apenas o usuário super admin
-- Para usar no pgAdmin depois de executar o schema principal

-- Verificar se o schema existe
CREATE SCHEMA IF NOT EXISTS mascate_pro;

-- Habilitar extensão UUID (se não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Deletar usuário admin se já existir (para recriar)
DELETE FROM mascate_pro.users WHERE email = 'admin@mascate.com';

-- Inserir usuário super admin
-- Senha: admin123 (hash bcrypt)
INSERT INTO mascate_pro.users (
    username,
    email,
    display_name,
    role,
    active,
    password_hash
) VALUES (
    'admin',
    'admin@mascate.com',
    'Administrador do Sistema',
    'superadmin',
    true,
    '$2b$10$rPF4cVJL8tHQbGH3kQJhtu7Fv9Jtt6RKJjJTQCf5pC.Wh2/9Dx.Nm'
);

-- Verificar se foi criado
SELECT
    id,
    username,
    email,
    display_name,
    role,
    active,
    created_at
FROM mascate_pro.users
WHERE email = 'admin@mascate.com';