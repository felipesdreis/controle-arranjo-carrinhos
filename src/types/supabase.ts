// Hand-authored — modela o schema PostgreSQL planejado do Supabase (EP-03) com UUIDs.
// Os nomes de campos foram informados pelo schema legado SQLite em public/schema.sql,
// mas os tipos refletem o schema Postgres: ids e FKs são UUID (string), active é boolean.
// Substituir este arquivo pela geração automática quando o schema EP-03 existir no Supabase:
//   npx supabase gen types typescript --project-id <id> > src/types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/** Inteiro 0-6 representando dia da semana (0 = domingo … 6 = sábado). */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface Database {
  public: {
    Tables: {
      brothers: {
        Row: {
          id: string
          user_id: string
          created_at: string
          name: string
          phone: string | null
          notes: string | null
          active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          name: string
          phone?: string | null
          notes?: string | null
          active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          name?: string
          phone?: string | null
          notes?: string | null
          active?: boolean
        }
      }
      carts: {
        Row: {
          id: string
          user_id: string
          created_at: string
          name: string
          description: string | null
          active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          name: string
          description?: string | null
          active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          name?: string
          description?: string | null
          active?: boolean
        }
      }
      locations: {
        Row: {
          id: string
          user_id: string
          created_at: string
          name: string
          address: string | null
          notes: string | null
          active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          name: string
          address?: string | null
          notes?: string | null
          active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          name?: string
          address?: string | null
          notes?: string | null
          active?: boolean
        }
      }
      groups: {
        Row: {
          id: string
          user_id: string
          name: string
          responsible_id: string | null
          active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          responsible_id?: string | null
          active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          responsible_id?: string | null
          active?: boolean
        }
      }
      slots: {
        Row: {
          id: string
          user_id: string
          location_id: string
          cart_id: string | null
          group_id: string | null
          day_of_week: DayOfWeek
          start_time: string // HH:MM
          end_time: string   // HH:MM
          capacity: number
          active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          location_id: string
          cart_id?: string | null
          group_id?: string | null
          day_of_week: DayOfWeek
          start_time: string
          end_time: string
          capacity?: number
          active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          location_id?: string
          cart_id?: string | null
          group_id?: string | null
          day_of_week?: DayOfWeek
          start_time?: string
          end_time?: string
          capacity?: number
          active?: boolean
        }
      }
      schedule_weeks: {
        Row: {
          id: string
          user_id: string
          created_at: string
          week_start: string // YYYY-MM-DD, sempre segunda-feira
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          week_start: string
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          week_start?: string
          notes?: string | null
        }
      }
      assignments: {
        Row: {
          id: string
          user_id: string
          created_at: string
          week_id: string
          slot_id: string
          brother_id: string
          position: number // >= 1; UNIQUE(week_id, slot_id, position)
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          week_id: string
          slot_id: string
          brother_id: string
          position: number
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          week_id?: string
          slot_id?: string
          brother_id?: string
          position?: number
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string // unique
          created_at: string
          congregation_name: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          congregation_name?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          congregation_name?: string | null
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Helpers para extrair tipos de linha das tabelas
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
