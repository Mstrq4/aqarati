// Aqarati Mobile — Auth Context (stub with realistic state)
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User, UserProfile } from '../types';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isSignedIn: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  isSignedIn: false,
  signIn: async () => {},
  signOut: async () => {},
  updateProfile: () => {},
});

// Demo user for development
const MOCK_USER: User = {
  id: 'u-001',
  email: 'agent@aqarati.sa',
  phone: '+966501234567',
  status: 'active',
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2026-06-15T00:00:00Z',
};

const MOCK_PROFILE: UserProfile = {
  user_id: 'u-001',
  full_name: 'أحمد العقاري',
  avatar_url: undefined,
  language: 'ar',
  country_code: 'SA',
  timezone: 'Asia/Riyadh',
  verified: true,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(MOCK_USER);
  const [profile, setProfile] = useState<UserProfile | null>(MOCK_PROFILE);

  const signIn = useCallback(async (_email: string, _password: string) => {
    setUser(MOCK_USER);
    setProfile(MOCK_PROFILE);
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    setProfile(null);
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isSignedIn: !!user,
        signIn,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
