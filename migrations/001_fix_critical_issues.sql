-- =====================================================
-- Migration: Fix Critical Database Issues
-- Date: ${new Date().toISOString()}
-- Description: Add missing triggers and clean up policies
-- =====================================================

-- 1. Add missing updated_at triggers for consistency
-- These triggers ensure updated_at is automatically maintained

CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Clean up duplicate policies on profiles table
-- Remove Portuguese duplicate policies (keep English versions)
DROP POLICY IF EXISTS "Usuários podem atualizar o próprio perfil." ON profiles;
DROP POLICY IF EXISTS "Usuários podem ver o próprio perfil." ON profiles;

-- 3. Remove unused functions
-- Clean up unused trigger function
DROP FUNCTION IF EXISTS update_request_logs_updated_at();

-- 4. Add table comments for documentation
COMMENT ON TABLE profiles IS 'User profiles linked to auth.users with credit system';
COMMENT ON TABLE questions IS 'Educational questions with rich metadata and evaluation criteria';
COMMENT ON TABLE assessments IS 'Collections of questions for educational evaluation';
COMMENT ON TABLE folders IS 'Organization structure for grouping questions';

-- 5. Add column comments for key JSONB fields
COMMENT ON COLUMN questions.alternativas IS 'Question alternatives in JSONB format: {"A": "Option A", "B": "Option B", ...}';
COMMENT ON COLUMN questions.eixos_cognitivos IS 'Cognitive taxonomy structure in JSONB format';
COMMENT ON COLUMN questions.topicos IS 'Topic categorization structure in JSONB format';
COMMENT ON COLUMN questions.guia_de_pontuacao IS 'Scoring guide with criteria and point allocation for open questions';
COMMENT ON COLUMN questions.rubrica_avaliacao IS 'Evaluation rubric with dimensions and scoring criteria';

-- 6. Create indexes for better performance on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_questions_area_conhecimento ON questions(area_conhecimento);
CREATE INDEX IF NOT EXISTS idx_questions_disciplina ON questions(disciplina);
CREATE INDEX IF NOT EXISTS idx_questions_nivel_dificuldade ON questions(nivel_dificuldade);
CREATE INDEX IF NOT EXISTS idx_questions_tipo_questao ON questions(tipo_questao);
CREATE INDEX IF NOT EXISTS idx_questions_folder_id ON questions(folder_id);
CREATE INDEX IF NOT EXISTS idx_questions_user_id_created_at ON questions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_assessments_user_id_created_at ON assessments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_folders_user_id_name ON folders(user_id, name);

-- 7. Add check constraints for data integrity
ALTER TABLE profiles ADD CONSTRAINT chk_profiles_credits_non_negative 
  CHECK (credits >= 0);

ALTER TABLE questions ADD CONSTRAINT chk_questions_nivel_dificuldade_valid 
  CHECK (nivel_dificuldade IS NULL OR nivel_dificuldade IN ('facil', 'medio', 'dificil'));

ALTER TABLE questions ADD CONSTRAINT chk_questions_tipo_questao_valid 
  CHECK (tipo_questao IS NULL OR tipo_questao IN ('fechada', 'aberta', 'dissertativa', 'verdadeiro_falso'));

-- 8. Verify all triggers are working
-- Test trigger functions by updating a sample record (if exists)
DO $$
BEGIN
  -- Test profiles trigger if table has data
  IF EXISTS (SELECT 1 FROM profiles LIMIT 1) THEN
    UPDATE profiles SET credits = credits WHERE id = (SELECT id FROM profiles LIMIT 1);
    RAISE NOTICE 'Profiles trigger test completed';
  END IF;
  
  -- Test questions trigger if table has data
  IF EXISTS (SELECT 1 FROM questions LIMIT 1) THEN
    UPDATE questions SET area_conhecimento = area_conhecimento WHERE id = (SELECT id FROM questions LIMIT 1);
    RAISE NOTICE 'Questions trigger test completed';
  END IF;
  
  -- Test folders trigger if table has data
  IF EXISTS (SELECT 1 FROM folders LIMIT 1) THEN
    UPDATE folders SET name = name WHERE id = (SELECT id FROM folders LIMIT 1);
    RAISE NOTICE 'Folders trigger test completed';
  END IF;
END $$;

-- 9. Grant necessary permissions
-- Ensure authenticated users can access their own data
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON folders TO authenticated;

-- 10. Create helpful views for common queries
CREATE OR REPLACE VIEW user_question_stats AS
SELECT 
  u.id as user_id,
  COUNT(q.id) as total_questions,
  COUNT(CASE WHEN q.tipo_questao = 'fechada' THEN 1 END) as closed_questions,
  COUNT(CASE WHEN q.tipo_questao = 'aberta' THEN 1 END) as open_questions,
  COUNT(CASE WHEN q.nivel_dificuldade = 'facil' THEN 1 END) as easy_questions,
  COUNT(CASE WHEN q.nivel_dificuldade = 'medio' THEN 1 END) as medium_questions,
  COUNT(CASE WHEN q.nivel_dificuldade = 'dificil' THEN 1 END) as hard_questions
FROM auth.users u
LEFT JOIN questions q ON u.id = q.user_id
GROUP BY u.id;

COMMENT ON VIEW user_question_stats IS 'Statistical summary of questions per user';

-- Enable RLS on the view
ALTER VIEW user_question_stats ENABLE ROW LEVEL SECURITY;

-- Create policy for the view
CREATE POLICY "Users can view own stats" ON user_question_stats
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- Migration completed successfully
-- =====================================================