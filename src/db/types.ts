// Database types generated from Supabase schema
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

/**
 * Supported languages for multilingual content
 */
export type SupportedLanguage = 'vi' | 'en'

/**
 * Translation status information for a content item
 */
export interface TranslationStatus {
  /** Whether Vietnamese content exists for all translatable fields */
  hasVietnamese: boolean
  /** Whether English translation exists for all translatable fields */
  hasEnglish: boolean
  /** Translation completeness percentage (0-100) */
  completeness: number
}

/**
 * Checks the translation status of a content item
 * @param item - The content item to check
 * @param translatableFields - Array of field names that should be translated
 * @returns Translation status information
 */
export function getTranslationStatus<T extends Record<string, any>>(
  item: T,
  translatableFields: string[]
): TranslationStatus {
  const hasVietnamese = translatableFields.every(
    field => item[field] && String(item[field]).trim().length > 0
  )

  const englishFields = translatableFields.map(f => `${f}_en`)
  const translatedCount = englishFields.filter(
    field => item[field] && String(item[field]).trim().length > 0
  ).length

  const hasEnglish = translatedCount === englishFields.length
  const completeness =
    hasVietnamese && hasEnglish
      ? 100
      : hasVietnamese
        ? 50 + (translatedCount / englishFields.length) * 50
        : 0

  return { hasVietnamese, hasEnglish, completeness }
}

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          preferred_language: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          preferred_language?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          preferred_language?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      languages: {
        Row: {
          id: string
          name: string
          display_name: string
          icon: string
          can_run_in_browser: boolean
          created_at: string
        }
        Insert: {
          id: string
          name: string
          display_name: string
          icon: string
          can_run_in_browser?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          icon?: string
          can_run_in_browser?: boolean
          created_at?: string
        }
      }
      chapters: {
        Row: {
          id: string
          language_id: string
          chapter_number: number
          title: string
          description: string | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          language_id: string
          chapter_number: number
          title: string
          description?: string | null
          order_index: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          language_id?: string
          chapter_number?: number
          title?: string
          description?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      lessons: {
        Row: {
          id: string
          chapter_id: string
          lesson_id: string
          title: string
          description: string | null
          code: string
          insight: string
          order_index: number
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          estimated_time: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chapter_id: string
          lesson_id: string
          title: string
          description?: string | null
          code: string
          insight: string
          order_index: number
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          estimated_time?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chapter_id?: string
          lesson_id?: string
          title?: string
          description?: string | null
          code?: string
          insight?: string
          order_index?: number
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          estimated_time?: number
          created_at?: string
          updated_at?: string
        }
      }
      exercises: {
        Row: {
          id: string
          lesson_id: string
          exercise_number: number
          question: string
          hint: string | null
          solution: string
          test_cases: Json | null
          difficulty: 'easy' | 'medium' | 'hard'
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          exercise_number: number
          question: string
          hint?: string | null
          solution: string
          test_cases?: Json | null
          difficulty?: 'easy' | 'medium' | 'hard'
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          exercise_number?: number
          question?: string
          hint?: string | null
          solution?: string
          test_cases?: Json | null
          difficulty?: 'easy' | 'medium' | 'hard'
          order_index?: number
          created_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          status: 'not_started' | 'in_progress' | 'completed'
          completed_at: string | null
          time_spent: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          status?: 'not_started' | 'in_progress' | 'completed'
          completed_at?: string | null
          time_spent?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string
          status?: 'not_started' | 'in_progress' | 'completed'
          completed_at?: string | null
          time_spent?: number
          created_at?: string
          updated_at?: string
        }
      }
      exercise_submissions: {
        Row: {
          id: string
          user_id: string
          exercise_id: string
          code: string
          is_correct: boolean
          submitted_at: string
          execution_time: number
        }
        Insert: {
          id?: string
          user_id: string
          exercise_id: string
          code: string
          is_correct: boolean
          submitted_at?: string
          execution_time: number
        }
        Update: {
          id?: string
          user_id?: string
          exercise_id?: string
          code?: string
          is_correct?: boolean
          submitted_at?: string
          execution_time?: number
        }
      }
      code_executions: {
        Row: {
          id: string
          user_id: string | null
          language: string
          code: string
          output: string | null
          error: string | null
          execution_time: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          language: string
          code: string
          output?: string | null
          error?: string | null
          execution_time: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          language?: string
          code?: string
          output?: string | null
          error?: string | null
          execution_time?: number
          created_at?: string
        }
      }
    }
  }
}
