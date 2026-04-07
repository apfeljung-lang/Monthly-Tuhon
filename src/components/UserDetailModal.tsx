import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit, doc, setDoc, deleteDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthGuard';
import { UserProfile, TradeLog, PortfolioHolding } from '../types';
import { X, Zap, Target, Award, TrendingUp, Briefcase, History, PieChart as PieChartIcon, ArrowLeft, UserPlus, UserCheck, Trophy, Medal, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { cn, translateLeague } from '../lib/utils';

const COLORS = ['#EC7364', '#E6503D', '#C13D2D', '#9E3225', '#7C271D', '#5A1C15'];

const getBadgeIcon = (badge: string) => {
  switch (badge) {
    case 'Top 1%': return <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />;
    case 'Legend': return <Trophy className="w-3 h-3 text-orange-500 fill-orange-500" />;
    case 'Rising Star': return <TrendingUp className="w-3 h-3 text-emerald-500" />;
    case 'Consistent': return <Target className="w-3 h-3 text-blue-500" />;
    case 'Newcomer': return <Star className="w-3 h-3 text-purple-500 fill-purple-500" />;
    case 'Alpha': return <Zap className="w-3 h-3 text-red-500" />;
    case 'Beta': return <Medal className="w-3 h-3 text-slate-400" />;
    case 'Gamma': return <Award className="w-3 h-3 text-amber-700" />;
    default: return null;
  }
};

const MOCK_DETAIL_HOLDINGS: PortfolioHolding[] = [
  { symbol: 'NVDA', name: 'Nvidia', weight: 45, value: 2400000 },
  { symbol: 'TSLA', name: 'Tesla', weight: 25, value: 2450000 },
  { symbol: 'AAPL', name: 'Apple', weight: 15, value: 1050000 },
  { symbol: 'BTC', name: 'Bitcoin', weight: 10, value: 9500000 },
  { symbol: 'ETH', name: 'Ethereum', weight: 5, value: 450000 },
];

const MOCK_DETAIL_TRADES: TradeLog[] = [
  { id: '1', uid: 'mock', symbol: 'TSLA', type: 'BUY', price: 245000, amount: 10, timestamp: { toDate: () => new Date('2026-03-25') } },
  { id: '2', uid: 'mock', symbol: 'AAPL', type: 'SELL', price: 210000, amount: 5, timestamp: { toDate: () => new Date('2026-03-20') } },
  { id: '3', uid: 'mock', symbol: 'NVDA', type: 'BUY', price: 1200000, amount: 2, timestamp: { toDate: () => new Date('2026-03-15') } },
];

export const UserDetailModal = ({ user: targetUser, onClose }: { user: UserProfile, onClose: () => void }) => {
  const { user: currentUser } = useAuth();
  const [view, setView] = useState<'overview' | 'portfolio'>('overview');
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [trades, setTrades] = useState<TradeLog[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.uid === targetUser.uid) return;

    const followRef = doc(db, 'users', currentUser.uid, 'following', targetUser.uid);
    const unsubFollow = onSnapshot(followRef, (docSnap) => {
      setIsFollowing(docSnap.exists());
    });

    return () => unsubFollow();
  }, [currentUser, targetUser.uid]);

  useEffect(() => {
    if (view === 'portfolio') {
      const qHoldings = query(collection(db, 'users', targetUser.uid, 'portfolio'), orderBy('weight', 'desc'));
      const unsubHoldings = onSnapshot(qHoldings, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioHolding));
        setHoldings(data.length > 0 ? data : MOCK_DETAIL_HOLDINGS);
      });

      const qTrades = query(collection(db, 'users', targetUser.uid, 'trades'), orderBy('timestamp', 'desc'), limit(10));
      const unsubTrades = onSnapshot(qTrades, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradeLog));
        setTrades(data.length > 0 ? data : MOCK_DETAIL_TRADES);
      });

      return () => {
        unsubHoldings();
        unsubTrades();
      };
    }
  }, [view, targetUser.uid]);

  const handleFollow = async () => {
    if (!currentUser || isFollowLoading) return;
    if (currentUser.uid === targetUser.uid) return;

    setIsFollowLoading(true);
    try {
      const followingRef = doc(db, 'users', currentUser.uid, 'following', targetUser.uid);
      const followerRef = doc(db, 'users', targetUser.uid, 'followers', currentUser.uid);
      const targetProfileRef = doc(db, 'users', targetUser.uid);

      if (isFollowing) {
        // Unfollow
        await deleteDoc(followingRef);
        await deleteDoc(followerRef);
        await updateDoc(targetProfileRef, {
          followers: increment(-1)
        });
      } else {
        // Follow
        await setDoc(followingRef, {
          uid: targetUser.uid,
          displayName: targetUser.displayName,
          photoURL: targetUser.photoURL,
          timestamp: serverTimestamp()
        });
        await setDoc(followerRef, {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          timestamp: serverTimestamp()
        });
        await updateDoc(targetProfileRef, {
          followers: increment(1)
        });
      }
    } catch (error) {
      console.error("Follow error:", error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const chartData = [
    { name: 'Week 1', value: 2.4 },
    { name: 'Week 2', value: 5.8 },
    { name: 'Week 3', value: 3.2 },
    { name: 'Week 4', value: 7.5 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative h-32 bg-gradient-to-r from-orange-600 to-rose-600 shrink-0">
          <div className="absolute top-4 left-4 flex gap-2">
            {view === 'portfolio' && (
              <button 
                onClick={() => setView('overview')}
                className="p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute -bottom-12 left-4 md:left-8 flex items-end gap-4 md:gap-6">
            <img 
              src={targetUser.photoURL} 
              alt={targetUser.displayName} 
              className="w-20 h-20 md:w-24 md:h-24 rounded-2xl md:rounded-3xl border-4 border-slate-900 shadow-xl"
              referrerPolicy="no-referrer"
            />
            <div className="mb-2">
              <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter truncate w-32 md:w-auto">{targetUser.displayName}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[8px] md:text-[10px] font-black bg-orange-600 text-white px-2 py-0.5 rounded uppercase tracking-widest">
                  {translateLeague(targetUser.league)} 리그
                </span>
                <div className="flex gap-2">
                  {targetUser.badges?.map(badge => (
                    <div key={badge} title={badge} className="flex items-center justify-center bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
                      {getBadgeIcon(badge)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-16 p-4 md:p-8 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {view === 'overview' ? (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6 md:space-y-8"
              >
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  <div className="bg-slate-800/50 p-3 md:p-4 rounded-2xl border border-slate-700/50">
                    <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">총 자산</p>
                    <p className="text-xs md:text-sm font-black text-white">₩{(targetUser.totalAssets || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-800/50 p-3 md:p-4 rounded-2xl border border-slate-700/50">
                    <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">수익률</p>
                    <p className={cn(
                      "text-xs md:text-sm font-black",
                      (targetUser.monthlyReturn || 0) > 0 ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {targetUser.monthlyReturn > 0 ? '+' : ''}{targetUser.monthlyReturn || 0}%
                    </p>
                  </div>
                  <div className="bg-slate-800/50 p-3 md:p-4 rounded-2xl border border-slate-700/50">
                    <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">투혼 점수</p>
                    <p className="text-xs md:text-sm font-black text-orange-500">{targetUser.tuhonScore || 0}</p>
                  </div>
                  <div className="bg-slate-800/50 p-3 md:p-4 rounded-2xl border border-slate-700/50">
                    <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">팔로워</p>
                    <p className="text-xs md:text-sm font-black text-white">{(targetUser.followers || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-white uppercase tracking-widest">수익률</h4>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">최근 30일</span>
                  </div>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorValueModal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#E6503D" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#E6503D" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" hide />
                        <YAxis hide domain={['auto', 'auto']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                          itemStyle={{ color: '#E6503D', fontWeight: 'bold' }}
                          formatter={(value: number) => [`${value}%`, '수익률']}
                        />
                        <Area type="monotone" dataKey="value" stroke="#E6503D" strokeWidth={3} fillOpacity={1} fill="url(#colorValueModal)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={handleFollow}
                    disabled={isFollowLoading || currentUser?.uid === targetUser.uid}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-[10px] md:text-xs shadow-lg",
                      isFollowing 
                        ? "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700" 
                        : "bg-orange-600 text-white hover:bg-orange-500 shadow-orange-600/20"
                    )}
                  >
                    {isFollowLoading ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4" />
                        팔로잉
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        팔로우
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setView('portfolio')}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs border border-slate-700"
                  >
                    포트폴리오 보기
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="portfolio"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <PieChartIcon className="w-4 h-4 text-orange-500" />
                      자산 배분
                    </h4>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={holdings.length > 0 ? holdings : [{ symbol: 'N/A', weight: 100 }]}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="weight"
                            nameKey="symbol"
                          >
                            {holdings.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            {holdings.length === 0 && <Cell fill="#1e293b" />}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-orange-500" />
                      보유 종목
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                      {holdings.map((holding) => (
                        <div key={holding.symbol} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                          <div>
                            <p className="text-xs font-black text-white">{holding.symbol}</p>
                            <p className="text-[10px] text-slate-500 font-bold">{holding.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-white">{holding.weight}%</p>
                            <p className="text-[10px] text-slate-500 font-bold">₩{(holding.value || 0).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <History className="w-4 h-4 text-orange-500" />
                    최근 매매 내역
                  </h4>
                  <div className="space-y-2">
                    {trades.map((trade) => (
                      <div key={trade.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px]",
                            trade.type === 'BUY' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                          )}>
                            {trade.type}
                          </div>
                          <div>
                            <p className="text-xs font-black text-white">{trade.symbol}</p>
                            <p className="text-[10px] text-slate-500 font-bold">{trade.timestamp?.toDate().toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-white">₩{trade.price.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-500 font-bold">{trade.amount} 주</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};
