'use client';

import { CheckCircle2, Clock, PauseCircle, Circle, TrendingUp } from 'lucide-react';
import { Task, TaskStatus } from '@/lib/types';

type FilterKey = TaskStatus | 'all' | 'rate';

interface StatsCardsProps {
  tasks: Task[];
  activeFilter?: FilterKey | null;
  onFilter?: (key: FilterKey) => void;
}

export default function StatsCards({ tasks, activeFilter, onFilter }: StatsCardsProps) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const onHold = tasks.filter((t) => t.status === 'on_hold').length;
  const notStarted = tasks.filter((t) => t.status === 'not_started').length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const cards: { label: string; value: string | number; sub: string; icon: React.ElementType; color: string; bg: string; border: string; activeBorder: string; filterKey: FilterKey }[] = [
    {
      label: 'Total Tasks',
      value: total,
      sub: 'This week',
      icon: Circle,
      color: 'text-slate-300',
      bg: 'bg-slate-700/40',
      border: 'border-slate-700/50',
      activeBorder: 'border-slate-300',
      filterKey: 'all',
    },
    {
      label: 'Completed',
      value: completed,
      sub: `${rate}% completion rate`,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      activeBorder: 'border-emerald-400',
      filterKey: 'completed',
    },
    {
      label: 'In Progress',
      value: inProgress,
      sub: 'Active right now',
      icon: Clock,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      activeBorder: 'border-blue-400',
      filterKey: 'in_progress',
    },
    {
      label: 'On Hold',
      value: onHold,
      sub: 'Awaiting action',
      icon: PauseCircle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      activeBorder: 'border-amber-400',
      filterKey: 'on_hold',
    },
    {
      label: 'Not Started',
      value: notStarted,
      sub: 'Pending start',
      icon: Circle,
      color: 'text-gray-400',
      bg: 'bg-gray-500/10',
      border: 'border-gray-500/20',
      activeBorder: 'border-gray-400',
      filterKey: 'not_started',
    },
    {
      label: 'Completion Rate',
      value: `${rate}%`,
      sub: `${completed} of ${total} done`,
      icon: TrendingUp,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      activeBorder: 'border-indigo-400',
      filterKey: 'rate',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map(({ label, value, sub, icon: Icon, color, bg, border, activeBorder, filterKey }) => {
        const isActive = activeFilter === filterKey;
        return (
          <button
            key={label}
            onClick={() => onFilter?.(isActive ? (null as unknown as FilterKey) : filterKey)}
            className={`rounded-xl border ${isActive ? activeBorder : border} ${bg} p-4 flex flex-col gap-3 text-left transition-all duration-150 ${
              onFilter ? 'hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20 cursor-pointer' : 'cursor-default'
            } ${isActive ? 'ring-1 ring-inset ring-white/10 shadow-lg' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
              <Icon size={16} className={color} />
            </div>
            <div className={`text-3xl font-bold ${isActive ? 'text-white' : 'text-white'}`}>{value}</div>
            <div className={`text-xs ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>{sub}</div>
            {onFilter && (
              <div className={`text-[10px] font-medium transition-opacity ${isActive ? 'opacity-100 text-indigo-400' : 'opacity-0'}`}>
                ▲ Showing filtered list
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
