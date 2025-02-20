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
      profiles: {
        Row: {
          id: string
          full_name: string | null
          username: string | null
          email: string | null
          avatar_url: string | null
          gender: 'male' | 'female' | 'other' | null
          college_id: string | null
          language_preference: 'ar' | 'en'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          username?: string | null
          email?: string | null
          avatar_url?: string | null
          gender?: 'male' | 'female' | 'other' | null
          college_id?: string | null
          language_preference?: 'ar' | 'en'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          username?: string | null
          email?: string | null
          avatar_url?: string | null
          gender?: 'male' | 'female' | 'other' | null
          college_id?: string | null
          language_preference?: 'ar' | 'en'
          created_at?: string
          updated_at?: string
        }
      }
      rides: {
        Row: {
          id: string
          driver_id: string
          from_location: string
          to_location: string
          departure_time: string
          total_seats: number
          available_seats: number
          gender_preference: 'any' | 'male' | 'female'
          status: 'active' | 'full' | 'cancelled' | 'completed'
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          driver_id: string
          from_location: string
          to_location: string
          departure_time: string
          total_seats: number
          available_seats: number
          gender_preference: 'any' | 'male' | 'female'
          status?: 'active' | 'full' | 'cancelled' | 'completed'
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          driver_id?: string
          from_location?: string
          to_location?: string
          departure_time?: string
          total_seats?: number
          available_seats?: number
          gender_preference?: 'any' | 'male' | 'female'
          status?: 'active' | 'full' | 'cancelled' | 'completed'
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ride_requests: {
        Row: {
          id: string
          ride_id: string
          passenger_id: string
          status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
          message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ride_id: string
          passenger_id: string
          status?: 'pending' | 'accepted' | 'rejected' | 'cancelled'
          message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ride_id?: string
          passenger_id?: string
          status?: 'pending' | 'accepted' | 'rejected' | 'cancelled'
          message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bus_schedules: {
        Row: {
          id: string
          route_name: string
          departure_time: string
          arrival_time: string
          stops: Json[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          route_name: string
          departure_time: string
          arrival_time: string
          stops: Json[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          route_name?: string
          departure_time?: string
          arrival_time?: string
          stops?: Json[]
          created_at?: string
          updated_at?: string
        }
      }
      bus_schedule_favorites: {
        Row: {
          id: string
          user_id: string
          schedule_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          schedule_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          schedule_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export default Database; 