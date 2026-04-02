import React, { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from './AuthGuard';
import { BankAccount, League } from '../types';
import { Trophy, CheckCircle2, CreditCard, Wallet, Loader2, ChevronRight, Star, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const LEAGUES: { id: League; name: string; minAssets: number; description: string; color: string }[] = [
  { id: 'Rookie', name: '루키 리그', minAssets: 1, description: '투혼의 첫걸음. 누구나 참여 가능한 기초 리그입니다.', color: 'from-slate-400 to-slate-600' },
  { id: 'Pro', name: '프로 리그', minAssets: 10000000, description: '실전 트레이더들의 전장. 1,000만원 이상의 자산이 필요합니다.', color: 'from-orange-400 to-orange-600' },
  { id: 'Master', name: '마스터 리그', minAssets: 100000000, description: '최상위 1%의 격전지. 1억원 이상의 자산가들을 위한 리그입니다.', color: 'from-purple-500 to-purple-700' },
];

const MOCK_ACCOUNTS: BankAccount[] = [
  { id: 'ls-1', bankName: 'LS증권', accountNumber: '100-22-334455', balance: 125000000, currency: 'KRW', type: 'Investment' },
  { id: 'ls-2', bankName: 'LS증권', accountNumber: '100-22-998877', balance: 45000000, currency: 'KRW', type: 'Investment' },
  { id: 'ls-3', bankName: 'LS증권', accountNumber: '100-22-112233', balance: 15000000, currency: 'KRW', type: 'Investment' },
];

export default function JoinLeague() {
  const { user, profile } = useAuth();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile?.leagueAccountId && !selectedAccountId) {
      setSelectedAccountId(profile.leagueAccountId);
    }
  }, [profile, selectedAccountId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedAccount = MOCK_ACCOUNTS.find(a => a.id === selectedAccountId);
  const participatingAccount = MOCK_ACCOUNTS.find(a => a.id === profile?.leagueAccountId);

  const handleJoin = async () => {
    if (!user || !selectedAccountId) return;
    setLoading(true);

    try {
      if (!selectedAccount) throw new Error('계좌를 찾을 수 없습니다.');

      // Determine league based on balance
      const leagueObj = [...LEAGUES].reverse().find(l => selectedAccount.balance >= l.minAssets);
      if (!leagueObj) {
        throw new Error(`리그 참여를 위한 최소 자산(₩${LEAGUES[0].minAssets.toLocaleString()})이 부족합니다.`);
      }
      const league = leagueObj.id;

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        league,
        leagueAccountId: selectedAccountId,
        totalAssets: selectedAccount.balance, // Update total assets to match the league account
        updatedAt: serverTimestamp()
      }, { merge: true });

      setIsSuccess(true);
      window.alert('리그 참여가 성공적으로 완료되었습니다!');
    } catch (error) {
      console.error('League join error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        league: null,
        leagueAccountId: null,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setSelectedAccountId(null);
      window.alert('리그 참여가 취소되었습니다.');
    } catch (error) {
      console.error('League leave error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] max-w-sm w-full text-center space-y-6 shadow-2xl shadow-orange-600/40"
            >
              <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Success!</h3>
                <p className="text-slate-400 font-bold">리그참여가 완료되었습니다.</p>
              </div>
              <button
                onClick={() => setIsSuccess(false)}
                className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-2xl transition-all uppercase tracking-widest shadow-lg shadow-orange-600/20"
              >
                확인
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto space-y-12 pb-24">
        <header className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-orange-600/10 rounded-[2rem] flex items-center justify-center mx-auto border border-orange-500/20"
          >
            <Trophy className="w-10 h-10 text-orange-500" />
          </motion.div>
          <div className="space-y-2">
            <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic">
              League <span className="text-orange-500">Participation</span>
            </h2>
            <p className="text-slate-500 font-medium">당신의 투혼을 증명할 리그에 참여하세요. 계좌를 선택하면 자동으로 리그가 배정됩니다.</p>
          </div>
        </header>

        {profile?.league && participatingAccount?.accountNumber ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-orange-600/20"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                <Star className="w-8 h-8 text-white fill-white" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] opacity-70">현재 참여 중인 리그</p>
                <h3 className="text-3xl font-black uppercase tracking-tighter">
                  {LEAGUES.find(l => l.id === profile.league)?.name}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-black/20 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/10">
              <ShieldCheck className="w-5 h-5 text-orange-200" />
              <div className="flex flex-col">
                <span className="text-sm font-bold">참여계좌 : {participatingAccount.accountNumber}</span>
                <button 
                  onClick={handleLeave}
                  disabled={loading}
                  className="text-[10px] font-black text-orange-200 hover:text-white uppercase tracking-widest text-left mt-1 underline"
                >
                  {loading ? '처리 중...' : '참여 취소 (테스트용)'}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 text-center space-y-6 shadow-xl"
          >
            <div className="w-20 h-20 bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto border border-slate-700">
              <ShieldCheck className="w-10 h-10 text-slate-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">현재 참여 중인 리그가 없습니다</h3>
              <p className="text-slate-500 font-medium max-w-sm mx-auto">
                아직 리그에 참여하지 않으셨습니다. 아래에서 계좌를 선택하여 당신의 실력을 증명할 리그에 참여해 보세요.
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {LEAGUES.map((league) => (
            <div 
              key={league.id}
              className={cn(
                "bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8 space-y-6 relative overflow-hidden group",
                profile?.league === league.id && "border-orange-500/50 bg-orange-500/5"
              )}
            >
              <div className={cn("absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 blur-2xl", league.color)} />
              <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center", league.color)}>
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-black text-white uppercase tracking-tighter">{league.name}</h4>
                <p className="text-slate-500 text-xs leading-relaxed">{league.description}</p>
              </div>
              <div className="pt-4 border-t border-slate-800/50">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">참여 조건</p>
                <p className="text-sm font-bold text-slate-300">₩{league.minAssets.toLocaleString()} 이상</p>
              </div>
            </div>
          ))}
        </div>

        <section className="bg-slate-900 border border-slate-800 rounded-[3rem]">
          <div className="px-10 py-8 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-orange-500" />
              참여계좌 선택
            </h3>
            <span className="text-[10px] font-black bg-slate-800 text-slate-500 px-3 py-1.5 rounded-full uppercase tracking-widest">
              보유 계좌 {MOCK_ACCOUNTS.length}개
            </span>
          </div>
          
          <div className="p-10 space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">
                참여할 계좌 선택
              </label>
              
              {/* Custom Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={cn(
                    "w-full bg-slate-800/80 border-2 border-slate-700 text-white font-bold py-6 px-10 rounded-[2.5rem] flex items-center justify-between transition-all hover:bg-slate-800 hover:border-orange-500/30 shadow-xl",
                    isDropdownOpen && "border-orange-500 ring-8 ring-orange-500/5"
                  )}
                >
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                      selectedAccount ? "bg-orange-600 text-white" : "bg-slate-900 text-slate-600"
                    )}>
                      <Wallet className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">참여계좌</p>
                      <span className={cn("text-lg font-black tracking-tight", selectedAccount ? "text-white" : "text-slate-500")}>
                        {selectedAccount 
                          ? `${selectedAccount.bankName} - ${selectedAccount.accountNumber}` 
                          : "계좌를 선택해 주세요"}
                      </span>
                    </div>
                  </div>
                  <div className={cn(
                    "w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center transition-transform duration-300",
                    isDropdownOpen ? "-rotate-90" : "rotate-90"
                  )}>
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </div>
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      className="absolute z-[100] left-0 right-0 mt-4 bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
                    >
                      <div className="max-h-80 overflow-y-auto custom-scrollbar p-3">
                        {MOCK_ACCOUNTS.map((account) => (
                          <button
                            key={account.id}
                            type="button"
                            onClick={() => {
                              setSelectedAccountId(account.id);
                              setIsDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full px-8 py-6 flex items-center justify-between rounded-2xl transition-all text-left mb-2 last:mb-0",
                              selectedAccountId === account.id 
                                ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" 
                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                          >
                            <div className="flex items-center gap-6">
                              <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center",
                                selectedAccountId === account.id ? "bg-white/20" : "bg-slate-950"
                              )}>
                                <Wallet className="w-6 h-6" />
                              </div>
                              <div>
                                <p className={cn("text-sm font-black uppercase tracking-tight", selectedAccountId === account.id ? "text-white" : "text-white")}>{account.bankName}</p>
                                <p className={cn("text-xs font-bold", selectedAccountId === account.id ? "text-orange-100" : "text-slate-500")}>{account.accountNumber}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-black">₩{account.balance.toLocaleString()}</p>
                              <p className={cn("text-[10px] font-black uppercase tracking-widest", selectedAccountId === account.id ? "text-orange-200" : "text-orange-500")}>
                                {account.balance >= 100000000 ? 'Master League' : account.balance >= 10000000 ? 'Pro League' : account.balance >= 1 ? 'Rookie League' : '참여 불가'}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {selectedAccount && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-orange-600/5 border border-orange-600/20 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">선택된 계좌 잔액</p>
                      <p className="text-lg font-black text-white">
                        ₩{selectedAccount.balance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">예상 배정 리그</p>
                    <p className="text-sm font-black text-white">
                      {selectedAccount.balance >= 100000000 ? '마스터 리그' : selectedAccount.balance >= 10000000 ? '프로 리그' : selectedAccount.balance >= 1 ? '루키 리그' : '참여 불가'}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="pt-8">
              <button
                id="join-league-submit-button"
                disabled={!selectedAccountId || loading}
                onClick={handleJoin}
                className={cn(
                  "w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3",
                  selectedAccountId && !loading
                    ? "bg-orange-600 hover:bg-orange-500 text-white shadow-2xl shadow-orange-600/20"
                    : "bg-slate-800 text-slate-600 cursor-not-allowed"
                )}
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="w-6 h-6" />
                    리그 참여 완료!
                  </>
                ) : (
                  <>
                    리그 참여하기
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        <div className="bg-slate-900/30 border border-slate-800/50 rounded-[2rem] p-8 flex items-start gap-4">
          <ShieldCheck className="w-6 h-6 text-slate-500 shrink-0 mt-1" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400">리그 참여 안내</p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              리그는 선택한 계좌의 잔액을 기준으로 자동 배정됩니다. 참여 후에는 해당 계좌의 수익률이 랭킹에 반영됩니다. 
              참여계좌는 언제든지 변경할 수 있으며, 변경 시 현재 리그 등급이 재조정될 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
