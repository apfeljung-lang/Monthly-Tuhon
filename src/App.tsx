import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, LayoutGrid, Trophy, PieChart, History, LogOut, Menu, X, User as UserIcon, TrendingUp, ShieldAlert, MessageSquare, Users } from 'lucide-react';
import { AuthProvider, useAuth } from './components/AuthGuard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { logout } from './firebase';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Components (to be implemented)
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import JoinLeague from './components/JoinLeague';
import RankingList from './components/RankingList';
import MonthlyReport from './components/MonthlyReport';
import TradeHistory from './components/TradeHistory';
import Community from './components/Community';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: '홈', path: '/', icon: HomeIcon },
    { name: '대시보드', path: '/dashboard', icon: LayoutGrid },
    { name: '리그 참여', path: '/join-league', icon: Trophy },
    { name: '랭킹', path: '/ranking', icon: Users },
    { name: '리포트', path: '/portfolio', icon: PieChart },
    { name: '기록', path: '/history', icon: History },
    { name: '커뮤니티', path: '/community', icon: MessageSquare },
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
      >
        <Menu className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-[70] w-72 bg-slate-950 border-r border-slate-900 transition-transform lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-12">
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">
              Monthly <span className="text-orange-500">Tuhon</span>
            </h1>
            <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all",
                  location.pathname === item.path 
                    ? "bg-orange-600/10 text-orange-500 shadow-inner shadow-orange-500/10" 
                    : "text-slate-500 hover:bg-slate-900 hover:text-slate-300"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-900 space-y-6">
            <div className="flex items-center gap-4 px-2">
              <img 
                src={user?.photoURL || ''} 
                alt={user?.displayName || ''} 
                className="w-10 h-10 rounded-full border-2 border-slate-800"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{user?.displayName}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-red-950/30 text-slate-500 hover:text-red-500 font-bold py-3 rounded-2xl transition-all"
            >
              <LogOut className="w-5 h-5" />
              로그아웃
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

const AppContent = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-orange-500/30">
      <Sidebar />
      <main className="lg:ml-72 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/join-league" element={<JoinLeague />} />
            <Route path="/ranking" element={<RankingList />} />
            <Route path="/portfolio" element={<MonthlyReport />} />
            <Route path="/history" element={<TradeHistory />} />
            <Route path="/community" element={<Community />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
