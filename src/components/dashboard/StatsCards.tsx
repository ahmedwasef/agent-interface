'use client';

import { CheckCircle2, Clock, PauseCircle, Circle, TrendingUp } from 'lucide-react';
import { Task } from '@/lib/types';

interface StatsCardsProps {
  tasks: Task[];
}

export default function StatsCards({ tasks }: StatsCardsProps) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const onHold = tasks.filter((t) => t.status === 'on_hold').length;
  const notStarted = tasks.filter((t) => t.status === 'not_started').length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const cards = [
    {
      label: 'Total Tasks',
      value: total,
      sub: 'This week',
      icon: Circle,
      color: 'text-slate-300',
      bg: 'bg-slate-700/40',
      border: 'border-slate-700/50',
    },
    {
      label: 'Completed',
      value: completed,
      sub: `${rate}% completion rate`,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      label: 'In Progress',
      value: inProgress,
      sub: 'Active right now',
      icon: Clock,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      label: 'On Hold',
      value: onHold,
      sub: 'Awaiting action',
      icon: PauseCircle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    {
      label: 'Not Started',
      value: notStarted,
      sub: 'Pending start',
      icon: Circle,
      color: 'text-gray-400',
      bg: 'bg-gray-500/10',
      border: 'border-gray-500/20',
    },
    {
      label: 'Completion Rate',
      value: `${rate}%`,
      sub: `${completed} of ${total} done`,
      icon: TrendingUp,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map(({ label, value, sub, icon: Icon, color, bg, border }) => (
        <div
          key={label}
          className={`rounded-xl border ${border} ${bg} p-4 flex flex-col gap-3`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
            <Icon size={16} className={color} />
          </div>
          <div className="text-3xl font-bold text-white">{value}</div>
          <div className="text-xs text-slate-500">{sub}</div>
        </div>
      ))}
    </div>
  );
}
