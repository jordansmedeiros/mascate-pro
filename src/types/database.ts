// Database Types for Mascate Pro Educational Platform
// Generated based on Supabase schema audit

/**
 * Profile data linked to auth.users
 * Table: public.profiles
 */
export interface Profile {
  id: string; // uuid, References auth.users(id)
  credits: number; // integer, default 10
  avatar_url?: string; // text, nullable
  is_active: boolean; // boolean, default true
  created_at: string; // timestamptz, default now()
  updated_at: string; // timestamptz, default now()
}

/**
 * Educational questions with detailed metadata
 * Table: public.questions
 */
export interface Question {
  id: string; // uuid, primary key
  user_id: string; // uuid, references auth.users(id)
  created_at: string; // timestamptz, default now()
  
  // Core question data
  area_conhecimento: string; // text, not null
  texto_apoio: string; // text, not null  
  enunciado: string; // text, not null
  alternativas?: QuestionAlternatives; // jsonb, nullable
  resposta_correta?: string; // text, nullable
  justificativa?: string; // text, nullable
  image_url?: string; // text, nullable
  
  // Educational metadata
  disciplina?: string; // text, nullable
  competencia?: string; // text, nullable
  habilidade?: string; // text, nullable
  modo_geracao?: string; // text, nullable
  eixos_cognitivos?: EixosCognitivos; // jsonb, nullable
  nivel_dificuldade?: string; // text, nullable
  tipo_questao?: string; // text, nullable
  topicos?: Topicos; // jsonb, nullable
  uso_de_imagem?: string; // text, nullable
  objetivo_pedagogico?: string; // text, nullable
  conceitos_prerequisitos?: string; // text, nullable
  dificuldades_esperadas?: string; // text, nullable
  sugestoes_ensino?: string; // text, nullable
  conexoes_interdisciplinares?: string; // text, nullable
  
  // Organization
  folder_id?: string; // uuid, nullable, references folders(id)
  
  // Open questions additional fields
  resolucao_passo_a_passo?: string; // text, nullable
  guia_de_pontuacao?: GuiaPontuacao; // jsonb, nullable
  rubrica_avaliacao?: RubricaAvaliacao; // jsonb, nullable
}

/**
 * Question alternatives structure (JSONB)
 */
export interface QuestionAlternatives {
  [key: string]: string; // e.g., { "A": "Option A", "B": "Option B", ... }
}

/**
 * Cognitive axes structure (JSONB)  
 */
export interface EixosCognitivos {
  [key: string]: any; // Flexible structure for cognitive taxonomy
}

/**
 * Topics structure (JSONB)
 */
export interface Topicos {
  [key: string]: any; // Flexible structure for topic categorization
}

/**
 * Scoring guide structure (JSONB)
 */
export interface GuiaPontuacao {
  criterios?: Array<{
    descricao: string;
    pontuacao_maxima: number;
    niveis?: Array<{
      nivel: string;
      pontos: number;
      descricao: string;
    }>;
  }>;
  total_pontos?: number;
}

/**
 * Evaluation rubric structure (JSONB)
 */
export interface RubricaAvaliacao {
  dimensoes?: Array<{
    nome: string;
    descricao: string;
    peso?: number;
    criterios: Array<{
      nivel: string;
      descricao: string;
      pontuacao: number;
    }>;
  }>;
}

/**
 * Assessment collections
 * Table: public.assessments
 */
export interface Assessment {
  id: string; // uuid, primary key
  user_id?: string; // uuid, nullable, references auth.users(id)
  name: string; // varchar, not null
  description?: string; // text, nullable
  question_ids: string[]; // text[], not null
  include_answers?: boolean; // boolean, default true
  created_at?: string; // timestamptz, default now()
  updated_at?: string; // timestamptz, default now()
}

/**
 * Folder organization structure
 * Table: public.folders
 */
export interface Folder {
  id: string; // uuid, primary key
  user_id: string; // uuid, not null, references auth.users(id)
  name: string; // text, not null
  color?: string; // text, nullable
  created_at?: string; // timestamptz, default now()
  updated_at?: string; // timestamptz, default now()
}

// Form data types for create/update operations
export interface ProfileFormData {
  credits?: number;
  avatar_url?: string;
  is_active?: boolean;
}

export interface QuestionFormData {
  area_conhecimento: string;
  texto_apoio: string;
  enunciado: string;
  alternativas?: QuestionAlternatives;
  resposta_correta?: string;
  justificativa?: string;
  image_url?: string;
  disciplina?: string;
  competencia?: string;
  habilidade?: string;
  modo_geracao?: string;
  eixos_cognitivos?: EixosCognitivos;
  nivel_dificuldade?: string;
  tipo_questao?: string;
  topicos?: Topicos;
  uso_de_imagem?: string;
  objetivo_pedagogico?: string;
  conceitos_prerequisitos?: string;
  dificuldades_esperadas?: string;
  sugestoes_ensino?: string;
  conexoes_interdisciplinares?: string;
  folder_id?: string;
  resolucao_passo_a_passo?: string;
  guia_de_pontuacao?: GuiaPontuacao;
  rubrica_avaliacao?: RubricaAvaliacao;
}

export interface AssessmentFormData {
  name: string;
  description?: string;
  question_ids: string[];
  include_answers?: boolean;
}

export interface FolderFormData {
  name: string;
  color?: string;
}

// Database relationships and joins
export interface QuestionWithFolder extends Question {
  folder?: Folder;
}

export interface AssessmentWithQuestions extends Assessment {
  questions?: Question[];
}

// Query parameter types
export interface QuestionsQueryParams {
  area_conhecimento?: string;
  disciplina?: string;
  nivel_dificuldade?: string;
  tipo_questao?: string;
  folder_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
  order_by?: string;
  order_direction?: 'asc' | 'desc';
}

export interface AssessmentsQueryParams {
  search?: string;
  include_answers?: boolean;
  limit?: number;
  offset?: number;
  order_by?: string;
  order_direction?: 'asc' | 'desc';
}

export interface FoldersQueryParams {
  search?: string;
  limit?: number;
  offset?: number;
  order_by?: string;
  order_direction?: 'asc' | 'desc';
}

// API Response types
export interface DatabaseResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends DatabaseResponse<T[]> {
  pagination: {
    total: number;
    limit: number;
    offset: number;
    page: number;
    total_pages: number;
  };
}

// Database schema type for type checking
export interface DatabaseSchema {
  profiles: Profile;
  questions: Question;
  assessments: Assessment;
  folders: Folder;
}

// Utility types
export type CreateQuestionInput = Omit<Question, 'id' | 'created_at' | 'user_id'>;
export type UpdateQuestionInput = Partial<Omit<Question, 'id' | 'created_at' | 'user_id'>>;
export type CreateAssessmentInput = Omit<Assessment, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
export type UpdateAssessmentInput = Partial<Omit<Assessment, 'id' | 'created_at' | 'user_id'>>;
export type CreateFolderInput = Omit<Folder, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
export type UpdateFolderInput = Partial<Omit<Folder, 'id' | 'created_at' | 'user_id'>>;

// Constants based on database constraints
export const QUESTION_TYPES = {
  FECHADA: 'fechada',
  ABERTA: 'aberta',
  DISSERTATIVA: 'dissertativa',
  VERDADEIRO_FALSO: 'verdadeiro_falso',
} as const;

export const DIFFICULTY_LEVELS = {
  FACIL: 'facil',
  MEDIO: 'medio', 
  DIFICIL: 'dificil',
} as const;

export const KNOWLEDGE_AREAS = {
  MATEMATICA: 'matematica',
  PORTUGUES: 'portugues',
  HISTORIA: 'historia',
  GEOGRAFIA: 'geografia',
  CIENCIAS: 'ciencias',
  FISICA: 'fisica',
  QUIMICA: 'quimica',
  BIOLOGIA: 'biologia',
} as const;

export type QuestionType = typeof QUESTION_TYPES[keyof typeof QUESTION_TYPES];
export type DifficultyLevel = typeof DIFFICULTY_LEVELS[keyof typeof DIFFICULTY_LEVELS];
export type KnowledgeArea = typeof KNOWLEDGE_AREAS[keyof typeof KNOWLEDGE_AREAS];