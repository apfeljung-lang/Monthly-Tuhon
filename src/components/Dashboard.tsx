import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthGuard';
import { UserProfile, BankAccount } from '../types';
import { translateLeague } from '../lib/utils';
import { TrendingUp, Award, Target, Zap, ArrowUpRight, ArrowDownRight, CreditCard, ChevronRight, Plus, Activity, BarChart3, Users, UserPlus, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UserDetailModal } from './UserDetailModal';
import { getDoc } from 'firebase/firestore';
import { LeagueBadge } from './LeagueBadge';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const StatCard = ({ title, value, subValue, icon: Icon, trend, color = "orange" }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 p-6 rounded-[2rem] space-y-4 hover:border-orange-500/30 transition-all group relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-colors" />
    <div className="flex items-center justify-between relative z-10">
      <div className={cn(
        "p-3 rounded-2xl transition-colors",
        color === "orange" ? "bg-orange-500/10 text-orange-500" : "bg-blue-500/10 text-blue-500"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      {trend !== undefined && (
        <div className={cn(
          "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter",
          trend > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
        )}>
          {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div className="space-y-1 relative z-10">
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
      <h3 className="text-2xl font-black text-white tracking-tighter">{value}</h3>
      {subValue && <p className="text-slate-400 text-[10px] font-bold">{subValue}</p>}
    </div>
  </motion.div>
);

const AccountCard = ({ account, isActive, league }: any) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={cn(
      "w-full bg-gradient-to-br border p-8 rounded-[2.5rem] space-y-8 shadow-2xl shadow-black/40 group relative overflow-hidden transition-all",
      isActive 
        ? "from-orange-500 to-orange-700 border-orange-300/50 ring-4 ring-orange-500/10" 
        : "from-slate-800 to-slate-900 border-slate-700/50"
    )}
  >
    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
      <CreditCard className="w-20 h-20 text-white" />
    </div>
    {isActive && (
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <LeagueBadge league={league} size="sm" className="bg-white/20 border-white/20 text-white" />
      </div>
    )}
    <div className="space-y-2">
      <p className={cn(
        "text-xs font-black uppercase tracking-[0.2em]",
        isActive ? "text-orange-100" : "text-orange-500"
      )}>{account.bankName}</p>
      <p className={cn(
        "text-sm font-mono tracking-wider",
        isActive ? "text-orange-200" : "text-slate-400"
      )}>{account.accountNumber}</p>
    </div>
    <div className="space-y-2">
      <p className={cn(
        "text-xs font-bold uppercase tracking-widest",
        isActive ? "text-orange-200/70" : "text-slate-500"
      )}>총 자산</p>
      <h4 className="text-5xl font-black text-white tracking-tighter">₩{account.balance.toLocaleString()}</h4>
    </div>
    <div className="flex items-center justify-between pt-4 border-t border-white/10">
      <div className={cn(
        "flex items-center gap-2 text-sm font-black",
        isActive ? "text-white" : "text-emerald-500"
      )}>
        <ArrowUpRight className="w-4 h-4" /> +2.4% (오늘)
      </div>
      <div className={cn(
        "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors",
        isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
      )}>
        {account.type} Account
      </div>
    </div>
  </motion.div>
);

const FollowingUserCard = ({ user, onClick }: any) => (
  <motion.div 
    whileHover={{ y: -4 }}
    onClick={onClick}
    className="min-w-[160px] bg-slate-900/50 border border-slate-800/50 p-4 rounded-[2rem] flex flex-col items-center gap-3 group relative overflow-hidden cursor-pointer"
  >
    <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 blur-2xl -mr-8 -mt-8 group-hover:bg-orange-500/10 transition-colors" />
    <img 
      src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} 
      alt={user.displayName} 
      className="w-16 h-16 rounded-2xl border-2 border-slate-800 group-hover:border-orange-500 transition-all shadow-lg"
      referrerPolicy="no-referrer"
    />
    <div className="text-center">
      <p className="text-xs font-black text-white truncate w-24">{user.displayName}</p>
      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">팔로잉</p>
    </div>
    <ChevronRight className="w-3 h-3 text-slate-700 group-hover:text-orange-500 transition-colors mt-1" />
  </motion.div>
);

const MOCK_TOP_RANKERS: UserProfile[] = [
  { uid: '1', displayName: '차트술사', photoURL: 'https://picsum.photos/seed/user1/100/100', totalAssets: 50000000, monthlyReturn: 24.5, tuhonScore: 2850, league: 'Master' },
  { uid: '2', displayName: '불개미', photoURL: 'https://picsum.photos/seed/user2/100/100', totalAssets: 32000000, monthlyReturn: 18.2, tuhonScore: 2420, league: 'Pro' },
  { uid: '3', displayName: '단타의신', photoURL: 'https://picsum.photos/seed/user3/100/100', totalAssets: 15000000, monthlyReturn: 15.8, tuhonScore: 1980, league: 'Pro' },
];

const MOCK_ACCOUNTS_DATA: (BankAccount & { monthlyReturn: number; totalReturn: number; tuhonScore: number; history: { name: string; value: number }[] })[] = [
  { 
    id: 'ls-1', 
    bankName: 'LS증권', 
    accountNumber: '100-22-334455', 
    balance: 125000000, 
    currency: 'KRW', 
    type: 'Investment',
    monthlyReturn: 14.2,
    totalReturn: 42.5,
    tuhonScore: 2850,
    history: [
      { name: '1주', value: 110000000 },
      { name: '2주', value: 115000000 },
      { name: '3주', value: 112000000 },
      { name: '4주', value: 118000000 },
      { name: '5주', value: 122000000 },
      { name: '6주', value: 125000000 },
    ]
  },
  { 
    id: 'ls-2', 
    bankName: 'LS증권', 
    accountNumber: '100-22-998877', 
    balance: 45000000, 
    currency: 'KRW', 
    type: 'Investment',
    monthlyReturn: 8.4,
    totalReturn: 15.2,
    tuhonScore: 1420,
    history: [
      { name: '1주', value: 40000000 },
      { name: '2주', value: 42000000 },
      { name: '3주', value: 41000000 },
      { name: '4주', value: 43500000 },
      { name: '5주', value: 44000000 },
      { name: '6주', value: 45000000 },
    ]
  },
  { 
    id: 'ls-3', 
    bankName: 'LS증권', 
    accountNumber: '100-22-112233', 
    balance: 15000000, 
    currency: 'KRW', 
    type: 'Investment',
    monthlyReturn: -2.1,
    totalReturn: 5.8,
    tuhonScore: 840,
    history: [
      { name: '1주', value: 16000000 },
      { name: '2주', value: 15500000 },
      { name: '3주', value: 15800000 },
      { name: '4주', value: 15200000 },
      { name: '5주', value: 14800000 },
      { name: '6주', value: 15000000 },
    ]
  },
];

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [topRankers, setTopRankers] = useState<UserProfile[]>([]);
  const [followingUsers, setFollowingUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  const handleUserClick = async (targetUid: string) => {
    if (isLoadingUser) return;
    setIsLoadingUser(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', targetUid));
      if (userDoc.exists()) {
        setSelectedUser(userDoc.data() as UserProfile);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setIsLoadingUser(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const followingRef = collection(db, 'users', user.uid, 'following');
    const unsubFollowing = onSnapshot(query(followingRef, orderBy('timestamp', 'desc')), (snapshot) => {
      setFollowingUsers(snapshot.docs.map(doc => doc.data()));
    });

    const q = query(collection(db, 'users'), orderBy('tuhonScore', 'desc'), limit(3));
    const unsubRankers = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as UserProfile);
      setTopRankers(data.length > 0 ? data : MOCK_TOP_RANKERS);
    });

    return () => {
      unsubRankers();
      unsubFollowing();
    };
  }, [user]);

  const displayProfile = profile || {
    totalAssets: 10000000,
    monthlyReturn: 5.4,
    totalReturn: 12.8,
    tuhonScore: 1240,
    followers: 842,
    league: 'Rookie'
  };

  const displayRankers = topRankers.length > 0 ? topRankers : MOCK_TOP_RANKERS;

  const activeAccount = MOCK_ACCOUNTS_DATA.find(a => a.id === profile?.leagueAccountId);
  const selectedAccount = activeAccount || MOCK_ACCOUNTS_DATA[0];
  const totalBalance = selectedAccount.balance;

  const chartData = selectedAccount.history;

  return (
    <div className="space-y-12 pb-12">
      {/* Page Header */}
      <header className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
            Dash<span className="text-orange-500">board</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="h-1 w-24 bg-orange-600 rounded-full shadow-[0_0_15px_rgba(234,88,12,0.5)]" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Real-time Performance Hub</span>
          </div>
        </motion.div>
      </header>

      {/* Hero Section */}
      <section className="relative">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4">
            <p className="text-slate-400 font-medium text-sm">
              환영합니다, <span className="text-white font-bold">{user?.displayName}</span>님. 
              {profile?.league && activeAccount ? (
                <>
                  현재 <span className="text-orange-500 font-bold">{translateLeague(profile.league)}</span> 리그(<span className="text-slate-300">{activeAccount.accountNumber}</span>)에서 상위 12%를 기록 중입니다.
                </>
              ) : (
                <>아직 리그에 참여하지 않으셨습니다. 리그에 참여하여 실력을 증명하세요!</>
              )}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Link 
              to="/join-league"
              className="px-6 py-3 bg-white text-black font-black text-xs rounded-2xl uppercase tracking-widest hover:bg-orange-50 hover:text-white transition-all shadow-xl shadow-white/5"
            >
              리그 참여하기
            </Link>
            <div className="px-6 py-3 bg-slate-900 border border-slate-800 text-slate-400 font-black text-xs rounded-2xl uppercase tracking-widest">
              시즌 1: 2026년 3월
            </div>
          </div>
        </div>
      </section>

      {/* Account Details Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-orange-500" />
            참여계좌 상세 정보
          </h3>
        </div>

        {activeAccount ? (
          <div className="relative">
            <AccountCard 
              account={activeAccount} 
              isActive={true}
              league={profile?.league}
            />
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/30 border-2 border-dashed border-slate-800/50 rounded-[2.5rem] p-12 flex flex-col items-center justify-center gap-4 text-center"
          >
            <div className="p-4 rounded-full bg-slate-800/50 text-slate-500">
              <Trophy className="w-8 h-8 opacity-20" />
            </div>
            <div className="space-y-1">
              <p className="text-slate-400 font-bold">참여 중인 리그 계좌가 없습니다</p>
              <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">리그에 참여하여 실시간 랭킹에 도전하세요</p>
            </div>
            <Link 
              to="/join-league"
              className="mt-2 px-8 py-3 bg-orange-600 text-white font-black text-xs rounded-2xl uppercase tracking-widest hover:bg-orange-500 transition-all shadow-lg shadow-orange-600/20"
            >
              리그 참여하기
            </Link>
          </motion.div>
        )}
      </section>

      {/* Following Users Horizontal Scroll */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-orange-500" />
            내가 팔로우 한 필명
          </h3>
          <Link to="/ranking" className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:underline">
            더 찾아보기
          </Link>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
          {followingUsers.length > 0 ? (
            followingUsers.map((followedUser) => (
              <FollowingUserCard 
                key={followedUser.uid} 
                user={followedUser} 
                onClick={() => handleUserClick(followedUser.uid)}
              />
            ))
          ) : (
            <Link 
              to="/ranking"
              className="flex-1 min-h-[140px] border-2 border-dashed border-slate-800 rounded-[2rem] flex flex-col items-center justify-center gap-3 group hover:border-orange-500/50 transition-colors bg-slate-900/20"
            >
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                <Users className="w-5 h-5 text-slate-500 group-hover:text-white" />
              </div>
              <p className="text-xs font-bold text-slate-500 group-hover:text-slate-300">팔로우 중인 필명이 없습니다</p>
            </Link>
          )}
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="이번달 수익률" 
          value={`${selectedAccount.monthlyReturn}%`} 
          icon={TrendingUp}
          trend={selectedAccount.monthlyReturn}
        />
        <StatCard 
          title="누적수익률" 
          value={`${selectedAccount.totalReturn}%`} 
          icon={Zap}
          color="blue"
          trend={selectedAccount.totalReturn}
        />
        <StatCard 
          title="투혼 점수" 
          value={selectedAccount.tuhonScore} 
          icon={Award}
          subValue={`글로벌 랭킹 #${Math.floor(10000 / (selectedAccount.tuhonScore / 100))}`}
        />
        <StatCard 
          title="팔로워" 
          value={(displayProfile.followers || 0).toLocaleString()} 
          icon={Users}
          subValue="실시간 팔로워"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <BarChart3 className="w-32 h-32 text-white" />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Performance</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">자산 성장 추이</p>
              </div>
              <div className="flex gap-2">
                {['1W', '1M', '3M', 'ALL'].map(t => (
                  <button key={t} className={cn(
                    "px-4 py-1.5 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest",
                    t === '1M' ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" : "text-slate-500 hover:bg-slate-800"
                  )}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[350px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EA580C" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EA580C" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fontWeight: 800 }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#EA580C', fontWeight: '900', fontSize: '12px' }}
                    labelStyle={{ color: '#64748b', fontWeight: '800', marginBottom: '4px', fontSize: '10px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#EA580C" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sidebar: Ranking & Report Summary */}
        <div className="space-y-8">
          {/* Monthly Report Summary Card */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-[2.5rem] p-8 space-y-6 shadow-2xl shadow-orange-600/20 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16" />
            <div className="space-y-2 relative z-10">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Monthly Report</h3>
              <p className="text-orange-100/70 text-xs font-medium">3월의 투혼 분석이 완료되었습니다.</p>
            </div>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-[10px] font-black text-orange-100 uppercase tracking-widest">수익금</span>
                <span className="text-lg font-black text-white">₩1,240,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-orange-100 uppercase tracking-widest">승률</span>
                <span className="text-lg font-black text-white">68%</span>
              </div>
            </div>
            <Link 
              to="/portfolio"
              className="block w-full py-4 bg-white text-orange-600 text-center text-xs font-black rounded-2xl uppercase tracking-widest hover:bg-orange-50 transition-colors relative z-10"
            >
              상세 리포트 보기
            </Link>
          </motion.div>

          {/* Top Rankers */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-[2.5rem] p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Top Rankers</h3>
              <Link to="/ranking" className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:underline">전체보기</Link>
            </div>
            <div className="space-y-6">
              {displayRankers.map((ranker, i) => (
                <div 
                  key={ranker.uid} 
                  onClick={() => handleUserClick(ranker.uid)}
                  className="flex items-center gap-4 group cursor-pointer"
                >
                  <div className="relative">
                    <img 
                      src={ranker.photoURL || `https://picsum.photos/seed/${ranker.uid}/100/100`} 
                      alt={ranker.displayName} 
                      className="w-12 h-12 rounded-2xl border-2 border-slate-800 group-hover:border-orange-500 transition-all"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-950 text-white text-[10px] font-black flex items-center justify-center rounded-full border border-slate-800">
                      {i + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white truncate">{ranker.displayName}</p>
                    <LeagueBadge league={ranker.league} size="sm" showLabel={true} className="mt-1" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-500">+{ranker.monthlyReturn || 0}%</p>
                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">{ranker.tuhonScore || 0} PTS</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
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

      {isLoadingUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
          <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
