import { UserProfile, PortfolioHolding, TradeLog, Post, Comment, BankAccount } from '../types';

const STORAGE_KEYS = {
  PROFILE: 'tuhon_profile',
  USERS: 'tuhon_users',
  POSTS: 'tuhon_posts',
  TRADES: 'tuhon_trades',
  PORTFOLIO: 'tuhon_portfolio'
};

// 초기 데이터 설정
const INITIAL_PROFILE: UserProfile = {
  uid: 'local-user',
  displayName: '투혼 투자자',
  photoURL: 'https://picsum.photos/seed/user/200',
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
  updatedAt: new Date().toISOString()
};

export const storage = {
  getProfile: (): UserProfile => {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(INITIAL_PROFILE));
      return INITIAL_PROFILE;
    }
    return JSON.parse(data);
  },

  updateProfile: (updates: Partial<UserProfile>) => {
    const current = storage.getProfile();
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
    
    // 전역 사용자 리스트에도 업데이트
    const users = storage.getUsers();
    const userIndex = users.findIndex(u => u.uid === updated.uid);
    if (userIndex > -1) {
      users[userIndex] = updated;
    } else {
      users.push(updated);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return updated;
  },

  getUsers: (): UserProfile[] => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [storage.getProfile()];
  },

  getPosts: (): Post[] => {
    const data = localStorage.getItem(STORAGE_KEYS.POSTS);
    return data ? JSON.parse(data) : [];
  },

  addPost: (content: string, author: UserProfile) => {
    const posts = storage.getPosts();
    const newPost: Post = {
      id: Math.random().toString(36).substr(2, 9),
      authorUid: author.uid,
      authorName: author.displayName,
      authorPhoto: author.photoURL,
      content,
      likes: 0,
      commentCount: 0,
      createdAt: new Date().toISOString()
    };
    posts.unshift(newPost);
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    return newPost;
  },

  getTrades: (): TradeLog[] => {
    const profile = storage.getProfile();
    const data = localStorage.getItem(`${STORAGE_KEYS.TRADES}_${profile.uid}`);
    return data ? JSON.parse(data) : [];
  },

  addTrade: (trade: Omit<TradeLog, 'id' | 'timestamp'>) => {
    const profile = storage.getProfile();
    const trades = storage.getTrades();
    const newTrade: TradeLog = {
      ...trade,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    trades.unshift(newTrade);
    localStorage.setItem(`${STORAGE_KEYS.TRADES}_${profile.uid}`, JSON.stringify(trades));
    return newTrade;
  },

  getPortfolio: (): PortfolioHolding[] => {
    const profile = storage.getProfile();
    const data = localStorage.getItem(`${STORAGE_KEYS.PORTFOLIO}_${profile.uid}`);
    return data ? JSON.parse(data) : [];
  },

  updatePortfolio: (portfolio: PortfolioHolding[]) => {
    const profile = storage.getProfile();
    localStorage.setItem(`${STORAGE_KEYS.PORTFOLIO}_${profile.uid}`, JSON.stringify(portfolio));
  },

  getAccounts: (): BankAccount[] => {
    // For now, return mock accounts as if they were in storage
    return [
      { id: 'ls-1', bankName: 'LS증권', accountNumber: '100-22-334455', balance: 125000000, currency: 'KRW', type: 'Investment' },
      { id: 'ls-2', bankName: 'LS증권', accountNumber: '100-22-998877', balance: 45000000, currency: 'KRW', type: 'Investment' },
      { id: 'ls-3', bankName: 'LS증권', accountNumber: '100-22-112233', balance: 15000000, currency: 'KRW', type: 'Investment' },
    ];
  }
};
