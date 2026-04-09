import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { useAuth } from './AuthGuard';
import { UserProfile, TradeLog, PortfolioHolding } from '../types';
import { MOCK_RANKERS } from '../mockData';
import { Trophy, Medal, Star, Filter, Search, ChevronRight, X, Zap, Target, Award, TrendingUp, Briefcase, History, PieChart as PieChartIcon, ArrowLeft, UserPlus, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, translateLeague } from '../lib/utils';
import { UserDetailModal } from './UserDetailModal';
import { LeagueBadge } from './LeagueBadge';

const COLORS = ['#EC7364', '#E6503D', '#C13D2D', '#9E3225', '#7C271D', '#5A1C15'];

const MOCK_DETAIL_HOLDINGS: PortfolioHolding[] = [
  { symbol: 'NVDA', name: 'Nvidia', weight: 45, value: 2400000 },
  { symbol: 'TSLA', name: 'Tesla', weight: 25, value: 2450000 },
  { symbol: 'AAPL', name: 'Apple', weight: 15, value: 1050000 },
  { symbol: 'BTC', name: 'Bitcoin', weight: 10, value: 9500000 },
  { symbol: 'ETH', name: 'Ethereum', weight: 5, value: 450000 },
];

const MOCK_DETAIL_TRADES: TradeLog[] = [
  { id: '1', uid: 'mock', symbol: 'TSLA', type: 'BUY', price: 245000, amount: 10, timestamp: new Date('2026-03-25').toISOString() },
  { id: '2', uid: 'mock', symbol: 'AAPL', type: 'SELL', price: 210000, amount: 5, timestamp: new Date('2026-03-20').toISOString() },
  { id: '3', uid: 'mock', symbol: 'NVDA', type: 'BUY', price: 1200000, amount: 2, timestamp: new Date('2026-03-15').toISOString() },
];

export default function RankingList() {
  const [rankers, setRankers] = useState<UserProfile[]>(MOCK_RANKERS.slice(0, 20));
  const [activeLeague, setActiveLeague] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const loadRankings = () => {
      const realUsers = storage.getUsers();
      
      // 실시간 데이터와 Mock 데이터를 병합하여 항상 20명을 유지
      const combined = [...realUsers];
      const realUids = new Set(realUsers.map(u => u.uid));
      
      MOCK_RANKERS.forEach(mockUser => {
        if (!realUids.has(mockUser.uid)) {
          combined.push(mockUser);
        }
      });

      // 점수 순으로 정렬 후 상위 20명 추출
      const sorted = combined
        .sort((a, b) => (b.tuhonScore || 0) - (a.tuhonScore || 0))
        .slice(0, 20);

      setRankers(sorted);
    };

    loadRankings();
    const interval = setInterval(loadRankings, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredRankers = rankers.filter(r => {
    const matchesLeague = activeLeague === 'All' || r.league === activeLeague;
    const matchesSearch = r.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLeague && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            Ranking <span className="text-orange-500">League</span>
          </h2>
          <p className="text-slate-500 font-medium">이번 시즌 당신의 열정 순위는 몇 위인가요? 실시간 랭킹을 확인하세요.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {['전체', '루키', '프로', '마스터'].map(l => (
            <button
              key={l}
              onClick={() => setActiveLeague(l === '전체' ? 'All' : l === '루키' ? 'Rookie' : l === '프로' ? 'Pro' : 'Master')}
              className={cn(
                "px-6 py-2 text-sm font-black rounded-xl uppercase tracking-widest transition-all",
                (activeLeague === 'All' && l === '전체') || (activeLeague === 'Rookie' && l === '루키') || (activeLeague === 'Pro' && l === '프로') || (activeLeague === 'Master' && l === '마스터')
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" 
                  : "bg-slate-900 text-slate-500 hover:text-slate-300 border border-slate-800"
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input 
          type="text" 
          placeholder="랭커 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 text-white pl-12 pr-6 py-4 rounded-2xl focus:outline-none focus:border-orange-600 transition-colors"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="grid grid-cols-12 px-4 md:px-8 py-4 bg-slate-800/50 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
          <div className="col-span-2 md:col-span-1">순위</div>
          <div className="col-span-6 md:col-span-4">필명</div>
          <div className="hidden md:block md:col-span-1 text-right">리그</div>
          <div className="col-span-4 md:col-span-2 text-right">수익률</div>
          <div className="hidden md:block md:col-span-2 text-right">팔로워</div>
          <div className="hidden md:block md:col-span-2 text-right">투혼 점수</div>
        </div>

        <div className="divide-y divide-slate-800">
          {filteredRankers.map((ranker, i) => (
            <motion.div 
              key={ranker.uid}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedUser(ranker)}
              className="grid grid-cols-12 px-4 md:px-8 py-6 items-center hover:bg-slate-800/30 transition-colors cursor-pointer group"
            >
              <div className="col-span-2 md:col-span-1 flex items-center gap-2">
                <span className={cn(
                  "text-base md:text-lg font-black",
                  i < 3 ? "text-orange-500" : "text-slate-600"
                )}>
                  #{i + 1}
                </span>
                {i === 0 && <Trophy className="hidden sm:block w-4 h-4 text-yellow-500" />}
              </div>
              <div className="col-span-6 md:col-span-4 flex items-center gap-3 md:gap-4">
                <img 
                  src={ranker.photoURL} 
                  alt={ranker.displayName} 
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-slate-800 group-hover:border-orange-500 transition-colors"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs md:text-sm font-bold text-white group-hover:text-orange-500 transition-colors truncate">{ranker.displayName}</p>
                    <div className="hidden sm:flex gap-1">
                      {ranker.badges?.slice(0, 2).map(badge => (
                        <span key={badge} className="text-[8px] font-black bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-tighter whitespace-nowrap">
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <LeagueBadge league={ranker.league} size="sm" className="md:hidden" />
                    <div className="sm:hidden flex gap-1">
                      {ranker.badges?.slice(0, 1).map(badge => (
                        <span key={badge} className="text-[8px] font-black bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="hidden md:block md:col-span-1 text-right">
                <LeagueBadge league={ranker.league} size="sm" className="ml-auto" />
              </div>
              <div className="col-span-4 md:col-span-2 text-right">
                <span className={cn(
                  "text-xs md:text-sm font-black",
                  (ranker.monthlyReturn || 0) > 0 ? "text-emerald-500" : "text-rose-500"
                )}>
                  {ranker.monthlyReturn !== undefined ? (ranker.monthlyReturn > 0 ? `+${ranker.monthlyReturn}` : ranker.monthlyReturn) : 0}%
                </span>
                <div className="md:hidden">
                  <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">{ranker.tuhonScore || 0} PTS</p>
                </div>
              </div>
              <div className="hidden md:block md:col-span-2 text-right">
                <span className="text-sm font-black text-slate-300">{(ranker.followers || 0).toLocaleString()}</span>
              </div>
              <div className="hidden md:block md:col-span-2 text-right flex items-center justify-end gap-4">
                <span className="text-sm font-black text-white">{ranker.tuhonScore || 0}</span>
                <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-orange-500 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedUser && (
          <UserDetailModal 
            user={selectedUser} 
            onClose={() => setSelectedUser(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
