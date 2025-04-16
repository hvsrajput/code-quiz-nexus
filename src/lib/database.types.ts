
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      quizzes: {
        Row: {
          id: string
          title: string
          description: string | null
          creator_id: string
          access_code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          creator_id: string
          access_code?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          creator_id?: string
          access_code?: string
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          quiz_id: string
          question_text: string
          question_type: 'multiple_choice' | 'true_false'
          order_num: number
          created_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          question_text: string
          question_type: 'multiple_choice' | 'true_false'
          order_num: number
          created_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          question_text?: string
          question_type?: 'multiple_choice' | 'true_false'
          order_num?: number
          created_at?: string
        }
      }
      answers: {
        Row: {
          id: string
          question_id: string
          answer_text: string
          is_correct: boolean
          order_num: number
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          answer_text: string
          is_correct?: boolean
          order_num: number
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          answer_text?: string
          is_correct?: boolean
          order_num?: number
          created_at?: string
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          quiz_id: string
          user_id: string
          score: number
          max_score: number
          completed: boolean
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          quiz_id: string
          user_id: string
          score?: number
          max_score?: number
          completed?: boolean
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          quiz_id?: string
          user_id?: string
          score?: number
          max_score?: number
          completed?: boolean
          started_at?: string
          completed_at?: string | null
        }
      }
      user_answers: {
        Row: {
          id: string
          attempt_id: string
          question_id: string
          answer_id: string | null
          is_correct: boolean
          created_at: string
        }
        Insert: {
          id?: string
          attempt_id: string
          question_id: string
          answer_id?: string | null
          is_correct?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          attempt_id?: string
          question_id?: string
          answer_id?: string | null
          is_correct?: boolean
          created_at?: string
        }
      }
    }
    Functions: {
      generate_unique_access_code: {
        Args: Record<string, never>
        Returns: string
      }
      find_quiz_by_access_code: {
        Args: { code: string }
        Returns: {
          id: string
          title: string
          description: string | null
          creator_id: string
          access_code: string
          created_at: string
        }[]
      }
      get_quiz_questions: {
        Args: { quiz_uuid: string }
        Returns: {
          question_id: string
          question_text: string
          question_type: string
          order_num: number
          answers: Json
        }[]
      }
      get_quiz_results: {
        Args: { attempt_uuid: string }
        Returns: {
          attempt_id: string
          quiz_id: string
          quiz_title: string
          user_id: string
          user_name: string
          score: number
          max_score: number
          percentage: number
          completed: boolean
          started_at: string
          completed_at: string | null
          question_results: Json
        }[]
      }
      complete_quiz_attempt: {
        Args: { attempt_id: string }
        Returns: void
      }
    }
  }
}
