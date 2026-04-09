import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { useAuth } from './AuthGuard';
import { TradeLog } from '../types';
import { Plus, History, ArrowUpRight, ArrowDownRight, Search, Filter, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const MOCK_TRADES: TradeLog[] = [
  { id: '1', uid: 'mock', symbol: 'TSLA', type: 'BUY', price: 245000, amount: 10, timestamp: new Date('2026-03-25').toISOString(), note: 'Breakout play' },
  { id: '2', uid: 'mock', symbol: 'AAPL', type: 'SELL', price: 210000, amount: 5, timestamp: new Date('2026-03-20').toISOString(), note: 'Take profit' },
  { id: '3', uid: 'mock', symbol: 'NVDA', type: 'BUY', price: 1200000, amount: 2, timestamp: new Date('2026-03-15').toISOString(), note: 'AI trend' },
  { id: '4', uid: 'mock', symbol: 'BTC', type: 'BUY', price: 95000000, amount: 0.1, timestamp: new Date('2026-03-10').toISOString(), note: 'Halving expectation' },
  { id: '5', uid: 'mock', symbol: 'ETH', type: 'SELL', price: 4500000, amount: 1, timestamp: new Date('2026-03-05').toISOString(), note: 'Rebalancing' },
];

export default function TradeHistory() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<TradeLog[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTrade, setNewTrade] = useState({ symbol: '', type: 'BUY' as 'BUY' | 'SELL', price: 0, amount: 0, note: '' });

  useEffect(() => {
    if (!user) return;
    const loadTrades = () => {
      const data = storage.getTrades();
      setTrades(data.length > 0 ? data : MOCK_TRADES);
    };
    loadTrades();
    const interval = setInterval(loadTrades, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const displayTrades = trades.length > 0 ? trades : MOCK_TRADES;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    storage.addTrade({
      ...newTrade,
      uid: user.uid,
    });
    setIsAdding(false);
    setNewTrade({ symbol: '', type: 'BUY', price: 0, amount: 0, note: '' });
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            Trade <span className="text-orange-500">History</span>
          </h2>
          <p className="text-slate-500 font-medium">거래 복기는 성장의 기초입니다. 철저하게 기록하세요.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-black px-6 py-3 rounded-2xl transition-all shadow-lg shadow-orange-600/20 uppercase tracking-widest"
        >
          <Plus className="w-5 h-5" />
          거래 기록
        </button>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="grid grid-cols-12 px-4 md:px-8 py-4 bg-slate-800/50 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
          <div className="col-span-3 md:col-span-2">날짜</div>
          <div className="col-span-5 md:col-span-3">자산</div>
          <div className="hidden md:block md:col-span-2 text-right">구분</div>
          <div className="hidden md:block md:col-span-2 text-right">가격</div>
          <div className="hidden md:block md:col-span-2 text-right">수량</div>
          <div className="col-span-4 md:col-span-1 text-right">합계</div>
        </div>
        <div className="divide-y divide-slate-800">
          {displayTrades.map((trade) => (
            <div key={trade.id} className="grid grid-cols-12 px-4 md:px-8 py-6 items-center hover:bg-slate-800/30 transition-colors group">
              <div className="col-span-3 md:col-span-2">
                <p className="text-[10px] md:text-xs font-bold text-slate-500">
                  {trade.timestamp ? new Date(trade.timestamp).toLocaleDateString() : '방금 전'}
                </p>
              </div>
              <div className="col-span-5 md:col-span-3 flex items-center gap-3 md:gap-4">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-800 rounded-xl flex items-center justify-center font-black text-orange-500 text-[10px] md:text-xs">
                  {trade.symbol.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-bold text-white uppercase tracking-tight truncate">{trade.symbol}</p>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "md:hidden text-[8px] font-black px-1 rounded uppercase tracking-tighter",
                      trade.type === 'BUY' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                    )}>
                      {trade.type}
                    </span>
                    <p className="text-[8px] md:text-[10px] text-slate-600 font-bold uppercase tracking-widest truncate">{trade.note || '메모 없음'}</p>
                  </div>
                </div>
              </div>
              <div className="hidden md:block md:col-span-2 text-right">
                <span className={cn(
                  "text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest",
                  trade.type === 'BUY' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                )}>
                  {trade.type}
                </span>
              </div>
              <div className="hidden md:block md:col-span-2 text-right">
                <p className="text-sm font-black text-white">₩{trade.price.toLocaleString()}</p>
              </div>
              <div className="hidden md:block md:col-span-2 text-right">
                <p className="text-sm font-black text-slate-300">{trade.amount.toLocaleString()}</p>
              </div>
              <div className="col-span-4 md:col-span-1 text-right">
                <p className="text-xs md:text-sm font-black text-orange-500">₩{(trade.price * trade.amount).toLocaleString()}</p>
                <div className="md:hidden">
                  <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">{trade.amount} 수량</p>
                </div>
              </div>
            </div>
          ))}
          {trades.length === 0 && (
            <div className="p-12 text-center space-y-4">
              <History className="w-12 h-12 text-slate-800 mx-auto" />
              <p className="text-slate-500 font-medium">거래 내역이 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-8"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">새 거래 기록</h3>
                <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">구분</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['BUY', 'SELL'].map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setNewTrade({...newTrade, type: t as any})}
                          className={cn(
                            "py-2 text-xs font-black rounded-lg transition-all uppercase tracking-widest",
                            newTrade.type === t 
                              ? (t === 'BUY' ? "bg-emerald-600 text-white" : "bg-rose-600 text-white")
                              : "bg-slate-800 text-slate-500"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">종목 코드</label>
                    <input 
                      required
                      type="text" 
                      placeholder="예: BTC"
                      value={newTrade.symbol}
                      onChange={e => setNewTrade({...newTrade, symbol: e.target.value.toUpperCase()})}
                      className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-orange-600 transition-colors"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">가격 (₩)</label>
                    <input 
                      required
                      type="number" 
                      placeholder="0"
                      value={newTrade.price}
                      onChange={e => setNewTrade({...newTrade, price: Number(e.target.value)})}
                      className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-orange-600 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">수량</label>
                    <input 
                      required
                      type="number" 
                      placeholder="0"
                      value={newTrade.amount}
                      onChange={e => setNewTrade({...newTrade, amount: Number(e.target.value)})}
                      className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-orange-600 transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">메모</label>
                  <textarea 
                    placeholder="거래 이유를 기록하세요..."
                    value={newTrade.note}
                    onChange={e => setNewTrade({...newTrade, note: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-orange-600 transition-colors h-24 resize-none"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest shadow-lg shadow-orange-600/20"
                >
                  기록 저장
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const X = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
