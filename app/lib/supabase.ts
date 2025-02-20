import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL');
}

if (!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Types for the database schema
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Ride = Database['public']['Tables']['rides']['Row'];
export type BusSchedule = Database['public']['Tables']['bus_schedules']['Row'];
export type BusScheduleFavorite = Database['public']['Tables']['bus_schedule_favorites']['Row'];

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: Error) => {
  console.error('Supabase error:', error.message);
  throw error;
}; 