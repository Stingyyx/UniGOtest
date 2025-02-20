import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please check your app.config.ts file.');
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: {
        async getItem(key: string) {
          try {
            return await localStorage.getItem(key);
          } catch {
            return null;
          }
        },
        async setItem(key: string, value: string) {
          try {
            await localStorage.setItem(key, value);
          } catch {}
        },
        async removeItem(key: string) {
          try {
            await localStorage.removeItem(key);
          } catch {}
        },
      },
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Add default export
export default supabase;

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