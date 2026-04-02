import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function translateLeague(league: string | undefined): string {
  if (!league) return '미지정';
  const mapping: Record<string, string> = {
    'Rookie': '루키',
    'Pro': '프로',
    'Master': '마스터',
    'All': '전체'
  };
  return mapping[league] || league;
}
