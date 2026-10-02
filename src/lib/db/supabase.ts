import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      assessments: {
        Row: {
          id: string
          profile_id: string
          status: 'in_progress' | 'submitted'
          progress_percent: number
          started_at: string
          submitted_at: string | null
          submission_reference: string | null
          questionnaire_version: any
          source_versions: any
        }
        Insert: {
          id?: string
          profile_id: string
          status?: 'in_progress' | 'submitted'
          progress_percent?: number
          started_at?: string
          submitted_at?: string | null
          submission_reference?: string | null
          questionnaire_version?: any
          source_versions?: any
        }
        Update: {
          id?: string
          profile_id?: string
          status?: 'in_progress' | 'submitted'
          progress_percent?: number
          started_at?: string
          submitted_at?: string | null
          submission_reference?: string | null
          questionnaire_version?: any
          source_versions?: any
        }
      }
      responses: {
        Row: {
          id: string
          assessment_id: string
          question_id: string
          raw_value: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          assessment_id: string
          question_id: string
          raw_value: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          assessment_id?: string
          question_id?: string
          raw_value?: any
          created_at?: string
          updated_at?: string
        }
      }
      scores: {
        Row: {
          id: string
          assessment_id: string
          mr_score: number | null
          biological_state: number | null
          confidence_label: 'Low' | 'Moderate' | 'High' | null
          scoring_version: string
          source_versions: any
          calculation_trace: any
          created_at: string
        }
        Insert: {
          id?: string
          assessment_id: string
          mr_score?: number | null
          biological_state?: number | null
          confidence_label?: 'Low' | 'Moderate' | 'High' | null
          scoring_version?: string
          source_versions?: any
          calculation_trace?: any
          created_at?: string
        }
        Update: {
          id?: string
          assessment_id?: string
          mr_score?: number | null
          biological_state?: number | null
          confidence_label?: 'Low' | 'Moderate' | 'High' | null
          scoring_version?: string
          source_versions?: any
          calculation_trace?: any
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          assessment_id: string
          status: 'pending' | 'completed' | 'failed'
          report_reference: string | null
          canonical_json: any
          generation_metadata: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          assessment_id: string
          status?: 'pending' | 'completed' | 'failed'
          report_reference?: string | null
          canonical_json?: any
          generation_metadata?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          assessment_id?: string
          status?: 'pending' | 'completed' | 'failed'
          report_reference?: string | null
          canonical_json?: any
          generation_metadata?: any
          created_at?: string
          updated_at?: string
        }
      }
      consents: {
        Row: {
          id: string
          profile_id: string
          consent_type: 'service' | 'research' | 'marketing'
          granted: boolean
          granted_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          consent_type: 'service' | 'research' | 'marketing'
          granted: boolean
          granted_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          consent_type?: 'service' | 'research' | 'marketing'
          granted?: boolean
          granted_at?: string
        }
      }
    }
  }
}
