'use client';

import { CheckCircle2, Clock, PauseCircle, Circle, TrendingUp } from 'lucide-react';
import { Task, TaskStatus } from '@/lib/types';
import { useT } from '@/lib/i18n';

type FilterKey = TaskStatus | 'all' | 'rate';

interface StatsCardsProps {
  tasks: Task[];
  activeFilter?: FilterKey | null;
  onFilter?: (key: FilterKey) => void;
}

export default function StatsCards({ tasks, activeFilter, onFilter }: StatsCardsProps) {
  const t = useT();

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const onHold = tasks.filter((t) => t.status === 'on_hold').length;
  const notStarted = tasks.filter((t) => t.status === 'not_started').length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const cards: {
    label: string; value: string | number; sub: string;
    icon: React.ElementType; color: string; bg: string;
    border: string; activeBorder: string; filterKey: FilterKey;
  }[] = [
    {
      label: t('kpi.total'), value: total, sub: t('kpi.thisWeek'),
      icon: Circle, color: 'text-slate-300',
      bg: 'bg-slate-700/40', border: 'border-slate-700/50', activeBorder: 'border-slate-300',
      filterKey: 'all',
    },
    {
      label: t('kpi.completed'), value: completed, sub: `${rate}${t('kpi.rateDesc')}`,
      icon: CheckCircle2, color: 'text-emerald-400',
      bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', activeBorder: 'border-emerald-400',
      filterKey: 'completed',
    },
    {
      label: t('kpi.inProgress'), value: inProgress, sub: t('kpi.activeNow'),
      icon: Clock, color: 'text-blue-400',
      bg: 'bg-blue-500/10', border: 'border-blue-500/20', activeBorder: 'border-blue-400',
      filterKey: 'in_progress',
    },
    {
      label: t('kpi.onHold'), value: onHold, sub: t('kpi.awaiting'),
      icon: PauseCircle, color: 'text-amber-400',
      bg: 'bg-amber-500/10', border: 'border-amber-500/20', activeBorder: 'border-amber-400',
      filterKey: 'on_hold',
    },
    {
      label: t('kpi.notStarted'), value: notStarted, sub: t('kpi.pending'),
      icon: Circle, color: 'text-gray-400',
      bg: 'bg-gray-500/10', border: 'border-gray-500/20', activeBorder: 'border-gray-400',
      filterKey: 'not_started',
    },
    {
      label: t('kpi.rate'), value: `${rate}%`,
      sub: `${completed} ${t('kpi.ofDone')} ${total} ${t('kpi.done')}`,
      icon: TrendingUp, color: 'text-indigo-400',
      bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', activeBorder: 'border-indigo-400',
      filterKey: 'rate',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {cards.map(({ label, value, sub, icon: Icon, color, bg, border, activeBorder, filterKey }) => {
        const isActive = activeFilter === filterKey;
        return (
          <button
            key={label}
            onClick={() => onFilter?.(isActive ? (null as unknown as FilterKey) : filterKey)}
            className={`rounded-xl border ${isActive ? activeBorder : border} ${bg} p-4 flex flex-col gap-2 sm:gap-3 text-left transition-all duration-150 ${
              onFilter ? 'hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20 cursor-pointer' : 'cursor-default'
            } ${isActive ? 'ring-1 ring-inset ring-white/10 shadow-lg' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wide leading-tight">{label}</span>
              <Icon size={15} className={`${color} flex-shrink-0`} />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">{value}</div>
            <div className={`text-[10px] sm:text-xs ${isActive ? 'text-slate-300' : 'text-slate-500'} leading-tight`}>{sub}</div>
            {onFilter && (
              <div className={`text-[9px] font-medium transition-opacity ${isActive ? 'opacity-100 text-indigo-400' : 'opacity-0'}`}>
                {t('kpi.filtered')}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
