import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { collection, query, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthGuard';
import { UserProfile, TradeLog, PortfolioHolding, BankAccount } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, History, Calendar, ArrowUpRight, ArrowDownRight, Briefcase, FileText, PieChart as PieChartIcon, Target, CreditCard, Wallet, ChevronDown, Download, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const MOCK_TRADES: TradeLog[] = [
  { id: '1', uid: 'mock', symbol: 'TSLA', type: 'BUY', price: 245000, amount: 10, timestamp: { toDate: () => new Date('2026-03-25') } },
  { id: '2', uid: 'mock', symbol: 'AAPL', type: 'SELL', price: 210000, amount: 5, timestamp: { toDate: () => new Date('2026-03-20') } },
  { id: '3', uid: 'mock', symbol: 'NVDA', type: 'BUY', price: 1200000, amount: 2, timestamp: { toDate: () => new Date('2026-03-15') } },
  { id: '4', uid: 'mock', symbol: 'BTC', type: 'BUY', price: 95000000, amount: 0.1, timestamp: { toDate: () => new Date('2026-03-10') } },
  { id: '5', uid: 'mock', symbol: 'ETH', type: 'SELL', price: 4500000, amount: 1, timestamp: { toDate: () => new Date('2026-03-05') } },
];

const MOCK_HOLDINGS: PortfolioHolding[] = [
  { symbol: 'NVDA', name: 'Nvidia', weight: 45, value: 2400000 },
  { symbol: 'TSLA', name: 'Tesla', weight: 25, value: 2450000 },
  { symbol: 'AAPL', name: 'Apple', weight: 15, value: 1050000 },
  { symbol: 'BTC', name: 'Bitcoin', weight: 10, value: 9500000 },
  { symbol: 'ETH', name: 'Ethereum', weight: 5, value: 450000 },
];

const COLORS = ['#EC7364', '#E6503D', '#C13D2D', '#9E3225', '#7C271D', '#5A1C15'];

const MOCK_ACCOUNTS_DATA: (BankAccount & { 
  monthlyReturn: number; 
  totalReturn: number; 
  tuhonScore: number; 
  monthlyProfit: number;
  monthlyReturnsHistory: { month: string; return: number }[] 
})[] = [
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
    monthlyProfit: 15420000,
    monthlyReturnsHistory: [
      { month: '10월', return: 4.2 },
      { month: '11월', return: -2.1 },
      { month: '12월', return: 8.5 },
      { month: '1월', return: 3.8 },
      { month: '2월', return: -1.2 },
      { month: '3월', return: 14.2 },
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
    monthlyProfit: 3480000,
    monthlyReturnsHistory: [
      { month: '10월', return: 2.1 },
      { month: '11월', return: 1.5 },
      { month: '12월', return: 4.2 },
      { month: '1월', return: 2.8 },
      { month: '2월', return: 3.1 },
      { month: '3월', return: 8.4 },
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
    monthlyProfit: -320000,
    monthlyReturnsHistory: [
      { month: '10월', return: 1.2 },
      { month: '11월', return: -0.5 },
      { month: '12월', return: 2.1 },
      { month: '1월', return: -1.8 },
      { month: '2월', return: 0.5 },
      { month: '3월', return: -2.1 },
    ]
  },
];

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const StatCard = ({ title, value, subValue, icon: Icon, trend }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4"
  >
    <div className="flex items-center justify-between">
      <div className="p-3 bg-slate-800 rounded-2xl">
        <Icon className="w-6 h-6 text-orange-500" />
      </div>
      {trend !== undefined && (
        <div className={cn(
          "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
          trend > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
        )}>
          {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div className="space-y-1">
      <p className="text-slate-500 text-xs font-black uppercase tracking-widest">{title}</p>
      <h3 className="text-2xl font-black text-white tracking-tight">{value}</h3>
      {subValue && <p className="text-slate-400 text-xs font-medium">{subValue}</p>}
    </div>
  </motion.div>
);

export default function MonthlyReport() {
  const { user, profile } = useAuth();
  const [recentTrades, setRecentTrades] = useState<TradeLog[]>([]);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);

  const handleGenerateImage = async () => {
    if (!pdfTemplateRef.current) return null;
    
    try {
      // Temporarily show the template for capturing
      const template = pdfTemplateRef.current;
      template.style.display = 'block';
      
      const canvas = await html2canvas(template, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#020617', // slate-950
        logging: false,
      });
      
      template.style.display = 'none';
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Image Generation Error:', error);
      return null;
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const imgData = previewImage || await handleGenerateImage();
      if (!imgData) return;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4' // Use standard A4 or dynamic based on content
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Monthly_Tuhon_Report_${new Date().toISOString().slice(0, 7)}.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreviewPDF = async () => {
    setIsPreviewing(true);
    const imgData = await handleGenerateImage();
    if (imgData) {
      setPreviewImage(imgData);
      setShowPreview(true);
    }
    setIsPreviewing(false);
  };

  useEffect(() => {
    if (profile?.leagueAccountId && !selectedAccountId) {
      setSelectedAccountId(profile.leagueAccountId);
    }
  }, [profile, selectedAccountId]);

  useEffect(() => {
    if (showPreview) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showPreview]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;

    // Fetch accounts
    const accountsRef = collection(db, 'users', user.uid, 'accounts');
    const unsubAccounts = onSnapshot(accountsRef, (snapshot) => {
      const fetchedAccounts = snapshot.docs.map(doc => doc.data() as BankAccount);
      setAccounts(fetchedAccounts);
    });

    // Fetch recent trades
    const qTrades = query(collection(db, 'users', user.uid, 'trades'), orderBy('timestamp', 'desc'), limit(5));
    const unsubTrades = onSnapshot(qTrades, (snapshot) => {
      setRecentTrades(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradeLog)));
    });

    // Fetch portfolio holdings
    const qHoldings = query(collection(db, 'users', user.uid, 'portfolio'), orderBy('weight', 'desc'));
    const unsubHoldings = onSnapshot(qHoldings, (snapshot) => {
      setHoldings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioHolding)));
    });

    return () => {
      unsubTrades();
      unsubHoldings();
      unsubAccounts();
    };
  }, [user]);

  const selectedAccount = MOCK_ACCOUNTS_DATA.find(a => a.id === selectedAccountId) || MOCK_ACCOUNTS_DATA[0];

  // Mock history if none exists
  const reportData = selectedAccount.monthlyReturnsHistory;

  const displayTrades = recentTrades.length > 0 ? recentTrades : MOCK_TRADES;
  const displayHoldings = holdings.length > 0 ? holdings : MOCK_HOLDINGS;
  const displayProfile = profile || {
    totalAssets: selectedAccount.balance,
    monthlyProfit: selectedAccount.monthlyProfit,
    monthlyReturn: selectedAccount.monthlyReturn,
  };

  return (
    <div className="space-y-8">
      <div ref={reportRef} className="space-y-8">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            Monthly <span className="text-orange-500">Report</span>
          </h2>
          <p className="text-slate-500 font-medium">이번 달 당신의 투혼을 숫자로 요약한 월간 보고서입니다.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Custom Dropdown (Combo Box) */}
          <div className="relative z-50 account-dropdown" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-4 bg-slate-900 border border-slate-800 px-6 py-2.5 rounded-xl hover:border-orange-500/50 transition-all group"
            >
              <Wallet className="w-4 h-4 text-orange-500" />
              <div className="text-left">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">계좌 선택</p>
                <p className="text-xs font-black text-white">{selectedAccount.bankName} - {selectedAccount.accountNumber}</p>
              </div>
              <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform", isDropdownOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
                >
                  <div className="p-2 space-y-1">
                    {MOCK_ACCOUNTS_DATA.map((account) => (
                      <button
                        key={account.id}
                        onClick={() => {
                          setSelectedAccountId(account.id);
                          setIsDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between p-4 rounded-xl transition-all text-left",
                          selectedAccountId === account.id 
                            ? "bg-orange-600 text-white" 
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        )}
                      >
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-tight">{account.bankName}</p>
                          <p className="text-[8px] opacity-70">{account.accountNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black">₩{account.balance.toLocaleString()}</p>
                          {account.id === profile?.leagueAccountId && (
                            <span className="text-[6px] font-black uppercase bg-white/20 px-1 rounded">Active</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 font-bold text-sm rounded-xl flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-500" />
            2026년 3월
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="총 자산" 
          value={`₩${(selectedAccount.balance || 0).toLocaleString()}`} 
          subValue="선택된 계좌 자산"
          icon={Briefcase}
        />
        <StatCard 
          title="월간 수익" 
          value={`₩${(selectedAccount.monthlyProfit || 0).toLocaleString()}`} 
          subValue="이번 달 순이익"
          icon={DollarSign}
          trend={selectedAccount.monthlyReturn}
        />
        <StatCard 
          title="누적 수익률" 
          value={`${selectedAccount.totalReturn || 0}%`} 
          subValue="전체 기간 동안의 총 실적"
          icon={TrendingUp}
          trend={selectedAccount.totalReturn}
        />
      </div>

      {accounts.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-wrap gap-4 items-center">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest mr-2">연동된 계좌:</span>
          {accounts.map(account => (
            <div key={account.id} className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              <CreditCard className="w-3 h-3 text-orange-500" />
              <span className="text-xs font-bold text-white">{account.bankName}</span>
              <span className="text-[10px] text-slate-500 font-medium">{account.accountNumber}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              수익률 추이
            </h3>
            <span className="text-[10px] font-black bg-slate-800 text-slate-500 px-2 py-1 rounded uppercase tracking-widest">최근 6개월</span>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip 
                  cursor={{ fill: '#1e293b', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                  formatter={(value: number) => [`${value}%`, '수익률']}
                />
                <Bar dataKey="return" radius={[4, 4, 0, 0]}>
                  {reportData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.return >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-orange-500" />
              최근 거래
            </h3>
          </div>
          <div className="space-y-6">
            {displayTrades.map((trade) => (
              <div key={trade.id} className="flex items-center gap-4 group">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px]",
                  trade.type === 'BUY' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                )}>
                  {trade.type}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate uppercase tracking-tight">{trade.symbol}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    {trade.timestamp?.toDate ? trade.timestamp.toDate().toLocaleDateString() : '방금 전'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white">₩{(trade.price * trade.amount).toLocaleString()}</p>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{trade.amount} 수량</p>
                </div>
              </div>
            ))}
            {displayTrades.length === 0 && (
              <div className="py-12 text-center space-y-4">
                <FileText className="w-12 h-12 text-slate-800 mx-auto" />
                <p className="text-slate-500 text-sm font-medium">최근 거래 내역이 없습니다.</p>
              </div>
            )}
          </div>
          <button className="w-full py-4 text-sm font-bold text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-2xl transition-all">
            전체 내역 보기
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-8">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-orange-500" />
            자산 배분
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayHoldings}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="weight"
                  nameKey="symbol"
                >
                  {displayHoldings.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {displayHoldings.slice(0, 4).map((h, i) => (
              <div key={h.symbol} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-xs font-bold text-slate-400 uppercase">{h.symbol}</span>
                <span className="text-xs font-black text-white ml-auto">{h.weight}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-orange-600/5 border border-orange-600/20 rounded-3xl p-8 flex flex-col items-center justify-center gap-6 text-center">
          <div className="p-4 bg-orange-600 rounded-2xl shadow-xl shadow-orange-600/20">
            <Target className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-2">
            <h4 className="text-xl font-black text-white uppercase tracking-tighter">투혼 분석</h4>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              이번 달 당신의 매매 패턴은 <span className="text-orange-500 font-bold">공격적인</span> 성향을 보였습니다. 
              MDD가 지난달 대비 2.4% 감소하여 리스크 관리가 개선되었습니다.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <button 
              onClick={handlePreviewPDF}
              disabled={isPreviewing || isDownloading}
              className="pdf-preview-btn flex-1 py-4 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-white font-black rounded-2xl transition-all uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {isPreviewing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  준비 중...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  미리보기
                </>
              )}
            </button>
            <button 
              onClick={handleDownloadPDF}
              disabled={isDownloading || isPreviewing}
              className="pdf-download-btn flex-1 py-4 bg-orange-600 hover:bg-orange-500 disabled:bg-orange-800 text-white font-black rounded-2xl transition-all uppercase tracking-widest shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  다운로드
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* PDF Report Template (Hidden from UI, used for PDF generation) */}
      <div 
        ref={pdfTemplateRef} 
        style={{ display: 'none', width: '800px', backgroundColor: '#020617' }}
        className="p-12 space-y-12 text-white font-sans"
      >
        {/* Report Header */}
        <div className="flex justify-between items-end border-b-2 border-orange-600 pb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-black italic tracking-tighter uppercase">TUHON <span className="text-orange-500">TRADING</span></h1>
            </div>
            <div>
              <h2 className="text-5xl font-black uppercase tracking-tighter">MONTHLY <span className="text-orange-500">REPORT</span></h2>
              <p className="text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">March 2026 Edition</p>
            </div>
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Report ID: TH-202603-001</p>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Generated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* User Profile Summary */}
        <div className="grid grid-cols-2 gap-8">
          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl space-y-4">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Investor Profile</p>
            <div className="flex items-center gap-6">
              <img 
                src={profile?.photoURL || 'https://picsum.photos/seed/user/100/100'} 
                className="w-20 h-20 rounded-2xl border-2 border-orange-600"
                alt="Profile"
              />
              <div>
                <h3 className="text-2xl font-black text-white">{profile?.displayName || '차트술사'}</h3>
                <p className="text-orange-500 font-black uppercase tracking-widest text-sm">{profile?.league || 'Master'} League</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl space-y-4">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Account Summary</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Bank</span>
                <span className="text-white font-black">{selectedAccount.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Account No.</span>
                <span className="text-white font-black">{selectedAccount.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Tuhon Score</span>
                <span className="text-orange-500 font-black">{selectedAccount.tuhonScore} PTS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Stats */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-center space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Assets</p>
            <p className="text-2xl font-black text-white">₩{selectedAccount.balance.toLocaleString()}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-center space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Monthly Return</p>
            <p className={cn("text-2xl font-black", selectedAccount.monthlyReturn > 0 ? "text-emerald-500" : "text-rose-500")}>
              {selectedAccount.monthlyReturn > 0 ? '+' : ''}{selectedAccount.monthlyReturn}%
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-center space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Monthly Profit</p>
            <p className="text-2xl font-black text-white">₩{selectedAccount.monthlyProfit.toLocaleString()}</p>
          </div>
        </div>

        {/* Performance Analysis */}
        <div className="space-y-6">
          <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            Performance Analysis
          </h3>
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <Bar dataKey="return" radius={[4, 4, 0, 0]}>
                    {reportData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.return >= 0 ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 p-6 bg-slate-950 rounded-2xl border border-slate-800">
              <p className="text-sm text-slate-400 leading-relaxed">
                <span className="text-white font-bold">Analysis Summary:</span> 이번 달 당신의 매매 패턴은 <span className="text-orange-500 font-bold">공격적인</span> 성향을 보였습니다. 
                MDD가 지난달 대비 2.4% 감소하여 리스크 관리가 개선되었습니다. 특히 {reportData[reportData.length - 1].month} 수익률이 {reportData[reportData.length - 1].return}%를 기록하며 
                최근 6개월 중 가장 높은 성과를 달성했습니다.
              </p>
            </div>
          </div>
        </div>

        {/* Portfolio & Trades */}
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <PieChartIcon className="w-6 h-6 text-orange-500" />
              Asset Allocation
            </h3>
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl h-[350px] flex flex-col justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={displayHoldings}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="weight"
                  >
                    {displayHoldings.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-6 space-y-2">
                {displayHoldings.slice(0, 3).map((h, i) => (
                  <div key={h.symbol} className="flex justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-400 font-bold uppercase">{h.symbol}</span>
                    </div>
                    <span className="text-white font-black">{h.weight}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <History className="w-6 h-6 text-orange-500" />
              Recent Activity
            </h3>
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 h-[350px]">
              {displayTrades.slice(0, 4).map((trade) => (
                <div key={trade.id} className="flex items-center justify-between border-b border-slate-800 pb-4 last:border-0">
                  <div>
                    <p className="text-sm font-black text-white uppercase">{trade.symbol}</p>
                    <p className="text-[10px] text-slate-500 font-bold">{trade.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white">₩{(trade.price * trade.amount).toLocaleString()}</p>
                    <p className="text-[10px] text-slate-600 font-bold">{trade.timestamp?.toDate ? trade.timestamp.toDate().toLocaleDateString() : '2026-03-25'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-12 border-t border-slate-800 text-center space-y-4">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.4em]">© 2026 TUHON TRADING LEAGUE REPORT SERVICE</p>
          <p className="text-[8px] text-slate-700 max-w-lg mx-auto leading-relaxed">
            본 보고서는 투혼 트레이딩 리그의 데이터를 바탕으로 자동 생성되었습니다. 투자 결과에 대한 책임은 본인에게 있으며, 
            본 데이터는 참고용으로만 활용하시기 바랍니다. 모든 자산 가치는 실시간 시세와 차이가 있을 수 있습니다.
          </p>
        </div>
      </div>

      {/* PDF Preview Modal - Using explicit inline styles to guarantee positioning */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showPreview && previewImage && (
            <motion.div
              key="pdf-preview-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                backdropFilter: 'blur(20px)',
                zIndex: 999999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}
              onClick={() => setShowPreview(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 30 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] shadow-[0_0_100px_-12px_rgba(234,88,12,0.5)] overflow-hidden flex flex-col relative"
                style={{ zIndex: 1000000 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-600 rounded-2xl shadow-lg shadow-orange-600/20">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">보고서 미리보기</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">2026년 3월 월간 투혼 보고서</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleDownloadPDF}
                      disabled={isDownloading}
                      className="px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white text-sm font-black rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-orange-600/20"
                    >
                      {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                      다운로드
                    </button>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl transition-all"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-slate-950/30 custom-scrollbar">
                  <div className="max-w-3xl mx-auto shadow-2xl shadow-black/80 border border-slate-800 rounded-2xl overflow-hidden bg-[#020617]">
                    <img 
                      src={previewImage} 
                      alt="PDF Preview" 
                      className="w-full h-auto block"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em]">© 2026 TUHON TRADING LEAGUE REPORT SERVICE</p>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-8 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl transition-all uppercase tracking-widest"
                  >
                    닫기
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.getElementById('modal-root')!
      )}
    </div>
  );
}
