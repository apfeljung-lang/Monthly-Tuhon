import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Globe, Trophy, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthGuard';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { MOCK_RANKERS } from '../mockData';

function RealtimeRanking() {
  const [topUsers, setTopUsers] = useState<UserProfile[]>(MOCK_RANKERS.slice(0, 5));

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      orderBy('tuhonScore', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const realUsers = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserProfile[];
      
      // 실시간 데이터와 Mock 데이터를 병합하여 항상 5명을 유지
      const combined = [...realUsers];
      const realUids = new Set(realUsers.map(u => u.uid));
      
      MOCK_RANKERS.forEach(mockUser => {
        if (!realUids.has(mockUser.uid)) {
          combined.push(mockUser);
        }
      });

      // 점수 순으로 정렬 후 상위 5명 추출
      const sorted = combined
        .sort((a, b) => (b.tuhonScore || 0) - (a.tuhonScore || 0))
        .slice(0, 5);
        
      setTopUsers(sorted);
    }, (error) => {
      console.error("Home Ranking Snapshot Error:", error);
      // 에러 발생 시 Mock 데이터로 유지
      setTopUsers(MOCK_RANKERS.slice(0, 5));
    });

    return () => unsubscribe();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative z-20 w-full max-w-lg"
    >
      <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
            <h3 className="text-xs md:text-sm font-black text-white uppercase tracking-[0.2em]">Real-time Ranking</h3>
          </div>
          <div className="flex items-center gap-2 bg-green-500/10 px-2 md:px-3 py-1 rounded-full border border-green-500/20">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[8px] md:text-[10px] font-black text-green-500 uppercase tracking-widest">Live</span>
          </div>
        </div>

        <div className="space-y-4 md:space-y-6">
          {topUsers.length > 0 ? (
            topUsers.map((user, index) => (
              <div key={user.uid} className="flex items-center justify-between group">
                <div className="flex items-center gap-3 md:gap-4">
                  <span className={`text-base md:text-lg font-black ${index === 0 ? 'text-orange-500' : 'text-slate-700'}`}>
                    {index + 1}
                  </span>
                  <div className="relative">
                    <img 
                      src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} 
                      className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border border-slate-800 object-cover"
                      alt={user.displayName}
                    />
                    {index === 0 && (
                      <div className="absolute -top-1.5 -right-1.5 bg-orange-500 rounded-lg p-0.5 md:p-1 shadow-lg">
                        <Trophy className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm font-black text-white uppercase tracking-tight truncate w-24 md:w-32">
                      {user.displayName}
                    </p>
                    <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {user.league || 'Rookie'} League
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                    <p className="text-xs md:text-sm font-black text-green-500">
                      +{user.monthlyReturn || 0}%
                    </p>
                  </div>
                  <p className="text-[8px] md:text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    Score: {user.tuhonScore || 0}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">랭킹 데이터를 불러오는 중...</p>
            </div>
          )}
        </div>

        <Link 
          to="/ranking"
          className="mt-10 block w-full py-5 bg-white text-black hover:bg-orange-500 hover:text-white text-xs font-black text-center uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-white/5"
        >
          View Full Leaderboard
        </Link>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex flex-col justify-center overflow-hidden px-4 md:px-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[800px] h-[300px] md:h-[800px] bg-orange-600/10 blur-[100px] md:blur-[180px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-8 md:space-y-10 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 md:space-y-6"
            >
              <span className="inline-block px-4 py-1.5 bg-orange-600/10 text-orange-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] rounded-full border border-orange-500/20">
                The Ultimate Trading League
              </span>
              <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter uppercase italic leading-[0.85]">
                Monthly <br />
                <span className="text-orange-500">Tuhon</span>
              </h1>
              <p className="text-slate-400 text-base md:text-xl max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
                당신의 투자 열정을 숫자로 증명하세요. <br className="hidden md:block" />
                대한민국 최고의 트레이더들과 경쟁하고 성장하는 커뮤니티.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Link 
                to="/join-league"
                className="w-full sm:w-auto px-10 py-5 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-2xl transition-all shadow-2xl shadow-orange-600/20 uppercase tracking-widest flex items-center justify-center gap-3"
              >
                지금 참여하기 <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                to="/ranking"
                className="w-full sm:w-auto px-10 py-5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl transition-all border border-slate-800 uppercase tracking-widest text-center"
              >
                랭킹 확인하기
              </Link>
            </motion.div>

            {/* Floating Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-4">
              {[
                { label: 'Active Users', value: '12,402+' },
                { label: 'Total Volume', value: '₩842B+' },
                { label: 'Avg. Return', value: '14.2%' },
                { label: 'Community', value: 'Top 1%' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="text-center lg:text-left"
                >
                  <p className="text-2xl font-black text-white tracking-tighter">{stat.value}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <RealtimeRanking />
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[3rem] p-12 md:p-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/5 blur-[120px] rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-6 max-w-xl">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-tight">
              Ready to prove <br />
              your <span className="text-orange-500">Tuhon?</span>
            </h2>
            <p className="text-slate-400 text-lg">
              지금 바로 리그에 참여하고 시즌 1 랭킹 경쟁을 시작하세요. 
              당신의 투혼이 보상받는 순간이 시작됩니다.
            </p>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map(i => (
                  <img 
                    key={i}
                    src={`https://picsum.photos/seed/user${i}/100/100`} 
                    className="w-12 h-12 rounded-full border-4 border-slate-900"
                    alt="User"
                  />
                ))}
              </div>
              <p className="text-sm font-bold text-slate-300">
                <span className="text-orange-500">500+</span> 명의 트레이더가 오늘 가입했습니다.
              </p>
            </div>
          </div>
          <Link 
            to="/join-league"
            className="w-full md:w-auto px-12 py-6 bg-white text-black font-black rounded-[2rem] uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-2xl shadow-white/5 text-center"
          >
            지금 시작하기
          </Link>
        </div>
      </section>

      {/* Footer Info */}
      <footer className="pt-12 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-500" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Trading Community</span>
        </div>
        <div className="flex gap-8">
          {['Terms', 'Privacy', 'Support', 'API'].map(item => (
            <a key={item} href="#" className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">
              {item}
            </a>
          ))}
        </div>
        <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
          © 2026 Monthly Tuhon. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
