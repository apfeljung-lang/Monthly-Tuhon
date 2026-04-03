export type League = 'Rookie' | 'Pro' | 'Master';

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  totalAssets: number;
  monthlyReturn?: number;
  monthlyProfit?: number;
  monthlyReturnsHistory?: { month: string; return: number }[];
  mdd?: number;
  sharpeRatio?: number;
  tuhonScore?: number;
  totalReturn?: number;
  followers?: number;
  league?: League;
  leagueAccountId?: string;
  badges?: string[];
  role?: string;
  updatedAt?: any;
}

export interface PortfolioHolding {
  id?: string;
  symbol: string;
  name: string;
  weight: number;
  value: number;
  category?: string;
}

export interface TradeLog {
  id?: string;
  uid: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  price: number;
  amount: number;
  timestamp: any;
  note?: string;
}

export interface Post {
  id?: string;
  authorUid: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  likes?: number;
  commentCount?: number;
  createdAt: any;
}

export interface Comment {
  id?: string;
  authorUid: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  createdAt: any;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  balance: number;
  currency: string;
  type: 'Checking' | 'Savings' | 'Investment';
  isConnected?: boolean;
}
