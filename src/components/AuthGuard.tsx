import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { storage } from '../services/storage';
import { UserProfile } from '../types';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: { uid: string; displayName: string; email: string; photoURL: string } | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 로컬 스토리지에서 프로필 로드 (자동 로그인 효과)
    const localProfile = storage.getProfile();
    setProfile(localProfile);
    setLoading(false);
  }, []);

  const user = profile ? {
    uid: profile.uid,
    displayName: profile.displayName,
    email: 'local@tuhon.app',
    photoURL: profile.photoURL
  } : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
