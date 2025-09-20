-- Recriar usuário admin sem violar foreign keys
-- Para usar quando já existem dados no banco

-- 1. Primeiro, vamos verificar se o usuário admin já existe
DO $$
DECLARE
    admin_id UUID;
    new_admin_id UUID;
BEGIN
    -- Buscar o ID do usuário admin atual (se existir)
    SELECT id INTO admin_id
    FROM mascate_pro.users
    WHERE email = 'admin@mascate.com';

    IF admin_id IS NOT NULL THEN
        -- Se já existe, apenas atualizar a senha e dados
        UPDATE mascate_pro.users
        SET
            username = 'admin',
            display_name = 'Administrador do Sistema',
            role = 'superadmin',
            active = true,
            password_hash = '$2b$10$rPF4cVJL8tHQbGH3kQJhtu7Fv9Jtt6RKJjJTQCf5pC.Wh2/9Dx.Nm',
            updated_at = CURRENT_TIMESTAMP
        WHERE email = 'admin@mascate.com';

        RAISE NOTICE 'Usuário admin atualizado com sucesso!';
    ELSE
        -- Se não existe, criar novo
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

        RAISE NOTICE 'Usuário admin criado com sucesso!';
    END IF;
END $$;

-- Verificar o resultado
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
WHERE email = 'admin@mascate.com';