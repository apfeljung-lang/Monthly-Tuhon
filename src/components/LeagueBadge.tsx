import React from 'react';
import { Zap, Target, Trophy, Award } from 'lucide-react';
import { cn, translateLeague } from '../lib/utils';
import { League } from '../types';

interface LeagueBadgeProps {
  league: League | string | undefined;
  showLabel?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LeagueBadge: React.FC<LeagueBadgeProps> = ({ 
  league, 
  showLabel = true, 
  className,
  size = 'md'
}) => {
  if (!league || league === 'All') return null;

  const getLeagueConfig = (l: string) => {
    switch (l) {
      case 'Rookie':
        return {
          icon: Zap,
          color: 'text-slate-400',
          bgColor: 'bg-slate-400/10',
          borderColor: 'border-slate-400/20',
          label: 'ROOKIE'
        };
      case 'Pro':
        return {
          icon: Target,
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/20',
          label: 'PRO'
        };
      case 'Master':
        return {
          icon: Trophy,
          color: 'text-purple-500',
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/20',
          label: 'MASTER'
        };
      default:
        return {
          icon: Award,
          color: 'text-slate-500',
          bgColor: 'bg-slate-500/10',
          borderColor: 'border-slate-500/20',
          label: l.toUpperCase()
        };
    }
  };

  const config = getLeagueConfig(league as string);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 gap-1 text-[8px]',
    md: 'px-2 py-1 gap-1.5 text-[10px]',
    lg: 'px-3 py-1.5 gap-2 text-xs'
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className={cn(
      "inline-flex items-center font-black rounded-lg border uppercase tracking-widest whitespace-nowrap",
      config.bgColor,
      config.borderColor,
      config.color,
      sizeClasses[size],
      className
    )}>
      <Icon className={cn(iconSizes[size], "fill-current opacity-80")} />
      {showLabel && <span>{translateLeague(league as string)}</span>}
    </div>
  );
};
