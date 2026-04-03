import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, db, handleFirestoreError, OperationType } from '../firebase';
import { LogIn, Loader2, ShieldAlert, X } from 'lucide-react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
        setLoading(false);
      } else {
        const initialProfile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || '익명',
          photoURL: user.photoURL || '',
          totalAssets: 10000000,
          monthlyReturn: 0,
          monthlyProfit: 0,
          monthlyReturnsHistory: [
            { month: '10월', return: 4.2 },
            { month: '11월', return: -2.1 },
            { month: '12월', return: 8.5 },
            { month: '1월', return: 3.8 },
            { month: '2월', return: -1.2 },
            { month: '3월', return: 0 },
          ],
          mdd: 0,
          sharpeRatio: 0,
          tuhonScore: 0,
          totalReturn: 0,
          followers: 0,
          league: 'Rookie',
          badges: ['Newcomer'],
          role: 'user',
          updatedAt: serverTimestamp()
        };
        setDoc(userRef, initialProfile).catch(err => {
          setLoading(false);
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        });
        // loading will be set to false in the next snapshot when docSnap.exists() is true
      }
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
              Monthly <span className="text-orange-500">Tuhon</span>
            </h1>
            <p className="text-slate-400 text-lg">기록은 배신하지 않습니다. 숫자로 당신의 투혼을 증명하세요.</p>
          </div>
          
          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-xl space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">다시 오신 것을 환영합니다</h2>
              <p className="text-slate-500">리그에 참여하고 성과를 추적하려면 로그인하세요.</p>
            </div>
            
            <button
              onClick={() => {
                setError(null);
                signInWithGoogle().catch(err => {
                  console.error("Login Error:", err);
                  setError(`로그인 중 오류가 발생했습니다: ${err.message}\nFirebase 콘솔에서 승인된 도메인을 확인해 주세요.`);
                });
              }}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-950 font-bold py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-white/5"
            >
              <LogIn className="w-5 h-5" />
              Google로 계속하기
            </button>
          </div>
          
          <div className="flex justify-center gap-8 text-slate-600 text-xs font-medium uppercase tracking-widest">
            <span>루키</span>
            <span>프로</span>
            <span>마스터</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] w-full max-w-md px-4"
          >
            <div className="bg-rose-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5" />
                <p className="text-sm font-bold">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </AuthContext.Provider>
  );
};
