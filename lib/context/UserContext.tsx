import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
  college_id: string | null;
  gender: 'male' | 'female' | 'other' | null;
  language_preference: 'ar' | 'en';
  created_at: string;
  updated_at: string;
};

export type UserContextType = {
  user: User | null;
  userProfile: Profile | null;
  setUserProfile: (profile: Profile | null) => void;
  signOut: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          // Fetch user profile when auth state changes
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setUserProfile(profileData);
        } else {
          setUser(null);
          setUserProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    userProfile,
    setUserProfile,
    signOut: async () => {
      await supabase.auth.signOut();
      router.replace('/login');
    },
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 